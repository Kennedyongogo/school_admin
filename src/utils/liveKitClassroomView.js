import { Track } from "livekit-client";

/** @param {import('livekit-client').Participant | undefined} participant */
export function parseClassroomRole(participant) {
  if (!participant) return "student";
  try {
    const raw = participant.metadata;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.classroomRole === "teacher") return "teacher";
      if (parsed.classroomRole === "student") return "student";
    }
  } catch {
    /* ignore malformed metadata */
  }
  if (participant.permissions?.canPublishData) return "teacher";
  return "student";
}

/** @param {import('livekit-client').Participant | undefined} participant */
export function isTeacherParticipant(participant) {
  return parseClassroomRole(participant) === "teacher";
}

/** @param {import('@livekit/components-core').TrackReferenceOrPlaceholder} track */
function isVisibleStudentVideoTrack(track) {
  const participant = track?.participant;
  if (!participant) return false;
  if (participant.isLocal) return true;
  const source = track.source;
  if (source === Track.Source.ScreenShare) return true;
  if (source === Track.Source.Camera && isTeacherParticipant(participant)) return true;
  return false;
}

/**
 * Student video tiles: self, teacher camera, and any screen share.
 * Placeholders for other classmates are excluded (they caused extra tiles).
 * Audio is handled separately (RoomAudioRenderer — full class).
 */
export function filterTracksForStudentView(tracks) {
  return tracks.filter((track) => isVisibleStudentVideoTrack(track));
}

/**
 * Students subscribe to all audio but only teacher camera video (not classmates' cameras).
 * @param {import('livekit-client').Room} room
 */
export function applyStudentClassroomSubscriptions(room) {
  if (!room) return;
  room.remoteParticipants.forEach((participant) => {
    const showCamera = isTeacherParticipant(participant);
    participant.trackPublications.forEach((publication) => {
      if (publication.kind !== Track.Kind.Video) return;
      if (publication.source === Track.Source.ScreenShare) {
        publication.setSubscribed(true);
        return;
      }
      if (publication.source === Track.Source.Camera) {
        publication.setSubscribed(showCamera);
      }
    });
  });
}
