import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { IssueSeverity, IssueCategory } from '@prisma/client';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import type { AIAnalysis, FraudCheck, PredictionResult } from '../types';

// ============================================================
// Gemini Client
// ============================================================
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || 'placeholder');
const VISION_MODEL = 'gemini-1.5-flash';
const TEXT_MODEL = 'gemini-1.5-flash';

// ============================================================
// Type Helpers
// ============================================================
const severityFromString = (s: string): IssueSeverity => {
  const map: Record<string, IssueSeverity> = {
    LOW: IssueSeverity.LOW,
    MEDIUM: IssueSeverity.MEDIUM,
    HIGH: IssueSeverity.HIGH,
    CRITICAL: IssueSeverity.CRITICAL,
  };
  return map[s?.toUpperCase()] ?? IssueSeverity.MEDIUM;
};

// ============================================================
// Gemini Service
// ============================================================
class GeminiService {
  private extractJSON(text: string): string {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) return jsonMatch[1];

    // Find raw JSON object
    const objMatch = text.match(/\{[\s\S]*\}/);
    if (objMatch) return objMatch[0];

    return text;
  }

  /**
   * Analyze civic issue from image (base64 or URL)
   */
  async analyzeIssueMedia(
    base64OrUrl: string,
    mimeType = 'image/jpeg'
  ): Promise<AIAnalysis | null> {
    if (!env.GEMINI_API_KEY) {
      logger.warn('GEMINI_API_KEY not set — skipping AI analysis');
      return null;
    }

    try {
      const model = genAI.getGenerativeModel({ model: VISION_MODEL });

      const prompt = `You are a civic infrastructure expert AI. Analyze this image of a reported civic issue.

Return ONLY a valid JSON object with exactly these fields:
{
  "issueType": "Brief name of the issue (e.g. 'Pothole', 'Burst Water Pipe', 'Broken Street Light')",
  "severity": "One of: LOW, MEDIUM, HIGH, CRITICAL",
  "confidence": 0.0 to 1.0,
  "publicRisk": "One of: LOW, MEDIUM, HIGH, CRITICAL",
  "department": "One of: POTHOLE, WATER_LEAKAGE, GARBAGE, STREETLIGHT, SEWAGE, INFRASTRUCTURE, OTHER",
  "estimatedResolutionTime": "e.g. '2-4 hours' or '3-5 days'",
  "estimatedCost": "e.g. '₹5,000 - ₹15,000'",
  "reasoning": "2-3 sentence explanation of your assessment",
  "tags": ["array", "of", "relevant", "tags"]
}

Guidelines:
- CRITICAL: Imminent danger (open manhole, live wire, major flood)
- HIGH: Significant infrastructure failure affecting many people
- MEDIUM: Issue causing inconvenience but not dangerous
- LOW: Minor cosmetic or low-impact issue
- Estimate cost and time realistically for Indian municipal context
- Tags should be specific (e.g. "road damage", "open pothole", "water wastage")`;

      const imagePart: Part = {
        inlineData: {
          data: base64OrUrl,
          mimeType: mimeType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
        },
      };

      const result = await model.generateContent([prompt, imagePart]);
      const text = result.response.text();

      const jsonStr = this.extractJSON(text);
      const parsed = JSON.parse(jsonStr);

      return {
        issueType: String(parsed.issueType || 'Unknown Issue'),
        severity: severityFromString(parsed.severity),
        confidence: Math.min(1, Math.max(0, parseFloat(parsed.confidence) || 0.7)),
        publicRisk: String(parsed.publicRisk || 'MEDIUM'),
        department: String(parsed.department || 'OTHER'),
        estimatedResolutionTime: String(parsed.estimatedResolutionTime || '2-7 days'),
        estimatedCost: String(parsed.estimatedCost || '₹10,000 - ₹50,000'),
        reasoning: String(parsed.reasoning || 'Analysis complete.'),
        tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : [],
      };
    } catch (err) {
      logger.error('Gemini vision analysis failed:', err);
      return null;
    }
  }

  /**
   * Generate ward-level predictions based on historical and weather data
   */
  async generatePredictions(
    ward: string,
    historicalData: {
      category: string;
      count: number;
      avgSeverity: string;
    }[],
    weatherData: {
      description: string;
      temp: number;
      humidity: number;
      rain?: number;
    } | null
  ): Promise<PredictionResult[]> {
    if (!env.GEMINI_API_KEY) {
      logger.warn('GEMINI_API_KEY not set — using fallback predictions');
      return this.fallbackPredictions(ward, historicalData);
    }

    try {
      const model = genAI.getGenerativeModel({ model: TEXT_MODEL });

      const historicalSummary = historicalData
        .map((h) => `${h.category}: ${h.count} issues (avg severity: ${h.avgSeverity})`)
        .join('\n');

      const weatherSummary = weatherData
        ? `Current: ${weatherData.description}, Temp: ${weatherData.temp}°C, Humidity: ${weatherData.humidity}%, Rain: ${weatherData.rain ?? 0}mm`
        : 'Weather data unavailable';

      const prompt = `You are a civic infrastructure prediction AI for Indian cities.

Ward: ${ward}

Historical issue data (last 30 days):
${historicalSummary || 'No historical data available'}

Current Weather:
${weatherSummary}

Based on this data, predict 3-5 civic issues that are LIKELY to emerge in the next 7 days in this ward.

Return ONLY a valid JSON array:
[
  {
    "issueType": "Category of the predicted issue (e.g. POTHOLE, WATER_LEAKAGE, GARBAGE, STREETLIGHT, SEWAGE)",
    "probability": 0.0 to 1.0,
    "reasoning": "Why this issue is likely to emerge",
    "weatherContext": "How current weather contributes to this prediction"
  }
]

Consider:
- Heavy rain → potholes worsen, flooding, sewage overflow
- Summer heat → water demand spikes, pipe bursts
- Pre-monsoon → infrastructure stress
- High humidity → electrical issues, corrosion
- Historical patterns (if category X had many issues before, predict recurrence)`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonStr = this.extractJSON(text);
      const parsed = JSON.parse(jsonStr);

      if (!Array.isArray(parsed)) return [];

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      return parsed.slice(0, 5).map((p) => ({
        issueType: String(p.issueType || 'OTHER'),
        ward,
        probability: Math.min(1, Math.max(0, parseFloat(p.probability) || 0.5)),
        reasoning: String(p.reasoning || 'Based on historical patterns.'),
        weatherContext: p.weatherContext ? String(p.weatherContext) : undefined,
        expiresAt,
      }));
    } catch (err) {
      logger.error('Gemini prediction generation failed:', err);
      return this.fallbackPredictions(ward, historicalData);
    }
  }

  private fallbackPredictions(
    ward: string,
    historicalData: { category: string; count: number }[]
  ): PredictionResult[] {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Use top categories from history
    return historicalData
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((h) => ({
        issueType: h.category,
        ward,
        probability: Math.min(0.9, h.count / 20),
        reasoning: `Based on ${h.count} recent ${h.category.toLowerCase()} reports in this ward.`,
        expiresAt,
      }));
  }

  /**
   * Check if an issue submission appears fraudulent
   */
  async checkFraud(
    imageBase64: string,
    userHistory: {
      id: string;
      category: string;
      createdAt: Date;
      isFraudFlagged: boolean;
    }[]
  ): Promise<FraudCheck> {
    if (!env.GEMINI_API_KEY) {
      return { isSuspicious: false, reasons: [], confidence: 0.5 };
    }

    try {
      const model = genAI.getGenerativeModel({ model: VISION_MODEL });

      const historyFlagged = userHistory.filter((h) => h.isFraudFlagged).length;
      const recentCount = userHistory.filter(
        (h) => Date.now() - h.createdAt.getTime() < 24 * 60 * 60 * 1000
      ).length;

      const prompt = `You are a fraud detection AI for a civic issue reporting platform.

Analyze this image for signs of fraudulent reporting.

User history context:
- Total reports: ${userHistory.length}
- Previously flagged reports: ${historyFlagged}
- Reports in last 24 hours: ${recentCount}

Check for:
1. Image manipulation or editing artifacts
2. Stock photos or clearly downloaded images (not taken on-site)
3. Images that don't show actual civic infrastructure issues
4. Repeated or duplicate-looking content
5. Images taken indoors presented as outdoor infrastructure issues

Return ONLY valid JSON:
{
  "isSuspicious": true or false,
  "reasons": ["List of specific reasons if suspicious"],
  "confidence": 0.0 to 1.0
}`;

      const imagePart: Part = {
        inlineData: {
          data: imageBase64,
          mimeType: 'image/jpeg',
        },
      };

      const result = await model.generateContent([prompt, imagePart]);
      const text = result.response.text();
      const jsonStr = this.extractJSON(text);
      const parsed = JSON.parse(jsonStr);

      // Also factor in user history
      const historySuspicious = historyFlagged >= 3 || recentCount >= 5;
      const finalSuspicious = Boolean(parsed.isSuspicious) || historySuspicious;

      return {
        isSuspicious: finalSuspicious,
        reasons: [
          ...(Array.isArray(parsed.reasons) ? parsed.reasons.map(String) : []),
          ...(recentCount >= 5 ? [`User submitted ${recentCount} reports in last 24 hours`] : []),
          ...(historyFlagged >= 3 ? [`User has ${historyFlagged} previously flagged reports`] : []),
        ],
        confidence: Math.min(1, Math.max(0, parseFloat(parsed.confidence) || 0.5)),
      };
    } catch (err) {
      logger.error('Gemini fraud check failed:', err);
      return { isSuspicious: false, reasons: ['Fraud check unavailable'], confidence: 0.3 };
    }
  }
}

export const geminiService = new GeminiService();
export default geminiService;
