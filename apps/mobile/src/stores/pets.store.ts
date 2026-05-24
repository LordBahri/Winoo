import { create } from 'zustand';
import type { Pet } from '@types/index';

interface PetsState {
  selectedPetId: string | null;
  setSelectedPet: (id: string | null) => void;
  optimisticUpdates: Record<string, Partial<Pet>>;
  applyOptimisticUpdate: (id: string, update: Partial<Pet>) => void;
  clearOptimisticUpdate: (id: string) => void;
}

export const usePetsStore = create<PetsState>((set) => ({
  selectedPetId: null,
  setSelectedPet: (id) => set({ selectedPetId: id }),
  optimisticUpdates: {},
  applyOptimisticUpdate: (id, update) =>
    set(state => ({
      optimisticUpdates: { ...state.optimisticUpdates, [id]: { ...state.optimisticUpdates[id], ...update } },
    })),
  clearOptimisticUpdate: (id) =>
    set(state => {
      const { [id]: _, ...rest } = state.optimisticUpdates;
      return { optimisticUpdates: rest };
    }),
}));
