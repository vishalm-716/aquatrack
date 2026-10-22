const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Restoration = require('./models/Restoration');

const PHOTO_MAPPINGS = [
  {
    filter: /Agatti/i,
    before: '/images/restoration/agatti_baseline.jpg',
    after: '/images/restoration/agatti_growth.jpg'
  },
  {
    filter: /Pirotan/i,
    before: '/images/restoration/pirotan_baseline.jpg',
    after: '/images/restoration/pirotan_growth.jpg'
  },
  {
    filter: /Havelock/i,
    before: '/images/restoration/havelock_baseline.jpg',
    after: '/images/restoration/havelock_growth.jpg'
  },
  {
    filter: /Kavaratti/i,
    before: '/images/restoration/kavaratti_baseline.jpg',
    after: '/images/restoration/kavaratti_growth.jpg'
  },
  {
    filter: /Shingle/i,
    before: '/images/restoration/shingle_baseline.jpg',
    after: '/images/restoration/shingle_growth.jpg'
  },
  {
    filter: /Mandapam/i,
    before: '/images/restoration/mandapam_baseline.jpg',
    after: '/images/restoration/mandapam_growth.jpg'
  }
];

async function updatePhotos() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas');

    for (const mapping of PHOTO_MAPPINGS) {
      const res = await Restoration.updateMany(
        { siteName: mapping.filter },
        { 
          $set: { 
            beforePhotoUrl: mapping.before,
            afterPhotoUrl: mapping.after
          } 
        }
      );
      console.log(`Updated for ${mapping.filter}: matched ${res.matchedCount}, modified ${res.modifiedCount}`);
    }

    const all = await Restoration.find({}).select('siteName coralSpecies beforePhotoUrl afterPhotoUrl');
    console.log('\nVerified records in MongoDB Atlas:');
    all.forEach(r => console.log(`- ${r.siteName}: Before=${r.beforePhotoUrl} After=${r.afterPhotoUrl}`));

    await mongoose.disconnect();
    console.log('Done.');
  } catch (err) {
    console.error('Error updating photos:', err);
    process.exit(1);
  }
}

updatePhotos();
