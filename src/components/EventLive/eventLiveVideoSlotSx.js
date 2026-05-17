/** LiveKit video fills the scroll viewport section above roster and chat. */
export const eventLiveVideoSlotSx = {
  width: "100%",
  height: "100%",
  minHeight: "100%",
  position: "relative",
  overflow: "hidden",
  "& .lk-video-conference": {
    height: "100%",
    maxHeight: "100%",
    overflow: "hidden",
  },
  "& .lk-grid-layout": {
    maxHeight: "100%",
    overflow: "hidden",
  },
  "& .lk-chat": { display: "none !important" },
  "& .lk-control-bar": { display: "none !important" },
};

/** @param {{ isHost?: boolean }} opts */
export function getEventLiveVideoSlotSx({ isHost = true } = {}) {
  return {
    ...eventLiveVideoSlotSx,
    ...(!isHost
      ? {
          "& .lk-focus-toggle-button": { display: "none !important" },
          "& .lk-focus-layout-wrapper": { display: "none !important" },
        }
      : {}),
  };
}
