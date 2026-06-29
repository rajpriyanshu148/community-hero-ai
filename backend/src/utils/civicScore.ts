import { IssueSeverity } from '@prisma/client';

// ============================================================
// Civic Score Configuration
// ============================================================

const SEVERITY_SCORES: Record<IssueSeverity, number> = {
  [IssueSeverity.CRITICAL]: 40,
  [IssueSeverity.HIGH]: 30,
  [IssueSeverity.MEDIUM]: 20,
  [IssueSeverity.LOW]: 10,
};

const MAX_UPVOTE_SCORE = 20;
const MAX_UPVOTES_FOR_FULL_SCORE = 50; // 50+ upvotes = full 20 pts

const MAX_VERIFICATION_SCORE = 20;

const PROXIMITY_SCORES = {
  nearSchool: 10,
  nearHospital: 10,
};

// ============================================================
// Civic Score Calculator
// ============================================================

export interface CivicScoreParams {
  severity: IssueSeverity;
  upvotes: number;
  downvotes?: number;
  verificationCount?: number;
  verificationConfidence?: number; // 0-1
  nearSchool?: boolean;
  nearHospital?: boolean;
  ageHours?: number; // How old the issue is — older unresolved issues get slight bump
}

/**
 * Calculate the civic emergency score for an issue.
 * Returns a 0-100 float.
 *
 * Scoring breakdown:
 *   - Severity:         10-40 pts
 *   - Net upvotes:      0-20 pts
 *   - Verifications:    0-20 pts
 *   - Proximity boost:  0-20 pts (school=+10, hospital=+10)
 *   Total max:          100 pts
 */
export const calculateCivicScore = (params: CivicScoreParams): number => {
  const {
    severity,
    upvotes,
    downvotes = 0,
    verificationCount = 0,
    verificationConfidence = 0,
    nearSchool = false,
    nearHospital = false,
    ageHours = 0,
  } = params;

  // 1. Severity score (10-40 pts)
  const severityScore = SEVERITY_SCORES[severity];

  // 2. Net upvote score (0-20 pts)
  const netVotes = Math.max(0, upvotes - downvotes);
  const upvoteScore = Math.min(
    MAX_UPVOTE_SCORE,
    (netVotes / MAX_UPVOTES_FOR_FULL_SCORE) * MAX_UPVOTE_SCORE
  );

  // 3. Verification score (0-20 pts)
  // Weight both quantity and quality of verifications
  const verificationQuantityScore = Math.min(10, verificationCount * 2); // 5 verifications = 10 pts
  const verificationQualityScore = Math.min(10, verificationConfidence * 10);
  const verificationScore = Math.min(
    MAX_VERIFICATION_SCORE,
    verificationQuantityScore + verificationQualityScore
  );

  // 4. Proximity score (0-20 pts)
  const proximityScore =
    (nearSchool ? PROXIMITY_SCORES.nearSchool : 0) +
    (nearHospital ? PROXIMITY_SCORES.nearHospital : 0);

  // 5. Age urgency bump (0-5 pts) for older unresolved critical/high issues
  let ageBump = 0;
  if (
    (severity === IssueSeverity.CRITICAL || severity === IssueSeverity.HIGH) &&
    ageHours > 24
  ) {
    ageBump = Math.min(5, Math.floor(ageHours / 24)); // +1 per day, max 5
  }

  const rawScore =
    severityScore + upvoteScore + verificationScore + proximityScore + ageBump;

  // Clamp to 0-100
  return Math.min(100, Math.max(0, Math.round(rawScore * 100) / 100));
};

/**
 * Get civic score label for display
 */
export const getCivicScoreLabel = (score: number): string => {
  if (score >= 80) return 'CRITICAL EMERGENCY';
  if (score >= 60) return 'HIGH PRIORITY';
  if (score >= 40) return 'MEDIUM PRIORITY';
  if (score >= 20) return 'LOW PRIORITY';
  return 'MINIMAL';
};

/**
 * Recalculate civic score from an Issue object (from Prisma)
 */
export const recalculateCivicScore = (issue: {
  severity: IssueSeverity;
  upvotes: number;
  downvotes: number;
  verifications?: Array<{ result: string; trustWeight: number }>;
  createdAt: Date;
}): number => {
  const verifications = issue.verifications ?? [];
  const existsVerifications = verifications.filter((v) => v.result === 'EXISTS');
  const verificationConfidence =
    existsVerifications.length > 0
      ? existsVerifications.reduce((sum, v) => sum + v.trustWeight, 0) /
        existsVerifications.length
      : 0;

  const ageHours =
    (Date.now() - issue.createdAt.getTime()) / (1000 * 60 * 60);

  return calculateCivicScore({
    severity: issue.severity,
    upvotes: issue.upvotes,
    downvotes: issue.downvotes,
    verificationCount: existsVerifications.length,
    verificationConfidence,
    ageHours,
  });
};
