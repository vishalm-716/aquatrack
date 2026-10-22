const mongoose = require('mongoose');
const Site = require('../models/Site');
const Survey = require('../models/Survey');
const Species = require('../models/Species');
const Restoration = require('../models/Restoration');
const User = require('../models/User');

// GET /api/sites
// Fetch sites with aggregated statistics (latest coral cover, bleaching, survey counts, etc.)
exports.getSites = async (req, res) => {
  try {
    const { region, withRestoration, minBleaching, maxBleaching, search } = req.query;

    const filter = {
      isForeignLegacy: { $ne: true }
    };
    if (region && region !== 'all') {
      filter.region = region;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { region: { $regex: search, $options: 'i' } },
        { stateOrUT: { $regex: search, $options: 'i' } }
      ];
    }

    const sites = await Site.find(filter).lean();
    if (!sites || sites.length === 0) {
      return res.json({ sites: [], total: 0, unmappedSurveysCount: await Survey.countDocuments({ siteId: null, isForeignLegacy: { $ne: true } }) });
    }

    const siteIds = sites.map(s => s._id);

    // Aggregate surveys by siteId
    const surveyStats = await Survey.aggregate([
      { $match: { siteId: { $in: siteIds }, isForeignLegacy: { $ne: true } } },
      { $sort: { date: -1 } },
      {
        $group: {
          _id: '$siteId',
          surveyCount: { $sum: 1 },
          lastSurveyDate: { $first: '$date' },
          latestCoralCover: { $first: '$coralCoverPercent' },
          latestBleaching: { $first: '$bleachingPercent' },
          latestDepth: { $first: '$depth' },
          meanCoralCover: { $avg: '$coralCoverPercent' },
          meanBleaching: { $avg: '$bleachingPercent' },
          lastSurveyId: { $first: '$_id' }
        }
      }
    ]);

    // Aggregate species count by siteId
    const speciesStats = await Species.aggregate([
      { $match: { siteId: { $in: siteIds }, isForeignLegacy: { $ne: true } } },
      {
        $group: {
          _id: '$siteId',
          speciesRecordCount: { $sum: 1 },
          individualSightingsCount: { $sum: '$count' }
        }
      }
    ]);

    // Aggregate restoration activities by siteId
    const restorationStats = await Restoration.aggregate([
      { $match: { siteId: { $in: siteIds }, isForeignLegacy: { $ne: true } } },
      { $sort: { datePlanted: -1 } },
      {
        $group: {
          _id: '$siteId',
          restorationCount: { $sum: 1 },
          latestSurvivalRate: { $first: '$survivalRatePercent' },
          latestSpeciesPlanted: { $first: '$coralSpecies' },
          latestPlantedDate: { $first: '$datePlanted' }
        }
      }
    ]);

    const surveyMap = new Map(surveyStats.map(s => [s._id.toString(), s]));
    const speciesMap = new Map(speciesStats.map(s => [s._id.toString(), s]));
    const restoMap = new Map(restorationStats.map(r => [r._id.toString(), r]));

    // Count unmapped surveys
    const unmappedSurveysCount = await Survey.countDocuments({ siteId: null, isForeignLegacy: { $ne: true } });

    let enrichedSites = sites.map(site => {
      const idStr = site._id.toString();
      const s = surveyMap.get(idStr) || {};
      const sp = speciesMap.get(idStr) || {};
      const r = restoMap.get(idStr) || {};

      // Privacy: if user is public (or not logged in) and site has restricted coordinates
      let coords = { ...site.coordinates };
      if (site.isRestrictedCoordinates && (!req.user || req.user.role === 'public')) {
        // Redact exact decimal precision to ~10km (1 decimal place)
        coords = {
          lat: Math.round(coords.lat * 10) / 10,
          lng: Math.round(coords.lng * 10) / 10,
          isApproximate: true
        };
      }

      const latestBleaching = typeof s.latestBleaching === 'number' ? s.latestBleaching : null;

      return {
        _id: site._id,
        name: site.name,
        region: site.region,
        stateOrUT: site.stateOrUT,
        coordinates: coords,
        isMarineProtectedArea: site.isMarineProtectedArea,
        isRestrictedCoordinates: site.isRestrictedCoordinates,
        description: site.description,
        isDemo: site.isDemo,
        surveyCount: s.surveyCount || 0,
        lastSurveyDate: s.lastSurveyDate || null,
        latestCoralCover: typeof s.latestCoralCover === 'number' ? Math.round(s.latestCoralCover * 10) / 10 : null,
        latestBleaching: latestBleaching,
        latestDepth: s.latestDepth || null,
        meanCoralCover: typeof s.meanCoralCover === 'number' ? Math.round(s.meanCoralCover * 10) / 10 : null,
        meanBleaching: typeof s.meanBleaching === 'number' ? Math.round(s.meanBleaching * 10) / 10 : null,
        speciesRecordCount: sp.speciesRecordCount || 0,
        individualSightingsCount: sp.individualSightingsCount || 0,
        restorationCount: r.restorationCount || 0,
        latestSurvivalRate: typeof r.latestSurvivalRate === 'number' ? r.latestSurvivalRate : null,
        latestSpeciesPlanted: r.latestSpeciesPlanted || null
      };
    });

    // Apply post-aggregation filters
    if (withRestoration === 'true') {
      enrichedSites = enrichedSites.filter(site => site.restorationCount > 0);
    }

    if (minBleaching !== undefined && minBleaching !== '') {
      const minB = parseFloat(minBleaching);
      enrichedSites = enrichedSites.filter(site => site.latestBleaching !== null && site.latestBleaching >= minB);
    }

    if (maxBleaching !== undefined && maxBleaching !== '') {
      const maxB = parseFloat(maxBleaching);
      enrichedSites = enrichedSites.filter(site => site.latestBleaching !== null && site.latestBleaching <= maxB);
    }

    res.json({
      sites: enrichedSites,
      total: enrichedSites.length,
      unmappedSurveysCount
    });
  } catch (error) {
    console.error('getSites error:', error);
    res.status(500).json({ message: 'Failed to retrieve site coordinates and status' });
  }
};

// GET /api/sites/:id
// Get detailed site data with chronological integrated timeline
exports.getSiteById = async (req, res) => {
  try {
    const site = await Site.findById(req.params.id).lean();
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    let coords = { ...site.coordinates };
    if (site.isRestrictedCoordinates && (!req.user || req.user.role === 'public')) {
      coords = {
        lat: Math.round(coords.lat * 10) / 10,
        lng: Math.round(coords.lng * 10) / 10,
        isApproximate: true
      };
    }

    const [surveys, species, restorations] = await Promise.all([
      Survey.find({ siteId: site._id })
        .populate('surveyedBy', 'name email role')
        .sort({ date: -1 })
        .lean(),
      Species.find({ siteId: site._id })
        .sort({ sightingDate: -1 })
        .lean(),
      Restoration.find({ siteId: site._id })
        .populate('loggedBy', 'name role')
        .sort({ datePlanted: -1 })
        .lean()
    ]);

    // Redact surveyor email for public
    const sanitizedSurveys = surveys.map(s => {
      if (!req.user || req.user.role === 'public') {
        return {
          ...s,
          surveyedBy: s.surveyedBy ? { _id: s.surveyedBy._id, name: s.surveyedBy.name } : null
        };
      }
      return s;
    });

    // Unified chronological timeline
    const timeline = [
      ...sanitizedSurveys.map(s => ({
        type: 'survey',
        id: s._id,
        date: s.date,
        title: `Reef Survey (${s.coralCoverPercent}% coral cover, ${s.bleachingPercent}% bleaching)`,
        summary: `Depth: ${s.depth}m | Status: ${s.status}`,
        actor: s.surveyedBy?.name || 'Scientific Diver',
        photoUrl: s.photoUrl || null,
        data: s
      })),
      ...species.map(sp => ({
        type: 'species',
        id: sp._id,
        date: sp.sightingDate,
        title: `Sighting: ${sp.name} (${sp.count} count)`,
        summary: `Taxon category: ${sp.type.toUpperCase()}`,
        actor: null,
        data: sp
      })),
      ...restorations.map(r => ({
        type: 'restoration',
        id: r._id,
        date: r.datePlanted,
        title: `Restoration: ${r.siteName} (${r.coralSpecies})`,
        summary: `Survival Rate: ${r.survivalRatePercent}% | Logged by ${r.loggedBy?.name || 'Marine Station'}`,
        actor: r.loggedBy?.name || null,
        beforePhotoUrl: r.beforePhotoUrl || null,
        afterPhotoUrl: r.afterPhotoUrl || null,
        data: r
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      site: {
        ...site,
        coordinates: coords
      },
      stats: {
        surveyCount: surveys.length,
        speciesCount: species.length,
        restorationCount: restorations.length,
        latestCoralCover: surveys[0]?.coralCoverPercent ?? null,
        latestBleaching: surveys[0]?.bleachingPercent ?? null,
        latestSurveyDate: surveys[0]?.date ?? null
      },
      surveys: sanitizedSurveys,
      species,
      restorations,
      timeline
    });
  } catch (error) {
    console.error('getSiteById error:', error);
    res.status(500).json({ message: 'Failed to retrieve site detail' });
  }
};

// POST /api/sites
exports.createSite = async (req, res) => {
  try {
    const { name, region, stateOrUT, coordinates, depthRange, isMarineProtectedArea, isRestrictedCoordinates, description } = req.body;

    if (!name || !region || !coordinates || coordinates.lat === undefined || coordinates.lng === undefined) {
      return res.status(400).json({ message: 'Name, region, and valid GPS coordinates are required' });
    }

    const existing = await Site.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: 'A site with this designation already exists' });
    }

    const site = await Site.create({
      name: name.trim(),
      region,
      stateOrUT: stateOrUT || 'India',
      coordinates: {
        lat: parseFloat(coordinates.lat),
        lng: parseFloat(coordinates.lng)
      },
      depthRange: depthRange || { min: 2, max: 25 },
      isMarineProtectedArea: isMarineProtectedArea !== false,
      isRestrictedCoordinates: Boolean(isRestrictedCoordinates),
      description: description || ''
    });

    res.status(201).json(site);
  } catch (error) {
    console.error('createSite error:', error);
    res.status(500).json({ message: 'Failed to create site' });
  }
};
