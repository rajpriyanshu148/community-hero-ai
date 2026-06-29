'use client';

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { issuesApi } from '@/lib/api';
import type { Issue, IssueFilters, PaginatedResponse, ApiResponse, CreateIssueDto, UpdateIssueStatusDto, VerifyIssueDto } from '@/types';
import toast from 'react-hot-toast';

const ISSUES_KEY = 'issues';

// ========================
// Query: Get All Issues
// ========================
export function useIssues(filters?: IssueFilters) {
  return useQuery({
    queryKey: [ISSUES_KEY, filters],
    queryFn: () =>
      issuesApi.getAll(filters as Record<string, unknown>) as Promise<
        PaginatedResponse<Issue>
      >,
    staleTime: 30 * 1000, // 30s
    refetchOnWindowFocus: true,
  });
}

// ========================
// Query: Get Single Issue
// ========================
export function useIssue(id: string, options?: Partial<UseQueryOptions<ApiResponse<Issue>>>) {
  return useQuery<ApiResponse<Issue>>({
    queryKey: [ISSUES_KEY, id],
    queryFn: () => issuesApi.getById(id) as Promise<ApiResponse<Issue>>,
    enabled: !!id,
    staleTime: 10 * 1000,
    ...options,
  });
}

// ========================
// Mutation: Create Issue
// ========================
export function useCreateIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => issuesApi.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ISSUES_KEY] });
      toast.success('Issue reported successfully! 🎉', {
        style: { background: '#0F172A', color: '#F1F5F9', border: '1px solid rgba(6,182,212,0.3)' },
      });
    },
    onError: (error: { userMessage?: string }) => {
      toast.error(error.userMessage || 'Failed to create issue', {
        style: { background: '#0F172A', color: '#F1F5F9', border: '1px solid rgba(239,68,68,0.3)' },
      });
    },
  });
}

// ========================
// Mutation: Update Issue Status
// ========================
export function useUpdateIssueStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIssueStatusDto }) =>
      issuesApi.updateStatus(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [ISSUES_KEY, id] });
      queryClient.invalidateQueries({ queryKey: [ISSUES_KEY] });
      toast.success('Issue status updated');
    },
    onError: (error: { userMessage?: string }) => {
      toast.error(error.userMessage || 'Failed to update status');
    },
  });
}

// ========================
// Mutation: Upvote Issue
// ========================
export function useUpvoteIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => issuesApi.upvote(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [ISSUES_KEY, id] });
      queryClient.invalidateQueries({ queryKey: [ISSUES_KEY] });
    },
    onError: (error: { userMessage?: string }) => {
      toast.error(error.userMessage || 'Failed to upvote');
    },
  });
}

// ========================
// Mutation: Verify Issue
// ========================
export function useVerifyIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: VerifyIssueDto }) =>
      issuesApi.verify(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [ISSUES_KEY, id] });
      toast.success('Verification submitted! +XP');
    },
    onError: (error: { userMessage?: string }) => {
      toast.error(error.userMessage || 'Failed to verify');
    },
  });
}

// ========================
// Mutation: Analyze Media
// ========================
export function useAnalyzeMedia() {
  return useMutation({
    mutationFn: (formData: FormData) => issuesApi.analyzeMedia(formData),
    onError: (error: { userMessage?: string }) => {
      toast.error(error.userMessage || 'AI analysis failed');
    },
  });
}

// ========================
// Query: Issues by Ward
// ========================
export function useIssuesByWard(wardNumber: number) {
  return useQuery({
    queryKey: [ISSUES_KEY, 'ward', wardNumber],
    queryFn: () => issuesApi.getByWard(wardNumber),
    enabled: !!wardNumber,
    staleTime: 60 * 1000,
  });
}
