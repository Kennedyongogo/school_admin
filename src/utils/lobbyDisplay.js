/** Live duration label for class roster (recompute on each render / tick). */
export function durationLabel(entry, nowMs = Date.now()) {
  if (!entry?.admitted_at) return null;

  const start = new Date(entry.admitted_at).getTime();
  if (Number.isNaN(start)) return null;

  const endMs = entry.status === "left" && entry.left_at ? new Date(entry.left_at).getTime() : nowMs;
  if (Number.isNaN(endMs)) return null;

  const totalSec = Math.max(0, Math.floor((endMs - start) / 1000));

  if (entry.status === "admitted") {
    if (totalSec < 45) return "Just joined";
    if (totalSec < 60) return "< 1 min · live";
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return secs > 0 ? `${mins}m ${secs}s · live` : `${mins} min · live`;
  }

  if (entry.status === "left") {
    const mins = Math.max(1, Math.round(totalSec / 60));
    return `${mins} min total`;
  }

  return null;
}

export function statusChip(entry, nowMs) {
  if (entry.status === "waiting") return { label: "Waiting", color: "warning" };
  if (entry.status === "admitted") {
    const dur = durationLabel(entry, nowMs);
    return { label: dur || "In class", color: "success" };
  }
  if (entry.status === "left") {
    const dur = durationLabel(entry, nowMs);
    return { label: dur || "Left", color: "info", variant: "outlined" };
  }
  if (entry.status === "denied") return { label: "Denied", color: "error" };
  return null;
}
