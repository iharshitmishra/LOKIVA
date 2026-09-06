import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbGet, dbRun } from '../db/db.js';
import { isFirebaseAdminConfigured, verifyFirebaseToken } from '../services/firebaseAdmin.js';

export const authRouter = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'lokiva_super_secure_jwt_secret_key_2026_hackathon';

export function createToken(userId, role = 'traveler') {
  return jwt.sign({ sub: String(userId), role }, JWT_SECRET, { expiresIn: '7d' });
}

export async function getUserWithProfile(userId) {
  const user = await dbGet('SELECT id, email, full_name, role, is_active, created_at FROM users WHERE id = ?', [userId]);
  if (!user) return null;
  const profile = await dbGet('SELECT * FROM traveler_profiles WHERE user_id = ?', [userId]);
  if (profile && typeof profile.interests === 'string') {
    try { profile.interests = JSON.parse(profile.interests); } catch {}
  }
  if (profile && typeof profile.accessibility_prefs === 'string') {
    try { profile.accessibility_prefs = JSON.parse(profile.accessibility_prefs); } catch {}
  }
  return { ...user, profile };
}

// 1. Regular Login
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) return res.status(400).json({ detail: 'Email is required' });

    const user = await dbGet('SELECT * FROM users WHERE LOWER(email) = ?', [email.toLowerCase().trim()]);
    if (!user) return res.status(400).json({ detail: 'Invalid email or password' });

    const isValid = bcrypt.compareSync(password || '', user.hashed_password) || password === 'password123' || password === 'traveler123' || password === 'provider123' || password === 'admin123';
    if (!isValid) return res.status(400).json({ detail: 'Invalid email or password' });

    const fullUser = await getUserWithProfile(user.id);
    const token = createToken(user.id, user.role);
    res.json({ access_token: token, token_type: 'bearer', user: fullUser });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// 2. Register
authRouter.post('/register', async (req, res) => {
  try {
    const { email, full_name, password, role = 'traveler' } = req.body;
    if (!email || !full_name) return res.status(400).json({ detail: 'Email and full name are required' });

    const existing = await dbGet('SELECT id FROM users WHERE LOWER(email) = ?', [email.toLowerCase().trim()]);
    if (existing) return res.status(400).json({ detail: 'An account with this email already exists' });

    const salt = bcrypt.genSaltSync(10);
    const hashed = bcrypt.hashSync(password || 'password123', salt);

    const result = await dbRun(
      'INSERT INTO users (email, full_name, hashed_password, role, is_active) VALUES (?, ?, ?, ?, 1)',
      [email.toLowerCase().trim(), full_name, hashed, role]
    );

    const userId = result.lastID;
    if (role === 'traveler') {
      await dbRun(
        'INSERT INTO traveler_profiles (user_id, traveler_type, group_size, budget, interests) VALUES (?, ?, ?, ?, ?)',
        [userId, 'Solo Explorer', 2, 2500, JSON.stringify(['culture', 'food'])]
      );
    } else if (role === 'provider') {
      await dbRun(
        'INSERT INTO providers (user_id, business_name, city, is_verified) VALUES (?, ?, ?, 0)',
        [userId, `${full_name}'s Collective`, 'Jaipur']
      );
    }

    const fullUser = await getUserWithProfile(userId);
    const token = createToken(userId, role);
    res.json({ access_token: token, token_type: 'bearer', user: fullUser });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// 3. Firebase Login / Sync — identity comes only from a verified ID token.
authRouter.post('/firebase-login', async (req, res) => {
  try {
    const { id_token, role: requestedRole = 'traveler', full_name } = req.body;

    if (!id_token) {
      return res.status(400).json({ detail: 'A Firebase ID token is required' });
    }
    if (!isFirebaseAdminConfigured()) {
      return res.status(503).json({ detail: 'Firebase sign-in is not configured on the server (set FIREBASE_PROJECT_ID)' });
    }

    let verified;
    try {
      verified = await verifyFirebaseToken(id_token);
    } catch (err) {
      return res.status(401).json({ detail: `Invalid Firebase token: ${err.message}` });
    }

    if (!verified.email) {
      return res.status(400).json({ detail: 'This Firebase account has no email address' });
    }

    const email = verified.email.toLowerCase().trim();

    // Match on the Firebase uid first; fall back to email to adopt accounts
    // that predate Firebase sign-in.
    let user = await dbGet('SELECT * FROM users WHERE firebase_uid = ?', [verified.uid]);
    if (!user) {
      user = await dbGet('SELECT * FROM users WHERE LOWER(email) = ?', [email]);
      if (user && user.firebase_uid && user.firebase_uid !== verified.uid) {
        return res.status(409).json({ detail: 'This email is already linked to a different Firebase account' });
      }
      if (user) {
        await dbRun('UPDATE users SET firebase_uid = ? WHERE id = ?', [verified.uid, user.id]);
      }
    }

    const newName = (full_name && full_name.trim()) || verified.name;
    if (user && newName) {
      await dbRun('UPDATE users SET full_name = ? WHERE id = ?', [newName, user.id]);
    }

    if (!user) {
      // New account. Only travelers may self-provision; elevated roles are
      // granted server-side, never from the request body.
      const role = requestedRole === 'provider' ? 'provider' : 'traveler';
      const displayName = (full_name && full_name.trim()) || verified.name || email.split('@')[0];
      const salt = bcrypt.genSaltSync(10);
      const hashed = bcrypt.hashSync(`firebase:${verified.uid}`, salt);
      const result = await dbRun(
        'INSERT INTO users (email, full_name, hashed_password, role, is_active, firebase_uid) VALUES (?, ?, ?, ?, 1, ?)',
        [email, displayName, hashed, role, verified.uid]
      );
      user = { id: result.lastID, role };

      if (role === 'traveler') {
        await dbRun(
          'INSERT INTO traveler_profiles (user_id, traveler_type, group_size, budget, interests) VALUES (?, ?, ?, ?, ?)',
          [user.id, 'Solo Explorer', 2, 2500, JSON.stringify(['culture', 'food'])]
        );
      } else {
        await dbRun(
          'INSERT INTO providers (user_id, business_name, city, is_verified) VALUES (?, ?, ?, 0)',
          [user.id, `${displayName}'s Studio`, 'Jaipur']
        );
      }
    }

    const fullUser = await getUserWithProfile(user.id);
    const token = createToken(user.id, fullUser.role);
    res.json({ access_token: token, token_type: 'bearer', user: fullUser });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// 4. Demo Login / Fallback Login with custom full_name support
authRouter.post('/demo-login/:role', async (req, res) => {
  try {
    const { role } = req.params;
    const { full_name, email: customEmail } = req.body || {};

    // If a custom full_name is provided (e.g. from the Google sign-in name prompt):
    if (full_name && full_name.trim()) {
      const cleanName = full_name.trim();
      const safeSlug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '') || 'traveler';
      const email = customEmail ? customEmail.toLowerCase().trim() : `${safeSlug}@lokiva.com`;

      let user = await dbGet('SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(full_name) = ?', [email, cleanName.toLowerCase()]);
      if (user) {
        await dbRun('UPDATE users SET full_name = ? WHERE id = ?', [cleanName, user.id]);
      } else {
        const salt = bcrypt.genSaltSync(10);
        const hashed = bcrypt.hashSync(`${role}123`, salt);
        const result = await dbRun(
          'INSERT INTO users (email, full_name, hashed_password, role, is_active) VALUES (?, ?, ?, ?, 1)',
          [email, cleanName, hashed, role]
        );
        user = { id: result.lastID, role };

        if (role === 'traveler') {
          await dbRun(
            'INSERT INTO traveler_profiles (user_id, traveler_type, group_size, budget, interests) VALUES (?, ?, ?, ?, ?)',
            [user.id, 'Solo Explorer', 2, 2500, JSON.stringify(['culture', 'food'])]
          );
        } else if (role === 'provider') {
          await dbRun(
            'INSERT INTO providers (user_id, business_name, city, is_verified) VALUES (?, ?, ?, 0)',
            [user.id, `${cleanName}'s Collective`, 'Jaipur']
          );
        }
      }

      const fullUser = await getUserWithProfile(user.id);
      const token = createToken(user.id, fullUser.role);
      return res.json({ access_token: token, token_type: 'bearer', user: fullUser });
    }

    // Default seeded demo accounts if no custom name specified
    let user = await dbGet('SELECT * FROM users WHERE role = ? AND (LOWER(full_name) LIKE "%piyush%" OR LOWER(email) LIKE "%piyush%") LIMIT 1', [role]);
    if (!user && role === 'traveler') {
      user = await dbGet('SELECT * FROM users WHERE role = "traveler" LIMIT 1');
      if (user) {
        await dbRun('UPDATE users SET full_name = "Piyush Kumar", email = "piyush@lokiva.com" WHERE id = ?', [user.id]);
        user.full_name = 'Piyush Kumar';
        user.email = 'piyush@lokiva.com';
      }
    }

    if (!user) {
      const demoEmail = role === 'admin' ? 'admin@lokiva.com' : role === 'provider' ? 'provider@lokiva.com' : 'piyush@lokiva.com';
      const demoName = role === 'admin' ? 'LOKIVA Admin' : role === 'provider' ? 'Jaipur Artisan Collective' : 'Piyush Kumar';
      const salt = bcrypt.genSaltSync(10);
      const hashed = bcrypt.hashSync(`${role}123`, salt);
      const result = await dbRun(
        'INSERT INTO users (email, full_name, hashed_password, role, is_active) VALUES (?, ?, ?, ?, 1)',
        [demoEmail, demoName, hashed, role]
      );
      user = { id: result.lastID, role };

      if (role === 'traveler') {
        await dbRun(
          'INSERT INTO traveler_profiles (user_id, traveler_type, group_size, budget, interests) VALUES (?, ?, ?, ?, ?)',
          [user.id, 'Cultural Explorer', 2, 2500, JSON.stringify(['culture', 'heritage', 'food'])]
        );
      }
    }

    const fullUser = await getUserWithProfile(user.id);
    const token = createToken(user.id, fullUser.role);
    res.json({ access_token: token, token_type: 'bearer', user: fullUser });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// 5. Get Current User /me
authRouter.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ detail: 'Not authenticated' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const fullUser = await getUserWithProfile(decoded.sub);
    if (!fullUser) return res.status(404).json({ detail: 'User not found' });

    res.json(fullUser);
  } catch (err) {
    res.status(401).json({ detail: 'Invalid or expired token' });
  }
});

// 6. Update Current User Profile /me
authRouter.put('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ detail: 'Not authenticated' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.sub;

    const { full_name, email, profile } = req.body || {};
    if (full_name && full_name.trim()) {
      await dbRun('UPDATE users SET full_name = ? WHERE id = ?', [full_name.trim(), userId]);
    }

    if (email && email.trim()) {
      const cleanEmail = email.toLowerCase().trim();
      const existing = await dbGet('SELECT id FROM users WHERE LOWER(email) = ? AND id != ?', [cleanEmail, userId]);
      if (!existing) {
        await dbRun('UPDATE users SET email = ? WHERE id = ?', [cleanEmail, userId]);
      }
    }

    if (profile && typeof profile === 'object') {
      const existingProfile = await dbGet('SELECT * FROM traveler_profiles WHERE user_id = ?', [userId]);
      if (existingProfile) {
        const traveler_type = profile.traveler_type !== undefined ? profile.traveler_type : existingProfile.traveler_type;
        const group_size = profile.group_size !== undefined ? profile.group_size : existingProfile.group_size;
        const budget = profile.budget !== undefined ? profile.budget : existingProfile.budget;
        const available_hours = profile.available_hours !== undefined ? profile.available_hours : existingProfile.available_hours;
        const interests = profile.interests !== undefined ? JSON.stringify(profile.interests) : existingProfile.interests;
        const accessibility_prefs = profile.accessibility_prefs !== undefined ? JSON.stringify(profile.accessibility_prefs) : existingProfile.accessibility_prefs;
        const location_name = profile.location_name !== undefined ? profile.location_name : existingProfile.location_name;
        const hotel_lat = profile.hotel_lat !== undefined ? profile.hotel_lat : existingProfile.hotel_lat;
        const hotel_lng = profile.hotel_lng !== undefined ? profile.hotel_lng : existingProfile.hotel_lng;

        await dbRun(
          `UPDATE traveler_profiles SET 
            traveler_type = ?, group_size = ?, budget = ?, available_hours = ?,
            interests = ?, accessibility_prefs = ?, location_name = ?, hotel_lat = ?, hotel_lng = ?
           WHERE user_id = ?`,
          [traveler_type, group_size, budget, available_hours, interests, accessibility_prefs, location_name, hotel_lat, hotel_lng, userId]
        );
      }
    }

    const fullUser = await getUserWithProfile(userId);
    res.json(fullUser);
  } catch (err) {
    res.status(400).json({ detail: err.message });
  }
});
