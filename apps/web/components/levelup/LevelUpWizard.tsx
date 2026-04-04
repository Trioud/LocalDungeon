'use client';
import { useState } from 'react';
import type { LevelUpPreview, LevelUpChoice, ASIChoice } from '@local-dungeon/shared';
import { checkMulticlassPrereqs } from '@local-dungeon/shared';
import ASIPanel from './ASIPanel';

const STEP_LABELS = ['Class', 'Hit Points', 'ASI / Feat', 'Subclass', 'Summary'] as const;

interface LevelUpWizardProps {
  characterId: string;
  className: string;
  abilityScores: Record<string, number>;
  preview: LevelUpPreview | null;
  onConfirm: (choice: LevelUpChoice) => Promise<void>;
  onClose: () => void;
}

export default function LevelUpWizard({
  characterId,
  className,
  abilityScores,
  preview,
  onConfirm,
  onClose,
}: LevelUpWizardProps) {
  const [step, setStep] = useState(0);
  const [classToLevel, setClassToLevel] = useState(className);
  const [multiclassInput, setMulticlassInput] = useState('');
  const [useAverage, setUseAverage] = useState(true);
  const [hpRoll, setHpRoll] = useState<number | undefined>(undefined);
  const [asiChoice, setAsiChoice] = useState<ASIChoice | undefined>(undefined);
  const [subclassChoice, setSubclassChoice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const prereqCheck = multiclassInput
    ? checkMulticlassPrereqs(abilityScores as any, multiclassInput)
    : { allowed: true };

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
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Leveling up <strong>{className}</strong> (current class)
                </p>
                <button
                  onClick={() => setClassToLevel(className)}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                    classToLevel === className && !multiclassInput
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium">{className}</span>
                  <span className="text-sm text-gray-500 ml-2">(continue current class)</span>
                </button>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Or multiclass into:</p>
                <input
                  type="text"
                  value={multiclassInput}
                  onChange={(e) => {
                    setMulticlassInput(e.target.value);
                    if (e.target.value.trim()) setClassToLevel(e.target.value.trim());
                    else setClassToLevel(className);
                  }}
                  placeholder="e.g. Rogue, Wizard..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                {multiclassInput && !prereqCheck.allowed && (
                  <p className="mt-1 text-xs text-red-600">⚠ {prereqCheck.reason}</p>
                )}
                {multiclassInput && prereqCheck.allowed && (
                  <p className="mt-1 text-xs text-green-600">✓ Prerequisites met</p>
                )}
              </div>
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
                </li>
                <li>
                  <span className="font-medium">New total level:</span> {effectivePreview.newLevel}
                </li>
                <li>
                  <span className="font-medium">HP gain:</span>{' '}
                  +{useAverage ? effectivePreview.hpOptions.average : (hpRoll ?? '?')}
                </li>
                <li>
                  <span className="font-medium">Proficiency bonus:</span> +{effectivePreview.newProficiencyBonus}
                </li>
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
