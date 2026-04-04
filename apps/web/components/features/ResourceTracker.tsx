'use client';
import type { ClassResource } from '@local-dungeon/shared';

interface Props {
  resources: ClassResource[];
  onUse: (resourceId: string) => void;
}

function PipGrid({ current, max }: { current: number; max: number }) {
  const display = Math.min(max, 20);
  return (
    <span className="flex flex-wrap gap-0.5">
      {Array.from({ length: display }, (_, i) => (
        <span key={i} className={i < current ? 'text-indigo-600' : 'text-gray-300'} aria-hidden>
          {i < current ? '●' : '○'}
        </span>
      ))}
    </span>
  );
}

function groupByClass(resources: ClassResource[]): Map<string, ClassResource[]> {
  const map = new Map<string, ClassResource[]>();
  for (const r of resources) {
    const group = map.get(r.className) ?? [];
    group.push(r);
    map.set(r.className, group);
  }
  return map;
}

export default function ResourceTracker({ resources, onUse }: Props) {
  if (resources.length === 0) return null;

  const groups = groupByClass(resources);

  return (
    <div className="mt-2 space-y-2">
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Class Resources</p>
      {[...groups.entries()].map(([className, classResources]) => (
        <div key={className}>
          <p className="text-xs font-medium text-gray-500 capitalize mb-1">{className}</p>
          <div className="space-y-1">
            {classResources.map((res) => {
              const depleted = res.current === 0;
              return (
                <div
                  key={res.id}
                  className={`flex items-center gap-2 ${depleted ? 'opacity-40' : ''}`}
                >
                  <span className="w-28 text-xs truncate" title={res.name}>
                    {res.name}
                  </span>
                  {res.unit === 'HP' ? (
                    <span className="text-xs text-blue-600 font-medium">
                      {res.current}/{res.max} HP
                    </span>
                  ) : (
                    <PipGrid current={res.current} max={res.max} />
                  )}
                  <button
                    onClick={() => onUse(res.id)}
                    disabled={depleted}
                    className="ml-auto text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 hover:bg-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label={`Use ${res.name}`}
                  >
                    Use
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
