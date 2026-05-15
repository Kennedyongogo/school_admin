/** Short notification tones via Web Audio (no asset files). */

let sharedCtx = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedCtx) sharedCtx = new Ctx();
  if (sharedCtx.state === "suspended") {
    void sharedCtx.resume().catch(() => {});
  }
  return sharedCtx;
}

/** Call once after a user gesture so alert tones are not blocked by autoplay policy. */
export function primeAlertAudio() {
  const ctx = getCtx();
  if (!ctx || ctx.state !== "suspended") return;
  void ctx.resume().catch(() => {});
}

function playTone({ frequency = 880, duration = 0.12, gain = 0.08, type = "sine" }) {
  const ctx = getCtx();
  if (!ctx) return;
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

/** Student waiting to join (lobby knock). */
export function playLobbyKnockAlert() {
  playTone({ frequency: 740, duration: 0.1, gain: 0.09 });
  setTimeout(() => playTone({ frequency: 988, duration: 0.14, gain: 0.08 }), 120);
}

/** New chat or question from a student. */
export function playChatAlert() {
  playTone({ frequency: 523, duration: 0.08, gain: 0.07 });
  setTimeout(() => playTone({ frequency: 659, duration: 0.1, gain: 0.06 }), 90);
}

/** Raised hand. */
export function playHandRaiseAlert() {
  playTone({ frequency: 600, duration: 0.15, gain: 0.08, type: "triangle" });
}

export function tryBrowserNotification(title, body) {
  if (typeof window === "undefined" || !document.hidden) return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, tag: "live-class-host" });
  } catch {
    // ignore
  }
}

export function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    void Notification.requestPermission().catch(() => {});
  }
}
