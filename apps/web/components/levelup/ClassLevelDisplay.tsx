'use client';

interface ClassLevelDisplayProps {
  classLevels: Record<string, number>;
  className?: string;
}

const CLASS_ICONS: Record<string, string> = {
  Barbarian: '⚔️',
  Bard: '🎵',
  Cleric: '✝️',
  Druid: '🌿',
  Fighter: '🛡️',
  Monk: '👊',
  Paladin: '⚜️',
  Ranger: '🏹',
  Rogue: '🗡️',
  Sorcerer: '✨',
  Warlock: '🔮',
  Wizard: '📚',
};

export default function ClassLevelDisplay({ classLevels, className = '' }: ClassLevelDisplayProps) {
  const entries = Object.entries(classLevels).filter(([, lvl]) => lvl > 0);

  if (entries.length === 0) return null;

  if (entries.length === 1) {
    const [cls, lvl] = entries[0];
    return (
      <span className={`inline-flex items-center gap-1 ${className}`}>
        <span>{CLASS_ICONS[cls] ?? '⚔️'}</span>
        <span className="font-medium">
          {cls} {lvl}
        </span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 flex-wrap ${className}`}>
      {entries.map(([cls, lvl], i) => (
        <span key={cls} className="inline-flex items-center gap-0.5">
          <span>{CLASS_ICONS[cls] ?? '⚔️'}</span>
          <span className="font-medium">
            {cls} {lvl}
          </span>
          {i < entries.length - 1 && <span className="text-gray-400 mx-0.5">/</span>}
        </span>
      ))}
    </span>
  );
}
