'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/apiClient';

export function useConditions() {
  return useQuery({
    queryKey: ['conditions'],
    queryFn: () => apiClient.get('/game-data/conditions').then((r) => r.data),
    staleTime: Infinity,
  });
}

export function useSpells(filters?: Record<string, string | number | boolean>) {
  return useQuery({
    queryKey: ['spells', filters],
    queryFn: () => apiClient.get('/game-data/spells', { params: filters }).then((r) => r.data),
    staleTime: Infinity,
  });
}

export function useClasses() {
  return useQuery({
    queryKey: ['classes'],
    queryFn: () => apiClient.get('/game-data/classes').then((r) => r.data),
    staleTime: Infinity,
  });
}

export function useSpecies() {
  return useQuery({
    queryKey: ['species'],
    queryFn: () => apiClient.get('/game-data/species').then((r) => r.data),
    staleTime: Infinity,
  });
}

export function useBackgrounds() {
  return useQuery({
    queryKey: ['backgrounds'],
    queryFn: () => apiClient.get('/game-data/backgrounds').then((r) => r.data),
    staleTime: Infinity,
  });
}

export function useFeats(category?: string) {
  return useQuery({
    queryKey: ['feats', category],
    queryFn: () =>
      apiClient
        .get('/game-data/feats', { params: category ? { category } : undefined })
        .then((r) => r.data),
    staleTime: Infinity,
  });
}

export function useWeapons() {
  return useQuery({
    queryKey: ['weapons'],
    queryFn: () => apiClient.get('/game-data/weapons').then((r) => r.data),
    staleTime: Infinity,
  });
}

export function useLanguages() {
  return useQuery({
    queryKey: ['languages'],
    queryFn: () => apiClient.get('/game-data/languages').then((r) => r.data),
    staleTime: Infinity,
  });
}
