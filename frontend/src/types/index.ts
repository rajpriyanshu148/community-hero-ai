// ========================
// Enums
// ========================

export enum Role {
  CITIZEN = 'CITIZEN',
  AUTHORITY = 'AUTHORITY',
  ADMIN = 'ADMIN',
}

export enum IssueCategory {
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  WATER = 'WATER',
  ELECTRICITY = 'ELECTRICITY',
  ROADS = 'ROADS',
  SANITATION = 'SANITATION',
  ENVIRONMENT = 'ENVIRONMENT',
  SAFETY = 'SAFETY',
  NOISE = 'NOISE',
  STRAY_ANIMALS = 'STRAY_ANIMALS',
  ENCROACHMENT = 'ENCROACHMENT',
  FLOODING = 'FLOODING',
  OTHER = 'OTHER',
}

export enum IssueSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum IssueStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  REJECTED = 'REJECTED',
}

export enum VerificationResult {
  EXISTS = 'EXISTS',
  FAKE = 'FAKE',
  RESOLVED = 'RESOLVED',
}

export enum SkillType {
  MEDICAL = 'MEDICAL',
  CONSTRUCTION = 'CONSTRUCTION',
  ELECTRICAL = 'ELECTRICAL',
  PLUMBING = 'PLUMBING',
  LOGISTICS = 'LOGISTICS',
  COMMUNICATION = 'COMMUNICATION',
  TECHNICAL = 'TECHNICAL',
  VOLUNTEER = 'VOLUNTEER',
}

export enum MissionType {
  REPORT = 'REPORT',
  VERIFY = 'VERIFY',
  RESOLVE = 'RESOLVE',
  COMMUNITY = 'COMMUNITY',
  STREAK = 'STREAK',
  SPECIAL = 'SPECIAL',
}

export enum BadgeType {
  FIRST_REPORT = 'FIRST_REPORT',
  VERIFIED_HERO = 'VERIFIED_HERO',
  FAST_RESPONDER = 'FAST_RESPONDER',
  COMMUNITY_GUARDIAN = 'COMMUNITY_GUARDIAN',
  PREDICTION_WIZARD = 'PREDICTION_WIZARD',
  STREAK_7 = 'STREAK_7',
  STREAK_30 = 'STREAK_30',
  WARD_CHAMPION = 'WARD_CHAMPION',
  GOLD_CITIZEN = 'GOLD_CITIZEN',
  TRANSPARENCY_ADVOCATE = 'TRANSPARENCY_ADVOCATE',
}

export enum AlertType {
  WEATHER = 'WEATHER',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  HEALTH = 'HEALTH',
  SECURITY = 'SECURITY',
  ENVIRONMENTAL = 'ENVIRONMENTAL',
}

// ========================
// Core Interfaces
// ========================

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar?: string;
  wardNumber?: number;
  wardName?: string;
  trustScore: number;
  xp: number;
  level: number;
  rank?: number;
  badges: Badge[];
  skills: SkillType[];
  reportCount: number;
  resolvedCount: number;
  verificationCount: number;
  volunteerHours: number;
  isVerifiedCitizen: boolean;
  isBanned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar?: string;
  wardNumber?: number;
  wardName?: string;
  trustScore: number;
  xp: number;
  level: number;
  accessToken: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  severity: IssueSeverity;
  status: IssueStatus;
  address: string;
  lat: number;
  lng: number;
  wardNumber: number;
  wardName: string;
  imageUrls: string[];
  videoUrl?: string;
  voiceNoteUrl?: string;
  upvoteCount: number;
  viewCount: number;
  verificationScore: number;
  civicScore: number;
  aiAnalysis?: AIAnalysis;
  reporter: Pick<User, 'id' | 'name' | 'avatar' | 'trustScore' | 'level'>;
  assignedTo?: Pick<User, 'id' | 'name' | 'avatar'>;
  department?: Department;
  timeline: LedgerEntry[];
  verifications: Verification[];
  slaDeadline?: string;
  resolvedAt?: string;
  estimatedCost?: number;
  estimatedResolutionDays?: number;
  isDuplicate: boolean;
  duplicateOf?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIAnalysis {
  issueType: string;
  severity: IssueSeverity;
  confidence: number;
  category: IssueCategory;
  suggestedDepartment: string;
  estimatedResolutionDays: number;
  estimatedCost: number;
  reasoning: string[];
  keywords: string[];
  urgencyFactors: string[];
  publicImpact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  weatherRisk: boolean;
  civicScore: number;
  isDuplicate: boolean;
  duplicateIssueId?: string;
  analyzedAt: string;
}

export interface Verification {
  id: string;
  result: VerificationResult;
  user: Pick<User, 'id' | 'name' | 'trustScore'>;
  comment?: string;
  weight: number;
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  status: IssueStatus | string;
  actor: Pick<User, 'id' | 'name' | 'role'> | null;
  note?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Badge {
  id: string;
  type: BadgeType;
  name: string;
  description: string;
  icon: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  xpReward: number;
  earnedAt?: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  type: MissionType;
  xpReward: number;
  badgeReward?: Badge;
  targetCount: number;
  currentCount: number;
  isCompleted: boolean;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface Prediction {
  id: string;
  wardNumber: number;
  wardName: string;
  issueType: IssueCategory;
  probability: number;
  reasoning: string;
  recommendedAction: string;
  timeframe: string;
  severity: IssueSeverity;
  affectedArea?: string;
  basedOnCount: number;
  createdAt: string;
  validUntil: string;
}

export interface WeatherAlert {
  id: string;
  type: AlertType;
  title: string;
  description: string;
  severity: IssueSeverity;
  affectedWards: number[];
  startsAt: string;
  endsAt: string;
  source: string;
  isActive: boolean;
}

export interface Notification {
  id: string;
  type: 'ISSUE_UPDATE' | 'VERIFICATION' | 'XP_EARNED' | 'BADGE_EARNED' | 'MISSION_COMPLETE' | 'SYSTEM' | 'ALERT';
  title: string;
  message: string;
  issueId?: string;
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  categories: IssueCategory[];
  authorities: Pick<User, 'id' | 'name' | 'avatar'>[];
  avgResolutionDays: number;
  totalResolved: number;
  slaHours: number;
  isActive: boolean;
}

export interface WardStats {
  wardNumber: number;
  wardName: string;
  totalIssues: number;
  resolvedIssues: number;
  pendingIssues: number;
  healthScore: number;
  topCategory: IssueCategory;
  activeAlerts: number;
  avgResolutionDays: number;
}

export interface LeaderboardEntry {
  rank: number;
  user: Pick<User, 'id' | 'name' | 'avatar' | 'trustScore' | 'xp' | 'level' | 'wardName' | 'reportCount' | 'resolvedCount'>;
  badges: Badge[];
  weeklyXp?: number;
}

export interface SystemStats {
  totalUsers: number;
  totalIssues: number;
  resolvedIssues: number;
  pendingIssues: number;
  avgResolutionHours: number;
  satisfactionScore: number;
  activeWards: number;
  departmentsActive: number;
  issuesThisWeek: number;
  xpDistributedTotal: number;
}

// ========================
// API Response Wrappers
// ========================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  message?: string;
}

// ========================
// Filter & Query Types
// ========================

export interface IssueFilters {
  category?: IssueCategory;
  severity?: IssueSeverity;
  status?: IssueStatus;
  wardNumber?: number;
  reporterId?: string;
  search?: string;
  sortBy?: 'createdAt' | 'severity' | 'civicScore' | 'upvoteCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  lat?: number;
  lng?: number;
  radius?: number;
}

export interface CreateIssueDto {
  title: string;
  description: string;
  category: IssueCategory;
  severity: IssueSeverity;
  address: string;
  lat: number;
  lng: number;
  wardNumber: number;
  wardName: string;
  imageUrls?: string[];
  videoUrl?: string;
  voiceNoteUrl?: string;
}

export interface UpdateIssueStatusDto {
  status: IssueStatus;
  note?: string;
}

export interface VerifyIssueDto {
  result: VerificationResult;
  comment?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  wardNumber: number;
  wardName: string;
  role?: Role;
}

// ========================
// UI / Component Types
// ========================

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  roles?: Role[];
  isNew?: boolean;
}

export interface StepConfig {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  weight: number;
}

// ========================
// Socket Events
// ========================

export interface SocketEvents {
  'issue:update': (data: { issueId: string; status: IssueStatus; entry: LedgerEntry }) => void;
  'issue:new': (data: Issue) => void;
  'notification:new': (data: Notification) => void;
  'verification:new': (data: { issueId: string; verification: Verification }) => void;
  'xp:earned': (data: { amount: number; reason: string; total: number }) => void;
  'badge:earned': (data: Badge) => void;
}
