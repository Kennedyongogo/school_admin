import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_ICE = [{ urls: "stun:stun.l.google.com:19302" }];

function iceServersKey(iceServers) {
  try {
    return JSON.stringify(iceServers ?? null);
  } catch {
    return "default";
  }
}

/** Lower socket id yields to incoming offer (perfect negotiation). */
function isPolite(localSocketId, remoteSocketId) {
  return String(localSocketId || "") < String(remoteSocketId || "");
}

export function useWebRTC({ socket, iceServers, enabled }) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(() => new Map());
  const peerConnections = useRef(new Map());
  const pendingCandidates = useRef(new Map());
  const localStreamRef = useRef(null);
  const socketRef = useRef(socket);
  const configRef = useRef({ iceServers: DEFAULT_ICE });

  socketRef.current = socket;
  configRef.current = {
    iceServers: Array.isArray(iceServers) && iceServers.length ? iceServers : DEFAULT_ICE,
  };

  const handlersRef = useRef({});

  const stopLocalStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
  }, []);

  const initLocalStream = useCallback(async (opts = {}) => {
    const wantVideo = opts.video !== false;
    const wantAudio = opts.audio !== false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: wantVideo,
        audio: wantAudio,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (firstErr) {
      if (wantVideo && wantAudio) {
        try {
          const audioOnly = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          localStreamRef.current = audioOnly;
          setLocalStream(audioOnly);
          return audioOnly;
        } catch {
          throw firstErr;
        }
      }
      throw firstErr;
    }
  }, []);

  const closePeer = useCallback((remoteSocketId) => {
    const pc = peerConnections.current.get(remoteSocketId);
    if (pc) {
      pc.close();
      peerConnections.current.delete(remoteSocketId);
    }
    pendingCandidates.current.delete(remoteSocketId);
    setRemoteStreams((prev) => {
      if (!prev.has(remoteSocketId)) return prev;
      const next = new Map(prev);
      next.delete(remoteSocketId);
      return next;
    });
  }, []);

  const flushPendingCandidates = useCallback(async (remoteSocketId, pc) => {
    const queued = pendingCandidates.current.get(remoteSocketId);
    if (!queued?.length || !pc?.remoteDescription) return;
    pendingCandidates.current.delete(remoteSocketId);
    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // ignore stale candidates
      }
    }
  }, []);

  const createPeerConnection = useCallback((remoteSocketId, stream) => {
    if (peerConnections.current.has(remoteSocketId)) {
      return peerConnections.current.get(remoteSocketId);
    }
    const pc = new RTCPeerConnection(configRef.current);
    const media = stream || localStreamRef.current;
    if (media) {
      media.getTracks().forEach((track) => pc.addTrack(track, media));
    }
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("ice-candidate", { to: remoteSocketId, candidate: event.candidate });
      }
    };
    pc.ontrack = (event) => {
      setRemoteStreams((prev) => {
        let remote = prev.get(remoteSocketId);
        const tracks = event.streams[0]?.getTracks() || [];
        if (!tracks.length) return prev;

        let changed = false;
        if (!remote) {
          remote = new MediaStream();
          changed = true;
        }
        for (const track of tracks) {
          if (!remote.getTracks().some((t) => t.id === track.id)) {
            remote.addTrack(track);
            changed = true;
          }
        }
        if (!changed) return prev;

        const next = new Map(prev);
        next.set(remoteSocketId, remote);
        return next;
      });
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        closePeer(remoteSocketId);
      }
    };
    peerConnections.current.set(remoteSocketId, pc);
    return pc;
  }, [closePeer]);

  const callUser = useCallback(async (remoteSocketId) => {
    if (!socketRef.current) return;
    const existing = peerConnections.current.get(remoteSocketId);
    if (existing) {
      const state = existing.signalingState;
      if (state === "stable" || state === "have-local-offer" || state === "have-remote-offer") {
        return;
      }
    }
    const pc = createPeerConnection(remoteSocketId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current.emit("offer", { to: remoteSocketId, offer: pc.localDescription });
  }, [createPeerConnection]);

  handlersRef.current = {
    offer: async ({ from, offer }) => {
      if (!socketRef.current || !from || !offer) return;
      const polite = isPolite(socketRef.current.id, from);
      let pc = peerConnections.current.get(from);

      if (pc?.signalingState === "have-local-offer") {
        if (!polite) return;
        try {
          await pc.setLocalDescription({ type: "rollback" });
        } catch {
          closePeer(from);
          pc = createPeerConnection(from);
        }
      } else if (!pc) {
        pc = createPeerConnection(from);
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketRef.current.emit("answer", { to: from, answer: pc.localDescription });
        await flushPendingCandidates(from, pc);
      } catch {
        closePeer(from);
      }
    },
    answer: async ({ from, answer }) => {
      const pc = peerConnections.current.get(from);
      if (!pc || !answer) return;
      try {
        if (pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          await flushPendingCandidates(from, pc);
        }
      } catch {
        closePeer(from);
      }
    },
    iceCandidate: async ({ from, candidate }) => {
      if (!from || !candidate) return;
      const pc = peerConnections.current.get(from);
      if (!pc?.remoteDescription) {
        const q = pendingCandidates.current.get(from) || [];
        q.push(candidate);
        pendingCandidates.current.set(from, q);
        return;
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // ignore
      }
    },
  };

  const cleanupPeers = useCallback(() => {
    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();
    pendingCandidates.current.clear();
    setRemoteStreams((prev) => (prev.size === 0 ? prev : new Map()));
  }, []);

  useEffect(() => {
    if (!socket || !enabled) return undefined;

    const onOffer = (payload) => handlersRef.current.offer(payload);
    const onAnswer = (payload) => handlersRef.current.answer(payload);
    const onIce = (payload) => handlersRef.current.iceCandidate(payload);

    socket.on("offer", onOffer);
    socket.on("answer", onAnswer);
    socket.on("ice-candidate", onIce);

    return () => {
      socket.off("offer", onOffer);
      socket.off("answer", onAnswer);
      socket.off("ice-candidate", onIce);
    };
  }, [socket, enabled, iceServersKey(iceServers)]);

  return {
    localStream,
    remoteStreams,
    initLocalStream,
    callUser,
    closePeer,
    cleanupPeers,
    stopLocalStream,
  };
}
