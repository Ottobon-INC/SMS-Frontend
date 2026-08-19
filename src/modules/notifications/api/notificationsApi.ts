/**
 * API Service for Notifications module using standard fetch.
 */

export interface NotificationLog {
  id: string;
  tenant_id: string;
  branch_id?: string | null;
  event_type: string;
  entity_id: string;
  student_id?: string | null;
  student_name?: string | null;
  student_number?: string | null;
  section_name?: string | null;
  recipient_phone?: string | null;
  template_name: string;
  idempotency_key: string;
  provider_message_id?: string | null;
  delivery_status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'FAILED_MISSING_PHONE';
  error_message?: string | null;
  sent_at?: string | null;
  delivered_at?: string | null;
  read_at?: string | null;
  created_at: string;
}

export interface DispatchProgress {
  entity_id: string;
  status: string;
  total_notifications: number;
  completed_notifications: number;
  failed_notifications: number;
  missing_phone_notifications: number;
  progress_percentage: number;
  is_ongoing: boolean;
}

export const notificationsApi = {
  getLogs: async (branchId?: string, limit: number = 100): Promise<NotificationLog[]> => {
    const params = new URLSearchParams();
    if (branchId) params.append('branch_id', branchId);
    params.append('limit', limit.toString());
    const res = await fetch(`/api/v1/whatsapp/logs?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch notification logs');
    return res.json();
  },

  getProgress: async (entityId: string): Promise<DispatchProgress> => {
    const res = await fetch(`/api/v1/whatsapp/progress/${entityId}`);
    if (!res.ok) throw new Error('Failed to fetch dispatch progress');
    return res.json();
  },

  updateGuardianPhone: async (studentId: string, mobile: string): Promise<{ status: string; mobile: string }> => {
    const res = await fetch('/api/v1/whatsapp/update-guardian-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId, mobile }),
    });
    if (!res.ok) throw new Error('Failed to update guardian mobile number');
    return res.json();
  },
};
