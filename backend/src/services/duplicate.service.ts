import { IssueCategory, IssueStatus, Issue } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

// ============================================================
// Duplicate Detection Service
// ============================================================

class DuplicateService {
  /**
   * Haversine formula: Calculate distance between two coordinates in meters.
   */
  haversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371000; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // distance in meters
  }

  /**
   * Check for duplicate issues within 200m radius with the same category.
   * Returns the closest existing active issue, or null if no duplicate found.
   */
  async checkDuplicate(
    lat: number,
    lng: number,
    category: IssueCategory,
    _description: string
  ): Promise<Issue | null> {
    const DUPLICATE_RADIUS_METERS = 200;

    // Fetch active issues of the same category in a bounding box first (faster DB query)
    // Bounding box: ~200m in each direction (roughly 0.002 degrees of lat/lng)
    const latDelta = DUPLICATE_RADIUS_METERS / 111000; // ~111km per degree of lat
    const lngDelta = DUPLICATE_RADIUS_METERS / (111000 * Math.cos((lat * Math.PI) / 180));

    const candidates = await prisma.issue.findMany({
      where: {
        isDeleted: false,
        category,
        status: {
          notIn: [IssueStatus.RESOLVED, IssueStatus.CLOSED],
        },
        lat: { gte: lat - latDelta, lte: lat + latDelta },
        lng: { gte: lng - lngDelta, lte: lng + lngDelta },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    if (candidates.length === 0) return null;

    // Apply precise haversine filter
    let closestIssue: Issue | null = null;
    let closestDistance = DUPLICATE_RADIUS_METERS;

    for (const issue of candidates) {
      const distance = this.haversineDistance(lat, lng, issue.lat, issue.lng);
      if (distance <= DUPLICATE_RADIUS_METERS && distance < closestDistance) {
        closestDistance = distance;
        closestIssue = issue;
      }
    }

    if (closestIssue) {
      logger.info(
        `Duplicate detected: issue=${closestIssue.id} category=${category} distance=${Math.round(closestDistance)}m`
      );
    }

    return closestIssue;
  }

  /**
   * Find all issues within a given radius (meters) at a location.
   * Useful for reporting nearby issues and heatmap generation.
   */
  async findNearbyIssues(
    lat: number,
    lng: number,
    radiusMeters: number,
    options?: {
      category?: IssueCategory;
      excludeId?: string;
      limit?: number;
    }
  ): Promise<Array<Issue & { distanceMeters: number }>> {
    const latDelta = radiusMeters / 111000;
    const lngDelta = radiusMeters / (111000 * Math.cos((lat * Math.PI) / 180));

    const candidates = await prisma.issue.findMany({
      where: {
        isDeleted: false,
        lat: { gte: lat - latDelta, lte: lat + latDelta },
        lng: { gte: lng - lngDelta, lte: lng + lngDelta },
        ...(options?.category && { category: options.category }),
        ...(options?.excludeId && { id: { not: options.excludeId } }),
      },
      take: (options?.limit ?? 50) * 3, // Fetch extra, filter by precise haversine
    });

    return candidates
      .map((issue) => ({
        ...issue,
        distanceMeters: this.haversineDistance(lat, lng, issue.lat, issue.lng),
      }))
      .filter((i) => i.distanceMeters <= radiusMeters)
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, options?.limit ?? 50);
  }
}

export const duplicateService = new DuplicateService();
export default duplicateService;
