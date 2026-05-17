/** API + socket config for event live vs staff admin meeting live. */
export function getLiveSessionApi({ eventId, meetingId }) {
  if (meetingId) {
    const id = String(meetingId);
    return {
      id,
      base: `/api/admin-meetings/${encodeURIComponent(id)}`,
      joinSocket: "join:admin-meeting",
      leaveSocket: "leave:admin-meeting",
      idField: "meeting_id",
      events: {
        lobbyUpdate: "admin-meeting-lobby:update",
        lobbyStatus: "admin-meeting-lobby:status",
        chatNew: "admin-meeting-chat:new",
        chatSync: "admin-meeting-chat:sync",
        handUpdate: "admin-meeting-hand:update",
        reaction: "admin-meeting-reaction",
        liveEnded: "admin-meeting-live:ended",
        liveStarted: "admin-meeting-live:started",
      },
    };
  }
  const id = String(eventId);
  return {
    id,
    base: `/api/events/${encodeURIComponent(id)}`,
    joinSocket: "join:event",
    leaveSocket: "leave:event",
    idField: "event_id",
    events: {
      lobbyUpdate: "event-lobby:update",
      lobbyStatus: "event-lobby:status",
      chatNew: "event-chat:new",
      chatSync: "event-chat:sync",
      handUpdate: "event-hand:update",
      reaction: "event-reaction",
      liveEnded: "event-live:ended",
      liveStarted: "event-live:started",
    },
  };
}
