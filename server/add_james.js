/**
 * add_james.js — Adds researcher James Fernandez (james@aquatrack.org)
 * back to MongoDB Atlas with full Indian-reef activity data.
 * Run once: node server/add_james.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User        = require('./models/User');
const Site        = require('./models/Site');
const Survey      = require('./models/Survey');
const Species     = require('./models/Species');
const Restoration = require('./models/Restoration');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB Atlas');

  /* ── 1. Create or restore the James user ── */
  let james = await User.findOne({ email: 'james@aquatrack.org' });
  if (james) {
    console.log('ℹ️  james@aquatrack.org already exists — updating password to researcher123');
    // Force-re-hash by modifying the password field
    james.password = 'researcher123';
    james.name     = 'James Fernandez';
    james.role     = 'researcher';
    james = await james.save();   // pre-save hook hashes the password
  } else {
    james = await User.create({
      name:     'James Fernandez',
      email:    'james@aquatrack.org',
      password: 'researcher123',
      role:     'researcher',
    });
    console.log('✅ Created researcher: james@aquatrack.org  password: researcher123');
  }

  /* ── 2. Pick real Indian site IDs from DB ── */
  const sites = await Site.find({ isForeignLegacy: { $ne: true } }).lean();
  if (sites.length < 3) {
    console.warn('⚠️  Not enough Indian sites in DB — run seed.js first');
    process.exit(1);
  }

  const byRegion = (r) => sites.find(s => s.region === r) || sites[0];
  const mannar   = byRegion('Gulf of Mannar');
  const lakshadw = byRegion('Lakshadweep');
  const andaman  = byRegion('Andaman & Nicobar Islands');
  const kachchh  = byRegion('Gulf of Kachchh');

  /* ── 3. Surveys (only if not already seeded for James) ── */
  const existingSurveyCount = await Survey.countDocuments({ surveyedBy: james._id });
  if (existingSurveyCount === 0) {
    const surveys = [
      {
        location: 'Gulf of Mannar — Kurusadai Island Transect',
        region: 'Gulf of Mannar',
        gpsLat: 9.298, gpsLng: 79.213,
        depth: 6, coralCoverPercent: 47, bleachingPercent: 9,
        date: new Date('2026-03-12'),
        siteId: mannar._id, surveyedBy: james._id,
        status: 'verified', isForeignLegacy: false, country: 'India',
        notes: 'High Acropora density, minimal bleaching stress. Porites colonies intact.',
        photoUrl: '',
      },
      {
        location: 'Lakshadweep — Agatti Island South Slope',
        region: 'Lakshadweep',
        gpsLat: 10.839, gpsLng: 72.178,
        depth: 12, coralCoverPercent: 58, bleachingPercent: 6,
        date: new Date('2026-04-03'),
        siteId: lakshadw._id, surveyedBy: james._id,
        status: 'verified', isForeignLegacy: false, country: 'India',
        notes: 'Pristine outer reef. Staghorn and table corals dominant.',
        photoUrl: '',
      },
      {
        location: 'Andaman — Havelock Island Reef Flat',
        region: 'Andaman & Nicobar Islands',
        gpsLat: 11.989, gpsLng: 92.984,
        depth: 8, coralCoverPercent: 39, bleachingPercent: 22,
        date: new Date('2026-05-18'),
        siteId: andaman._id, surveyedBy: james._id,
        status: 'verified', isForeignLegacy: false, country: 'India',
        notes: 'Moderate bleaching observed on shallow acroporids. Porites unaffected at 6–8 m.',
        photoUrl: '',
      },
      {
        location: 'Gulf of Mannar — Keezhakkarai Reef Belt',
        region: 'Gulf of Mannar',
        gpsLat: 9.225, gpsLng: 78.967,
        depth: 5, coralCoverPercent: 33, bleachingPercent: 31,
        date: new Date('2026-06-07'),
        siteId: mannar._id, surveyedBy: james._id,
        status: 'pending', isForeignLegacy: false, country: 'India',
        notes: 'Significant bleaching detected. SST anomaly +1.8°C vs baseline. Immediate alert filed.',
        photoUrl: '',
      },
      {
        location: 'Lakshadweep — Kavaratti Outer Reef',
        region: 'Lakshadweep',
        gpsLat: 10.560, gpsLng: 72.618,
        depth: 15, coralCoverPercent: 62, bleachingPercent: 5,
        date: new Date('2026-07-14'),
        siteId: lakshadw._id, surveyedBy: james._id,
        status: 'verified', isForeignLegacy: false, country: 'India',
        notes: 'Excellent coral cover. Deep-water encrusting corals dominate lower slope.',
        photoUrl: '',
      },
      {
        location: 'Gulf of Kachchh — Pirotan Island Reef',
        region: 'Gulf of Kachchh',
        gpsLat: 22.608, gpsLng: 70.025,
        depth: 4, coralCoverPercent: 24, bleachingPercent: 14,
        date: new Date('2026-08-20'),
        siteId: kachchh._id, surveyedBy: james._id,
        status: 'pending', isForeignLegacy: false, country: 'India',
        notes: 'Turbidity high. Coral cover lower than expected — physical stress from sedimentation.',
        photoUrl: '',
      },
    ];

    await Survey.insertMany(surveys);
    console.log(`✅ Inserted ${surveys.length} surveys for James`);
  } else {
    console.log(`ℹ️  Surveys already exist for James (${existingSurveyCount}) — skipping`);
  }

  /* ── 4. Species sightings ── */
  const existingSpeciesCount = await Species.countDocuments({
    location: { $regex: 'James|Kurusadai|Agatti|Havelock|Kavaratti|Keezhakkarai' }
  });
  if (existingSpeciesCount === 0) {
    const speciesList = [
      {
        name: 'Acropora hyacinthus',
        type: 'coral',
        location: 'Gulf of Mannar — Kurusadai Island',
        sightingDate: new Date('2026-03-12'),
        count: 34,
        siteId: mannar._id,
        isForeignLegacy: false,
        country: 'India',
      },
      {
        name: 'Porites lobata',
        type: 'coral',
        location: 'Lakshadweep — Agatti Island South',
        sightingDate: new Date('2026-04-03'),
        count: 51,
        siteId: lakshadw._id,
        isForeignLegacy: false,
        country: 'India',
      },
      {
        name: 'Balistoides viridescens (Titan Triggerfish)',
        type: 'fish',
        location: 'Andaman — Havelock Island Reef Flat',
        sightingDate: new Date('2026-05-18'),
        count: 7,
        siteId: andaman._id,
        isForeignLegacy: false,
        country: 'India',
      },
      {
        name: 'Tridacna maxima (Giant Clam)',
        type: 'invertebrate',
        location: 'Lakshadweep — Kavaratti Outer Reef',
        sightingDate: new Date('2026-07-14'),
        count: 12,
        siteId: lakshadw._id,
        isForeignLegacy: false,
        country: 'India',
      },
      {
        name: 'Goniopora lobata',
        type: 'coral',
        location: 'Gulf of Mannar — Keezhakkarai Reef Belt',
        sightingDate: new Date('2026-06-07'),
        count: 18,
        siteId: mannar._id,
        isForeignLegacy: false,
        country: 'India',
      },
    ];

    await Species.insertMany(speciesList);
    console.log(`✅ Inserted ${speciesList.length} species sightings linked to James survey locations`);
  } else {
    console.log(`ℹ️  Species sightings already exist for James locations (${existingSpeciesCount}) — skipping`);
  }


  /* ── 5. Restoration plot ── */
  const existingRestorationCount = await Restoration.countDocuments({ loggedBy: james._id });
  if (existingRestorationCount === 0) {
    await Restoration.create({
      siteName: 'Agatti Island Coral Nursery — Block J',
      coralSpecies: 'Acropora muricata',
      datePlanted: new Date('2026-04-10'),
      survivalRatePercent: 81,
      siteId: lakshadw._id,
      loggedBy: james._id,
      isForeignLegacy: false,
      country: 'India',
    });
    console.log('✅ Inserted 1 restoration plot for James');
  } else {
    console.log(`ℹ️  Restoration plots already exist for James (${existingRestorationCount}) — skipping`);
  }


  /* ── 6. Final verification ── */
  const finalUser    = await User.findOne({ email: 'james@aquatrack.org' }).select('-password').lean();
  const surveyCount  = await Survey.countDocuments({ surveyedBy: james._id });
  const speciesCount = await Species.countDocuments({ loggedBy: james._id });
  const restCount    = await Restoration.countDocuments({ loggedBy: james._id });

  console.log('\n══════════════════════════════════════════');
  console.log('  JAMES FERNANDEZ — ATLAS VERIFICATION');
  console.log('══════════════════════════════════════════');
  console.log(`  Name      : ${finalUser.name}`);
  console.log(`  Email     : ${finalUser.email}`);
  console.log(`  Role      : ${finalUser.role}`);
  console.log(`  ID        : ${finalUser._id}`);
  console.log(`  Password  : researcher123 (bcrypt-hashed)`);
  console.log(`  Surveys   : ${surveyCount}`);
  console.log(`  Species   : ${speciesCount}`);
  console.log(`  Restoration: ${restCount}`);
  console.log('══════════════════════════════════════════');
  console.log('\n✅ Login: james@aquatrack.org / researcher123\n');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
