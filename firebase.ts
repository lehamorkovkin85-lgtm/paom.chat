import { initializeApp } from "firebase/app";
import * as firebaseAuth from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAWV097BE56m2YVNi2D494dyXK41j9V5bE",
  authDomain: "messanger-b0b91.firebaseapp.com",
  projectId: "messanger-b0b91",
  storageBucket: "messanger-b0b91.firebasestorage.app",
  messagingSenderId: "895029700922",
  appId: "1:895029700922:web:184790c791e66978aa4803",
  measurementId: "G-8YMP1TY2HW"
};

const app = initializeApp(firebaseConfig);

// Use type assertion to bypass potential type definition mismatches
export const auth = (firebaseAuth as any).getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);