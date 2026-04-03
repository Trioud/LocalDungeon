'use client';

import { useState } from 'react';
import {
  useSpells,
  useClasses,
  useConditions,
  useWeapons,
  useFeats,
} from '@/lib/hooks/useGameData';

type Tab = 'spells' | 'classes' | 'conditions' | 'weapons' | 'feats';

const SPELL_SCHOOLS = [
  'Abjuration',
  'Conjuration',
  'Divination',
  'Enchantment',
  'Evocation',
  'Illusion',
  'Necromancy',
  'Transmutation',
];

const FEAT_CATEGORIES = ['Origin', 'General', 'Fighting Style', 'Epic Boon'];

function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="text-red-400 py-8 text-center">
      Failed to load data: {message}
    </div>
  );
}

function SpellsTab() {
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState<string>('');
  const [school, setSchool] = useState('');
  const [concentration, setConcentration] = useState(false);
  const [ritual, setRitual] = useState(false);

  const filters: Record<string, string | number | boolean> = {};
  if (level !== '') filters.level = parseInt(level);
  if (school) filters.school = school;
  if (concentration) filters.concentration = true;
  if (ritual) filters.ritual = true;

  const { data: spells, isLoading, error } = useSpells(Object.keys(filters).length ? filters : undefined);

  const filtered = spells?.filter((s: { name: string }) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search spells..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 flex-1 min-w-40"
        />
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
        >
          <option value="">All Levels</option>
          {Array.from({ length: 10 }, (_, i) => (
            <option key={i} value={i}>
              {i === 0 ? 'Cantrip' : `Level ${i}`}
            </option>
          ))}
        </select>
        <select
          value={school}
          onChange={(e) => setSchool(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
        >
          <option value="">All Schools</option>
          {SPELL_SCHOOLS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={concentration}
            onChange={(e) => setConcentration(e.target.checked)}
            className="accent-yellow-400"
          />
          Concentration
        </label>
        <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={ritual}
            onChange={(e) => setRitual(e.target.checked)}
            className="accent-yellow-400"
          />
          Ritual
        </label>
      </div>

      {isLoading && <Spinner />}
      {error && <ErrorState message={(error as Error).message} />}
      {filtered && (
        <div className="grid gap-3">
          {filtered.map(
            (spell: {
              id: string;
              name: string;
              level: number;
              school: string;
              castingTime: string;
              range: string;
              concentration: boolean;
              ritual: boolean;
              description: string;
              components: string[];
            }) => (
              <div key={spell.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-yellow-400">{spell.name}</h3>
                    <p className="text-gray-400 text-sm">
                      {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`} •{' '}
                      {spell.school}
                      {spell.concentration && ' • Concentration'}
                      {spell.ritual && ' • Ritual'}
                    </p>
                  </div>
                  <div className="text-right text-sm text-gray-400 shrink-0">
                    <div>{spell.castingTime}</div>
                    <div>{spell.range}</div>
                    <div>{spell.components.join(', ')}</div>
                  </div>
                </div>
                <p className="text-gray-300 text-sm mt-2 line-clamp-3">{spell.description}</p>
              </div>
            )
          )}
          {filtered.length === 0 && (
            <p className="text-gray-400 text-center py-8">No spells match your filters.</p>
          )}
        </div>
      )}
    </div>
  );
}

function ClassesTab() {
  const { data: classes, isLoading, error } = useClasses();

  if (isLoading) return <Spinner />;
  if (error) return <ErrorState message={(error as Error).message} />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {classes?.map(
        (cls: {
          id: string;
          name: string;
          hitDie: number;
          primaryAbility: string;
          description: string;
          savingThrows: string[];
          subclassLabel: string;
        }) => (
          <div key={cls.id} className="bg-gray-800 rounded-lg p-5 border border-gray-700">
            <h3 className="font-bold text-yellow-400 text-lg mb-1">{cls.name}</h3>
            <div className="text-sm text-gray-400 space-y-1 mb-3">
              <div>
                <span className="text-gray-500">Hit Die:</span>{' '}
                <span className="text-white">d{cls.hitDie}</span>
              </div>
              <div>
                <span className="text-gray-500">Primary:</span>{' '}
                <span className="text-white">{cls.primaryAbility}</span>
              </div>
              <div>
                <span className="text-gray-500">Saves:</span>{' '}
                <span className="text-white">{cls.savingThrows.join(', ')}</span>
              </div>
              <div>
                <span className="text-gray-500">Subclass:</span>{' '}
                <span className="text-white">{cls.subclassLabel}</span>
              </div>
            </div>
            <p className="text-gray-400 text-xs line-clamp-3">{cls.description}</p>
          </div>
        )
      )}
    </div>
  );
}

function ConditionsTab() {
  const { data: conditions, isLoading, error } = useConditions();

  if (isLoading) return <Spinner />;
  if (error) return <ErrorState message={(error as Error).message} />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {conditions?.map(
        (cond: {
          id: string;
          name: string;
          description: string;
          effects: string[];
        }) => (
          <div key={cond.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="font-bold text-yellow-400 mb-2">{cond.name}</h3>
            <p className="text-gray-400 text-sm mb-3">{cond.description}</p>
            <ul className="list-disc list-inside space-y-1">
              {cond.effects.map((effect, i) => (
                <li key={i} className="text-gray-300 text-sm">
                  {effect}
                </li>
              ))}
            </ul>
          </div>
        )
      )}
    </div>
  );
}

function WeaponsTab() {
  const { data: weapons, isLoading, error } = useWeapons();

  if (isLoading) return <Spinner />;
  if (error) return <ErrorState message={(error as Error).message} />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700 text-gray-400">
            <th className="text-left py-3 pr-4">Name</th>
            <th className="text-left py-3 pr-4">Category</th>
            <th className="text-left py-3 pr-4">Damage</th>
            <th className="text-left py-3 pr-4">Properties</th>
            <th className="text-left py-3 pr-4">Mastery</th>
            <th className="text-right py-3">Cost</th>
          </tr>
        </thead>
        <tbody>
          {weapons?.map(
            (w: {
              id: string;
              name: string;
              category: string;
              damageDice: string;
              damageType: string;
              properties: string[];
              mastery: string | null;
              cost: string;
            }) => (
              <tr key={w.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="py-2 pr-4 text-yellow-400 font-medium">{w.name}</td>
                <td className="py-2 pr-4 text-gray-300">{w.category}</td>
                <td className="py-2 pr-4 text-gray-300">
                  {w.damageDice} {w.damageType}
                </td>
                <td className="py-2 pr-4 text-gray-400">{w.properties.join(', ') || '—'}</td>
                <td className="py-2 pr-4 text-gray-400">{w.mastery ?? '—'}</td>
                <td className="py-2 text-right text-gray-300">{w.cost}</td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}

function FeatsTab() {
  const [category, setCategory] = useState('');
  const { data: feats, isLoading, error } = useFeats(category || undefined);

  if (isLoading) return <Spinner />;
  if (error) return <ErrorState message={(error as Error).message} />;

  return (
    <div>
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setCategory('')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            category === ''
              ? 'bg-yellow-500 text-gray-900'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600'
          }`}
        >
          All
        </button>
        {FEAT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              category === cat
                ? 'bg-yellow-500 text-gray-900'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {feats?.map(
          (feat: {
            id: string;
            name: string;
            category: string;
            prerequisite: string | null;
            description: string;
            benefits: string[];
            repeatable: boolean;
          }) => (
            <div key={feat.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h3 className="font-bold text-yellow-400">
                    {feat.name}
                    {feat.repeatable && (
                      <span className="ml-2 text-xs text-gray-500">(Repeatable)</span>
                    )}
                  </h3>
                  <span className="text-xs text-gray-500">{feat.category}</span>
                  {feat.prerequisite && (
                    <span className="ml-2 text-xs text-amber-600">
                      Prereq: {feat.prerequisite}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-2">{feat.description}</p>
              <ul className="list-disc list-inside space-y-1">
                {feat.benefits.map((b, i) => (
                  <li key={i} className="text-gray-300 text-sm">
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default function ReferencePage() {
  const [activeTab, setActiveTab] = useState<Tab>('spells');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'spells', label: '✨ Spells' },
    { id: 'classes', label: '⚔️ Classes' },
    { id: 'conditions', label: '💀 Conditions' },
    { id: 'weapons', label: '🗡️ Weapons' },
    { id: 'feats', label: '⭐ Feats' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-yellow-400 mb-6">📚 Reference Browser</h1>

      <div className="flex gap-1 mb-8 border-b border-gray-700 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'text-yellow-400 border-b-2 border-yellow-400 -mb-px'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'spells' && <SpellsTab />}
      {activeTab === 'classes' && <ClassesTab />}
      {activeTab === 'conditions' && <ConditionsTab />}
      {activeTab === 'weapons' && <WeaponsTab />}
      {activeTab === 'feats' && <FeatsTab />}
    </div>
  );
}
