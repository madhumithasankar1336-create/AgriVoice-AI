import { Language, ChatMessage, DiseaseAnalysis, RecommendedCrop, WeatherData, WeatherAdvisory, SystemStatus } from '../types';

export async function askChat(
  query: string,
  language: Language = 'ta',
  category: string = 'voice_assistant'
): Promise<ChatMessage> {
  const resp = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, language, category }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to get answer from AgriVoice AI.');
  }
  return resp.json();
}

export async function sendSpeechToText(
  audioBlob: Blob,
  language: Language = 'ta'
): Promise<{ text: string; provider: string; language: string }> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'voice-recording.webm');
  formData.append('language', language);

  const resp = await fetch('/api/stt', {
    method: 'POST',
    body: formData,
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || 'Speech-to-text conversion failed.');
  }
  return resp.json();
}

export async function getTextToSpeech(
  text: string,
  language: Language = 'ta'
): Promise<{ audioBase64?: string; format?: string; provider?: string; useWebSpeechFallback?: boolean }> {
  const resp = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, language }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || 'Speech synthesis failed.');
  }
  return resp.json();
}

export async function detectPlantDisease(
  fileOrBase64: File | string,
  notes: string = '',
  language: Language = 'ta'
): Promise<{ fullAnalysis: DiseaseAnalysis; id: string; response: string }> {
  if (typeof fileOrBase64 === 'string') {
    const resp = await fetch('/api/disease-detection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: fileOrBase64, notes, language }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || 'Plant disease analysis failed.');
    }
    return resp.json();
  } else {
    const formData = new FormData();
    formData.append('image', fileOrBase64);
    formData.append('notes', notes);
    formData.append('language', language);

    const resp = await fetch('/api/disease-detection', {
      method: 'POST',
      body: formData,
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || 'Plant disease analysis failed.');
    }
    return resp.json();
  }
}

export async function fetchCropAdvisory(params: {
  soilType: string;
  season: string;
  region: string;
  irrigation: string;
  landSize: string;
  language: Language;
}): Promise<{ advisory: { summary: string; recommendedCrops: RecommendedCrop[] }; id: string }> {
  const resp = await fetch('/api/crop-advisory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || 'Crop advisory calculation failed.');
  }
  return resp.json();
}

export async function fetchWeatherAdvisory(
  city: string = 'thanjavur',
  language: Language = 'ta'
): Promise<{ weather: WeatherData; advisory: WeatherAdvisory }> {
  const resp = await fetch(`/api/weather?city=${encodeURIComponent(city)}&language=${language}`);
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || 'Weather advisory unavailable.');
  }
  return resp.json();
}

export async function fetchHistory(category?: string): Promise<ChatMessage[]> {
  const url = category ? `/api/history?category=${encodeURIComponent(category)}` : '/api/history';
  const resp = await fetch(url);
  if (!resp.ok) return [];
  return resp.json();
}

export async function deleteHistory(id: string): Promise<boolean> {
  const resp = await fetch(`/api/history/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return resp.ok;
}

export async function clearAllHistory(): Promise<boolean> {
  const resp = await fetch('/api/history', { method: 'DELETE' });
  return resp.ok;
}

export async function fetchSystemStatus(): Promise<SystemStatus> {
  const resp = await fetch('/api/status');
  if (!resp.ok) throw new Error('Status unavailable');
  return resp.json();
}
