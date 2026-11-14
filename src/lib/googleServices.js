import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

const geminiApiKey = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;
export const geminiModel = geminiApiKey && genAI ? genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) : null;

export function ensureGeminiConfigured() {
  if (!geminiModel) {
    throw new Error("Google Gemini API key is missing. Add VITE_GEMINI_API_KEY to your environment.");
  }
}

export function sanitizeInput(text) {
  if (typeof text !== "string") return "";
  return text.trim().replace(/[<>]/g, "").slice(0, 2000);
}

export async function generateAIResponse(rawPrompt) {
  const cleanPrompt = sanitizeInput(rawPrompt);
  if (!cleanPrompt) throw new Error("Prompt cannot be empty");
  ensureGeminiConfigured();
  const result = await geminiModel.generateContent(cleanPrompt);
  return result.response.text();
}

export async function saveLogToFirestore(collectionName, payload) {
  if (!db || !collectionName) {
    throw new Error("Firestore is not configured for this environment.");
  }
  return await addDoc(collection(db, collectionName), {
    ...payload,
    createdAt: serverTimestamp(),
  });
}

export async function loginWithGoogle() {
  if (!auth) {
    throw new Error("Google authentication is not configured in this environment.");
  }
  return await signInWithPopup(auth, googleProvider);
}
