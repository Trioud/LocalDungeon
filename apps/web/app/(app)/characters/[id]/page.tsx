'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import InlineEdit from '@/components/ui/InlineEdit.js';
import { useCharacter, usePatchCharacter } from '@/lib/hooks/useCharacter.js';
import type { Character } from '@/lib/api/characters.js';

const SPELLCASTER_CLASSES = ['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard'];

const ABILITY_KEYS: Array<keyof Character['abilityScores']> = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const ABILITY_LABELS: Record<string, string> = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' };
const ABILITY_FULL: Record<string, string> = { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' };

const SKILLS: Array<{ name: string; ability: keyof Character['abilityScores'] }> = [
  { name: 'Acrobatics', ability: 'dex' },
  { name: 'Animal Handling', ability: 'wis' },
  { name: 'Arcana', ability: 'int' },
  { name: 'Athletics', ability: 'str' },
  { name: 'Deception', ability: 'cha' },
  { name: 'History', ability: 'int' },
  { name: 'Insight', ability: 'wis' },
  { name: 'Intimidation', ability: 'cha' },
  { name: 'Investigation', ability: 'int' },
  { name: 'Medicine', ability: 'wis' },
  { name: 'Nature', ability: 'int' },
  { name: 'Perception', ability: 'wis' },
  { name: 'Performance', ability: 'cha' },
  { name: 'Persuasion', ability: 'cha' },
  { name: 'Religion', ability: 'int' },
  { name: 'Sleight of Hand', ability: 'dex' },
  { name: 'Stealth', ability: 'dex' },
  { name: 'Survival', ability: 'wis' },
];

function modifier(score: number) {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function ProfDot({ active, onClick }: { active: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 transition-colors ${active ? 'bg-yellow-400 border-yellow-400' : 'bg-transparent border-gray-500'} ${onClick ? 'cursor-pointer hover:border-yellow-300' : 'cursor-default'}`}
    />
  );
}

type Tab = 'stats' | 'combat' | 'spells' | 'inventory' | 'features' | 'profile';

export default function CharacterSheetPage() {
  const params = useParams();
  const id = String(params.id);
  const { data: character, isLoading, error } = useCharacter(id);
  const { mutate: patch, isPending } = usePatchCharacter(id);
  const [activeTab, setActiveTab] = useState<Tab>('stats');
  const [toast, setToast] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const showError = (msg: string) => {
    setToast({ type: 'error', message: msg });
    setTimeout(() => setToast(null), 3000);
  };

  const safePatch = (p: Partial<Character>) =>
    new Promise<void>((resolve, reject) => {
      patch(p, {
        onSuccess: () => resolve(),
        onError: (e: unknown) => {
          showError('Failed to save');
          reject(e);
        },
      });
    });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-800 rounded-lg p-6 animate-pulse h-40" />
        <div className="bg-gray-800 rounded-lg p-6 animate-pulse h-24" />
        <div className="bg-gray-800 rounded-lg p-6 animate-pulse h-64" />
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400 text-lg">Character not found.</p>
      </div>
    );
  }

  const isSpellcaster = SPELLCASTER_CLASSES.includes(character.className);
  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'stats', label: 'Stats' },
    { key: 'combat', label: 'Combat' },
    ...(isSpellcaster ? [{ key: 'spells' as Tab, label: 'Spells' }] : []),
    { key: 'inventory', label: 'Inventory' },
    { key: 'features', label: 'Features' },
    { key: 'profile', label: 'Profile' },
  ];

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg text-sm font-medium ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {toast.message}
        </div>
      )}
      {isPending && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg text-sm font-medium bg-gray-700 text-gray-200 flex items-center gap-2">
          <span className="animate-spin">⟳</span> Saving…
        </div>
      )}

      {/* Identity Block */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex gap-5 items-start flex-wrap">
          {/* Portrait */}
          <div className="w-20 h-20 rounded-full bg-gray-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 overflow-hidden">
            {character.portraitUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={character.portraitUrl} alt={character.name} className="w-full h-full object-cover" />
            ) : (
              character.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white">
                <InlineEdit value={character.name} onSave={(v) => safePatch({ name: v })} className="text-2xl font-bold" />
              </h1>
              {character.isBloodied && (
                <span className="bg-red-900/60 text-red-300 text-xs px-2 py-0.5 rounded border border-red-700">🩸 Bloodied</span>
              )}
              <button
                onClick={() => patch({ heroicInspiration: !character.heroicInspiration })}
                className={`text-xs px-3 py-1 rounded border transition-colors ${character.heroicInspiration ? 'bg-yellow-400/20 text-yellow-300 border-yellow-500' : 'bg-gray-700 text-gray-400 border-gray-600 hover:border-yellow-500'}`}
              >
                ⚡ {character.heroicInspiration ? 'Inspired' : 'No Inspiration'}
              </button>
            </div>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <span className="text-yellow-300 font-medium">{character.className}</span>
              {character.subclassName && <span className="text-yellow-300/70">({character.subclassName})</span>}
              <span className="bg-yellow-400/20 text-yellow-300 text-xs px-2 py-0.5 rounded">Level {character.level}</span>
            </div>
            <div className="mt-1 text-gray-400 text-sm flex gap-3 flex-wrap">
              <span>{character.backgroundName}</span>
              <span>·</span>
              <span>{character.speciesName}</span>
              <span>·</span>
              <InlineEdit value={character.alignment} onSave={(v) => safePatch({ alignment: v })} className="text-gray-400 text-sm" />
            </div>
          </div>
        </div>
        {/* XP bar placeholder */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>XP</span><span>—</span>
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full" />
        </div>
      </div>

      {/* Core Stats Bar */}
      <div className="bg-gray-800 rounded-lg px-4 py-4 border border-gray-700">
        <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
          <StatBox label="AC" value={String(character.derivedStats.ac)} />
          <StatBox label="Initiative" value={character.derivedStats.initiative >= 0 ? `+${character.derivedStats.initiative}` : `${character.derivedStats.initiative}`} />
          <StatBox label="Speed" value={`${character.derivedStats.speed} ft`} />
          <div className="bg-gray-700/60 rounded-lg p-2 text-center">
            <div className="text-xs text-gray-400 mb-1">HP</div>
            <div className="text-sm font-bold text-white flex items-center justify-center gap-1">
              <InlineEdit value={character.currentHP} onSave={(v) => safePatch({ currentHP: Number(v) })} type="number" className="text-sm font-bold text-white w-10" />
              <span className="text-gray-500">/</span>
              <span>{character.maxHP}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Temp: <InlineEdit value={character.tempHP} onSave={(v) => safePatch({ tempHP: Number(v) })} type="number" className="text-xs text-gray-400 w-8" />
            </div>
          </div>
          <StatBox label="Hit Dice" value={`${character.level}d${character.hitDie}`} />
          <StatBox label="Prof. Bonus" value={`+${character.derivedStats.proficiencyBonus}`} />
          <StatBox label="Passive Perc." value={String(character.derivedStats.passivePerception)} />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-700">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === t.key ? 'text-yellow-400 border-b-2 border-yellow-400 bg-gray-700/40' : 'text-gray-400 hover:text-white'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="p-5">
          {activeTab === 'stats' && <StatsTab character={character} safePatch={safePatch} />}
          {activeTab === 'combat' && <CombatTab character={character} safePatch={safePatch} />}
          {activeTab === 'spells' && <SpellsTab character={character} />}
          {activeTab === 'inventory' && <InventoryTab character={character} safePatch={safePatch} />}
          {activeTab === 'features' && <FeaturesTab character={character} />}
          {activeTab === 'profile' && <ProfileTab character={character} safePatch={safePatch} />}
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-700/60 rounded-lg p-2 text-center">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="text-sm font-bold text-white">{value}</div>
    </div>
  );
}

function StatsTab({ character, safePatch }: { character: Character; safePatch: (p: Partial<Character>) => Promise<void> }) {
  return (
    <div className="space-y-6">
      {/* Ability Scores */}
      <section>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Ability Scores</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {ABILITY_KEYS.map(key => {
            const score = character.abilityScores[key];
            return (
              <div key={key} className="bg-gray-700 rounded-lg p-3 text-center border border-gray-600">
                <div className="text-yellow-400 font-bold text-lg">{modifier(score)}</div>
                <InlineEdit
                  value={score}
                  type="number"
                  onSave={(v) => {
                    const num = Math.max(1, Math.min(30, Number(v)));
                    return safePatch({ abilityScores: { ...character.abilityScores, [key]: num } });
                  }}
                  className="text-white text-base font-semibold"
                />
                <div className="text-xs text-gray-400 mt-1">{ABILITY_LABELS[key]}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Saving Throws */}
      <section>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Saving Throws</h3>
        <div className="space-y-1.5">
          {ABILITY_KEYS.map(key => {
            const isProficient = character.proficiencies.savingThrows.includes(ABILITY_FULL[key]);
            const mod = Math.floor((character.abilityScores[key] - 10) / 2) + (isProficient ? character.derivedStats.proficiencyBonus : 0);
            const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
            return (
              <div key={key} className="flex items-center gap-3 py-1">
                <ProfDot
                  active={isProficient}
                  onClick={() => {
                    const current = character.proficiencies.savingThrows;
                    const full = ABILITY_FULL[key];
                    const next = isProficient ? current.filter(s => s !== full) : [...current, full];
                    safePatch({ proficiencies: { ...character.proficiencies, savingThrows: next } });
                  }}
                />
                <span className="text-gray-300 text-sm w-6 text-right font-mono">{modStr}</span>
                <span className="text-gray-300 text-sm">{ABILITY_FULL[key]}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Skills */}
      <section>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Skills</h3>
        <div className="space-y-1">
          {SKILLS.map(skill => {
            const skillKey = skill.name.toLowerCase().replace(/ /g, '');
            const skillKey2 = skill.name.toLowerCase().replace(/ /g, '_');
            const derived = character.derivedStats.skills[skill.name] ?? character.derivedStats.skills[skillKey] ?? character.derivedStats.skills[skillKey2];
            const isProficient = character.proficiencies.skills.includes(skill.name);
            const hasExpertise = derived?.expertise ?? false;
            const mod = derived?.modifier ?? (Math.floor((character.abilityScores[skill.ability] - 10) / 2));
            const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
            return (
              <div key={skill.name} className="flex items-center gap-3 py-0.5">
                <ProfDot active={isProficient || hasExpertise} />
                <ProfDot active={hasExpertise} />
                <span className="text-gray-300 text-sm w-6 text-right font-mono">{modStr}</span>
                <span className="text-gray-300 text-sm flex-1">{skill.name}</span>
                <span className="text-gray-500 text-xs">({ABILITY_LABELS[skill.ability]})</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function CombatTab({ character, safePatch }: { character: Character; safePatch: (p: Partial<Character>) => Promise<void> }) {
  const strMod = Math.floor((character.abilityScores.str - 10) / 2);

  return (
    <div className="space-y-6">
      {/* Attacks */}
      <section>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Attacks</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-700">
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium">Attack Bonus</th>
              <th className="pb-2 font-medium">Damage</th>
              <th className="pb-2 font-medium">Type</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-700/50 text-gray-300">
              <td className="py-2">Unarmed Strike</td>
              <td className="py-2">{`+${strMod + character.derivedStats.proficiencyBonus}`}</td>
              <td className="py-2">{`${1 + strMod} bludgeoning`}</td>
              <td className="py-2 text-gray-500">Bludgeoning</td>
            </tr>
            {character.inventory.items.filter(i => i.equipped).map((item, idx) => (
              <tr key={idx} className="border-b border-gray-700/50 text-gray-300">
                <td className="py-2">{item.name}</td>
                <td className="py-2 text-gray-500">—</td>
                <td className="py-2 text-gray-500">—</td>
                <td className="py-2 text-gray-500">—</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Conditions */}
      <section>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Conditions</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {character.conditions.length === 0 && <span className="text-gray-500 text-sm italic">No active conditions</span>}
          {character.conditions.map(cond => (
            <span key={cond} className="inline-flex items-center gap-1 bg-purple-900/50 text-purple-300 text-xs px-2 py-1 rounded border border-purple-700">
              {cond}
              <button
                onClick={() => safePatch({ conditions: character.conditions.filter(c => c !== cond) })}
                className="ml-1 hover:text-red-400"
              >×</button>
            </span>
          ))}
        </div>
        <AddConditionInput character={character} safePatch={safePatch} />
      </section>

      {/* Exhaustion */}
      <section>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Exhaustion</h3>
        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <button
                key={i}
                onClick={() => safePatch({ exhaustionLevel: i < character.exhaustionLevel ? i : i + 1 })}
                className={`w-8 h-8 rounded text-xs font-bold border transition-colors ${i < character.exhaustionLevel ? 'bg-red-600/70 border-red-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-500'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <span className="text-gray-400 text-sm">Level {character.exhaustionLevel}/6</span>
          {character.exhaustionLevel > 0 && (
            <button onClick={() => safePatch({ exhaustionLevel: 0 })} className="text-xs text-gray-500 hover:text-gray-300">Reset</button>
          )}
        </div>
        {character.exhaustionLevel > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            {character.exhaustionLevel <= 4
              ? `−${character.exhaustionLevel * 2} to all D20 Tests`
              : character.exhaustionLevel === 5
              ? '−10 to all D20 Tests; Speed halved'
              : 'Dead from exhaustion'}
          </p>
        )}
      </section>
    </div>
  );
}

function AddConditionInput({ character, safePatch }: { character: Character; safePatch: (p: Partial<Character>) => Promise<void> }) {
  const CONDITIONS = ['Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled', 'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious'];
  const [selected, setSelected] = useState('');
  return (
    <div className="flex gap-2">
      <select
        value={selected}
        onChange={e => setSelected(e.target.value)}
        className="bg-gray-700 text-gray-300 text-sm rounded border border-gray-600 px-2 py-1 flex-1"
      >
        <option value="">Add condition…</option>
        {CONDITIONS.filter(c => !character.conditions.includes(c)).map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <button
        disabled={!selected}
        onClick={() => {
          if (selected) {
            safePatch({ conditions: [...character.conditions, selected] });
            setSelected('');
          }
        }}
        className="px-3 py-1 text-sm bg-yellow-400/20 text-yellow-300 rounded border border-yellow-600 disabled:opacity-40"
      >Add</button>
    </div>
  );
}

function SpellsTab({ character }: { character: Character }) {
  const slotCounts = [4, 3, 3, 3, 3, 2, 2, 1, 1];
  return (
    <div className="space-y-6">
      {/* Spell Slots */}
      <section>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Spell Slots</h3>
        <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
          {slotCounts.slice(0, Math.max(1, Math.ceil(character.level / 2))).map((count, i) => (
            <div key={i} className="text-center">
              <div className="text-xs text-gray-400 mb-1">Lvl {i + 1}</div>
              <div className="flex gap-1 justify-center flex-wrap">
                {Array.from({ length: count }).map((_, j) => (
                  <div key={j} className="w-3 h-3 rounded-full bg-yellow-400/60 border border-yellow-500" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cantrips */}
      {character.spells.cantrips.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Cantrips</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {character.spells.cantrips.map(spell => (
              <div key={spell} className="bg-gray-700 rounded p-2 text-sm text-gray-300">{spell}</div>
            ))}
          </div>
        </section>
      )}

      {character.spells.known.length === 0 && character.spells.cantrips.length === 0 && (
        <p className="text-gray-500 italic text-sm">No spells known yet.</p>
      )}
    </div>
  );
}

function InventoryTab({ character, safePatch }: { character: Character; safePatch: (p: Partial<Character>) => Promise<void> }) {
  const totalWeight = character.inventory.items.reduce((sum, i) => sum + i.weight * i.quantity, 0);
  const capacity = character.derivedStats.carryingCapacity;
  const pct = capacity > 0 ? Math.min(100, Math.round((totalWeight / capacity) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Currency */}
      <section>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Currency</h3>
        <div className="grid grid-cols-5 gap-3">
          {(['cp', 'sp', 'ep', 'gp', 'pp'] as const).map(coin => (
            <div key={coin} className="bg-gray-700 rounded-lg p-2 text-center">
              <div className="text-xs text-gray-400 mb-1">{coin.toUpperCase()}</div>
              <InlineEdit
                value={character.inventory.currency[coin]}
                type="number"
                onSave={(v) => safePatch({ inventory: { ...character.inventory, currency: { ...character.inventory.currency, [coin]: Number(v) } } })}
                className="text-white font-bold"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Encumbrance */}
      <section>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Encumbrance</h3>
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{totalWeight} lbs carried</span>
          <span>{capacity} lbs capacity</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div className={`h-full transition-all ${pct >= 100 ? 'bg-red-500' : pct >= 67 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${pct}%` }} />
        </div>
        {pct >= 100 && <p className="text-red-400 text-xs mt-1">Over capacity — Speed reduced to 0!</p>}
      </section>

      {/* Items */}
      <section>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Items</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-700">
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium">Qty</th>
              <th className="pb-2 font-medium">Weight</th>
              <th className="pb-2 font-medium">Cost</th>
              <th className="pb-2 font-medium">Equipped</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {character.inventory.items.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-700/50 text-gray-300">
                <td className="py-2">{item.name}</td>
                <td className="py-2">
                  <InlineEdit
                    value={item.quantity}
                    type="number"
                    onSave={(v) => {
                      const items = [...character.inventory.items];
                      items[idx] = { ...items[idx], quantity: Number(v) };
                      return safePatch({ inventory: { ...character.inventory, items } });
                    }}
                    className="text-gray-300 w-10"
                  />
                </td>
                <td className="py-2">{item.weight} lbs</td>
                <td className="py-2 text-gray-500">{item.cost ?? '—'}</td>
                <td className="py-2">
                  <input
                    type="checkbox"
                    checked={item.equipped ?? false}
                    onChange={() => {
                      const items = [...character.inventory.items];
                      items[idx] = { ...items[idx], equipped: !item.equipped };
                      safePatch({ inventory: { ...character.inventory, items } });
                    }}
                    className="accent-yellow-400"
                  />
                </td>
                <td className="py-2">
                  <button
                    onClick={() => {
                      const items = character.inventory.items.filter((_, i) => i !== idx);
                      safePatch({ inventory: { ...character.inventory, items } });
                    }}
                    className="text-gray-600 hover:text-red-400 transition-colors"
                  >×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <AddItemRow character={character} safePatch={safePatch} />
      </section>
    </div>
  );
}

function AddItemRow({ character, safePatch }: { character: Character; safePatch: (p: Partial<Character>) => Promise<void> }) {
  const [name, setName] = useState('');
  const [qty, setQty] = useState(1);
  return (
    <div className="flex gap-2 mt-2">
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Item name"
        className="bg-gray-700 text-gray-300 text-sm rounded border border-gray-600 px-2 py-1 flex-1 outline-none"
      />
      <input
        value={qty}
        onChange={e => setQty(Number(e.target.value))}
        type="number"
        min={1}
        className="bg-gray-700 text-gray-300 text-sm rounded border border-gray-600 px-2 py-1 w-16 outline-none"
      />
      <button
        disabled={!name}
        onClick={() => {
          if (!name) return;
          const items = [...character.inventory.items, { name, quantity: qty, weight: 0 }];
          safePatch({ inventory: { ...character.inventory, items } });
          setName('');
          setQty(1);
        }}
        className="px-3 py-1 text-sm bg-yellow-400/20 text-yellow-300 rounded border border-yellow-600 disabled:opacity-40"
      >Add</button>
    </div>
  );
}

function FeaturesTab({ character }: { character: Character }) {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Class Features</h3>
        {character.features.length === 0 && <p className="text-gray-500 italic text-sm">No features yet.</p>}
        <div className="space-y-3">
          {character.features.map((feat, i) => (
            <FeatureCard key={i} name={feat.name} source={feat.source} description={feat.description} />
          ))}
        </div>
      </section>
      <section>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Feats</h3>
        {character.feats.length === 0 && <p className="text-gray-500 italic text-sm">No feats yet.</p>}
        <div className="space-y-3">
          {character.feats.map((feat, i) => (
            <FeatureCard key={i} name={feat} source="Feat" description="" />
          ))}
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ name, source, description }: { name: string; source: string; description: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = description.length > 120;
  return (
    <div className="bg-gray-700/60 rounded-lg p-3 border border-gray-600">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="font-medium text-white text-sm">{name}</span>
          <span className="ml-2 text-xs bg-gray-600 text-gray-300 px-1.5 py-0.5 rounded">{source}</span>
        </div>
        {isLong && (
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-gray-500 hover:text-gray-300 flex-shrink-0">
            {expanded ? '▲' : '▼'}
          </button>
        )}
      </div>
      {description && (
        <p className={`text-gray-400 text-sm mt-2 ${isLong && !expanded ? 'line-clamp-2' : ''}`}>{description}</p>
      )}
    </div>
  );
}

function ProfileTab({ character, safePatch }: { character: Character; safePatch: (p: Partial<Character>) => Promise<void> }) {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Personality</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.keys(character.personality) as Array<keyof Character['personality']>).map(key => (
            <div key={key}>
              <label className="text-xs text-gray-400 uppercase block mb-1">{key}</label>
              <InlineEdit
                value={character.personality[key]}
                multiline
                onSave={(v) => safePatch({ personality: { ...character.personality, [key]: v } })}
                className="text-gray-300 text-sm"
                placeholder={`Enter ${key}…`}
              />
            </div>
          ))}
        </div>
      </section>
      <section>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Appearance</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {(Object.keys(character.appearance) as Array<keyof Character['appearance']>).map(key => (
            <div key={key}>
              <label className="text-xs text-gray-400 uppercase block mb-1">{key}</label>
              <InlineEdit
                value={character.appearance[key]}
                onSave={(v) => safePatch({ appearance: { ...character.appearance, [key]: v } })}
                className="text-gray-300 text-sm"
                placeholder={`Enter ${key}…`}
              />
            </div>
          ))}
        </div>
      </section>
      <section>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Backstory</h3>
        <InlineEdit
          value={character.backstory}
          multiline
          onSave={(v) => safePatch({ backstory: v })}
          className="text-gray-300 text-sm w-full"
          placeholder="Write your backstory…"
        />
      </section>
    </div>
  );
}
