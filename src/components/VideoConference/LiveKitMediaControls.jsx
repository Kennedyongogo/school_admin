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
export default function LiveKitMediaControls({ onRequestLeave, onLeave, room: roomOverride }) {
  const roomFromContext = useRoomContext();
  const room = roomOverride ?? roomFromContext;
  const connectionState = useConnectionState();
  const mediaReady =
    connectionState === ConnectionState.Connected || connectionState === ConnectionState.Reconnecting;

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
    onLeave?.();
  };

  const connectingReason =
    connectionState === ConnectionState.Connecting
      ? "Connecting to video…"
      : connectionState === ConnectionState.Disconnected
        ? "Not connected to video"
        : undefined;

  const stripDisabled = (props) => {
    if (!props) return props;
    const { disabled: _d, ...rest } = props;
    return rest;
  };

  return (
    <Controls
      micOn={micOn}
      camOn={camOn}
      micButtonProps={stripDisabled(micButtonProps)}
      camButtonProps={stripDisabled(camButtonProps)}
      mediaDisabled={!mediaReady || micPending || camPending}
      mediaDisabledReason={
        connectingReason || (micPending || camPending ? "Updating media…" : undefined)
      }
      onLeave={handleLeave}
    />
  );
}
