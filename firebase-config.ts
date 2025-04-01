import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth } from "firebase/auth";
import {getFirestore} from "firebase/firestore"
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyBHLvHB7J4ect6_zc9v7sf82k2wuOZnbt4",
  authDomain: "cubeme-33ce5.firebaseapp.com",
  projectId: "cubeme-33ce5",
  storageBucket: "cubeme-33ce5.firebasestorage.app",
  messagingSenderId: "952885641093",
  appId: "1:952885641093:web:7847096137a588b3320eec",
  measurementId: "G-2YTTLV0PLZ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const functions = getFunctions(app);