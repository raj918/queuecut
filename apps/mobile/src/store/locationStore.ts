import { create } from 'zustand';

interface LocationState {
  latitude: number;
  longitude: number;
  localityName: string;
  searchRadiusMeters: number;
  hasPermission: boolean;
  setLocation: (lat: number, lon: number, locality?: string) => void;
  setRadius: (radiusMeters: number) => void;
  setPermission: (granted: boolean) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  // Default to Civil Lines / Phool Bagh, Kanpur (showcase anchor location)
  latitude: 26.4729,
  longitude: 80.3458,
  localityName: 'Civil Lines, Kanpur',
  searchRadiusMeters: 500, // 500m default as required
  hasPermission: false,

  setLocation: (latitude: number, longitude: number, locality?: string) => {
    set({
      latitude,
      longitude,
      localityName: locality || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    });
  },

  setRadius: (searchRadiusMeters: number) => {
    set({ searchRadiusMeters });
  },

  setPermission: (hasPermission: boolean) => {
    set({ hasPermission });
  },
}));
