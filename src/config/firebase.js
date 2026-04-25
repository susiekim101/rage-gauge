import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: "road-rage-494417.firebaseapp.com",
  projectId: "road-rage-494417",
  storageBucket: "road-rage-494417.firebasestorage.app",
  messagingSenderId: "526482349896",
  appId: "1:526482349896:web:1a1c2b1ab27c291dd79d7d",
  measurementId: "G-70L3MBGWH1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
