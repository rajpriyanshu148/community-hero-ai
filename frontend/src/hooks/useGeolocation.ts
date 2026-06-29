'use client';

import { useState, useCallback } from 'react';

interface GeolocationState {
  lat: number | null;
  lng: number | null;
  address: string;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
}

interface GeolocationResult {
  lat: number;
  lng: number;
  address: string;
  accuracy: number;
}

const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );
    const data = await res.json();
    if (data.results?.[0]?.formatted_address) {
      return data.results[0].formatted_address;
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
};

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lng: null,
    address: '',
    accuracy: null,
    loading: false,
    error: null,
  });

  const getCurrentPosition = useCallback((): Promise<GeolocationResult> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = 'Geolocation is not supported by this browser';
        setState((prev) => ({ ...prev, error, loading: false }));
        reject(new Error(error));
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude: lat, longitude: lng, accuracy } = position.coords;

          try {
            const address = await reverseGeocode(lat, lng);
            setState({ lat, lng, address, accuracy, loading: false, error: null });
            resolve({ lat, lng, address, accuracy });
          } catch {
            const fallbackAddress = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            setState({ lat, lng, address: fallbackAddress, accuracy, loading: false, error: null });
            resolve({ lat, lng, address: fallbackAddress, accuracy });
          }
        },
        (err) => {
          let errorMsg = 'Failed to get location';
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMsg = 'Location permission denied. Please enable location access.';
              break;
            case err.POSITION_UNAVAILABLE:
              errorMsg = 'Location information unavailable.';
              break;
            case err.TIMEOUT:
              errorMsg = 'Location request timed out.';
              break;
          }
          setState((prev) => ({ ...prev, loading: false, error: errorMsg }));
          reject(new Error(errorMsg));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000,
        }
      );
    });
  }, []);

  const geocodeAddress = useCallback(async (address: string): Promise<{ lat: number; lng: number } | null> => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return null;

    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
      );
      const data = await res.json();
      if (data.results?.[0]?.geometry?.location) {
        const { lat, lng } = data.results[0].geometry.location;
        return { lat, lng };
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ lat: null, lng: null, address: '', accuracy: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    getCurrentPosition,
    geocodeAddress,
    reset,
    hasLocation: state.lat !== null && state.lng !== null,
  };
}
