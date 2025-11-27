// ===== ABOUT MODAL FUNCTIONALITY =====
const aboutBtn = document.getElementById('about-btn');
const modal = document.getElementById('about-modal');
const closeModal = document.getElementById('close-modal');

// Open modal on About click
aboutBtn.onclick = () => {
  modal.style.display = 'block';
};

// Close modal on × click
closeModal.onclick = () => {
  modal.style.display = 'none';
};

// Close modal when clicking outside the modal box
window.onclick = (e) => {
  if (e.target === modal) {
    modal.style.display = 'none';
  }
};

// ===== FIREBASE SIGNUP FUNCTIONALITY =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// ✅ Replace the below config with your Firebase project details
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Show/Hide Doctor Speciality Field
const roleDropdown = document.getElementById("role");
if (roleDropdown) {
  roleDropdown.addEventListener("change", function () {
    const role = this.value;
    const specialityField = document.getElementById("speciality");
    if (specialityField) {
      specialityField.style.display = role === "doctor" ? "block" : "none";
    }
  });
}

// Signup Form Handling
const signupForm = document.getElementById("signup-form");

if (signupForm) {
  signupForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;
    const speciality = document.getElementById("speciality")?.value.trim() || "";
    const messageBox = document.getElementById("message");

    if (!role) {
      messageBox.textContent = "⚠️ Please select a role";
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      const userData = {
        name,
        email,
        role
      };

      if (role === "doctor") {
        userData.speciality = speciality;
      }

      await setDoc(doc(db, "users", uid), userData);

      messageBox.textContent = "✅ Signup successful!";
      messageBox.style.color = "green";
    } catch (error) {
      messageBox.textContent = "❌ " + error.message;
      messageBox.style.color = "red";
    }
  });
}


