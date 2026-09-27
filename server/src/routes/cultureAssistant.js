import express from 'express';
import { getCulturalDataset, getUpcomingFestivalForState } from '../data/culturalDatasets.js';
import { chatWithCulturalAssistant } from '../services/culturalIntelligenceService.js';

export const cultureAssistantRouter = express.Router();

/**
 * GET /api/v1/culture-assistant/health
 */
cultureAssistantRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Cultural Intelligence Engine',
    model: 'nugen-qwen-v2p5-aligned',
    supportedStates: ['rajasthan', 'maharashtra', 'kerala', 'ladakh'],
  });
});

/**
 * GET /api/v1/culture-assistant/dataset?state=<slug>
 */
cultureAssistantRouter.get('/dataset', (req, res) => {
  const stateSlug = req.query.state || req.query.slug;
  if (!stateSlug) {
    return res.status(400).json({ error: 'State parameter is required' });
  }

  const dataset = getCulturalDataset(stateSlug);
  if (!dataset) {
    return res.status(200).json({
      status: 'unauthored',
      stateSlug,
      message: `Cultural insights for ${stateSlug} are currently in curation.`,
      dataset: null,
    });
  }

  res.json({
    status: 'success',
    stateSlug,
    dataset,
  });
});

/**
 * GET /api/v1/culture-assistant/upcoming-festival?state=<slug>
 */
cultureAssistantRouter.get('/upcoming-festival', (req, res) => {
  const stateSlug = req.query.state || req.query.slug;
  if (!stateSlug) {
    return res.status(400).json({ error: 'State parameter is required' });
  }

  const festival = getUpcomingFestivalForState(stateSlug);
  if (!festival) {
    return res.status(200).json({
      status: 'no_data',
      stateSlug,
      festival: null,
    });
  }

  res.json({
    status: 'success',
    stateSlug,
    festival,
  });
});

/**
 * POST /api/v1/culture-assistant/chat
 * Body: { stateSlug: string, query: string, conversationHistory?: Array }
 */
cultureAssistantRouter.post('/chat', async (req, res) => {
  const { stateSlug, query, conversationHistory } = req.body;
  
  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const result = await chatWithCulturalAssistant({
      stateSlug,
      query,
      conversationHistory: conversationHistory || [],
    });

    res.json(result);
  } catch (err) {
    console.error('Cultural Assistant Router Error:', err);
    res.status(500).json({
      error: 'Failed to process cultural query',
      detail: err.message,
    });
  }
});
