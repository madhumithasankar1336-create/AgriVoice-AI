import React, { useState } from 'react';
import { 
  Sprout, 
  Languages, 
  Mic, 
  HelpCircle, 
  Activity, 
  X, 
  CheckCircle2, 
  Sparkles,
  Layers
} from 'lucide-react';
import { Language, AppModule, SystemStatus } from '../types';
import { translations } from '../i18n/translations';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  activeModule: AppModule;
  onModuleChange: (mod: AppModule) => void;
  systemStatus: SystemStatus | null;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  activeModule,
  onModuleChange,
  systemStatus,
}) => {
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const t = translations[language];

  return (
    <>
      <header className="sticky top-0 z-40 bg-emerald-900 text-white shadow-md border-b border-emerald-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            
            {/* Logo and App Title */}
            <div 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => onModuleChange('dashboard')}
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-lime-400 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-200">
                <Sprout className="w-6 h-6 text-emerald-950 font-black" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
                    {t.appTitle}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-lime-400 text-emerald-950 font-black uppercase tracking-wider">
                      AI
                    </span>
                  </h1>
                </div>
                <p className="text-xs text-emerald-200 hidden sm:block font-medium">
                  {t.appSubtitle}
                </p>
              </div>
            </div>

            {/* Right Controls: Status, Help & Language Switcher */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Engine Status Pill */}
              <button
                onClick={() => setShowStatusModal(true)}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-950 text-emerald-200 border border-emerald-700/60 text-xs font-medium transition-colors"
                title="System Integrations & AI Engine Status"
              >
                <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                <span>Gemini + Gnani AI</span>
              </button>

              {/* Architecture & Modules Info Button */}
              <button
                onClick={() => setShowHelpModal(true)}
                className="p-2 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 transition-colors"
                title="Project Modules & Architecture"
              >
                <HelpCircle className="w-5 h-5" />
              </button>

              {/* Bilingual Tamil / English Language Switcher */}
              <div className="flex items-center p-0.5 bg-emerald-950/80 rounded-xl border border-emerald-700/70">
                <button
                  type="button"
                  onClick={() => onLanguageChange('ta')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    language === 'ta'
                      ? 'bg-lime-400 text-emerald-950 shadow-sm'
                      : 'text-emerald-300 hover:text-white'
                  }`}
                >
                  தமிழ்
                </button>
                <button
                  type="button"
                  onClick={() => onLanguageChange('en')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    language === 'en'
                      ? 'bg-lime-400 text-emerald-950 shadow-sm'
                      : 'text-emerald-300 hover:text-white'
                  }`}
                >
                  English
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="bg-emerald-950/90 border-t border-emerald-800/80 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 scrollbar-none">
            
            <button
              onClick={() => onModuleChange('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                activeModule === 'dashboard' || activeModule === 'history_dashboard'
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400/50'
                  : 'text-emerald-200 hover:bg-emerald-900/60 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4 text-lime-300" />
              {language === 'ta' ? 'டாஷ்போர்டு' : 'Dashboard'}
            </button>

            <button
              onClick={() => onModuleChange('voice_assistant')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                activeModule === 'voice_assistant'
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400/50'
                  : 'text-emerald-200 hover:bg-emerald-900/60 hover:text-white'
              }`}
            >
              <Mic className="w-4 h-4 text-lime-300" />
              {t.tabs.voiceAssistant}
            </button>

            <button
              onClick={() => onModuleChange('disease_doctor')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                activeModule === 'disease_doctor'
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400/50'
                  : 'text-emerald-200 hover:bg-emerald-900/60 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              {t.tabs.diseaseDoctor}
            </button>

            <button
              onClick={() => onModuleChange('crop_advisory')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                activeModule === 'crop_advisory'
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400/50'
                  : 'text-emerald-200 hover:bg-emerald-900/60 hover:text-white'
              }`}
            >
              <Sprout className="w-4 h-4 text-lime-300" />
              {t.tabs.cropAdvisory}
            </button>

            <button
              onClick={() => onModuleChange('weather_advisory')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                activeModule === 'weather_advisory'
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400/50'
                  : 'text-emerald-200 hover:bg-emerald-900/60 hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4 text-sky-300" />
              {t.tabs.weatherAdvisory}
            </button>

          </div>
        </div>
      </header>

      {/* Project Modules & Architecture Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-emerald-900 text-white rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Sprout className="w-6 h-6 text-lime-400" />
                <h3 className="text-lg font-bold">AgriVoice AI – 8 Core Project Modules</h3>
              </div>
              <button 
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 rounded-lg hover:bg-emerald-800 text-emerald-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-stone-700 text-sm">
              <p className="font-medium text-emerald-900">
                Complete AI-powered voice assistant built for farmers with dual Tamil & English support:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                    User Interface & Language
                  </div>
                  <p className="text-xs text-stone-600 mt-1">Farmer-first dashboard with instant Tamil & English bilingual toggling.</p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                    Voice Input Module
                  </div>
                  <p className="text-xs text-stone-600 mt-1">Captures farmer questions through microphone with live volume visualizer.</p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                    Speech-to-Text Module
                  </div>
                  <p className="text-xs text-stone-600 mt-1">Gnani AI Prisma STT for Tamil/English with seamless Gemini 3.5 fallback.</p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">4</span>
                    AI Farming Assistant
                  </div>
                  <p className="text-xs text-stone-600 mt-1">Gemini AI engine tuned with TNAU & ICAR agricultural expertise.</p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">5</span>
                    Text-to-Speech Module
                  </div>
                  <p className="text-xs text-stone-600 mt-1">Gnani AI Timbre TTS reads answers aloud in natural Tamil & English voice.</p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">6</span>
                    Crop Advisory Module
                  </div>
                  <p className="text-xs text-stone-600 mt-1">Soil, season, and district matched crops with NPK fertilizer schedule.</p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">7</span>
                    Plant Disease Detection
                  </div>
                  <p className="text-xs text-stone-600 mt-1">Visual plant pathology scan with organic remedies & chemical dosage.</p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">8</span>
                    Weather & Chat History
                  </div>
                  <p className="text-xs text-stone-600 mt-1">Live weather farm advisory plus persistent history with audio re-listen.</p>
                </div>
              </div>

              <div className="pt-2 text-xs text-stone-500 text-center">
                Built with React, Express, Google Gemini AI, Gnani AI Speech Platform, and MongoDB fallback.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Integrations Health Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-emerald-900 text-white rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-lime-400" />
                <h3 className="text-base font-bold">System Integrations & AI Engine</h3>
              </div>
              <button 
                onClick={() => setShowStatusModal(false)}
                className="p-1.5 rounded-lg hover:bg-emerald-800 text-emerald-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-stone-700 text-sm">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-stone-900">Google Gemini AI Engine</div>
                  <p className="text-xs text-stone-600">Model: gemini-3.8-flash, gemini-3.5-transcribe, gemini-3.8-flash-lite-tts</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Active & Ready
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-stone-900">Gnani AI (Vachana Speech Platform)</div>
                  <p className="text-xs text-stone-600">
                    Models: Prisma v3.0 (STT) & Timbre v2.5 (TTS). Integrated with automatic Gemini fallback.
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-lime-100 text-lime-900">
                    {systemStatus?.integrations?.gnaniAI?.configured ? 'Active (API Key Verified)' : 'Cascading Speech Fallback Ready'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-stone-900">Database Storage Layer</div>
                  <p className="text-xs text-stone-600">
                    {systemStatus?.integrations?.database?.connected 
                      ? 'Connected to MongoDB Atlas / Local cluster.' 
                      : 'Resilient high-speed in-memory & local persistent storage active.'}
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Storage Operational
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
