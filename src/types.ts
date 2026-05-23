export interface UserProfile {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number; // in cm
  weight: number; // in kg
  goal: 'weight-loss' | 'muscle-gain' | 'maintenance';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
}

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  serving: string;
  baseQuantity: number;
  unit: 'g' | 'ml' | 'piece';
  category: string;
  isPackaged?: boolean;
  notes?: string;
}

export interface MealLog {
  id: string;
  foodId: string;
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  quantity: number;
  unit: 'g' | 'ml' | 'piece';
  timestamp: number;
  mealType?: string;
  tMinusTime?: string;
}

export interface Recipe {
  id: string;
  name: string;
  prepTime: string;
  calories: number;
  protein: number;
  description: string;
  ingredients: string[];
  steps: string[];
}

export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  time: string;
  days: string[];
  taken: boolean;
  category?: 'prescribed' | 'supplement' | 'suggestion';
  mealTiming?: string;
}

export interface WaterLog {
  amount: number; // in ml
  timestamp: number;
}

export interface Hospital {
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
  type?: string;
  googleMapsUri?: string;
  websiteUri?: string;
  reviewSnippets?: HospitalReview[];
}

export interface HospitalReview {
  author: string;
  rating: number;
  relativeTime: string;
  text: string;
}

export interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
}

export interface ChatAction {
  type: 'open_url';
  label: string;
  url: string;
}
