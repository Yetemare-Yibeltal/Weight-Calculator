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

// Stats DOM
const totalConvEl = document.getElementById("total-conversions");
const mostUsedEl = document.getElementById("most-used-unit");
const avgWeightEl = document.getElementById("avg-weight");

// Chart instance
let unitChart = null;

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
  if (!history || history.length === 0) {
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

// -------------------- Stats computation --------------------
function updateStats(history) {
  if (!history || history.length === 0) {
    totalConvEl.textContent = "0";
    mostUsedEl.textContent = "—";
    avgWeightEl.textContent = "0";
    return;
  }

  const total = history.length;
  totalConvEl.textContent = total;

  // Most used "from" unit
  const unitCount = {};
  history.forEach((item) => {
    unitCount[item.fromUnit] = (unitCount[item.fromUnit] || 0) + 1;
  });
  let maxCount = 0;
  let mostUsed = "—";
  for (const [unit, count] of Object.entries(unitCount)) {
    if (count > maxCount) {
      maxCount = count;
      mostUsed = unit.toUpperCase();
    }
  }
  mostUsedEl.textContent = mostUsed;

  // Average weight (convert all to kg first)
  let totalKg = 0;
  history.forEach((item) => {
    const kg = item.weight / rates[item.fromUnit];
    totalKg += kg;
  });
  const avg = totalKg / total;
  avgWeightEl.textContent = avg.toFixed(2);
}

// -------------------- Chart rendering --------------------
function renderChart(history) {
  const ctx = document.getElementById("unitChart");
  if (!ctx) {
    console.warn("Chart canvas not found");
    return;
  }

  // Count conversions per "from" unit
  const unitCount = {};
  if (history && history.length > 0) {
    history.forEach((item) => {
      unitCount[item.fromUnit] = (unitCount[item.fromUnit] || 0) + 1;
    });
  }

  const labels = Object.keys(unitCount).map((u) => u.toUpperCase());
  const data = Object.values(unitCount);
  const colors = ["#f43f5e", "#facc15", "#3b82f6", "#8b5cf6", "#22d3ee"];

  // Destroy existing chart if any
  if (unitChart) {
    unitChart.destroy();
    unitChart = null;
  }

  // If no data, show a message or just clear
  if (data.length === 0) {
    // Optionally draw a no-data message on canvas? We'll just leave it blank.
    return;
  }

  unitChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Conversions",
          data: data,
          backgroundColor: colors.slice(0, data.length),
          borderRadius: 6,
          barPercentage: 0.6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: "rgba(255,255,255,0.5)" },
          grid: { color: "rgba(255,255,255,0.05)" },
        },
        x: {
          ticks: { color: "rgba(255,255,255,0.5)" },
          grid: { display: false },
        },
      },
    },
  });
}

// -------------------- Load all data --------------------
async function loadHistory() {
  try {
    const data = await fetchConversions();
    renderHistory(data);
    updateStats(data);
    renderChart(data);
  } catch (err) {
    console.error("Error loading history:", err);
  }
}

// -------------------- Conversion logic --------------------
async function convert() {
  console.log("🔄 Convert button clicked!");

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

  const inKg = weight / rates[from];
  const result = inKg * rates[to];

  const formattedResult = Number.isInteger(result) ? result : result.toFixed(4);
  const display = `${weight} ${from} = ${formattedResult} ${to}`;
  resultDisplay.textContent = display;
  resultDisplay.className = `result show ${to}`;

  try {
    await saveConversion({
      weight: weight,
      fromUnit: from,
      toUnit: to,
      result: parseFloat(formattedResult),
    });
    await loadHistory();
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
  resultDisplay.className = "result";
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
document.addEventListener("DOMContentLoaded", function () {
  console.log("✅ DOM ready – attaching events");

  // Converter events
  convertBtn.addEventListener("click", convert);
  resetBtn.addEventListener("click", resetForm);
  clearHistoryBtn.addEventListener("click", clearHistory);

  weightInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") convert();
  });

  // Preset buttons
  document.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const weight = this.dataset.weight;
      const from = this.dataset.from;
      const to = this.dataset.to;
      weightInput.value = weight;
      fromUnit.value = from;
      toUnit.value = to;
      convert(); // trigger conversion
    });
  });

  // Load initial data
  loadHistory();
});
