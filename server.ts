import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import multer from 'multer';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import {
  askFarmingAssistant,
  diagnosePlantDisease,
  getCropAdvisory,
  getWeatherFarmingAdvisory,
} from './src/services/geminiService';
import { transcribeSpeech, synthesizeSpeech } from './src/services/gnaniService';
import { ChatModel, memoryStore, IChatItem } from './src/db/chatModel';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Multer memory storage for audio clips and plant photos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

// Database state
let isMongoConnected = false;

async function initDatabase() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri || mongoUri === 'mongodb://localhost:27017/agrivoice') {
    console.log('🌱 AgriVoice AI: MONGODB_URI not configured or using default. Running in fast resilient in-memory & local fallback mode.');
    return;
  }

  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    isMongoConnected = true;
    console.log('✅ AgriVoice AI: Successfully connected to MongoDB database.');
  } catch (err: any) {
    isMongoConnected = false;
    console.warn(`⚠️ AgriVoice AI: MongoDB connection failed (${err.message}). Using resilient local storage fallback.`);
  }
}

initDatabase();

// --- API Endpoints ---

// System health and integrations status
app.get('/api/status', (req: Request, res: Response) => {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  const hasGnani = Boolean(process.env.GNANI_API_KEY && process.env.GNANI_API_KEY !== 'MY_GNANI_API_KEY');

  res.json({
    status: 'online',
    systemName: 'AgriVoice AI Engine',
    integrations: {
      geminiAI: {
        configured: hasGemini,
        status: hasGemini ? 'active' : 'fallback-available',
        models: ['gemini-3.8-flash', 'gemini-3.5-transcribe', 'gemini-3.8-flash-lite-tts'],
      },
      gnaniAI: {
        configured: hasGnani,
        status: hasGnani ? 'active' : 'gemini-fallback-active',
        sttModel: 'prisma-v3.0',
        ttsModel: 'timbre-v2.5',
      },
      database: {
        type: isMongoConnected ? 'MongoDB' : 'Memory & LocalStorage Fallback',
        connected: isMongoConnected,
      },
    },
    version: '1.0.0',
    time: new Date().toISOString(),
  });
});

// Speech-to-Text (Gnani AI with Gemini 3.5 Transcribe fallback)
app.post('/api/stt', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    const language = (req.body.language === 'en' ? 'en' : 'ta') as 'ta' | 'en';
    let audioBuffer: Buffer | null = null;
    let mimeType = req.body.mimeType || 'audio/webm';

    if (req.file) {
      audioBuffer = req.file.buffer;
      mimeType = req.file.mimetype || mimeType;
    } else if (req.body.audioBase64) {
      audioBuffer = Buffer.from(req.body.audioBase64, 'base64');
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      res.status(400).json({ error: 'No audio data received.' });
      return;
    }

    const result = await transcribeSpeech(audioBuffer, mimeType, language);
    res.json(result);
  } catch (error: any) {
    console.error('STT API error:', error);
    res.status(500).json({ error: error.message || 'Speech recognition failed.' });
  }
});

// Text-to-Speech (Gnani AI Timbre with Gemini 3.8 Flash Lite TTS fallback)
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const { text, language = 'ta', voice } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text is required for speech synthesis.' });
      return;
    }

    const result = await synthesizeSpeech(text, language === 'en' ? 'en' : 'ta', voice);
    res.json(result);
  } catch (error: any) {
    console.error('TTS API error:', error);
    res.status(500).json({ error: error.message || 'Speech synthesis failed.' });
  }
});

// Farming Assistant Q&A Chat
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { query, language = 'ta', category = 'voice_assistant' } = req.body;
    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'Query is required.' });
      return;
    }

    const aiResult = await askFarmingAssistant(query, language === 'en' ? 'en' : 'ta');

    // Spoken audio provider info (TTS can be generated on-demand via /api/tts or browser speech)
    const audioData: { audioBase64?: string; format?: string; provider?: string } = {
      provider: process.env.GNANI_API_KEY ? 'gnani' : 'browser'
    };

    const chatItem: IChatItem = {
      id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      role: 'assistant',
      language: language === 'en' ? 'en' : 'ta',
      query,
      response: aiResult.text,
      audioBase64: audioData.audioBase64,
      audioFormat: audioData.format,
      provider: audioData.provider,
      category,
      createdAt: new Date(),
    };

    // Save to DB or memory
    if (isMongoConnected) {
      try {
        await ChatModel.create(chatItem);
      } catch (dbErr) {
        console.warn('MongoDB write error, saving to memory fallback:', dbErr);
        await memoryStore.add(chatItem);
      }
    } else {
      await memoryStore.add(chatItem);
    }

    res.json({
      ...chatItem,
      keyPoints: aiResult.keyPoints,
      suggestedQuestions: aiResult.suggestedQuestions,
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    res.status(500).json({ error: error.message || 'Failed to process agricultural query.' });
  }
});

// Plant Disease Detection
app.post('/api/disease-detection', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const language = (req.body.language === 'en' ? 'en' : 'ta') as 'ta' | 'en';
    const userNotes = req.body.notes || '';
    let base64Image = '';
    let mimeType = 'image/jpeg';

    if (req.file) {
      base64Image = req.file.buffer.toString('base64');
      mimeType = req.file.mimetype || mimeType;
    } else if (req.body.imageBase64) {
      base64Image = req.body.imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      mimeType = req.body.mimeType || mimeType;
    }

    if (!base64Image) {
      res.status(400).json({ error: 'Please upload or provide an image of the plant leaf or crop.' });
      return;
    }

    const analysis = await diagnosePlantDisease(base64Image, mimeType, userNotes, language);

    const isTamil = language === 'ta';
    const summaryText = isTamil
      ? `${analysis.cropName || 'பயிர்'}: ${analysis.isHealthy ? 'பயிர் ஆரோக்கியமாக உள்ளது!' : (analysis.tamilDiseaseName || analysis.diseaseName)} கண்டறியப்பட்டுள்ளது. தீவிரத்தன்மை: ${analysis.severity}. ${analysis.expertNotice}`
      : `${analysis.cropName || 'Crop'}: ${analysis.isHealthy ? 'Plant appears healthy!' : analysis.diseaseName} detected. Severity: ${analysis.severity}. ${analysis.expertNotice}`;

    const chatItem: IChatItem = {
      id: `disease-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      role: 'assistant',
      language,
      query: userNotes ? `[Plant Scan] ${userNotes}` : `[Plant Scan] ${analysis.cropName || 'Leaf'} Image Analysis`,
      response: summaryText,
      category: 'plant_disease',
      imageUrl: `data:${mimeType};base64,${base64Image.substring(0, 200)}...`, // thumbnail reference
      diseaseAnalysis: {
        diseaseName: analysis.diseaseName,
        tamilDiseaseName: analysis.tamilDiseaseName,
        cropName: analysis.cropName,
        severity: analysis.severity,
        confidence: analysis.confidence,
        symptoms: analysis.symptoms || [],
        causes: analysis.causes || [],
        chemicalTreatment: analysis.chemicalTreatment || [],
        organicTreatment: analysis.organicTreatment || [],
        preventionTips: analysis.preventionTips || [],
        expertNotice: analysis.expertNotice,
      },
      createdAt: new Date(),
    };

    if (isMongoConnected) {
      try {
        await ChatModel.create(chatItem);
      } catch {
        await memoryStore.add(chatItem);
      }
    } else {
      await memoryStore.add(chatItem);
    }

    res.json({
      ...chatItem,
      fullAnalysis: analysis,
    });
  } catch (error: any) {
    console.error('Plant Disease API error:', error);
    res.status(500).json({ error: error.message || 'Disease detection failed.' });
  }
});

// Crop Advisory
app.post('/api/crop-advisory', async (req: Request, res: Response) => {
  try {
    const {
      soilType = 'Red Soil',
      season = 'Kharif',
      region = 'Tamil Nadu',
      irrigation = 'Drip Irrigation',
      landSize = '2 Acres',
      language = 'ta',
    } = req.body;

    const advisory = await getCropAdvisory({
      soilType,
      season,
      region,
      irrigation,
      landSize,
      language: language === 'en' ? 'en' : 'ta',
    });

    const isTamil = language === 'ta';
    const topCrop = advisory.recommendedCrops?.[0];
    const summary = isTamil
      ? `${region} பகுதி மற்றும் ${soilType} மண்ணிற்கு மிகவும் உகந்த பயிர்: ${topCrop?.tamilName || topCrop?.cropName || 'பயிர்'}. எதிர்பார்க்கப்படும் மகசூல்: ${topCrop?.expectedYieldPerAcre || '-'}`
      : `Best suited crop for ${region} with ${soilType}: ${topCrop?.cropName || 'Crop'}. Expected Yield: ${topCrop?.expectedYieldPerAcre || '-'}`;

    const chatItem: IChatItem = {
      id: `crop-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      role: 'assistant',
      language: language === 'en' ? 'en' : 'ta',
      query: `[Crop Advisory] ${soilType}, ${season}, ${region}, ${irrigation}`,
      response: summary,
      category: 'crop_advisory',
      cropDetails: topCrop
        ? {
            cropName: topCrop.tamilName || topCrop.cropName,
            soilType,
            season,
            estimatedYield: topCrop.expectedYieldPerAcre,
            fertilizerSchedule: topCrop.fertilizerSchedule?.map((f: any) => `${f.stage}: ${f.dosage}`) || [],
            irrigationAdvice: topCrop.waterRequirement || irrigation,
            pestRisks: topCrop.pestRisks || [],
          }
        : undefined,
      createdAt: new Date(),
    };

    if (isMongoConnected) {
      try {
        await ChatModel.create(chatItem);
      } catch {
        await memoryStore.add(chatItem);
      }
    } else {
      await memoryStore.add(chatItem);
    }

    res.json({
      ...chatItem,
      advisory,
    });
  } catch (error: any) {
    console.error('Crop Advisory API error:', error);
    res.status(500).json({ error: error.message || 'Crop advisory calculation failed.' });
  }
});

// Live Weather & Farm Advisory
const CITY_COORDINATES: Record<string, { lat: number; lon: number; nameTa: string; nameEn: string }> = {
  thanjavur: { lat: 10.787, lon: 79.1378, nameTa: 'தஞ்சாவூர் (டெல்டா)', nameEn: 'Thanjavur (Delta)' },
  coimbatore: { lat: 11.0168, lon: 76.9558, nameTa: 'கோயம்புத்தூர்', nameEn: 'Coimbatore' },
  madurai: { lat: 9.9252, lon: 78.1198, nameTa: 'மதுரை', nameEn: 'Madurai' },
  tiruchirappalli: { lat: 10.7905, lon: 78.7047, nameTa: 'திருச்சிராப்பள்ளி', nameEn: 'Tiruchirappalli' },
  salem: { lat: 11.6643, lon: 78.146, nameTa: 'சேலம்', nameEn: 'Salem' },
  tirunelveli: { lat: 8.7139, lon: 77.7567, nameTa: 'திருநெல்வேலி', nameEn: 'Tirunelveli' },
  erode: { lat: 11.341, lon: 77.7172, nameTa: 'ஈரோடு', nameEn: 'Erode' },
  chennai: { lat: 13.0827, lon: 80.2707, nameTa: 'சென்னை', nameEn: 'Chennai' },
};

app.get('/api/weather', async (req: Request, res: Response) => {
  try {
    const cityKey = (req.query.city as string)?.toLowerCase() || 'thanjavur';
    const language = (req.query.language === 'en' ? 'en' : 'ta') as 'ta' | 'en';
    const coords = CITY_COORDINATES[cityKey] || CITY_COORDINATES['thanjavur'];

    // Fetch live weather from Open-Meteo
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FKolkata`;
    
    let rawWeatherData: any = null;
    try {
      const resp = await fetch(weatherUrl);
      if (resp.ok) {
        rawWeatherData = await resp.json();
      }
    } catch (netErr) {
      console.warn('Weather network request error, using typical seasonal values:', netErr);
    }

    const current = rawWeatherData?.current || {
      temperature_2m: 31,
      relative_humidity_2m: 68,
      precipitation: 0,
      wind_speed_10m: 14,
    };

    const isTamil = language === 'ta';
    const cityName = isTamil ? coords.nameTa : coords.nameEn;

    const weatherSummary = {
      city: cityName,
      temperature: current.temperature_2m,
      humidity: current.relative_humidity_2m,
      precipitationProbability: rawWeatherData?.daily?.precipitation_probability_max?.[0] || 15,
      windSpeed: current.wind_speed_10m,
      condition: current.precipitation > 0 ? 'Rainy' : current.temperature_2m > 34 ? 'Hot & Sunny' : 'Partly Cloudy',
      forecast: (rawWeatherData?.daily?.time || []).slice(0, 5).map((t: string, idx: number) => ({
        date: t,
        maxTemp: rawWeatherData?.daily?.temperature_2m_max?.[idx] || 32,
        minTemp: rawWeatherData?.daily?.temperature_2m_min?.[idx] || 24,
        rainProb: rawWeatherData?.daily?.precipitation_probability_max?.[idx] || 10,
      })),
    };

    // Generate farming advisory
    const aiAdvisory = await getWeatherFarmingAdvisory(weatherSummary, language);

    res.json({
      weather: weatherSummary,
      advisory: aiAdvisory,
    });
  } catch (error: any) {
    console.error('Weather API error:', error);
    res.status(500).json({ error: error.message || 'Weather advisory unavailable.' });
  }
});

// Chat & Consultation History
app.get('/api/history', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string;
    let items: IChatItem[] = [];

    if (isMongoConnected) {
      try {
        const query = category ? { category } : {};
        items = await ChatModel.find(query).sort({ createdAt: -1 }).limit(50).lean();
      } catch (dbErr) {
        console.warn('MongoDB read failed, using memory fallback:', dbErr);
        items = await memoryStore.getAll();
      }
    } else {
      items = await memoryStore.getAll();
    }

    if (category) {
      items = items.filter(i => i.category === category);
    }

    res.json(items);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to load history.' });
  }
});

app.delete('/api/history/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (isMongoConnected) {
      try {
        await ChatModel.deleteOne({ id });
      } catch {
        await memoryStore.delete(id);
      }
    } else {
      await memoryStore.delete(id);
    }
    res.json({ success: true, id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/history', async (req: Request, res: Response) => {
  try {
    if (isMongoConnected) {
      try {
        await ChatModel.deleteMany({});
      } catch {
        await memoryStore.clear();
      }
    } else {
      await memoryStore.clear();
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Server bootstrap: Vite middlewares in dev, static files in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌾 AgriVoice AI Server listening on port ${PORT}`);
    console.log(`📡 API Endpoints active: /api/chat, /api/stt, /api/tts, /api/disease-detection, /api/crop-advisory, /api/weather, /api/history`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server boot error:', err);
  process.exit(1);
});
