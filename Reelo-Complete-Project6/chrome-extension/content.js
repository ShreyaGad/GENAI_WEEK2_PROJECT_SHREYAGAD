(() => {
  if (window.__reelo) return;
  window.__reelo = true;

  const isShortFeed = () => {
    if (location.hostname === "www.instagram.com" || location.hostname === "instagram.com") {
      return /^\/reels?(?:\/|$)/.test(location.pathname);
    }
    return (location.hostname === "www.youtube.com" || location.hostname === "youtube.com")
      && location.pathname.startsWith("/shorts");
  };

  const bubble = document.createElement("button");
  bubble.id = "reelo";
  bubble.type = "button";
  bubble.innerHTML = '<span aria-hidden="true">👾</span><small>0</small>';
  bubble.title = "Reelo — tap to count a reel; drag to move";
  bubble.setAttribute("aria-label", "Reelo reel counter");
  document.documentElement.appendChild(bubble);

  const badge = bubble.querySelector("small");
  let lastScroll = 0;
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;
  let enabled = true;
  let automatic = true;

  function refresh() {
    chrome.runtime.sendMessage({ type: "GET" }, (result) => {
      if (chrome.runtime.lastError || !result) return;
      enabled = result.enabled;
      automatic = result.automatic;
      badge.textContent = String(result.count);
      bubble.style.display = isShortFeed() && enabled ? "flex" : "none";
    });
  }

  function addCount() {
    if (!enabled) return;
    chrome.runtime.sendMessage({ type: "ADD" }, (result) => {
      if (!chrome.runtime.lastError && result && !result.error) badge.textContent = String(result.count);
    });
  }

  bubble.addEventListener("click", () => {
    if (!dragging) addCount();
  });

  bubble.addEventListener("pointerdown", (event) => {
    dragging = false;
    startX = event.clientX;
    startY = event.clientY;
    const rect = bubble.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;
    bubble.setPointerCapture(event.pointerId);
  });

  bubble.addEventListener("pointermove", (event) => {
    if (!(event.buttons & 1)) return;
    if (Math.abs(event.clientX - startX) > 5 || Math.abs(event.clientY - startY) > 5) dragging = true;
    if (!dragging) return;
    bubble.style.left = `${Math.max(0, Math.min(innerWidth - 74, startLeft + event.clientX - startX))}px`;
    bubble.style.top = `${Math.max(0, Math.min(innerHeight - 74, startTop + event.clientY - startY))}px`;
    bubble.style.right = "auto";
  });

  bubble.addEventListener("pointerup", () => setTimeout(() => { dragging = false; }, 100));

  function onScrollInput() {
    const now = Date.now();
    if (!enabled || !automatic || !isShortFeed() || now - lastScroll < 1100) return;
    lastScroll = now;
    addCount();
  }

  window.addEventListener("wheel", (event) => { if (event.deltaY > 0) onScrollInput(); }, { passive: true });
  window.addEventListener("keydown", (event) => {
    if (["ArrowDown", "PageDown", " "].includes(event.key)) onScrollInput();
  });

  let previousUrl = location.href;
  setInterval(() => {
    if (previousUrl !== location.href) {
      previousUrl = location.href;
      refresh();
    }
  }, 1000);

  chrome.storage.onChanged.addListener(refresh);
  refresh();
})();
