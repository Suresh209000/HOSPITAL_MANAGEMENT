import { db, auth } from "./firebase-config.js";
import {
  collection,
  doc,
  updateDoc,
  query,
  where,
  Timestamp,
  onSnapshot,
  addDoc,
  getDocs,
  getDoc,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ========== Navbar Pages ==========

function loadHome() {
  document.getElementById("dynamicContent").innerHTML = ""; // Remove popup content
}

function loadAbout() {
  const name = localStorage.getItem("userName") || "N/A";
  const email = localStorage.getItem("userEmail") || "N/A";
  const role = localStorage.getItem("userRole") || "N/A";

  document.getElementById("dynamicContent").innerHTML = `
    <div class="modal" style="z-index: 1500;">
      <div class="modal-content about-help-container">
        <button class="back-btn" onclick="loadHome()">⬅ Back</button>
        <h3>About You</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Role:</strong> ${role}</p>
      </div>
    </div>
  `;
}

function loadHelp() {
  document.getElementById("dynamicContent").innerHTML = `
    <div class="modal" style="z-index: 1500;">
      <div class="modal-content about-help-container">
        <button class="back-btn" onclick="loadHome()">⬅ Back</button>
        <h3>Help Section</h3>
        <p>If you face any issues, please contact your system administrator or mail <strong>support@carepoint.com</strong></p>
      </div>
    </div>
  `;
}

function confirmLogout() {
  document.getElementById("logout-confirm").classList.remove("hidden");
}

function closeLogoutConfirm() {
  document.getElementById("logout-confirm").classList.add("hidden");
}


// ✅ Expose to window
window.loadHome = loadHome;
window.loadAbout = loadAbout;
window.loadHelp = loadHelp;
window.confirmLogout = confirmLogout;
window.closeLogoutConfirm = closeLogoutConfirm; // ✅ This was missing



// ========== Real-time Today's Patients ==========

function loadTodaysPatients() {
  const listDiv = document.getElementById("patientList");
  listDiv.innerHTML = "";

  const today = new Date();
  const dateString = today.toLocaleDateString("en-CA"); // Ensures YYYY-MM-DD

  const q = query(
    collection(db, "patients"),
    where("dateString", "==", dateString)
  );

  onSnapshot(q, (snapshot) => {
    listDiv.innerHTML = "";

    if (snapshot.empty) {
      listDiv.innerHTML = `<p>No patients for today.</p>`;
      return;
    }

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const docId = docSnap.id;

      const card = document.createElement("div");
      card.className = "patient-card";
      card.style.background = data.status === "waiting" ? "#d32f2f" : "#388e3c";

      card.innerHTML = `
        <h4>${data.name}</h4>
        <p><strong>Date:</strong> ${data.date?.toDate().toLocaleDateString("en-IN")} | <strong>Time:</strong> ${data.time}</p>
        <div class="details" style="display: none; margin-top: 10px;">
          <p><strong>Age:</strong> ${data.age}</p>
          <p><strong>Gender:</strong> ${data.gender}</p>
          <p><strong>Contact:</strong> ${data.contact}</p>
          <p><strong>Status:</strong> ${data.status}</p>
          <div style="margin-top: 10px; display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="checkup-btn"
              onclick="loadPrescriptionForm('${docId}', '${data.name}', '${data.contact}', '${data.age}', '${data.gender}')">Checkup</button>
            <button class="checkup-btn" style="background-color: black" onclick="viewHistory('${data.contact}')">View History</button>
          </div>
        </div>
      `;

      card.addEventListener("click", () => {
        const detailDiv = card.querySelector(".details");
        detailDiv.style.display = detailDiv.style.display === "none" ? "block" : "none";
      });

      listDiv.appendChild(card);
    });
  });
}

// ========== Load Prescription Form ==========

window.loadPrescriptionForm = function (id, name, contact, age, gender) {
  window.currentPatientId = id;

  document.getElementById("pName").innerText = name;
  document.getElementById("pContact").innerText = contact;
  document.getElementById("pAge").innerText = age;
  document.getElementById("pGender").innerText = gender;

  auth.onAuthStateChanged(async (user) => {
    if (user) {
      const uid = user.uid;
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const doctorData = docSnap.data();
        const doctorName = doctorData.name || "Unnamed Doctor";
        const doctorContact = doctorData.mobile || "N/A";

        document.getElementById("doctorName").innerText = "Dr. " + doctorName;
        document.getElementById("doctorContact").innerText = doctorContact;
      }
    }
  });

  document.getElementById("dynamicContent").innerHTML = "";
};

// ========== Save Prescription ==========

window.savePrescription = async function () {
  const id = window.currentPatientId;
  const name = document.getElementById("pName").innerText;
  const contact = document.getElementById("pContact").innerText;

  const symptoms = document.getElementById("symptomsField").innerText.trim();
  const diagnosis = document.getElementById("diagnosisField").innerText.trim();
  const treatment = document.getElementById("treatmentField").innerText.trim();

  if (!symptoms || !diagnosis || !treatment) {
    alert("❌ Please fill all fields.");
    return;
  }

  await updateDoc(doc(db, "patients", id), {
    prescription: { symptoms, diagnosis, treatment },
    status: "done"
  });

  await addDoc(collection(db, "prescriptions"), {
    name,
    contact,
    date: Timestamp.now(),
    symptoms,
    diagnosis,
    treatment
  });

  alert("✅ Prescription saved and history updated.");

  document.getElementById("symptomsField").innerText = "";
  document.getElementById("diagnosisField").innerText = "";
  document.getElementById("treatmentField").innerText = "";
};

// ========== View History ==========

window.viewHistory = async function (contact) {
  document.getElementById("dynamicContent").innerHTML = `<h3>Prescription History</h3><p>Loading...</p>`;

  const q = query(
    collection(db, "prescriptions"),
    where("contact", "==", contact),
    orderBy("date", "desc")
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    document.getElementById("dynamicContent").innerHTML = `<h3>Prescription History</h3><p>No history available.</p>`;
    return;
  }

  let html = `<h3>Prescription History</h3>`;
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    html += `
      <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #ccc; border-radius: 8px;">
        <p><strong>Date:</strong> ${data.date.toDate().toLocaleString()}</p>
        <p><strong>Symptoms:</strong> ${data.symptoms}</p>
        <p><strong>Diagnosis:</strong> ${data.diagnosis}</p>
        <p><strong>Treatment:</strong> ${data.treatment}</p>
      </div>`;
  });

  document.getElementById("dynamicContent").innerHTML = html;
};

// ========== Initial Load ==========

window.addEventListener("DOMContentLoaded", () => {
  const role = localStorage.getItem("userRole");
  if (role !== "doctor") {
    alert("❌ Access denied. Only doctors allowed.");
    window.location.href = "index.html";
    return;
  }

  auth.onAuthStateChanged((user) => {
    if (user) {
      const doctorName = user.displayName || "Unnamed Doctor";
      const doctorContact = user.phoneNumber || "N/A";

      document.getElementById("doctorName").innerText = "Dr. " + doctorName;
      document.getElementById("doctorContact").innerText = doctorContact;
    }
  });

  loadHome();
  loadTodaysPatients();
});


await updateDoc(doc(db, "patients", id), {
  prescription: { symptoms, diagnosis, treatment },
  status: "done",
  billGenerated: false, // 🔥 Important
});







