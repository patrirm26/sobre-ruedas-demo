import type { StateCreator } from 'zustand';
import type { StoreState } from '../store';
import type { Card } from '../../domain/card';
import { SEED_CARDS } from '../../data/seedCards';

export interface CardSlice {
  cards: Card[];
  addCard: (card: Card) => void;
  updateCard: (id: string, patch: Partial<Card>) => void;
}

export const createCardSlice: StateCreator<StoreState, [], [], CardSlice> = (set) => ({
  cards: SEED_CARDS,

  addCard: (card) => set((state) => ({ cards: [card, ...state.cards] })),

  updateCard: (id, patch) =>
    set((state) => ({ cards: state.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
});
