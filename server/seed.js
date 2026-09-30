const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Survey = require('./models/Survey');
const Species = require('./models/Species');
const Restoration = require('./models/Restoration');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Survey.deleteMany({});
    await Species.deleteMany({});
    await Restoration.deleteMany({});
    console.log('Cleared existing data');

    // ── Users ──
    const users = await User.create([
      {
        name: 'Dr. Marina Reyes',
        email: 'admin@aquatrack.org',
        password: 'admin123',
        role: 'admin'
      },
      {
        name: 'James Coral',
        email: 'james@aquatrack.org',
        password: 'researcher123',
        role: 'researcher'
      },
      {
        name: 'Priya Nair',
        email: 'priya@aquatrack.org',
        password: 'researcher123',
        role: 'researcher'
      },
      {
        name: 'Guest Viewer',
        email: 'guest@aquatrack.org',
        password: 'guest123',
        role: 'public'
      }
    ]);

    const admin = users[0];
    const researcher1 = users[1];
    const researcher2 = users[2];

    console.log('Created users');

    // ── Surveys ──
    const surveys = await Survey.create([
      {
        location: 'Great Barrier Reef — Osprey Reef',
        gpsLat: -13.88,
        gpsLng: 146.56,
        depth: 12,
        coralCoverPercent: 62,
        bleachingPercent: 8,
        surveyedBy: researcher1._id,
        date: new Date('2025-01-15'),
        status: 'verified'
      },
      {
        location: 'Great Barrier Reef — Lizard Island',
        gpsLat: -14.67,
        gpsLng: 145.46,
        depth: 8,
        coralCoverPercent: 45,
        bleachingPercent: 22,
        surveyedBy: researcher1._id,
        date: new Date('2025-02-10'),
        status: 'verified'
      },
      {
        location: 'Coral Triangle — Raja Ampat',
        gpsLat: -1.07,
        gpsLng: 130.88,
        depth: 15,
        coralCoverPercent: 78,
        bleachingPercent: 3,
        surveyedBy: researcher2._id,
        date: new Date('2025-03-05'),
        status: 'verified'
      },
      {
        location: 'Maldives — Baa Atoll',
        gpsLat: 5.28,
        gpsLng: 73.00,
        depth: 10,
        coralCoverPercent: 38,
        bleachingPercent: 35,
        surveyedBy: researcher1._id,
        date: new Date('2025-04-12'),
        status: 'verified'
      },
      {
        location: 'Red Sea — Ras Mohammed',
        gpsLat: 27.73,
        gpsLng: 34.25,
        depth: 18,
        coralCoverPercent: 71,
        bleachingPercent: 5,
        surveyedBy: researcher2._id,
        date: new Date('2025-05-20'),
        status: 'verified'
      },
      {
        location: 'Caribbean — Belize Barrier Reef',
        gpsLat: 17.32,
        gpsLng: -87.53,
        depth: 6,
        coralCoverPercent: 28,
        bleachingPercent: 42,
        surveyedBy: researcher1._id,
        date: new Date('2025-06-08'),
        status: 'verified'
      },
      {
        location: 'Hawaii — Papahānaumokuākea',
        gpsLat: 25.07,
        gpsLng: -171.73,
        depth: 14,
        coralCoverPercent: 55,
        bleachingPercent: 12,
        surveyedBy: researcher2._id,
        date: new Date('2025-07-01'),
        status: 'verified'
      },
      {
        location: 'Andaman Sea — Similan Islands',
        gpsLat: 8.65,
        gpsLng: 97.64,
        depth: 20,
        coralCoverPercent: 49,
        bleachingPercent: 18,
        surveyedBy: researcher1._id,
        date: new Date('2025-08-14'),
        status: 'pending'
      },
      {
        location: 'Fiji — Great Astrolabe Reef',
        gpsLat: -18.83,
        gpsLng: 178.51,
        depth: 11,
        coralCoverPercent: 66,
        bleachingPercent: 7,
        surveyedBy: researcher2._id,
        date: new Date('2025-09-02'),
        status: 'pending'
      },
      {
        location: 'Coral Triangle — Tubbataha Reef',
        gpsLat: 8.92,
        gpsLng: 119.81,
        depth: 16,
        coralCoverPercent: 73,
        bleachingPercent: 4,
        surveyedBy: researcher1._id,
        date: new Date('2025-09-25'),
        status: 'verified'
      }
    ]);

    console.log(`Created ${surveys.length} surveys`);

    // ── Species ──
    const speciesData = await Species.create([
      // Corals
      { name: 'Acropora millepora', type: 'coral', location: 'Great Barrier Reef — Osprey Reef', sightingDate: new Date('2025-01-15'), count: 45, linkedSurvey: surveys[0]._id },
      { name: 'Pocillopora damicornis', type: 'coral', location: 'Coral Triangle — Raja Ampat', sightingDate: new Date('2025-03-05'), count: 32, linkedSurvey: surveys[2]._id },
      { name: 'Porites lobata', type: 'coral', location: 'Hawaii — Papahānaumokuākea', sightingDate: new Date('2025-07-01'), count: 28, linkedSurvey: surveys[6]._id },
      { name: 'Montipora capitata', type: 'coral', location: 'Maldives — Baa Atoll', sightingDate: new Date('2025-04-12'), count: 15, linkedSurvey: surveys[3]._id },
      { name: 'Stylophora pistillata', type: 'coral', location: 'Red Sea — Ras Mohammed', sightingDate: new Date('2025-05-20'), count: 52, linkedSurvey: surveys[4]._id },

      // Fish
      { name: 'Amphiprion ocellaris (Clownfish)', type: 'fish', location: 'Coral Triangle — Raja Ampat', sightingDate: new Date('2025-03-05'), count: 18, linkedSurvey: surveys[2]._id },
      { name: 'Paracanthurus hepatus (Blue Tang)', type: 'fish', location: 'Great Barrier Reef — Lizard Island', sightingDate: new Date('2025-02-10'), count: 24, linkedSurvey: surveys[1]._id },
      { name: 'Cheilinus undulatus (Napoleon Wrasse)', type: 'fish', location: 'Red Sea — Ras Mohammed', sightingDate: new Date('2025-05-20'), count: 3, linkedSurvey: surveys[4]._id },
      { name: 'Rhincodon typus (Whale Shark)', type: 'fish', location: 'Maldives — Baa Atoll', sightingDate: new Date('2025-04-12'), count: 2, linkedSurvey: surveys[3]._id },
      { name: 'Epinephelus lanceolatus (Giant Grouper)', type: 'fish', location: 'Coral Triangle — Tubbataha Reef', sightingDate: new Date('2025-09-25'), count: 5, linkedSurvey: surveys[9]._id },
      { name: 'Chelmon rostratus (Butterflyfish)', type: 'fish', location: 'Andaman Sea — Similan Islands', sightingDate: new Date('2025-08-14'), count: 31, linkedSurvey: surveys[7]._id },

      // Invertebrates
      { name: 'Tridacna gigas (Giant Clam)', type: 'invertebrate', location: 'Coral Triangle — Raja Ampat', sightingDate: new Date('2025-03-05'), count: 8, linkedSurvey: surveys[2]._id },
      { name: 'Linckia laevigata (Blue Starfish)', type: 'invertebrate', location: 'Great Barrier Reef — Osprey Reef', sightingDate: new Date('2025-01-15'), count: 14, linkedSurvey: surveys[0]._id },
      { name: 'Acanthaster planci (Crown-of-Thorns)', type: 'invertebrate', location: 'Great Barrier Reef — Lizard Island', sightingDate: new Date('2025-02-10'), count: 6, linkedSurvey: surveys[1]._id },
      { name: 'Diadema setosum (Sea Urchin)', type: 'invertebrate', location: 'Caribbean — Belize Barrier Reef', sightingDate: new Date('2025-06-08'), count: 22, linkedSurvey: surveys[5]._id },
      { name: 'Holothuria atra (Sea Cucumber)', type: 'invertebrate', location: 'Fiji — Great Astrolabe Reef', sightingDate: new Date('2025-09-02'), count: 11, linkedSurvey: surveys[8]._id }
    ]);

    console.log(`Created ${speciesData.length} species records`);

    // ── Restoration ──
    const restorations = await Restoration.create([
      {
        siteName: 'Osprey Reef Nursery — Block A',
        coralSpecies: 'Acropora millepora',
        datePlanted: new Date('2024-06-15'),
        survivalRatePercent: 82,
        linkedSurvey: surveys[0]._id,
        loggedBy: researcher1._id
      },
      {
        siteName: 'Belize Barrier Recovery Zone',
        coralSpecies: 'Orbicella faveolata',
        datePlanted: new Date('2024-09-20'),
        survivalRatePercent: 64,
        linkedSurvey: surveys[5]._id,
        loggedBy: researcher1._id
      },
      {
        siteName: 'Baa Atoll Coral Garden',
        coralSpecies: 'Montipora capitata',
        datePlanted: new Date('2024-11-01'),
        survivalRatePercent: 45,
        linkedSurvey: surveys[3]._id,
        loggedBy: researcher2._id
      },
      {
        siteName: 'Raja Ampat Fragment Transplant Site',
        coralSpecies: 'Pocillopora damicornis',
        datePlanted: new Date('2025-01-10'),
        survivalRatePercent: 91,
        linkedSurvey: surveys[2]._id,
        loggedBy: researcher2._id
      },
      {
        siteName: 'Similan Islands Restoration Plot',
        coralSpecies: 'Stylophora pistillata',
        datePlanted: new Date('2025-04-05'),
        survivalRatePercent: 73,
        linkedSurvey: surveys[7]._id,
        loggedBy: researcher1._id
      }
    ]);

    console.log(`Created ${restorations.length} restoration records`);

    console.log('\n=== SEED COMPLETE ===');
    console.log('Login credentials:');
    console.log('  Admin:      admin@aquatrack.org / admin123');
    console.log('  Researcher: james@aquatrack.org / researcher123');
    console.log('  Researcher: priya@aquatrack.org / researcher123');
    console.log('  Viewer:     guest@aquatrack.org / guest123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
