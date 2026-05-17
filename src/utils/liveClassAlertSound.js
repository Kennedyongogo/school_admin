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

/** New question (distinct from general chat). */
export function playQuestionAlert() {
  playTone({ frequency: 880, duration: 0.07, gain: 0.07 });
  setTimeout(() => playTone({ frequency: 1100, duration: 0.1, gain: 0.06 }), 80);
}

/** Participant admitted to the event. */
export function playAdmittedAlert() {
  playTone({ frequency: 440, duration: 0.1, gain: 0.07 });
  setTimeout(() => playTone({ frequency: 554, duration: 0.12, gain: 0.06 }), 100);
}

/** Live reaction emoji. */
export function playReactionAlert() {
  playTone({ frequency: 700, duration: 0.06, gain: 0.05 });
  setTimeout(() => playTone({ frequency: 900, duration: 0.08, gain: 0.05 }), 70);
}

/** Admin portal bell — staff meeting / system alerts. */
export function playStaffNotificationAlert() {
  playTone({ frequency: 784, duration: 0.12, gain: 0.1, type: "sine" });
  setTimeout(() => playTone({ frequency: 988, duration: 0.14, gain: 0.09, type: "sine" }), 140);
  setTimeout(() => playTone({ frequency: 1175, duration: 0.18, gain: 0.07, type: "triangle" }), 300);
}

export function tryBrowserNotification(title, body, tag = "live-class-host") {
  if (typeof window === "undefined" || !document.hidden) return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, tag });
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
