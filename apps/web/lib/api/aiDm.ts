import apiClient from '@/lib/apiClient';

export interface AIDMMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function sendAIDMMessage(
  sessionId: string,
  message: string
): Promise<{ response: string }> {
  const res = await apiClient.post(`/sessions/${sessionId}/ai-dm`, { message });
  return res.data as { response: string };
}

export async function fetchAIDMHistory(sessionId: string): Promise<{ history: AIDMMessage[] }> {
  const res = await apiClient.get(`/sessions/${sessionId}/ai-dm/history`);
  return res.data as { history: AIDMMessage[] };
}

export async function resetAIDMHistory(sessionId: string): Promise<void> {
  await apiClient.delete(`/sessions/${sessionId}/ai-dm/history`);
}
