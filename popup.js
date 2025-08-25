const slider = document.getElementById('volume');
const valueSpan = document.getElementById('value');

slider.addEventListener('input', async () => {
  const multiplier = parseFloat(slider.value);
  valueSpan.textContent = multiplier.toFixed(1) + 'x';
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: setVolume,
      args: [multiplier]
    });
  }
});

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
