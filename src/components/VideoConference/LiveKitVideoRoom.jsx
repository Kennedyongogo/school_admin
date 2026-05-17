import React, { useEffect, useRef } from "react";
import {
  CarouselLayout,
  FocusLayout,
  FocusLayoutContainer,
  GridLayout,
  LayoutContextProvider,
  ParticipantTile,
  RoomAudioRenderer,
  useCreateLayoutContext,
  usePinnedTracks,
  useTracks,
} from "@livekit/components-react";
import { isEqualTrackRef, isTrackReference, isWeb } from "@livekit/components-core";
import { RoomEvent, Track } from "livekit-client";

/** LiveKit video + controls only — class chat uses LiveClassSidebar (Socket.io + DB). */
export default function LiveKitVideoRoom({ allowFocusLayout = true }) {
  const lastAutoFocusedScreenShareTrack = useRef(null);
  const layoutContext = useCreateLayoutContext();

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { updateOnlyOn: [RoomEvent.ActiveSpeakersChanged], onlySubscribed: false }
  );

  const screenShareTracks = tracks
    .filter(isTrackReference)
    .filter((track) => track.publication.source === Track.Source.ScreenShare);

  const focusTrack = usePinnedTracks(layoutContext)?.[0];
  const carouselTracks = tracks.filter((track) => !isEqualTrackRef(track, focusTrack));

  useEffect(() => {
    if (!allowFocusLayout) {
      if (lastAutoFocusedScreenShareTrack.current) {
        layoutContext.pin.dispatch?.({ msg: "clear_pin" });
        lastAutoFocusedScreenShareTrack.current = null;
      }
      return;
    }
    if (
      screenShareTracks.some((track) => track.publication.isSubscribed) &&
      lastAutoFocusedScreenShareTrack.current === null
    ) {
      layoutContext.pin.dispatch?.({ msg: "set_pin", trackReference: screenShareTracks[0] });
      lastAutoFocusedScreenShareTrack.current = screenShareTracks[0];
    } else if (
      lastAutoFocusedScreenShareTrack.current &&
      !screenShareTracks.some(
        (track) =>
          track.publication.trackSid === lastAutoFocusedScreenShareTrack.current?.publication?.trackSid
      )
    ) {
      layoutContext.pin.dispatch?.({ msg: "clear_pin" });
      lastAutoFocusedScreenShareTrack.current = null;
    }
    if (focusTrack && !isTrackReference(focusTrack)) {
      const updatedFocusTrack = tracks.find(
        (tr) =>
          tr.participant.identity === focusTrack.participant.identity && tr.source === focusTrack.source
      );
      if (updatedFocusTrack !== focusTrack && isTrackReference(updatedFocusTrack)) {
        layoutContext.pin.dispatch?.({ msg: "set_pin", trackReference: updatedFocusTrack });
      }
    }
  }, [
    screenShareTracks.map((ref) => `${ref.publication.trackSid}_${ref.publication.isSubscribed}`).join(),
    focusTrack?.publication?.trackSid,
    tracks,
    allowFocusLayout,
    layoutContext.pin,
  ]);

  if (!isWeb()) return null;

  const useFocusLayout = allowFocusLayout && !!focusTrack;

  return (
    <div className="lk-video-conference" style={{ height: "100%" }}>
      <LayoutContextProvider value={layoutContext}>
        <div className="lk-video-conference-inner">
          {!useFocusLayout ? (
            <div className="lk-grid-layout-wrapper">
              <GridLayout tracks={tracks}>
                <ParticipantTile />
              </GridLayout>
            </div>
          ) : (
            <div className="lk-focus-layout-wrapper">
              <FocusLayoutContainer>
                <CarouselLayout tracks={carouselTracks}>
                  <ParticipantTile />
                </CarouselLayout>
                {focusTrack ? <FocusLayout trackRef={focusTrack} /> : null}
              </FocusLayoutContainer>
            </div>
          )}
        </div>
      </LayoutContextProvider>
      <RoomAudioRenderer />
    </div>
  );
}
