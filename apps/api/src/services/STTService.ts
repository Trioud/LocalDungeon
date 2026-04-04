import type { ISTTProvider } from '../ports/ISTTProvider.js';

interface STTServiceDeps {
  sttProvider: ISTTProvider;
}

export class STTService {
  private sttProvider: ISTTProvider;
  private socketStreams = new Map<string, string>(); // socketId -> streamId
  private socketEmitters = new Map<string, (event: string, data: unknown) => void>(); // socketId -> emitter

  constructor({ sttProvider }: STTServiceDeps) {
    this.sttProvider = sttProvider;
  }

  async startListening(
    socketId: string,
    sessionId: string,
    emitToSocket: (event: string, data: unknown) => void,
    emitToRoom: (event: string, data: unknown) => void,
  ): Promise<{ streamId: string }> {
    if (this.socketStreams.has(socketId)) {
      await this.stopListening(socketId);
    }

    this.socketEmitters.set(socketId, emitToSocket);

    const streamId = await this.sttProvider.startStream(sessionId, (chunk) => {
      emitToSocket('voice:transcript', { text: chunk.text, isFinal: chunk.isFinal, confidence: chunk.confidence });
      if (chunk.isFinal && chunk.text.trim()) {
        emitToRoom('voice:speaking', { speakerSocketId: socketId, text: chunk.text });
      }
    });

    this.socketStreams.set(socketId, streamId);
    return { streamId };
  }

  async sendAudioChunk(socketId: string, audioBuffer: Buffer, _sampleRate: number): Promise<void> {
    const streamId = this.socketStreams.get(socketId);
    if (!streamId) return;
    await this.sttProvider.sendAudioToStream(streamId, audioBuffer);
  }

  async stopListening(socketId: string): Promise<void> {
    const streamId = this.socketStreams.get(socketId);
    if (streamId) {
      await this.sttProvider.endStream(streamId);
      this.socketStreams.delete(socketId);
    }
    this.socketEmitters.delete(socketId);
  }

  isListening(socketId: string): boolean {
    return this.socketStreams.has(socketId);
  }
}
