import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../lokiva.sqlite');

sqlite3.verbose();

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to open SQLite database:', err.message);
  } else {
    console.log(`Connected to SQLite database at ${dbPath}`);
    // Enable Write-Ahead Logging (WAL) for concurrency & set busy timeout
    db.run('PRAGMA journal_mode = WAL');
    db.run('PRAGMA busy_timeout = 30000');
  }
});
db.configure('busyTimeout', 30000);

// Promise wrappers for async/await with automatic retry on SQLITE_BUSY
export const dbRun = async (sql, params = [], maxRetries = 5) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID, changes: this.changes });
        });
      });
    } catch (err) {
      if ((err.code === 'SQLITE_BUSY' || err.message?.includes('locked')) && attempt < maxRetries - 1) {
        const delay = (attempt + 1) * 300 + Math.floor(Math.random() * 200);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
};

export const dbGet = async (sql, params = [], maxRetries = 5) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    } catch (err) {
      if ((err.code === 'SQLITE_BUSY' || err.message?.includes('locked')) && attempt < maxRetries - 1) {
        const delay = (attempt + 1) * 300 + Math.floor(Math.random() * 200);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
};

export const dbAll = async (sql, params = [], maxRetries = 5) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });
    } catch (err) {
      if ((err.code === 'SQLITE_BUSY' || err.message?.includes('locked')) && attempt < maxRetries - 1) {
        const delay = (attempt + 1) * 300 + Math.floor(Math.random() * 200);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
};

export async function initDb() {
  await dbRun(`
    CREATE TABLE IF NOT EXISTS states (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      code TEXT UNIQUE NOT NULL,
      region TEXT NOT NULL,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS cities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      state_id INTEGER,
      state_name TEXT NOT NULL,
      state_code TEXT NOT NULL,
      tagline TEXT,
      description TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      image_url TEXT,
      culture_summary TEXT,
      best_time_to_visit TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (state_id) REFERENCES states (id)
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS areas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city_id INTEGER,
      name TEXT NOT NULL,
      character_tag TEXT,
      safety_score REAL DEFAULT 4.5,
      walkability_score REAL DEFAULT 4.0,
      center_lat REAL,
      center_lng REAL,
      FOREIGN KEY (city_id) REFERENCES cities (id)
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      hashed_password TEXT NOT NULL,
      role TEXT DEFAULT 'traveler',
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS traveler_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      traveler_type TEXT DEFAULT 'Solo Explorer',
      group_size INTEGER DEFAULT 1,
      budget REAL DEFAULT 1500.0,
      available_hours REAL DEFAULT 8.0,
      interests TEXT DEFAULT '["culture", "food"]',
      accessibility_prefs TEXT DEFAULT '{}',
      current_city TEXT DEFAULT 'Mumbai',
      current_state TEXT DEFAULT 'Maharashtra',
      location_name TEXT DEFAULT 'Hotel',
      hotel_lat REAL DEFAULT 19.076,
      hotel_lng REAL DEFAULT 72.8777,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS providers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      business_name TEXT NOT NULL,
      description TEXT,
      contact_email TEXT,
      phone TEXT,
      city TEXT DEFAULT 'Mumbai',
      state TEXT DEFAULT 'Maharashtra',
      address TEXT,
      website TEXT,
      is_verified BOOLEAN DEFAULT 0,
      rating REAL DEFAULT 4.8,
      review_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS experiences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_id INTEGER,
      title TEXT NOT NULL,
      tagline TEXT,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      cultural_context TEXT,
      state TEXT NOT NULL,
      city TEXT NOT NULL,
      area_name TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      approx_duration_mins INTEGER DEFAULT 120,
      price REAL DEFAULT 500.0,
      currency TEXT DEFAULT 'INR',
      max_capacity INTEGER DEFAULT 10,
      difficulty_level TEXT DEFAULT 'easy',
      is_indoor BOOLEAN DEFAULT 0,
      is_rain_safe BOOLEAN DEFAULT 1,
      is_hidden_gem BOOLEAN DEFAULT 0,
      is_family_friendly BOOLEAN DEFAULT 1,
      low_walking BOOLEAN DEFAULT 0,
      wheelchair_accessible BOOLEAN DEFAULT 0,
      best_time_of_day TEXT DEFAULT 'morning',
      rating REAL,
      review_count INTEGER DEFAULT 0,
      notability_score REAL,
      osm_id TEXT,
      osm_type TEXT,
      otm_xid TEXT,
      wikidata_id TEXT,
      source TEXT DEFAULT 'curated',
      raw_osm_tags TEXT,
      image_urls TEXT DEFAULT '[]',
      tags TEXT DEFAULT '[]',
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (provider_id) REFERENCES providers (id)
    )
  `);

  // Cached geographical bounding boxes for Overpass query results
  await dbRun(`
    CREATE TABLE IF NOT EXISTS cached_regions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      min_lat REAL NOT NULL,
      min_lng REAL NOT NULL,
      max_lat REAL NOT NULL,
      max_lng REAL NOT NULL,
      center_lat REAL NOT NULL,
      center_lng REAL NOT NULL,
      display_name TEXT NOT NULL,
      place_count INTEGER DEFAULT 0,
      last_fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      source TEXT DEFAULT 'nominatim_overpass'
    )
  `);

  // Ingestion run audit logs
  await dbRun(`
    CREATE TABLE IF NOT EXISTS ingestion_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query_input TEXT,
      resolved_location TEXT,
      status TEXT NOT NULL,
      places_found INTEGER DEFAULT 0,
      places_persisted INTEGER DEFAULT 0,
      places_enriched INTEGER DEFAULT 0,
      duration_ms INTEGER DEFAULT 0,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Dynamic OpenStreetMap administrative boundary queue for pan-India background seeding
  await dbRun(`
    CREATE TABLE IF NOT EXISTS admin_boundaries_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      osm_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      admin_level INTEGER NOT NULL,
      state_name TEXT,
      min_lat REAL,
      min_lng REAL,
      max_lat REAL,
      max_lng REAL,
      center_lat REAL,
      center_lng REAL,
      status TEXT DEFAULT 'pending',
      priority INTEGER DEFAULT 10,
      places_ingested INTEGER DEFAULT 0,
      last_attempt_at DATETIME,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS itineraries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      target_date TEXT,
      total_duration_mins INTEGER DEFAULT 0,
      total_cost REAL DEFAULT 0.0,
      feasibility_score REAL DEFAULT 90.0,
      status TEXT DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS itinerary_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      itinerary_id INTEGER NOT NULL,
      experience_id INTEGER NOT NULL,
      item_order INTEGER NOT NULL,
      start_time TEXT,
      end_time TEXT,
      travel_time_to_next_mins INTEGER DEFAULT 0,
      notes TEXT,
      FOREIGN KEY (itinerary_id) REFERENCES itineraries (id),
      FOREIGN KEY (experience_id) REFERENCES experiences (id)
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      experience_id INTEGER NOT NULL,
      user_id INTEGER,
      rating REAL NOT NULL,
      title TEXT,
      comment TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (experience_id) REFERENCES experiences (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      experience_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (experience_id) REFERENCES experiences (id)
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS provider_analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_id INTEGER NOT NULL,
      views INTEGER DEFAULT 0,
      bookings INTEGER DEFAULT 0,
      revenue REAL DEFAULT 0.0,
      avg_rating REAL DEFAULT 4.8,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (provider_id) REFERENCES providers (id)
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS pexels_image_cache (
      query TEXT PRIMARY KEY,
      photo_url TEXT NOT NULL,
      photo_urls TEXT,
      photographer TEXT,
      photographer_url TEXT,
      cached_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT,
      active_city TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
      content TEXT NOT NULL,
      recommendations TEXT DEFAULT '[]',
      city TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES chat_sessions (id)
    )
  `);

  await dbRun('CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions (user_id, updated_at DESC)');
  await dbRun('CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages (session_id, created_at, id)');

  // B2B Provider Workspace Tables
  await dbRun(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_code TEXT UNIQUE NOT NULL,
      provider_id INTEGER NOT NULL,
      experience_id INTEGER NOT NULL,
      user_id INTEGER,
      guest_name TEXT NOT NULL,
      guest_email TEXT NOT NULL,
      guest_phone TEXT,
      party_size INTEGER NOT NULL DEFAULT 1,
      adults_count INTEGER DEFAULT 1,
      children_count INTEGER DEFAULT 0,
      booking_date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      total_price REAL NOT NULL,
      commission_rate REAL DEFAULT 0.10,
      commission_amount REAL DEFAULT 0.0,
      net_payout REAL NOT NULL,
      currency TEXT DEFAULT 'INR',
      status TEXT DEFAULT 'pending',
      payout_status TEXT DEFAULT 'pending',
      special_requests TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (provider_id) REFERENCES providers (id),
      FOREIGN KEY (experience_id) REFERENCES experiences (id)
    )
  `);
  await dbRun('CREATE INDEX IF NOT EXISTS idx_bookings_provider ON bookings (provider_id, booking_date DESC)');
  await dbRun('CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings (status)');

  await dbRun(`
    CREATE TABLE IF NOT EXISTS provider_availability (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_id INTEGER NOT NULL,
      experience_id INTEGER,
      date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 10,
      booked_count INTEGER DEFAULT 0,
      is_blocked BOOLEAN DEFAULT 0,
      price_override REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (provider_id) REFERENCES providers (id)
    )
  `);
  await dbRun('CREATE INDEX IF NOT EXISTS idx_availability_lookup ON provider_availability (provider_id, date)');
  await dbRun('CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_avail_unique ON provider_availability (provider_id, experience_id, date, time_slot)');

  await dbRun(`
    CREATE TABLE IF NOT EXISTS provider_offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_id INTEGER NOT NULL,
      experience_id INTEGER,
      title TEXT NOT NULL,
      offer_type TEXT NOT NULL,
      discount_percent REAL NOT NULL,
      promo_code TEXT,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      min_guests INTEGER DEFAULT 1,
      usage_limit INTEGER DEFAULT 100,
      used_count INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (provider_id) REFERENCES providers (id)
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS provider_customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_id INTEGER NOT NULL,
      user_id INTEGER,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT,
      total_bookings INTEGER DEFAULT 1,
      total_spend REAL DEFAULT 0.0,
      first_booking_date TEXT,
      last_booking_date TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (provider_id) REFERENCES providers (id)
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS provider_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link_url TEXT,
      is_read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (provider_id) REFERENCES providers (id)
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS provider_verification (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_id INTEGER NOT NULL,
      document_type TEXT NOT NULL,
      document_number TEXT,
      document_file_url TEXT,
      status TEXT DEFAULT 'pending',
      reviewer_notes TEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reviewed_at DATETIME,
      FOREIGN KEY (provider_id) REFERENCES providers (id)
    )
  `);

  // Safe migration check for new columns on existing database
  try {
    const userInfo = await dbAll("PRAGMA table_info(users)");
    const userCols = userInfo.map((c) => c.name);
    if (!userCols.includes('firebase_uid')) {
      await dbRun("ALTER TABLE users ADD COLUMN firebase_uid TEXT");
      await dbRun("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_firebase_uid ON users (firebase_uid)");
    }

    const stateInfo = await dbAll("PRAGMA table_info(states)");
    const stateCols = stateInfo.map((c) => c.name);
    if (!stateCols.includes('description')) await dbRun("ALTER TABLE states ADD COLUMN description TEXT");
    if (!stateCols.includes('heritage_count')) await dbRun("ALTER TABLE states ADD COLUMN heritage_count INTEGER DEFAULT 0");
    if (!stateCols.includes('is_union_territory')) await dbRun("ALTER TABLE states ADD COLUMN is_union_territory BOOLEAN DEFAULT 0");

    const cityInfo = await dbAll("PRAGMA table_info(cities)");
    const cityCols = cityInfo.map((c) => c.name);
    if (!cityCols.includes('aliases')) await dbRun("ALTER TABLE cities ADD COLUMN aliases TEXT DEFAULT '[]'");
    if (!cityCols.includes('categories')) await dbRun("ALTER TABLE cities ADD COLUMN categories TEXT DEFAULT '[]'");
    if (!cityCols.includes('heritage_count')) await dbRun("ALTER TABLE cities ADD COLUMN heritage_count INTEGER DEFAULT 0");
    if (!cityCols.includes('is_popular')) await dbRun("ALTER TABLE cities ADD COLUMN is_popular BOOLEAN DEFAULT 0");
    if (!cityCols.includes('is_heritage_hub')) await dbRun("ALTER TABLE cities ADD COLUMN is_heritage_hub BOOLEAN DEFAULT 0");
    if (!cityCols.includes('is_hidden_gem')) await dbRun("ALTER TABLE cities ADD COLUMN is_hidden_gem BOOLEAN DEFAULT 0");
    if (!cityCols.includes('tier')) await dbRun("ALTER TABLE cities ADD COLUMN tier TEXT DEFAULT 'Tier 2'");

    const tableInfo = await dbAll("PRAGMA table_info(experiences)");
    const cols = tableInfo.map((c) => c.name);
    if (!cols.includes('osm_id')) await dbRun("ALTER TABLE experiences ADD COLUMN osm_id TEXT");
    if (!cols.includes('osm_type')) await dbRun("ALTER TABLE experiences ADD COLUMN osm_type TEXT");
    if (!cols.includes('otm_xid')) await dbRun("ALTER TABLE experiences ADD COLUMN otm_xid TEXT");
    if (!cols.includes('wikidata_id')) await dbRun("ALTER TABLE experiences ADD COLUMN wikidata_id TEXT");
    if (!cols.includes('notability_score')) await dbRun("ALTER TABLE experiences ADD COLUMN notability_score REAL");
    if (!cols.includes('source')) await dbRun("ALTER TABLE experiences ADD COLUMN source TEXT DEFAULT 'curated'");
    if (!cols.includes('raw_osm_tags')) await dbRun("ALTER TABLE experiences ADD COLUMN raw_osm_tags TEXT");
    if (!cols.includes('inclusions')) await dbRun("ALTER TABLE experiences ADD COLUMN inclusions TEXT DEFAULT '[]'");
    if (!cols.includes('exclusions')) await dbRun("ALTER TABLE experiences ADD COLUMN exclusions TEXT DEFAULT '[]'");
    if (!cols.includes('requirements')) await dbRun("ALTER TABLE experiences ADD COLUMN requirements TEXT DEFAULT '[]'");
    if (!cols.includes('things_to_carry')) await dbRun("ALTER TABLE experiences ADD COLUMN things_to_carry TEXT DEFAULT '[]'");
    if (!cols.includes('status')) await dbRun("ALTER TABLE experiences ADD COLUMN status TEXT DEFAULT 'published'");
    if (!cols.includes('meeting_point')) await dbRun("ALTER TABLE experiences ADD COLUMN meeting_point TEXT");
    if (!cols.includes('view_count')) await dbRun("ALTER TABLE experiences ADD COLUMN view_count INTEGER DEFAULT 0");
    if (!cols.includes('booking_count')) await dbRun("ALTER TABLE experiences ADD COLUMN booking_count INTEGER DEFAULT 0");
    if (!cols.includes('interests')) await dbRun("ALTER TABLE experiences ADD COLUMN interests TEXT DEFAULT '[]'");
    if (!cols.includes('min_group_size')) await dbRun("ALTER TABLE experiences ADD COLUMN min_group_size INTEGER DEFAULT 1");
    if (!cols.includes('max_group_size')) await dbRun("ALTER TABLE experiences ADD COLUMN max_group_size INTEGER DEFAULT 10");
    if (!cols.includes('opening_hours')) await dbRun("ALTER TABLE experiences ADD COLUMN opening_hours TEXT DEFAULT '09:00 AM - 06:00 PM'");
    if (!cols.includes('operating_days')) await dbRun("ALTER TABLE experiences ADD COLUMN operating_days TEXT DEFAULT '[\"Mon\",\"Tue\",\"Wed\",\"Thu\",\"Fri\",\"Sat\",\"Sun\"]'");
    if (!cols.includes('available_slots')) await dbRun("ALTER TABLE experiences ADD COLUMN available_slots TEXT DEFAULT '[\"09:00 AM\",\"03:00 PM\"]'");
    if (!cols.includes('video_url')) await dbRun("ALTER TABLE experiences ADD COLUMN video_url TEXT");
    if (!cols.includes('step_free')) await dbRun("ALTER TABLE experiences ADD COLUMN step_free BOOLEAN DEFAULT 0");
    if (!cols.includes('audio_guide')) await dbRun("ALTER TABLE experiences ADD COLUMN audio_guide BOOLEAN DEFAULT 0");
    if (!cols.includes('group_type')) await dbRun("ALTER TABLE experiences ADD COLUMN group_type TEXT DEFAULT 'small_group'");
    if (!cols.includes('cancellation_policy')) await dbRun("ALTER TABLE experiences ADD COLUMN cancellation_policy TEXT DEFAULT 'Flexible: Free cancellation up to 24h before'");
    if (!cols.includes('advance_booking')) await dbRun("ALTER TABLE experiences ADD COLUMN advance_booking TEXT DEFAULT 'Same day bookings allowed up to 2 hours before'");
    if (!cols.includes('age_restriction')) await dbRun("ALTER TABLE experiences ADD COLUMN age_restriction TEXT DEFAULT 'All ages welcome'");
    if (!cols.includes('special_instructions')) await dbRun("ALTER TABLE experiences ADD COLUMN special_instructions TEXT");

    const providerInfo = await dbAll("PRAGMA table_info(providers)");
    const providerCols = providerInfo.map((c) => c.name);
    if (!providerCols.includes('provider_type')) await dbRun("ALTER TABLE providers ADD COLUMN provider_type TEXT DEFAULT 'Tour Operator'");
    if (!providerCols.includes('tagline')) await dbRun("ALTER TABLE providers ADD COLUMN tagline TEXT");
    if (!providerCols.includes('logo_url')) await dbRun("ALTER TABLE providers ADD COLUMN logo_url TEXT");
    if (!providerCols.includes('cover_image_url')) await dbRun("ALTER TABLE providers ADD COLUMN cover_image_url TEXT");
    if (!providerCols.includes('languages_spoken')) await dbRun("ALTER TABLE providers ADD COLUMN languages_spoken TEXT DEFAULT '[\"English\", \"Hindi\"]'");
    if (!providerCols.includes('certifications')) await dbRun("ALTER TABLE providers ADD COLUMN certifications TEXT DEFAULT '[]'");
    if (!providerCols.includes('social_links')) await dbRun("ALTER TABLE providers ADD COLUMN social_links TEXT DEFAULT '{}'");
    if (!providerCols.includes('verification_status')) await dbRun("ALTER TABLE providers ADD COLUMN verification_status TEXT DEFAULT 'verified'");
    if (!providerCols.includes('settlement_account')) await dbRun("ALTER TABLE providers ADD COLUMN settlement_account TEXT");
  } catch (err) {
    console.log('Migration note:', err.message);
  }

  console.log('Database tables and ingestion schema initialized successfully.');
}
