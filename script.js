async function convert() {
  const rawWeight = weightInput.value.trim();
  if (rawWeight === "") {
    resultDisplay.textContent = "Please enter a weight";
    resultDisplay.className = "result show"; // still show
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
  resultDisplay.className = `result show ${to}`; // add unit class for colour

  // --- Save to backend ---
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
