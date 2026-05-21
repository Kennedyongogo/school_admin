/** Map portal/API video_mode to LiveKitRoom connect options. */
export function resolveLiveKitJoinMedia(mediaMode) {
  const mode = String(mediaMode || "")
    .trim()
    .toLowerCase();
  if (mode === "optional") return { audio: false, video: false };
  if (mode === "audio") return { audio: true, video: false };
  if (mode === "video" || mode === "livekit" || mode === "webrtc") {
    return { audio: true, video: true };
  }
  return { audio: true, video: true };
}

/**
 * Staff/hosts always publish mic+cam on join so controls work and the stage is not empty.
 * Students follow timetable/exam media_mode.
 */
export function resolveLiveKitJoinMediaForRole(mediaMode, { isHost = false } = {}) {
  if (isHost) return { audio: true, video: true };
  return resolveLiveKitJoinMedia(mediaMode);
}
