
import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const urlParams = new URLSearchParams(window.location.search);
const role = urlParams.get("role");

const formTitle = document.getElementById("form-title");
const roleInfo = document.getElementById("role-info");
const doctorExtra = document.getElementById("doctor-extra");

const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

togglePassword.addEventListener("click", () => {
  const isHidden = passwordInput.type === "password";
  passwordInput.type = isHidden ? "text" : "password";
  togglePassword.classList.remove("fa-eye", "fa-eye-slash");
  togglePassword.classList.add(isHidden ? "fa-eye" : "fa-eye-slash");
});

window.addEventListener("DOMContentLoaded", () => {
  passwordInput.type = "password";
  togglePassword.classList.remove("fa-eye");
  togglePassword.classList.add("fa-eye-slash");

  if (role === "doctor") {
    formTitle.textContent = "Doctor Sign Up";
    roleInfo.textContent = "Create your Doctor account to manage patient records.";
    doctorExtra.style.display = "block";
  } else if (role === "receptionist") {
    formTitle.textContent = "Receptionist Sign Up";
    roleInfo.textContent = "Sign up to register patients and assign tokens.";
    doctorExtra.style.display = "none";
  } else {
    formTitle.textContent = "Sign Up";
    roleInfo.textContent = "Please choose a valid role from the homepage.";
  }
});

const signupForm = document.getElementById("signup-form");
const message = document.getElementById("message");

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const mobile = document.getElementById("mobile").value.trim();
  const password = document.getElementById("password").value.trim();
  const specialization = document.getElementById("specialization").value.trim();

  if (!name || !email || !mobile || !password) {
    message.textContent = "❌ Please fill all required fields.";
    message.style.color = "red";
    return;
  }

  if (!/^\d{10}$/.test(mobile)) {
    message.textContent = "❌ Mobile number must be 10 digits.";
    message.style.color = "red";
    return;
  }

  if (role === "doctor" && specialization === "") {
    message.textContent = "❌ Please enter your specialization.";
    message.style.color = "red";
    return;
  }

  try {
    // 1️⃣ Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2️⃣ Optionally update display name
    await updateProfile(user, { displayName: name });

    // 3️⃣ Save details to Firestore
    await setDoc(doc(db, "users", user.uid), {
      name,
      email,
      mobile,
      role,
      specialization: role === "doctor" ? specialization : null,
      createdAt: new Date()
    });

    message.textContent = "✅ Account created successfully as " + role + "!";
    message.style.color = "lightgreen";
    signupForm.reset();
    doctorExtra.style.display = "none";

  } catch (error) {
    message.textContent = "❌ Error: " + error.message;
    message.style.color = "red";
  }
});


