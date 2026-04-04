import { DeepgramClient } from '@deepgram/sdk';
import { randomUUID } from 'crypto';
import type { ISTTProvider, STTTranscriptChunk } from '../ports/ISTTProvider.js';

const DND_KEYWORDS = [
  'attack', 'roll', 'perception', 'stealth', 'initiative', 'advantage', 'disadvantage',
  'saving throw', 'spell slot', 'concentration', 'hit points', 'armor class', 'proficiency',
  'barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger',
  'rogue', 'sorcerer', 'warlock', 'wizard',
  'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma',
  'blinded', 'charmed', 'deafened', 'exhaustion', 'frightened', 'grappled',
  'incapacitated', 'invisible', 'paralyzed', 'petrified', 'poisoned', 'prone',
  'restrained', 'stunned', 'unconscious',
];

interface DeepgramSTTProviderConfig {
  apiKey: string;
}

export class DeepgramSTTProvider implements ISTTProvider {
  private client: DeepgramClient;
  private liveConnections = new Map<string, any>();

  constructor({ apiKey }: DeepgramSTTProviderConfig) {
    this.client = new DeepgramClient({ apiKey });
  }

  async transcribeChunk(audioBuffer: Buffer, _sampleRate: number): Promise<STTTranscriptChunk> {
    const response = await this.client.listen.v1.media.transcribeFile(audioBuffer, {
      model: 'nova-2',
      language: 'en',
      smart_format: true,
      keywords: DND_KEYWORDS,
    } as any);

    const transcript = (response as any).data?.results?.channels?.[0]?.alternatives?.[0];
    return {
      text: transcript?.transcript ?? '',
      isFinal: true,
      confidence: transcript?.confidence ?? 0,
    };
  }

  async startStream(sessionId: string, onChunk: (chunk: STTTranscriptChunk) => void): Promise<string> {
    const streamId = randomUUID();

    const connection = await this.client.listen.v1.connect({
      model: 'nova-2',
      language: 'en',
      smart_format: true,
      interim_results: true,
      keywords: DND_KEYWORDS,
    } as any);

    connection.on('message', (data: any) => {
      if (data?.type === 'Results') {
        const alt = data?.channel?.alternatives?.[0];
        if (alt) {
          onChunk({
            text: alt.transcript ?? '',
            isFinal: data.is_final ?? false,
            confidence: alt.confidence ?? 0,
            speakerId: sessionId,
          });
        }
      }
    });

    this.liveConnections.set(streamId, connection);
    return streamId;
  }

  async sendAudioToStream(streamId: string, audioBuffer: Buffer): Promise<void> {
    const connection = this.liveConnections.get(streamId);
    if (connection) {
      connection.socket.send(audioBuffer);
    }
  }

  async endStream(streamId: string): Promise<void> {
    const connection = this.liveConnections.get(streamId);
    if (connection) {
      connection.sendCloseStream({ type: 'CloseStream' });
      this.liveConnections.delete(streamId);
    }
  }
}
