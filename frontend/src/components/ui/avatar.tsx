import * as React from 'react';
import { cn, getInitials, trustScoreColor } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  trustScore?: number;
  showTrustRing?: boolean;
  level?: number;
  showLevel?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizeMap = {
  xs: { outer: 24, inner: 20, ring: 2, font: 'text-[9px]', lvl: 'text-[8px]' },
  sm: { outer: 32, inner: 28, ring: 2, font: 'text-xs', lvl: 'text-[9px]' },
  md: { outer: 40, inner: 34, ring: 3, font: 'text-sm', lvl: 'text-[10px]' },
  lg: { outer: 56, inner: 48, ring: 4, font: 'text-base', lvl: 'text-xs' },
  xl: { outer: 72, inner: 62, ring: 5, font: 'text-xl', lvl: 'text-xs' },
  '2xl': { outer: 96, inner: 82, ring: 6, font: 'text-2xl', lvl: 'text-sm' },
};

export function Avatar({
  src,
  name = '',
  size = 'md',
  trustScore,
  showTrustRing = false,
  level,
  showLevel = false,
  className,
  onClick,
}: AvatarProps) {
  const s = sizeMap[size];
  const color = trustScore !== undefined ? trustScoreColor(trustScore) : '#06B6D4';
  const circumference = 2 * Math.PI * (s.outer / 2 - s.ring);
  const percentage = trustScore !== undefined ? trustScore : 100;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const avatarEl = (
    <div
      className={cn(
        'relative flex-shrink-0',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      style={{ width: s.outer, height: s.outer }}
    >
      {/* Trust Score Ring */}
      {showTrustRing && trustScore !== undefined && (
        <svg
          width={s.outer}
          height={s.outer}
          className="absolute inset-0 -rotate-90"
          style={{ zIndex: 1 }}
        >
          {/* Track */}
          <circle
            cx={s.outer / 2}
            cy={s.outer / 2}
            r={s.outer / 2 - s.ring}
            fill="none"
            stroke="rgba(51,65,85,0.5)"
            strokeWidth={s.ring}
          />
          {/* Progress */}
          <circle
            cx={s.outer / 2}
            cy={s.outer / 2}
            r={s.outer / 2 - s.ring}
            fill="none"
            stroke={color}
            strokeWidth={s.ring}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ filter: `drop-shadow(0 0 4px ${color}80)`, transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
      )}

      {/* Avatar Image or Initials */}
      <div
        className={cn(
          'absolute rounded-full overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center',
          showTrustRing ? 'inset-0 m-auto' : 'inset-0'
        )}
        style={
          showTrustRing
            ? { width: s.inner, height: s.inner, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
            : {}
        }
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <span
            className={cn('font-heading font-semibold text-white', s.font)}
            style={{ textShadow: `0 0 10px ${color}60` }}
          >
            {getInitials(name) || '?'}
          </span>
        )}
      </div>

      {/* Level Badge */}
      {showLevel && level !== undefined && (
        <div
          className="absolute bottom-0 right-0 bg-gradient-to-r from-cyan-600 to-emerald-600 text-white rounded-full flex items-center justify-center font-extrabold border border-slate-950 shadow-sm leading-none"
          style={{
            width: s.outer * 0.35,
            height: s.outer * 0.35,
            fontSize: '8px',
            lineHeight: '1',
          }}
        >
          {level}
        </div>
      )}
    </div>
  );

  return avatarEl;
}

// Avatar Group for showing multiple avatars
interface AvatarGroupProps {
  users: Array<{ id: string; name: string; avatar?: string | null }>;
  max?: number;
  size?: AvatarProps['size'];
  className?: string;
}

export function AvatarGroup({ users, max = 4, size = 'sm', className }: AvatarGroupProps) {
  const visible = users.slice(0, max);
  const remaining = users.length - max;
  const s = sizeMap[size];

  return (
    <div className={cn('flex items-center', className)}>
      {visible.map((user, i) => (
        <div
          key={user.id}
          className="rounded-full border-2 border-background"
          style={{ marginLeft: i === 0 ? 0 : `-${s.outer * 0.3}px` }}
        >
          <Avatar src={user.avatar} name={user.name} size={size} />
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            'rounded-full border-2 border-background bg-surface flex items-center justify-center font-semibold text-slate-400',
            s.font
          )}
          style={{
            width: s.outer,
            height: s.outer,
            marginLeft: `-${s.outer * 0.3}px`,
            fontSize: '0.65rem',
          }}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
