import React from "react";
import { useRoomContext, useTrackToggle } from "@livekit/components-react";
import { Track } from "livekit-client";
import Controls from "./Controls";

/** Mic / camera / leave bar below the video area (not inside the LiveKit tile). */
export default function LiveKitMediaControls({ onLeave }) {
  const room = useRoomContext();
  const { enabled: micOn, toggle: toggleMic } = useTrackToggle({ source: Track.Source.Microphone });
  const { enabled: camOn, toggle: toggleCam } = useTrackToggle({ source: Track.Source.Camera });

  const handleLeave = () => {
    room?.disconnect();
    onLeave?.();
  };

  return (
    <Controls
      micOn={micOn}
      camOn={camOn}
      onToggleMic={toggleMic}
      onToggleCam={toggleCam}
      onLeave={handleLeave}
    />
  );
}
