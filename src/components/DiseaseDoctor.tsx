import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Leaf, 
  FlaskConical, 
  HelpCircle, 
  Volume2, 
  VolumeX, 
  RotateCw,
  Camera,
  Info
} from 'lucide-react';
import { Language, DiseaseAnalysis } from '../types';
import { translations } from '../i18n/translations';
import { detectPlantDisease } from '../services/api';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

interface DiseaseDoctorProps {
  language: Language;
  onNewHistoryItem?: () => void;
}

// Visual sample templates for quick testing
const SAMPLE_DISEASE_PRESETS = [
  {
    id: 'paddy_blast',
    nameEn: 'Paddy Blast',
    nameTa: 'நெல் குலை நோய்',
    crop: 'Paddy / நெல்',
    description: 'Spindle-shaped diamond spots with grey center on rice leaves.',
    // Clean SVG graphic of a paddy leaf with spindle lesions
    svgDataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="%23e8f5e9"/><path d="M50,260 Q180,60 360,40 Q220,160 80,270 Z" fill="%234caf50"/><ellipse cx="180" cy="150" rx="35" ry="12" fill="%23795548" transform="rotate(-35 180 150)"/><ellipse cx="180" cy="150" rx="20" ry="6" fill="%23cfd8dc" transform="rotate(-35 180 150)"/><ellipse cx="250" cy="100" rx="25" ry="8" fill="%23795548" transform="rotate(-35 250 100)"/><ellipse cx="250" cy="100" rx="14" ry="4" fill="%23cfd8dc" transform="rotate(-35 250 100)"/><text x="20" y="280" font-family="sans-serif" font-size="14" fill="%232e7d32" font-weight="bold">Sample: Paddy Blast (Rice Leaf)</text></svg>`,
  },
  {
    id: 'tomato_blight',
    nameEn: 'Tomato Late Blight',
    nameTa: 'தக்காளி இலை கருகல்',
    crop: 'Tomato / தக்காளி',
    description: 'Dark water-soaked lesions turning brown with pale margins on tomato leaf.',
    svgDataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="%23fff8e1"/><path d="M200,30 Q280,120 250,250 Q160,260 140,150 Q120,60 200,30 Z" fill="%2366bb6a"/><circle cx="170" cy="120" r="28" fill="%234e342e" opacity="0.85"/><circle cx="210" cy="170" r="35" fill="%233e2723" opacity="0.9"/><circle cx="160" cy="200" r="22" fill="%235d4037" opacity="0.8"/><text x="20" y="280" font-family="sans-serif" font-size="14" fill="%23e65100" font-weight="bold">Sample: Tomato Blight Leaf</text></svg>`,
  },
  {
    id: 'cotton_pest',
    nameEn: 'Cotton Whitefly Attack',
    nameTa: 'பருத்தி வெள்ளை ஈ தாக்குதல்',
    crop: 'Cotton / பருத்தி',
    description: 'Curling leaves with yellow mosaic speckling and whitefly nymph colonies.',
    svgDataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="%23f1f8e9"/><path d="M200,40 C320,100 320,240 200,270 C80,240 80,100 200,40 Z" fill="%2381c784"/><circle cx="170" cy="130" r="15" fill="%23fdd835"/><circle cx="230" cy="160" r="18" fill="%23fdd835"/><circle cx="180" cy="200" r="14" fill="%23fdd835"/><circle cx="170" cy="130" r="3" fill="%23ffffff"/><circle cx="230" cy="160" r="3" fill="%23ffffff"/><text x="20" y="280" font-family="sans-serif" font-size="14" fill="%2333691e" font-weight="bold">Sample: Cotton Leaf Curl</text></svg>`,
  },
  {
    id: 'maize_armyworm',
    nameEn: 'Maize Armyworm',
    nameTa: 'மக்காச்சோளம் படைப்புழு',
    crop: 'Maize / மக்காச்சோளம்',
    description: 'Window pane leaf damage and circular shot holes in whorl with saw-dust frass.',
    svgDataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="%23e0f2f1"/><path d="M40,280 L200,40 L360,280 L200,220 Z" fill="%2343a047"/><circle cx="190" cy="120" r="12" fill="%23e0f2f1"/><circle cx="210" cy="150" r="16" fill="%23e0f2f1"/><circle cx="175" cy="180" r="14" fill="%23e0f2f1"/><text x="20" y="280" font-family="sans-serif" font-size="14" fill="%23004d40" font-weight="bold">Sample: Maize Armyworm Damage</text></svg>`,
  },
];

export const DiseaseDoctor: React.FC<DiseaseDoctorProps> = ({
  language,
  onNewHistoryItem,
}) => {
  const t = translations[language];
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [userNotes, setUserNotes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DiseaseAnalysis | null>(null);
  const [analysisId, setAnalysisId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { isPlaying, activeId, playAudio, stopAudio } = useAudioPlayer();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        setError(language === 'ta' ? 'கோப்பின் அளவு 20MB-க்கு கீழ் இருக்க வேண்டும்' : 'File must be under 20MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setAnalysisResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectSample = (sample: typeof SAMPLE_DISEASE_PRESETS[0]) => {
    setSelectedImage(sample.svgDataUrl);
    setUserNotes(`${sample.crop} - ${sample.nameEn} (${sample.description})`);
    setAnalysisResult(null);
    setError(null);
  };

  const handleDiagnose = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const data = await detectPlantDisease(selectedImage, userNotes, language);
      setAnalysisResult(data.fullAnalysis);
      setAnalysisId(data.id);
      onNewHistoryItem?.();

      // Speak diagnosis summary
      if (data.fullAnalysis) {
        const spokenText = language === 'ta'
          ? `${data.fullAnalysis.cropName || 'பயிர்'}: ${data.fullAnalysis.tamilDiseaseName || data.fullAnalysis.diseaseName}. தீவிரத்தன்மை: ${data.fullAnalysis.severity}. முக்கிய தீர்வு: ${data.fullAnalysis.organicTreatment?.[0] || data.fullAnalysis.chemicalTreatment?.[0] || ''}`
          : `${data.fullAnalysis.cropName || 'Crop'}: ${data.fullAnalysis.diseaseName}. Severity: ${data.fullAnalysis.severity}. Key remedy: ${data.fullAnalysis.organicTreatment?.[0] || data.fullAnalysis.chemicalTreatment?.[0] || ''}`;

        playAudio(data.id, undefined, 'audio/wav', spokenText, language);
      }
    } catch (err: any) {
      console.error('Diagnosis error:', err);
      setError(err.message || 'Failed to analyze plant disease.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev?.toLowerCase()) {
      case 'critical':
      case 'high':
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-800 border border-red-200">Critical / அவசரம்</span>;
      case 'medium':
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-200">Medium / நடுத்தரம்</span>;
      case 'low':
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-yellow-100 text-yellow-900 border border-yellow-200">Low / குறைவு</span>;
      case 'healthy':
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-200">Healthy / ஆரோக்கியமானது</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-stone-100 text-stone-800">{sev}</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 space-y-6">
      
      {/* Title Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-6 rounded-2xl shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-lime-400 text-emerald-950 flex items-center justify-center font-black shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black">{t.disease.title}</h2>
            <p className="text-xs sm:text-sm text-emerald-200 font-medium mt-0.5">
              {t.disease.subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Upload & Camera & Sample Presets */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Image Upload Box */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {selectedImage ? (
              <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500 bg-stone-900/5 group">
                <img
                  src={selectedImage}
                  alt="Plant preview"
                  className="w-full h-56 object-contain bg-white"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-emerald-900/80 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-md backdrop-blur-xs transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{language === 'ta' ? 'மாற்றுக' : 'Change'}</span>
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50/80 rounded-xl p-8 text-center cursor-pointer transition-all group"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <div className="text-sm font-bold text-emerald-950">
                  {t.disease.uploadText}
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  {t.disease.supportedFormats}
                </p>
              </div>
            )}

            {/* Optional Notes */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {language === 'ta' ? 'கூடுதல் குறிப்புகள் (விருப்பத்தேர்வு):' : 'Additional Observations:'}
              </label>
              <textarea
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder={t.disease.notesPlaceholder}
                rows={2}
                className="w-full p-2.5 text-xs text-stone-800 bg-stone-50 rounded-xl border border-stone-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none"
              />
            </div>

            {/* Diagnose Action Button */}
            <button
              onClick={handleDiagnose}
              disabled={!selectedImage || isAnalyzing}
              className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>{t.disease.analyzingDisease}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-lime-300" />
                  <span>{t.disease.analyzeBtn}</span>
                </>
              )}
            </button>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

          </div>

          {/* Preset Demonstration Samples */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
            <div className="text-xs font-bold text-emerald-950 mb-2 flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4 text-emerald-600" />
              <span>{t.disease.orChooseSample}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SAMPLE_DISEASE_PRESETS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  className="p-2.5 rounded-xl border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/60 text-left transition-all group"
                >
                  <div className="font-extrabold text-xs text-stone-900 group-hover:text-emerald-950 truncate">
                    {language === 'ta' ? sample.nameTa : sample.nameEn}
                  </div>
                  <div className="text-[10px] text-stone-500 truncate mt-0.5">
                    {sample.crop}
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side: Detailed Diagnostic Report */}
        <div className="lg:col-span-7">
          {analysisResult ? (
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-md space-y-5 animate-in fade-in duration-300">
              
              {/* Header result with badge and speech read button */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-stone-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                      {analysisResult.cropName || 'Crop Disease Analysis'}
                    </span>
                    {getSeverityBadge(analysisResult.severity)}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-emerald-950 mt-1">
                    {language === 'ta' && analysisResult.tamilDiseaseName
                      ? analysisResult.tamilDiseaseName
                      : analysisResult.diseaseName}
                  </h3>
                  {analysisResult.tamilDiseaseName && language === 'en' && (
                    <div className="text-xs font-medium text-stone-500 mt-0.5">
                      Tamil: {analysisResult.tamilDiseaseName}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-[10px] text-stone-500 font-bold uppercase">{t.disease.confidence}</div>
                    <div className="text-sm font-extrabold text-emerald-700">{analysisResult.confidence}%</div>
                  </div>

                  <button
                    onClick={() => {
                      if (isPlaying && activeId === analysisId) {
                        stopAudio();
                      } else {
                        const voiceReport = `${analysisResult.diseaseName}. ${analysisResult.severity}. ${analysisResult.organicTreatment?.[0] || ''}`;
                        playAudio(analysisId, undefined, 'audio/wav', voiceReport, language);
                      }
                    }}
                    className={`p-2.5 rounded-xl text-white transition-all shadow-sm ${
                      isPlaying && activeId === analysisId ? 'bg-amber-600 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                    title="Read Aloud Diagnosis"
                  >
                    {isPlaying && activeId === analysisId ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Symptoms & Causes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80">
                  <div className="text-xs font-extrabold text-amber-950 mb-2 flex items-center gap-1.5">
                    <Leaf className="w-4 h-4 text-amber-700" />
                    <span>{t.disease.symptoms}</span>
                  </div>
                  <ul className="text-xs text-amber-900 space-y-1">
                    {analysisResult.symptoms.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="font-bold text-amber-700">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="text-xs font-extrabold text-stone-900 mb-2 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-stone-600" />
                    <span>{t.disease.causes}</span>
                  </div>
                  <ul className="text-xs text-stone-700 space-y-1">
                    {analysisResult.causes?.map((c, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="font-bold text-stone-500">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Organic Remedies */}
              <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200">
                <div className="text-xs font-black text-emerald-950 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>{t.disease.organicCure}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-emerald-900 font-medium">
                  {analysisResult.organicTreatment.map((ot, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-white/90 border border-emerald-100 flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{ot}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chemical Remedies */}
              <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200">
                <div className="text-xs font-black text-blue-950 mb-2 flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4 text-blue-700" />
                  <span>{t.disease.chemicalCure}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-blue-950 font-medium">
                  {analysisResult.chemicalTreatment.map((ct, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-white/90 border border-blue-100 flex items-start gap-1.5">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>{ct}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prevention Tips */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                <div className="text-xs font-black text-stone-900 mb-2">
                  {t.disease.prevention}
                </div>
                <ul className="text-xs text-stone-700 space-y-1">
                  {analysisResult.preventionTips.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Official Agronomist Disclaimer */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-extrabold">{t.disease.expertAlert}</div>
                  <p className="mt-0.5 text-amber-900">
                    {analysisResult.expertNotice || (language === 'ta'
                      ? 'தீவிர பாதிப்பு இருப்பின், அருகில் உள்ள வேளாண் விரிவாக்க அலுவலர் அல்லது வேளாண்மை அறிவியல் நிலையத்தை (KVK) அணுகவும்.'
                      : 'Please verify with your local Krishi Vigyan Kendra (KVK) or Assistant Agricultural Officer if symptoms persist across the field.')}
                  </p>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl border-2 border-dashed border-stone-200 p-12 text-center text-stone-400 space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Leaf className="w-8 h-8" />
              </div>
              <h4 className="text-stone-700 font-bold text-base">
                {language === 'ta' ? 'பயிர் நோயை அறிய புகைப்படத்தை பதிவேற்றுங்கள்' : 'Upload or select a sample image to diagnose'}
              </h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                {language === 'ta'
                  ? 'இடதுபுறம் உள்ள மாதிரிகளில் ஏதேனும் ஒன்றைத் தேர்ந்தெடுத்தோ அல்லது உங்கள் பயிரின் புகைப்படத்தை பதிவேற்றியோ நோயைக் கண்டறியலாம்.'
                  : 'Select one of the sample presets on the left or upload your crop picture to run AI visual pathology diagnosis.'}
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
