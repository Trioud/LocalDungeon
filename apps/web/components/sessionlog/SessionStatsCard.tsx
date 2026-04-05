import type { SessionSummary } from '@local-dungeon/shared';

interface SessionStatsCardProps {
  summary: SessionSummary;
}

const statRows = (summary: SessionSummary) => [
  { label: 'Total Rolls', value: summary.totalRolls },
  { label: 'Critical Hits', value: summary.criticalHits },
  { label: 'Critical Misses', value: summary.criticalMisses },
  { label: 'Spells Cast', value: summary.spellsCast },
  { label: 'Death Saves (✓)', value: summary.deathSaves.successes },
  { label: 'Death Saves (✗)', value: summary.deathSaves.failures },
  { label: 'Longest Combat', value: `${summary.longestCombat} turns` },
];

export default function SessionStatsCard({ summary }: SessionStatsCardProps) {
  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 p-4">
      <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-3">Session Stats</h2>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
        {statRows(summary).map(({ label, value }) => (
          <div key={label} className="flex flex-col">
            <dt className="text-xs text-gray-500">{label}</dt>
            <dd className="text-lg font-bold text-gray-900">{value}</dd>
          </div>
        ))}
      </dl>
      {summary.characterNames.length > 0 && (
        <p className="mt-3 text-xs text-gray-500">
          Characters: {summary.characterNames.join(', ')}
        </p>
      )}
    </div>
  );
}
