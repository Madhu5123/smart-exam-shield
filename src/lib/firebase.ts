
// Firebase configuration for the Examination Portal
// Note: In a real application, these values would be stored in environment variables

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDCLwjLBJPl6R1Z_drxuueNrYFmpH_RUUg",
  authDomain: "examportal-d4923.firebaseapp.com",
  databaseURL: "https://examportal-d4923-default-rtdb.firebaseio.com/",
  projectId: "examportal-d4923",
  storageBucket: "examportal-d4923.firebasestorage.app",
  messagingSenderId: "322929484275",
  appId: "1:322929484275:web:5e6a4a3cdf332bacfcb286"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);

// Initialize Firebase Storage and get a reference to the service
export const storage = getStorage(app);

export default app;
