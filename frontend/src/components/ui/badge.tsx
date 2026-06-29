import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase border transition-all duration-200 whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-slate-800 text-slate-300 border-slate-700',
        // Severity
        critical: 'bg-red-500/15 text-red-400 border-red-500/30',
        high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
        medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        // Status
        pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        verified: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
        assigned: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
        in_progress: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
        resolved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        closed: 'bg-slate-600/40 text-slate-400 border-slate-600/40',
        rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
        // Category
        infrastructure: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
        water: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
        electricity: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
        roads: 'bg-stone-500/15 text-stone-300 border-stone-500/30',
        sanitation: 'bg-green-500/15 text-green-400 border-green-500/30',
        environment: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        safety: 'bg-red-500/15 text-red-400 border-red-500/30',
        // Misc
        new: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse',
        featured: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
        xp: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        civic: 'bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-cyan-300 border-cyan-500/30',
        // Rarity
        common: 'bg-slate-700/50 text-slate-300 border-slate-600',
        rare: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        epic: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        legendary: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      },
      size: {
        xs: 'px-1.5 py-px text-[10px]',
        sm: 'px-2 py-px text-xs',
        default: 'px-2.5 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  dotColor?: string;
}

function Badge({ className, variant, size, dot, dotColor, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: dotColor || 'currentColor' }}
        />
      )}
      {children}
    </span>
  );
}

// Convenience components
export function SeverityBadge({ severity }: { severity: string }) {
  const variantMap: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
    CRITICAL: 'critical',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
  };
  return <Badge variant={variantMap[severity] || 'default'}>{severity}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, BadgeProps['variant']> = {
    PENDING: 'pending',
    VERIFIED: 'verified',
    ASSIGNED: 'assigned',
    IN_PROGRESS: 'in_progress',
    RESOLVED: 'resolved',
    CLOSED: 'closed',
    REJECTED: 'rejected',
  };
  const label: Record<string, string> = {
    IN_PROGRESS: 'In Progress',
  };
  return (
    <Badge variant={variantMap[status] || 'default'} dot>
      {label[status] || status.toLowerCase().replace(/_/g, ' ')}
    </Badge>
  );
}

export { Badge, badgeVariants };
