'use client';

import { useQuery } from '@tanstack/react-query';
import { predictionsApi } from '@/lib/api';
import type { Prediction, WeatherAlert, ApiResponse, PaginatedResponse } from '@/types';

// ========================
// Query: Predictions by Ward
// ========================
export function usePredictions(wardNumber?: number) {
  return useQuery({
    queryKey: ['predictions', 'ward', wardNumber],
    queryFn: () => predictionsApi.getByWard(wardNumber!) as Promise<PaginatedResponse<Prediction>>,
    enabled: !!wardNumber,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 min
  });
}

// ========================
// Query: All Predictions
// ========================
export function useAllPredictions() {
  return useQuery({
    queryKey: ['predictions', 'all'],
    queryFn: () => predictionsApi.getAll() as Promise<PaginatedResponse<Prediction>>,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
}

// ========================
// Query: Weather Alerts
// ========================
export function useWeatherAlerts(lat?: number, lng?: number) {
  return useQuery({
    queryKey: ['predictions', 'weather', lat, lng],
    queryFn: () =>
      predictionsApi.getWeatherAlerts(lat!, lng!) as Promise<ApiResponse<WeatherAlert[]>>,
    enabled: !!lat && !!lng,
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchInterval: 60 * 60 * 1000, // Refetch every hour
  });
}
