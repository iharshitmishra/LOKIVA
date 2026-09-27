import { dbRun, dbGet, dbAll, initDb } from './db.js';

export async function seedProviderWorkspaceData() {
  await initDb();
  console.log('Seeding rich B2B Provider Workspace data...');

  // 1. Update / Ensure Provider 1 exists with enterprise profile
  const provider = await dbGet('SELECT * FROM providers WHERE id = 1');
  if (provider) {
    await dbRun(`
      UPDATE providers SET
        business_name = 'Heritage Horizons & Local Trails Collective',
        provider_type = 'Tour & Cultural Experience Operator',
        tagline = 'Authentic local immersion led by verified master hosts and storytellers.',
        description = 'Curated heritage walks, artisan workshops, and authentic regional culinary masterclasses across Mumbai, Jaipur, and Varanasi.',
        contact_email = 'contact@heritagehorizons.in',
        phone = '+91 98201 44521',
        city = 'Mumbai',
        state = 'Maharashtra',
        address = 'Shop 14, Chuim Village, Dr. Ambedkar Road, Bandra West',
        website = 'https://heritagehorizons.lokiva.in',
        languages_spoken = '["English", "Hindi", "Marathi", "Gujarati"]',
        certifications = '["Ministry of Tourism Certified Host", "Safe Travel Protocol Verified", "Level-2 Cultural Guide Badge"]',
        social_links = '{"instagram": "https://instagram.com/heritagehorizons", "facebook": "https://facebook.com/heritagehorizons"}',
        settlement_account = 'HDFC Bank · IFSC: HDFC0001842 · A/C Ending in 8842',
        is_verified = 1,
        verification_status = 'verified',
        rating = 4.92,
        review_count = 48,
        logo_url = 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=300&q=80',
        cover_image_url = 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=80'
      WHERE id = 1
    `);
  }

  // 2. Enhance Experiences for Provider 1
  const exps = await dbAll('SELECT id, title, price, approx_duration_mins, max_capacity FROM experiences WHERE provider_id = 1 OR provider_id IS NULL LIMIT 6');
  for (const exp of exps) {
    await dbRun(`
      UPDATE experiences SET
        provider_id = 1,
        inclusions = '["Expert Licensed Guide", "Tasting Sampler / Refreshments", "Heritage Booklet & Digital Map", "All Venue Entry Fees"]',
        exclusions = '["Hotel Pick-up and Drop", "Alcoholic Beverages", "Personal Souvenirs"]',
        requirements = '["Moderate walking fitness required (approx 2.5 km)", "Appropriate modest attire for sacred shrines"]',
        things_to_carry = '["Refillable water bottle", "Comfortable walking shoes", "Sun protection / Cap", "Government Photo ID"]',
        status = 'published',
        meeting_point = 'St. Andrew Church Gate, Hill Road, Bandra West, Mumbai'
      WHERE id = ?
    `, [exp.id]);
  }

  // 3. Clear existing demo bookings and seed rich dataset
  await dbRun('DELETE FROM bookings WHERE provider_id = 1');
  
  const sampleBookings = [
    {
      code: 'LOK-2026-8812',
      expId: exps[0]?.id || 1,
      name: 'Priya Sharma',
      email: 'priya.sharma@gmail.com',
      phone: '+91 98334 11204',
      size: 2,
      adults: 2,
      children: 0,
      date: '2026-09-28',
      slot: '09:00 AM',
      price: 1800,
      status: 'confirmed',
      payout: 'pending',
      req: 'One guest is a photographer, would appreciate good vantage stops.'
    },
    {
      code: 'LOK-2026-8813',
      expId: exps[1]?.id || 2,
      name: 'Rohan Iyer',
      email: 'rohan.iyer@outlook.com',
      phone: '+91 98205 99341',
      size: 4,
      adults: 3,
      children: 1,
      date: '2026-09-29',
      slot: '02:30 PM',
      price: 3200,
      status: 'pending',
      payout: 'pending',
      req: 'Travelling with senior mother; requesting step-free seating where possible.'
    },
    {
      code: 'LOK-2026-8814',
      expId: exps[2]?.id || 3,
      name: 'Michael Davies',
      email: 'm.davies@traveler.co.uk',
      phone: '+44 7911 123456',
      size: 2,
      adults: 2,
      children: 0,
      date: '2026-09-27',
      slot: '10:00 AM',
      price: 2400,
      status: 'confirmed',
      payout: 'pending',
      req: 'English speaking guide required.'
    },
    {
      code: 'LOK-2026-8815',
      expId: exps[0]?.id || 1,
      name: 'Ananya Sen',
      email: 'ananya.sen@gmail.com',
      phone: '+91 99100 44291',
      size: 3,
      adults: 3,
      children: 0,
      date: '2026-09-24',
      slot: '09:00 AM',
      price: 2700,
      status: 'completed',
      payout: 'settled',
      req: 'Celebrating wedding anniversary.'
    },
    {
      code: 'LOK-2026-8816',
      expId: exps[1]?.id || 2,
      name: 'Rajesh & Sangeeta Patel',
      email: 'patel.family@gmail.com',
      phone: '+91 97241 88310',
      size: 5,
      adults: 4,
      children: 1,
      date: '2026-09-23',
      slot: '04:00 PM',
      price: 4500,
      status: 'completed',
      payout: 'settled',
      req: 'Strictly vegetarian Jain diet.'
    },
    {
      code: 'LOK-2026-8817',
      expId: exps[0]?.id || 1,
      name: 'Emily Thorne',
      email: 'emily.thorne@nyu.edu',
      phone: '+1 212 555 0192',
      size: 1,
      adults: 1,
      children: 0,
      date: '2026-09-22',
      slot: '09:00 AM',
      price: 900,
      status: 'completed',
      payout: 'settled',
      req: 'Architecture graduate student.'
    },
    {
      code: 'LOK-2026-8818',
      expId: exps[2]?.id || 3,
      name: 'Vikram Singhania',
      email: 'vikram.singhania@corp.in',
      phone: '+91 98110 99482',
      size: 6,
      adults: 6,
      children: 0,
      date: '2026-10-02',
      slot: '11:00 AM',
      price: 5400,
      status: 'pending',
      payout: 'pending',
      req: 'Corporate offsite team building.'
    },
    {
      code: 'LOK-2026-8819',
      expId: exps[0]?.id || 1,
      name: 'Karan Malhotra',
      email: 'karan.m@gmail.com',
      phone: '+91 98200 11993',
      size: 2,
      adults: 2,
      children: 0,
      date: '2026-09-21',
      slot: '09:00 AM',
      price: 1800,
      status: 'cancelled',
      payout: 'cancelled',
      req: 'Guest had flight rescheduling.'
    },
    {
      code: 'LOK-2026-8820',
      expId: exps[1]?.id || 2,
      name: 'Nisha Verma',
      email: 'nisha.verma@techhub.in',
      phone: '+91 98450 77219',
      size: 2,
      adults: 2,
      children: 0,
      date: '2026-09-30',
      slot: '03:00 PM',
      price: 1800,
      status: 'confirmed',
      payout: 'pending',
      req: 'First time visiting Mumbai.'
    },
    {
      code: 'LOK-2026-8821',
      expId: exps[0]?.id || 1,
      name: 'David Wilson',
      email: 'david.wilson@sydney.au',
      phone: '+61 411 234 567',
      size: 2,
      adults: 2,
      children: 0,
      date: '2026-10-04',
      slot: '09:00 AM',
      price: 1800,
      status: 'confirmed',
      payout: 'pending',
      req: 'Interested in street art and photography spots.'
    },
    {
      code: 'LOK-2026-8822',
      expId: exps[2]?.id || 3,
      name: 'Deepak Chhabra',
      email: 'deepak.c@ventures.in',
      phone: '+91 98101 22345',
      size: 3,
      adults: 3,
      children: 0,
      date: '2026-09-18',
      slot: '10:00 AM',
      price: 2700,
      status: 'completed',
      payout: 'settled',
      req: 'Repeat traveler.'
    },
    {
      code: 'LOK-2026-8823',
      expId: exps[1]?.id || 2,
      name: 'Shreya & Siddharth Joshi',
      email: 'shreya.joshi@pune.ac.in',
      phone: '+91 99220 33418',
      size: 2,
      adults: 2,
      children: 0,
      date: '2026-10-05',
      slot: '05:00 PM',
      price: 2000,
      status: 'confirmed',
      payout: 'pending',
      req: 'Sunset photography session.'
    }
  ];

  for (const b of sampleBookings) {
    const commission = Number((b.price * 0.10).toFixed(2));
    const net = b.price - commission;
    await dbRun(`
      INSERT INTO bookings (
        booking_code, provider_id, experience_id, guest_name, guest_email, guest_phone,
        party_size, adults_count, children_count, booking_date, time_slot,
        total_price, commission_rate, commission_amount, net_payout,
        currency, status, payout_status, special_requests, created_at
      ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.10, ?, ?, 'INR', ?, ?, ?, datetime('now', '-2 days'))
    `, [
      b.code, b.expId, b.name, b.email, b.phone,
      b.size, b.adults, b.children, b.date, b.slot,
      b.price, commission, net, b.status, b.payout, b.req
    ]);
  }

  // 4. Seed Customers CRM
  await dbRun('DELETE FROM provider_customers WHERE provider_id = 1');
  const customers = [
    { name: 'Priya Sharma', email: 'priya.sharma@gmail.com', phone: '+91 98334 11204', bookings: 2, spend: 3600, first: '2026-07-12', last: '2026-09-28', notes: 'Loves architectural photography and heritage documentation.' },
    { name: 'Rohan Iyer', email: 'rohan.iyer@outlook.com', phone: '+91 98205 99341', bookings: 1, spend: 3200, first: '2026-09-29', last: '2026-09-29', notes: 'Requires step-free seating for family members.' },
    { name: 'Michael Davies', email: 'm.davies@traveler.co.uk', phone: '+44 7911 123456', bookings: 1, spend: 2400, first: '2026-09-27', last: '2026-09-27', notes: 'UK architectural tourist.' },
    { name: 'Ananya Sen', email: 'ananya.sen@gmail.com', phone: '+91 99100 44291', bookings: 3, spend: 6100, first: '2026-04-10', last: '2026-09-24', notes: 'Frequent VIP guest. Always leaves 5-star reviews.' },
    { name: 'Rajesh & Sangeeta Patel', email: 'patel.family@gmail.com', phone: '+91 97241 88310', bookings: 2, spend: 7200, first: '2026-05-18', last: '2026-09-23', notes: 'Strictly Jain dietary preferences.' },
    { name: 'Vikram Singhania', email: 'vikram.singhania@corp.in', phone: '+91 98110 99482', bookings: 2, spend: 9800, first: '2026-06-20', last: '2026-10-02', notes: 'Corporate client organizer.' },
    { name: 'Deepak Chhabra', email: 'deepak.c@ventures.in', phone: '+91 98101 22345', bookings: 4, spend: 10800, first: '2026-02-14', last: '2026-09-18', notes: 'Angel investor and cultural patron.' }
  ];

  for (const c of customers) {
    await dbRun(`
      INSERT INTO provider_customers (
        provider_id, customer_name, customer_email, customer_phone,
        total_bookings, total_spend, first_booking_date, last_booking_date, notes
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [c.name, c.email, c.phone, c.bookings, c.spend, c.first, c.last, c.notes]);
  }

  // 5. Seed Provider Availability Calendar
  await dbRun('DELETE FROM provider_availability WHERE provider_id = 1');
  const targetExpId = exps[0]?.id || 1;
  const daysInCycle = 14;
  for (let d = 0; d < daysInCycle; d++) {
    const dateObj = new Date();
    dateObj.setDate(dateObj.getDate() + d);
    const dateStr = dateObj.toISOString().split('T')[0];

    // Slot 1: Morning
    await dbRun(`
      INSERT OR REPLACE INTO provider_availability (
        provider_id, experience_id, date, time_slot, capacity, booked_count, is_blocked, price_override
      ) VALUES (1, ?, ?, '09:00 AM', 10, ?, 0, NULL)
    `, [targetExpId, dateStr, d % 3 === 0 ? 6 : (d % 2 === 0 ? 3 : 0)]);

    // Slot 2: Afternoon
    const isMaintenance = d === 5; // Day 5 blocked for maintenance
    await dbRun(`
      INSERT OR REPLACE INTO provider_availability (
        provider_id, experience_id, date, time_slot, capacity, booked_count, is_blocked, price_override
      ) VALUES (1, ?, ?, '03:30 PM', 8, ?, ?, NULL)
    `, [targetExpId, dateStr, isMaintenance ? 0 : 2, isMaintenance ? 1 : 0]);
  }

  // 6. Seed Promotional Offers
  await dbRun('DELETE FROM provider_offers WHERE provider_id = 1');
  await dbRun(`
    INSERT INTO provider_offers (
      provider_id, experience_id, title, offer_type, discount_percent, promo_code,
      start_date, end_date, min_guests, usage_limit, used_count, is_active
    ) VALUES 
    (1, NULL, 'Early Bird October Heritage Walk', 'early_bird', 15, 'EARLYBIRD15', '2026-09-25', '2026-10-31', 2, 50, 14, 1),
    (1, NULL, 'Weekend Explorer Flash Pass', 'weekend', 20, 'WEEKEND20', '2026-09-26', '2026-10-15', 1, 30, 8, 1),
    (1, NULL, 'Festival Cultural Gathering Deal', 'festival', 25, 'FESTIVE25', '2026-10-10', '2026-11-05', 4, 25, 0, 1)
  `);

  // 7. Seed Reviews with Ratings & Unanswered States
  await dbRun('DELETE FROM reviews WHERE experience_id IN (SELECT id FROM experiences WHERE provider_id = 1)');
  const reviewsSeed = [
    { expId: exps[0]?.id || 1, rating: 5, title: 'Incredible depth of Mumbai history!', comment: 'Rohan our guide was sensational. Took us through Chuim and Ranwar villages with genuine local residents waving hello. The Irani bun maska stop was sublime.' },
    { expId: exps[0]?.id || 1, rating: 5, title: 'Best heritage tour in Bandra', comment: 'Passionate storytelling, respectful community engagement, and great photo stops. Worth every rupee.' },
    { expId: exps[1]?.id || 2, rating: 4, title: 'Delicious authentic food walk', comment: 'Loved the kothimbir vadi and the story behind the family hearth recipes. Wish it was 30 minutes longer!' },
    { expId: exps[2]?.id || 3, rating: 5, title: 'Hands-on pottery was therapeutic', comment: 'The master artisan was patient and gifted. Took home my own glazed terracotta bowl.' },
    { expId: exps[0]?.id || 1, rating: 3, title: 'Good tour but started 15 mins late', comment: 'The meeting point was slightly confusing because of street construction, but the walk itself was rich and insightful.' }
  ];

  for (const r of reviewsSeed) {
    await dbRun(`
      INSERT INTO reviews (experience_id, user_id, rating, title, comment, created_at)
      VALUES (?, 1, ?, ?, ?, datetime('now', '-3 days'))
    `, [r.expId, r.rating, r.title, r.comment]);
  }

  // 8. Seed Notifications Feed
  await dbRun('DELETE FROM provider_notifications WHERE provider_id = 1');
  await dbRun(`
    INSERT INTO provider_notifications (provider_id, category, title, message, link_url, is_read, created_at)
    VALUES
    (1, 'booking', 'New Booking Received (#LOK-2026-8812)', 'Priya Sharma booked 2 seats for Ranwar Village Indo-Portuguese Walk.', '/provider/bookings', 0, datetime('now', '-10 minutes')),
    (1, 'review', 'New 5-Star Review Received', 'Michael Davies left a 5-star review: "Incredible depth of Mumbai history!"', '/provider/reviews', 0, datetime('now', '-2 hours')),
    (1, 'payout', 'Weekly Payout Settled: ₹11,900', 'Transfer completed to your HDFC Bank account ending in 8842.', '/provider/earnings', 1, datetime('now', '-1 day')),
    (1, 'system', 'KYC Level-2 Verification Approved', 'Your business documents have been verified by the LOKIVA compliance team.', '/provider/verification', 1, datetime('now', '-3 days'))
  `);

  // 9. Seed Verification Documents
  await dbRun('DELETE FROM provider_verification WHERE provider_id = 1');
  await dbRun(`
    INSERT INTO provider_verification (provider_id, document_type, document_number, document_file_url, status, reviewer_notes, submitted_at, reviewed_at)
    VALUES
    (1, 'business_pan', 'AABCH7821K', 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80', 'approved', 'Verified against NSDL database.', datetime('now', '-10 days'), datetime('now', '-9 days')),
    (1, 'gst_cert', '27AABCH7821K1ZM', 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80', 'approved', 'GSTIN active and verified.', datetime('now', '-10 days'), datetime('now', '-9 days')),
    (1, 'id_proof', 'Aadhaar · XXXX-XXXX-9912', 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80', 'approved', 'Identity verified.', datetime('now', '-10 days'), datetime('now', '-9 days'))
  `);

  console.log('Successfully seeded rich B2B Provider Workspace data!');
}

// Allow standalone execution
if (process.argv[1]?.includes('seedProviderData')) {
  seedProviderWorkspaceData().then(() => process.exit(0)).catch((e) => {
    console.error('Seed provider data failed:', e);
    process.exit(1);
  });
}
