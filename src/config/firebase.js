import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAqTl13h9ofqOapaAcEiU6mWxchaXyOz54",
  authDomain: "weunityx.firebaseapp.com",
  projectId: "weunityx",
  storageBucket: "weunityx.firebasestorage.app",
  messagingSenderId: "934609280596",
  appId: "1:934609280596:web:a6ab503aa23864395297c1",
  measurementId: "G-TB4RQSC4DP",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication with React Native persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

export default app;
