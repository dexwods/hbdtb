const els = {
  gift: document.getElementById("gift"),
  cakeWrap: document.getElementById("cakeWrap"),
  cake: document.getElementById("cake"),
  candles: document.getElementById("candles"),
  candleCount: document.getElementById("candleCount"),
  micBtn: document.getElementById("micBtn"),
  resetBtn: document.getElementById("resetBtn"),
  hint: document.getElementById("hint"),
  confetti: document.getElementById("confetti"),
};

let isGiftOpen = false;
let micState = {
  enabled: false,
  audioContext: null,
  analyser: null,
  dataArray: null,
  rafId: null,
  stream: null,
  smoothed: 0,
  lastBlowAt: 0,
};

function setHint(text) {
  els.hint.textContent = text;
}

function getCandleCount() {
  return Number.parseInt(els.candleCount.textContent || "0", 10) || 0;
}

function setCandleCount(n) {
  els.candleCount.textContent = String(Math.max(0, n));
}

function addCandleAt(xPct) {
  const candle = document.createElement("div");
  candle.className = "candle";
  candle.style.left = `${xPct}%`;
  candle.style.top = "-2px";
  candle.innerHTML = '<div class="flame"></div>';
  els.candles.appendChild(candle);
  setCandleCount(getCandleCount() + 1);
}

function extinguishAllCandles() {
  const candles = els.candles.querySelectorAll(".candle");
  if (!candles.length) return;

  candles.forEach((c) => c.classList.add("extinguished"));
  setHint("Wish granted. Happy birthday!");
  burstConfetti();
}

function clearCandles() {
  els.candles.innerHTML = "";
  setCandleCount(0);
}

function burstConfetti() {
  const colors = ["#ff3f86", "#ffe17a", "#7ad3ff", "#7dffb0", "#b187ff"];
  const count = 140;
  const now = Date.now();

  for (let i = 0; i < count; i += 1) {
    const p = document.createElement("div");
    p.className = "confetti";
    p.style.left = `${Math.random() * 100}vw`;
    p.style.background = colors[(Math.random() * colors.length) | 0];
    p.style.width = `${6 + Math.random() * 8}px`;
    p.style.height = `${10 + Math.random() * 14}px`;
    p.style.animationDuration = `${2.6 + Math.random() * 1.7}s`;
    p.style.animationDelay = `${Math.random() * 0.15}s`;
    p.style.transform = `translateY(0) rotate(${Math.random() * 180}deg)`;
    p.dataset.spawnedAt = String(now);
    els.confetti.appendChild(p);
  }

  window.setTimeout(() => {
    const cutoff = Date.now() - 3500;
    els.confetti.querySelectorAll(".confetti").forEach((p) => {
      const spawned = Number(p.dataset.spawnedAt || "0");
      if (spawned < cutoff) p.remove();
    });
  }, 4200);
}

function openGift() {
  isGiftOpen = true;
  els.gift.classList.add("is-open");
  els.cakeWrap.classList.add("is-visible");
  els.cakeWrap.removeAttribute("aria-hidden");
  setHint("Click the cake to add candles on top.");
}

function resetAll() {
  clearCandles();
  setHint(isGiftOpen ? "Click the cake to add candles." : "Tap the gift box.");
}

function computeRmsNormalized(timeDomainBytes) {
  let sumSq = 0;
  for (let i = 0; i < timeDomainBytes.length; i += 1) {
    const v = (timeDomainBytes[i] - 128) / 128;
    sumSq += v * v;
  }
  return Math.sqrt(sumSq / timeDomainBytes.length);
}

function analyzeMic() {
  if (!micState.analyser || !micState.dataArray) return;

  micState.analyser.getByteTimeDomainData(micState.dataArray);
  const rms = computeRmsNormalized(micState.dataArray);

  micState.smoothed = micState.smoothed * 0.88 + rms * 0.12;

  const candles = els.candles.querySelectorAll(".candle:not(.extinguished)");
  const hasFlames = candles.length > 0;

  const threshold = 0.12;
  const cooldownMs = 1400;
  const now = Date.now();

  if (hasFlames && micState.smoothed > threshold && now - micState.lastBlowAt > cooldownMs) {
    micState.lastBlowAt = now;
    extinguishAllCandles();
  }

  micState.rafId = requestAnimationFrame(analyzeMic);
}

async function enableMic() {
  if (micState.enabled) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.fftSize);

    micState = {
      enabled: true,
      audioContext,
      analyser,
      dataArray,
      rafId: requestAnimationFrame(analyzeMic),
      stream,
      smoothed: 0,
      lastBlowAt: 0,
    };

    els.micBtn.textContent = "Mic enabled (blow!)";
    els.micBtn.disabled = true;
    setHint("Mic is enabled. Blow towards the mic to extinguish the flames.");
  } catch (err) {
    console.error(err);
    setHint("Mic permission denied. You can still click to add candles.");
  }
}

els.gift.addEventListener("click", () => {
  if (!isGiftOpen) openGift();
});

els.cake.addEventListener("click", (event) => {
  if (!isGiftOpen) return;

  const rect = els.cake.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const topRegionMaxY = rect.height * 0.22;
  if (y > topRegionMaxY) {
    setHint("Tip: click near the top of the cake to place candles.");
    return;
  }

  const xPct = Math.max(8, Math.min(92, (x / rect.width) * 100));
  addCandleAt(xPct);

  const remaining = els.candles.querySelectorAll(".candle:not(.extinguished)").length;
  if (remaining >= 1) setHint("Now blow into your mic to put them out!");
});

els.micBtn.addEventListener("click", () => {
  enableMic();
});

els.resetBtn.addEventListener("click", () => {
  resetAll();
});

setHint("Tap the gift box to begin.");

