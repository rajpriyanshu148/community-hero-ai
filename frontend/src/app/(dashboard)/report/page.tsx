'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { IssueReportForm } from '../../../components/forms/IssueReportForm';
import { ChevronLeft } from 'lucide-react';
import { Button } from '../../../components/ui/button';

export default function ReportPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/dashboard');
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          className="border-slate-800 p-2 hover:bg-slate-900"
          onClick={() => router.back()}
        >
          <ChevronLeft className="w-5 h-5 text-slate-400" />
        </Button>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white font-space">Report Civic Issue</h2>
          <p className="text-xs text-slate-500">Provide photos and details for AI auto-fill</p>
        </div>
      </div>

      <div className="py-4">
        <IssueReportForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
