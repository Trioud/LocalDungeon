'use client';

interface MulticlassProficiencyAlertProps {
  className: string;
  proficiencies: string[];
}

export default function MulticlassProficiencyAlert({
  className,
  proficiencies,
}: MulticlassProficiencyAlertProps) {
  if (proficiencies.length === 0) {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <p className="font-medium">Entering {className}</p>
        <p className="text-blue-600 mt-0.5">No additional proficiencies granted.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
      <p className="font-semibold text-amber-800 mb-1">
        🎓 You gain proficiencies from {className}:
      </p>
      <ul className="list-disc list-inside space-y-0.5 text-amber-700">
        {proficiencies.map((prof) => (
          <li key={prof}>{prof}</li>
        ))}
      </ul>
    </div>
  );
}
