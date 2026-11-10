import mongoose from 'mongoose';

export interface IChatItem {
  id: string;
  role: 'user' | 'assistant';
  language: 'ta' | 'en';
  query?: string;
  response: string;
  audioBase64?: string;
  audioFormat?: string;
  provider?: string;
  category: 'voice_assistant' | 'crop_advisory' | 'plant_disease' | 'weather';
  imageUrl?: string;
  diseaseAnalysis?: {
    diseaseName: string;
    tamilDiseaseName?: string;
    cropName?: string;
    severity: 'low' | 'medium' | 'high' | 'critical' | 'healthy';
    confidence: number;
    symptoms: string[];
    causes: string[];
    chemicalTreatment: string[];
    organicTreatment: string[];
    preventionTips: string[];
    expertNotice: string;
  };
  cropDetails?: {
    cropName: string;
    soilType: string;
    season: string;
    estimatedYield: string;
    fertilizerSchedule: string[];
    irrigationAdvice: string;
    pestRisks: string[];
  };
  weatherData?: {
    city: string;
    temperature: number;
    condition: string;
    advisory: string;
  };
  createdAt: Date;
}

const ChatSchema = new mongoose.Schema<IChatItem>({
  id: { type: String, required: true, unique: true },
  role: { type: String, required: true, enum: ['user', 'assistant'] },
  language: { type: String, required: true, enum: ['ta', 'en'] },
  query: { type: String },
  response: { type: String, required: true },
  audioBase64: { type: String },
  audioFormat: { type: String },
  provider: { type: String },
  category: { 
    type: String, 
    required: true, 
    enum: ['voice_assistant', 'crop_advisory', 'plant_disease', 'weather'],
    default: 'voice_assistant'
  },
  imageUrl: { type: String },
  diseaseAnalysis: {
    diseaseName: String,
    tamilDiseaseName: String,
    cropName: String,
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical', 'healthy'] },
    confidence: Number,
    symptoms: [String],
    causes: [String],
    chemicalTreatment: [String],
    organicTreatment: [String],
    preventionTips: [String],
    expertNotice: String
  },
  cropDetails: {
    cropName: String,
    soilType: String,
    season: String,
    estimatedYield: String,
    fertilizerSchedule: [String],
    irrigationAdvice: String,
    pestRisks: [String]
  },
  weatherData: {
    city: String,
    temperature: Number,
    condition: String,
    advisory: String
  },
  createdAt: { type: Date, default: Date.now }
}, {
  bufferCommands: false,
});

export const ChatModel = mongoose.models.Chat || mongoose.model<IChatItem>('Chat', ChatSchema);

// In-memory & JSON fallback storage for environments without active MongoDB connection
class MemoryStorage {
  private items: IChatItem[] = [];

  constructor() {
    // Seed with a welcoming agricultural consultation
    this.items.push({
      id: 'welcome-seed-1',
      role: 'assistant',
      language: 'ta',
      query: 'வணக்கம், AgriVoice AI உதவி மையம்',
      response: 'வணக்கம் விவசாய நண்பரே! அக்ரிவாய்ஸ் ஏஐ (AgriVoice AI) உங்களை அன்புடன் வரவேற்கிறது. உங்கள் பயிர்கள், உரம், பூச்சி தாக்குதல் அல்லது வானிலை பற்றிய கேள்விகளை குரல் மூலமாகவோ அல்லது தட்டச்சு செய்தோ கேட்கலாம்.',
      category: 'voice_assistant',
      createdAt: new Date()
    });
  }

  async getAll(): Promise<IChatItem[]> {
    return [...this.items].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async add(item: IChatItem): Promise<IChatItem> {
    this.items.unshift(item);
    // Keep max 100 items in memory
    if (this.items.length > 100) {
      this.items = this.items.slice(0, 100);
    }
    return item;
  }

  async delete(id: string): Promise<boolean> {
    const prevLen = this.items.length;
    this.items = this.items.filter(i => i.id !== id);
    return this.items.length < prevLen;
  }

  async clear(): Promise<void> {
    this.items = [];
  }
}

export const memoryStore = new MemoryStorage();
