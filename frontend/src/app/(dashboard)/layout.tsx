'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../components/shared/Sidebar';
import { NotificationBell } from '../../components/shared/NotificationBell';
import { Shield, Loader } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        // Fetch current user from /auth/me
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/auth/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data.success) {
          setUserData(response.data.data.user);
        } else {
          localStorage.removeItem('access_token');
          router.push('/login');
        }
      } catch (err) {
        localStorage.removeItem('access_token');
        router.push('/login');
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center gap-4 z-50">
        <Loader className="w-8 h-8 text-cyan-400 animate-spin" />
        <span className="text-xs text-slate-550 font-bold uppercase tracking-wider">
          Verifying credentials...
        </span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar user={userData} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64">
        {/* Header */}
        <header className="h-16 border-b border-slate-900 bg-slate-950/80 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white font-space uppercase tracking-wider md:hidden">
              Community Hero
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Real-time Notification Bell */}
            <NotificationBell />

            {/* Profile Avatar */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-xs text-cyan-400">
                {userData?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:flex flex-col gap-0.5">
                <span className="text-xs font-bold text-white leading-none">{userData?.name}</span>
                <span className="text-[10px] text-slate-500 uppercase font-bold leading-none">
                  {userData?.role}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
