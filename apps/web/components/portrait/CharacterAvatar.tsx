import Image from 'next/image';

const SIZE_MAP = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
} as const;

const COLORS = [
  'bg-purple-700',
  'bg-blue-700',
  'bg-green-700',
  'bg-red-700',
  'bg-yellow-700',
  'bg-indigo-700',
  'bg-pink-700',
  'bg-teal-700',
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

interface CharacterAvatarProps {
  portraitUrl?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function CharacterAvatar({
  portraitUrl,
  name,
  size = 'md',
  className = '',
}: CharacterAvatarProps) {
  const px = SIZE_MAP[size];
  const initials = getInitials(name);
  const textSize = px <= 32 ? 'text-xs' : px <= 48 ? 'text-sm' : px <= 64 ? 'text-base' : 'text-xl';

  if (portraitUrl) {
    return (
      <div
        className={`rounded-full overflow-hidden flex-shrink-0 ${className}`}
        style={{ width: px, height: px }}
      >
        <Image
          src={portraitUrl}
          alt={name}
          width={px}
          height={px}
          className="object-cover w-full h-full"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white ${getColor(name)} ${textSize} ${className}`}
      style={{ width: px, height: px }}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
