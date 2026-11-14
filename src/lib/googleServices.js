import { getApps, initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { addDoc, collection, getFirestore, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const hasFirebaseConfig = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);
const app = hasFirebaseConfig
  ? getApps()[0] || initializeApp(firebaseConfig)
  : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const googleProvider = new GoogleAuthProvider();

function requireAuth() {
  if (!auth) {
    throw new Error('Firebase Authentication is not configured. Use the clearly labeled demo or configure Firebase.');
  }
  return auth;
}

export async function signInWithEmail(email, password, rememberMe) {
  const firebaseAuth = requireAuth();
  await setPersistence(
    firebaseAuth,
    rememberMe ? browserLocalPersistence : browserSessionPersistence
  );
  return signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
}

export async function createEmailAccount(email, password, rememberMe) {
  const firebaseAuth = requireAuth();
  await setPersistence(
    firebaseAuth,
    rememberMe ? browserLocalPersistence : browserSessionPersistence
  );
  return createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
}

export async function sendPasswordReset(email) {
  return sendPasswordResetEmail(requireAuth(), email.trim());
}

export async function loginWithGoogle(rememberMe = true) {
  const firebaseAuth = requireAuth();
  await setPersistence(
    firebaseAuth,
    rememberMe ? browserLocalPersistence : browserSessionPersistence
  );
  return signInWithPopup(firebaseAuth, googleProvider);
}

export async function signOutUser() {
  if (auth) await signOut(auth);
}

export async function getAuthenticatedIdToken() {
  return auth?.currentUser ? auth.currentUser.getIdToken() : null;
}

export async function saveLogToFirestore(collectionName, payload) {
  if (!db || !collectionName) {
    throw new Error('Firestore is not configured for this environment.');
  }
  if (!auth?.currentUser) {
    throw new Error('An authenticated Firebase user is required to save a cloud log.');
  }
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(collectionName)) {
    throw new Error('Invalid Firestore subcollection name.');
  }
  return addDoc(collection(db, 'users', auth.currentUser.uid, collectionName), {
    ...payload,
    createdAt: serverTimestamp()
  });
}
