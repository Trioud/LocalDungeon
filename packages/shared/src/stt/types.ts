export interface VoiceTranscriptEvent {
  sessionId: string;
  speakerCharacterId: string;
  speakerName: string;
  text: string;
  isFinal: boolean;
  timestamp: number;
}

export type VoiceMode = 'push_to_talk' | 'continuous';
