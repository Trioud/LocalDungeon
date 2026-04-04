export interface STTTranscriptChunk {
  text: string;
  isFinal: boolean;
  confidence: number;
  speakerId?: string;
}

export interface ISTTProvider {
  transcribeChunk(audioBuffer: Buffer, sampleRate: number): Promise<STTTranscriptChunk>;
  startStream(sessionId: string, onChunk: (chunk: STTTranscriptChunk) => void): Promise<string>;
  sendAudioToStream(streamId: string, audioBuffer: Buffer): Promise<void>;
  endStream(streamId: string): Promise<void>;
}
