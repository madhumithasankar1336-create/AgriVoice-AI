import React, { useState, useEffect } from 'react';
import { 
  CloudSun, 
  Droplets, 
  Wind, 
  Thermometer, 
  AlertTriangle, 
  CheckCircle, 
  Volume2, 
  VolumeX, 
  RotateCw,
  Sparkles,
  MapPin,
  Calendar,
  CloudRain
} from 'lucide-react';
import { Language, WeatherData, WeatherAdvisory as IWeatherAdvisory } from '../types';
import { translations } from '../i18n/translations';
import { fetchWeatherAdvisory } from '../services/api';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

interface WeatherAdvisoryProps {
  language: Language;
}

const DISTRICT_LIST = [
  { key: 'thanjavur', nameTa: 'தஞ்சாவூர் (டெல்டா)', nameEn: 'Thanjavur (Delta)' },
  { key: 'coimbatore', nameTa: 'கோயம்புத்தூர்', nameEn: 'Coimbatore' },
  { key: 'madurai', nameTa: 'மதுரை', nameEn: 'Madurai' },
  { key: 'tiruchirappalli', nameTa: 'திருச்சிராப்பள்ளி', nameEn: 'Tiruchirappalli' },
  { key: 'salem', nameTa: 'சேலம்', nameEn: 'Salem' },
  { key: 'erode', nameTa: 'ஈரோடு', nameEn: 'Erode' },
  { key: 'tirunelveli', nameTa: 'திருநெல்வேலி', nameEn: 'Tirunelveli' },
  { key: 'chennai', nameTa: 'சென்னை', nameEn: 'Chennai' },
];

export const WeatherAdvisory: React.FC<WeatherAdvisoryProps> = ({ language }) => {
  const t = translations[language];
  const [selectedCity, setSelectedCity] = useState('thanjavur');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [advisory, setAdvisory] = useState<IWeatherAdvisory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isPlaying, activeId, playAudio, stopAudio } = useAudioPlayer();

  const loadWeather = async (cityKey: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchWeatherAdvisory(cityKey, language);
      setWeatherData(result.weather);
      setAdvisory(result.advisory);
    } catch (err: any) {
      console.error('Weather load error:', err);
      setError(err.message || 'Unable to load weather advisory.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWeather(selectedCity);
  }, [selectedCity, language]);

  const handleSpeakAdvisory = () => {
    if (!advisory) return;
    if (isPlaying && activeId === 'weather-speech') {
      stopAudio();
    } else {
      const speechText = `${advisory.headline}. ${advisory.sprayingAdvice}. ${advisory.irrigationAdvice}`;
      playAudio('weather-speech', undefined, 'audio/wav', speechText, language);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 space-y-6">
      
      {/* Title Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-sky-900 text-white p-6 rounded-2xl shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-lime-400 text-emerald-950 flex items-center justify-center font-black shadow-md">
              <CloudSun className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black">{t.weather.title}</h2>
              <p className="text-xs sm:text-sm text-emerald-200 font-medium mt-0.5">
                {t.weather.subtitle}
              </p>
            </div>
          </div>

          {/* District Switcher */}
          <div className="flex items-center gap-2 bg-emerald-950/60 p-1.5 rounded-xl border border-emerald-700/60">
            <MapPin className="w-4 h-4 text-lime-400 ml-1" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-bold text-white outline-none cursor-pointer pr-2"
            >
              {DISTRICT_LIST.map((d) => (
                <option key={d.key} value={d.key} className="text-stone-900">
                  {language === 'ta' ? d.nameTa : d.nameEn}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-stone-500 shadow-sm border border-stone-200 flex flex-col items-center justify-center gap-3">
          <RotateCw className="w-8 h-8 text-emerald-600 animate-spin" />
          <div className="text-sm font-bold text-stone-800">
            {language === 'ta' ? 'வானிலை தகவல்களைப் பெறுகிறது...' : 'Fetching live meteorological data...'}
          </div>
        </div>
      ) : weatherData ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* 4 Live Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Thermometer className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-stone-500 uppercase">{t.weather.temperature}</div>
                <div className="text-lg sm:text-xl font-black text-stone-900 mt-0.5">
                  {weatherData.temperature}°C
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-stone-500 uppercase">{t.weather.humidity}</div>
                <div className="text-lg sm:text-xl font-black text-stone-900 mt-0.5">
                  {weatherData.humidity}%
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <CloudRain className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-stone-500 uppercase">{t.weather.rainChance}</div>
                <div className="text-lg sm:text-xl font-black text-sky-950 mt-0.5">
                  {weatherData.precipitationProbability}%
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Wind className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-stone-500 uppercase">{t.weather.windSpeed}</div>
                <div className="text-lg sm:text-xl font-black text-stone-900 mt-0.5">
                  {weatherData.windSpeed} km/h
                </div>
              </div>
            </div>

          </div>

          {/* AI Farming Action Plan Card */}
          {advisory && (
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-md space-y-5">
              
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-200">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base sm:text-lg font-black text-emerald-950">
                    {t.weather.actionPlan} – {weatherData.city}
                  </h3>
                </div>

                <button
                  onClick={handleSpeakAdvisory}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white transition-all shadow-sm ${
                    isPlaying && activeId === 'weather-speech' ? 'bg-amber-600 animate-pulse' : 'bg-emerald-700 hover:bg-emerald-800'
                  }`}
                >
                  {isPlaying && activeId === 'weather-speech' ? (
                    <>
                      <VolumeX className="w-4 h-4" />
                      <span>{t.voice.stopPlaying}</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" />
                      <span>{language === 'ta' ? 'அறிக்கையை கேட்க' : 'Listen Report'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Headline */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm font-bold text-emerald-950">
                {advisory.headline}
              </div>

              {/* Action Operations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Spraying Advice */}
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="text-xs font-black text-stone-900 mb-1 flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-emerald-600" />
                    <span>{t.weather.spraying}</span>
                  </div>
                  <p className="text-xs text-stone-700 font-medium">
                    {advisory.sprayingAdvice}
                  </p>
                </div>

                {/* Irrigation Advice */}
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="text-xs font-black text-stone-900 mb-1 flex items-center gap-1.5">
                    <CloudRain className="w-4 h-4 text-sky-600" />
                    <span>{t.weather.irrigation}</span>
                  </div>
                  <p className="text-xs text-stone-700 font-medium">
                    {advisory.irrigationAdvice}
                  </p>
                </div>

                {/* Harvesting Advice */}
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="text-xs font-black text-stone-900 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <span>{t.weather.harvesting}</span>
                  </div>
                  <p className="text-xs text-stone-700 font-medium">
                    {advisory.harvestingAdvice || (language === 'ta' ? 'அறுவடைக்கு உகந்த சூழ்நிலை உள்ளது.' : 'Harvesting operations can proceed smoothly.')}
                  </p>
                </div>

                {/* Disease Warning */}
                <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200">
                  <div className="text-xs font-black text-amber-950 mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>{t.weather.diseaseAlert}</span>
                  </div>
                  <p className="text-xs text-amber-900 font-medium">
                    {advisory.diseaseWarning}
                  </p>
                </div>

              </div>

              {/* Actionable Tips */}
              {advisory.actionableTips && advisory.actionableTips.length > 0 && (
                <div className="pt-2">
                  <div className="text-xs font-black text-emerald-950 uppercase mb-2">
                    {language === 'ta' ? 'உடனடி விவசாய குறிப்புகள்:' : 'Actionable Agronomy Advice:'}
                  </div>
                  <div className="space-y-1.5">
                    {advisory.actionableTips.map((tip, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-stone-700 font-medium">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* 5-Day Forecast Grid */}
          {weatherData.forecast && weatherData.forecast.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
              <div className="text-xs font-black text-stone-800 uppercase tracking-wider mb-3">
                {t.weather.fiveDayForecast}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {weatherData.forecast.map((fc, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-center space-y-1">
                    <div className="text-[11px] font-bold text-stone-500">
                      {new Date(fc.date).toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-US', { weekday: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-sm font-extrabold text-stone-900">
                      {fc.maxTemp}° / <span className="text-stone-500 text-xs">{fc.minTemp}°</span>
                    </div>
                    <div className="text-[10px] font-semibold text-sky-700 flex items-center justify-center gap-1">
                      <Droplets className="w-3 h-3 text-sky-500" />
                      <span>{fc.rainProb}% rain</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : null}

    </div>
  );
};
