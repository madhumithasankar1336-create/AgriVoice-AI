/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Language, AppModule, SystemStatus } from './types';
import { Header } from './components/Header';
import { VoiceAssistant } from './components/VoiceAssistant';
import { DiseaseDoctor } from './components/DiseaseDoctor';
import { CropAdvisory } from './components/CropAdvisory';
import { WeatherAdvisory } from './components/WeatherAdvisory';
import { Dashboard } from './components/Dashboard';
import { fetchSystemStatus } from './services/api';
import { Phone, Heart, Leaf } from 'lucide-react';

export default function App() {
  const [language, setLanguage] = useState<Language>('ta');
  const [activeModule, setActiveModule] = useState<AppModule>('dashboard');
  const [initialQuery, setInitialQuery] = useState<string>('');
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [historyKey, setHistoryKey] = useState<number>(0);

  useEffect(() => {
    fetchSystemStatus()
      .then(setSystemStatus)
      .catch((err) => console.warn('Status check warning:', err));
  }, []);

  const handleNewHistoryItem = () => {
    setHistoryKey((prev) => prev + 1);
  };

  const handleQuickQuery = (query: string) => {
    setInitialQuery(query);
    setActiveModule('voice_assistant');
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      
      {/* Top Navigation & Module Switcher Bar */}
      <Header
        language={language}
        onLanguageChange={setLanguage}
        activeModule={activeModule}
        onModuleChange={(mod) => {
          setInitialQuery('');
          setActiveModule(mod);
        }}
        systemStatus={systemStatus}
      />

      {/* Main Module Content Area */}
      <main className="flex-1 pb-12">
        {(activeModule === 'dashboard' || activeModule === 'history_dashboard') && (
          <Dashboard
            key={`dash-${language}-${historyKey}`}
            language={language}
            systemStatus={systemStatus}
            onNavigateModule={(mod) => {
              setInitialQuery('');
              setActiveModule(mod);
            }}
            onQuickQuery={handleQuickQuery}
          />
        )}

        {activeModule === 'voice_assistant' && (
          <VoiceAssistant
            key={`voice-${language}-${initialQuery}`}
            language={language}
            onNewHistoryItem={handleNewHistoryItem}
            initialQuery={initialQuery}
          />
        )}

        {activeModule === 'disease_doctor' && (
          <DiseaseDoctor
            key={`disease-${language}`}
            language={language}
            onNewHistoryItem={handleNewHistoryItem}
          />
        )}

        {activeModule === 'crop_advisory' && (
          <CropAdvisory
            key={`crop-${language}`}
            language={language}
            onNewHistoryItem={handleNewHistoryItem}
          />
        )}

        {activeModule === 'weather_advisory' && (
          <WeatherAdvisory
            key={`weather-${language}`}
            language={language}
          />
        )}
      </main>

      {/* Farmer Helpline & Footer */}
      <footer className="mt-auto bg-stone-900 text-stone-300 border-t border-stone-800 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Leaf className="w-4 h-4" />
            </span>
            <div>
              <div className="font-extrabold text-white text-sm">
                AgriVoice AI – Smart Farming Assistant
              </div>
              <div className="text-stone-400">
                {language === 'ta'
                  ? 'விவசாயிகளுக்கான குரல் வழி நுண்ணறிவு தளம்'
                  : 'Voice-Based Smart Agriculture Assistant for Farmers'}
              </div>
            </div>
          </div>

          {/* Kisan Call Center Helpline */}
          <div className="flex items-center gap-2 bg-stone-800/90 px-3.5 py-2 rounded-xl border border-stone-700">
            <Phone className="w-4 h-4 text-lime-400" />
            <span className="text-stone-400 font-medium">
              {language === 'ta' ? 'கிசான் உதவி எண்:' : 'Kisan Helpline:'}
            </span>
            <a
              href="tel:18001801551"
              className="font-black text-lime-400 hover:underline"
            >
              1800-180-1551 (Toll Free)
            </a>
          </div>

          <div className="flex items-center gap-1 text-stone-500">
            <span>Powered by</span>
            <span className="font-bold text-stone-400">Google Gemini & Gnani AI</span>
          </div>

        </div>
      </footer>

    </div>
  );
}
