const EARLY_JOIN_MINUTES = 15;

/** Client-side join window (matches API rules for list/card UI). */
export function getAdminMeetingJoinWindow(meeting) {
  if (!meeting) {
    return { can_join: false, reason: "Meeting not found.", opens_at: null, closes_at: null };
  }

  const status = String(meeting.session_status || meeting.status || "").toLowerCase();

  if (status === "cancelled") {
    return {
      can_join: false,
      reason: "This meeting was cancelled.",
      opens_at: null,
      closes_at: null,
    };
  }

  const now = Date.now();
  const startMs = meeting.start_time ? new Date(meeting.start_time).getTime() : NaN;
  const endMs = meeting.end_time ? new Date(meeting.end_time).getTime() : NaN;
  const earlyMs = EARLY_JOIN_MINUTES * 60 * 1000;
  const opensAt =
    !Number.isNaN(startMs) ? new Date(startMs - earlyMs).toISOString() : null;
  const closesAt = !Number.isNaN(endMs) ? new Date(endMs).toISOString() : null;

  if (!Number.isNaN(startMs) && now < startMs - earlyMs) {
    return {
      can_join: false,
      reason: "This meeting is not open yet. You can join 15 minutes before the start time.",
      opens_at: opensAt,
      closes_at: closesAt,
    };
  }

  if (!Number.isNaN(endMs) && now > endMs) {
    return {
      can_join: false,
      past_scheduled_end: true,
      reason:
        "This meeting’s scheduled time has passed. Extend the end time in Edit to continue, or use End live if the session is still open.",
      opens_at: opensAt,
      closes_at: closesAt,
    };
  }

  if (status === "ended") {
    return {
      can_join: true,
      reason: null,
      opens_at: opensAt,
      closes_at: closesAt,
      resume_after_end: true,
    };
  }

  return {
    can_join: true,
    reason: null,
    opens_at: opensAt,
    closes_at: closesAt,
  };
}

export function isAdminMeetingPastEnd(meeting) {
  if (!meeting?.end_time) return false;
  const status = String(meeting.session_status || meeting.status || "").toLowerCase();
  if (status === "cancelled") return false;
  if (status === "ended") return false;
  return Date.now() > new Date(meeting.end_time).getTime();
}

/** Staff invite alerts only while the meeting is within its scheduled window. */
export function canNotifyAdminMeetingStaff(meeting) {
  if (!meeting) return false;
  const win = getAdminMeetingJoinWindow(meeting);
  if (win.past_scheduled_end) return false;
  const status = String(meeting.session_status || meeting.status || "").toLowerCase();
  if (status === "cancelled" || status === "ended") return false;
  return win.can_join === true;
}

export function getAdminMeetingStatusLabel(meeting) {
  if (!meeting) return "—";
  const win = getAdminMeetingJoinWindow(meeting);
  const status = String(meeting.session_status || meeting.status || "").toLowerCase();
  if (win.past_scheduled_end && status === "live") return "Past time (live)";
  if (win.past_scheduled_end) return "Past time";
  if (win.resume_after_end) return "Ended (in schedule)";
  return meeting.session_status || meeting.status || "—";
}

export function canEndStaleAdminMeetingLive(meeting) {
  if (!meeting?.is_creator) return false;
  const status = String(meeting.session_status || meeting.status || "").toLowerCase();
  const win = getAdminMeetingJoinWindow(meeting);
  return status === "live" && win.past_scheduled_end === true;
}
