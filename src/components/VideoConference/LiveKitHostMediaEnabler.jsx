import { useEffect } from "react";
import { useConnectionState, useRoomContext } from "@livekit/components-react";
import { ConnectionState } from "livekit-client";

/** After connect, ensure host cam/mic are on (covers optional join + permission retries). */
export default function LiveKitHostMediaEnabler({ enabled = false }) {
  const room = useRoomContext();
  const connectionState = useConnectionState();

  useEffect(() => {
    if (!enabled || connectionState !== ConnectionState.Connected || !room?.localParticipant) return undefined;

    let cancelled = false;
    (async () => {
      try {
        if (!room.localParticipant.isCameraEnabled) {
          await room.localParticipant.setCameraEnabled(true);
        }
        if (!room.localParticipant.isMicrophoneEnabled) {
          await room.localParticipant.setMicrophoneEnabled(true);
        }
      } catch (err) {
        /* Host media enable is best-effort; avoid console noise on join. */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, connectionState, room]);

  return null;
}
