import { z } from 'zod';
import { CheckInMethod, AttendanceStatus } from '@/types';

export const checkInSchema = z.object({
  classId: z.string().uuid('ID da aula inválido'),
  method: z.nativeEnum(CheckInMethod).default(CheckInMethod.MANUAL),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export const attendanceHistoryQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.nativeEnum(AttendanceStatus).optional(),
  classId: z.string().uuid().optional(),
});

export const updateAttendanceSchema = z.object({
  status: z.nativeEnum(AttendanceStatus),
  notes: z.string().optional(),
  checkInTime: z.string().datetime().optional(),
});

export const attendanceStatsQuerySchema = z.object({
  studentId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
});

export type CheckInInput = z.infer<typeof checkInSchema>;
export type AttendanceHistoryQuery = z.infer<typeof attendanceHistoryQuerySchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
export type AttendanceStatsQuery = z.infer<typeof attendanceStatsQuerySchema>;