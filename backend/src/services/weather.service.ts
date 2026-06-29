import axios from 'axios';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export class WeatherService {
  private static API_KEY = process.env.OPENWEATHER_KEY || '';
  private static BASE_URL = 'https://api.openweathermap.org/data/2.5';

  /**
   * Get current weather details for a specific latitude and longitude.
   */
  static async getCurrentWeather(lat: number, lng: number): Promise<any> {
    if (!this.API_KEY) {
      // Return beautiful mock weather data for Bangalore area
      return {
        temp: 24,
        description: 'heavy rain',
        humidity: 85,
        windSpeed: 18,
        icon: '09d',
        mock: true,
      };
    }

    try {
      const response = await axios.get(`${this.BASE_URL}/weather`, {
        params: {
          lat,
          lon: lng,
          appid: this.API_KEY,
          units: 'metric',
        },
      });

      return {
        temp: response.data.main.temp,
        description: response.data.weather[0].description,
        humidity: response.data.main.humidity,
        windSpeed: response.data.wind.speed,
        icon: response.data.weather[0].icon,
      };
    } catch (error) {
      logger.error('Error fetching current weather:', error);
      return { temp: 22, description: 'cloudy', humidity: 70, windSpeed: 5, icon: '03d' };
    }
  }

  /**
   * Get forecast data.
   */
  static async getForecast(lat: number, lng: number): Promise<any[]> {
    if (!this.API_KEY) {
      return [
        { date: new Date(Date.now() + 86400000), temp: 23, description: 'heavy rain', severity: 'WARNING' },
        { date: new Date(Date.now() + 172800000), temp: 22, description: 'thunderstorm', severity: 'ALERT' },
        { date: new Date(Date.now() + 259200000), temp: 26, description: 'moderate rain', severity: 'NONE' },
      ];
    }

    try {
      const response = await axios.get(`${this.BASE_URL}/forecast`, {
        params: {
          lat,
          lon: lng,
          appid: this.API_KEY,
          units: 'metric',
        },
      });

      return response.data.list.slice(0, 5).map((item: any) => ({
        date: new Date(item.dt * 1000),
        temp: item.main.temp,
        description: item.weather[0].description,
        severity: item.weather[0].main === 'Rain' || item.weather[0].main === 'Thunderstorm' ? 'WARNING' : 'NONE',
      }));
    } catch (error) {
      logger.error('Error fetching weather forecast:', error);
      return [];
    }
  }

  /**
   * Process current weather conditions and generate/store civic risk alerts.
   */
  static async generateCivicAlerts(lat: number, lng: number, ward: string | null): Promise<any[]> {
    try {
      const weather = await this.getCurrentWeather(lat, lng);
      const alerts = [];

      const desc = weather.description.toLowerCase();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 12); // Expires in 12 hours

      if (desc.includes('rain') || desc.includes('storm')) {
        alerts.push({
          ward,
          alertType: 'FLOODING_RISK',
          severity: 'HIGH',
          message: `Heavy rain detected in ${ward || 'your area'}. Flooding risk in low-lying roads is high. Please avoid waterlogged underpasses.`,
          lat,
          lng,
          expiresAt,
        });

        alerts.push({
          ward,
          alertType: 'STREETLIGHT_FAILURE',
          severity: 'MEDIUM',
          message: `Storm activity may trigger localized streetlight power failures in ${ward || 'your area'}. Drive safely.`,
          lat,
          lng,
          expiresAt,
        });
      }

      if (weather.temp > 38) {
        alerts.push({
          ward,
          alertType: 'WATER_SHORTAGE',
          severity: 'MEDIUM',
          message: `Extreme heat detected (${weather.temp}°C). High consumption may affect water pressure in ${ward || 'your area'}. Save water.`,
          lat,
          lng,
          expiresAt,
        });
      }

      const savedAlerts = [];
      for (const alert of alerts) {
        const saved = await prisma.weatherAlert.create({
          data: alert,
        });
        savedAlerts.push(saved);
      }

      return savedAlerts;
    } catch (error) {
      logger.error('Error generating civic alerts:', error);
      return [];
    }
  }
}
