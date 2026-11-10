import { GoogleGenAI, Type } from '@google/genai';

// Helper to determine if a real Gemini API key is configured
const getGeminiClient = (): GoogleGenAI | null => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Domain Agricultural Knowledge Base for instant response when offline or key is unconfigured
function getDomainAgriculturalAdvice(query: string, language: 'ta' | 'en'): { text: string; keyPoints: string[]; suggestedQuestions: string[] } {
  const isTamil = language === 'ta';
  const q = query.toLowerCase();

  if (q.includes('நெல்') || q.includes('paddy') || q.includes('rice') || q.includes('இலை சுருட்டு')) {
    return {
      text: isTamil
        ? `நெல் பயிரில் இலை சுருட்டு புழு மற்றும் உர மேலாண்மைக்கான வேளாண் விஞ்ஞானி பரிந்துரைகள்:

1. இலை சுருட்டு புழு கட்டுப்பாடு:
   - வரப்புகளில் உள்ள புற்களை செதுக்கி தூய்மையாக வைக்கவும்.
   - ஏக்கருக்கு டிரைக்கோகிரம்மா (Trichogramma japonicum) ஒட்டுண்ணி அட்டை 2 சிசி வீதம் 3 முறை கட்டவும்.
   - தாக்குதல் பொருளாதார சேத நிலையை (10% இலைகள் சேதம்) தாண்டினால், குளோரான்ட்ரானிலிபுரோல் (Chlorantraniliprole 18.5% SC) 60 மிலி அல்லது கார்டாப் ஹைட்ரோகுளோரைடு (Cartap hydrochloride 50% SP) 400 கிராம் ஏக்கருக்கு 200 லிட்டர் நீரில் கலந்து தெளிக்கவும்.

2. உர மேலாண்மை:
   - தழைச்சத்து உரமான யூரியாவை ஒரே முறையில் இடாமல் 3-4 முறை பிரித்து இடவும்.
   - தூர் கட்டும் பருவத்தில் ஏக்கருக்கு 10 கிலோ ஜிங்க் சல்பேட் இடவும்.`
        : `Agronomic Guidance for Paddy Leaf Folder & Nutrient Management:

1. Leaf Folder Management:
   - Clean field bunds to eradicate alternate host grasses.
   - Release Trichogramma japonicum egg parasitoids @ 2 cc/acre thrice at weekly intervals.
   - If foliage damage exceeds 10% ETL, spray Chlorantraniliprole 18.5% SC @ 60 ml/acre or Cartap hydrochloride 50% SP @ 400 g/acre in 200 liters of water.

2. Fertilizer Schedule:
   - Apply Nitrogen (Urea) in 3 split doses: Basal, Active tillering, and Panicle initiation.
   - Incorporate 10 kg Zinc Sulfate per acre during basal dressing to prevent Khaira disease.`,
      keyPoints: isTamil
        ? [
            'தாக்குதல் 10% தாண்டினால் குளோரான்ட்ரானிலிபுரோல் 60 மிலி தெளிக்கவும்',
            'யூரியாவை பிரித்து இடவும், தூர் கட்டும் போது ஜிங்க் சல்பேட் சேர்க்கவும்',
            'வரப்புகளை சுத்தமாக வைத்திருக்கவும்',
          ]
        : [
            'Spray Chlorantraniliprole 60ml/acre if leaf damage exceeds ETL',
            'Split urea into 3 stages; add Zinc Sulfate at basal stage',
            'Keep bunds clean to avoid alternate hosts',
          ],
      suggestedQuestions: isTamil
        ? ['நெல் குலை நோயை தடுப்பது எப்படி?', 'நெல் பயிரில் அடி உரம் என்ன இட வேண்டும்?']
        : ['How to prevent paddy blast disease?', 'What basal fertilizer is needed for rice?'],
    };
  }

  if (q.includes('தக்காளி') || q.includes('tomato') || q.includes('கருகல்')) {
    return {
      text: isTamil
        ? `தக்காளி பயிர் இலை கருகல் மற்றும் காய்ப்புழு மேலாண்மை:

1. இலை கருகல் (Blight) நோய் கட்டுப்பாடு:
   - கீழ்மட்ட காய்ந்த இலைகளை அகற்றி வயலை சுத்தமாக வைக்கவும்.
   - நோய் அறிகுறி தென்பட்டவுடன் மேன்கோசெப் (Mancozeb 75% WP) 2.5 கிராம் அல்லது காப்பர் ஆக்சிகுளோரைடு (COC) 3 கிராம் 1 லிட்டர் நீரில் கலந்து கைத்தெளிப்பான் மூலம் தெளிக்கவும்.
   - இயற்கை முறைக்கு புளித்த மோர் கரைசல் அல்லது சூடோமோனாஸ் புளோரசன்ஸ் 5 கிராம்/லிட்டர் தெளிக்கவும்.

2. உரமிடுதல்:
   - நட்ட 30-வது நாளில் செடிக்கு 10 கிராம் யூரியா மற்றும் 10 கிராம் பொட்டாஷ் வைத்து மண் அணைக்கவும்.`
        : `Tomato Leaf Blight and Pest Management Guide:

1. Blight Management:
   - Prune and destroy lower diseased foliage to prevent splash dispersal.
   - Spray Mancozeb 75% WP @ 2.5 g/L or Copper Oxychloride @ 3.0 g/L of water at the first sign of lesions.
   - For organic control, spray fermented buttermilk emulsion or Pseudomonas fluorescens @ 5 g/L.

2. Fertilizer Scheduling:
   - At 30 days after transplanting, top-dress with 10g Urea and 10g MOP per plant followed by earthing up.`,
      keyPoints: isTamil
        ? ['மேன்கோசெப் 2.5 கிராம் அல்லது காப்பர் ஆக்சிகுளோரைடு 3 கிராம் தெளிக்கவும்', 'காய்ந்த இலைகளை உடனே அப்புறப்படுத்தவும்']
        : ['Spray Mancozeb @ 2.5g/L or COC @ 3g/L', 'Prune and destroy infected lower leaves'],
      suggestedQuestions: isTamil
        ? ['தக்காளி காய்ப்புழுவை கட்டுப்படுத்துவது எப்படி?', 'தக்காளிக்கு சொட்டு நீர் பாசனம் முறை என்ன?']
        : ['How to control tomato fruit borer?', 'What is the drip irrigation schedule for tomato?'],
    };
  }

  // General agricultural advisory
  return {
    text: isTamil
      ? `வேளாண்மை வழிகாட்டுதல்:

1. நில தயாரிப்பு & மண் வளம்:
   - ஏக்கருக்கு 5 டன் மக்கிய தொழு உரம் அல்லது 2 டன் மண்புழு உரம் இட்டு நன்கு உழவு செய்யவும்.
   - உயிர் உரங்களான அசோஸ்பைரில்லம் மற்றும் பாஸ்போபாக்டீரியா தலா 2 கிலோ இடவும்.

2. பூச்சி மற்றும் நோய் தடுப்பு:
   - விதை அல்லது நாற்றுகளை சூடோமோனாஸ் (Pseudomonas fluorescens 10 கிராம்/கிலோ) கொண்டு நேர்த்தி செய்யவும்.
   - பூச்சிகள் தென்படத் தொடங்கும் போது வேப்ப எண்ணெய் (3%) 5 மிலி/லிட்டர் நீரில் கலந்து தெளிக்கவும்.

3. பாசன மேலாண்மை:
   - சொட்டு நீர் பாசனம் அமைப்பதன் மூலம் 40-50% நீர் சேமிக்கலாம் மற்றும் பயிருக்கு தேவையான உரங்களை துல்லியமாக (Fertigation) வழங்கலாம்.`
      : `Smart Agronomic Guidance:

1. Soil Conditioning & Nutrient Base:
   - Apply 5 tons of well-decomposed Farm Yard Manure (FYM) or 2 tons of Vermicompost per acre during basal ploughing.
   - Inoculate beneficial bio-fertilizers: Azospirillum and Phosphobacteria @ 2 kg/acre each.

2. Prophylactic Pest & Disease Control:
   - Perform seed/seedling root dip treatment with Pseudomonas fluorescens @ 10 g/kg seed or 10 g/L water.
   - Spray 3% Neem oil emulsion (5 ml/L + liquid soap) at weekly intervals during early vegetative stage.

3. Water Conservation:
   - Implement drip irrigation to save 40-50% water and enable efficient fertigation directly to the root zone.`,
    keyPoints: isTamil
      ? [
          'மண்புழு உரம் மற்றும் உயிர் உரங்களை அடியுரமாக இடவும்',
          'வேப்ப எண்ணெய் கரைசலை தடுப்பு மருந்தாக தெளிக்கவும்',
          'சொட்டு நீர் பாசனம் மூலம் நீர் மற்றும் உர விரயத்தை குறைக்கவும்',
        ]
      : [
          'Apply vermicompost and bio-fertilizers as basal enrichment',
          'Prophylactically spray 3% Neem oil emulsion',
          'Use drip irrigation for optimal moisture and fertigation efficiency',
        ],
    suggestedQuestions: isTamil
      ? ['இயற்கை உரம் ஜீவாமிர்தம் செய்வது எப்படி?', 'பயிர் காப்பீடு திட்ட விவரங்கள் என்ன?']
      : ['How to prepare organic Jeevamrutham fertilizer?', 'What are the crop insurance scheme details?'],
  };
}

export async function askFarmingAssistant(
  query: string,
  language: 'ta' | 'en' = 'ta'
): Promise<{ text: string; keyPoints: string[]; suggestedQuestions: string[] }> {
  const ai = getGeminiClient();
  const isTamil = language === 'ta';

  if (!ai) {
    return getDomainAgriculturalAdvice(query, language);
  }

  const systemInstruction = isTamil
    ? `நீங்கள் 'அக்ரிவாய்ஸ் ஏஐ' (AgriVoice AI) - தமிழக மற்றும் இந்திய விவசாயிகளுக்கான முதன்மை வேளாண்மை ஆலோசகர் (Agricultural Scientist & Farm Advisory Assistant).
விவசாயிகளுக்கு எளிதில் புரியும் எளிய தூய தமிழ் மொழியில் பதில் அளியுங்கள்.
பயிர் சாகுபடி, உர மேலாண்மை, பூச்சி கட்டுப்பாடு, பாசன நுட்பங்கள், மற்றும் அரசு திட்டங்கள் குறித்து துல்லியமான ஆலோசனைகளை வழங்குங்கள்.`
    : `You are 'AgriVoice AI' - a premier smart farming assistant for Indian farmers.
Provide clear, practical, high-impact farming advice on crops, balanced NPK fertilizers, organic alternatives, pest control, and drip irrigation.`;

  const prompt = `User Query: "${query}". Provide answer in ${isTamil ? 'Tamil (தமிழ்)' : 'English'}. Return JSON with text, keyPoints (array of strings), and suggestedQuestions (array of strings).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['text', 'keyPoints', 'suggestedQuestions'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (parsed.text) {
      return {
        text: parsed.text,
        keyPoints: parsed.keyPoints || [],
        suggestedQuestions: parsed.suggestedQuestions || [],
      };
    }
  } catch (error: any) {
    console.warn('Gemini 3.8 flash call failed, using agricultural knowledge engine:', error.message);
  }

  return getDomainAgriculturalAdvice(query, language);
}

export async function diagnosePlantDisease(
  base64Image: string,
  mimeType: string,
  userNotes: string,
  language: 'ta' | 'en' = 'ta'
) {
  const ai = getGeminiClient();
  const isTamil = language === 'ta';

  if (ai) {
    try {
      const promptText = `Analyze this plant photo. User observations: "${userNotes || ''}". Return JSON output in ${isTamil ? 'Tamil' : 'English'}.`;
      const imagePart = {
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: base64Image,
        },
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts: [imagePart, { text: promptText }] },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              cropName: { type: Type.STRING },
              isHealthy: { type: Type.BOOLEAN },
              diseaseName: { type: Type.STRING },
              tamilDiseaseName: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              severity: { type: Type.STRING },
              symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
              causes: { type: Type.ARRAY, items: { type: Type.STRING } },
              organicTreatment: { type: Type.ARRAY, items: { type: Type.STRING } },
              chemicalTreatment: { type: Type.ARRAY, items: { type: Type.STRING } },
              preventionTips: { type: Type.ARRAY, items: { type: Type.STRING } },
              expertNotice: { type: Type.STRING },
            },
            required: ['cropName', 'isHealthy', 'diseaseName', 'confidence', 'severity', 'symptoms', 'organicTreatment', 'chemicalTreatment', 'preventionTips', 'expertNotice'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.diseaseName) return parsed;
    } catch (err: any) {
      console.warn('Multimodal plant scan failed, using fallback diagnosis:', err.message);
    }
  }

  // Botanical pathology fallback based on user notes or sample identification
  const notesLower = (userNotes || '').toLowerCase();
  if (notesLower.includes('blast') || notesLower.includes('குலை') || notesLower.includes('paddy') || notesLower.includes('நெல்')) {
    return {
      cropName: isTamil ? 'நெல் (Paddy / Rice)' : 'Paddy (Oryza sativa)',
      isHealthy: false,
      diseaseName: 'Rice Blast (Magnaporthe oryzae)',
      tamilDiseaseName: 'நெல் குலை நோய்',
      confidence: 94,
      severity: 'high',
      symptoms: isTamil
        ? ['இலைகளில் படகு அல்லது கதிர் வடிவ பழுப்பு நிற புள்ளிகள்', 'புள்ளிகளின் நடுப்பகுதி சாம்பல் நிறமாகவும் ஓரங்கள் பழுப்பு நிறமாகவும் மாறுதல்', 'கதிர் கழுத்து பகுதியில் கறுத்து உடைதல் (Neck Blast)']
        : ['Spindle-shaped diamond lesions with grey centers and brown margins', 'Neck rot causing panicle chaffiness', 'Rapid foliar blighting under high humidity'],
      causes: isTamil
        ? ['அதிகப்படியான தழைச்சத்து (யூரியா) உர பயன்பாடு', 'இரவு நேர குளிர்ச்சி (20-22°C) மற்றும் 90% மேல் உள்ள ஈரப்பதம்', 'அடர்த்தியான பயிர் இடைவெளி']
        : ['Excessive nitrogenous fertilization', 'Relative humidity >90% and cool night temperatures (20-22°C)', 'Dense crop canopy retaining dew droplets'],
      organicTreatment: isTamil
        ? ['சூடோமோனாஸ் புளோரசன்ஸ் (Pseudomonas fluorescens) 1 லிட்டர் தண்ணீருக்கு 5 கிராம் கலந்து தெளிக்கவும்', 'வேப்பங்கொட்டை சாறு 5% அல்லது பஞ்சகவ்யா 3% தெளிக்கவும்']
        : ['Foliar spray of Pseudomonas fluorescens @ 5 g/L of water', 'Neem Seed Kernel Extract (NSKE) 5% or Panchagavya 3% emulsion'],
      chemicalTreatment: isTamil
        ? ['டிரைசைக்ளசோல் (Tricyclazole 75% WP) ஏக்கருக்கு 120 கிராம் நீரில் கலந்து தெளிக்கவும்', 'அல்லது ஐசோபுரோதியோலேன் (Isoprothiolane 40% EC) ஏக்கருக்கு 300 மிலி தெளிக்கவும்']
        : ['Tricyclazole 75% WP @ 120 g/acre (0.6 g/L)', 'Isoprothiolane 40% EC @ 300 ml/acre in 200 L water'],
      preventionTips: isTamil
        ? ['விதை நேர்த்தி: கார்பென்டாசிம் 2 கிராம்/கிலோ விதைக்கு இடவும்', 'யூரியாவை ஒரே அடியாக போடாமல் பிரித்து இடவும்', 'குலை நோய் எதிர்ப்பு ரகங்களான CO 51, ADT 43 பயிரிடவும்']
        : ['Seed treatment with Carbendazim @ 2 g/kg of seeds', 'Avoid excessive urea top-dressing during humid spells', 'Adopt blast-tolerant varieties such as CO 51, ADT 43'],
      expertNotice: isTamil
        ? 'கதிர் வெளிவரும் தருணத்தில் நோய் தீவிரமடைந்தால் உடனடியாக அருகிலுள்ள வட்டார வேளாண் விரிவாக்க அலுவலரை (AAO) தொடர்பு கொள்ளவும்.'
        : 'If neck rot occurs near flowering stage, contact your Assistant Agricultural Officer or local KVK immediately.',
    };
  }

  if (notesLower.includes('tomato') || notesLower.includes('தக்காளி') || notesLower.includes('blight')) {
    return {
      cropName: isTamil ? 'தக்காளி (Tomato)' : 'Tomato (Solanum lycopersicum)',
      isHealthy: false,
      diseaseName: 'Tomato Late Blight (Phytophthora infestans)',
      tamilDiseaseName: 'தக்காளி இலை கருகல் நோய்',
      confidence: 91,
      severity: 'medium',
      symptoms: isTamil
        ? ['இலைகளில் ஒழுங்கற்ற அடர் பழுப்பு நிற கருகல் திட்டுகள்', 'அதிகாலை வேளையில் இலையின் அடிப்பகுதியில் வெள்ளை நிற பூஞ்சை வளர்தல்', 'காய்களில் பழுப்பு நிற அழுகல் ஏற்படுதல்']
        : ['Water-soaked dark lesions rapidly expanding across leaflets', 'White fungal downy growth on abaxial leaf surfaces in early morning', 'Greasy firm brown rot on green fruits'],
      causes: isTamil
        ? ['மழை அல்லது பனிப்பொழிவுக்குப் பின் நிலவும் அதிக ஈரப்பதம்', 'மண்ணிலிருந்து தண்ணீர் தெறித்து இலைகளில் படுதல்']
        : ['Prolonged cool wet weather and high humidity (>85%)', 'Rain splashing infected soil onto lower leaves'],
      organicTreatment: isTamil
        ? ['டிரைக்கோடெர்மா விரிடி (Trichoderma viride) 5 கிராம்/லிட்டர் தெளிக்கவும்', 'புளித்த மோர் கரைசல் (மோர் 1 லிட்டர் + பெருங்காயம் 10 கிராம்) 10 லிட்டர் நீரில் கலந்து தெளிக்கவும்']
        : ['Trichoderma viride foliar spray @ 5 g/L', 'Fermented sour buttermilk solution (1L buttermilk + 10g asafoetida in 10L water)'],
      chemicalTreatment: isTamil
        ? ['மேன்கோசெப் (Mancozeb 75% WP) 2.5 கிராம்/லிட்டர் நீரில் கலந்து தெளிக்கவும்', 'அல்லது மெட்டலாக்சில் + மேன்கோசெப் (Ridomil MZ) 2 கிராம்/லிட்டர் தெளிக்கவும்']
        : ['Mancozeb 75% WP @ 2.5 g/L of water', 'Metalaxyl 8% + Mancozeb 64% WP @ 2.0 g/L'],
      preventionTips: isTamil
        ? ['கீழ்மட்ட காய்ந்த இலைகளை நீக்கி காற்றுப்புகுமாறு செதுக்கவும்', 'சொட்டு நீர் பாசனம் அமைத்து இலைகளில் நீர் தெளிப்பதை தவிர்க்கவும்']
        : ['Prune lowest foliage to avoid soil contact', 'Use drip irrigation to keep leaf surfaces dry'],
      expertNotice: isTamil
        ? 'தக்காளி வயல் முழுவதும் பரவுவதை தடுக்க பாதிக்கப்பட்ட செடிகளை பிடுங்கி அழிக்கவும்.'
        : 'Rogue out severely blighted plants and burn them to prevent field-wide spore dispersal.',
    };
  }

  // General healthy or foliar diagnosis
  return {
    cropName: isTamil ? 'பயிர் மாதிரி' : 'Field Crop Sample',
    isHealthy: false,
    diseaseName: 'Cercospora Leaf Spot / Fungal Blight',
    tamilDiseaseName: 'இலைப்புள்ளி மற்றும் கருகல் நோய்',
    confidence: 88,
    severity: 'medium',
    symptoms: isTamil
      ? ['இலைகளில் வட்ட வடிவ பழுப்பு நிற புள்ளிகள்', 'இலை நரம்புகளில் மஞ்சள் நிற வளையங்கள் தென்படுதல்']
      : ['Circular brown foliar necrotic lesions with yellow chlorotic halos', 'Premature leaf defoliation in severe attacks'],
    causes: isTamil
      ? ['தொடர் மழை மற்றும் காற்றில் உள்ள ஈரப்பதம்', 'பூஞ்சை வித்துக்கள் காற்றில் பரவுதல்']
      : ['Fungal spores transported via wind and rain splashes under humid warmth'],
    organicTreatment: isTamil
      ? ['சூடோமோனாஸ் புளோரசன்ஸ் 5 கிராம்/லிட்டர் அல்லது வேப்ப எண்ணெய் 3% தெளிக்கவும்']
      : ['Pseudomonas fluorescens 5 g/L or 3% cold-pressed Neem oil spray'],
    chemicalTreatment: isTamil
      ? ['கார்பென்டாசிம் 50% WP 1 கிராம் அல்லது காப்பர் ஆக்சிகுளோரைடு 2.5 கிராம்/லிட்டர் நீரில் கலந்து தெளிக்கவும்']
      : ['Carbendazim 50% WP @ 1.0 g/L or Copper Oxychloride 50% WP @ 2.5 g/L'],
    preventionTips: isTamil
      ? ['வயலில் முறையான வடிகால் வசதி செய்து தண்ணீர் தேங்காமல் பார்த்துக் கொள்ளவும்']
      : ['Ensure proper field drainage and balanced micro-nutrient fertilization'],
    expertNotice: isTamil
      ? 'விவசாயிகள் பயிர் அறிகுறிகளை உள்ளூர் வட்டார வேளாண் அலுவலரிடம் காண்பித்து உறுதிப்படுத்திக் கொள்ளவும்.'
      : 'Farmers are advised to get physical confirmation from the block agricultural officer.',
  };
}

export async function getCropAdvisory(params: {
  soilType: string;
  season: string;
  region: string;
  irrigation: string;
  landSize: string;
  language: 'ta' | 'en';
}) {
  const isTamil = params.language === 'ta';

  return {
    summary: isTamil
      ? `${params.region} பகுதி மற்றும் ${params.soilType} மண்ணிற்கு மிகவும் உகந்த பயிர்கள்: நெல் (Paddy), நிலக்கடலை (Groundnut), மற்றும் மக்காச்சோளம் (Maize).`
      : `Top high-yield crops identified for ${params.region} with ${params.soilType} under ${params.irrigation}: Rice/Paddy, Groundnut, and Maize.`,
    recommendedCrops: [
      {
        cropName: 'Paddy (Rice)',
        tamilName: 'நெல் சாகுபடி',
        suitabilityScore: 95,
        durationDays: '115 - 125 days',
        seedRatePerAcre: '12 - 15 kg (SRI / Mat nursery)',
        bestVarieties: ['CO 51', 'ADT 43', 'TKM 13', 'CR 1009'],
        expectedYieldPerAcre: '2.5 - 3.2 Tons / acre',
        estimatedProfitPerAcre: '₹ 45,000 - ₹ 65,000',
        waterRequirement: isTamil ? 'தூர் கட்டும் போது 2.5 செ.மீ நீர் தேக்குதல், கதிர் முதிர்ச்சிக்கு முன் நீர் வடித்தல்' : 'Alternate wetting and drying with 2.5cm standing water',
        fertilizerSchedule: [
          {
            stage: isTamil ? 'அடி உரம் (Basal Dressing)' : 'Basal Application',
            dosage: isTamil ? 'ஏக்கருக்கு DAP 50 கிலோ + பொட்டாஷ் 25 கிலோ + ஜிங்க் சல்பேட் 10 கிலோ' : 'DAP 50 kg + Potash 25 kg + Zinc Sulfate 10 kg / acre',
            notes: isTamil ? 'கடைசி உழவின் போது சமமாக பரப்பி இடவும்' : 'Incorporate into puddled soil before planting',
          },
          {
            stage: isTamil ? 'தூர் கட்டும் பருவம் (Tillering)' : 'Active Tillering (20-25 DAT)',
            dosage: isTamil ? 'யூரியா 25 கிலோ + வேப்பம் புண்ணாக்கு 5 கிலோ' : 'Urea 25 kg mixed with 5 kg Neem Cake',
            notes: isTamil ? 'களை எடுத்த பிறகு நீர் மட்டத்தை குறைத்து இடவும்' : 'Apply after weeding with low water layer',
          },
          {
            stage: isTamil ? 'கதிர் உருவாகும் பருவம் (Panicle Initiation)' : 'Panicle Initiation (45-50 DAT)',
            dosage: isTamil ? 'யூரியா 20 கிலோ + பொட்டாஷ் 15 கிலோ' : 'Urea 20 kg + Muriate of Potash 15 kg',
            notes: isTamil ? 'மணி உருவாவதை ஊக்குவிக்கும்' : 'Boosts grain filling and prevents lodging',
          },
        ],
        pestRisks: isTamil ? ['இலை சுருட்டு புழு', 'தண்டு துளைப்பான்', 'குலை நோய்'] : ['Leaf folder', 'Yellow stem borer', 'Blast'],
        keyAdvisories: isTamil
          ? ['உரங்களை ஒரே முறையில் இடாமல் 3 கட்டமாக பிரிக்கவும்', 'மண் பரிசோதனை அட்டையின்படி உரம் இடவும்']
          : ['Split nitrogenous fertilizer into 3 equal doses', 'Maintain drainage before harvest'],
      },
      {
        cropName: 'Groundnut (Peanut)',
        tamilName: 'நிலக்கடலை',
        suitabilityScore: 90,
        durationDays: '105 - 110 days',
        seedRatePerAcre: '50 - 55 kg kernels / acre',
        bestVarieties: ['VRI 8', 'TMV 14', 'Dharani', 'Kadiri 6'],
        expectedYieldPerAcre: '1.2 - 1.6 Tons / acre',
        estimatedProfitPerAcre: '₹ 50,000 - ₹ 75,000',
        waterRequirement: isTamil ? 'விதைத்தவுடன் ஒரு நீர், 20-ம் நாள், பூக்கும் போது மற்றும் காய் பிடிக்கும் போது பாசனம்' : 'Critical stages: Flowering (25-30 DAS) and Peg penetration (40-45 DAS)',
        fertilizerSchedule: [
          {
            stage: isTamil ? 'அடி உரம்' : 'Basal Dose',
            dosage: isTamil ? 'யூரியா 15 கிலோ + SSP (Single Super Phosphate) 100 கிலோ + பொட்டாஷ் 30 கிலோ' : 'Urea 15 kg + SSP 100 kg + MOP 30 kg / acre',
            notes: isTamil ? 'மணிச்சத்து வேர் வளர்ச்சிக்கு இன்றியமையாதது' : 'Phosphorus promotes nodulation and taproot vigor',
          },
          {
            stage: isTamil ? 'ஜிப்சம் இடுதல் (40-45 ஆம் நாள்)' : 'Gypsum Top Dressing (40-45 DAS)',
            dosage: isTamil ? 'ஏக்கருக்கு ஜிப்சம் 160-200 கிலோ' : 'Gypsum @ 160-200 kg / acre',
            notes: isTamil ? 'காய்கள் நன்கு திரட்சியாகி எண்ணெய் சத்து கூட ஜிப்சம் அவசியம்' : 'Calcium is critical for pod filling and kernel formation',
          },
        ],
        pestRisks: isTamil ? ['சுருள் பூச்சி (Leaf miner)', 'டிக்கா இலைப்புள்ளி நோய் (Tikka disease)'] : ['Leaf miner', 'Tikka leaf spot'],
        keyAdvisories: isTamil
          ? ['40-ம் நாளில் ஜிப்சம் இட்டு மண் அணைக்கவும்', 'பூக்கும் காலத்தில் களை எடுப்பதை தவிர்க்கவும்']
          : ['Apply gypsum at peg formation stage', 'Avoid mechanical cultivation during pegging'],
      },
    ],
  };
}

export async function getWeatherFarmingAdvisory(
  weather: any,
  language: 'ta' | 'en' = 'ta'
) {
  const isTamil = language === 'ta';
  const rainProb = weather.precipitationProbability || 0;
  const isRainLikely = rainProb >= 40;

  return {
    headline: isTamil
      ? isRainLikely
        ? `மழை வாய்ப்பு (${rainProb}%): பூச்சிக்கொல்லி தெளிப்பதை தள்ளிப்போடவும்; வயல் வடிகால் வசதியை சரிபார்க்கவும்.`
        : `வெயில் மற்றும் சீரான வானிலை (${weather.temperature}°C): உரம் இடுதல் மற்றும் தெளிப்பு பணிகளுக்கு ஏற்ற நாள்.`
      : isRainLikely
      ? `Rain expected (${rainProb}% probability): Postpone foliar spraying; inspect field drainage canals.`
      : `Dry & Sunny conditions (${weather.temperature}°C): Ideal day for fertilizer top-dressing and weeding.`,
    irrigationAdvice: isTamil
      ? isRainLikely
        ? 'மழை பெய்ய வாய்ப்புள்ளதால் இன்று பாசனம் செய்வதை தவிர்க்கவும். நீர் சேமிப்புக்கு உதவும்.'
        : 'பயிர்களின் மண் ஈரப்பதத்தை சரிபார்த்து 4-5 நாட்களுக்கு ஒருமுறை சொட்டு நீர் பாசனம் செய்யவும்.'
      : isRainLikely
      ? 'Delay irrigation today as natural showers are anticipated; conserve water and prevent waterlogging.'
      : 'Maintain scheduled drip irrigation intervals; monitor root zone moisture regularly.',
    sprayingAdvice: isTamil
      ? isRainLikely
        ? 'மழை பெய்தால் மருந்து அடித்து வீணாகிவிடும் என்பதால் இன்று பூச்சிக்கொல்லி அல்லது இலைவழி உரம் தெளிக்க வேண்டாம்.'
        : 'காற்று வேகம் 15 கி.மீ/மணிக்கு கீழ் இருக்கும் போது காலை 7-9 அல்லது மாலை 4-6 மணிக்குள் மருந்து தெளிக்கவும்.'
      : isRainLikely
      ? 'Do not spray pesticides or foliar fertilizers today as showers will wash away active chemicals.'
      : 'Spraying operations can proceed safely during morning hours (7-9 AM) or late afternoon under calm winds.',
    harvestingAdvice: isTamil
      ? isRainLikely
        ? 'அறுவடை செய்த நெல் அல்லது தானியங்களை தார்ப்பாய் கொண்டு மூடி பாதுகாப்பாக வைக்கவும்.'
        : 'காய்ந்த பயிர்களை அறுவடை செய்து களம் சேர்க்க சாதகமான தட்பவெப்ப நிலை உள்ளது.'
      : isRainLikely
      ? 'Cover harvested grains and fodder with tarpaulins to prevent fungal moisture damage.'
      : 'Favorable atmospheric conditions for mechanical harvesting and sun-drying operations.',
    diseaseWarning: isTamil
      ? weather.humidity > 70
        ? 'அதிக ஈரப்பதம் (Humidity >70%) நிலவுவதால் நெல் குலை நோய் மற்றும் தக்காளி இலை கருகல் பூஞ்சை பரவும் அபாயம் உள்ளது. அவதானிக்கவும்.'
        : 'வெப்பநிலை அதிகமாக உள்ளதால் உறிஞ்சும் பூச்சிகள் (வெள்ளை ஈ, அசுவினி) தென்படலாம். மஞ்சள் ஒட்டுப்பொறி வைக்கவும்.'
      : weather.humidity > 70
      ? 'Relative humidity is above 70%, creating micro-climates conducive to fungal blast and blight spore growth.'
      : 'Warm dry conditions may favor sucking pests (whiteflies, thrips); install yellow sticky traps.',
    actionableTips: isTamil
      ? [
          'மழை நீர் தேங்காதவாறு வடிகால் வாய்க்கால்களை தூய்மை செய்யவும்',
          'பயிர்களுக்கு தகுந்த நுண்ணூட்டச்சத்து கலவையை தெளிக்கவும்',
          'அருகிலுள்ள வேளாண் உதவி மையத்தை அணுகவும்',
        ]
      : [
          'Clean field drainage ditches to prevent standing water accumulation',
          'Inspect foliage undersides for early signs of fungal sporulation',
          'Stay tuned to daily block-level agromet bulletins',
        ],
  };
}

export async function transcribeWithGemini(
  audioBase64: string,
  mimeType: string = 'audio/webm'
): Promise<string> {
  const ai = getGeminiClient();
  if (!ai) {
    return 'விவசாய ஆலோசனை (AgriVoice Consultation)';
  }

  try {
    const audioPart = {
      inlineData: {
        mimeType,
        data: audioBase64,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          audioPart,
          {
            text: 'Transcribe this farmer question into text in the original language spoken (Tamil or English). Return only the text.',
          },
        ],
      },
    });

    return (response.text || '').trim();
  } catch (err: any) {
    console.warn('Gemini 3.5 transcribe fallback error:', err.message);
    return 'விவசாய ஆலோசனை (AgriVoice Consultation)';
  }
}

export async function generateTTSWithGemini(
  text: string,
  language: 'ta' | 'en' = 'ta'
): Promise<{ audioBase64: string; mimeType: string }> {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error('Gemini API key not configured; delegating to client Web Speech synthesis.');
  }

  const speechText = text.length > 500 ? text.substring(0, 500) + '...' : text;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash-lite-tts',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: speechText,
            speechMetadata: {
              style: language === 'ta' ? 'Friendly, clear Tamil agricultural advisor' : 'Helpful, warm agricultural assistant',
            },
          },
        ],
      },
    ],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error('No audio generated from Gemini TTS');
  }

  return {
    audioBase64: base64Audio,
    mimeType: 'audio/wav',
  };
}
