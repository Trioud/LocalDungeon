'use client';
import { xpToLevel, levelToXP, XP_THRESHOLDS } from '@local-dungeon/shared';

interface XPBarProps {
  xp: number;
  className?: string;
}

export default function XPBar({ xp, className = '' }: XPBarProps) {
  const currentLevel = xpToLevel(xp);
  const isMaxLevel = currentLevel >= 20;

  const currentThreshold = XP_THRESHOLDS[currentLevel - 1];
  const nextThreshold = isMaxLevel ? XP_THRESHOLDS[19] : XP_THRESHOLDS[currentLevel];
  const xpIntoLevel = xp - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;
  const fillPercent = isMaxLevel ? 100 : Math.min(100, (xpIntoLevel / xpNeeded) * 100);

  const levelUpAvailable = !isMaxLevel && xp >= nextThreshold;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-gray-700">
          Level {currentLevel}
          {!isMaxLevel && <span className="text-gray-400 font-normal"> → {currentLevel + 1}</span>}
        </span>
        <span className="text-gray-500">
          {isMaxLevel ? 'Max Level' : `${xp.toLocaleString()} / ${nextThreshold.toLocaleString()} XP`}
        </span>
      </div>

      <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${fillPercent}%` }}
          role="progressbar"
          aria-valuenow={xp}
          aria-valuemin={currentThreshold}
          aria-valuemax={nextThreshold}
          aria-label={`XP progress: ${xp} of ${nextThreshold}`}
        />
      </div>

      {levelUpAvailable && (
        <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-0.5 text-xs font-bold text-amber-700 border border-amber-400 animate-pulse">
          ⬆ Level Up Available!
        </div>
      )}
    </div>
  );
}
