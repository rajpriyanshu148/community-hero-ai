import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { GeminiService } from './gemini.service';

export class PredictionService {
  /**
   * Fetch historical issues, query current/future weather, and generate predictive alert cards via Gemini.
   */
  static async generateWardPredictions(ward: string): Promise<any[]> {
    logger.info(`Generating predictions for ward: ${ward}`);
    try {
      // 1. Get issues reported in this ward over the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const historicalIssues = await prisma.issue.findMany({
        where: {
          ward,
          createdAt: {
            gte: thirtyDaysAgo,
          },
          isDeleted: false,
        },
        select: {
          category: true,
          severity: true,
          status: true,
          createdAt: true,
        },
      });

      // 2. Mock or fetch weather alerts in this ward
      const activeWeatherAlerts = await prisma.weatherAlert.findMany({
        where: {
          ward,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      // 3. Compile context for Gemini
      const categoryCounts = historicalIssues.reduce((acc: any, issue) => {
        acc[issue.category] = (acc[issue.category] || 0) + 1;
        return acc;
      }, {});

      const context = {
        ward,
        totalIssuesPastMonth: historicalIssues.length,
        breakdown: categoryCounts,
        weatherAlerts: activeWeatherAlerts.map(w => ({
          type: w.alertType,
          severity: w.severity,
          message: w.message,
        })),
      };

      // 4. Call Gemini
      const predictions = await GeminiService.generatePredictions(
        ward,
        JSON.stringify(context),
        activeWeatherAlerts.length > 0 ? activeWeatherAlerts[0].message : 'Normal weather condition'
      );

      // 5. Store predictions in database
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Valid for 1 week

      const savedPredictions = [];
      for (const pred of predictions) {
        const saved = await prisma.prediction.create({
          data: {
            ward,
            issueType: pred.issueType,
            probability: pred.probability,
            reasoning: pred.reasoning,
            weatherContext: pred.weatherContext || 'General trend data',
            expiresAt,
          },
        });
        savedPredictions.push(saved);
      }

      return savedPredictions;
    } catch (error) {
      logger.error(`Error in generateWardPredictions for ${ward}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve active predictions for a ward.
   */
  static async getActivePredictions(ward: string): Promise<any[]> {
    try {
      return await prisma.prediction.findMany({
        where: {
          ward,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          probability: 'desc',
        },
      });
    } catch (error) {
      logger.error(`Error in getActivePredictions for ${ward}:`, error);
      return [];
    }
  }
}
