'use client';
import { useWizardStore } from '@/lib/stores/wizardStore';

const STEPS = [
  'Class',
  'Background',
  'Species',
  'Ability Scores',
  'Skills & Feats',
  'Spells',
  'Finalize',
  'Review',
];

export default function WizardProgress() {
  const { step } = useWizardStore();

  return (
    <nav aria-label="Character creation progress">
      <ol className="flex items-center w-full overflow-x-auto gap-1">
        {STEPS.map((label, i) => {
          const isCompleted = i < step;
          const isCurrent = i === step;
          return (
            <li key={i} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border-2 flex-shrink-0
                    ${isCompleted ? 'bg-yellow-400 border-yellow-400 text-gray-900' : ''}
                    ${isCurrent ? 'border-yellow-400 text-yellow-400' : ''}
                    ${!isCompleted && !isCurrent ? 'border-gray-600 text-gray-500' : ''}
                  `}
                >
                  {isCompleted ? '✓' : i + 1}
                </div>
                <span className={`hidden md:block text-xs mt-1 text-center whitespace-nowrap
                  ${isCurrent ? 'text-yellow-400 font-semibold' : isCompleted ? 'text-gray-300' : 'text-gray-500'}
                `}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 ${i < step ? 'bg-yellow-400' : 'bg-gray-700'}`} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
