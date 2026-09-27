import express from 'express';
import {
  getDigitalTwinSimulation,
  addCitizenGroundReport,
  fetchLiveWeatherFromApi,
  SIMULATION_CITIES,
} from '../services/digitalTwinService.js';

export const digitalTwinRouter = express.Router();

/**
 * GET /api/v1/digital-twin/cities
 * Returns supported cities for digital twin geospatial simulation.
 */
digitalTwinRouter.get('/cities', (req, res) => {
  const cities = Object.keys(SIMULATION_CITIES).map((key) => {
    const c = SIMULATION_CITIES[key];
    return {
      id: key,
      key,
      name: c.city,
      city: c.city,
      state: c.state,
      center: c.center,
      zoom: c.zoom,
    };
  });
  res.json(cities);
});

/**
 * GET /api/v1/digital-twin/live-weather
 * Fetches real-time meteorological observations from Open-Meteo for a given city.
 */
digitalTwinRouter.get('/live-weather', async (req, res) => {
  try {
    const { city = 'Jaipur' } = req.query;
    const normCity = city.toLowerCase().trim();
    const cityData = SIMULATION_CITIES[normCity] || SIMULATION_CITIES['jaipur'];
    const weather = await fetchLiveWeatherFromApi(
      cityData.center[0],
      cityData.center[1],
      cityData.city
    );
    res.json({ success: true, ...weather });
  } catch (err) {
    console.error('Live weather API error:', err);
    res.status(500).json({ detail: err.message });
  }
});

/**
 * GET /api/v1/digital-twin/simulation
 * Query params: city (string), condition ('rain' | 'heat' | 'clear'),
 * What-If params: rainfall_intensity, temperature, storm_duration, flood_depth
 */
digitalTwinRouter.get('/simulation', async (req, res) => {
  try {
    const { city = 'Jaipur', condition = 'rain' } = req.query;
    const simulation = await getDigitalTwinSimulation(city, condition, req.query);
    res.json(simulation);
  } catch (err) {
    console.error('Digital twin simulation error:', err);
    res.status(500).json({ detail: err.message });
  }
});

/**
 * POST /api/v1/digital-twin/social-signal
 * Submit a real-world citizen ground report.
 */
digitalTwinRouter.post('/social-signal', (req, res) => {
  try {
    const {
      city = 'Jaipur',
      authorName = 'Verified Traveler',
      text,
      lat,
      lng,
      locationName,
      urgency,
      sentiment,
      category,
    } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ detail: 'Report description text is required.' });
    }

    const createdSignal = addCitizenGroundReport({
      city,
      authorName,
      text: text.trim(),
      lat: Number(lat) || undefined,
      lng: Number(lng) || undefined,
      locationName: locationName || `${city} Sector`,
      urgency: urgency || 'moderate',
      sentiment: sentiment || 'alert',
      category: category || 'waterlogging',
    });

    res.status(201).json({ success: true, signal: createdSignal });
  } catch (err) {
    console.error('Submit social signal error:', err);
    res.status(500).json({ detail: err.message });
  }
});
