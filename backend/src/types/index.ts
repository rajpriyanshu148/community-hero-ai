import {
  UserRole,
  IssueCategory,
  IssueSeverity,
  IssueStatus,
  VerificationResult,
  VoteType,
  MissionType,
  MissionStatus,
  VolunteerSkillType,
} from '@prisma/client';
import { Request } from 'express';

// ============================================================
// Re-export Prisma Enums for convenience
// ============================================================
export {
  UserRole,
  IssueCategory,
  IssueSeverity,
  IssueStatus,
  VerificationResult,
  VoteType,
  MissionType,
  MissionStatus,
  VolunteerSkillType,
};

// ============================================================
// Auth Types
// ============================================================
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  trustScore: number;
  ward?: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface JwtRefreshPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

// ============================================================
// Express Request Augmentation
// ============================================================
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// ============================================================
// API Response Types
// ============================================================
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ValidationError[];
  pagination?: PaginationMeta;
  timestamp?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ============================================================
// AI Analysis Types
// ============================================================
export interface AIAnalysis {
  issueType: string;
  severity: IssueSeverity;
  confidence: number; // 0-1
  publicRisk: string; // "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  department: string;
  estimatedResolutionTime: string; // e.g., "2-4 hours"
  estimatedCost: string; // e.g., "₹5,000 - ₹15,000"
  reasoning: string;
  tags: string[];
  isDuplicate?: boolean;
  duplicateIssueId?: string;
}

export interface FraudCheck {
  isSuspicious: boolean;
  reasons: string[];
  confidence: number; // 0-1
}

// ============================================================
// Socket Event Types
// ============================================================
export interface IssueUpdateEvent {
  issueId: string;
  status?: IssueStatus;
  upvotes?: number;
  civicScore?: number;
  updatedBy?: string;
  timestamp: string;
}

export interface NotificationEvent {
  id: string;
  type: string;
  title: string;
  message: string;
  payload?: Record<string, unknown>;
  createdAt: string;
}

export interface VerificationRequestEvent {
  issueId: string;
  issueTitle: string;
  issueLocation: {
    lat: number;
    lng: number;
    address?: string;
  };
  ward?: string;
  requestedAt: string;
}

export interface MissionAssignedEvent {
  missionId: string;
  title: string;
  description: string;
  type: MissionType;
  xpReward: number;
  ward?: string;
  assignedAt: string;
}

// ============================================================
// Weather Types
// ============================================================
export interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  main: string;
  visibility: number;
  clouds: number;
  rain?: number; // mm in last 1h
  snow?: number;
  timestamp: number;
}

export interface ForecastData {
  dt: number;
  date: string;
  temp: {
    min: number;
    max: number;
    day: number;
  };
  humidity: number;
  windSpeed: number;
  description: string;
  main: string;
  pop: number; // probability of precipitation
  rain?: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  civicRisks: string[];
}

// ============================================================
// Issue Types
// ============================================================
export interface NearbyIssueQuery {
  lat: number;
  lng: number;
  radius: number; // in meters
}

export interface IssueFilters {
  status?: IssueStatus;
  category?: IssueCategory;
  ward?: string;
  severity?: IssueSeverity;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'civicScore' | 'upvotes' | 'slaDeadline';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================
// Dashboard / Analytics Types
// ============================================================
export interface DashboardStats {
  totalIssues: number;
  resolvedIssues: number;
  pendingIssues: number;
  criticalIssues: number;
  avgResolutionTimeHours: number;
  citizensImpacted: number;
  volunteerHours: number;
  wardHealth: WardHealthScore[];
}

export interface WardHealthScore {
  ward: string;
  health: number; // 0-100
  totalIssues: number;
  resolvedIssues: number;
  criticalCount: number;
}

// ============================================================
// Prediction Types
// ============================================================
export interface PredictionResult {
  issueType: string;
  ward: string;
  probability: number; // 0-1
  reasoning: string;
  weatherContext?: string;
  expiresAt: Date;
}

// ============================================================
// Trust Score Types
// ============================================================
export interface TrustDelta {
  userId: string;
  delta: number;
  reason: string;
  newScore: number;
  newLevel?: number;
  newBadges?: string[];
}

// ============================================================
// Pagination Helper
// ============================================================
export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export const getPaginationParams = (
  page: number | string = 1,
  limit: number | string = 20
): PaginationParams => {
  const p = Math.max(1, parseInt(String(page), 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
  return {
    page: p,
    limit: l,
    skip: (p - 1) * l,
  };
};
