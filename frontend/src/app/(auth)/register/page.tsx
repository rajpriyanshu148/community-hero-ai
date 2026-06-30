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

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  ward: z.string().min(1, 'Ward selection is required'),
});

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      ward: 'Ward 12',
    },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/auth/register`,
        data
      );

      if (response.data.success) {
        toast.success('Registration successful! Please log in.');
        router.push('/login');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed. Email might exist.');
    } finally {
      setLoading(false);
    }
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
            Join the Self-Healing City Ecosystem
          </h2>
          <p className="text-slate-450 text-sm">
            Create an account to report potholes, inspect lighting grids, earn badges, and verify issues reported in your neighborhood.
          </p>
        </div>

        <div className="text-xs text-slate-500 relative z-10">
          Built for a self-healing city ecosystem.
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <Card className="glass max-w-sm w-full p-8 border-slate-900 flex flex-col gap-5">
          <div className="text-center lg:text-left flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight text-white font-space">Register</h1>
            <p className="text-xs text-slate-400">Join the civic action initiative</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Full Name"
              {...register('name')}
              error={errors.name?.message as any}
              placeholder="Aarav Mehta"
            />
            <Input
              label="Email Address"
              {...register('email')}
              error={errors.email?.message as any}
              placeholder="aarav@example.com"
            />
            <Input
              label="Password"
              type="password"
              {...register('password')}
              error={errors.password?.message as any}
              placeholder="••••••••"
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400">Select Ward</label>
              <select
                {...register('ward')}
                className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:border-cyan-500/50"
              >
                <option value="Ward 1">Ward 1 (Hebbal)</option>
                <option value="Ward 5">Ward 5 (Marathahalli)</option>
                <option value="Ward 12">Ward 12 (Indiranagar)</option>
                <option value="Ward 17">Ward 17 (HSR Layout)</option>
              </select>
            </div>

            <Button type="submit" variant="civic" className="w-full py-3 h-auto text-sm mt-2" disabled={loading}>
              {loading ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : 'Register'}
            </Button>
          </form>

          <div className="text-center text-xs text-slate-400 pt-1">
            Already have an account?{' '}
            <Link href="/login" className="text-cyan-400 font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
