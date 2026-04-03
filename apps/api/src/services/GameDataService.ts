import type { IGameDataRepository, SpellFilters } from '../ports/IGameDataRepository.js';

interface Deps {
  gameDataRepository: IGameDataRepository;
}

export class GameDataService {
  private gameDataRepository: IGameDataRepository;

  constructor({ gameDataRepository }: Deps) {
    this.gameDataRepository = gameDataRepository;
  }

  getClasses() {
    return this.gameDataRepository.getClasses();
  }

  getClassByName(name: string) {
    return this.gameDataRepository.getClassByName(name);
  }

  getSpecies() {
    return this.gameDataRepository.getSpecies();
  }

  getBackgrounds() {
    return this.gameDataRepository.getBackgrounds();
  }

  getFeats(category?: string) {
    return this.gameDataRepository.getFeats(category);
  }

  getSpells(filters?: SpellFilters) {
    return this.gameDataRepository.getSpells(filters);
  }

  getSpellByName(name: string) {
    return this.gameDataRepository.getSpellByName(name);
  }

  getWeapons() {
    return this.gameDataRepository.getWeapons();
  }

  getArmor() {
    return this.gameDataRepository.getArmor();
  }

  getConditions() {
    return this.gameDataRepository.getConditions();
  }

  getLanguages() {
    return this.gameDataRepository.getLanguages();
  }
}
