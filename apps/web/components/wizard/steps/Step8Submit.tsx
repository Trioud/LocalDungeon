'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWizard } from '@/lib/hooks/useWizard';
import { createCharacter } from '@/lib/api/characters';

export default function Step8Submit() {
  const { data: wizardData, reset, back } = useWizard();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const scores = wizardData.abilityScores ?? { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
      const result = await createCharacter({
        name: wizardData.name ?? 'Unnamed Hero',
        className: wizardData.className ?? '',
        speciesName: wizardData.speciesName ?? '',
        backgroundName: wizardData.backgroundName ?? '',
        alignment: wizardData.alignment ?? '',
        abilityScores: scores,
        backstory: wizardData.backstory ?? '',
        appearance: (wizardData.appearance as Record<string, string>) ?? {},
        personality: (wizardData.personality as Record<string, string>) ?? {},
        feats: wizardData.selectedFeats ?? [],
        spells: {
          cantrips: wizardData.cantrips ?? [],
          known: wizardData.knownSpells ?? [],
        },
      });
      reset();
      router.push(`/characters/${result.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create character. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto text-center py-12">
      <div className="text-5xl mb-4">🎲</div>
      <h2 className="text-2xl font-bold text-white mb-2">Ready to Begin Your Adventure?</h2>
      <p className="text-gray-400 mb-2">
        You&apos;re about to create <span className="text-yellow-400 font-semibold">{wizardData.name || 'your character'}</span>,
        a {wizardData.speciesName} {wizardData.className}.
      </p>
      <p className="text-gray-500 text-sm mb-8">Background: {wizardData.backgroundName}</p>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded p-4 mb-6 text-red-300 text-sm">
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-3 text-red-400 underline text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex gap-4 justify-center">
        <button
          onClick={back}
          disabled={loading}
          className="px-6 py-3 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-40"
        >
          ← Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-8 py-3 bg-yellow-400 text-gray-900 font-bold rounded hover:bg-yellow-300 transition-colors disabled:opacity-40 flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            '⚔️ Create Character'
          )}
        </button>
      </div>
    </div>
  );
}
