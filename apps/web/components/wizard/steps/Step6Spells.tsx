'use client';
import { useState, useEffect } from 'react';
import { useWizard } from '@/lib/hooks/useWizard';
import { useClasses, useSpells } from '@/lib/hooks/useGameData';

const SPELLCASTING_CLASSES = ['Bard','Cleric','Druid','Paladin','Ranger','Sorcerer','Warlock','Wizard'];

interface SpellData {
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  description: string;
}

export default function Step6Spells() {
  const { data: wizardData, updateData, next, back } = useWizard();
  const { data: classes } = useClasses();
  const className = wizardData.className ?? '';
  const isSpellcaster = SPELLCASTING_CLASSES.includes(className);

  const selectedClass = classes?.find((c: { name: string; spellcasting: unknown }) => c.name === className);
  const cantripCount: number = selectedClass?.cantripCount ?? 2;
  const knownSpellCount: number = selectedClass?.knownSpells ?? 2;

  const { data: cantripsData, isLoading: cantripLoading } = useSpells(
    isSpellcaster ? { class: className, level: 0 } : undefined
  );
  const { data: spellsData, isLoading: spellsLoading } = useSpells(
    isSpellcaster ? { class: className, minLevel: 1 } : undefined
  );

  const [expandedSpell, setExpandedSpell] = useState<string | null>(null);

  const selectedCantrips: string[] = wizardData.cantrips ?? [];
  const selectedSpells: string[] = wizardData.knownSpells ?? [];

  useEffect(() => {
    if (!isSpellcaster) {
      next();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpellcaster]);

  if (!isSpellcaster) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-800 rounded-lg p-8 inline-block">
          <div className="text-4xl mb-4">⚔️</div>
          <h2 className="text-xl font-bold text-white mb-2">No Magic Required</h2>
          <p className="text-gray-400">Your class ({className}) doesn&apos;t use spellcasting. Proceeding to next step...</p>
        </div>
      </div>
    );
  }

  const toggleCantrip = (name: string) => {
    if (selectedCantrips.includes(name)) {
      updateData({ cantrips: selectedCantrips.filter(s => s !== name) });
    } else if (selectedCantrips.length < cantripCount) {
      updateData({ cantrips: [...selectedCantrips, name] });
    }
  };

  const toggleSpell = (name: string) => {
    if (selectedSpells.includes(name)) {
      updateData({ knownSpells: selectedSpells.filter(s => s !== name) });
    } else if (selectedSpells.length < knownSpellCount) {
      updateData({ knownSpells: [...selectedSpells, name] });
    }
  };

  const renderSpellCard = (spell: SpellData, isSelected: boolean, isMaxed: boolean, onToggle: () => void) => {
    const isExpanded = expandedSpell === spell.name;
    return (
      <div
        key={spell.name}
        className={`bg-gray-800 rounded p-3 border transition-all cursor-pointer
          ${isSelected ? 'border-purple-400 bg-purple-900/20' : isMaxed ? 'border-gray-700 opacity-50' : 'border-gray-700 hover:border-gray-500'}
        `}
        onClick={() => !isMaxed || isSelected ? onToggle() : undefined}
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="font-medium text-white text-sm">{spell.name}</span>
            <span className="ml-2 text-xs text-purple-400">{spell.school}</span>
          </div>
          <span className="text-xs text-gray-400">{spell.level === 0 ? 'Cantrip' : `Lvl ${spell.level}`}</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">{spell.castingTime} • {spell.range}</div>
        <button
          type="button"
          className="text-xs text-blue-400 mt-1 underline"
          onClick={(e) => { e.stopPropagation(); setExpandedSpell(isExpanded ? null : spell.name); }}
        >
          {isExpanded ? 'Hide' : 'Details'}
        </button>
        {isExpanded && (
          <div className="mt-2 text-xs text-gray-300 border-t border-gray-700 pt-2">
            <div className="mb-1"><span className="text-gray-500">Components:</span> {spell.components}</div>
            <div className="mb-1"><span className="text-gray-500">Duration:</span> {spell.duration}</div>
            <p>{spell.description}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-4">Choose Spells</h2>

      {/* Cantrips */}
      <div className="mb-6">
        <h3 className="font-semibold text-white mb-2">
          Cantrips <span className="text-purple-400">({selectedCantrips.length}/{cantripCount})</span>
        </h3>
        {cantripLoading ? (
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-gray-800 rounded h-16 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(cantripsData ?? []).map((spell: SpellData) => renderSpellCard(
              spell,
              selectedCantrips.includes(spell.name),
              selectedCantrips.length >= cantripCount && !selectedCantrips.includes(spell.name),
              () => toggleCantrip(spell.name)
            ))}
          </div>
        )}
      </div>

      {/* Known Spells */}
      <div className="mb-6">
        <h3 className="font-semibold text-white mb-2">
          Known Spells (Level 1+) <span className="text-purple-400">({selectedSpells.length}/{knownSpellCount})</span>
        </h3>
        {spellsLoading ? (
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-gray-800 rounded h-16 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(spellsData ?? []).map((spell: SpellData) => renderSpellCard(
              spell,
              selectedSpells.includes(spell.name),
              selectedSpells.length >= knownSpellCount && !selectedSpells.includes(spell.name),
              () => toggleSpell(spell.name)
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button onClick={back} className="px-6 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">
          ← Back
        </button>
        <button
          onClick={next}
          className="px-6 py-2 bg-yellow-400 text-gray-900 font-bold rounded hover:bg-yellow-300 transition-colors"
        >
          Next: Finalize →
        </button>
      </div>
    </div>
  );
}
