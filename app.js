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
  cameos: document.getElementById("cameos"),
  scene: document.getElementById("scene"),
  mid20sFlag: document.getElementById("mid20sFlag"),
};

let isGiftOpen = false;
let milestone25Shown = false;
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

function updateMid20sFlag(count) {
  if (!els.mid20sFlag) return;
  if (count === 24 || count === 25 || count === 26) {
    positionMid20sFlag();
    els.mid20sFlag.textContent =
      count === 24 ? "goodbye 24" : count === 26 ? "26 daw siya eh haha" : "wow mid 20's na yarn";
    els.mid20sFlag.classList.add("is-visible");
  } else {
    els.mid20sFlag.classList.remove("is-visible");
  }
}

function positionMid20sFlag() {
  if (!els.mid20sFlag || !els.scene || !els.gift) return;
  const sceneRect = els.scene.getBoundingClientRect();
  const lid = els.gift.querySelector(".gift__lid");
  if (!lid) return;
  const lidRect = lid.getBoundingClientRect();

  // Place above the gift lid for a cleaner, consistent anchor.
  const x = lidRect.left - sceneRect.left + lidRect.width * 0.72;
  const y = lidRect.top - sceneRect.top - 10;

  els.mid20sFlag.style.setProperty("--mid20s-x", `${x}px`);
  els.mid20sFlag.style.setProperty("--mid20s-y", `${y}px`);
}

function clearCameos() {
  if (!els.cameos) return;
  els.cameos.innerHTML = "";
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function isOnCakeTop({ x, y, w, h }) {
  // Approximate the icing top as an ellipse near the top of the cake.
  // Normalize coordinates into an ellipse equation.
  const cx = w * 0.5;
  const cy = h * 0.22;
  const rx = w * 0.44;
  const ry = h * 0.16;

  const nx = (x - cx) / rx;
  const ny = (y - cy) / ry;
  return nx * nx + ny * ny <= 1;
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

function addCandleAtPoint({ xPx, yPx }) {
  const candle = document.createElement("div");
  candle.className = "candle";
  candle.style.left = `${xPx}px`;
  candle.style.top = `${yPx}px`;
  candle.innerHTML = '<div class="flame"></div>';
  els.candles.appendChild(candle);
  const nextCount = getCandleCount() + 1;
  setCandleCount(nextCount);
  updateMid20sFlag(nextCount);

  if (nextCount === 25 && !milestone25Shown) {
    milestone25Shown = true;
    showMid20sFlag();
  }

  // Predictable pattern: every 2 candles, show the next medtech sticker.
  if (nextCount % 2 === 0) spawnCameo();
}

function showMid20sFlag() {
  if (!els.mid20sFlag) return;
  positionMid20sFlag();
  els.mid20sFlag.classList.add("is-visible");
}

function hideMid20sFlag() {
  if (!els.mid20sFlag) return;
  els.mid20sFlag.classList.remove("is-visible");
}

function extinguishAllCandles() {
  const candles = els.candles.querySelectorAll(".candle");
  if (!candles.length) return;

  candles.forEach((c) => c.classList.add("extinguished"));
  clearCameos();
  setHint("hbd OT-y kween");
  burstConfetti();
}

function clearCandles() {
  els.candles.innerHTML = "";
  setCandleCount(0);
  updateMid20sFlag(0);
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

function rectIntersects(a, b) {
  return !(
    a.right < b.left ||
    a.left > b.right ||
    a.bottom < b.top ||
    a.top > b.bottom
  );
}

function inflateRect(r, pad) {
  return {
    left: r.left - pad,
    top: r.top - pad,
    right: r.right + pad,
    bottom: r.bottom + pad,
  };
}

function getForbiddenRects() {
  const rects = [];

  const add = (el, pad = 18) => {
    if (!el) return;
    const r = el.getBoundingClientRect();
    rects.push(inflateRect(r, pad));
  };

  add(els.gift, 26);
  add(els.cake, 26);

  // Header + controls/hint area (everything inside the card except the main empty white area).
  const controls = document.querySelector(".controls");
  add(controls, 18);
  add(els.hint, 18);

  const header = document.querySelector(".header");
  add(header, 18);

  // Keep away from the banner too
  add(els.mid20sFlag, 18);

  // Keep away from other cameos (no overlaps)
  if (els.cameos) {
    els.cameos.querySelectorAll(".cameo").forEach((c) => {
      const r = c.getBoundingClientRect();
      rects.push(inflateRect(r, 12));
    });
  }

  return rects;
}

function pickSafeSpot({ w, h, maxYFrac = 0.62 }) {
  const margin = 16;
  const forbidden = getForbiddenRects();
  const maxX = Math.max(margin, window.innerWidth - margin - w);
  const maxY = Math.max(margin, window.innerHeight * maxYFrac - margin - h);

  for (let i = 0; i < 18; i += 1) {
    const x = margin + Math.random() * (maxX - margin);
    const y = margin + Math.random() * (maxY - margin);
    const r = { left: x, top: y, right: x + w, bottom: y + h };
    const hits = forbidden.some((f) => rectIntersects(r, f));
    if (!hits) return { x, y };
  }

  // Fallback: top-left-ish.
  return { x: margin, y: margin + 40 };
}

function popMid20sFromCake() {
  // (deprecated) previously used for flyaway bubble
}

function cameoSvg(kind) {
  // Simple original medtech stickers (not based on any brand assets).
  const glow = `
    <defs>
      <radialGradient id="glow" cx="50%" cy="40%" r="62%">
        <stop offset="0%" stop-color="white" stop-opacity="0.95" />
        <stop offset="100%" stop-color="white" stop-opacity="0" />
      </radialGradient>
    </defs>
    <circle cx="60" cy="60" r="54" fill="url(#glow)" />
  `;

  const syringe = `
    <g transform="translate(0,2) rotate(-12 60 60)">
      <!-- barrel -->
      <rect x="28" y="56" width="56" height="18" rx="9" fill="#EAF7FF" stroke="#1B1B1B" stroke-opacity="0.22" stroke-width="2"/>
      <rect x="34" y="61" width="34" height="8" rx="4" fill="#B7E3FF" opacity="0.95"/>
      <!-- measurement lines -->
      <path d="M44 59v12M52 59v12M60 59v12M68 59v12" stroke="#1B1B1B" stroke-opacity="0.18" stroke-width="2" stroke-linecap="round"/>
      <!-- plunger -->
      <rect x="18" y="58" width="14" height="14" rx="6" fill="#E9D8FF" stroke="#1B1B1B" stroke-opacity="0.18" stroke-width="2"/>
      <path d="M18 65h-12" stroke="#1B1B1B" stroke-opacity="0.35" stroke-width="3" stroke-linecap="round"/>
      <path d="M6 61v8" stroke="#1B1B1B" stroke-opacity="0.25" stroke-width="3" stroke-linecap="round"/>
      <!-- needle -->
      <rect x="84" y="60" width="14" height="10" rx="5" fill="#FFD26A" stroke="#1B1B1B" stroke-opacity="0.16" stroke-width="2"/>
      <path d="M98 65h16" stroke="#1B1B1B" stroke-opacity="0.55" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M114 65l6-2" stroke="#1B1B1B" stroke-opacity="0.55" stroke-width="2.5" stroke-linecap="round"/>
    </g>
  `;

  const bloodbag = `
    <g transform="translate(0,4)">
      <!-- hanger -->
      <path d="M46 18h28" stroke="#1B1B1B" stroke-opacity="0.28" stroke-width="4" stroke-linecap="round"/>
      <path d="M60 18v8" stroke="#1B1B1B" stroke-opacity="0.22" stroke-width="3" stroke-linecap="round"/>
      <!-- bag -->
      <rect x="38" y="26" width="44" height="60" rx="10" fill="#FFE7EA" stroke="#1B1B1B" stroke-opacity="0.16" stroke-width="2"/>
      <rect x="44" y="32" width="32" height="10" rx="5" fill="#ffffff" opacity="0.75"/>
      <rect x="44" y="44" width="32" height="34" rx="8" fill="#FF3F86" opacity="0.85"/>
      <path d="M44 56h32" stroke="#ffffff" stroke-opacity="0.5" stroke-width="2" stroke-linecap="round"/>
      <!-- tube -->
      <path d="M60 86v18" stroke="#1B1B1B" stroke-opacity="0.32" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M60 104c0 6-6 10-12 10" stroke="#1B1B1B" stroke-opacity="0.32" stroke-width="2.5" stroke-linecap="round"/>
    </g>
  `;

  const wheelchair = `
    <g transform="translate(0,6)">
      <circle cx="74" cy="74" r="18" fill="#CFF3FF" stroke="#1B1B1B" stroke-opacity="0.18" stroke-width="3"/>
      <circle cx="74" cy="74" r="8" fill="#ffffff" opacity="0.9"/>
      <circle cx="46" cy="82" r="10" fill="#E9D8FF" stroke="#1B1B1B" stroke-opacity="0.14" stroke-width="3"/>
      <path d="M44 30c8 0 14 6 14 14s-6 14-14 14-14-6-14-14 6-14 14-14z" fill="#FFD6C9"/>
      <path d="M52 58h22c8 0 12 6 12 14v2" stroke="#1B1B1B" stroke-opacity="0.35" stroke-width="4" stroke-linecap="round"/>
      <path d="M44 58v18c0 6 4 10 10 10h10" stroke="#1B1B1B" stroke-opacity="0.35" stroke-width="4" stroke-linecap="round"/>
      <path d="M60 58l-10-18" stroke="#1B1B1B" stroke-opacity="0.25" stroke-width="4" stroke-linecap="round"/>
    </g>
  `;

  const stetho = `
    <g transform="translate(0,4)">
      <path d="M40 26c0 24 0 28 20 28s20-4 20-28" fill="none" stroke="#7AA8FF" stroke-width="8" stroke-linecap="round"/>
      <path d="M60 54v10c0 16 10 26 26 26" fill="none" stroke="#7AA8FF" stroke-width="8" stroke-linecap="round"/>
      <circle cx="92" cy="90" r="10" fill="#B7E3FF" stroke="#1B1B1B" stroke-opacity="0.14" stroke-width="3"/>
      <rect x="34" y="20" width="10" height="18" rx="5" fill="#FFE17A"/>
      <rect x="76" y="20" width="10" height="18" rx="5" fill="#FFE17A"/>
    </g>
  `;

  const testtube = `
    <g transform="translate(0,2) rotate(-10 60 60)">
      <!-- glass -->
      <path d="M50 22h20v54c0 12-8 22-20 22s-20-10-20-22V22h20" fill="#EAF7FF" opacity="0.95"
        stroke="#1B1B1B" stroke-opacity="0.16" stroke-width="2" stroke-linejoin="round"/>
      <!-- rim -->
      <path d="M46 22h28" stroke="#1B1B1B" stroke-opacity="0.18" stroke-width="4" stroke-linecap="round"/>
      <!-- measurement lines -->
      <path d="M44 34h10M44 44h10M44 54h10M44 64h10" stroke="#1B1B1B" stroke-opacity="0.12" stroke-width="2" stroke-linecap="round"/>
    </g>
  `;

  const icons = {
    syringe,
    bloodbag,
    stetho,
    testtube,
  };

  const inner = icons[kind] || icons.syringe;
  return `
    <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      ${glow}
      ${inner}
    </svg>
  `;
}

function spawnCameo() {
  if (!els.cameos) return;
  if (!isGiftOpen) return;
  if (els.cameos.querySelectorAll(".cameo").length >= 6) return; // persistent, but keep it tasteful

  const kinds = ["syringe", "bloodbag", "stetho", "testtube"];
  spawnCameo.nextIndex = (spawnCameo.nextIndex ?? 0) + 1;
  const kind = kinds[(spawnCameo.nextIndex - 1) % kinds.length];

  const el = document.createElement("div");
  el.className = "cameo";
  el.innerHTML = cameoSvg(kind);

  const size = 110;
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;

  const { x, y } = pickSafeSpot({ w: size, h: size, maxYFrac: 0.62 });
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.animationDuration = `${2.8 + Math.random() * 1.4}s`;

  els.cameos.appendChild(el);
}

function openGift() {
  isGiftOpen = true;
  els.gift.classList.add("is-open");
  els.cakeWrap.classList.add("is-visible");
  els.cakeWrap.removeAttribute("aria-hidden");
  setHint("Pindutin mo yung cake ulit yung taas");
  spawnCameo();
}

function resetAll() {
  clearCandles();
  clearCameos();
  milestone25Shown = false;
  hideMid20sFlag();
  setHint(isGiftOpen ? "Pindutin mo yung cake ulit yung taas" : "Pindutin mo");
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

  if (
    hasFlames &&
    micState.smoothed > threshold &&
    now - micState.lastBlowAt > cooldownMs
  ) {
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

    els.micBtn.textContent = "Mic enabled";
    els.micBtn.disabled = true;
    setHint("Hipan mo na.");
    spawnCameo();
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

  // Only allow candles on the top surface of the cake.
  if (!isOnCakeTop({ x, y, w: rect.width, h: rect.height })) {
    setHint("Pindutin mo yung cake ulit yung taas");
    return;
  }

  const xClamped = clamp(x, 18, rect.width - 18);
  const yClamped = clamp(y, 28, rect.height * 0.38);
  addCandleAtPoint({ xPx: xClamped, yPx: yClamped });

  const remaining = els.candles.querySelectorAll(".candle:not(.extinguished)").length;
  if (remaining >= 1) {
    if (micState.enabled) setHint("Hipan mo na.");
    else setHint("");
  }
});

els.micBtn.addEventListener("click", () => {
  enableMic();
});

els.resetBtn.addEventListener("click", () => {
  resetAll();
});

setHint("Pindutin mo");
updateMid20sFlag(getCandleCount());

