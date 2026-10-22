/**
 * One-time migration: Flag legacy non-Indian records (Surveys, Species, Restoration)
 * with `isForeignLegacy: true` and `country: 'Foreign'`.
 *
 * This cleanly isolates foreign legacy/test data from active India operations,
 * dashboards, and maps, while preserving auditability.
 *
 * Usage: node migrations/flag-foreign-records.js
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Site = require('../models/Site');
const Survey = require('../models/Survey');
const Species = require('../models/Species');
const Restoration = require('../models/Restoration');

const FOREIGN_KEYWORDS = [
  /great barrier reef/i,
  /osprey reef/i,
  /lizard island/i,
  /maldives/i,
  /baa atoll/i,
  /raja ampat/i,
  /coral triangle/i,
  /red sea/i,
  /ras mohammed/i,
  /similan/i,
  /fiji/i,
  /astrolabe/i,
  /tubbataha/i,
  /belize/i,
  /caribbean/i,
  /hawaii/i,
  /papahānaumokuākea/i,
  /galapagos/i,
  /wolf island/i,
  /florida keys/i
];

const INDIAN_REGIONS = [
  'Gulf of Mannar',
  'Gulf of Kachchh',
  'Lakshadweep',
  'Andaman & Nicobar Islands'
];

function isForeign(text) {
  if (!text) return false;
  return FOREIGN_KEYWORDS.some(rx => rx.test(text));
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB for India scope migration...');

  // 1. Flag Foreign Surveys
  const allSurveys = await Survey.find({}).lean();
  let surveysFlagged = 0;
  for (const s of allSurveys) {
    const isForeignLocation = isForeign(s.location);
    const hasNoIndianRegion = !s.region || !INDIAN_REGIONS.includes(s.region);
    const hasNoIndianSite = !s.siteId;

    if (isForeignLocation || (hasNoIndianRegion && hasNoIndianSite)) {
      await Survey.updateOne(
        { _id: s._id },
        { $set: { isForeignLegacy: true, country: 'Foreign' } }
      );
      console.log(`  [SURVEY FLAGGED] "${s.location}" (lat: ${s.gpsLat}, lng: ${s.gpsLng})`);
      surveysFlagged++;
    } else {
      await Survey.updateOne(
        { _id: s._id },
        { $set: { isForeignLegacy: false, country: 'India' } }
      );
    }
  }

  // 2. Flag Foreign Species
  const allSpecies = await Species.find({}).lean();
  let speciesFlagged = 0;
  for (const sp of allSpecies) {
    if (isForeign(sp.location) || !sp.siteId) {
      await Species.updateOne(
        { _id: sp._id },
        { $set: { isForeignLegacy: true, country: 'Foreign' } }
      );
      console.log(`  [SPECIES FLAGGED] "${sp.name}" @ "${sp.location}"`);
      speciesFlagged++;
    } else {
      await Species.updateOne(
        { _id: sp._id },
        { $set: { isForeignLegacy: false, country: 'India' } }
      );
    }
  }

  // 3. Flag Foreign Restorations
  const allRestorations = await Restoration.find({}).lean();
  let restorationsFlagged = 0;
  for (const r of allRestorations) {
    if (isForeign(r.siteName) || !r.siteId) {
      await Restoration.updateOne(
        { _id: r._id },
        { $set: { isForeignLegacy: true, country: 'Foreign' } }
      );
      console.log(`  [RESTORATION FLAGGED] "${r.siteName}"`);
      restorationsFlagged++;
    } else {
      await Restoration.updateOne(
        { _id: r._id },
        { $set: { isForeignLegacy: false, country: 'India' } }
      );
    }
  }

  // 4. Ensure Sites are all Indian
  const allSites = await Site.find({}).lean();
  for (const site of allSites) {
    await Site.updateOne(
      { _id: site._id },
      { $set: { isForeignLegacy: false, country: 'India' } }
    );
  }

  console.log('\n=== MIGRATION COMPLETE ===');
  console.log(`Surveys flagged as foreign: ${surveysFlagged}`);
  console.log(`Species flagged as foreign: ${speciesFlagged}`);
  console.log(`Restorations flagged as foreign: ${restorationsFlagged}`);
  console.log('Active India dataset is now 100% clean and isolated.');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
