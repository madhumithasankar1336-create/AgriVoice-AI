import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Mic, 
  Sparkles, 
  Sprout, 
  CloudSun, 
  Trash2, 
  Search, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  RotateCw,
  Clock,
  ArrowRight,
  Droplets,
  Phone,
  ExternalLink,
  ShieldAlert,
  Flame,
  HelpCircle,
  TrendingUp,
  Cpu,
  ChevronRight
} from 'lucide-react';
import { Language, ChatMessage, SystemStatus, WeatherData, WeatherAdvisory as IWeatherAdvisory } from '../types';
import { translations } from '../i18n/translations';
import { fetchHistory, deleteHistory, clearAllHistory, fetchWeatherAdvisory } from '../services/api';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

interface DashboardProps {
  language: Language;
  systemStatus: SystemStatus | null;
  onNavigateModule: (mod: any) => void;
  onQuickQuery?: (query: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  language,
  systemStatus,
  onNavigateModule,
  onQuickQuery,
}) => {
  const t = translations[language];
  const [historyItems, setHistoryItems] = useState<ChatMessage[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [liveWeather, setLiveWeather] = useState<{ weather: WeatherData; advisory: IWeatherAdvisory } | null>(null);

  const { isPlaying, activeId, playAudio, stopAudio } = useAudioPlayer();

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const items = await fetchHistory(activeCategory === 'all' ? undefined : activeCategory);
      setHistoryItems(items);
    } catch (err) {
      console.error('History load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [activeCategory]);

  useEffect(() => {
    fetchWeatherAdvisory('thanjavur', language)
      .then(setLiveWeather)
      .catch((err) => console.warn('Dashboard weather glance error:', err));
  }, [language]);

  const handleDelete = async (id: string) => {
    try {
      await deleteHistory(id);
      setHistoryItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleClearAll = async () => {
    const confirmMsg = language === 'ta' ? 'அனைத்து வரலாற்றையும் நீக்க வேண்டுமா?' : 'Clear all consultation history?';
    if (window.confirm(confirmMsg)) {
      try {
        await clearAllHistory();
        setHistoryItems([]);
      } catch (err) {
        console.error('Clear all error:', err);
      }
    }
  };

  const handleLaunchCategoryQuery = (query: string) => {
    if (onQuickQuery) {
      onQuickQuery(query);
    } else {
      onNavigateModule('voice_assistant');
    }
  };

  // Filter items by search
  const filteredItems = historyItems.filter((item) => {
    const q = searchQuery.toLowerCase();
    const queryMatch = item.query?.toLowerCase().includes(q);
    const responseMatch = item.response?.toLowerCase().includes(q);
    return queryMatch || responseMatch;
  });

  // Calculate statistics
  const totalQuestions = historyItems.length;
  const voiceQuestionsCount = historyItems.filter((i) => i.category === 'voice_assistant').length;
  const diseaseScansCount = historyItems.filter((i) => i.category === 'plant_disease').length;
  const cropPlansCount = historyItems.filter((i) => i.category === 'crop_advisory').length;

  // Curated categories
  const categoriesList = [
    {
      id: 'paddy',
      icon: '🌾',
      titleTa: 'நெல் & தானியங்கள்',
      titleEn: 'Paddy & Cereals',
      queryTa: 'நெல் பயிரில் தூர் கட்டும் போது என்ன உரம் இட வேண்டும்?',
      queryEn: 'What fertilizer is needed during paddy tillering stage?',
      descTa: 'குலை நோய் தடுப்பு, யூரியா மேலாண்மை, அடி உரம்',
      descEn: 'Blast prevention, urea scheduling, basal fertilizers',
    },
    {
      id: 'vegetables',
      icon: '🍅',
      titleTa: 'காய்கறி சாகுபடி',
      titleEn: 'Vegetable Crops',
      queryTa: 'தக்காளி மற்றும் கத்தரி இலை சுருட்டு நோய்க்கு என்ன மருந்து?',
      queryEn: 'What is the remedy for leaf curl in tomato and brinjal?',
      descTa: 'தக்காளி, மிளகாய், வெண்டை நோய் கட்டுப்பாடு',
      descEn: 'Tomato, chilli, and okra disease management',
    },
    {
      id: 'fertilizer',
      icon: '🌿',
      titleTa: 'உரம் & பூச்சி மேலாண்மை',
      titleEn: 'Fertilizers & Pests',
      queryTa: 'பருத்தியில் வெள்ளை ஈ மற்றும் புழு தாக்குதலை கட்டுப்படுத்துவது எப்படி?',
      queryEn: 'How to control whitefly and bollworm in cotton?',
      descTa: 'NPK உரம், வேப்ப எண்ணெய் தெளிப்பு, நுண்ணூட்டம்',
      descEn: 'NPK dosage, Neem oil spray, micronutrients',
    },
    {
      id: 'drip',
      icon: '💧',
      titleTa: 'சொட்டு நீர் பாசனம்',
      titleEn: 'Drip & Irrigation',
      queryTa: 'சொட்டு நீர் பாசனம் மூலம் பயிர்களுக்கு உரம் கரைத்து விடுவது எப்படி?',
      queryEn: 'How to practice fertigation through drip irrigation?',
      descTa: 'நீர் சேமிப்பு, நீர்வழி உரமிடுதல் (Fertigation)',
      descEn: 'Water saving and direct root fertigation techniques',
    },
    {
      id: 'schemes',
      icon: '📜',
      titleTa: 'அரசு திட்டங்கள் & மானியம்',
      titleEn: 'Govt Schemes & Subsidies',
      queryTa: 'PM-கிசான் திட்டம் மற்றும் உழவன் பயிர் காப்பீடு விவரங்கள் என்ன?',
      queryEn: 'Details on PM-KISAN, crop insurance and subsidies?',
      descTa: 'PM-KISAN, உழவன் செயலி, பயிர் காப்பீடு',
      descEn: 'PM-KISAN, Uzhavan App, PMFBY crop insurance',
    },
    {
      id: 'organic',
      icon: '🐄',
      titleTa: 'இயற்கை விவசாயம்',
      titleEn: 'Organic Farming',
      queryTa: 'இயற்கை உரமான ஜீவாமிர்தம் மற்றும் பஞ்சகவ்யா தயாரிப்பது எப்படி?',
      queryEn: 'How to prepare organic Jeevamrutham and Panchagavya?',
      descTa: 'ஜீவாமிர்தம், பஞ்சகவ்யா, மண்புழு உரம்',
      descEn: 'Jeevamrutham, Panchagavya, vermicompost preparation',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      
      {/* 1. Welcoming Farmer Hero Banner with Live Voice Trigger & Live Weather Glance */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 text-white shadow-xl border border-emerald-700/60 p-6 sm:p-8">
        
        {/* Subtle decorative background watermark */}
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none select-none">
          <Sprout className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-400/20 border border-lime-400/40 text-lime-300 text-xs font-black tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
              <span>{language === 'ta' ? 'விவசாயக் குரல் ஏஐ • ஸ்மார்ட் வேளாண் மையம்' : 'AgriVoice AI • Farmer Command Center'}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              {language === 'ta' ? 'வணக்கம் உழவர் பெருமக்களே!' : 'Welcome Farmer Friend!'}
            </h2>

            <p className="text-sm sm:text-base text-emerald-100 font-medium leading-relaxed">
              {language === 'ta'
                ? 'உங்கள் பயிர்கள், உரம், பூச்சி தாக்குதல் மற்றும் வானிலை பற்றிய கேள்விகளை குரல் மூலமாகவோ அல்லது படங்களை பதிவேற்றியோ கேளுங்கள்.'
                : 'Ask agricultural questions in Tamil or English using voice, detect crop diseases with photo scans, and get tailored fertilizer schedules.'}
            </p>

            {/* Live Weather Glance Pill */}
            {liveWeather && (
              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15">
                  <CloudSun className="w-4 h-4 text-amber-300" />
                  <span className="font-bold">{liveWeather.weather.city}:</span>
                  <span className="font-black text-lime-300">{liveWeather.weather.temperature}°C</span>
                  <span className="text-emerald-200">({liveWeather.weather.condition})</span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15">
                  <Droplets className="w-4 h-4 text-sky-300" />
                  <span>{language === 'ta' ? 'மழை வாய்ப்பு:' : 'Rain Risk:'}</span>
                  <span className="font-black text-sky-300">{liveWeather.weather.precipitationProbability}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Voice Launch Button */}
          <div className="shrink-0 w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => onNavigateModule('voice_assistant')}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-gradient-to-r from-lime-400 to-emerald-400 hover:from-lime-300 hover:to-emerald-300 text-emerald-950 font-black text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 group active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-950 text-lime-400 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <Mic className="w-5 h-5 animate-pulse" />
              </div>
              <div className="text-left">
                <div className="leading-tight">
                  {language === 'ta' ? 'குரல் மூலம் கேள்வி கேட்க' : 'Ask Question in Voice'}
                </div>
                <div className="text-[11px] font-bold text-emerald-900/80">
                  {language === 'ta' ? 'தமிழ் & English பேசவும்' : 'Tamil & English Speech'}
                </div>
              </div>
            </button>
          </div>

        </div>

      </div>

      {/* 2. Four Primary Agricultural Tool Launchpads */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Voice Assistant Launchpad */}
        <div 
          onClick={() => onNavigateModule('voice_assistant')}
          className="bg-white p-5 rounded-2xl border-2 border-emerald-100 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Mic className="w-6 h-6 text-emerald-700" />
            </div>
            <h3 className="font-extrabold text-stone-900 text-base group-hover:text-emerald-900">
              {language === 'ta' ? 'குரல் விவசாய உதவியாளர்' : 'Voice Farming Assistant'}
            </h3>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              {language === 'ta'
                ? 'உங்கள் கேள்விகளை பேசிக் கேளுங்கள். பதில் தமிழில் பேசி வாசிக்கப்படும்.'
                : 'Ask questions via mic. Answers are spoken aloud in Tamil or English.'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-emerald-700 group-hover:text-emerald-900">
            <span>{language === 'ta' ? 'பேசத் தொடங்கு' : 'Start Speaking'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Plant Disease Doctor Launchpad */}
        <div 
          onClick={() => onNavigateModule('disease_doctor')}
          className="bg-white p-5 rounded-2xl border-2 border-amber-100 hover:border-amber-500 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6 text-amber-700" />
            </div>
            <h3 className="font-extrabold text-stone-900 text-base group-hover:text-amber-900">
              {language === 'ta' ? 'பயிர் நோய் மருத்துவர்' : 'Plant Disease Doctor'}
            </h3>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              {language === 'ta'
                ? 'பாதிக்கப்பட்ட இலை படத்தை பதிவேற்றி நொடிகளில் நோய் & மருந்து அறியுங்கள்.'
                : 'Upload leaf photo to diagnose disease, organic cures, and chemical dosage.'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-amber-700 group-hover:text-amber-900">
            <span>{language === 'ta' ? 'நோயை ஆராய்க' : 'Scan Plant'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Crop Advisory Launchpad */}
        <div 
          onClick={() => onNavigateModule('crop_advisory')}
          className="bg-white p-5 rounded-2xl border-2 border-lime-100 hover:border-lime-500 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-lime-100 text-lime-900 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Sprout className="w-6 h-6 text-lime-800" />
            </div>
            <h3 className="font-extrabold text-stone-900 text-base group-hover:text-lime-950">
              {language === 'ta' ? 'பயிர் வழிகாட்டி & உரம்' : 'Crop Advisory & NPK'}
            </h3>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              {language === 'ta'
                ? 'மண் வகை, மாவட்டம், பருவத்திற்கு உகந்த பயிர்கள் மற்றும் உர அட்டவணை.'
                : 'Soil and season matched crops with step-by-step NPK timetable.'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-lime-800 group-hover:text-lime-950">
            <span>{language === 'ta' ? 'பரிந்துரை பெறுக' : 'Get Guidance'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Live Weather Advisory Launchpad */}
        <div 
          onClick={() => onNavigateModule('weather_advisory')}
          className="bg-white p-5 rounded-2xl border-2 border-sky-100 hover:border-sky-500 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <CloudSun className="w-6 h-6 text-sky-700" />
            </div>
            <h3 className="font-extrabold text-stone-900 text-base group-hover:text-sky-900">
              {language === 'ta' ? 'வானிலை & தெளிப்பு திட்டம்' : 'Weather & Spraying'}
            </h3>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              {language === 'ta'
                ? 'மழை வாய்ப்பு, பாசன குறிப்புகள் மற்றும் பூச்சிக்கொல்லி தெளிப்பு எச்சரிக்கை.'
                : 'Real-time rainfall chance, spraying safety, and irrigation advisory.'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-sky-700 group-hover:text-sky-900">
            <span>{language === 'ta' ? 'வானிலை பார்க்க' : 'View Weather'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>

      {/* 3. Live Agricultural Activity Statistics Counters */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-black text-stone-900 uppercase tracking-wider">
              {language === 'ta' ? 'விவசாய செயல்பாடுகள் & புள்ளியியல்' : 'Farming Activity & Metrics'}
            </h3>
          </div>
          <span className="text-[11px] font-bold text-stone-400">
            {language === 'ta' ? 'தானியங்கி சேமிப்பு' : 'Auto Saved'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
            <div className="text-[10px] font-bold text-emerald-800 uppercase">{t.dashboard.totalQueries}</div>
            <div className="text-2xl font-black text-emerald-950 mt-1">{totalQuestions}</div>
            <div className="text-[10px] text-stone-500 mt-0.5">{language === 'ta' ? 'கேள்விகள் கேட்கப்பட்டது' : 'Inquiries Answered'}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-lime-50/70 border border-lime-100">
            <div className="text-[10px] font-bold text-lime-900 uppercase">{t.dashboard.voiceQuestions}</div>
            <div className="text-2xl font-black text-emerald-950 mt-1">{voiceQuestionsCount}</div>
            <div className="text-[10px] text-stone-500 mt-0.5">{language === 'ta' ? 'குரல் வழி உரையாடல்கள்' : 'Voice Questions'}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100">
            <div className="text-[10px] font-bold text-amber-900 uppercase">{t.dashboard.diseaseScans}</div>
            <div className="text-2xl font-black text-amber-950 mt-1">{diseaseScansCount}</div>
            <div className="text-[10px] text-stone-500 mt-0.5">{language === 'ta' ? 'இலை பரிசோதனைகள்' : 'Pathology Scans'}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-100">
            <div className="text-[10px] font-bold text-teal-900 uppercase">{t.dashboard.cropPlans}</div>
            <div className="text-2xl font-black text-teal-950 mt-1">{cropPlansCount}</div>
            <div className="text-[10px] text-stone-500 mt-0.5">{language === 'ta' ? 'உர & பயிர் திட்டங்கள்' : 'Fertilizer Schedules'}</div>
          </div>
        </div>
      </div>

      {/* 4. Curated Farming Category Hub (Quick Access Questions) */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sprout className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-base font-extrabold text-stone-900">
                {language === 'ta' ? 'முக்கிய விவசாயப் பிரிவுகள் & உடனடி கேள்விகள்' : 'Key Farming Categories & Instant Questions'}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                {language === 'ta' ? 'ஏதேனும் ஒரு பிரிவை கிளிக் செய்து நேரடி ஆலோசனை பெறுங்கள்:' : 'Tap any category below to immediately consult the AI assistant:'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categoriesList.map((cat) => {
            const queryToAsk = language === 'ta' ? cat.queryTa : cat.queryEn;

            return (
              <div
                key={cat.id}
                onClick={() => handleLaunchCategoryQuery(queryToAsk)}
                className="p-3.5 rounded-xl border border-stone-200 hover:border-emerald-500 bg-stone-50/50 hover:bg-emerald-50/50 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 font-black text-sm text-stone-900 group-hover:text-emerald-950">
                    <span className="text-lg">{cat.icon}</span>
                    <span>{language === 'ta' ? cat.titleTa : cat.titleEn}</span>
                  </div>
                  <p className="text-xs text-emerald-900 font-semibold mt-2 line-clamp-2">
                    "{queryToAsk}"
                  </p>
                  <p className="text-[11px] text-stone-500 mt-1">
                    {language === 'ta' ? cat.descTa : cat.descEn}
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-stone-200/60 flex items-center justify-between text-[11px] font-bold text-emerald-700">
                  <span>{language === 'ta' ? 'கேள்வி கேட்க' : 'Ask This'}</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Recent Consultations & Conversation History Feed */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
          <div>
            <h3 className="text-base font-extrabold text-stone-900">
              {t.voice.recentConversations}
            </h3>
            <p className="text-xs text-stone-500">
              {language === 'ta' ? 'முந்தைய உரையாடல்களை மீண்டும் கேட்கலாம்' : 'Review and replay your past voice consultations'}
            </p>
          </div>

          {historyItems.length > 0 && (
            <button
              onClick={handleClearAll}
              className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.dashboard.clearAll}</span>
            </button>
          )}
        </div>

        {/* Filter Tabs and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { key: 'all', label: t.dashboard.allCategories },
              { key: 'voice_assistant', label: t.dashboard.voiceCat },
              { key: 'plant_disease', label: t.dashboard.diseaseCat },
              { key: 'crop_advisory', label: t.dashboard.cropCat },
            ].map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeCategory === cat.key
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-stone-50 text-stone-700 border border-stone-200 hover:border-emerald-400'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.dashboard.searchPlaceholder}
              className="w-full pl-9 pr-3 py-1.5 text-xs text-stone-800 bg-stone-50 border border-stone-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none"
            />
          </div>

        </div>

        {/* Consultations List */}
        {isLoading ? (
          <div className="p-8 text-center text-stone-500 flex justify-center items-center gap-2">
            <RotateCw className="w-5 h-5 animate-spin text-emerald-600" />
            <span className="text-xs font-bold">{t.common.loading}</span>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const isItemPlaying = isPlaying && activeId === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-stone-50 p-4 rounded-xl border border-stone-200/90 hover:border-emerald-300 transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900">
                        {item.category.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-stone-500 font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        {new Date(item.createdAt).toLocaleString(language === 'ta' ? 'ta-IN' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Play Audio Button */}
                      <button
                        onClick={() => {
                          if (isItemPlaying) {
                            stopAudio();
                          } else {
                            playAudio(
                              item.id,
                              item.audioBase64,
                              item.audioFormat || 'audio/wav',
                              item.response,
                              language
                            );
                          }
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                          isItemPlaying
                            ? 'bg-amber-600 text-white animate-pulse'
                            : 'bg-white border border-stone-200 hover:bg-emerald-50 text-emerald-800'
                        }`}
                        title="Listen Audio"
                      >
                        {isItemPlaying ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5" />
                            <span>{t.voice.stopPlaying}</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>{language === 'ta' ? 'கேட்க' : 'Listen'}</span>
                          </>
                        )}
                      </button>

                      {/* Delete Entry */}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {item.query && (
                    <div className="text-xs sm:text-sm font-extrabold text-stone-900">
                      Q: {item.query}
                    </div>
                  )}

                  <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-medium line-clamp-3">
                    {item.response}
                  </p>

                  {item.diseaseAnalysis && (
                    <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="font-bold text-emerald-950">
                        {language === 'ta' && item.diseaseAnalysis.tamilDiseaseName
                          ? item.diseaseAnalysis.tamilDiseaseName
                          : item.diseaseAnalysis.diseaseName}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white border border-stone-200 text-stone-700 font-semibold">
                        Severity: {item.diseaseAnalysis.severity}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-stone-400 border border-dashed border-stone-200 rounded-xl space-y-1">
            <p className="text-xs font-bold text-stone-700">{t.dashboard.noHistory}</p>
            <p className="text-[11px] text-stone-500">
              {language === 'ta'
                ? 'மேலே உள்ள பிரிவுகளில் ஒன்றை கிளிக் செய்து உங்கள் முதல் கேள்வியை கேளுங்கள்.'
                : 'Click any category above or use the microphone to start asking questions.'}
            </p>
          </div>
        )}

      </div>

      {/* 6. Farmer Emergency Helplines & Govt Agricultural Portals */}
      <div className="bg-gradient-to-r from-stone-900 to-emerald-950 text-white p-5 rounded-2xl shadow-md space-y-3">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-lime-400">
          <Phone className="w-4 h-4" />
          <span>{language === 'ta' ? 'உழவர் உதவி மையங்கள் & அரசு இணையதளங்கள்' : 'Farmer Helplines & Portals'}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div>
              <div className="font-bold text-white">Kisan Call Center (கிசான்)</div>
              <div className="text-[11px] text-stone-400">Toll-Free Agricultural Support</div>
            </div>
            <a href="tel:18001801551" className="px-2.5 py-1 rounded bg-lime-400 text-emerald-950 font-black text-xs hover:bg-lime-300">
              1800-180-1551
            </a>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div>
              <div className="font-bold text-white">TNAU Agritech Portal</div>
              <div className="text-[11px] text-stone-400">Crop Cultivation & Market Prices</div>
            </div>
            <a href="http://agritech.tnau.ac.in" target="_blank" rel="noreferrer" className="text-lime-300 hover:underline flex items-center gap-1 font-bold">
              <span>Visit</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div>
              <div className="font-bold text-white">PM-KISAN Samman Nidhi</div>
              <div className="text-[11px] text-stone-400">Direct Benefit Transfer & Subsidies</div>
            </div>
            <a href="https://pmkisan.gov.in" target="_blank" rel="noreferrer" className="text-lime-300 hover:underline flex items-center gap-1 font-bold">
              <span>Portal</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* 7. System AI Integrations Health */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-black text-stone-900 uppercase tracking-wide">
          <Cpu className="w-4 h-4 text-emerald-600" />
          <span>{t.dashboard.systemHealth}</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
            <div className="font-bold text-emerald-950 flex items-center justify-between">
              <span>{t.dashboard.geminiEngine}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[11px] text-stone-600 mt-1">gemini-3.8-flash, transcribe & TTS</p>
            <span className="inline-block mt-1 text-[10px] font-extrabold text-emerald-700">{t.dashboard.active}</span>
          </div>

          <div className="p-3 rounded-xl bg-lime-50/70 border border-lime-100">
            <div className="font-bold text-emerald-950 flex items-center justify-between">
              <span>{t.dashboard.gnaniEngine}</span>
              <span className="w-2 h-2 rounded-full bg-lime-500 animate-pulse" />
            </div>
            <p className="text-[11px] text-stone-600 mt-1">Vachana Prisma STT & Timbre TTS</p>
            <span className="inline-block mt-1 text-[10px] font-extrabold text-lime-800">{t.dashboard.ready}</span>
          </div>

          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
            <div className="font-bold text-stone-900 flex items-center justify-between">
              <span>{t.dashboard.dbStatus}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <p className="text-[11px] text-stone-600 mt-1">
              {systemStatus?.integrations?.database?.connected ? 'MongoDB Cluster' : 'Resilient In-Memory Storage'}
            </p>
            <span className="inline-block mt-1 text-[10px] font-extrabold text-emerald-700">{t.dashboard.active}</span>
          </div>
        </div>
      </div>

    </div>
  );
};
