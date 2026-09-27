import { create } from 'zustand';
import { WeatherContextForAI } from '../services/openMeteoService';

export interface WeatherSimulationState {
  isSimulationActive: boolean;
  simulatedWeather: WeatherContextForAI | null;
  simulationCity: string | null;

  // Actions
  setSimulationActive: (active: boolean) => void;
  setSimulatedWeather: (weather: WeatherContextForAI | null) => void;
  setSimulationCity: (city: string | null) => void;
  updateSimulatedWeather: (updates: Partial<WeatherContextForAI>) => void;
  resetSimulation: () => void;
}

const DEFAULT_SIMULATED_WEATHER: WeatherContextForAI = {
  city: 'Mumbai',
  currentCondition: 'Heavy Rain',
  currentTempCelsius: 24,
  todaySummary: 'Heavy monsoon rain throughout the day. High humidity and strong winds.',
  tomorrowSummary: 'Continued rain with occasional breaks.',
  rainExpected: true,
  peakRainProbability: 95,
  hourlyHighlights: [
    { time: 'Today 8:00', temp: 24, condition: 'Heavy Rain', rainProb: 95 },
    { time: 'Today 10:00', temp: 25, condition: 'Heavy Rain', rainProb: 92 },
    { time: 'Today 12:00', temp: 26, condition: 'Thunderstorm', rainProb: 88 },
    { time: 'Today 14:00', temp: 26, condition: 'Heavy Rain', rainProb: 90 },
    { time: 'Today 16:00', temp: 25, condition: 'Rain Showers', rainProb: 75 },
    { time: 'Today 18:00', temp: 24, condition: 'Light Rain', rainProb: 60 },
  ],
  aiPromptContext: '',
  weatherAdvisory: 'Heavy rain likely in Mumbai. Strongly recommend indoor alternatives and rain gear. Consider shifting outdoor stops to early morning or late evening.',
};

export const useWeatherSimulationStore = create<WeatherSimulationState>((set, get) => ({
  isSimulationActive: false,
  simulatedWeather: DEFAULT_SIMULATED_WEATHER,
  simulationCity: 'Mumbai',

  setSimulationActive: (active) => set({ isSimulationActive: active }),

  setSimulatedWeather: (weather) => set({ simulatedWeather: weather }),

  setSimulationCity: (city) => set({ simulationCity: city }),

  updateSimulatedWeather: (updates) =>
    set((state) => ({
      simulatedWeather: state.simulatedWeather
        ? { ...state.simulatedWeather, ...updates }
        : null,
    })),

  resetSimulation: () =>
    set({
      isSimulationActive: false,
      simulatedWeather: DEFAULT_SIMULATED_WEATHER,
      simulationCity: 'Mumbai',
    }),
}));
