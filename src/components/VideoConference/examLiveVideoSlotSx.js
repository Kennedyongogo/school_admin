/** Video grid fills the exam invigilation viewport (many student tiles). */
export const examLiveVideoSlotSx = {
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  bgcolor: "#0b1220",
  "& .lk-video-conference": {
    position: "absolute",
    inset: 0,
    height: "100%",
    width: "100%",
    display: "flex",
    flexDirection: "column",
  },
  "& .lk-video-conference-inner": {
    flex: 1,
    minHeight: 0,
    height: "100%",
    width: "100%",
    display: "flex",
    flexDirection: "column",
  },
  "& .lk-grid-layout-wrapper": {
    flex: 1,
    minHeight: 0,
    height: "100%",
    width: "100%",
    overflow: "hidden",
  },
  "& .lk-grid-layout": {
    height: "100% !important",
    width: "100% !important",
    minHeight: "100%",
    alignContent: "stretch",
    alignItems: "stretch",
  },
  "& .lk-focus-layout-wrapper": {
    flex: 1,
    minHeight: 0,
    height: "100%",
    width: "100%",
  },
  "& .lk-focus-layout": {
    height: "100%",
  },
  "& .lk-participant-tile": {
    height: "100%",
    minHeight: 0,
    borderRadius: 1,
  },
  "& .lk-participant-tile video": {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  "& .lk-chat": { display: "none !important" },
  "& .lk-control-bar": { display: "none !important" },
};
