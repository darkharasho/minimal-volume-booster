const slider = document.getElementById('volume');
const valueSpan = document.getElementById('value');
const bars = Array.from(document.querySelectorAll('.bar'));

init();

slider.addEventListener('input', async () => {
  const value = parseInt(slider.value, 10);
  const multiplier = value / 100;
  valueSpan.textContent = value + '%';
  updateBars(value);
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && !isRestricted(tab.url)) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: setVolume,
        args: [multiplier]
      });
      await chrome.storage.local.set({ [tab.id]: value });
    } catch (e) {
      console.error(e);
    }
  }
});

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && !isRestricted(tab.url)) {
    const stored = await chrome.storage.local.get(tab.id.toString());
    const value = stored[tab.id] ?? 100;
    slider.value = value;
    valueSpan.textContent = value + '%';
    updateBars(value);
    const multiplier = value / 100;
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: setVolume,
        args: [multiplier]
      });
    } catch (e) {
      console.error(e);
    }
  } else {
    slider.disabled = true;
    valueSpan.textContent = 'N/A';
  }
}

function updateBars(val) {
  const segment = 150;
  bars.forEach((bar, i) => {
    const start = i * segment;
    const end = start + segment;
    let height = 0;
    if (val >= end) {
      height = 100;
    } else if (val > start) {
      height = ((val - start) / segment) * 100;
    }
    bar.style.height = `${height}%`;
  });
}

function isRestricted(url) {
  return url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('about:');
}

function setVolume(multiplier) {
  document.querySelectorAll('video,audio').forEach(el => {
    if (!el.__mvbCtx) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const source = ctx.createMediaElementSource(el);
      const gain = ctx.createGain();
      source.connect(gain);
      gain.connect(ctx.destination);
      el.__mvbCtx = { ctx, gain };
    }
    el.__mvbCtx.gain.gain.value = multiplier;
  });
}
