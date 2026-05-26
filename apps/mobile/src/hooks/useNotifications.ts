import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@services/api.service';
import type { Notification, PaginatedResponse } from '@/types';

const NOTIF_KEY = ['notifications'] as const;

interface NotificationsResponse extends PaginatedResponse<Notification> {
  unreadCount: number;
}

export function useNotifications(page = 1) {
  const query = useQuery({
    queryKey: [...NOTIF_KEY, page],
    queryFn: () => apiClient.get<NotificationsResponse>(`/notifications?page=${page}&limit=20`),
  });

  return {
    ...query,
    unreadCount: query.data?.unreadCount ?? 0,
  };
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.patch('/notifications/read-all', {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIF_KEY }),
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.patch(`/notifications/${id}/read`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIF_KEY }),
  });
}
