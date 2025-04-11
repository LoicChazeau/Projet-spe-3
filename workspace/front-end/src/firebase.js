import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  // TODO: Remplacer par vos propres informations de configuration Firebase
  apiKey: "AIzaSyAYMRcvYiWSRiGthKPzhvm1TaHapDiWG4k",
  authDomain: "optic-50575.firebaseapp.com",
  projectId: "optic-50575",
  storageBucket: "optic-50575.firebasestorage.app",
  messagingSenderId: "298989477272",
  appId: "1:298989477272:web:ce43d7fadc3dd666ae5fed"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app; 