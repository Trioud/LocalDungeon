'use client';
import type { ClassResource } from '@local-dungeon/shared';

interface Props {
  resources: ClassResource[];
  onUse: (resourceId: string) => void;
}

export default function QuickUsePanel({ resources, onUse }: Props) {
  if (resources.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-100">
      {resources.map((res) => {
        const depleted = res.current === 0;
        return (
          <button
            key={res.id}
            onClick={() => onUse(res.id)}
            disabled={depleted}
            title={`${res.name} (${res.current}/${res.max})`}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors ${
              depleted
                ? 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
                : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
            aria-label={`Use ${res.name}`}
          >
            <span className="truncate max-w-16">{res.name}</span>
            <span className="rounded-full bg-indigo-200 text-indigo-800 text-[10px] px-1 font-bold min-w-[16px] text-center">
              {res.current}
            </span>
          </button>
        );
      })}
    </div>
  );
}
