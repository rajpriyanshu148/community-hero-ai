import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Notification } from '@/types';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;

  // Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
}

export const useNotificationsStore = create<NotificationsState>()(
  devtools(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isOpen: false,

      setNotifications: (notifications: Notification[]) =>
        set(
          {
            notifications,
            unreadCount: notifications.filter((n) => !n.isRead).length,
          },
          false,
          'notifications/setNotifications'
        ),

      addNotification: (notification: Notification) =>
        set(
          (state) => {
            const exists = state.notifications.find((n) => n.id === notification.id);
            if (exists) return state;
            const updated = [notification, ...state.notifications].slice(0, 50); // Keep max 50
            return {
              notifications: updated,
              unreadCount: updated.filter((n) => !n.isRead).length,
            };
          },
          false,
          'notifications/addNotification'
        ),

      markRead: (id: string) =>
        set(
          (state) => {
            const updated = state.notifications.map((n) =>
              n.id === id ? { ...n, isRead: true } : n
            );
            return {
              notifications: updated,
              unreadCount: updated.filter((n) => !n.isRead).length,
            };
          },
          false,
          'notifications/markRead'
        ),

      markAllRead: () =>
        set(
          (state) => ({
            notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
            unreadCount: 0,
          }),
          false,
          'notifications/markAllRead'
        ),

      removeNotification: (id: string) =>
        set(
          (state) => {
            const updated = state.notifications.filter((n) => n.id !== id);
            return {
              notifications: updated,
              unreadCount: updated.filter((n) => !n.isRead).length,
            };
          },
          false,
          'notifications/removeNotification'
        ),

      clearAll: () =>
        set({ notifications: [], unreadCount: 0 }, false, 'notifications/clearAll'),

      setOpen: (open: boolean) =>
        set({ isOpen: open }, false, 'notifications/setOpen'),

      toggleOpen: () => {
        const { isOpen } = get();
        set({ isOpen: !isOpen }, false, 'notifications/toggleOpen');
      },
    }),
    { name: 'NotificationsStore' }
  )
);
