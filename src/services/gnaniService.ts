import { transcribeWithGemini, generateTTSWithGemini } from './geminiService';

export interface STTResult {
  text: string;
  provider: 'gnani' | 'gemini' | 'browser';
  language: string;
  error?: string;
}

export interface TTSResult {
  audioBase64?: string;
  format?: string;
  provider: 'gnani' | 'gemini' | 'browser';
  useWebSpeechFallback?: boolean;
  error?: string;
}

/**
 * Transcribe audio using Gnani AI (Vachana Prisma) API
 * Falls back to Gemini 3.5 Transcribe if GNANI_API_KEY is not set or request fails.
 */
export async function transcribeSpeech(
  audioBuffer: Buffer,
  mimeType: string = 'audio/webm',
  language: 'ta' | 'en' = 'ta'
): Promise<STTResult> {
  const gnaniApiKey = process.env.GNANI_API_KEY;

  if (gnaniApiKey && gnaniApiKey !== 'MY_GNANI_API_KEY') {
    try {
      const languageCode = language === 'ta' ? 'ta-IN' : 'en-IN';
      
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });
      formData.append('audio_file', blob, 'audio.wav');
      formData.append('language_code', languageCode);
      formData.append('model', 'prisma-v3.0');

      const response = await fetch('https://api.vachana.ai/stt/v3', {
        method: 'POST',
        headers: {
          'X-API-Key-ID': gnaniApiKey,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const transcription = data.transcript || data.text || data.transcription || '';
        if (transcription.trim()) {
          return {
            text: transcription.trim(),
            provider: 'gnani',
            language,
          };
        }
      } else {
        const errorText = await response.text();
        console.warn(`Gnani STT responded with HTTP ${response.status}: ${errorText}. Falling back to Gemini.`);
      }
    } catch (err: any) {
      console.warn('Gnani STT request error, trying Gemini fallback:', err.message);
    }
  }

  // Graceful fallback to Gemini 3.5 Transcribe
  try {
    const base64Audio = audioBuffer.toString('base64');
    const text = await transcribeWithGemini(base64Audio, mimeType);
    return {
      text,
      provider: 'gemini',
      language,
    };
  } catch (geminiError: any) {
    console.error('Gemini STT also failed:', geminiError.message);
    return {
      text: '',
      provider: 'browser',
      language,
      error: 'Audio transcription failed on server. You can also type or use browser speech recognition.',
    };
  }
}

/**
 * Synthesize speech using Gnani AI (Vachana Timbre) API
 * Falls back to Gemini 3.8 Flash Lite TTS or client-side Web Speech synthesis.
 */
export async function synthesizeSpeech(
  text: string,
  language: 'ta' | 'en' = 'ta',
  voice?: string
): Promise<TTSResult> {
  const gnaniApiKey = process.env.GNANI_API_KEY;

  if (gnaniApiKey && gnaniApiKey !== 'MY_GNANI_API_KEY') {
    try {
      const langCode = language === 'ta' ? 'ta-IN' : 'en-IN';
      const voiceName = voice || (language === 'ta' ? 'Meera' : 'Nalini');

      const response = await fetch('https://api.vachana.ai/api/v1/tts/inference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key-ID': gnaniApiKey,
        },
        body: JSON.stringify({
          text: text.slice(0, 500),
          voice: voiceName,
          model: 'timbre-v2.5',
          language: langCode,
          speed: 1.0,
        }),
      });

      if (response.ok) {
        // Gnani returns audio/wav or audio/mp3 binary or JSON with audio content
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('audio') || contentType.includes('octet-stream')) {
          const arrayBuffer = await response.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          return {
            audioBase64: base64,
            format: 'audio/wav',
            provider: 'gnani',
          };
        } else {
          const data = await response.json();
          if (data.audio_base64 || data.audio) {
            return {
              audioBase64: data.audio_base64 || data.audio,
              format: 'audio/wav',
              provider: 'gnani',
            };
          }
        }
      } else {
        const errorText = await response.text();
        console.warn(`Gnani TTS responded with ${response.status}: ${errorText}. Falling back to Gemini TTS.`);
      }
    } catch (err: any) {
      console.warn('Gnani TTS network error, switching to Gemini:', err.message);
    }
  }

  // Graceful fallback to Gemini 3.8 Flash Lite TTS
  try {
    const { audioBase64, mimeType } = await generateTTSWithGemini(text, language);
    return {
      audioBase64,
      format: mimeType,
      provider: 'gemini',
    };
  } catch (err: any) {
    console.warn('Gemini TTS failed, delegating to browser Web Speech API:', err.message);
    return {
      provider: 'browser',
      useWebSpeechFallback: true,
      error: 'Using browser voice synthesis.',
    };
  }
}
