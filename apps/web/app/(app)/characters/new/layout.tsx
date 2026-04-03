import WizardProgress from '@/components/wizard/WizardProgress';

export default function WizardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-yellow-400 mb-6">Create Your Character</h1>
      <WizardProgress />
      <div className="mt-8">{children}</div>
    </div>
  );
}
