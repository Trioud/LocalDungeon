'use client';

interface Props {
  sessionId: string;
  onPropose: (restType: 'short' | 'long') => void;
  disabled?: boolean;
}

export default function RestButton({ onPropose, disabled = false }: Props) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onPropose('short')}
        disabled={disabled}
        className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white text-sm font-medium py-1.5 px-3 rounded transition-colors"
        title="Propose a Short Rest (1 hour — spend Hit Dice)"
      >
        Short Rest
      </button>
      <button
        onClick={() => onPropose('long')}
        disabled={disabled}
        className="bg-blue-700 hover:bg-blue-800 disabled:bg-gray-300 text-white text-sm font-medium py-1.5 px-3 rounded transition-colors"
        title="Propose a Long Rest (8 hours — full recovery)"
      >
        Long Rest
      </button>
    </div>
  );
}
