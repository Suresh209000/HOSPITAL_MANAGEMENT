// firebase-config.js

// CDN imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Tumhara naya Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC-ve7Z8oAj-vyk-_QFY-jI66tcWRv1nPg",
  authDomain: "hospitalmanagement-1a703.firebaseapp.com",
  projectId: "hospitalmanagement-1a703",
  storageBucket: "hospitalmanagement-1a703.firebasestorage.app",
  messagingSenderId: "472397622334",
  appId: "1:472397622334:web:a61ce519f8751519c6f56f"
  // measurementId optional hai, chaho to add kar sakte ho
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export instances
export const auth = getAuth(app);
export const db = getFirestore(app);
