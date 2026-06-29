'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Shield, Sparkles, Loader } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card } from '../../../components/ui/card';
import axios from 'axios';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/auth/login`,
        data
      );

      if (response.data.success) {
        toast.success('Logged in successfully!');
        // Store token in local storage or cookie
        localStorage.setItem('access_token', response.data.data.accessToken);
        router.push('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'
    }/auth/google`;
  };

  return (
    <div className="min-h-screen bg-slate-950 grid grid-cols-1 lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-slate-900 border-r border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-900/10 to-teal-900/5 blur-[80px]" />
        
        <Link href="/" className="flex items-center gap-2 text-white font-bold font-space relative z-10">
          <Shield className="w-6 h-6 text-cyan-400" />
          <span>Community Hero AI</span>
        </Link>

        <div className="flex flex-col gap-4 relative z-10 max-w-md">
          <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
          <h2 className="text-3xl font-bold tracking-tight text-white leading-tight font-space">
            Remediate civic issues with community intelligence.
          </h2>
          <p className="text-slate-450 text-sm">
            Log in to report hazards, earn XP, complete missions, and track ward safety scores in real-time.
          </p>
        </div>

        <div className="text-xs text-slate-500 relative z-10">
          Built for a self-healing city ecosystem.
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <Card className="glass max-w-sm w-full p-8 border-slate-900 flex flex-col gap-6">
          <div className="text-center lg:text-left flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight text-white font-space">Sign In</h1>
            <p className="text-xs text-slate-400">Access your citizen dashboard</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Email Address"
              {...register('email')}
              error={errors.email?.message}
              placeholder="name@example.com"
            />
            <Input
              label="Password"
              type="password"
              {...register('password')}
              error={errors.password?.message}
              placeholder="••••••••"
            />

            <Button type="submit" variant="civic" className="w-full py-3 h-auto text-sm" disabled={loading}>
              {loading ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : 'Log In'}
            </Button>
          </form>

          <div className="relative flex items-center justify-center py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <span className="relative bg-slate-950 px-3 text-[10px] uppercase font-bold tracking-wider text-slate-500">
              Or continue with
            </span>
          </div>

          <Button
            variant="outline"
            className="w-full border-slate-800 hover:bg-slate-900 text-sm flex items-center justify-center gap-2"
            onClick={handleGoogleLogin}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google Workspace</span>
          </Button>

          <div className="text-center text-xs text-slate-400 pt-2">
            Don't have an account?{' '}
            <Link href="/register" className="text-cyan-400 font-bold hover:underline">
              Create Account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
