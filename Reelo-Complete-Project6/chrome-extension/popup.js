const byId = (id) => document.getElementById(id);

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function renderHistory(days) {
  const history = byId("history");
  history.replaceChildren();
  for (let offset = 6; offset >= 0; offset--) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    const row = document.createElement("div");
    const day = document.createElement("span");
    const count = document.createElement("strong");
    day.textContent = date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    count.textContent = String(days[dateKey(date)] || 0);
    row.append(day, count);
    history.appendChild(row);
  }
}

chrome.runtime.sendMessage({ type: "GET" }, (result) => {
  if (chrome.runtime.lastError || !result) return;
  byId("count").textContent = String(result.count);
  byId("enabled").checked = result.enabled;
  byId("automatic").checked = result.automatic;
  byId("mood").textContent = result.count < 10
    ? "I'm warming up! ✨"
    : result.count < 30 ? "Yum! Your evening tastes great. 😋" : "Burp. Your homework says hi. 🤭";
  renderHistory(result.days);
});

byId("enabled").addEventListener("change", (event) => {
  chrome.runtime.sendMessage({ type: "TOGGLE", enabled: event.target.checked });
});

byId("automatic").addEventListener("change", (event) => {
  chrome.runtime.sendMessage({ type: "TOGGLE_AUTO", automatic: event.target.checked });
});
