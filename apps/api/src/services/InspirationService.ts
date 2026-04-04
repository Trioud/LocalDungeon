import type { ICharacterRepository } from '../ports/ICharacterRepository.js';

interface InspirationServiceDeps {
  characterRepository: ICharacterRepository;
}

export class InspirationService {
  private characterRepository: ICharacterRepository;

  constructor({ characterRepository }: InspirationServiceDeps) {
    this.characterRepository = characterRepository;
  }

  async getInspiration(characterId: string): Promise<boolean> {
    const character = await this.characterRepository.findById(characterId);
    if (!character) {
      throw Object.assign(new Error('Character not found'), { statusCode: 404 });
    }
    return character.heroicInspiration;
  }

  async grantInspiration(characterId: string): Promise<void> {
    const character = await this.characterRepository.findById(characterId);
    if (!character) {
      throw Object.assign(new Error('Character not found'), { statusCode: 404 });
    }
    await this.characterRepository.setInspiration(characterId, true);
  }

  async useInspiration(characterId: string): Promise<void> {
    const has = await this.getInspiration(characterId);
    if (!has) {
      throw Object.assign(new Error('Character does not have Heroic Inspiration'), { statusCode: 400 });
    }
    await this.characterRepository.setInspiration(characterId, false);
  }

  async giftInspiration(fromCharacterId: string, toCharacterId: string): Promise<void> {
    const hasFrom = await this.getInspiration(fromCharacterId);
    if (!hasFrom) {
      throw Object.assign(new Error('Giver does not have Heroic Inspiration'), { statusCode: 400 });
    }
    const hasTo = await this.getInspiration(toCharacterId);
    if (hasTo) {
      throw Object.assign(new Error('Recipient already has Heroic Inspiration'), { statusCode: 400 });
    }
    await this.characterRepository.setInspiration(fromCharacterId, false);
    await this.characterRepository.setInspiration(toCharacterId, true);
  }
}
