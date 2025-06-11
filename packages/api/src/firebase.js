import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA4as7taMc-gModOCwSqgzrHLBacBrn8MM",
  authDomain: "budget-9d6f7.firebaseapp.com",
  projectId: "budget-9d6f7",
  storageBucket: "budget-9d6f7.firebasestorage.app",
  messagingSenderId: "330754043571",
  appId: "1:330754043571:web:01a6ac5a7a2be578510ac6",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
