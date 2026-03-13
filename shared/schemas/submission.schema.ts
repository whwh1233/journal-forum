/**
 * Submission Zod Schemas
 * Manuscript, submission records, status history related schemas
 */

import { z } from 'zod';
import { JournalSchema } from './journal.schema';

// ==================== Submission Status ====================

export const SubmissionStatusSchema = z.enum([
  'submitted',
  'with_editor',
  'under_review',
  'major_revision',
  'minor_revision',
  'revision_submitted',
  'accepted',
  'rejected',
  'withdrawn',
]);

// ==================== Submission Status History ====================

export const SubmissionStatusHistorySchema = z.object({
  id: z.number().int(),
  submissionId: z.number().int(),
  status: z.string(),
  date: z.string(),
  note: z.string().optional(),
  createdAt: z.string(),
});

// ==================== Submission Record ====================

export const SubmissionRecordSchema = z.object({
  id: z.number().int(),
  userId: z.string(),
  manuscriptId: z.number().int(),
  journalId: z.string().optional(),
  journalName: z.string().optional(),
  submissionDate: z.string(),
  status: z.string(),
  journal: JournalSchema.optional(),
  statusHistory: z.array(SubmissionStatusHistorySchema).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ==================== Manuscript ====================

export const ManuscriptSchema = z.object({
  id: z.number().int(),
  userId: z.string(),
  title: z.string(),
  currentStatus: z.string(),
  submissions: z.array(SubmissionRecordSchema).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ==================== Create Manuscript ====================

export const CreateManuscriptSchema = z.object({
  title: z.string().min(1).max(500),
});

// ==================== Update Manuscript ====================

export const UpdateManuscriptSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  currentStatus: z.string().optional(),
});

// ==================== Create Submission ====================

export const CreateSubmissionSchema = z.object({
  manuscriptId: z.number().int(),
  journalId: z.string().optional(),
  journalName: z.string().optional(),
  submissionDate: z.string(),
  status: z.string(),
  note: z.string().optional(),
});

// ==================== Update Submission ====================

export const UpdateSubmissionSchema = z.object({
  journalId: z.string().optional(),
  journalName: z.string().optional(),
  submissionDate: z.string().optional(),
  status: z.string().optional(),
});

// ==================== Add Status History ====================

export const AddStatusHistorySchema = z.object({
  status: z.string().min(1),
  date: z.string(),
  note: z.string().optional(),
});

// ==================== Submission Status Option ====================

export const SubmissionStatusOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  color: z.string(),
});

// Predefined status options
export const SUBMISSION_STATUS_OPTIONS = [
  { value: 'submitted', label: '已投递', color: '#3b82f6' },
  { value: 'with_editor', label: '编辑处理中', color: '#8b5cf6' },
  { value: 'under_review', label: '外审中', color: '#f59e0b' },
  { value: 'major_revision', label: '大修', color: '#ef4444' },
  { value: 'minor_revision', label: '小修', color: '#f97316' },
  { value: 'revision_submitted', label: '修回已提交', color: '#6366f1' },
  { value: 'accepted', label: '录用', color: '#10b981' },
  { value: 'rejected', label: '拒稿', color: '#dc2626' },
  { value: 'withdrawn', label: '撤稿', color: '#6b7280' },
] as const;
