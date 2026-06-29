// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, format: 'short' | 'long' | 'relative' = 'short'): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (format === 'relative') {
    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  if (format === 'long') {
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function severityColor(severity: string): string {
  const map: Record<string, string> = {
    CRITICAL: 'red',
    HIGH: 'orange',
    MEDIUM: 'amber',
    LOW: 'emerald',
  };
  return map[severity] || 'slate';
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'amber',
    VERIFIED: 'cyan',
    ASSIGNED: 'blue',
    IN_PROGRESS: 'purple',
    RESOLVED: 'emerald',
    CLOSED: 'slate',
    REJECTED: 'red',
  };
  return map[status] || 'slate';
}

export function categoryIcon(category: string): string {
  const map: Record<string, string> = {
    INFRASTRUCTURE: '🏗️',
    WATER: '💧',
    ELECTRICITY: '⚡',
    ROADS: '🛣️',
    SANITATION: '🗑️',
    ENVIRONMENT: '🌿',
    SAFETY: '🚨',
    NOISE: '🔊',
    STRAY_ANIMALS: '🐕',
    ENCROACHMENT: '⚠️',
    FLOODING: '🌊',
    OTHER: '📋',
  };
  return map[category] || '📋';
}

export function levelTitle(level: number): string {
  if (level >= 50) return 'City Legend';
  if (level >= 40) return 'Civic Champion';
  if (level >= 30) return 'Community Hero';
  if (level >= 20) return 'Guardian';
  if (level >= 10) return 'Activist';
  if (level >= 5) return 'Volunteer';
  return 'Citizen';
}

export function trustScoreColor(score: number): string {
  if (score >= 80) return '#10B981'; // emerald
  if (score >= 60) return '#06B6D4'; // cyan
  if (score >= 40) return '#F59E0B'; // amber
  return '#EF4444'; // red
}

export function xpForNextLevel(level: number): number {
  return level * 1000;
}

export function truncateAddress(address: string, maxLength = 35): string {
  if (address.length <= maxLength) return address;
  return address.slice(0, maxLength) + '...';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function formatSLA(deadline: string): { label: string; isOverdue: boolean; color: string } {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diff = deadlineDate.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (diff < 0) {
    const overdueHours = Math.abs(hours);
    return {
      label: `${overdueHours}h overdue`,
      isOverdue: true,
      color: '#EF4444',
    };
  }

  if (hours < 2) {
    return {
      label: `${hours}h ${mins}m left`,
      isOverdue: false,
      color: '#F59E0B',
    };
  }

  if (hours < 24) {
    return { label: `${hours}h left`, isOverdue: false, color: '#06B6D4' };
  }

  const days = Math.floor(hours / 24);
  return { label: `${days}d left`, isOverdue: false, color: '#10B981' };
}
