'use client';
import { useWizardStore } from '@/lib/stores/wizardStore';
import Step1Class from '@/components/wizard/steps/Step1Class';
import Step2Background from '@/components/wizard/steps/Step2Background';
import Step3Species from '@/components/wizard/steps/Step3Species';
import Step4AbilityScores from '@/components/wizard/steps/Step4AbilityScores';
import Step5SkillsFeats from '@/components/wizard/steps/Step5SkillsFeats';
import Step6Spells from '@/components/wizard/steps/Step6Spells';
import Step7Finalize from '@/components/wizard/steps/Step7Finalize';
import Step8Submit from '@/components/wizard/steps/Step8Submit';

const STEP_COMPONENTS = [
  Step1Class,
  Step2Background,
  Step3Species,
  Step4AbilityScores,
  Step5SkillsFeats,
  Step6Spells,
  Step7Finalize,
  Step8Submit,
];

export default function NewCharacterPage() {
  const { step } = useWizardStore();
  const StepComponent = STEP_COMPONENTS[step] ?? Step1Class;
  return <StepComponent />;
}
