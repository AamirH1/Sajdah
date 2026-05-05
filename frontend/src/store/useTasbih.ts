import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TasbihCounter {
  id: string;
  name: string;
  count: number;
  target: number;
  lastUsed: string;
}

interface TasbihState {
  counters: TasbihCounter[];
  activeCounterId: string | null;
  addCounter: (name: string, target?: number) => void;
  increment: (id: string) => void;
  reset: (id: string) => void;
  deleteCounter: (id: string) => void;
  setActive: (id: string | null) => void;
}

const DEFAULT_COUNTERS: TasbihCounter[] = [
  { id: '1', name: 'SubhanAllah', count: 0, target: 33, lastUsed: new Date().toISOString() },
  { id: '2', name: 'Alhamdulillah', count: 0, target: 33, lastUsed: new Date().toISOString() },
  { id: '3', name: 'Allahu Akbar', count: 0, target: 34, lastUsed: new Date().toISOString() },
  { id: '4', name: 'La ilaha illallah', count: 0, target: 100, lastUsed: new Date().toISOString() },
];

export const useTasbih = create<TasbihState>()(
  persist(
    (set, get) => ({
      counters: DEFAULT_COUNTERS,
      activeCounterId: null,
      addCounter: (name, target = 100) => {
        const newCounter: TasbihCounter = {
          id: Date.now().toString(),
          name,
          count: 0,
          target,
          lastUsed: new Date().toISOString(),
        };
        set((state) => ({ counters: [...state.counters, newCounter] }));
      },
      increment: (id) => {
        set((state) => ({
          counters: state.counters.map((c) =>
            c.id === id ? { ...c, count: c.count + 1, lastUsed: new Date().toISOString() } : c
          ),
        }));
      },
      reset: (id) => {
        set((state) => ({
          counters: state.counters.map((c) =>
            c.id === id ? { ...c, count: 0 } : c
          ),
        }));
      },
      deleteCounter: (id) => {
        set((state) => ({
          counters: state.counters.filter((c) => c.id !== id),
        }));
      },
      setActive: (id) => set({ activeCounterId: id }),
    }),
    {
      name: 'tasbih-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
