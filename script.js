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

// -------------------- history management --------------------
function loadHistory() {
  const stored = localStorage.getItem("weightHistory");
  return stored ? JSON.parse(stored) : [];
}

function saveHistory(history) {
  localStorage.setItem("weightHistory", JSON.stringify(history));
}

function renderHistory() {
  const history = loadHistory();
  historyList.innerHTML = "";
  if (history.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-history";
    empty.textContent = "No conversions yet";
    historyList.appendChild(empty);
    return;
  }
  // show latest first
  history
    .slice()
    .reverse()
    .forEach((entry) => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${entry.fromVal} ${entry.fromUnit} → ${entry.toVal} ${entry.toUnit}</span><span>${entry.timestamp}</span>`;
      historyList.appendChild(li);
    });
}

function addHistoryEntry(fromVal, fromUnit, toVal, toUnit) {
  const history = loadHistory();
  const timestamp = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  history.push({ fromVal, fromUnit, toVal, toUnit, timestamp });
  // keep last 20 entries to avoid bloating
  if (history.length > 20) history.shift();
  saveHistory(history);
  renderHistory();
}

function clearHistory() {
  if (confirm("Clear all conversion history?")) {
    saveHistory([]);
    renderHistory();
  }
}

// -------------------- conversion logic --------------------
function convert() {
  const rawWeight = weightInput.value.trim();
  if (rawWeight === "") {
    resultDisplay.textContent = "Please enter a weight";
    return;
  }
  const weight = parseFloat(rawWeight);
  if (isNaN(weight) || weight < 0) {
    resultDisplay.textContent = "Enter a valid positive number";
    return;
  }

  const from = fromUnit.value;
  const to = toUnit.value;

  if (from === to) {
    resultDisplay.textContent = `${weight} ${from} (same unit)`;
    return;
  }

  // convert to kg first, then to target
  const inKg = weight / rates[from];
  const result = inKg * rates[to];

  // format result: if integer, show as integer, else 4 decimals
  const formattedResult = Number.isInteger(result) ? result : result.toFixed(4);
  const display = `${weight} ${from} = ${formattedResult} ${to}`;
  resultDisplay.textContent = display;

  // save to history
  addHistoryEntry(weight, from, formattedResult, to);
}

// -------------------- reset form --------------------
function resetForm() {
  weightInput.value = "";
  fromUnit.value = "kg";
  toUnit.value = "lbs";
  resultDisplay.textContent = "";
  weightInput.focus();
}

// -------------------- event listeners --------------------
convertBtn.addEventListener("click", convert);
resetBtn.addEventListener("click", resetForm);
clearHistoryBtn.addEventListener("click", clearHistory);

// allow Enter key on weight input
weightInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") convert();
});

// initial render
renderHistory();
