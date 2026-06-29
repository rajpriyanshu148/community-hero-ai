import { Router, Request, Response, NextFunction } from 'express';
import { query } from 'express-validator';
import { validate } from '../../middleware/validate';
import { weatherService } from '../../services/weather.service';
import { sendSuccess, sendError } from '../../utils/response';
import { cacheGet, cacheSet } from '../../config/redis';
import { prisma } from '../../config/database';

export const weatherRouter = Router();

// ============================================================
// GET /weather/alerts - Current weather alerts for location
// ============================================================
weatherRouter.get(
  '/alerts',
  validate([
    query('lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
    query('lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
    query('ward').optional().isString(),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);
      const ward = req.query.ward as string | undefined;

      const cacheKey = `weather:alerts:${lat.toFixed(2)}:${lng.toFixed(2)}`;
      const cached = await cacheGet<unknown>(cacheKey);
      if (cached) {
        sendSuccess(res, cached, 'Weather alerts retrieved.');
        return;
      }

      // Get current weather
      const weatherData = await weatherService.getCurrentWeather(lat, lng);

      // Generate civic alerts based on weather
      const civicAlerts = await weatherService.generateCivicAlerts(weatherData, lat, lng);

      // Store civic alerts in DB
      if (civicAlerts.length > 0) {
        await prisma.weatherAlert.createMany({
          data: civicAlerts.map((alert) => ({
            ward: ward ?? null,
            alertType: alert.alertType,
            severity: alert.severity,
            message: alert.message,
            lat,
            lng,
            expiresAt: alert.expiresAt,
          })),
          skipDuplicates: true,
        });
      }

      // Also fetch stored active alerts for the ward
      const storedAlerts = await prisma.weatherAlert.findMany({
        where: {
          expiresAt: { gte: new Date() },
          ...(ward ? { ward } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      const result = {
        currentWeather: weatherData,
        civicAlerts,
        activeAlerts: storedAlerts,
      };

      await cacheSet(cacheKey, result, 600); // Cache 10 minutes
      sendSuccess(res, result, `Found ${civicAlerts.length} weather-related civic alerts.`);
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================
// GET /weather/forecast - 5-day forecast with civic risk
// ============================================================
weatherRouter.get(
  '/forecast',
  validate([
    query('lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
    query('lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);

      const cacheKey = `weather:forecast:${lat.toFixed(2)}:${lng.toFixed(2)}`;
      const cached = await cacheGet<unknown>(cacheKey);
      if (cached) {
        sendSuccess(res, cached, 'Forecast retrieved.');
        return;
      }

      const forecast = await weatherService.getForecast(lat, lng);

      await cacheSet(cacheKey, forecast, 1800); // Cache 30 minutes
      sendSuccess(res, forecast, '5-day civic risk forecast retrieved.');
    } catch (err) {
      next(err);
    }
  }
);
