function dayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Serialize changes so two fast scroll messages cannot overwrite each other's count.
let updates = Promise.resolve();

chrome.runtime.onMessage.addListener((message, _sender, reply) => {
  updates = updates.then(async () => {
    const data = await chrome.storage.local.get({ days: {}, enabled: true, automatic: true });
    const today = dayKey();

    if (message.type === "ADD") {
      data.days[today] = (data.days[today] || 0) + 1;
      await chrome.storage.local.set({ days: data.days });
      return { count: data.days[today] };
    }
    if (message.type === "GET") {
      return {
        count: data.days[today] || 0,
        days: data.days,
        enabled: data.enabled,
        automatic: data.automatic,
      };
    }
    if (message.type === "TOGGLE") {
      await chrome.storage.local.set({ enabled: Boolean(message.enabled) });
      return { enabled: Boolean(message.enabled) };
    }
    if (message.type === "TOGGLE_AUTO") {
      await chrome.storage.local.set({ automatic: Boolean(message.automatic) });
      return { automatic: Boolean(message.automatic) };
    }
    return {};
  }).then(reply).catch(() => reply({ error: "Reelo could not update local storage." }));
  return true;
});
