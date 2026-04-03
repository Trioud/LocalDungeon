import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameDataService } from './GameDataService.js';
import type { IGameDataRepository } from '../ports/IGameDataRepository.js';

function makeRepo(): IGameDataRepository {
  return {
    getClasses: vi.fn(),
    getClassByName: vi.fn(),
    getSpecies: vi.fn(),
    getBackgrounds: vi.fn(),
    getFeats: vi.fn(),
    getSpells: vi.fn(),
    getSpellByName: vi.fn(),
    getWeapons: vi.fn(),
    getArmor: vi.fn(),
    getConditions: vi.fn(),
    getLanguages: vi.fn(),
  };
}

describe('GameDataService', () => {
  let repo: IGameDataRepository;
  let service: GameDataService;

  beforeEach(() => {
    repo = makeRepo();
    service = new GameDataService({ gameDataRepository: repo });
  });

  it('getSpells() delegates to repository', async () => {
    const spells = [{ name: 'Fireball' }] as never;
    vi.mocked(repo.getSpells).mockResolvedValue(spells);
    const result = await service.getSpells();
    expect(repo.getSpells).toHaveBeenCalledWith(undefined);
    expect(result).toBe(spells);
  });

  it('getSpells({ level: 1 }) passes filters through', async () => {
    vi.mocked(repo.getSpells).mockResolvedValue([]);
    await service.getSpells({ level: 1 });
    expect(repo.getSpells).toHaveBeenCalledWith({ level: 1 });
  });

  it('getClassByName returns null for unknown class', async () => {
    vi.mocked(repo.getClassByName).mockResolvedValue(null);
    const result = await service.getClassByName('Wizard');
    expect(result).toBeNull();
    expect(repo.getClassByName).toHaveBeenCalledWith('Wizard');
  });

  it('getClasses() delegates to repository', async () => {
    const classes = [{ name: 'Fighter' }] as never;
    vi.mocked(repo.getClasses).mockResolvedValue(classes);
    const result = await service.getClasses();
    expect(repo.getClasses).toHaveBeenCalled();
    expect(result).toBe(classes);
  });

  it('getConditions() delegates to repository', async () => {
    const conditions = [{ name: 'Blinded' }] as never;
    vi.mocked(repo.getConditions).mockResolvedValue(conditions);
    const result = await service.getConditions();
    expect(result).toBe(conditions);
  });
});
