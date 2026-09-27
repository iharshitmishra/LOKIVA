import express from 'express';
import { dbAll, dbGet, dbRun } from '../db/db.js';
import { enrichExperienceWithPexels, getFallbackForCategory } from '../services/pexelsService.js';

export const experiencesRouter = express.Router();

function formatExperience(e) {
  if (!e) return null;
  const parsedImageUrls = typeof e.image_urls === 'string' ? JSON.parse(e.image_urls || '[]') : e.image_urls || [];
  let primaryImg = (parsedImageUrls.length > 0 && parsedImageUrls[0]) ? parsedImageUrls[0] : (e.image_url || null);

  // If primary image is a Wikimedia URL, proxy it to guarantee successful browser delivery
  if (primaryImg && primaryImg.includes('upload.wikimedia.org') && !primaryImg.includes('/api/v1/experiences/proxy-image')) {
    primaryImg = `/api/v1/experiences/proxy-image?url=${encodeURIComponent(primaryImg)}`;
  }

  return {
    ...e,
    is_indoor: Boolean(e.is_indoor),
    is_rain_safe: Boolean(e.is_rain_safe),
    is_hidden_gem: Boolean(e.is_hidden_gem),
    is_family_friendly: Boolean(e.is_family_friendly),
    low_walking: Boolean(e.low_walking),
    wheelchair_accessible: Boolean(e.wheelchair_accessible),
    is_active: Boolean(e.is_active),
    image_url: primaryImg,
    tags: typeof e.tags === 'string' ? JSON.parse(e.tags || '[]') : e.tags || [],
    image_urls: parsedImageUrls.map((u) =>
      u && u.includes('upload.wikimedia.org') && !u.includes('/api/v1/experiences/proxy-image')
        ? `/api/v1/experiences/proxy-image?url=${encodeURIComponent(u)}`
        : u
    ),
  };
}

// GET /experiences/proxy-image - Universal robust image proxy
experiencesRouter.get('/proxy-image', async (req, res) => {
  try {
    const rawUrl = req.query.url;
    if (!rawUrl || typeof rawUrl !== 'string') {
      return res.status(400).send('Missing image url');
    }

    let cleanUrl = decodeURIComponent(rawUrl);

    // If it's a Wikimedia 1280px URL, normalize to 800px or direct URL to avoid 404 scaler bugs
    let fetchUrl = cleanUrl;
    if (fetchUrl.includes('upload.wikimedia.org') && fetchUrl.includes('/1280px-')) {
      fetchUrl = fetchUrl.replace('/1280px-', '/800px-');
    }

    const headers = {
      'User-Agent': cleanUrl.includes('lookaside.fbsbx.com')
        ? 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'
        : 'LokivaDiscovery/1.0 (https://lokiva.in; contact@lokiva.in)',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    };

    let response = await fetch(fetchUrl, { headers }).catch(() => null);

    // If thumbnail failed (e.g. 400 or 404 on Wikimedia thumb), try fetching the original file directly
    if ((!response || !response.ok) && fetchUrl.includes('upload.wikimedia.org') && fetchUrl.includes('/thumb/')) {
      const origUrl = fetchUrl.replace('/thumb/', '/').split('/').slice(0, 8).join('/');
      response = await fetch(origUrl, { headers }).catch(() => null);
    }

    if (response && response.ok) {
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      res.setHeader('Access-Control-Allow-Origin', '*');
      const arrayBuffer = await response.arrayBuffer();
      return res.send(Buffer.from(arrayBuffer));
    }

    const fallbackUrl = getFallbackForCategory('heritage', rawUrl);
    return res.redirect(fallbackUrl);
  } catch (err) {
    return res.status(500).send('Proxy error');
  }
});

// GET /experiences/categories - summary of categories
experiencesRouter.get('/categories', async (req, res) => {
  try {
    const { city, state } = req.query;
    let sql = 'SELECT category, COUNT(*) as count, AVG(rating) as avg_rating FROM experiences WHERE is_active = 1';
    const params = [];
    if (city) {
      sql += ' AND LOWER(city) = ?';
      params.push(city.toLowerCase());
    }
    if (state) {
      sql += ' AND LOWER(state) = ?';
      params.push(state.toLowerCase());
    }
    sql += ' GROUP BY category ORDER BY count DESC';

    const rows = await dbAll(sql, params);
    const categoryIcons = {
      workshop: 'Palette',
      food: 'Utensils',
      culture: 'Landmark',
      nature: 'Compass',
      spiritual: 'Sparkles',
      music: 'Music',
    };

    const result = rows.map((r) => ({
      name: r.category,
      count: r.count,
      avg_rating: Math.round(r.avg_rating * 10) / 10,
      icon_name: categoryIcons[r.category.toLowerCase()] || 'Sparkles',
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// GET /experiences - full catalog with advanced filters
experiencesRouter.get('/', async (req, res) => {
  try {
    const {
      category,
      q,
      city,
      state,
      max_price,
      max_duration_mins,
      is_hidden_gem,
      low_walking,
      family_friendly,
      is_indoor,
      limit = '50',
      offset = '0',
    } = req.query;

    let sql = 'SELECT * FROM experiences WHERE is_active = 1';
    const params = [];

    if (category) {
      sql += ' AND LOWER(category) = ?';
      params.push(category.toLowerCase());
    }
    if (city) {
      const cLow = city.toLowerCase().trim();
      sql += ' AND (LOWER(city) = ? OR LOWER(city) LIKE ? OR LOWER(area_name) LIKE ? OR LOWER(state) LIKE ? OR ? LIKE "%" || LOWER(city) || "%")';
      params.push(cLow, `%${cLow}%`, `%${cLow}%`, `%${cLow}%`, cLow);
    }
    if (state) {
      sql += ' AND LOWER(state) = ?';
      params.push(state.toLowerCase());
    }
    if (q) {
      sql += ' AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(area_name) LIKE ? OR LOWER(city) LIKE ? OR LOWER(state) LIKE ?)';
      const term = `%${q.toLowerCase()}%`;
      params.push(term, term, term, term, term);
    }
    if (max_price) {
      sql += ' AND price <= ?';
      params.push(parseFloat(max_price));
    }
    if (max_duration_mins) {
      sql += ' AND approx_duration_mins <= ?';
      params.push(parseInt(max_duration_mins, 10));
    }
    if (is_hidden_gem === 'true') {
      sql += ' AND is_hidden_gem = 1';
    }
    if (low_walking === 'true') {
      sql += ' AND low_walking = 1';
    }
    if (family_friendly === 'true') {
      sql += ' AND is_family_friendly = 1';
    }
    if (is_indoor === 'true') {
      sql += ' AND is_indoor = 1';
    }

    sql += ' ORDER BY notability_score DESC, COALESCE(rating, 4.5) DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const rows = await dbAll(sql, params);
    const formattedRows = rows.map(formatExperience);

    // Preserve user curated images without Pexels fallback replacements
    const enrichedList = [];
    for (const exp of formattedRows) {
      if (exp.image_url && exp.image_url.trim().length > 0) {
        enrichedList.push(exp);
      } else {
        const enriched = await enrichExperienceWithPexels(exp);
        enrichedList.push(enriched);
      }
    }

    res.json(enrichedList);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// Specifically curated iconic landmark experiences for the landing page
const LANDING_EXPERIENCE_IDS = [4000, 1492, 3932, 1491, 1495, 773, 1497, 760, 743, 1215];

// GET /experiences/landing
experiencesRouter.get('/landing', async (req, res) => {
  try {
    const placeholders = LANDING_EXPERIENCE_IDS.map(() => '?').join(',');
    const rows = await dbAll(
      `SELECT * FROM experiences WHERE id IN (${placeholders})`,
      LANDING_EXPERIENCE_IDS
    );
    const rowsById = new Map(rows.map((r) => [r.id, r]));
    const ordered = LANDING_EXPERIENCE_IDS.map((id) => rowsById.get(id)).filter(Boolean);
    const formattedRows = ordered.map(formatExperience);

    res.json(formattedRows);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// GET /experiences/:id
experiencesRouter.get('/:id', async (req, res) => {
  try {
    const exp = await dbGet('SELECT * FROM experiences WHERE id = ?', [req.params.id]);
    if (!exp) return res.status(404).json({ detail: 'Experience not found' });

    // Track real organic views in background
    dbRun('UPDATE experiences SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ?', [req.params.id]).catch(() => {});

    const provider = exp.provider_id ? await dbGet('SELECT * FROM providers WHERE id = ?', [exp.provider_id]) : null;
    const reviews = await dbAll('SELECT * FROM reviews WHERE experience_id = ? ORDER BY created_at DESC LIMIT 10', [exp.id]);

    const formatted = formatExperience(exp);
    const enriched = await enrichExperienceWithPexels(formatted);
    enriched.provider = provider;
    enriched.reviews = reviews;
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// GET /experiences/:id/availability
// Traveler-side & AI Itinerary Solver slot inspector: Experience -> Date -> Time Slot -> Capacity -> Booked -> Remaining
experiencesRouter.get('/:id/availability', async (req, res) => {
  try {
    const expId = req.params.id;
    const exp = await dbGet('SELECT * FROM experiences WHERE id = ?', [expId]);
    if (!exp) return res.status(404).json({ detail: 'Experience not found' });

    const now = new Date();
    const defaultStart = now.toISOString().split('T')[0];
    const defaultEndObj = new Date(now);
    defaultEndObj.setDate(defaultEndObj.getDate() + 30);
    const defaultEnd = defaultEndObj.toISOString().split('T')[0];

    const startDate = req.query.startDate || defaultStart;
    const endDate = req.query.endDate || defaultEnd;

    // 1. Fetch custom availability rows
    const customSlots = await dbAll(
      `SELECT * FROM provider_availability 
       WHERE experience_id = ? AND date BETWEEN ? AND ? 
       ORDER BY date ASC, time_slot ASC`,
      [expId, startDate, endDate]
    );

    // 2. Fetch live bookings
    const bookings = await dbAll(
      `SELECT booking_date, time_slot, SUM(party_size) as booked_seats 
       FROM bookings 
       WHERE experience_id = ? AND booking_date BETWEEN ? AND ? AND status != 'cancelled'
       GROUP BY booking_date, time_slot`,
      [expId, startDate, endDate]
    );

    const bookingMap = new Map();
    bookings.forEach((b) => {
      bookingMap.set(`${b.booking_date}___${b.time_slot}`, Number(b.booked_seats || 0));
    });

    // 3. Fallback operating days & slots from Experience definition
    const operatingDays = typeof exp.operating_days === 'string'
      ? JSON.parse(exp.operating_days || '["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]')
      : (exp.operating_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);

    const defaultSlots = typeof exp.available_slots === 'string'
      ? JSON.parse(exp.available_slots || '["09:00 AM", "03:30 PM"]')
      : (exp.available_slots || ['09:00 AM', '03:30 PM']);

    const baseCapacity = Number(exp.max_group_size || exp.max_capacity || 10);
    const basePrice = Number(exp.price || 1200);

    // Build day-by-day availability map
    const customSlotMap = new Map();
    customSlots.forEach((cs) => {
      if (!customSlotMap.has(cs.date)) customSlotMap.set(cs.date, []);
      customSlotMap.get(cs.date).push(cs);
    });

    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.min(60, Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24))));

    const schedule = [];

    for (let i = 0; i <= daysDiff; i++) {
      const curDate = new Date(start);
      curDate.setDate(curDate.getDate() + i);
      const dateStr = curDate.toISOString().split('T')[0];
      const dayName = curDate.toLocaleDateString('en-US', { weekday: 'short' });

      let daySlots = [];

      if (customSlotMap.has(dateStr)) {
        // Use explicitly configured custom slots
        daySlots = customSlotMap.get(dateStr).map((cs) => {
          const booked = Math.max(
            Number(cs.booked_count || 0),
            bookingMap.get(`${dateStr}___${cs.time_slot}`) || 0
          );
          const capacity = Number(cs.capacity || baseCapacity);
          const remaining = Math.max(0, capacity - booked);
          const isAvailable = !cs.is_blocked && remaining > 0;

          return {
            slot_id: cs.id,
            time_slot: cs.time_slot,
            capacity,
            booked,
            remaining,
            is_available: isAvailable,
            is_blocked: Boolean(cs.is_blocked),
            is_sold_out: remaining === 0,
            price: cs.price_override ? Number(cs.price_override) : basePrice,
          };
        });
      } else if (operatingDays.includes(dayName)) {
        // Synthesize slots from Experience weekly schedule
        daySlots = defaultSlots.map((slotTime) => {
          const booked = bookingMap.get(`${dateStr}___${slotTime}`) || 0;
          const remaining = Math.max(0, baseCapacity - booked);
          const isAvailable = remaining > 0;

          return {
            slot_id: null,
            time_slot: slotTime,
            capacity: baseCapacity,
            booked,
            remaining,
            is_available: isAvailable,
            is_blocked: false,
            is_sold_out: remaining === 0,
            price: basePrice,
          };
        });
      }

      schedule.push({
        date: dateStr,
        day_of_week: dayName,
        is_operating_day: operatingDays.includes(dayName) || daySlots.length > 0,
        has_availability: daySlots.some((s) => s.is_available),
        slots: daySlots,
      });
    }

    res.json({
      experience_id: exp.id,
      title: exp.title,
      category: exp.category,
      opening_hours: exp.opening_hours || '09:00 AM - 06:00 PM',
      approx_duration_mins: exp.approx_duration_mins || 90,
      base_price: basePrice,
      max_capacity: baseCapacity,
      operating_days: operatingDays,
      start_date: startDate,
      end_date: endDate,
      schedule,
    });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// POST /experiences (Create new experience)
experiencesRouter.post('/', async (req, res) => {
  try {
    const e = req.body;
    const result = await dbRun(
      `INSERT INTO experiences (
        provider_id, title, tagline, description, category, cultural_context,
        state, city, area_name, latitude, longitude, approx_duration_mins,
        price, currency, max_capacity, difficulty_level, is_indoor, is_rain_safe,
        is_hidden_gem, is_family_friendly, low_walking, wheelchair_accessible,
        best_time_of_day, image_urls, tags, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        e.provider_id || 1, e.title, e.tagline, e.description, e.category, e.cultural_context,
        e.state || 'Rajasthan', e.city || 'Jaipur', e.area_name || 'Old City',
        e.latitude || 26.9124, e.longitude || 75.7873, e.approx_duration_mins || 120,
        e.price || 500, e.currency || 'INR', e.max_capacity || 10, e.difficulty_level || 'easy',
        e.is_indoor ? 1 : 0, e.is_rain_safe ? 1 : 0, e.is_hidden_gem ? 1 : 0,
        e.is_family_friendly ? 1 : 0, e.low_walking ? 1 : 0, e.wheelchair_accessible ? 1 : 0,
        e.best_time_of_day || 'morning', JSON.stringify(e.image_urls || []),
        JSON.stringify(e.tags || []),
      ]
    );

    const created = await dbGet('SELECT * FROM experiences WHERE id = ?', [result.lastID]);
    res.status(201).json(formatExperience(created));
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});
