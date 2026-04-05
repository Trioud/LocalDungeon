import type { Redis } from 'ioredis';
import type { Env } from '../env.js';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OllamaResponse {
  message: { role: string; content: string };
  done: boolean;
}

const CAMPAIGN_SYSTEM_PROMPT = `You are the Dungeon Master for a D&D 5e 2024 campaign called "Hoard of the Dragon Queen" (part of Tyranny of Dragons).

CAMPAIGN CONTEXT:
- Setting: The Sword Coast, Faerûn (Forgotten Realms). The campaign runs between Baldur's Gate and Neverwinter.
- Main threat: The Cult of the Dragon, led by Severin Silrajin, seeks to summon Tiamat (five-headed dragon goddess) from the Nine Hells using five Dragon Masks and a massive treasure hoard.
- The adventure starts at Level 1 in the town of Greenest, which is being attacked by a blue dragon and Cult raiders.

KEY NPCS:
- Tarbaw Nighthill: Injured governor of Greenest (ally)
- Escobert the Red: Dwarf castellan of the keep (ally)
- Leosin Erlanthar: Half-elf Harper monk, captured by cult (rescue target)
- Rezmir: Half-black dragon Wyrmspeaker (villain)
- Severin Silrajin: Cult leader (distant villain)

OPENING SCENE:
The party travels the Uldoon Trail at dusk. Cresting a hill, they see Greenest below — columns of smoke rising from burning buildings, a dark winged shape (blue dragon Lennithon) circling the keep. The town is under attack.

DM RULES:
1. Narrate vividly but concisely (3-5 sentences max per response).
2. Always end with exactly 3 numbered choices the player can take (e.g., "1. Rush toward the keep. 2. Investigate the smoke. 3. Approach cautiously through the alleys.").
3. When a player picks a number or describes an action, narrate the outcome and consequences, then offer 3 new choices.
4. Apply D&D 5e 2024 rules — call for ability checks (e.g., "Roll Stealth DC 14") or saving throws when relevant. If the player rolls or tells you the result, use it.
5. Be dramatic, atmospheric, and fair. The players are heroes but danger is real.
6. Keep track of what the player has said/done in the conversation to maintain continuity.
7. If a player attempts something creative that isn't one of the listed choices, narrate a reasonable outcome.
8. Start the adventure with the opening scene when the conversation begins.`;

export class AIDMService {
  private redis: Redis;
  private ollamaUrl: string;
  private model: string;

  constructor({ redis, env }: { redis: Redis; env: Env }) {
    this.redis = redis;
    this.ollamaUrl = env.OLLAMA_URL;
    this.model = env.OLLAMA_MODEL;
  }

  private historyKey(sessionId: string): string {
    return `ai-dm:${sessionId}:history`;
  }

  async getHistory(sessionId: string): Promise<Message[]> {
    const raw = await this.redis.get(this.historyKey(sessionId));
    if (!raw) return [];
    try {
      return JSON.parse(raw) as Message[];
    } catch {
      return [];
    }
  }

  private async saveHistory(sessionId: string, messages: Message[]): Promise<void> {
    // Keep last 40 messages to avoid token overflow
    const trimmed = messages.slice(-40);
    await this.redis.set(this.historyKey(sessionId), JSON.stringify(trimmed), 'EX', 60 * 60 * 24);
  }

  async chat(sessionId: string, userMessage: string): Promise<string> {
    const history = await this.getHistory(sessionId);

    const isFirstMessage = history.length === 0;

    const messages: Message[] = [
      { role: 'system', content: CAMPAIGN_SYSTEM_PROMPT },
      ...history,
      ...(isFirstMessage
        ? [{ role: 'user' as const, content: 'Begin the adventure. Set the scene.' }]
        : [{ role: 'user' as const, content: userMessage }]),
    ];

    const response = await fetch(`${this.ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: false,
        options: { temperature: 0.8, num_ctx: 4096 },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw Object.assign(new Error(`Ollama error: ${err}`), { statusCode: 502 });
    }

    const data = (await response.json()) as OllamaResponse;
    const dmReply = data.message.content;

    // Save updated history (without system prompt — stored separately)
    const updatedHistory: Message[] = [
      ...history,
      { role: 'user', content: isFirstMessage ? 'Begin the adventure.' : userMessage },
      { role: 'assistant', content: dmReply },
    ];
    await this.saveHistory(sessionId, updatedHistory);

    return dmReply;
  }

  async resetHistory(sessionId: string): Promise<void> {
    await this.redis.del(this.historyKey(sessionId));
  }
}
