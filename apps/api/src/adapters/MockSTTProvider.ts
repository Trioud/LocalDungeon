import { randomUUID } from 'crypto';
import type { ISTTProvider, STTTranscriptChunk } from '../ports/ISTTProvider.js';

export class MockSTTProvider implements ISTTProvider {
  private streams = new Map<string, (chunk: STTTranscriptChunk) => void>();

  async transcribeChunk(_audioBuffer: Buffer, _sampleRate: number): Promise<STTTranscriptChunk> {
    return { text: 'mock transcript', isFinal: true, confidence: 0.99 };
  }

  async startStream(_sessionId: string, onChunk: (chunk: STTTranscriptChunk) => void): Promise<string> {
    const streamId = randomUUID();
    this.streams.set(streamId, onChunk);
    return streamId;
  }

  async sendAudioToStream(_streamId: string, _audioBuffer: Buffer): Promise<void> {
    // no-op for mock
  }

  async endStream(streamId: string): Promise<void> {
    this.streams.delete(streamId);
  }

  simulateChunk(streamId: string, text: string): void {
    const onChunk = this.streams.get(streamId);
    if (onChunk) {
      onChunk({ text, isFinal: true, confidence: 0.99 });
    }
  }
}
