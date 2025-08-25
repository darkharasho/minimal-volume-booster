const slider = document.getElementById('volume');
const valueSpan = document.getElementById('value');
const barsContainer = document.getElementById('bars');
const BAR_COUNT = 40;
for (let i = 0; i < BAR_COUNT; i++) {
  const bar = document.createElement('div');
  bar.className = 'bar';
  barsContainer.appendChild(bar);
}
const bars = Array.from(barsContainer.children);

init();

slider.addEventListener('input', async () => {
  const value = sanitize(slider.value, 0);
  const multiplier = value / 100;
  valueSpan.textContent = `${value}%`;
  updateBars(value);
  updateThumb(value);
  const tab = await getActiveTab();
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
  const tab = await getActiveTab();
  if (tab && !isRestricted(tab.url)) {
    const stored = await chrome.storage.local.get(tab.id.toString());
    const value = sanitize(stored[tab.id], 100);
    slider.value = value;
    valueSpan.textContent = `${value}%`;
    updateBars(value);
    updateThumb(value);
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
  const max = parseInt(slider.max, 10);
  const step = max / bars.length;
  const active = val === 0 ? 0 : Math.min(bars.length, Math.floor(val / step) + 1);
  const min = 5;
  const exponent = 1.3; // slightly steeper slope
  bars.forEach((bar, i) => {
    if (i < active) {
      const ratio = i / (bars.length - 1);
      const height = min + Math.pow(ratio, exponent) * (100 - min);
      bar.style.height = `${height}%`;
    } else {
      bar.style.height = '0';
    }
  });
}

function updateThumb(val) {
  const max = parseInt(slider.max, 10);
  const ratio = val / max;
  let color;
  if (ratio < 0.25) color = '#aee1c9';
  else if (ratio < 0.5) color = '#f5e8b1';
  else if (ratio < 0.75) color = '#f6c98f';
  else color = '#ff8a80';
  slider.style.setProperty('--thumb-color', color);
}

function isRestricted(url = '') {
  return (
    !url ||
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('about:')
  );
}

async function getActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  } catch (e) {
    console.error(e);
    return null;
  }
}

function setVolume(multiplier) {
  if (!Number.isFinite(multiplier)) return;
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

function sanitize(val, fallback) {
  const num = Number(val);
  return Number.isFinite(num) ? num : fallback;
}

