/** Scroll page: full-viewport video, then roster (host) and interactions below. */
export const eventLiveScrollRootSx = {
  flex: 1,
  minHeight: 0,
  width: "100%",
  overflowY: "auto",
  overflowX: "hidden",
  WebkitOverflowScrolling: "touch",
};

export const eventLiveVideoViewportSx = {
  width: "100%",
  flexShrink: 0,
  position: "relative",
  bgcolor: "#0b1220",
  minHeight: { xs: "min(100dvh, 720px)", md: "calc(100dvh - 10.5rem)" },
  height: { md: "calc(100dvh - 10.5rem)" },
};

export const eventLiveRosterSectionSx = {
  width: "100%",
  flexShrink: 0,
  minHeight: 300,
  maxHeight: { md: 420 },
  borderTop: 1,
  borderColor: "divider",
  bgcolor: "background.paper",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};
