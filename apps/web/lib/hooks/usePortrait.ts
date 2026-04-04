'use client';

import { useState } from 'react';
import apiClient from '@/lib/apiClient';

export function usePortrait() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadPortrait(characterId: string, file: File): Promise<string> {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await apiClient.post<{ portraitUrl: string }>(
        `/characters/${characterId}/portrait`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return data.portraitUrl;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      throw err;
    } finally {
      setUploading(false);
    }
  }

  async function deletePortrait(characterId: string): Promise<void> {
    setUploading(true);
    setError(null);
    try {
      await apiClient.delete(`/characters/${characterId}/portrait`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      setError(message);
      throw err;
    } finally {
      setUploading(false);
    }
  }

  return { uploadPortrait, deletePortrait, uploading, error };
}
