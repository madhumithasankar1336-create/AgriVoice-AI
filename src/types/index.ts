export type Language = 'ta' | 'en';

export type AppModule = 
  | 'dashboard'
  | 'voice_assistant' 
  | 'disease_doctor' 
  | 'crop_advisory' 
  | 'weather_advisory' 
  | 'history_dashboard';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  language: Language;
  query?: string;
  response: string;
  audioBase64?: string;
  audioFormat?: string;
  provider?: string;
  category: 'voice_assistant' | 'crop_advisory' | 'plant_disease' | 'weather';
  imageUrl?: string;
  keyPoints?: string[];
  suggestedQuestions?: string[];
  diseaseAnalysis?: DiseaseAnalysis;
  cropDetails?: any;
  createdAt: string | Date;
}

export interface DiseaseAnalysis {
  cropName?: string;
  isHealthy: boolean;
  diseaseName: string;
  tamilDiseaseName?: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical' | 'healthy';
  symptoms: string[];
  causes: string[];
  organicTreatment: string[];
  chemicalTreatment: string[];
  preventionTips: string[];
  expertNotice: string;
}

export interface RecommendedCrop {
  cropName: string;
  tamilName?: string;
  suitabilityScore?: number;
  durationDays: string;
  seedRatePerAcre?: string;
  bestVarieties?: string[];
  expectedYieldPerAcre: string;
  estimatedProfitPerAcre?: string;
  waterRequirement?: string;
  fertilizerSchedule: Array<{
    stage: string;
    dosage: string;
    notes?: string;
  }>;
  pestRisks?: string[];
  keyAdvisories?: string[];
}

export interface WeatherData {
  city: string;
  temperature: number;
  humidity: number;
  precipitationProbability: number;
  windSpeed: number;
  condition: string;
  forecast: Array<{
    date: string;
    maxTemp: number;
    minTemp: number;
    rainProb: number;
  }>;
}

export interface WeatherAdvisory {
  headline: string;
  irrigationAdvice: string;
  sprayingAdvice: string;
  harvestingAdvice: string;
  diseaseWarning: string;
  actionableTips: string[];
}

export interface SystemStatus {
  status: string;
  systemName: string;
  integrations: {
    geminiAI: {
      configured: boolean;
      status: string;
      models: string[];
    };
    gnaniAI: {
      configured: boolean;
      status: string;
      sttModel: string;
      ttsModel: string;
    };
    database: {
      type: string;
      connected: boolean;
    };
  };
  time: string;
}
