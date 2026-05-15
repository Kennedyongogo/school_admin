import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { getSocketUrl } from "../utils/apiBaseUrl";

/** One socket per auth token — avoids reconnect loops when VideoConference remounts. */
const socketsByToken = new Map();

function getOrCreateSocket(token) {
  const key = String(token);
  const existing = socketsByToken.get(key);
  if (existing && !existing.disconnected) return existing;

  if (existing) {
    existing.removeAllListeners();
    existing.disconnect();
    socketsByToken.delete(key);
  }

  const instance = io(getSocketUrl(), {
    auth: { token },
    path: "/socket.io",
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 12,
  });
  socketsByToken.set(key, instance);
  return instance;
}

export function useSocket(token) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) {
      setSocket(null);
      setConnected(false);
      return undefined;
    }

    const instance = getOrCreateSocket(token);
    setSocket(instance);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onConnectError = () => setConnected(false);

    instance.on("connect", onConnect);
    instance.on("disconnect", onDisconnect);
    instance.on("connect_error", onConnectError);
    setConnected(instance.connected);

    return () => {
      instance.off("connect", onConnect);
      instance.off("disconnect", onDisconnect);
      instance.off("connect_error", onConnectError);
    };
  }, [token]);

  return { socket, connected };
}
