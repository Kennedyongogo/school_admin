const EARLY_JOIN_MINUTES = 15;

/** Client-side event join window (matches API). */
export function getEventJoinWindow(event) {
  if (!event) {
    return { can_join: false, reason: "Event not found.", opens_at: null, closes_at: null };
  }

  const status = String(event.session_status || "").toLowerCase();

  if (status === "cancelled") {
    return {
      can_join: false,
      reason: "This event was cancelled.",
      opens_at: null,
      closes_at: null,
    };
  }

  const start = event.start_date ? new Date(event.start_date) : null;
  let end = event.end_date ? new Date(event.end_date) : null;

  if (!start || Number.isNaN(start.getTime())) {
    return { can_join: true, reason: null, opens_at: null, closes_at: null };
  }

  if (!end || Number.isNaN(end.getTime()) || end.getTime() <= start.getTime()) {
    end = new Date(start.getTime() + 60 * 60 * 1000);
  }

  const opensAt = new Date(start.getTime() - EARLY_JOIN_MINUTES * 60 * 1000);
  const now = new Date();

  if (now < opensAt) {
    return {
      can_join: false,
      reason: "This event is not open yet. You can join 15 minutes before the start time.",
      opens_at: opensAt.toISOString(),
      closes_at: end.toISOString(),
    };
  }

  if (now > end) {
    return {
      can_join: false,
      past_scheduled_end: true,
      reason: "This event has ended. The join option is no longer available.",
      opens_at: opensAt.toISOString(),
      closes_at: end.toISOString(),
    };
  }

  if (status === "ended") {
    return {
      can_join: true,
      reason: null,
      opens_at: opensAt.toISOString(),
      closes_at: end.toISOString(),
      resume_after_end: true,
    };
  }

  return {
    can_join: true,
    reason: null,
    opens_at: opensAt.toISOString(),
    closes_at: end.toISOString(),
  };
}

export function isOnlineEvent(event) {
  const mode = String(event?.delivery_mode || "").toLowerCase();
  return mode === "online" || mode === "hybrid";
}

export function canManageEventLive(event) {
  if (!isOnlineEvent(event)) return false;
  return getEventJoinWindow(event).can_join === true;
}

export function canRegenerateEventPoster(event) {
  const win = getEventJoinWindow(event);
  if (win.past_scheduled_end) return false;
  const status = String(event?.session_status || "").toLowerCase();
  if (status === "cancelled") return false;
  return true;
}

export function canEndStaleEventLive(event) {
  const status = String(event?.session_status || "").toLowerCase();
  const win = getEventJoinWindow(event);
  return status === "live" && win.past_scheduled_end === true;
}

export function getEventStatusLabel(event) {
  if (!event) return "—";
  const win = getEventJoinWindow(event);
  const status = String(event.session_status || "").toLowerCase();
  if (win.past_scheduled_end && status === "live") return "Past time (live)";
  if (win.past_scheduled_end) return "Past time";
  if (win.resume_after_end) return "Ended (in schedule)";
  return event.session_status || "scheduled";
}
