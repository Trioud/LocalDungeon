'use client';
import { useEffect, useRef } from 'react';
import type { PeerState } from '@local-dungeon/shared';

interface AudioPlayerProps {
  peers: Map<string, PeerState>;
  audioStreams: Map<string, MediaStream>;
}

export default function AudioPlayer({ peers, audioStreams }: AudioPlayerProps) {
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  useEffect(() => {
    for (const [socketId, stream] of audioStreams) {
      const el = audioRefs.current.get(socketId);
      if (el && el.srcObject !== stream) {
        el.srcObject = stream;
      }
    }
  });

  return (
    <div aria-hidden="true" style={{ display: 'none' }}>
      {Array.from(peers.values()).map((peer) => {
        const stream = audioStreams.get(peer.socketId);
        return (
          <audio
            key={peer.socketId}
            autoPlay
            ref={(el) => {
              if (el) {
                audioRefs.current.set(peer.socketId, el);
                if (stream && el.srcObject !== stream) el.srcObject = stream;
              } else {
                audioRefs.current.delete(peer.socketId);
              }
            }}
          />
        );
      })}
    </div>
  );
}
