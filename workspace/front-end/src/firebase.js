import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';

const firebaseConfig = {
  // TODO: Remplacer par vos propres informations de configuration Firebase
  apiKey: "AIzaSyAYMRcvYiWSRiGthKPzhvm1TaHapDiWG4k",
  authDomain: "optic-50575.firebaseapp.com",
  projectId: "optic-50575",
  storageBucket: "optic-50575.appspot.com",
  messagingSenderId: "298989477272",
  appId: "1:298989477272:web:ce43d7fadc3dd666ae5fed"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Set persistence to LOCAL
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Erreur lors de la configuration de la persistance:", error);
  });

export { auth };
export default app; 