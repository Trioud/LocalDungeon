export type WebRTCSignal =
  | { type: 'offer'; sdp: string; fromSocketId: string; toSocketId: string }
  | { type: 'answer'; sdp: string; fromSocketId: string; toSocketId: string }
  | { type: 'ice'; candidate: string; fromSocketId: string; toSocketId: string };

export interface PeerState {
  socketId: string;
  characterName: string;
  connected: boolean;
  muted: boolean;
  volume: number;
  speaking: boolean;
}

// Compatible with RTCIceServer (DOM) without requiring DOM lib in shared
export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface WebRTCConfig {
  iceServers: IceServer[];
}
