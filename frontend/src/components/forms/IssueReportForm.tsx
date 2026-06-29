'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UploadCloud, MapPin, Loader, Mic, Sparkles, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { useIssues } from '../../hooks/useIssues';
import { useGeolocation } from '../../hooks/useGeolocation';
import axios from 'axios';
import toast from 'react-hot-toast';

const issueSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string(),
  severity: z.string(),
  lat: z.number(),
  lng: z.number(),
  address: z.string().min(5, 'Address is required'),
  ward: z.string(),
});

interface IssueReportFormProps {
  onSuccess?: () => void;
}

export const IssueReportForm: React.FC<IssueReportFormProps> = ({ onSuccess }) => {
  const [step, setStep] = useState(1);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiData, setAiData] = useState<any>(null);
  
  const { createIssue } = useIssues();
  const { location, loading: geoLoading, error: geoError, getLocation } = useGeolocation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'POTHOLE',
      severity: 'MEDIUM',
      lat: 12.971598,
      lng: 77.594562,
      address: '',
      ward: 'Ward 12',
    },
  });

  const watchAll = watch();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGetLocation = () => {
    getLocation();
    if (location) {
      setValue('lat', location.lat);
      setValue('lng', location.lng);
      setValue('address', location.address || 'Detected Location');
      setValue('ward', location.ward || 'Ward 12');
      toast.success('GPS coordinates locked.');
    }
  };

  const handleAIAnalyze = async () => {
    if (!mediaFile) {
      toast.error('Please upload an image first');
      return;
    }

    setAiAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('media', mediaFile);

      // Call API analyze route
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/ai/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        const result = response.data.data;
        setAiData(result);
        setValue('title', `${result.issueType.replace('_', ' ')} detected`);
        setValue('description', result.reasoning);
        setValue('category', result.issueType);
        setValue('severity', result.severity);
        toast.success('AI analysis complete!');
        setStep(2); // advance to review step
      }
    } catch (err) {
      loggerError(err);
      toast.error('AI service temporarily busy. You can manually fill Details.');
      setStep(2);
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Helper logger
  const loggerError = (err: any) => {
    console.error(err);
  };

  const onSubmitForm = async (data: any) => {
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('category', data.category);
      formData.append('severity', data.severity);
      formData.append('lat', String(data.lat));
      formData.append('lng', String(data.lng));
      formData.append('address', data.address);
      formData.append('ward', data.ward);
      if (mediaFile) {
        formData.append('media', mediaFile);
      }
      if (aiData) {
        formData.append('aiAnalysis', JSON.stringify(aiData));
      }

      await createIssue.mutateAsync(formData);
      toast.success('Issue reported successfully!');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit report');
    }
  };

  return (
    <div className="max-w-xl mx-auto w-full">
      {/* Steps indicator */}
      <div className="flex justify-between items-center mb-6 px-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border transition-all ${
                step >= s
                  ? 'bg-cyan-500 border-cyan-500 text-slate-950'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              {step > s ? <Check className="w-4 h-4" /> : s}
            </div>
            <span className={`text-xs font-semibold ${step >= s ? 'text-cyan-400' : 'text-slate-500'}`}>
              {s === 1 ? 'Media & AI' : s === 2 ? 'Details' : 'Confirm'}
            </span>
            {s < 3 && <div className={`w-12 h-[2px] ${step > s ? 'bg-cyan-500' : 'bg-slate-800'}`} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmitForm)}>
        {step === 1 && (
          <Card className="glass p-6 border-slate-800 flex flex-col gap-6">
            <div className="text-center">
              <h3 className="text-lg font-bold text-white mb-1">Upload Issue Media</h3>
              <p className="text-xs text-slate-400">Upload a clear photo or short video clip of the issue.</p>
            </div>

            {mediaPreview ? (
              <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-800">
                <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute bottom-3 right-3 text-xs bg-slate-950/80 border-slate-800 text-white"
                  onClick={() => {
                    setMediaPreview(null);
                    setMediaFile(null);
                  }}
                >
                  Change Photo
                </Button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-800 hover:border-cyan-500/40 rounded-xl aspect-video flex flex-col items-center justify-center gap-3 cursor-pointer group transition-all bg-slate-950/20">
                <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
                <UploadCloud className="w-10 h-10 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                <div className="text-center">
                  <span className="text-sm font-bold text-slate-350 block">Click to upload photo</span>
                  <span className="text-xs text-slate-500">Supports JPEG, PNG, MP4 up to 10MB</span>
                </div>
              </label>
            )}

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 py-3 h-auto text-sm border-slate-800 flex items-center justify-center gap-2 hover:bg-slate-900"
                onClick={() => setStep(2)}
              >
                Skip AI, Fill Manually
              </Button>
              <Button
                type="button"
                variant="civic"
                className="flex-1 py-3 h-auto text-sm flex items-center justify-center gap-2"
                onClick={handleAIAnalyze}
                disabled={!mediaFile || aiAnalyzing}
              >
                {aiAnalyzing ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>AI Auto-Analyze</span>
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card className="glass p-6 border-slate-800 flex flex-col gap-5">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Issue Details</h3>
              <p className="text-xs text-slate-400">Review AI predictions or fill them manually.</p>
            </div>

            {aiData && (
              <div className="bg-cyan-950/20 border border-cyan-500/20 rounded-xl p-4 flex gap-3 text-xs text-cyan-200">
                <Sparkles className="w-5 h-5 flex-shrink-0 text-cyan-400 animate-pulse" />
                <div>
                  <span className="font-bold block">AI Suggested Classification</span>
                  <span>Category: {aiData.issueType}, Severity: {aiData.severity} ({Math.round(aiData.confidence * 100)}% confidence). Reasoning: {aiData.reasoning}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <Input label="Title" {...register('title')} error={errors.title?.message} placeholder="Brief issue title" />
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Detailed Description</label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="bg-slate-950 border border-slate-800 focus:border-cyan-500/50 rounded-lg p-3 text-sm text-white resize-none"
                  placeholder="Detail the hazard, approximate size, impact on flow/safety..."
                />
                {errors.description && <span className="text-[10px] text-rose-500 font-bold">{errors.description.message}</span>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400">Category</label>
                  <select
                    {...register('category')}
                    className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:border-cyan-500/50"
                  >
                    <option value="POTHOLE">Pothole</option>
                    <option value="WATER_LEAKAGE">Water Leakage</option>
                    <option value="GARBAGE">Garbage Overflow</option>
                    <option value="STREETLIGHT">Streetlight Failure</option>
                    <option value="SEWAGE">Sewage Issue</option>
                    <option value="INFRASTRUCTURE">Broken Infrastructure</option>
                    <option value="OTHER">Other Category</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400">Severity</label>
                  <select
                    {...register('severity')}
                    className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:border-cyan-500/50"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400">Location Settings</label>
                <div className="flex gap-2">
                  <Input {...register('address')} error={errors.address?.message} placeholder="Geocoded location address" className="flex-1" />
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-800 px-3 hover:bg-slate-900 text-slate-300"
                    onClick={handleGetLocation}
                    disabled={geoLoading}
                  >
                    {geoLoading ? <Loader className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <Button type="button" variant="outline" className="flex-1 border-slate-800" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button type="button" variant="civic" className="flex-1" onClick={() => setStep(3)}>
                Next Step
              </Button>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card className="glass p-6 border-slate-800 flex flex-col gap-6">
            <div className="text-center">
              <h3 className="text-lg font-bold text-white mb-1">Confirm Submission</h3>
              <p className="text-xs text-slate-400">Verify your information before finalizing.</p>
            </div>

            <div className="border border-slate-800 rounded-xl p-4 flex flex-col gap-3 bg-slate-950/20">
              {mediaPreview && (
                <div className="aspect-video w-full rounded-lg overflow-hidden border border-slate-800 mb-2">
                  <img src={mediaPreview} alt="Final" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex flex-col gap-1.5 text-sm">
                <div className="flex justify-between border-b border-slate-800/40 pb-2">
                  <span className="text-slate-500 font-semibold">Title:</span>
                  <span className="text-white font-bold">{watchAll.title}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/40 pb-2">
                  <span className="text-slate-500 font-semibold">Category:</span>
                  <span className="text-white font-bold">{watchAll.category}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/40 pb-2">
                  <span className="text-slate-500 font-semibold">Severity:</span>
                  <span className={`font-bold ${watchAll.severity === 'CRITICAL' ? 'text-rose-500' : 'text-slate-200'}`}>{watchAll.severity}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-500 font-semibold">Address:</span>
                  <span className="text-slate-300 text-xs leading-relaxed">{watchAll.address}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" className="flex-1 border-slate-800" onClick={() => setStep(2)}>
                Edit Details
              </Button>
              <Button type="submit" variant="civic" className="flex-1 py-3 h-auto text-sm flex items-center justify-center gap-2" disabled={createIssue.isPending}>
                {createIssue.isPending ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Report</span>
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}
      </form>
    </div>
  );
};
