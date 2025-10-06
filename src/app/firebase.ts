import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBeKl0UsGETPBp33PyCowD8DESP1gu3SX0",
  authDomain: "gestion-ph-5bb9e.firebaseapp.com",
  projectId: "gestion-ph-5bb9e",
  storageBucket: "gestion-ph-5bb9e.firebasestorage.app",
  messagingSenderId: "861505484292",
  appId: "1:861505484292:web:b83ba966217b75273a6751",
  measurementId: "G-ZJDEYG1789"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

console.log("Firebase initialisé:", app);
console.log("Firestore initialisé:", db);
console.log("Storage initialisé:", storage);