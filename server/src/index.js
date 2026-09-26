import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDb } from './db/db.js';
import { seedDatabase } from './db/seed.js';
import { authRouter } from './routes/auth.js';
import { destinationsRouter } from './routes/destinations.js';
import { experiencesRouter } from './routes/experiences.js';
import { aiRouter } from './routes/ai.js';
import { itinerariesRouter } from './routes/itineraries.js';
import { providersRouter } from './routes/providers.js';
import { adminRouter } from './routes/admin.js';
import { reviewsRouter } from './routes/reviews.js';
import { router as ingestionRouter } from './routes/ingestion.js';
import { mediaRouter } from './routes/media.js';
import { voiceRouter } from './routes/voice.js';
import { paymentsRouter } from './routes/payments.js';
import http from 'http';
import { setupVoiceWebSocketServer } from './services/voiceStreamService.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(
  cors({
    origin: (origin, callback) => callback(null, true), // Allow all origins in local dev
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes mounted under /api/v1 (identical to FastAPI contract)
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/destinations', destinationsRouter);
app.use('/api/v1/experiences', experiencesRouter);
app.use('/api/v1/ai', aiRouter);
app.use('/ai', aiRouter);
app.use('/api/ai', aiRouter);
app.use('/api/v1/recommendations', aiRouter);
app.use('/api/v1/itineraries', itinerariesRouter);
app.use('/api/v1/providers', providersRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/reviews', reviewsRouter);
app.use('/api/v1/ingestion', ingestionRouter);
app.use('/api/v1/media', mediaRouter);
app.use('/api/v1/payments', paymentsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/v1/voice', voiceRouter);
app.use('/voice', voiceRouter);

// Root and Health Endpoints
app.get('/', (req, res) => {
  res.json({
    app: 'LOKIVA Node.js API',
    tagline: 'Find the place. Feel the local.',
    status: 'healthy',
    version: '1.0.0',
    platform: 'Node.js Express + SQLite',
  });
});

app.get(['/health', '/api/v1/health'], (req, res) => {
  res.json({ status: 'ok', coverage: 'pan_india_dynamic' });
});

import { seedPanIndiaCompleteNetwork } from './services/ingestion/panIndiaCompleteDataset.js';
import { seedPanIndiaCulturalMesh } from './services/ingestion/panIndiaSeeder.js';
import { seedMasterCityPlaces } from './services/ingestion/masterCityDataset.js';
import { seedDefinitiveFamousPlaces } from './services/ingestion/definitiveMajorCitiesRegistry.js';
import { seedDefinitiveMajorCitiesDataset } from './services/ingestion/definitiveMajorCitiesDataset.js';
import { seedMumbaiMasterCatalog } from './services/ingestion/mumbaiMasterCatalog.js';
import { seedArtisansAndGuides } from './services/ingestion/artisansAndGuidesCatalog.js';
import { applyUserSelection } from './services/ingestion/applyUserSelection.js';

// Initialize database and start listening
async function startServer() {
  await initDb();
  await seedDatabase();
  await seedPanIndiaCompleteNetwork();
  await seedPanIndiaCulturalMesh();
  await seedMasterCityPlaces();
  await seedDefinitiveFamousPlaces();
  await seedDefinitiveMajorCitiesDataset();
  await seedMumbaiMasterCatalog();
  await seedArtisansAndGuides();
  await applyUserSelection();

  const server = http.createServer(app);
  setupVoiceWebSocketServer(server);

  server.listen(PORT, () => {
    console.log(`LOKIVA Backend API listening at http://localhost:${PORT}`);
  });
}

startServer();
