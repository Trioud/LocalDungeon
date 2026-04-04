import { describe, it, expect, beforeEach, vi } from 'vitest';
import { STTService } from './STTService.js';
import { MockSTTProvider } from '../adapters/MockSTTProvider.js';

describe('STTService', () => {
  let sttService: STTService;
  let mockProvider: MockSTTProvider;

  beforeEach(() => {
    mockProvider = new MockSTTProvider();
    sttService = new STTService({ sttProvider: mockProvider });
  });

  it('starts listening and returns streamId', async () => {
    const emitToSocket = vi.fn();
    const emitToRoom = vi.fn();
    const result = await sttService.startListening('socket1', 'session1', emitToSocket, emitToRoom);
    expect(result.streamId).toBeDefined();
    expect(typeof result.streamId).toBe('string');
  });

  it('reports isListening true after startListening', async () => {
    const emitToSocket = vi.fn();
    const emitToRoom = vi.fn();
    await sttService.startListening('socket1', 'session1', emitToSocket, emitToRoom);
    expect(sttService.isListening('socket1')).toBe(true);
  });

  it('reports isListening false before startListening', () => {
    expect(sttService.isListening('socket1')).toBe(false);
  });

  it('emits voice:transcript when chunk arrives', async () => {
    const emitToSocket = vi.fn();
    const emitToRoom = vi.fn();
    const { streamId } = await sttService.startListening('socket1', 'session1', emitToSocket, emitToRoom);
    mockProvider.simulateChunk(streamId, 'I attack');
    expect(emitToSocket).toHaveBeenCalledWith('voice:transcript', expect.objectContaining({ text: 'I attack', isFinal: true }));
  });

  it('emits voice:speaking to room when chunk is final', async () => {
    const emitToSocket = vi.fn();
    const emitToRoom = vi.fn();
    const { streamId } = await sttService.startListening('socket1', 'session1', emitToSocket, emitToRoom);
    mockProvider.simulateChunk(streamId, 'I roll perception');
    expect(emitToRoom).toHaveBeenCalledWith('voice:speaking', expect.objectContaining({ speakerSocketId: 'socket1', text: 'I roll perception' }));
  });

  it('stops listening and cleans up stream', async () => {
    const emitToSocket = vi.fn();
    const emitToRoom = vi.fn();
    await sttService.startListening('socket1', 'session1', emitToSocket, emitToRoom);
    await sttService.stopListening('socket1');
    expect(sttService.isListening('socket1')).toBe(false);
  });

  it('stopListening is a no-op when not listening', async () => {
    await expect(sttService.stopListening('socket1')).resolves.toBeUndefined();
  });

  it('replaces existing stream when startListening called twice', async () => {
    const emitToSocket = vi.fn();
    const emitToRoom = vi.fn();
    await sttService.startListening('socket1', 'session1', emitToSocket, emitToRoom);
    const { streamId: streamId2 } = await sttService.startListening('socket1', 'session1', emitToSocket, emitToRoom);
    expect(sttService.isListening('socket1')).toBe(true);
    expect(streamId2).toBeDefined();
  });

  it('sendAudioChunk is a no-op when not listening', async () => {
    await expect(sttService.sendAudioChunk('socket1', Buffer.from([]), 16000)).resolves.toBeUndefined();
  });
});
