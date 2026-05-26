import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@services/api.service';
import type { Pet, PaginatedResponse } from '@/types';

const PETS_KEY = ['pets'] as const;

export function usePets() {
  return useQuery({
    queryKey: PETS_KEY,
    queryFn: () => apiClient.get<PaginatedResponse<Pet>>('/pets'),
  });
}

export function usePet(id: string) {
  return useQuery({
    queryKey: [...PETS_KEY, id],
    queryFn: () => apiClient.get<Pet>(`/pets/${id}`),
    enabled: !!id,
  });
}

export function useCreatePet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Pet> & { photoUri?: string }) => {
      const { photoUri, ...rest } = data;
      // Upload photo first if provided
      let photoUrl: string | undefined;
      if (photoUri) {
        const form = new FormData();
        form.append('file', { uri: photoUri, name: 'photo.jpg', type: 'image/jpeg' } as any);
        const upload = await apiClient.post<{ url: string }>('/upload', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        photoUrl = upload.url;
      }
      return apiClient.post<Pet>('/pets', { ...rest, photoUrl });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PETS_KEY });
    },
  });
}

export function useMarkPetLost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ petId, description }: { petId: string; description: string }) =>
      apiClient.post(`/pets/${petId}/lost`, { description }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PETS_KEY });
    },
  });
}

export function useMarkPetFound() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (petId: string) => apiClient.patch(`/pets/${petId}/found`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PETS_KEY });
    },
  });
}

export function useDeletePet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/pets/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PETS_KEY });
    },
  });
}
