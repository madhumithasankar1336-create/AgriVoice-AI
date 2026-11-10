import React, { useState } from 'react';
import { 
  Sprout, 
  Sparkles, 
  Calendar, 
  MapPin, 
  Droplets, 
  Layers, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  TrendingUp, 
  AlertCircle 
} from 'lucide-react';
import { Language, RecommendedCrop } from '../types';
import { translations } from '../i18n/translations';
import { fetchCropAdvisory } from '../services/api';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

interface CropAdvisoryProps {
  language: Language;
  onNewHistoryItem?: () => void;
}

const DISTRICTS = [
  { key: 'thanjavur', nameTa: 'தஞ்சாவூர் (டெல்டா)', nameEn: 'Thanjavur (Delta)' },
  { key: 'coimbatore', nameTa: 'கோயம்புத்தூர்', nameEn: 'Coimbatore' },
  { key: 'madurai', nameTa: 'மதுரை', nameEn: 'Madurai' },
  { key: 'tiruchirappalli', nameTa: 'திருச்சிராப்பள்ளி', nameEn: 'Tiruchirappalli' },
  { key: 'salem', nameTa: 'சேலம்', nameEn: 'Salem' },
  { key: 'erode', nameTa: 'ஈரோடு', nameEn: 'Erode' },
  { key: 'tirunelveli', nameTa: 'திருநெல்வேலி', nameEn: 'Tirunelveli' },
  { key: 'villupuram', nameTa: 'விழுப்புரம்', nameEn: 'Villupuram' },
  { key: 'dharmapuri', nameTa: 'தர்மபுரி', nameEn: 'Dharmapuri' },
  { key: 'dindigul', nameTa: 'திண்டுக்கல்', nameEn: 'Dindigul' },
];

export const CropAdvisory: React.FC<CropAdvisoryProps> = ({
  language,
  onNewHistoryItem,
}) => {
  const t = translations[language];

  const [soilType, setSoilType] = useState('Red Soil');
  const [season, setSeason] = useState('Kharif / Monsoon');
  const [region, setRegion] = useState('Thanjavur');
  const [irrigation, setIrrigation] = useState('Drip Irrigation');
  const [landSize, setLandSize] = useState('2 Acres');

  const [isCalculating, setIsCalculating] = useState(false);
  const [advisorySummary, setAdvisorySummary] = useState<string>('');
  const [crops, setCrops] = useState<RecommendedCrop[]>([]);
  const [advisoryId, setAdvisoryId] = useState<string>('');
  const [selectedCropIndex, setSelectedCropIndex] = useState(0);

  const { isPlaying, activeId, playAudio, stopAudio } = useAudioPlayer();

  const handleGenerateAdvisory = async () => {
    setIsCalculating(true);
    try {
      const result = await fetchCropAdvisory({
        soilType,
        season,
        region,
        irrigation,
        landSize,
        language,
      });

      setAdvisorySummary(result.advisory.summary);
      setCrops(result.advisory.recommendedCrops || []);
      setAdvisoryId(result.id);
      setSelectedCropIndex(0);
      onNewHistoryItem?.();

      // Read summary aloud
      if (result.advisory.summary) {
        playAudio(result.id, undefined, 'audio/wav', result.advisory.summary, language);
      }
    } catch (err) {
      console.error('Crop advisory error:', err);
    } finally {
      setIsCalculating(false);
    }
  };

  const activeCrop = crops[selectedCropIndex];

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 space-y-6">
      
      {/* Title Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-green-900 text-white p-6 rounded-2xl shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-lime-400 text-emerald-950 flex items-center justify-center font-black shadow-md">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black">{t.crop.title}</h2>
            <p className="text-xs sm:text-sm text-emerald-200 font-medium mt-0.5">
              {t.crop.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Input Parameters Form Card */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Soil Type */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.crop.soilType}</span>
            </label>
            <select
              value={soilType}
              onChange={(e) => setSoilType(e.target.value)}
              className="w-full p-2.5 text-xs sm:text-sm font-semibold text-stone-800 bg-stone-50 border border-stone-300 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none"
            >
              <option value="Red Soil">{t.crop.soils.red}</option>
              <option value="Black Soil">{t.crop.soils.black}</option>
              <option value="Alluvial Loam">{t.crop.soils.alluvial}</option>
              <option value="Sandy Soil">{t.crop.soils.sandy}</option>
              <option value="Clay Soil">{t.crop.soils.clay}</option>
            </select>
          </div>

          {/* Season */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.crop.season}</span>
            </label>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="w-full p-2.5 text-xs sm:text-sm font-semibold text-stone-800 bg-stone-50 border border-stone-300 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none"
            >
              <option value="Kharif / Monsoon">{t.crop.seasons.kuruvai}</option>
              <option value="Rabi / Winter">{t.crop.seasons.samba}</option>
              <option value="Summer / Zaid">{t.crop.seasons.navarai}</option>
            </select>
          </div>

          {/* Region / District */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.crop.region}</span>
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full p-2.5 text-xs sm:text-sm font-semibold text-stone-800 bg-stone-50 border border-stone-300 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none"
            >
              {DISTRICTS.map((d) => (
                <option key={d.key} value={d.nameEn}>
                  {language === 'ta' ? d.nameTa : d.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Irrigation Source */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.crop.irrigation}</span>
            </label>
            <select
              value={irrigation}
              onChange={(e) => setIrrigation(e.target.value)}
              className="w-full p-2.5 text-xs sm:text-sm font-semibold text-stone-800 bg-stone-50 border border-stone-300 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none"
            >
              <option value="Drip Irrigation">{t.crop.irrigations.drip}</option>
              <option value="Canal / River">{t.crop.irrigations.canal}</option>
              <option value="Borewell">{t.crop.irrigations.borewell}</option>
              <option value="Rainfed">{t.crop.irrigations.rainfed}</option>
            </select>
          </div>

          {/* Land Size */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {t.crop.landSize}
            </label>
            <select
              value={landSize}
              onChange={(e) => setLandSize(e.target.value)}
              className="w-full p-2.5 text-xs sm:text-sm font-semibold text-stone-800 bg-stone-50 border border-stone-300 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none"
            >
              <option value="1 Acre">1 {t.common.acres}</option>
              <option value="2.5 Acres">2.5 {t.common.acres}</option>
              <option value="5 Acres">5 {t.common.acres}</option>
              <option value="10 Acres">10 {t.common.acres}</option>
            </select>
          </div>

          {/* Submit Action */}
          <div className="flex items-end">
            <button
              onClick={handleGenerateAdvisory}
              disabled={isCalculating}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isCalculating ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>{t.crop.calculating}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-lime-300" />
                  <span>{t.crop.calculateBtn}</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

      {/* Advisory Output View */}
      {crops.length > 0 ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Executive Summary Card with Voice Read Aloud */}
          <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1">
              <div className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                {language === 'ta' ? 'வேளாண் விஞ்ஞானி சுருக்கம்' : 'Agronomy Executive Summary'}
              </div>
              <p className="text-sm sm:text-base font-semibold text-emerald-950 mt-1">
                {advisorySummary}
              </p>
            </div>

            <button
              onClick={() => {
                if (isPlaying && activeId === advisoryId) {
                  stopAudio();
                } else {
                  playAudio(advisoryId, undefined, 'audio/wav', advisorySummary, language);
                }
              }}
              className={`p-3 rounded-xl text-white transition-all shadow-md shrink-0 ${
                isPlaying && activeId === advisoryId ? 'bg-amber-600 animate-pulse' : 'bg-emerald-700 hover:bg-emerald-800'
              }`}
              title="Listen to summary"
            >
              {isPlaying && activeId === advisoryId ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>

          {/* Crop Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {crops.map((crop, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedCropIndex(idx)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all border ${
                  selectedCropIndex === idx
                    ? 'bg-emerald-800 text-white border-emerald-900 shadow-md scale-102'
                    : 'bg-white text-stone-700 border-stone-200 hover:border-emerald-400'
                }`}
              >
                {language === 'ta' && crop.tamilName ? crop.tamilName : crop.cropName}
                {crop.suitabilityScore && (
                  <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-lime-300 text-emerald-950 font-black">
                    {crop.suitabilityScore}% Match
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Selected Crop Deep-Dive Sheet */}
          {activeCrop && (
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-md space-y-6">
              
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="text-[11px] font-bold text-stone-500 uppercase">{t.crop.duration}</div>
                  <div className="text-sm sm:text-base font-extrabold text-emerald-900 mt-1">
                    {activeCrop.durationDays}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="text-[11px] font-bold text-stone-500 uppercase">{t.crop.expectedYield}</div>
                  <div className="text-sm sm:text-base font-extrabold text-emerald-900 mt-1">
                    {activeCrop.expectedYieldPerAcre}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="text-[11px] font-bold text-stone-500 uppercase">{t.crop.seedRate}</div>
                  <div className="text-sm sm:text-base font-extrabold text-stone-900 mt-1">
                    {activeCrop.seedRatePerAcre || '8-10 kg / acre'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-[11px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t.crop.profitEstimate}</span>
                  </div>
                  <div className="text-sm sm:text-base font-black text-emerald-900 mt-1">
                    {activeCrop.estimatedProfitPerAcre || '₹ 45,000 - ₹ 65,000'}
                  </div>
                </div>

              </div>

              {/* Best Seed Varieties */}
              {activeCrop.bestVarieties && activeCrop.bestVarieties.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-stone-700 mb-2">
                    {language === 'ta' ? 'பரிந்துரைக்கப்பட்ட சிறந்த ரகங்கள்:' : 'Recommended High-Yielding Varieties:'}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeCrop.bestVarieties.map((v, vIdx) => (
                      <span key={vIdx} className="px-3 py-1 rounded-lg bg-emerald-100/70 text-emerald-900 font-bold text-xs">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Step-by-Step Fertilizer Application Schedule */}
              <div>
                <div className="text-xs font-black text-emerald-950 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <span>{t.crop.fertilizerSchedule}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {activeCrop.fertilizerSchedule?.map((stageItem, sIdx) => (
                    <div key={sIdx} className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                      <div className="text-xs font-black text-emerald-800">
                        {stageItem.stage}
                      </div>
                      <div className="text-xs font-semibold text-stone-900">
                        {stageItem.dosage}
                      </div>
                      {stageItem.notes && (
                        <p className="text-[11px] text-stone-500">{stageItem.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Irrigation & Pest Management */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                
                <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200">
                  <div className="text-xs font-black text-blue-950 mb-1.5 flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-blue-700" />
                    <span>{t.crop.irrigationAdvice}</span>
                  </div>
                  <p className="text-xs text-blue-950 font-medium">
                    {activeCrop.waterRequirement || (language === 'ta' ? 'மண் ஈரப்பதத்தை கவனித்து 5-7 நாட்களுக்கு ஒருமுறை நீர் பாய்ச்சவும்.' : 'Irrigate every 5-7 days based on soil moisture monitoring.')}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200">
                  <div className="text-xs font-black text-amber-950 mb-1.5 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-700" />
                    <span>{t.crop.pestRisks}</span>
                  </div>
                  <ul className="text-xs text-amber-950 font-medium space-y-1">
                    {activeCrop.pestRisks?.map((pr, prIdx) => (
                      <li key={prIdx} className="flex items-start gap-1">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{pr}</span>
                      </li>
                    )) || (
                      <li>{language === 'ta' ? 'இலை சுருட்டு புழு, தண்டு துளைப்பான்' : 'Stem borer, leaf folder'}</li>
                    )}
                  </ul>
                </div>

              </div>

            </div>
          )}

        </div>
      ) : (
        /* Empty / Initial State */
        <div className="bg-white rounded-2xl border-2 border-dashed border-stone-200 p-12 text-center text-stone-400 space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Sprout className="w-8 h-8" />
          </div>
          <h4 className="text-stone-700 font-bold text-base">
            {language === 'ta' ? 'உங்கள் நிலத்திற்கான பயிர் ஆலோசனையை பெறுங்கள்' : 'Ready to generate customized crop advisory'}
          </h4>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            {language === 'ta'
              ? 'மேலே உங்கள் மண் வகை மற்றும் மாவட்டத்தை தேர்ந்தெடுத்து "பயிர் ஆலோசனையை பெறுக" பொத்தானை அழுத்தவும்.'
              : 'Select your soil type, season, and district above and click "Generate Crop Advisory" to receive AI cultivation guidance.'}
          </p>
        </div>
      )}

    </div>
  );
};
