import { auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 👁️ Password toggle
const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

togglePassword.addEventListener("click", () => {
  const isHidden = passwordInput.type === "password";
  passwordInput.type = isHidden ? "text" : "password";
  togglePassword.classList.remove("fa-eye", "fa-eye-slash");
  togglePassword.classList.add(isHidden ? "fa-eye" : "fa-eye-slash");
});

// Get role from URL
const urlParams = new URLSearchParams(window.location.search);
const selectedRole = urlParams.get("role"); // 'doctor' or 'receptionist'

if (!selectedRole) {
  alert("Role not specified in URL. Please access login with proper role.");
}

// Handle Email/Password Login
const loginForm = document.getElementById("login-form");
const message = document.getElementById("message");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  message.textContent = "";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    message.textContent = "❌ Please enter both email and password.";
    message.style.color = "red";
    return;
  }

  if (!selectedRole) {
    message.textContent = "❌ Role not specified. Cannot login.";
    message.style.color = "red";
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      message.textContent = "❌ User data not found. Please contact support.";
      message.style.color = "red";
      await signOut(auth);
      return;
    }

    const userData = userDocSnap.data();

    if (userData.role !== selectedRole) {
      message.textContent = `❌ Role mismatch. You are registered as "${userData.role}", not "${selectedRole}".`;
      message.style.color = "red";
      await signOut(auth);
      return;
    }

    // ✅ Store user info in localStorage
    localStorage.setItem("userName", userData.name);
    localStorage.setItem("userEmail", user.email);
    localStorage.setItem("userRole", userData.role);

    message.textContent = "✅ Logged in successfully! Redirecting...";
    message.style.color = "lightgreen";

    setTimeout(() => {
      if (selectedRole === "doctor") {
        window.location.href = "doctor-dashboard.html";
      } else if (selectedRole === "receptionist") {
        window.location.href = "receptionist-dashboard.html";
      } else {
        window.location.href = "dashboard.html";
      }
    }, 1500);
  } catch (error) {
    console.error("Login error:", error);
    message.textContent = "❌ Invalid credentials, please check your email and password.";
    message.style.color = "red";
  }
});

// Handle Google Sign-In
const googleBtn = document.getElementById("googleSignInBtn");
const provider = new GoogleAuthProvider();

googleBtn.addEventListener("click", async () => {
  if (!selectedRole) {
    message.textContent = "❌ Role not specified in URL. Cannot login.";
    message.style.color = "red";
    return;
  }

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      message.textContent = "❌ User data not found. Please contact support.";
      message.style.color = "red";
      await signOut(auth);
      return;
    }

    const userData = userDocSnap.data();

    if (userData.role !== selectedRole) {
      message.textContent = `❌ Role mismatch. You are registered as "${userData.role}", not "${selectedRole}".`;
      message.style.color = "red";
      await signOut(auth);
      return;
    }

    // ✅ Store user info in localStorage
    localStorage.setItem("userName", userData.name);
    localStorage.setItem("userEmail", user.email);
    localStorage.setItem("userRole", userData.role);

    message.textContent = "✅ Google sign-in successful! Redirecting...";
    message.style.color = "lightgreen";

    setTimeout(() => {
      if (selectedRole === "doctor") {
        window.location.href = "doctor-dashboard.html";
      } else if (selectedRole === "receptionist") {
        window.location.href = "receptionist-dashboard.html";
      } else {
        window.location.href = "dashboard.html";
      }
    }, 1500);
  } catch (error) {
    console.error("Google sign-in error:", error);
    message.textContent = "❌ Google sign-in failed: Please try again.";
    message.style.color = "red";
  }
});


