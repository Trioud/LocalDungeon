'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PeerState, WebRTCSignal } from '@local-dungeon/shared';
import { useSocket } from './useSocket';

const STUN_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

function buildIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [...STUN_SERVERS];
  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
  if (turnUrl) {
    servers.push({
      urls: turnUrl,
      username: process.env.NEXT_PUBLIC_TURN_USERNAME,
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
    });
  }
  return servers;
}

interface UseWebRTCProps {
  characterName: string;
}

export function useWebRTC({ characterName }: UseWebRTCProps) {
  const { socket } = useSocket();
  const [peers, setPeers] = useState<Map<string, PeerState>>(new Map());
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isInVoice, setIsInVoice] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [webrtcFailed, setWebrtcFailed] = useState(false);

  const isSupported =
    typeof RTCPeerConnection !== 'undefined' && typeof navigator !== 'undefined' && navigator.mediaDevices != null;

  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const gainNodesRef = useRef<Map<string, GainNode>>(new Map());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const vadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speakingRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updatePeer = useCallback((socketId: string, update: Partial<PeerState>) => {
    setPeers((prev) => {
      const next = new Map(prev);
      const existing = next.get(socketId);
      if (existing) {
        next.set(socketId, { ...existing, ...update });
      }
      return next;
    });
  }, []);

  const addPeer = useCallback((socketId: string, charName: string) => {
    setPeers((prev) => {
      const next = new Map(prev);
      if (!next.has(socketId)) {
        next.set(socketId, {
          socketId,
          characterName: charName,
          connected: false,
          muted: false,
          volume: 1,
          speaking: false,
        });
      }
      return next;
    });
  }, []);

  const removePeer = useCallback((socketId: string) => {
    const pc = peersRef.current.get(socketId);
    if (pc) {
      pc.close();
      peersRef.current.delete(socketId);
    }
    const audio = audioElementsRef.current.get(socketId);
    if (audio) {
      audio.srcObject = null;
      audio.remove();
      audioElementsRef.current.delete(socketId);
    }
    audioStreamsRef.current.delete(socketId);
    gainNodesRef.current.delete(socketId);
    setPeers((prev) => {
      const next = new Map(prev);
      next.delete(socketId);
      return next;
    });
  }, []);

  const createPeerConnection = useCallback(
    (socketId: string): RTCPeerConnection => {
      const pc = new RTCPeerConnection({ iceServers: buildIceServers() });

      // Add local tracks
      if (localStreamRef.current) {
        for (const track of localStreamRef.current.getTracks()) {
          pc.addTrack(track, localStreamRef.current);
        }
      }

      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          const signal: WebRTCSignal = {
            type: 'ice',
            candidate: JSON.stringify(event.candidate),
            fromSocketId: socket.id ?? '',
            toSocketId: socketId,
          };
          socket.emit('webrtc:signal', { signal });
        }
      };

      pc.ontrack = (event) => {
        const stream = event.streams[0];
        if (!stream) return;
        audioStreamsRef.current.set(socketId, stream);

        // Create hidden audio element
        let audio = audioElementsRef.current.get(socketId);
        if (!audio) {
          audio = document.createElement('audio');
          audio.autoplay = true;
          audio.style.display = 'none';
          document.body.appendChild(audio);
          audioElementsRef.current.set(socketId, audio);
        }
        audio.srcObject = stream;

        // Apply gain control via AudioContext
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioContext();
        }
        const ctx = audioCtxRef.current;
        const source = ctx.createMediaStreamSource(stream);
        const gain = ctx.createGain();
        source.connect(gain);
        gain.connect(ctx.destination);
        gainNodesRef.current.set(socketId, gain);
      };

      pc.onconnectionstatechange = () => {
        updatePeer(socketId, { connected: pc.connectionState === 'connected' });
      };

      peersRef.current.set(socketId, pc);
      return pc;
    },
    [socket, updatePeer],
  );

  const createOffer = useCallback(
    async (socketId: string) => {
      const pc = createPeerConnection(socketId);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        if (socket) {
          const signal: WebRTCSignal = {
            type: 'offer',
            sdp: offer.sdp ?? '',
            fromSocketId: socket.id ?? '',
            toSocketId: socketId,
          };
          socket.emit('webrtc:signal', { signal });
        }
      } catch {
        // ignore failed offer
      }
    },
    [createPeerConnection, socket],
  );

  const startVAD = useCallback(
    (stream: MediaStream) => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);

      const buffer = new Float32Array(analyser.fftSize);

      vadIntervalRef.current = setInterval(() => {
        analyser.getFloatTimeDomainData(buffer);
        let sum = 0;
        for (const sample of buffer) sum += sample * sample;
        const rms = Math.sqrt(sum / buffer.length);

        if (rms > 0.01) {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
          if (!speakingRef.current) {
            speakingRef.current = true;
            socket?.emit('webrtc:speaking', { speaking: true });
          }
        } else if (speakingRef.current && !silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            speakingRef.current = false;
            silenceTimerRef.current = null;
            socket?.emit('webrtc:speaking', { speaking: false });
          }, 500);
        }
      }, 100);
    },
    [socket],
  );

  const joinVoice = useCallback(async () => {
    if (!isSupported || !socket) {
      setWebrtcFailed(true);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsInVoice(true);
      socket.emit('webrtc:join_voice', { characterName });
      startVAD(stream);
    } catch {
      setWebrtcFailed(true);
    }
  }, [isSupported, socket, characterName, startVAD]);

  const leaveVoice = useCallback(() => {
    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    for (const [sid] of peersRef.current) {
      removePeer(sid);
    }
    if (localStreamRef.current) {
      for (const track of localStreamRef.current.getTracks()) track.stop();
      localStreamRef.current = null;
      setLocalStream(null);
    }
    socket?.emit('webrtc:leave_voice', {});
    setIsInVoice(false);
    setPeers(new Map());
  }, [removePeer, socket]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (localStreamRef.current) {
        for (const track of localStreamRef.current.getAudioTracks()) {
          track.enabled = !next;
        }
      }
      socket?.emit('webrtc:mute', { muted: next });
      return next;
    });
  }, [socket]);

  const setPeerVolume = useCallback((socketId: string, vol: number) => {
    const gain = gainNodesRef.current.get(socketId);
    if (gain) gain.gain.value = vol;
    updatePeer(socketId, { volume: vol });
  }, [updatePeer]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const onExistingPeers = (data: { peers: Array<{ socketId: string; characterName: string }> }) => {
      for (const peer of data.peers) {
        addPeer(peer.socketId, peer.characterName);
        createOffer(peer.socketId);
      }
    };

    const onPeerJoined = (data: { socketId: string; characterName: string }) => {
      addPeer(data.socketId, data.characterName);
      // Responder: wait for offer — no action here
    };

    const onPeerLeft = (data: { socketId: string }) => {
      removePeer(data.socketId);
    };

    const onSignal = async (data: { signal: WebRTCSignal }) => {
      const { signal } = data;
      const fromId = signal.fromSocketId;

      if (signal.type === 'offer') {
        let pc = peersRef.current.get(fromId);
        if (!pc) {
          pc = createPeerConnection(fromId);
        }
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: signal.sdp }));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        const answerSignal: WebRTCSignal = {
          type: 'answer',
          sdp: answer.sdp ?? '',
          fromSocketId: socket.id ?? '',
          toSocketId: fromId,
        };
        socket.emit('webrtc:signal', { signal: answerSignal });
      } else if (signal.type === 'answer') {
        const pc = peersRef.current.get(fromId);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signal.sdp }));
        }
      } else if (signal.type === 'ice') {
        const pc = peersRef.current.get(fromId);
        if (pc) {
          await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(signal.candidate)));
        }
      }
    };

    const onPeerMuted = (data: { socketId: string; muted: boolean }) => {
      updatePeer(data.socketId, { muted: data.muted });
    };

    const onPeerSpeaking = (data: { socketId: string; speaking: boolean }) => {
      updatePeer(data.socketId, { speaking: data.speaking });
    };

    socket.on('webrtc:existing_peers', onExistingPeers);
    socket.on('webrtc:peer_joined', onPeerJoined);
    socket.on('webrtc:peer_left', onPeerLeft);
    socket.on('webrtc:signal', onSignal);
    socket.on('webrtc:peer_muted', onPeerMuted);
    socket.on('webrtc:peer_speaking', onPeerSpeaking);

    return () => {
      socket.off('webrtc:existing_peers', onExistingPeers);
      socket.off('webrtc:peer_joined', onPeerJoined);
      socket.off('webrtc:peer_left', onPeerLeft);
      socket.off('webrtc:signal', onSignal);
      socket.off('webrtc:peer_muted', onPeerMuted);
      socket.off('webrtc:peer_speaking', onPeerSpeaking);
    };
  }, [socket, addPeer, removePeer, createPeerConnection, createOffer, updatePeer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isInVoice) leaveVoice();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    peers,
    audioStreams: audioStreamsRef.current,
    localStream,
    isInVoice,
    isMuted,
    isSupported,
    webrtcFailed,
    joinVoice,
    leaveVoice,
    toggleMute,
    setPeerVolume,
  };
}
