/**
 * Civic Air Quality Briefing Studio - Google Gemini Intelligence Service
 * Secure Architecture: All AI synthesis routes through the serverless
 * endpoint (/api/generate-briefing) where GEMINI_API_KEY remains server-side.
 */

export async function generateGroundedBriefings(analytics, datasetMetadata = {}) {
  const response = await fetch('/api/generate-briefing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analytics, datasetMetadata })
  });

  if (!response.ok) {
    let errorMsg = 'Failed to generate briefing via /api/generate-briefing';
    try {
      const errData = await response.json();
      if (errData && errData.error) {
        errorMsg = errData.error;
      }
    } catch {
      // response body was not JSON
      if (response.status === 404) {
        errorMsg = 'API route /api/generate-briefing not found. When deploying on Vercel, ensure GEMINI_API_KEY is configured in project settings.';
      }
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  return data;
}
