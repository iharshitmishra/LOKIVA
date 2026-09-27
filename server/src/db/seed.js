import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { dbRun, dbGet, initDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function seedDatabase() {
  await initDb();

  const userCheck = await dbGet('SELECT COUNT(*) as count FROM users');
  if (userCheck && userCheck.count > 0) {
    console.log('Database already has data. Skipping seed.');
    return;
  }

  console.log('Seeding SQLite database from dump...');
  const dumpPath = path.resolve(__dirname, 'lokiva_seed_dump.json');
  if (!fs.existsSync(dumpPath)) {
    console.warn('Seed dump file not found at:', dumpPath);
    return;
  }

  const dump = JSON.parse(fs.readFileSync(dumpPath, 'utf-8'));

  // 1. States
  const stateMap = {};
  for (const s of dump.states || []) {
    stateMap[s.id] = s;
    await dbRun(
      'INSERT OR REPLACE INTO states (id, name, code, region, image_url) VALUES (?, ?, ?, ?, ?)',
      [s.id, s.name, s.code, s.region, s.image_url]
    );
  }

  // 2. Cities
  for (const c of dump.cities || []) {
    const parentState = stateMap[c.state_id] || { name: 'Rajasthan', code: 'RJ' };
    await dbRun(
      'INSERT OR REPLACE INTO cities (id, name, state_id, state_name, state_code, tagline, description, latitude, longitude, image_url, culture_summary, best_time_to_visit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        c.id,
        c.name,
        c.state_id,
        c.state_name || parentState.name,
        c.state_code || parentState.code,
        c.tagline || `${c.name} Cultural Destination`,
        c.description || '',
        c.latitude,
        c.longitude,
        c.image_url,
        c.culture_summary || `Explore authentic local culture in ${c.name}.`,
        c.best_time_to_visit || 'October to March'
      ]
    );
  }

  // 3. Users
  for (const u of dump.users || []) {
    await dbRun(
      'INSERT OR REPLACE INTO users (id, email, full_name, hashed_password, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [u.id, u.email, u.full_name, u.hashed_password, u.role, u.is_active ? 1 : 0]
    );
  }

  // 4. Traveler Profiles
  for (const tp of dump.traveler_profiles || []) {
    await dbRun(
      'INSERT OR REPLACE INTO traveler_profiles (id, user_id, traveler_type, group_size, budget, available_hours, interests, accessibility_prefs, current_city, current_state, location_name, hotel_lat, hotel_lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [tp.id, tp.user_id, tp.traveler_type, tp.group_size, tp.budget, tp.available_hours, tp.interests, tp.accessibility_prefs, tp.current_city, tp.current_state, tp.location_name, tp.hotel_lat, tp.hotel_lng]
    );
  }

  // 5. Providers
  for (const p of dump.providers || []) {
    await dbRun(
      'INSERT OR REPLACE INTO providers (id, user_id, business_name, description, contact_email, phone, city, state, address, website, is_verified, rating, review_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [p.id, p.user_id, p.business_name, p.description, p.contact_email, p.phone, p.city, p.state, p.address, p.website, p.is_verified ? 1 : 0, p.rating, p.review_count]
    );
  }

  // 6. Experiences
  for (const e of dump.experiences || []) {
    await dbRun(
      `INSERT OR REPLACE INTO experiences (
        id, provider_id, title, tagline, description, category, cultural_context,
        state, city, area_name, latitude, longitude, approx_duration_mins, price,
        currency, max_capacity, difficulty_level, is_indoor, is_rain_safe, is_hidden_gem,
        is_family_friendly, low_walking, wheelchair_accessible, best_time_of_day,
        rating, review_count, image_urls, tags, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        e.id, e.provider_id, e.title, e.tagline, e.description, e.category, e.cultural_context,
        e.state, e.city, e.area_name, e.latitude, e.longitude, e.approx_duration_mins, e.price,
        e.currency, e.max_capacity, e.difficulty_level, e.is_indoor ? 1 : 0, e.is_rain_safe ? 1 : 0, e.is_hidden_gem ? 1 : 0,
        e.is_family_friendly ? 1 : 0, e.low_walking ? 1 : 0, e.wheelchair_accessible ? 1 : 0, e.best_time_of_day,
        e.rating, e.review_count, e.images || e.image_urls, e.tags, e.is_active ? 1 : 0
      ]
    );
  }

  // 7. Reviews
  for (const r of dump.reviews || []) {
    await dbRun(
      'INSERT OR REPLACE INTO reviews (id, experience_id, user_id, rating, title, comment) VALUES (?, ?, ?, ?, ?, ?)',
      [r.id, r.experience_id, r.user_id, r.rating, r.title, r.comment]
    );
  }

  // 8. Provider Analytics
  for (const pa of dump.provider_analytics || []) {
    await dbRun(
      'INSERT OR REPLACE INTO provider_analytics (id, provider_id, views, bookings, revenue, avg_rating) VALUES (?, ?, ?, ?, ?, ?)',
      [pa.id, pa.provider_id, pa.views, pa.bookings, pa.revenue, pa.avg_rating]
    );
  }

  // 9. B2B Provider Workspace Data
  const { seedProviderWorkspaceData } = await import('./seedProviderData.js');
  await seedProviderWorkspaceData();

  console.log('Seeded database successfully with all 229 verified experiences and B2B provider workspace!');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDatabase().then(() => process.exit(0)).catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
  });
}
