import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { IssueFilters, IssueCategory, IssueSeverity, IssueStatus } from '@/types';

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  activeFilters: IssueFilters;
  mapView: 'standard' | 'heatmap' | 'satellite';
  theme: 'dark' | 'light';
  commandPaletteOpen: boolean;

  // Actions
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setFilter: (key: keyof IssueFilters, value: IssueFilters[keyof IssueFilters]) => void;
  resetFilters: () => void;
  setMapView: (view: 'standard' | 'heatmap' | 'satellite') => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
}

const defaultFilters: IssueFilters = {
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
  limit: 20,
};

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        sidebarOpen: true,
        sidebarCollapsed: false,
        activeFilters: defaultFilters,
        mapView: 'standard',
        theme: 'dark',
        commandPaletteOpen: false,

        setSidebarOpen: (open: boolean) =>
          set({ sidebarOpen: open }, false, 'ui/setSidebarOpen'),

        toggleSidebar: () => {
          const { sidebarOpen } = get();
          set({ sidebarOpen: !sidebarOpen }, false, 'ui/toggleSidebar');
        },

        setSidebarCollapsed: (collapsed: boolean) =>
          set({ sidebarCollapsed: collapsed }, false, 'ui/setSidebarCollapsed'),

        toggleSidebarCollapsed: () => {
          const { sidebarCollapsed } = get();
          set({ sidebarCollapsed: !sidebarCollapsed }, false, 'ui/toggleSidebarCollapsed');
        },

        setFilter: (key: keyof IssueFilters, value: IssueFilters[keyof IssueFilters]) =>
          set(
            (state) => ({
              activeFilters: {
                ...state.activeFilters,
                [key]: value,
                page: key !== 'page' ? 1 : (value as number),
              },
            }),
            false,
            'ui/setFilter'
          ),

        resetFilters: () =>
          set({ activeFilters: defaultFilters }, false, 'ui/resetFilters'),

        setMapView: (view: 'standard' | 'heatmap' | 'satellite') =>
          set({ mapView: view }, false, 'ui/setMapView'),

        setTheme: (theme: 'dark' | 'light') =>
          set({ theme }, false, 'ui/setTheme'),

        setCommandPaletteOpen: (open: boolean) =>
          set({ commandPaletteOpen: open }, false, 'ui/setCommandPaletteOpen'),

        toggleCommandPalette: () => {
          const { commandPaletteOpen } = get();
          set({ commandPaletteOpen: !commandPaletteOpen }, false, 'ui/toggleCommandPalette');
        },
      }),
      {
        name: 'community-hero-ui',
        partialize: (state) => ({
          sidebarCollapsed: state.sidebarCollapsed,
          mapView: state.mapView,
          theme: state.theme,
        }),
      }
    ),
    { name: 'UIStore' }
  )
);
