'use client';
import { useState } from 'react';
import type { LevelUpPreview, LevelUpChoice, ASIChoice } from '@local-dungeon/shared';
import { checkMulticlassPrereqs, getMulticlassProficiencyGrants, isNewClass } from '@local-dungeon/shared';
import ASIPanel from './ASIPanel';
import MulticlassProficiencyAlert from './MulticlassProficiencyAlert';

const STEP_LABELS = ['Class', 'Hit Points', 'ASI / Feat', 'Subclass', 'Summary'] as const;

const ALL_CLASSES = [
  'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter',
  'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard',
];

interface LevelUpWizardProps {
  characterId: string;
  className: string;
  abilityScores: Record<string, number>;
  classLevels?: Record<string, number>;
  preview: LevelUpPreview | null;
  onConfirm: (choice: LevelUpChoice) => Promise<void>;
  onClose: () => void;
}

export default function LevelUpWizard({
  characterId: _characterId,
  className,
  abilityScores,
  classLevels,
  preview,
  onConfirm,
  onClose,
}: LevelUpWizardProps) {
  const [step, setStep] = useState(0);
  const [classToLevel, setClassToLevel] = useState(className);
  const [useAverage, setUseAverage] = useState(true);
  const [hpRoll, setHpRoll] = useState<number | undefined>(undefined);
  const [asiChoice, setAsiChoice] = useState<ASIChoice | undefined>(undefined);
  const [subclassChoice, setSubclassChoice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentLevels = classLevels ?? { [className]: 1 };
  const selectedIsNew = isNewClass(currentLevels, classToLevel);
  const prereqCheck = checkMulticlassPrereqs(abilityScores as any, classToLevel);
  const grants = selectedIsNew ? getMulticlassProficiencyGrants(classToLevel) : null;

  const effectivePreview = preview;
  const showASIStep = effectivePreview?.gainsASI ?? false;
  const showSubclassStep = effectivePreview?.gainsSubclass ?? false;

  const steps = [
    STEP_LABELS[0],
    STEP_LABELS[1],
    ...(showASIStep ? [STEP_LABELS[2]] : []),
    ...(showSubclassStep ? [STEP_LABELS[3]] : []),
    STEP_LABELS[4],
  ];

  const canProceed = () => {
    if (step === 0) return classToLevel.trim().length > 0 && prereqCheck.allowed;
    if (step === 1) return useAverage || (hpRoll !== undefined && hpRoll >= 1);
    return true;
  };

  const handleNext = () => {
    if (step < steps.length - 1) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const choice: LevelUpChoice = {
        classToLevel,
        hpRoll: useAverage ? undefined : hpRoll,
        asiChoice: showASIStep ? asiChoice : undefined,
        subclassChoice: showSubclassStep && subclassChoice ? subclassChoice : undefined,
      };
      await onConfirm(choice);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const totalLevelAfter = Object.values(currentLevels).reduce((s, v) => s + v, 0) + 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-amber-500 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Level Up!</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">×</button>
        </div>

        {/* Step indicators */}
        <div className="flex border-b">
          {steps.map((label, i) => (
            <div
              key={label}
              className={`flex-1 py-2 text-center text-xs font-medium transition-colors ${
                i === step
                  ? 'border-b-2 border-amber-500 text-amber-600'
                  : i < step
                  ? 'text-green-600'
                  : 'text-gray-400'
              }`}
            >
              {i < step ? '✓ ' : ''}{label}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="px-6 py-5 min-h-[200px]">
          {steps[step] === 'Class' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-2">Choose a class to level up:</p>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {ALL_CLASSES.map((cls) => {
                  const existing = currentLevels[cls];
                  const prereq = checkMulticlassPrereqs(abilityScores as any, cls);
                  const isCurrent = cls === classToLevel;
                  const isCurrentClass = !!existing;
                  const prereqFails = !isCurrentClass && !prereq.allowed;
                  return (
                    <button
                      key={cls}
                      onClick={() => {
                        if (!prereqFails) setClassToLevel(cls);
                      }}
                      disabled={prereqFails}
                      className={`text-left px-3 py-2 rounded-lg border-2 transition-colors text-sm ${
                        isCurrent
                          ? 'border-amber-500 bg-amber-50'
                          : prereqFails
                          ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium">{cls}</span>
                      {isCurrentClass && (
                        <span className="text-xs text-amber-600 ml-1">Lv {existing}</span>
                      )}
                      {!isCurrentClass && !prereqFails && (
                        <span className="text-xs text-blue-500 ml-1">new</span>
                      )}
                      {prereqFails && (
                        <span className="block text-xs text-red-400 truncate">{prereq.reason}</span>
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedIsNew && grants && grants.proficiencies.length > 0 && (
                <MulticlassProficiencyAlert
                  className={classToLevel}
                  proficiencies={grants.proficiencies}
                />
              )}
            </div>
          )}

          {steps[step] === 'Hit Points' && effectivePreview && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Choose how to determine your HP gain:</p>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={useAverage}
                  onChange={() => setUseAverage(true)}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium">Take average</span>
                  <span className="text-gray-500 text-sm ml-1">(+{effectivePreview.hpOptions.average} HP)</span>
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={!useAverage}
                  onChange={() => setUseAverage(false)}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium">Roll (max {effectivePreview.hpOptions.roll})</span>
                  {!useAverage && (
                    <input
                      type="number"
                      min={1}
                      max={effectivePreview.hpOptions.roll}
                      value={hpRoll ?? ''}
                      onChange={(e) => setHpRoll(Number(e.target.value))}
                      className="ml-2 w-20 rounded border border-gray-300 px-2 py-1 text-sm"
                      placeholder="roll"
                    />
                  )}
                </span>
              </label>
            </div>
          )}

          {steps[step] === 'ASI / Feat' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Choose your Ability Score Improvement or Feat:</p>
              <ASIPanel abilityScores={abilityScores} onChange={setAsiChoice} />
            </div>
          )}

          {steps[step] === 'Subclass' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Choose your <strong>{classToLevel}</strong> subclass:
              </p>
              <input
                type="text"
                value={subclassChoice}
                onChange={(e) => setSubclassChoice(e.target.value)}
                placeholder="e.g. Champion, Evocation, Devotion..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          )}

          {steps[step] === 'Summary' && effectivePreview && (
            <div className="space-y-3 text-sm">
              <h3 className="font-semibold text-gray-800 text-base">Summary</h3>
              <ul className="space-y-1 text-gray-700">
                <li>
                  <span className="font-medium">Class leveled:</span> {classToLevel}
                  {selectedIsNew && <span className="ml-1 text-blue-600 text-xs">(new class!)</span>}
                </li>
                <li>
                  <span className="font-medium">Total level after:</span> {totalLevelAfter}
                </li>
                <li>
                  <span className="font-medium">HP gain:</span>{' '}
                  +{useAverage ? effectivePreview.hpOptions.average : (hpRoll ?? '?')}
                </li>
                <li>
                  <span className="font-medium">Proficiency bonus:</span> +{effectivePreview.newProficiencyBonus}
                </li>
                {selectedIsNew && grants && grants.proficiencies.length > 0 && (
                  <li>
                    <span className="font-medium">New proficiencies:</span>{' '}
                    {grants.proficiencies.join(', ')}
                  </li>
                )}
                {showASIStep && asiChoice && (
                  <li>
                    <span className="font-medium">ASI / Feat:</span>{' '}
                    {asiChoice.type === 'feat'
                      ? `Feat — ${asiChoice.featName}`
                      : asiChoice.ability2
                      ? `+1 ${asiChoice.ability1.toUpperCase()}, +1 ${asiChoice.ability2.toUpperCase()}`
                      : `+2 ${asiChoice.ability1.toUpperCase()}`}
                  </li>
                )}
                {showSubclassStep && subclassChoice && (
                  <li>
                    <span className="font-medium">Subclass:</span> {subclassChoice}
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-between">
          <button
            onClick={step === 0 ? onClose : handleBack}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
          >
            {step === 0 ? 'Cancel' : '← Back'}
          </button>

          {step < steps.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-40"
            >
              {submitting ? 'Confirming…' : 'Confirm Level Up ✓'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

