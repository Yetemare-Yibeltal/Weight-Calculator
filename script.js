// -------------------- conversion rates (base: 1 kg) --------------------
const rates = {
  kg: 1,
  g: 1000,
  lbs: 2.20462,
  oz: 35.274,
  stones: 0.157473,
};

// DOM references
const weightInput = document.getElementById("weight");
const fromUnit = document.getElementById("from-unit");
const toUnit = document.getElementById("to-unit");
const convertBtn = document.getElementById("convert-btn");
const resetBtn = document.getElementById("reset-btn");
const resultDisplay = document.getElementById("result");
const historyList = document.getElementById("history-list");
const clearHistoryBtn = document.getElementById("clear-history-btn");

// -------------------- API helpers --------------------
async function fetchConversions() {
  const res = await fetch("/api/conversions");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

async function saveConversion(data) {
  const res = await fetch("/api/conversions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to save");
  return res.json();
}

async function clearAllConversions() {
  const res = await fetch("/api/conversions", { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to clear");
  return res.json();
}

// -------------------- History rendering --------------------
function renderHistory(history) {
  historyList.innerHTML = "";
  if (history.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-history";
    empty.textContent = "No conversions yet";
    historyList.appendChild(empty);
    return;
  }
  history.forEach((entry) => {
    const li = document.createElement("li");
    const timestamp = new Date(entry.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    li.innerHTML = `<span>${entry.weight} ${entry.fromUnit} → ${entry.result} ${entry.toUnit}</span><span>${timestamp}</span>`;
    historyList.appendChild(li);
  });
}

async function loadHistory() {
  try {
    const data = await fetchConversions();
    renderHistory(data);
  } catch (err) {
    console.error("Error loading history:", err);
  }
}

// -------------------- Conversion logic (with animation) --------------------
async function convert() {
  const rawWeight = weightInput.value.trim();
  if (rawWeight === "") {
    resultDisplay.textContent = "Please enter a weight";
    resultDisplay.className = "result show";
    return;
  }
  const weight = parseFloat(rawWeight);
  if (isNaN(weight) || weight < 0) {
    resultDisplay.textContent = "Enter a valid positive number";
    resultDisplay.className = "result show";
    return;
  }

  const from = fromUnit.value;
  const to = toUnit.value;

  if (from === to) {
    resultDisplay.textContent = `${weight} ${from} (same unit)`;
    resultDisplay.className = "result show";
    return;
  }

  // convert to kg first, then to target
  const inKg = weight / rates[from];
  const result = inKg * rates[to];

  const formattedResult = Number.isInteger(result) ? result : result.toFixed(4);
  const display = `${weight} ${from} = ${formattedResult} ${to}`;
  resultDisplay.textContent = display;
  resultDisplay.className = `result show ${to}`; // dynamic unit colour

  // --- Save to backend ---
  try {
    await saveConversion({
      weight: weight,
      fromUnit: from,
      toUnit: to,
      result: parseFloat(formattedResult),
    });
    await loadHistory(); // refresh the list
  } catch (err) {
    console.error("Error saving conversion:", err);
    alert("Could not save conversion. Please try again.");
  }
}

// -------------------- Reset form --------------------
function resetForm() {
  weightInput.value = "";
  fromUnit.value = "kg";
  toUnit.value = "lbs";
  resultDisplay.textContent = "";
  resultDisplay.className = "result"; // remove show and unit class
  weightInput.focus();
}

// -------------------- Clear history --------------------
async function clearHistory() {
  if (confirm("Clear all conversion history?")) {
    try {
      await clearAllConversions();
      await loadHistory();
    } catch (err) {
      console.error("Error clearing history:", err);
      alert("Could not clear history.");
    }
  }
}

// -------------------- Event listeners --------------------
convertBtn.addEventListener("click", convert);
resetBtn.addEventListener("click", resetForm);
clearHistoryBtn.addEventListener("click", clearHistory);

weightInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") convert();
});

// Initial load
loadHistory();
