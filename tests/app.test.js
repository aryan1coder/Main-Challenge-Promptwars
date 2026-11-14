import { describe, it, expect } from "vitest";
import {
  sanitizeInput,
  auth,
  db,
  googleProvider,
  geminiModel,
  generateAIResponse,
  saveLogToFirestore,
  loginWithGoogle
} from "../src/lib/googleServices.js";

describe("Security & Input Sanitization", () => {
  it("strips HTML angle brackets to prevent XSS", () => {
    expect(sanitizeInput("  <script>alert(1)</script>  ")).toBe("scriptalert(1)/script");
  });

  it("handles non-string safely", () => {
    expect(sanitizeInput(null)).toBe("");
  });

  it("caps prompts at 2000 chars", () => {
    expect(sanitizeInput("a".repeat(2500)).length).toBe(2000);
  });
});

describe("Google Services & SDK Rigor Verification", () => {
  it("verifies Firebase and Gemini SDK initializations are exported without removal", () => {
    expect(auth).toBeDefined();
    expect(db).toBeDefined();
    expect(googleProvider).toBeDefined();
    expect(geminiModel).toBeDefined();
    expect(typeof generateAIResponse).toBe('function');
    expect(typeof saveLogToFirestore).toBe('function');
    expect(typeof loginWithGoogle).toBe('function');
  });

  it("ensures generateAIResponse validates non-empty prompts before API dispatch", async () => {
    await expect(generateAIResponse("")).rejects.toThrow("Prompt cannot be empty");
    await expect(generateAIResponse("   ")).rejects.toThrow("Prompt cannot be empty");
  });
});
