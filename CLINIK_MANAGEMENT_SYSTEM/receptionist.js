import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  query,
  where,
  updateDoc,
  doc,
  Timestamp,
  getDocs,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const form = document.getElementById("patient-form");
const mainContent = document.getElementById("content");

function formatTime(dateObj) {
  let hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const age = parseInt(document.getElementById("age").value);
  const gender = document.getElementById("gender").value;
  const contact = document.getElementById("contact").value.trim();
  const symptoms = document.getElementById("symptoms").value.trim();
  const appointmentDate = document.getElementById("date").value;
  const appointmentTime = document.getElementById("time").value;

  if (!name || !age || !gender || !contact || !symptoms || !appointmentDate || !appointmentTime) {
    alert("❌ Please fill all fields.");
    return;
  }

  try {
    const selectedDate = new Date(appointmentDate + "T00:00:00");
    selectedDate.setHours(0, 0, 0, 0);

    const dateString = selectedDate.toLocaleDateString("en-CA");

    const q = query(collection(db, "patients"), where("dateString", "==", dateString));
    const snapshot = await getDocs(q);

    let maxToken = 0;
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.token && data.token > maxToken) {
        maxToken = data.token;
      }
    });

    const token = maxToken + 1;

    const [hourStr, minuteStr] = appointmentTime.split(":");
    const hour = parseInt(hourStr);
    const minute = parseInt(minuteStr);
    const dateObj = new Date();
    dateObj.setHours(hour, minute);
    const timeFormatted = formatTime(dateObj);

    await addDoc(collection(db, "patients"), {
      name,
      age,
      gender,
      contact,
      symptoms,
      token,
      date: Timestamp.fromDate(selectedDate),
      dateString,
      time: timeFormatted,
      status: "waiting",
      billGenerated: false
    });

    alert(`✅ Patient registered! Token number: ${token}`);
    form.reset();
  } catch (err) {
    console.error("Error adding patient:", err);
    alert("❌ Failed to register patient. Try again.");
  }
});

const todayPatientsContainer = document.createElement("div");
todayPatientsContainer.className = "card";
mainContent.appendChild(todayPatientsContainer);

let currentlyOpenToken = null;
let currentBillingPatient = null;

function loadTodayPatients() {
  todayPatientsContainer.innerHTML = `<h3 style="text-align:center;">Today's Patients</h3>`;

  try {
    const today = new Date();
    const dateString = today.toLocaleDateString("en-CA");

    const q = query(collection(db, "patients"), where("dateString", "==", dateString));

    onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        todayPatientsContainer.innerHTML += `<p>No patients registered for today.</p>`;
        return;
      }

      const list = document.createElement("ul");
      list.style.listStyle = "none";
      list.style.padding = "0";

      const detailDiv = document.createElement("div");
      detailDiv.style.marginTop = "15px";
      detailDiv.style.padding = "10px";
      detailDiv.style.background = "rgba(255, 255, 255, 0.1)";
      detailDiv.style.borderRadius = "10px";
      detailDiv.style.color = "#fff";
      detailDiv.style.position = "relative";

      list.innerHTML = "";
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const docId = docSnap.id;

        const listItem = document.createElement("li");
        listItem.style.marginBottom = "10px";

        const container = document.createElement("div");
        container.style.display = "flex";
        container.style.alignItems = "center";
        container.style.gap = "10px";

        const tokenBtn = document.createElement("button");
        tokenBtn.textContent = `Token ${data.token} — ${data.name || "Unknown"} — ${data.time}`;
        tokenBtn.className = "token-btn";
        tokenBtn.style.background = data.status === "waiting" ? "#d32f2f" : "#388e3c";

        tokenBtn.addEventListener("click", () => {
          if (currentlyOpenToken === docId) {
            detailDiv.innerHTML = "";
            currentlyOpenToken = null;
            return;
          }

          currentlyOpenToken = docId;

          const formattedDate = data.dateString || data.date?.toDate().toLocaleDateString("en-IN");

          detailDiv.innerHTML = `
            <h2>Patient Details for Token ${data.token}</h2>
            <p><strong>Name:</strong> ${data.name || "Unknown"}</p>
            <p><strong>Age:</strong> ${data.age}</p>
            <p><strong>Gender:</strong> ${data.gender}</p>
            <p><strong>Contact:</strong> ${data.contact}</p>
            <p><strong>Symptoms:</strong> ${data.symptoms}</p>
            <p><strong>Appointment Date:</strong> ${formattedDate}</p>
            <p><strong>Appointment Time:</strong> ${data.time}</p>
            <p><strong>Status:</strong> ${data.status}</p>
          `;

          if (data.status === "waiting") {
            const markDoneBtn = document.createElement("button");
            markDoneBtn.id = "mark-done";
            markDoneBtn.textContent = "Mark as Done";
            markDoneBtn.addEventListener("click", async () => {
              const confirmMark = confirm("Mark this patient as done?");
              if (confirmMark) {
                await updateDoc(doc(db, "patients", docId), { status: "done" });
              }
            });
            detailDiv.appendChild(markDoneBtn);
          }
        });

        container.appendChild(tokenBtn);

        if (data.status === "done" && data.billGenerated !== true) {
          const billBtn = document.createElement("button");
          billBtn.textContent = "Generate Bill";
          billBtn.style.padding = "6px 10px";
          billBtn.style.background = "#ff9800";
          billBtn.style.color = "white";
          billBtn.style.border = "none";
          billBtn.style.borderRadius = "6px";
          billBtn.style.cursor = "pointer";

          billBtn.addEventListener("click", () => {
            currentBillingPatient = { ...data, id: docId };
            openBillingForm();
          });

          container.appendChild(billBtn);
        } else if (data.status === "done" && data.billGenerated === true) {
          const tick = document.createElement("span");
          tick.textContent = "✓ Bill Generated";
          tick.style.color = "lightgreen";
          tick.style.fontWeight = "bold";
          container.appendChild(tick);
        }

        listItem.appendChild(container);
        list.appendChild(listItem);
      });

      document.addEventListener("click", function (event) {
        if (
          currentlyOpenToken &&
          !detailDiv.contains(event.target) &&
          !event.target.classList.contains("token-btn")
        ) {
          detailDiv.innerHTML = "";
          currentlyOpenToken = null;
        }
      });

      todayPatientsContainer.innerHTML = `<h3 style="text-align:center;">Today's Patients</h3>`;
      todayPatientsContainer.appendChild(list);
      todayPatientsContainer.appendChild(detailDiv);
    });
  } catch (err) {
    console.error("Error fetching today's patients:", err);
    todayPatientsContainer.innerHTML += `<p>Failed to load today's patients. Try again later.</p>`;
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const role = localStorage.getItem("userRole");
  if (role !== "receptionist") {
    alert("❌ Action denied. Only receptionists allowed.");
    window.location.href = "index.html";
  } else {
    loadTodayPatients();
  }
});

function openBillingForm() {
  document.getElementById("billPatientName").innerText = currentBillingPatient.name;
  document.getElementById("consultationFee").value = "";
  document.getElementById("medicineCharges").value = "";
  document.getElementById("testCharges").value = "";
  document.getElementById("totalAmount").value = "";
  document.getElementById("billingFormContainer").style.display = "block";
  document.getElementById("overlay").style.display = "block";
}

function closeBillingForm() {
  document.getElementById("billingFormContainer").style.display = "none";
  document.getElementById("overlay").style.display = "none";
}

window.closeBillingForm = closeBillingForm;

document.getElementById("consultationFee").addEventListener("input", calculateTotal);
document.getElementById("medicineCharges").addEventListener("input", calculateTotal);
document.getElementById("testCharges").addEventListener("input", calculateTotal);

function calculateTotal() {
  const c = Number(document.getElementById("consultationFee").value) || 0;
  const m = Number(document.getElementById("medicineCharges").value) || 0;
  const t = Number(document.getElementById("testCharges").value) || 0;
  document.getElementById("totalAmount").value = c + m + t;
}

document.getElementById("saveBillBtn").addEventListener("click", async () => {
  if (!currentBillingPatient || !currentBillingPatient.id) return alert("No patient selected or missing ID.");

  const c = Number(document.getElementById("consultationFee").value) || 0;
  const m = Number(document.getElementById("medicineCharges").value) || 0;
  const t = Number(document.getElementById("testCharges").value) || 0;
  const total = c + m + t;

  if (total === 0) return alert("Please enter valid charges!");

  try {
    const patientRef = doc(db, "patients", currentBillingPatient.id);

    await updateDoc(patientRef, {
      billing: {
        consultation: c,
        medicine: m,
        tests: t,
        total
      },
      billGenerated: true
    });

    closeBillingForm();
    alert("✅ Bill Saved Successfully");
  } catch (e) {
    console.error("Billing error:", e);
    alert("❌ Failed to save bill.");
  }
});





function setupSummaryListener() {
  const today = new Date();
  const todayStr = today.toLocaleDateString("en-CA");

  const q = query(collection(db, "patients"), where("dateString", "==", todayStr));

  onSnapshot(q, (snapshot) => {
    const checkedEl = document.getElementById("totalChecked");
    const earningsEl = document.getElementById("totalEarnings");
    const remainingEl = document.getElementById("remainingPatients");

    if (!checkedEl || !earningsEl || !remainingEl) {
      console.warn("⛔ Summary elements not found in DOM.");
      return;
    }

    const totalPatients = snapshot.size;

    let totalChecked = 0;
    let totalEarnings = 0;
    let paidPatients = 0;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();

      if (data.status === "done") {
        totalChecked++;

        const bill = data.billing;
        if (bill && typeof bill.total === "number") {
          totalEarnings += bill.total;
          paidPatients++;
        }
      }
    });

    const remaining = totalPatients - totalChecked;

    checkedEl.textContent = totalChecked;
    earningsEl.innerHTML = `₹${totalEarnings} <span class="patients-count">(${paidPatients} patient${paidPatients !== 1 ? "s" : ""})</span>`;
    remainingEl.textContent = remaining;
  });
}

// ✅ DOM loaded
window.addEventListener("DOMContentLoaded", () => {
  setupSummaryListener();
});


window.printBillDetails = function () {
  const patientName = document.getElementById("billPatientName").innerText || "N/A";
  const consultation = document.getElementById("consultationFee").value || "0";
  const medicine = document.getElementById("medicineCharges").value || "0";
  const tests = document.getElementById("testCharges").value || "0";
  const total = document.getElementById("totalAmount").value || "0";

  const printWindow = window.open("", "", "width=800,height=600");
  printWindow.document.write(`
    <html>
      <head>
        <title>Print Bill</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 30px;
            color: #000;
          }
          h2 {
            text-align: center;
            font-size: 24px;
            margin-bottom: 30px;
          }
          p {
            font-size: 18px;
            margin: 10px 0;
          }
          span {
            font-weight: bold;
            border-bottom: 1px solid #000;
            padding: 2px 8px;
          }
        </style>
      </head>
      <body>
        <h2>Patient Bill</h2>
        <p>Patient Name: <span>${patientName}</span></p>
        <p>Consultation Fee: ₹<span>${consultation}</span></p>
        <p>Medicine Charges: ₹<span>${medicine}</span></p>
        <p>Test Charges: ₹<span>${tests}</span></p>
        <p>Total Amount: ₹<span>${total}</span></p>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
};




