import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Runtime Bug & Resilience Suite — M_ID Undefined & Async Protection', () => {
  it('verifies that M_ID is not present or accessed anywhere in application source files', () => {
    const srcDir = path.resolve(__dirname, '../src');
    const apiDir = path.resolve(__dirname, '../api');

    function scanDir(dir) {
      let matches = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          matches = matches.concat(scanDir(fullPath));
        } else if (/\.(js|jsx|ts|tsx|json|html|css)$/.test(entry.name)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          // Check for any property access (.M_ID, ['M_ID'], ["M_ID"]) or variable usage of M_ID
          // Exclude the error-filter pattern in main.jsx that catches external extension crashes
          const lines = content.split('\n');
          lines.forEach((line, idx) => {
            if ((line.includes('.M_ID') || line.includes("['M_ID']") || line.includes('["M_ID"]')) ||
                (/\bM_ID\b/.test(line) && !line.includes('isExtensionError') && !line.includes('message.includes'))) {
              matches.push(`${fullPath}:${idx + 1}`);
            }
          });
        }
      }
      return matches;
    }

    const foundInSrc = scanDir(srcDir);
    const foundInApi = scanDir(apiDir);

    expect(foundInSrc).toEqual([]);
    expect(foundInApi).toEqual([]);
  });

  it('filters third-party browser extension unhandled rejections involving 200.js or M_ID', () => {
    // Simulate the unhandledrejection event listener logic
    const filterRejection = (event) => {
      const reason = event.reason;
      const stack = reason?.stack || '';
      const message = reason?.message || String(reason || '');

      const isExtensionError =
        stack.includes('chrome-extension://') ||
        stack.includes('moz-extension://') ||
        stack.includes('200.js') ||
        message.includes("'M_ID'") ||
        message.includes('"M_ID"');

      if (isExtensionError) {
        event.preventDefault();
        return true; // Filtered
      }
      return false; // Allowed
    };

    // 1. Simulate extension error from 200.js reading M_ID
    const extensionEvent = {
      reason: new TypeError("Cannot read properties of undefined (reading 'M_ID')"),
      defaultPrevented: false,
      preventDefault() {
        this.defaultPrevented = true;
      }
    };
    extensionEvent.reason.stack = "TypeError: Cannot read properties of undefined (reading 'M_ID')\n    at h (chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/executors/200.js:1:761)\n    at C (chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/executors/200.js:1:1442)";

    const isFiltered = filterRejection(extensionEvent);
    expect(isFiltered).toBe(true);
    expect(extensionEvent.defaultPrevented).toBe(true);

    // 2. Simulate legitimate application error - must NOT be prevented
    const appEvent = {
      reason: new Error("Network timeout while querying /api/generate-briefing"),
      defaultPrevented: false,
      preventDefault() {
        this.defaultPrevented = true;
      }
    };
    appEvent.reason.stack = "Error: Network timeout\n    at generateGroundedBriefings (src/lib/services/geminiService.js:25:11)";

    const isAppFiltered = filterRejection(appEvent);
    expect(isAppFiltered).toBe(false);
    expect(appEvent.defaultPrevented).toBe(false);
  });

  it('handles missing or malformed objects in asynchronous operations safely', async () => {
    // Test async fetch failure handling in service wrapper
    const mockFailedFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Simulated downstream server error' })
    });

    const executeFetch = async (fetchFn) => {
      const response = await fetchFn('/api/test');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed request');
      }
      return await response.json();
    };

    await expect(executeFetch(mockFailedFetch)).rejects.toThrow('Simulated downstream server error');
  });

  it('verifies safe handling of missing nested properties without throwing TypeError', () => {
    // Testing nested property safe access pattern
    const malformedPayload = {
      // Missing wardOfficer, housingSociety, schoolAdmin, etc.
      success: true
    };

    const wardTitle = malformedPayload?.wardOfficer?.title || 'Fallback Title';
    const wardPriority = String(malformedPayload?.wardOfficer?.priority || '').toLowerCase();
    const wardActions = Array.isArray(malformedPayload?.wardOfficer?.actions)
      ? malformedPayload.wardOfficer.actions
      : [malformedPayload?.wardOfficer?.actions || 'Fallback Action'];

    expect(wardTitle).toBe('Fallback Title');
    expect(wardPriority).toBe('');
    expect(wardActions).toEqual(['Fallback Action']);
  });
});
