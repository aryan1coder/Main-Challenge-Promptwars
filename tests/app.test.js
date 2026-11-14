import { describe, it, expect } from "vitest";
import {
  auth,
  db,
  googleProvider,
  saveLogToFirestore,
  loginWithGoogle,
  signInWithEmail,
  createEmailAccount,
  sendPasswordReset,
  signOutUser
} from "../src/lib/googleServices.js";

describe("Firebase Services", () => {
  it("exports the configured Firebase auth and persistence service functions", () => {
    expect(auth).toBeDefined();
    expect(db).toBeDefined();
    expect(googleProvider).toBeDefined();
    expect(typeof saveLogToFirestore).toBe('function');
    expect(typeof loginWithGoogle).toBe('function');
    expect(typeof signInWithEmail).toBe('function');
    expect(typeof createEmailAccount).toBe('function');
    expect(typeof sendPasswordReset).toBe('function');
    expect(typeof signOutUser).toBe('function');
  });

  it("fails explicitly when Firestore is unavailable", async () => {
    if (!db) {
      await expect(saveLogToFirestore("logs", {})).rejects.toThrow("Firestore is not configured");
    }
  });
});
