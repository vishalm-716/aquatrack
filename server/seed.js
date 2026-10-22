const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Site = require('./models/Site');
const Survey = require('./models/Survey');
const Species = require('./models/Species');
const Restoration = require('./models/Restoration');

const SEED_LABEL = 'Illustrative demo data — not official monitoring observations';

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for idempotent seeding...');

    // ── 1. Ensure Standard Users (Idempotent) ──
    const usersToEnsure = [
      {
        name: 'Dr. Marina Reyes',
        email: 'admin@aquatrack.org',
        password: 'admin123',
        role: 'admin'
      },
      {
        name: 'Arun Varma',
        email: 'arun@aquatrack.org',
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
        name: 'James Fernandez',
        email: 'james@aquatrack.org',
        password: 'researcher123',
        role: 'researcher'
      },
      {
        name: 'Guest Observer',
        email: 'guest@aquatrack.org',
        password: 'guest123',
        role: 'public'
      }
    ];

    const usersMap = {};
    for (const u of usersToEnsure) {
      let existing = await User.findOne({ email: u.email });
      if (!existing) {
        existing = await User.create(u);
        console.log(`Created user: ${u.email} (${u.role})`);
      }
      usersMap[u.email] = existing;
    }

    const admin = usersMap['admin@aquatrack.org'];
    const researcher1 = usersMap['arun@aquatrack.org'];
    const researcher2 = usersMap['priya@aquatrack.org'];


    // ── 2. Indian Reef Sites (Idempotent) ──
    const sitesToSeed = [
      // Gulf of Mannar
      {
        name: 'Gulf of Mannar — Mandapam Reef',
        region: 'Gulf of Mannar',
        stateOrUT: 'Tamil Nadu',
        coordinates: { lat: 9.280, lng: 79.125 },
        depthRange: { min: 2, max: 14 },
        isMarineProtectedArea: true,
        isRestrictedCoordinates: false,
        description: 'Coastal fringing reef within Gulf of Mannar Biosphere Reserve. Patch reefs dominated by Acropora and Porites.',
        isDemo: true
      },
      {
        name: 'Gulf of Mannar — Shingle Island Reef',
        region: 'Gulf of Mannar',
        stateOrUT: 'Tamil Nadu',
        coordinates: { lat: 9.245, lng: 79.238 },
        depthRange: { min: 3, max: 16 },
        isMarineProtectedArea: true,
        isRestrictedCoordinates: false,
        description: 'Offshore island reef zone near Pamban channel with shallow lagoons and micro-fragment nursery tables.',
        isDemo: true
      },
      {
        name: 'Gulf of Mannar — Krusadai Island',
        region: 'Gulf of Mannar',
        stateOrUT: 'Tamil Nadu',
        coordinates: { lat: 9.240, lng: 79.210 },
        depthRange: { min: 1, max: 12 },
        isMarineProtectedArea: true,
        isRestrictedCoordinates: false,
        description: 'Ecologically sensitive island reserve rich in benthic invertebrates and branching coral colonies.',
        isDemo: true
      },

      // Gulf of Kachchh
      {
        name: 'Gulf of Kachchh — Pirotan Island Marine National Park',
        region: 'Gulf of Kachchh',
        stateOrUT: 'Gujarat',
        coordinates: { lat: 22.585, lng: 69.955 },
        depthRange: { min: 1, max: 8 },
        isMarineProtectedArea: true,
        isRestrictedCoordinates: false,
        description: 'High-turbidity tidal reef flats featuring resilient Porites lutea and Favia colonies under extreme macro-tidal variation.',
        isDemo: true
      },
      {
        name: 'Gulf of Kachchh — Narara Reef Flat',
        region: 'Gulf of Kachchh',
        stateOrUT: 'Gujarat',
        coordinates: { lat: 22.465, lng: 69.720 },
        depthRange: { min: 1, max: 6 },
        isMarineProtectedArea: true,
        isRestrictedCoordinates: false,
        description: 'Intertidal coral reef ecosystem where living corals are exposed during low spring tides.',
        isDemo: true
      },

      // Lakshadweep
      {
        name: 'Lakshadweep — Kavaratti Island Atoll',
        region: 'Lakshadweep',
        stateOrUT: 'Lakshadweep',
        coordinates: { lat: 10.567, lng: 72.642 },
        depthRange: { min: 4, max: 28 },
        isMarineProtectedArea: true,
        isRestrictedCoordinates: false,
        description: 'Pristine oceanic atoll ring with western lagoon and seaward fore-reef slope hosting dense Acropora tables.',
        isDemo: true
      },
      {
        name: 'Lakshadweep — Bangaram Atoll & Lagoon',
        region: 'Lakshadweep',
        stateOrUT: 'Lakshadweep',
        coordinates: { lat: 10.940, lng: 72.285 },
        depthRange: { min: 3, max: 25 },
        isMarineProtectedArea: true,
        isRestrictedCoordinates: false,
        description: 'Teardrop-shaped atoll reef system with deep passes and extensive branching coral thickets.',
        isDemo: true
      },
      {
        name: 'Lakshadweep — Kadmat Island Reef',
        region: 'Lakshadweep',
        stateOrUT: 'Lakshadweep',
        coordinates: { lat: 11.233, lng: 72.780 },
        depthRange: { min: 4, max: 22 },
        isMarineProtectedArea: true,
        isRestrictedCoordinates: false,
        description: 'Elongated coral island with shallow turquoise lagoon on west and vibrant spur-and-groove formations on east.',
        isDemo: true
      },

      // Andaman & Nicobar Islands
      {
        name: 'Andaman — North Bay Reef, Port Blair',
        region: 'Andaman & Nicobar Islands',
        stateOrUT: 'Andaman & Nicobar Islands',
        coordinates: { lat: 11.705, lng: 92.755 },
        depthRange: { min: 3, max: 18 },
        isMarineProtectedArea: true,
        isRestrictedCoordinates: false,
        description: 'Fringing reef north of Port Blair harbour supporting massive boulder corals and reef fish communities.',
        isDemo: true
      },
      {
        name: 'Andaman — Havelock Island (Swaraj Dweep) — Elephant Beach',
        region: 'Andaman & Nicobar Islands',
        stateOrUT: 'Andaman & Nicobar Islands',
        coordinates: { lat: 12.000, lng: 92.955 },
        depthRange: { min: 2, max: 20 },
        isMarineProtectedArea: true,
        isRestrictedCoordinates: false,
        description: 'High-biodiversity reef slope facing the Ritchie Archipelago with sea fan gardens and Acropora assemblies.',
        isDemo: true
      },
      {
        name: 'Andaman — Neil Island (Shaheed Dweep) — Bharatpur Reef',
        region: 'Andaman & Nicobar Islands',
        stateOrUT: 'Andaman & Nicobar Islands',
        coordinates: { lat: 11.835, lng: 93.045 },
        depthRange: { min: 2, max: 16 },
        isMarineProtectedArea: true,
        isRestrictedCoordinates: false,
        description: 'Shallow fringing reef known for diverse soft corals and scleractinian biodiversity.',
        isDemo: true
      },
      {
        name: 'Nicobar — Campbell Bay Biosphere',
        region: 'Andaman & Nicobar Islands',
        stateOrUT: 'Andaman & Nicobar Islands',
        coordinates: { lat: 7.010, lng: 93.925 },
        depthRange: { min: 5, max: 30 },
        isMarineProtectedArea: true,
        isRestrictedCoordinates: false,
        description: 'Remote southern oceanic reef in Great Nicobar Biosphere with deep coral walls and pelagic fauna.',
        isDemo: true
      }
    ];

    const sitesMap = {};
    for (const siteInfo of sitesToSeed) {
      let site = await Site.findOne({ name: siteInfo.name });
      if (!site) {
        site = await Site.create(siteInfo);
        console.log(`Created site: ${siteInfo.name}`);
      } else {
        // Ensure coordinates and region are up to date
        site.coordinates = siteInfo.coordinates;
        site.region = siteInfo.region;
        site.stateOrUT = siteInfo.stateOrUT;
        site.isDemo = true;
        await site.save();
      }
      sitesMap[site.name] = site;
    }

    // ── 3. Surveys (Idempotent: checked by siteId + date) ──
    const surveysToSeed = [
      // Gulf of Mannar
      {
        siteName: 'Gulf of Mannar — Mandapam Reef',
        gpsLat: 9.280,
        gpsLng: 79.125,
        depth: 6.5,
        coralCoverPercent: 44,
        bleachingPercent: 14,
        date: new Date('2025-01-20'),
        surveyedBy: researcher1._id,
        status: 'verified'
      },
      {
        siteName: 'Gulf of Mannar — Mandapam Reef',
        gpsLat: 9.282,
        gpsLng: 79.128,
        depth: 8.0,
        coralCoverPercent: 41,
        bleachingPercent: 22,
        date: new Date('2025-05-14'),
        surveyedBy: researcher2._id,
        status: 'verified'
      },
      {
        siteName: 'Gulf of Mannar — Shingle Island Reef',
        gpsLat: 9.245,
        gpsLng: 79.238,
        depth: 7.0,
        coralCoverPercent: 52,
        bleachingPercent: 8,
        date: new Date('2025-02-18'),
        surveyedBy: researcher1._id,
        status: 'verified'
      },
      {
        siteName: 'Gulf of Mannar — Shingle Island Reef',
        gpsLat: 9.246,
        gpsLng: 79.240,
        depth: 9.5,
        coralCoverPercent: 48,
        bleachingPercent: 16,
        date: new Date('2025-06-22'),
        surveyedBy: researcher2._id,
        status: 'verified'
      },
      {
        siteName: 'Gulf of Mannar — Krusadai Island',
        gpsLat: 9.240,
        gpsLng: 79.210,
        depth: 4.5,
        coralCoverPercent: 56,
        bleachingPercent: 6,
        date: new Date('2025-03-10'),
        surveyedBy: researcher1._id,
        status: 'verified'
      },

      // Gulf of Kachchh
      {
        siteName: 'Gulf of Kachchh — Pirotan Island Marine National Park',
        gpsLat: 22.585,
        gpsLng: 69.955,
        depth: 3.5,
        coralCoverPercent: 34,
        bleachingPercent: 12,
        date: new Date('2025-01-28'),
        surveyedBy: researcher2._id,
        status: 'verified'
      },
      {
        siteName: 'Gulf of Kachchh — Pirotan Island Marine National Park',
        gpsLat: 22.587,
        gpsLng: 69.958,
        depth: 4.0,
        coralCoverPercent: 31,
        bleachingPercent: 18,
        date: new Date('2025-07-08'),
        surveyedBy: researcher1._id,
        status: 'verified'
      },
      {
        siteName: 'Gulf of Kachchh — Narara Reef Flat',
        gpsLat: 22.465,
        gpsLng: 69.720,
        depth: 2.5,
        coralCoverPercent: 28,
        bleachingPercent: 25,
        date: new Date('2025-04-05'),
        surveyedBy: researcher2._id,
        status: 'verified'
      },

      // Lakshadweep
      {
        siteName: 'Lakshadweep — Kavaratti Island Atoll',
        gpsLat: 10.567,
        gpsLng: 72.642,
        depth: 12.0,
        coralCoverPercent: 68,
        bleachingPercent: 7,
        date: new Date('2025-02-05'),
        surveyedBy: researcher1._id,
        status: 'verified'
      },
      {
        siteName: 'Lakshadweep — Kavaratti Island Atoll',
        gpsLat: 10.569,
        gpsLng: 72.645,
        depth: 14.5,
        coralCoverPercent: 62,
        bleachingPercent: 32,
        date: new Date('2025-05-28'),
        surveyedBy: researcher2._id,
        status: 'verified'
      },
      {
        siteName: 'Lakshadweep — Bangaram Atoll & Lagoon',
        gpsLat: 10.940,
        gpsLng: 72.285,
        depth: 11.0,
        coralCoverPercent: 72,
        bleachingPercent: 5,
        date: new Date('2025-03-15'),
        surveyedBy: researcher1._id,
        status: 'verified'
      },
      {
        siteName: 'Lakshadweep — Kadmat Island Reef',
        gpsLat: 11.233,
        gpsLng: 72.780,
        depth: 8.5,
        coralCoverPercent: 59,
        bleachingPercent: 11,
        date: new Date('2025-04-18'),
        surveyedBy: researcher2._id,
        status: 'verified'
      },

      // Andaman & Nicobar
      {
        siteName: 'Andaman — North Bay Reef, Port Blair',
        gpsLat: 11.705,
        gpsLng: 92.755,
        depth: 9.0,
        coralCoverPercent: 47,
        bleachingPercent: 19,
        date: new Date('2025-02-25'),
        surveyedBy: researcher1._id,
        status: 'verified'
      },
      {
        siteName: 'Andaman — Havelock Island (Swaraj Dweep) — Elephant Beach',
        gpsLat: 12.000,
        gpsLng: 92.955,
        depth: 10.5,
        coralCoverPercent: 65,
        bleachingPercent: 8,
        date: new Date('2025-03-22'),
        surveyedBy: researcher2._id,
        status: 'verified'
      },
      {
        siteName: 'Andaman — Havelock Island (Swaraj Dweep) — Elephant Beach',
        gpsLat: 12.002,
        gpsLng: 92.958,
        depth: 13.0,
        coralCoverPercent: 58,
        bleachingPercent: 34,
        date: new Date('2025-06-15'),
        surveyedBy: researcher1._id,
        status: 'verified'
      },
      {
        siteName: 'Andaman — Neil Island (Shaheed Dweep) — Bharatpur Reef',
        gpsLat: 11.835,
        gpsLng: 93.045,
        depth: 6.0,
        coralCoverPercent: 53,
        bleachingPercent: 15,
        date: new Date('2025-04-29'),
        surveyedBy: researcher2._id,
        status: 'verified'
      },
      {
        siteName: 'Nicobar — Campbell Bay Biosphere',
        gpsLat: 7.010,
        gpsLng: 93.925,
        depth: 16.0,
        coralCoverPercent: 70,
        bleachingPercent: 4,
        date: new Date('2025-05-02'),
        surveyedBy: researcher1._id,
        status: 'verified'
      }
    ];

    let createdSurveysCount = 0;
    const surveyDocs = [];
    for (const item of surveysToSeed) {
      const site = sitesMap[item.siteName];
      if (!site) continue;

      let existing = await Survey.findOne({
        siteId: site._id,
        date: item.date
      });

      if (!existing) {
        existing = await Survey.create({
          location: site.name,
          gpsLat: item.gpsLat,
          gpsLng: item.gpsLng,
          depth: item.depth,
          coralCoverPercent: item.coralCoverPercent,
          bleachingPercent: item.bleachingPercent,
          date: item.date,
          surveyedBy: item.surveyedBy,
          siteId: site._id,
          region: site.region,
          status: item.status,
          isDemo: true
        });
        createdSurveysCount++;
      } else {
        // Backfill siteId if missing
        if (!existing.siteId) {
          existing.siteId = site._id;
          existing.region = site.region;
          await existing.save();
        }
      }
      surveyDocs.push(existing);
    }
    console.log(`Seeded / verified surveys (${createdSurveysCount} newly created)`);

    // ── 4. Species Records (Idempotent) ──
    const speciesToSeed = [
      // Corals
      { name: 'Acropora muricata (Staghorn Coral)', type: 'coral', siteName: 'Gulf of Mannar — Mandapam Reef', date: new Date('2025-01-20'), count: 35 },
      { name: 'Porites lutea (Hump Coral)', type: 'coral', siteName: 'Gulf of Kachchh — Pirotan Island Marine National Park', date: new Date('2025-01-28'), count: 24 },
      { name: 'Acropora cytherea (Table Coral)', type: 'coral', siteName: 'Lakshadweep — Kavaratti Island Atoll', date: new Date('2025-02-05'), count: 42 },
      { name: 'Pocillopora damicornis (Cauliflower Coral)', type: 'coral', siteName: 'Andaman — Havelock Island (Swaraj Dweep) — Elephant Beach', date: new Date('2025-03-22'), count: 29 },
      { name: 'Favia favus (Honeycomb Coral)', type: 'coral', siteName: 'Gulf of Kachchh — Narara Reef Flat', date: new Date('2025-04-05'), count: 18 },
      { name: 'Montipora digitata (Finger Coral)', type: 'coral', siteName: 'Lakshadweep — Bangaram Atoll & Lagoon', date: new Date('2025-03-15'), count: 31 },

      // Fish
      { name: 'Amphiprion sebae (Sebae Anemonefish)', type: 'fish', siteName: 'Gulf of Mannar — Krusadai Island', date: new Date('2025-03-10'), count: 16 },
      { name: 'Chaetodon trifasciatus (Melon Butterflyfish)', type: 'fish', siteName: 'Lakshadweep — Kavaratti Island Atoll', date: new Date('2025-02-05'), count: 22 },
      { name: 'Scarus ghobban (Blue-barred Parrotfish)', type: 'fish', siteName: 'Andaman — North Bay Reef, Port Blair', date: new Date('2025-02-25'), count: 12 },
      { name: 'Epinephelus merra (Honeycomb Grouper)', type: 'fish', siteName: 'Gulf of Mannar — Shingle Island Reef', date: new Date('2025-02-18'), count: 7 },
      { name: 'Pomacanthus annularis (Blue-ringed Angelfish)', type: 'fish', siteName: 'Andaman — Havelock Island (Swaraj Dweep) — Elephant Beach', date: new Date('2025-03-22'), count: 5 },
      { name: 'Rhincodon typus (Whale Shark)', type: 'fish', siteName: 'Nicobar — Campbell Bay Biosphere', date: new Date('2025-05-02'), count: 1 },

      // Invertebrates
      { name: 'Tridacna maxima (Small Giant Clam)', type: 'invertebrate', siteName: 'Lakshadweep — Bangaram Atoll & Lagoon', date: new Date('2025-03-15'), count: 14 },
      { name: 'Holothuria scabra (Sandfish Sea Cucumber)', type: 'invertebrate', siteName: 'Gulf of Mannar — Mandapam Reef', date: new Date('2025-01-20'), count: 19 },
      { name: 'Linckia guildingi (Common Comet Starfish)', type: 'invertebrate', siteName: 'Andaman — Neil Island (Shaheed Dweep) — Bharatpur Reef', date: new Date('2025-04-29'), count: 8 },
      { name: 'Acanthaster planci (Crown-of-Thorns Starfish)', type: 'invertebrate', siteName: 'Andaman — Havelock Island (Swaraj Dweep) — Elephant Beach', date: new Date('2025-06-15'), count: 3 }
    ];

    let createdSpeciesCount = 0;
    for (const item of speciesToSeed) {
      const site = sitesMap[item.siteName];
      if (!site) continue;

      const existing = await Species.findOne({
        name: item.name,
        siteId: site._id,
        sightingDate: item.date
      });

      if (!existing) {
        await Species.create({
          name: item.name,
          type: item.type,
          location: site.name,
          siteId: site._id,
          sightingDate: item.date,
          count: item.count,
          isDemo: true
        });
        createdSpeciesCount++;
      }
    }
    console.log(`Seeded / verified species sightings (${createdSpeciesCount} newly created)`);

    // ── 5. Restoration Logs (Idempotent) ──
    const restorationsToSeed = [
      {
        siteName: 'Mandapam Micro-Fragment Nursery Plot A',
        coralSpecies: 'Acropora muricata',
        datePlanted: new Date('2024-08-10'),
        survivalRatePercent: 81,
        siteKey: 'Gulf of Mannar — Mandapam Reef',
        loggedBy: researcher1._id
      },
      {
        siteName: 'Shingle Island Artificial Reef Frame 2',
        coralSpecies: 'Acropora hyacinthus',
        datePlanted: new Date('2024-10-15'),
        survivalRatePercent: 74,
        siteKey: 'Gulf of Mannar — Shingle Island Reef',
        loggedBy: researcher1._id
      },
      {
        siteName: 'Kavaratti Lagoon Spider Frame Pilot',
        coralSpecies: 'Pocillopora damicornis',
        datePlanted: new Date('2024-11-20'),
        survivalRatePercent: 88,
        siteKey: 'Lakshadweep — Kavaratti Island Atoll',
        loggedBy: researcher2._id
      },
      {
        siteName: 'Havelock Island Rehabilitation Grid #1',
        coralSpecies: 'Acropora digitifera',
        datePlanted: new Date('2025-01-12'),
        survivalRatePercent: 67,
        siteKey: 'Andaman — Havelock Island (Swaraj Dweep) — Elephant Beach',
        loggedBy: researcher1._id
      },
      {
        siteName: 'Pirotan High-Salinity Concrete Substrate Plot',
        coralSpecies: 'Porites lutea',
        datePlanted: new Date('2025-02-14'),
        survivalRatePercent: 78,
        siteKey: 'Gulf of Kachchh — Pirotan Island Marine National Park',
        loggedBy: researcher2._id
      }
    ];

    let createdRestorationsCount = 0;
    for (const item of restorationsToSeed) {
      const site = sitesMap[item.siteKey];
      const existing = await Restoration.findOne({ siteName: item.siteName });
      if (!existing) {
        await Restoration.create({
          siteName: item.siteName,
          coralSpecies: item.coralSpecies,
          datePlanted: item.datePlanted,
          survivalRatePercent: item.survivalRatePercent,
          siteId: site ? site._id : null,
          loggedBy: item.loggedBy,
          isDemo: true
        });
        createdRestorationsCount++;
      } else if (site && !existing.siteId) {
        existing.siteId = site._id;
        await existing.save();
      }
    }
    console.log(`Seeded / verified restoration plots (${createdRestorationsCount} newly created)`);

    console.log('\n=== IDEMPOTENT INDIA SEED COMPLETE ===');
    console.log('Notice: ' + SEED_LABEL);
    console.log('Credentials:');
    console.log('  Admin:      admin@aquatrack.org / admin123');
    console.log('  Researcher: arun@aquatrack.org / researcher123');
    console.log('  Researcher: priya@aquatrack.org / researcher123');
    console.log('  Viewer:     guest@aquatrack.org / guest123\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
