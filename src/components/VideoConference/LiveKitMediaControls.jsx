import React from "react";
import { useConnectionState, useRoomContext, useTrackToggle } from "@livekit/components-react";
import { ConnectionState, MediaDeviceFailure, Track } from "livekit-client";
import Controls from "./Controls";

function mediaFailureFrom(error) {
  if (error == null) return undefined;
  if (typeof error === "string") {
    return Object.values(MediaDeviceFailure).includes(error) ? error : undefined;
  }
  if (typeof error === "object") {
    return MediaDeviceFailure.getFailure(error);
  }
  return undefined;
}

function deviceErrorMessage(kind, error) {
  const failure = mediaFailureFrom(error);
  if (failure === MediaDeviceFailure.PermissionDenied) {
    return `${kind} access was blocked. Allow camera/microphone in your browser settings and reload.`;
  }
  if (failure === MediaDeviceFailure.NotFound) {
    return `No ${kind.toLowerCase()} was found on this device.`;
  }
  if (failure === MediaDeviceFailure.DeviceInUse) {
    return `${kind} is already in use by another application.`;
  }
  return error?.message || `Could not access ${kind.toLowerCase()}.`;
}

/** Mic / camera / leave bar below the video area (not inside the LiveKit tile). */
export default function LiveKitMediaControls({ onRequestLeave }) {
  const room = useRoomContext();
  const connectionState = useConnectionState(room);
  const mediaReady = connectionState === ConnectionState.Connected;

  const onMicError = React.useCallback((error) => {
    alert(deviceErrorMessage("Microphone", error));
  }, []);

  const onCamError = React.useCallback((error) => {
    alert(deviceErrorMessage("Camera", error));
  }, []);

  const {
    buttonProps: micButtonProps,
    enabled: micOn,
    pending: micPending,
  } = useTrackToggle({
    source: Track.Source.Microphone,
    room,
    onDeviceError: onMicError,
  });

  const {
    buttonProps: camButtonProps,
    enabled: camOn,
    pending: camPending,
  } = useTrackToggle({
    source: Track.Source.Camera,
    room,
    onDeviceError: onCamError,
  });

  const handleLeave = () => {
    onRequestLeave?.();
    room?.disconnect();
  };

  return (
    <Controls
      micOn={micOn}
      camOn={camOn}
      micButtonProps={micButtonProps}
      camButtonProps={camButtonProps}
      mediaDisabled={!mediaReady || micPending || camPending}
      mediaDisabledReason={!mediaReady ? "Connecting to video…" : undefined}
      onLeave={handleLeave}
    />
  );
}
