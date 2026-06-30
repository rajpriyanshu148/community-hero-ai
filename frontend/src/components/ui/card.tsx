import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: 'cyan' | 'emerald' | 'amber' | 'red' | 'purple' | 'none';
  hover?: boolean;
  glass?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  border?: 'default' | 'cyan' | 'emerald' | 'amber' | 'red' | 'none';
}

export interface MotionCardProps extends HTMLMotionProps<'div'> {
  glow?: 'cyan' | 'emerald' | 'amber' | 'red' | 'purple' | 'none';
  hover?: boolean;
  glass?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  border?: 'default' | 'cyan' | 'emerald' | 'amber' | 'red' | 'none';
}

const glowMap = {
  cyan: 'hover:shadow-glow-cyan hover:border-cyan-500/30',
  emerald: 'hover:shadow-glow-emerald hover:border-emerald-500/30',
  amber: 'hover:shadow-glow-amber hover:border-amber-500/30',
  red: 'hover:shadow-glow-red hover:border-red-500/30',
  purple: 'hover:shadow-glow-purple hover:border-purple-500/30',
  none: '',
};

const borderMap = {
  default: 'border border-border',
  cyan: 'border border-cyan-500/30',
  emerald: 'border border-emerald-500/30',
  amber: 'border border-amber-500/30',
  red: 'border border-red-500/30',
  none: '',
};

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

function Card({
  className,
  glow = 'none',
  hover = false,
  glass = true,
  padding = 'lg',
  border = 'default',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl transition-all duration-300',
        glass ? 'glass-card' : 'bg-surface',
        borderMap[border],
        paddingMap[padding],
        hover && ['card-hover cursor-pointer', glowMap[glow]],
        !hover && glow !== 'none' && glowMap[glow].split(' ')[0], // Always-on glow
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

const MotionCard = React.forwardRef<HTMLDivElement, MotionCardProps>(
  ({ className, glow = 'none', hover = false, glass = true, padding = 'lg', border = 'default', children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          'rounded-xl transition-all duration-300',
          glass ? 'glass-card' : 'bg-surface',
          borderMap[border],
          paddingMap[padding],
          hover && ['cursor-pointer', glowMap[glow]],
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
MotionCard.displayName = 'MotionCard';

function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col space-y-1.5 pb-4', className)} {...props} />
  );
}

function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('font-heading text-lg font-semibold text-white leading-none tracking-tight', className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-slate-400', className)} {...props} />
  );
}

function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('pt-0', className)} {...props} />;
}

function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center pt-4 border-t border-border', className)} {...props} />
  );
}

function GlowCard({
  children,
  glowColor = 'cyan',
  className,
  ...props
}: {
  children: React.ReactNode;
  glowColor?: 'cyan' | 'emerald' | 'amber' | 'red' | 'purple';
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  const colorMap = {
    cyan: 'from-cyan-500/10 to-transparent border-cyan-500/30 shadow-glow-cyan',
    emerald: 'from-emerald-500/10 to-transparent border-emerald-500/30 shadow-glow-emerald',
    amber: 'from-amber-500/10 to-transparent border-amber-500/30 shadow-glow-amber',
    red: 'from-red-500/10 to-transparent border-red-500/30 shadow-glow-red',
    purple: 'from-purple-500/10 to-transparent border-purple-500/30 shadow-glow-purple',
  };

  return (
    <div
      className={cn(
        'rounded-xl border p-6 bg-gradient-to-br',
        colorMap[glowColor],
        'backdrop-blur-md',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { Card, MotionCard, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, GlowCard };
