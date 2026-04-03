'use client';
import { useWizard } from '@/lib/hooks/useWizard';
import { useClasses, useBackgrounds, useFeats } from '@/lib/hooks/useGameData';

const ALL_SKILLS = [
  'Acrobatics','Animal Handling','Arcana','Athletics','Deception',
  'History','Insight','Intimidation','Investigation','Medicine',
  'Nature','Perception','Performance','Persuasion','Religion',
  'Sleight of Hand','Stealth','Survival',
];

export default function Step5SkillsFeats() {
  const { data: wizardData, updateData, next, back } = useWizard();
  const { data: classes } = useClasses();
  const { data: backgrounds } = useBackgrounds();
  const { data: feats } = useFeats('origin');

  const selectedClass = classes?.find((c: { name: string }) => c.name === wizardData.className);
  const selectedBg = backgrounds?.find((bg: { name: string }) => bg.name === wizardData.backgroundName);
  const bgFeatName: string = selectedBg?.feat ?? '';
  const bgFeat = feats?.find((f: { name: string }) => f.name === bgFeatName);
  const bgSkills: string[] = selectedBg?.skillProficiencies ?? [];
  const classSkillChoices: string[] = selectedClass?.skillChoices ?? ALL_SKILLS;
  const maxSkills: number = selectedClass?.skillCount ?? 2;
  const selectedSkills: string[] = wizardData.skillProficiencies ?? [];

  const availableClassSkills = classSkillChoices.filter(s => !bgSkills.includes(s));

  const toggleSkill = (skill: string) => {
    const current = wizardData.skillProficiencies ?? [];
    if (current.includes(skill)) {
      updateData({ skillProficiencies: current.filter(s => s !== skill) });
    } else if (current.length < maxSkills) {
      updateData({ skillProficiencies: [...current, skill] });
    }
  };

  const classSelectedCount = selectedSkills.filter(s => !bgSkills.includes(s)).length;

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-4">Skills & Feats</h2>

      {/* Origin Feat */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-purple-700">
        <h3 className="font-semibold text-purple-300 mb-2">Origin Feat (from Background)</h3>
        {bgFeatName ? (
          <div>
            <p className="text-white font-medium">{bgFeatName}</p>
            {bgFeat?.description ? (
              <p className="text-gray-400 text-sm mt-1">{bgFeat.description}</p>
            ) : (
              <p className="text-gray-500 text-sm mt-1 italic">Feat details will be shown during play.</p>
            )}
            {bgFeat?.requiresChoice && (
              <p className="text-yellow-400 text-xs mt-2">⚠️ This feat requires sub-selection (available in full character sheet).</p>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-sm italic">Select a background to see your origin feat.</p>
        )}
      </div>

      {/* Background Skills */}
      {bgSkills.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-green-300 mb-2">Background Skill Proficiencies (locked)</h3>
          <div className="flex flex-wrap gap-2">
            {bgSkills.map(skill => (
              <span key={skill} className="px-3 py-1 bg-green-900/50 border border-green-700 text-green-300 rounded-full text-sm">
                ✓ {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Class Skills */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-white mb-1">
          Class Skill Proficiencies
        </h3>
        <p className="text-gray-400 text-sm mb-3">
          Choose {maxSkills} from your class options ({classSelectedCount}/{maxSkills} selected):
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {availableClassSkills.map(skill => {
            const isSelected = selectedSkills.includes(skill);
            const isMaxed = classSelectedCount >= maxSkills && !isSelected;
            return (
              <label
                key={skill}
                className={`flex items-center gap-2 cursor-pointer p-2 rounded border transition-colors
                  ${isSelected ? 'border-yellow-400 bg-yellow-900/20 text-yellow-300' : isMaxed ? 'border-gray-700 text-gray-600 cursor-not-allowed' : 'border-gray-700 text-gray-300 hover:border-gray-500'}
                `}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => !isMaxed || isSelected ? toggleSkill(skill) : undefined}
                  disabled={isMaxed && !isSelected}
                  className="accent-yellow-400"
                />
                <span className="text-sm">{skill}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between">
        <button onClick={back} className="px-6 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">
          ← Back
        </button>
        <button
          onClick={next}
          className="px-6 py-2 bg-yellow-400 text-gray-900 font-bold rounded hover:bg-yellow-300 transition-colors"
        >
          Next: Spells →
        </button>
      </div>
    </div>
  );
}
