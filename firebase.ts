import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAqPfXkJq9BsyGOCptrAZhkYHcMXCUPxLw",
  authDomain: "dxy-suplementos.firebaseapp.com",
  projectId: "dxy-suplementos",
  storageBucket: "dxy-suplementos.firebasestorage.app",
  messagingSenderId: "224542095745",
  appId: "1:224542095745:web:c05e90afcb4733d90f5080",
  measurementId: "G-G8PES1BRPZ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;
