import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);



const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY && process.env.GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY' ? process.env.GOOGLE_MAPS_API_KEY : undefined;
const geminiApiKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY' ? process.env.GEMINI_API_KEY : undefined;
const genAI = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

app.use(cors({ origin: frontendOrigin }));
app.use(express.json());

type ChatRole = 'user' | 'bot';

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type PlaceReview = {
  author: string;
  rating: number;
  relativeTime: string;
  text: string;
};

type HospitalResult = {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  distance: number;
  status: 'open' | 'closed';
  address: string;
  lat: number;
  lng: number;
  emergency: boolean;
  phone: string;
  type: string;
  googleMapsUri?: string;
  websiteUri?: string;
  reviewSnippets?: PlaceReview[];
};

const fallbackHospitals: HospitalResult[] = [
  {
    id: 'h1',
    name: 'AIIMS Delhi',
    rating: 4.6,
    reviews: 1500,
    distance: 0.5,
    status: 'open',
    address: 'Ansari Nagar, New Delhi, Delhi 110029',
    lat: 28.5672,
    lng: 77.0949,
    emergency: true,
    phone: '+91 11 2659 0000',
    type: 'Hospital',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=28.5672,77.0949',
  },
  {
    id: 'h2',
    name: "Safdarjung Hospital",
    rating: 4.3,
    reviews: 800,
    distance: 2.1,
    status: 'open',
    address: 'Safdarjung Airport Rd, New Delhi, Delhi 110029',
    lat: 28.5602,
    lng: 77.1171,
    emergency: true,
    phone: '+91 11 2245 5555',
    type: 'Medical Center',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=28.5602,77.1171',
  },
  {
    id: 'h3',
    name: "Delhi Government Hospital",
    rating: 4.1,
    reviews: 620,
    distance: 3.0,
    status: 'open',
    address: 'Pusa Road, New Delhi, Delhi 110005',
    lat: 28.5775,
    lng: 77.1511,
    emergency: false,
    phone: '+91 11 2671 9999',
    type: 'Clinic',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=28.5775,77.1511',
  },
];

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function calculateDistanceMiles(lat1: number, lng1: number, lat2: number, lng2: number) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = earthRadiusKm * c;
  return distanceKm * 0.621371;
}

function containsAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function buildBulletedReply(title: string, bullets: string[], closing?: string) {
  return [title, ...bullets.map((bullet) => `- ${bullet}`), closing].filter(Boolean).join('\n');
}

function fallbackChatReply(message: string) {
  const text = message.toLowerCase();

  // 1. Emergency
  const urgentTerms = [
    'chest pain', 'trouble breathing', 'cannot breathe', "can't breathe",
    'stroke', 'seizure', 'fainting', 'passed out', 'heavy bleeding',
    'suicidal', 'self harm', 'accident', 'emergency', 'heart attack'
  ];
  if (containsAny(text, urgentTerms)) {
    return buildBulletedReply(
      '🚨 CRITICAL: This sounds like a medical emergency.',
      [
        'Please call your local emergency services (like 911/112/999) or visit the nearest Emergency Room (ER) immediately.',
        'Do not wait or attempt to treat severe symptoms like chest pain, breathing difficulties, sudden numbness, or heavy bleeding at home.',
        'If possible, notify someone nearby who can assist or drive you to a hospital.',
      ],
      'Disclaimer: I am an AI assistant, not a doctor. Seek professional emergency care immediately.'
    );
  }

  // 2. Water / Hydration
  if (containsAny(text, ['water', 'hydrate', 'hydration', 'dehydration', 'drink'])) {
    return buildBulletedReply(
      '💧 Hydration Guidance:',
      [
        'Daily intake: A general goal is 8-10 glasses (about 2 to 2.5 liters) of water daily, though requirements vary based on weight, activity, and climate.',
        'Dehydration signs: Watch for dark urine, dry mouth, headache, fatigue, or dizziness.',
        'Tips: Keep a water bottle nearby, set regular reminders in the CareFlow app, and drink extra fluids during and after exercise.',
        'Other fluids: Herbal teas and water-rich foods (fruits/veggies) also count toward your daily hydration goal.'
      ],
      'Disclaimer: I am an AI assistant and not a doctor. If you have chronic kidney or heart conditions, follow your doctor\'s fluid guidelines.'
    );
  }

  // 3. BMI / Body Mass Index
  if (containsAny(text, ['bmi', 'body mass index', 'obese', 'overweight', 'underweight'])) {
    return buildBulletedReply(
      '📊 Understanding BMI (Body Mass Index):',
      [
        'BMI is a screening tool that estimates body fat based on height and weight. Formula: Weight (kg) / [Height (m)]².',
        'Categories: Underweight (< 18.5), Normal weight (18.5 - 24.9), Overweight (25 - 29.9), and Obese (≥ 30.0).',
        'Limitations: BMI does not directly measure body fat percentage and doesn\'t distinguish between muscle mass and fat (e.g., in athletes).',
        'Next steps: You can use the BMI Calculator tab in the sidebar to check your score, and consult a doctor or nutritionist for a complete assessment.'
      ],
      'Disclaimer: I am an AI assistant and not a doctor.'
    );
  }

  // 4. Calories / Weight loss / Gain / Nutrition
  if (containsAny(text, ['calorie', 'diet', 'weight', 'nutrition', 'protein', 'carb', 'fat', 'food', 'eat', 'meal', 'lose weight', 'gain weight', 'muscle'])) {
    return buildBulletedReply(
      '🥗 Nutrition & Calorie Tracking:',
      [
        'Caloric Balance: To lose weight, aim for a moderate calorie deficit (eating less than you burn). To gain weight or muscle, aim for a surplus.',
        'Macronutrients: Balanced diets include proteins (muscle repair/satiety), complex carbohydrates (sustained energy), and healthy fats (hormone production).',
        'Protein: Essential for muscle building; good sources include lean meats, fish, eggs, dairy, tofu, lentils, and beans.',
        'Consistency: Focus on whole, nutrient-dense foods (vegetables, fruits, whole grains) rather than restrictive fad diets.',
        'Log your meals in the Nutrition tab of the CareFlow app to track your daily progress.'
      ],
      'Disclaimer: I am an AI assistant and not a doctor. Consult a registered dietitian before making drastic dietary changes.'
    );
  }

  // 5. Medicines / Reminders
  if (containsAny(text, ['medicine', 'pill', 'prescription', 'dose', 'reminder', 'reminders', 'medication'])) {
    return buildBulletedReply(
      '💊 Medicine Safety & Adherence:',
      [
        'Consistency: Take medications at the exact times prescribed. Set up daily reminders in the Medicines tab of CareFlow.',
        'Missed dose: Never double a dose to make up for a missed one unless explicitly instructed by your physician.',
        'Storage: Store medicines in a cool, dry place away from direct sunlight, and keep them out of reach of children.',
        'Tata 1mg Integration: You can order prescriptions directly via the Tata 1mg link on your CareFlow dashboard.'
      ],
      'Disclaimer: I am an AI assistant and not a doctor. Always consult your prescribing doctor or pharmacist regarding specific drug interactions.'
    );
  }

  // 6. Sleep & Recovery
  if (containsAny(text, ['sleep', 'insomnia', 'tired', 'rest', 'recovery', 'fatigue', 'night'])) {
    return buildBulletedReply(
      '😴 Sleep & Recovery Tips:',
      [
        'Duration: Adults should aim for 7 to 9 hours of quality sleep per night for optimal cognitive and physical recovery.',
        'Sleep Hygiene: Maintain a consistent sleep schedule, make your room dark and cool, and avoid screens/blue light 1 hour before bed.',
        'Rest Days: If you exercise regularly, incorporate rest days so your muscles can repair and prevent burnout or injury.',
        'Caffeine/Alcohol: Limit caffeine intake in the afternoon and avoid heavy meals or alcohol close to bedtime.'
      ],
      'Disclaimer: I am an AI assistant and not a doctor. Chronic sleep issues should be evaluated by a healthcare professional.'
    );
  }

  // 7. Exercise / Fitness / Gym
  if (containsAny(text, ['exercise', 'workout', 'fitness', 'gym', 'cardio', 'strength', 'training', 'active'])) {
    return buildBulletedReply(
      '🏋️ Exercise & Fitness Guidance:',
      [
        'Weekly Goal: Aim for at least 150 minutes of moderate-intensity aerobic exercise (like brisk walking) or 75 minutes of vigorous activity weekly.',
        'Strength Training: Include muscle-strengthening workouts at least 2 days a week to support bone density and metabolism.',
        'Warm-Up/Cool-Down: Always spend 5-10 minutes warming up before exercises and cooling down afterward to prevent muscle strains.',
        'Listen to your body: Rest when sore, stay hydrated, and scale workouts gradually.'
      ],
      'Disclaimer: I am an AI assistant and not a doctor. Get medical clearance before starting a new intense exercise regimen.'
    );
  }

  // 8. Symptoms (Cold, Fever, Headache, Stomach)
  if (containsAny(text, ['cold', 'mild fever', 'sore throat', 'mild cough', 'headache', 'indigestion', 'acidity', 'constipation', 'stomach', 'pain'])) {
    return buildBulletedReply(
      '🤒 Mild Symptom Care:',
      [
        'Rest & Hydration: Prioritize resting and drinking warm fluids (water, herbal tea, clear broths) to support recovery.',
        'Fever/Headache: A mild fever is the body\'s natural defense against infection. Stay cool, dress lightly, and rest.',
        'Digestive discomfort: For mild indigestion or acidity, eat small, bland meals (rice, bananas, toast) and avoid spicy, greasy foods.',
        'When to seek care: If symptoms persist for more than a few days, worsen, or are accompanied by shortness of breath or high fever, visit a hospital or clinic.'
      ],
      'Disclaimer: I am an AI assistant and not a doctor. Do not self-prescribe medication without professional advice.'
    );
  }

  // Default Guidance
  return buildBulletedReply(
    '👋 Hello! I am your CareFlow Health Assistant.',
    [
      'I can answer health questions about hydration, nutrition/calories, exercise/fitness, BMI, sleep/recovery, medicine reminders, and mild symptoms.',
      'To get started, try asking: "How much water should I drink?", "What is a healthy BMI?", "Tips for muscle building", or "How to sleep better".',
      'If you have serious or worsening symptoms, please check our "Nearby Hospitals" tab to find closest emergency care immediately.'
    ],
    'Disclaimer: I am an AI assistant, not a doctor. I cannot diagnose conditions or prescribe treatments.'
  );
}

async function searchTextPlaces(query: string, userLocation?: { lat: number; lng: number }) {
  if (!googleMapsApiKey) {
    return [];
  }

  const body: Record<string, unknown> = {
    textQuery: query,
    rankPreference: 'RELEVANCE',
    maxResultCount: 10,
  };

  if (userLocation) {
    body.locationBias = {
      circle: {
        center: {
          latitude: userLocation.lat,
          longitude: userLocation.lng,
        },
        radius: 15000,
      },
    };
  }

  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': googleMapsApiKey,
      'X-Goog-FieldMask': [
        'places.id',
        'places.name',
        'places.displayName',
        'places.location',
        'places.formattedAddress',
        'places.rating',
        'places.userRatingCount',
        'places.googleMapsUri',
        'places.websiteUri',
        'places.nationalPhoneNumber',
        'places.primaryType',
        'places.regularOpeningHours.openNow',
      ].join(','),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const payload = await response.json() as { places?: Array<Record<string, any>> };
  return payload.places || [];
}

// Nearby Search (New) — ranks by DISTANCE so the closest places come first
async function searchNearbyPlaces(userLocation: { lat: number; lng: number }) {
  if (!googleMapsApiKey) {
    return [];
  }

  const body = {
    includedTypes: ['hospital'],
    rankPreference: 'DISTANCE',
    maxResultCount: 20,
    locationRestriction: {
      circle: {
        center: {
          latitude: userLocation.lat,
          longitude: userLocation.lng,
        },
        radius: 10000,
      },
    },
  };

  const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': googleMapsApiKey,
      'X-Goog-FieldMask': [
        'places.id',
        'places.name',
        'places.displayName',
        'places.location',
        'places.formattedAddress',
        'places.rating',
        'places.userRatingCount',
        'places.googleMapsUri',
        'places.websiteUri',
        'places.nationalPhoneNumber',
        'places.primaryType',
        'places.regularOpeningHours.openNow',
      ].join(','),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const payload = await response.json() as { places?: Array<Record<string, any>> };
  return payload.places || [];
}

async function enhanceHospitalSearchQuery(query: string, userLocation?: { lat: number; lng: number }) {
  if (!genAI) {
    return query;
  }

  try {
    const locationHint = userLocation ? `User coordinates: ${userLocation.lat}, ${userLocation.lng}.` : 'User coordinates unavailable.';
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: [
                'Rewrite this hospital search query for Google Maps / Google Places.',
                'Keep it short and search-friendly.',
                'Prefer hospital or clinic wording, preserve city or specialty names if present, and do not add explanation.',
                locationHint,
                `Original query: ${query}`,
              ].join(' '),
            },
          ],
        },
      ],
    });

    const refined = response.text?.trim();
    return refined || query;
  } catch {
    return query;
  }
}

async function fetchPlaceDetails(resourceName: string) {
  if (!googleMapsApiKey) {
    return null;
  }

  const response = await fetch(`https://places.googleapis.com/v1/${resourceName}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': googleMapsApiKey,
      'X-Goog-FieldMask': [
        'displayName',
        'location',
        'formattedAddress',
        'rating',
        'userRatingCount',
        'googleMapsUri',
        'websiteUri',
        'nationalPhoneNumber',
        'reviews',
        'primaryType',
        'regularOpeningHours.openNow',
      ].join(','),
    },
  });

  if (!response.ok) {
    return null;
  }

  return response.json() as Promise<Record<string, any>>;
}

function normalizeHospitalType(rawType?: string) {
  if (!rawType) {
    return 'Hospital';
  }

  if (rawType.includes('clinic')) {
    return 'Clinic';
  }

  if (rawType.includes('doctor')) {
    return 'Doctor';
  }

  if (rawType.includes('emergency')) {
    return 'Emergency';
  }

  if (rawType.includes('medical')) {
    return 'Medical Center';
  }

  return 'Hospital';
}

function mapPlaceToHospital(place: Record<string, any>, userLocation?: { lat: number; lng: number }): HospitalResult | null {
  const lat = place.location?.latitude;
  const lng = place.location?.longitude;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    id: place.id || place.name || `${lat}-${lng}`,
    name: place.displayName?.text || 'Hospital',
    rating: Number(place.rating || 0),
    reviews: Number(place.userRatingCount || 0),
    distance: userLocation ? calculateDistanceMiles(userLocation.lat, userLocation.lng, lat, lng) : 0,
    status: place.regularOpeningHours?.openNow ? 'open' : 'closed',
    address: place.formattedAddress || '',
    lat,
    lng,
    emergency: normalizeHospitalType(place.primaryType).toLowerCase().includes('hospital'),
    phone: place.nationalPhoneNumber || '',
    type: normalizeHospitalType(place.primaryType),
    googleMapsUri: place.googleMapsUri || '',
    websiteUri: place.websiteUri || '',
    reviewSnippets: Array.isArray(place.reviews)
      ? place.reviews.slice(0, 2).map((review: Record<string, any>) => ({
          author: review.authorAttribution?.displayName || 'Google user',
          rating: Number(review.rating || 0),
          relativeTime: review.relativePublishTimeDescription || '',
          text: review.text?.text || '',
        }))
      : [],
  };
}

async function getNearbyHospitals(userLocation: { lat: number; lng: number }) {
  if (!googleMapsApiKey) {
    return fallbackHospitals
      .map((hospital) => ({
        ...hospital,
        distance: calculateDistanceMiles(userLocation.lat, userLocation.lng, hospital.lat, hospital.lng),
      }))
      .sort((a, b) => a.distance - b.distance);
  }

  // Use the Nearby Search API ranked by DISTANCE for truly closest results
  const nearbyPlaces = await searchNearbyPlaces(userLocation);

  const mapped = nearbyPlaces
    .map((place) => mapPlaceToHospital(place, userLocation))
    .filter((item): item is HospitalResult => {
      if (!item) return false;
      const nameLower = item.name.toLowerCase();
      // Exclude clinics explicitly
      if (item.type === 'Clinic' || nameLower.includes('clinic')) {
        return false;
      }
      // Exclude low-rated hospitals (below 3.8 stars)
      if (item.rating > 0 && item.rating < 3.8) {
        return false;
      }
      return true;
    });

  // Sort strictly by distance — closest first
  mapped.sort((a, b) => a.distance - b.distance);

  return mapped;
}

async function searchHospitals(query: string, userLocation?: { lat: number; lng: number }) {
  if (!googleMapsApiKey) {
    return fallbackHospitals.filter((hospital) => hospital.name.toLowerCase().includes(query.toLowerCase()));
  }

  const refinedQuery = await enhanceHospitalSearchQuery(query, userLocation);
  const places = await searchTextPlaces(refinedQuery, userLocation);
  const enriched = await Promise.all(
    places.map(async (place) => {
      const details = await fetchPlaceDetails(place.name);
      return mapPlaceToHospital(details || place, userLocation);
    })
  );

  return enriched.filter((item): item is HospitalResult => Boolean(item));
}

async function resolveBookingAction(message: string) {
  if (!/\b(book|booking|appointment|schedule)\b/i.test(message)) {
    return null;
  }

  const sanitized = message
    .replace(/\b(book|booking|appointment|appointments|schedule|visit|site|website|official|with|for|at|please|me)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!sanitized) {
    return null;
  }

  const matches = await searchHospitals(sanitized);
  const selected = matches[0];

  if (!selected) {
    return null;
  }

  return {
    label: `Open ${selected.name} official site`,
    url: selected.websiteUri || selected.googleMapsUri || '',
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, status: 'CareFlow backend running' });
});

app.get('/api/hospitals/nearby', async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ error: 'Valid lat and lng query parameters are required.' });
  }

  try {
    const hospitals = await getNearbyHospitals({ lat, lng });
    return res.json({ hospitals: hospitals.slice(0, 5) });
  } catch (error) {
    return res.status(500).json({
      error: 'Unable to load nearby hospitals and clinics right now.',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/hospitals/search', async (req, res) => {
  const query = String(req.query.q || '').trim();
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (!query) {
    return res.status(400).json({ error: 'Search query is required.' });
  }

  try {
    const userLocation = Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : undefined;
    const hospitals = await searchHospitals(query, userLocation);
    return res.json({ hospitals });
  } catch (error) {
    return res.status(500).json({
      error: 'Unable to search hospitals right now.',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/chat', async (req, res) => {
  const { message, history = [] } = req.body as { message?: string; history?: ChatMessage[] };
  if (!message?.trim()) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
    const bookingAction = await resolveBookingAction(message);
    let reply = fallbackChatReply(message);

    if (genAI) {
      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          ...history.slice(-8).map((entry) => ({
            role: entry.role === 'bot' ? 'model' : 'user',
            parts: [{ text: entry.content }],
          })),
          { role: 'user', parts: [{ text: message.trim() }] },
        ],
        config: {
          systemInstruction: [
            'You are CareFlow AI, an advanced and knowledgeable health assistant inside a health tracking app called CareFlow.',
            'You MUST answer ALL health-related questions comprehensively, including but not limited to:',
            '- Symptoms & Conditions: headaches, fever, cold, cough, body pain, stomach issues, skin problems, allergies, infections, injuries',
            '- Nutrition & Diet: calories, protein, carbs, fats, vitamins, minerals, meal planning, weight loss, weight gain, muscle building',
            '- Fitness & Exercise: workout routines, cardio, strength training, stretching, yoga, recovery, warm-up, cool-down',
            '- Hydration: daily water intake, dehydration signs, electrolytes',
            '- Sleep & Recovery: insomnia, sleep hygiene, rest days, fatigue, energy levels',
            '- Mental Health: stress management, anxiety tips, meditation, mindfulness, relaxation techniques',
            '- BMI & Body Metrics: BMI categories, healthy weight ranges, body fat',
            '- Medicine & Supplements: general medication safety, supplement info, dosage timing, missed doses',
            '- Prevention & Wellness: hygiene, vaccination awareness, preventive health checkups, lifestyle tips',
            'For mild, non-serious problems, provide actionable home treatment and supportive care ideas using cautious, empathetic language.',
            'If symptoms seem serious, worsening, or dangerous, clearly and urgently tell the user to visit a nearby hospital or call emergency services immediately.',
            'Never diagnose with certainty, prescribe specific medication dosages, or claim to replace a real doctor.',
            'If the user asks to book an appointment at a particular hospital, say you are opening the official hospital site so they can continue there.',
            'Format responses with clear headings, short paragraphs, or bullet points for readability.',
            'Always include a brief disclaimer that you are an AI assistant and not a licensed medical professional.',
          ].join(' '),
        },
      });

      reply = response.text || reply;
    }

    return res.json({
      reply: bookingAction?.url
        ? `${reply}\n\nOpening the official hospital site so you can continue with appointment booking there.`
        : reply,
      action: bookingAction?.url
        ? {
            type: 'open_url',
            ...bookingAction,
          }
        : null,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'The AI assistant is unavailable right now.',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.listen(port, () => {
  console.log(`CareFlow backend running on http://localhost:${port}`);
});
