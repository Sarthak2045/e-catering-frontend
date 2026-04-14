import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// REPLACE THIS OBJECT WITH YOUR ACTUAL KEYS FROM FIREBASE CONSOLE
const firebaseConfig = {
  apiKey: "AIzaSyBr1LkFbDXnd7eLC0BAiQnpVsz4BhKvfto",
  authDomain: "railway-catering.firebaseapp.com",
  projectId: "railway-catering",
  storageBucket: "railway-catering.firebasestorage.app",
  messagingSenderId: "621838511911",
  appId: "1:621838511911:web:6a8f8de1b177e7b46e4302"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Auth and Database to use in the app
export const auth = getAuth(app);
export const db = getFirestore(app);