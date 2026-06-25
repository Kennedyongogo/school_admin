import React, { useEffect, useMemo, useRef } from "react";
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
  useRoomContext,
  useTracks,
} from "@livekit/components-react";
import { isEqualTrackRef, isTrackReference, isWeb } from "@livekit/components-core";
import { RoomEvent, Track } from "livekit-client";
import {
  applyStudentClassroomSubscriptions,
  filterTracksForStudentView,
} from "../../utils/liveKitClassroomView";

function StudentClassroomMediaSubscriptions({ enabled }) {
  const room = useRoomContext();

  useEffect(() => {
    if (!enabled || !room) return undefined;

    const sync = () => applyStudentClassroomSubscriptions(room);
    sync();
    room.on(RoomEvent.Connected, sync);
    room.on(RoomEvent.ParticipantConnected, sync);
    room.on(RoomEvent.ParticipantDisconnected, sync);
    room.on(RoomEvent.TrackPublished, sync);
    room.on(RoomEvent.TrackUnpublished, sync);

    return () => {
      room.off(RoomEvent.Connected, sync);
      room.off(RoomEvent.ParticipantConnected, sync);
      room.off(RoomEvent.ParticipantDisconnected, sync);
      room.off(RoomEvent.TrackPublished, sync);
      room.off(RoomEvent.TrackUnpublished, sync);
    };
  }, [room, enabled]);

  return null;
}

/**
 * LiveKit video layout. Class students see teacher + self on video; all voices via RoomAudioRenderer.
 */
export default function LiveKitVideoRoom({
  isTeacher = false,
  studentClassView = false,
  allowFocusLayout = true,
}) {
  const useStudentView = studentClassView && !isTeacher;
  const lastAutoFocusedScreenShareTrack = useRef(null);
  const layoutContext = useCreateLayoutContext();

  const tracks = useTracks(
    useStudentView
      ? [
          { source: Track.Source.Camera, withPlaceholder: false },
          { source: Track.Source.ScreenShare, withPlaceholder: false },
        ]
      : [
          { source: Track.Source.Camera, withPlaceholder: true },
          { source: Track.Source.ScreenShare, withPlaceholder: false },
        ],
    {
      updateOnlyOn: [RoomEvent.ActiveSpeakersChanged],
      onlySubscribed: useStudentView,
    }
  );

  const displayTracks = useMemo(
    () => (useStudentView ? filterTracksForStudentView(tracks) : tracks),
    [tracks, useStudentView]
  );

  const screenShareTracks = tracks
    .filter(isTrackReference)
    .filter((track) => track.publication.source === Track.Source.ScreenShare);

  const focusTrack = usePinnedTracks(layoutContext)?.[0];
  const carouselTracks = displayTracks.filter((track) => !isEqualTrackRef(track, focusTrack));

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
      const updatedFocusTrack = displayTracks.find(
        (tr) =>
          isTrackReference(tr) &&
          tr.participant.identity === focusTrack.participant.identity &&
          tr.source === focusTrack.source
      );
      if (updatedFocusTrack !== focusTrack && isTrackReference(updatedFocusTrack)) {
        layoutContext.pin.dispatch?.({ msg: "set_pin", trackReference: updatedFocusTrack });
      }
    }
  }, [
    screenShareTracks.map((ref) => `${ref.publication.trackSid}_${ref.publication.isSubscribed}`).join(),
    focusTrack?.publication?.trackSid,
    displayTracks,
    allowFocusLayout,
    layoutContext.pin,
  ]);

  if (!isWeb()) return null;

  const useFocusLayout = allowFocusLayout && !!focusTrack;

  return (
    <div className="lk-video-conference" style={{ height: "100%" }}>
      <StudentClassroomMediaSubscriptions enabled={useStudentView} />
      <LayoutContextProvider value={layoutContext}>
        <div className="lk-video-conference-inner">
          {!useFocusLayout ? (
            <div className="lk-grid-layout-wrapper">
              <GridLayout tracks={displayTracks}>
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
