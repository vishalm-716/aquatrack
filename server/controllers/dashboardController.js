const mongoose = require('mongoose');
const Survey = require('../models/Survey');
const Species = require('../models/Species');
const Restoration = require('../models/Restoration');
const Site = require('../models/Site');
const User = require('../models/User');

// GET /api/dashboard/summary
exports.getDashboardSummary = async (req, res) => {
  try {
    const {
      region,
      siteId,
      startDate,
      endDate,
      minBleaching,
      maxBleaching,
      withRestoration
    } = req.query;

    const isPublicUser = !req.user || req.user.role === 'public';

    // Build matching filter for surveys (strictly India scope: exclude foreign legacy)
    const surveyMatch = {
      isForeignLegacy: { $ne: true }
    };

    if (region && region !== 'all') {
      surveyMatch.region = region;
    }
    if (siteId) {
      surveyMatch.siteId = new mongoose.Types.ObjectId(siteId);
    }
    if (minBleaching !== undefined && minBleaching !== '') {
      surveyMatch.bleachingPercent = { ...(surveyMatch.bleachingPercent || {}), $gte: parseFloat(minBleaching) };
    }
    if (maxBleaching !== undefined && maxBleaching !== '') {
      surveyMatch.bleachingPercent = { ...(surveyMatch.bleachingPercent || {}), $lte: parseFloat(maxBleaching) };
    }
    if (startDate || endDate) {
      surveyMatch.date = {};
      if (startDate) surveyMatch.date.$gte = new Date(startDate);
      if (endDate) surveyMatch.date.$lte = new Date(endDate);
    }

    // Site match for site-level counts
    const siteMatch = {
      isForeignLegacy: { $ne: true }
    };
    if (region && region !== 'all') {
      siteMatch.region = region;
    }
    if (siteId) {
      siteMatch._id = new mongoose.Types.ObjectId(siteId);
    }

    // Filter matching restoration sites if requested
    if (withRestoration === 'true') {
      const restoSites = await Restoration.distinct('siteId', {
        siteId: { $ne: null },
        isForeignLegacy: { $ne: true }
      });
      surveyMatch.siteId = { ...(surveyMatch.siteId || {}), $in: restoSites };
      siteMatch._id = { ...(siteMatch._id || {}), $in: restoSites };
    }

    // Shared filters for species & restoration
    const speciesMatch = { isForeignLegacy: { $ne: true } };
    const restoMatch = { isForeignLegacy: { $ne: true } };
    if (siteId) {
      speciesMatch.siteId = new mongoose.Types.ObjectId(siteId);
      restoMatch.siteId = new mongoose.Types.ObjectId(siteId);
    }

    const [
      totalSurveys,
      mappedSitesCount,
      unmappedSurveysCount,
      meanStats,
      severeBleachingCount,
      activeRestorationSitesCount,
      totalRestorationPlots,
      speciesUniqueCount,
      coralCoverBySite,
      bleachingTrend,
      restorationStatus,
      speciesByType,
      recentActivity
    ] = await Promise.all([
      // 1. Total surveys in filtered scope
      Survey.countDocuments(surveyMatch),

      // 2. Mapped sites in scope
      Site.countDocuments(siteMatch),

      // 3. Unmapped Indian surveys count (genuine unlinked field logs)
      Survey.countDocuments({ siteId: null, isForeignLegacy: { $ne: true } }),

      // 4. Mean recorded coral cover and mean recorded bleaching
      Survey.aggregate([
        { $match: surveyMatch },
        {
          $group: {
            _id: null,
            meanCoralCover: { $avg: '$coralCoverPercent' },
            meanBleaching: { $avg: '$bleachingPercent' },
            minBleaching: { $min: '$bleachingPercent' },
            maxBleaching: { $max: '$bleachingPercent' },
            count: { $sum: 1 }
          }
        }
      ]),

      // 5. Recent bleaching observations >= 30% (demo visualization threshold)
      Survey.countDocuments({
        ...surveyMatch,
        bleachingPercent: { $gte: 30 }
      }),

      // 6. Active restoration sites count (unique Indian sites with restoration)
      Restoration.distinct('siteId', {
        siteId: { $ne: null },
        isForeignLegacy: { $ne: true }
      }).then(ids => ids.length),

      // 7. Total restoration plots logged
      Restoration.countDocuments(restoMatch),

      // 8. Unique taxa count
      Species.distinct('name', speciesMatch).then(names => names.length),

      // 9. Recorded coral cover % by site (Mean over selected period & sample size)
      Survey.aggregate([
        { $match: surveyMatch },
        {
          $group: {
            _id: { $ifNull: ['$siteId', '$location'] },
            locationName: { $first: '$location' },
            siteId: { $first: '$siteId' },
            region: { $first: '$region' },
            meanCoralCover: { $avg: '$coralCoverPercent' },
            meanBleaching: { $avg: '$bleachingPercent' },
            latestCoralCover: { $last: '$coralCoverPercent' },
            latestBleaching: { $last: '$bleachingPercent' },
            surveyCount: { $sum: 1 },
            lastSurveyDate: { $max: '$date' }
          }
        },
        { $sort: { meanCoralCover: -1 } },
        { $limit: 12 }
      ]),

      // 10. Time-series line chart: recorded bleaching % over time (monthly aggregated with sample size)
      Survey.aggregate([
        { $match: surveyMatch },
        { $sort: { date: 1 } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m', date: '$date' }
            },
            meanBleaching: { $avg: '$bleachingPercent' },
            meanCoralCover: { $avg: '$coralCoverPercent' },
            surveyCount: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // 11. Restoration status: survival rate % per restoration site
      Restoration.aggregate([
        { $match: restoMatch },
        {
          $group: {
            _id: '$siteName',
            coralSpecies: { $first: '$coralSpecies' },
            latestSurvivalRate: { $last: '$survivalRatePercent' },
            datePlanted: { $last: '$datePlanted' },
            siteId: { $first: '$siteId' }
          }
        },
        { $sort: { latestSurvivalRate: -1 } },
        { $limit: 10 }
      ]),

      // 12. Biodiversity sightings by taxon category (logged observations, not ocean census)
      Species.aggregate([
        { $match: speciesMatch },
        {
          $group: {
            _id: '$type',
            totalSightingsCount: { $sum: '$count' },
            distinctTaxa: { $addToSet: '$name' }
          }
        }
      ]),

      // 13. Recent Activity items for Field Operations Log
      Promise.all([
        Survey.find(surveyMatch).populate('surveyedBy', 'name email role').sort({ date: -1 }).limit(25).lean(),
        Species.find(speciesMatch).sort({ sightingDate: -1 }).limit(20).lean(),
        Restoration.find(restoMatch).populate('loggedBy', 'name email role').sort({ datePlanted: -1 }).limit(20).lean()
      ])
    ]);

    const [recentSurveys, recentSpecies, recentRestorations] = recentActivity;
    const activityFeed = [
      ...recentSurveys.map(s => ({
        type: 'survey',
        title: `Survey logged at ${s.location}`,
        detail: `Coral cover: ${s.coralCoverPercent}%, Bleaching: ${s.bleachingPercent}%, Depth: ${s.depth}m`,
        by: isPublicUser ? null : (s.surveyedBy?.name || 'Field Station'),
        date: s.date
      })),
      ...recentSpecies.map(sp => ({
        type: 'species',
        title: `Logged sighting: ${sp.name}`,
        detail: `${sp.count} individual(s) observed at ${sp.location}`,
        by: null,
        date: sp.sightingDate
      })),
      ...recentRestorations.map(r => ({
        type: 'restoration',
        title: `Restoration plot: ${r.siteName}`,
        detail: `${r.coralSpecies} — ${r.survivalRatePercent}% survival rate`,
        by: isPublicUser ? null : (r.loggedBy?.name || 'Marine Station'),
        date: r.datePlanted
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    const statsObj = meanStats[0] || {};

    res.json({
      operationalCards: {
        totalSurveys,
        mappedSitesCount,
        unmappedSurveysCount,
        meanCoralCover: statsObj.meanCoralCover ? Math.round(statsObj.meanCoralCover * 10) / 10 : 0,
        meanBleaching: statsObj.meanBleaching ? Math.round(statsObj.meanBleaching * 10) / 10 : 0,
        severeBleachingCount, // >= 30% demo threshold
        activeRestorationSitesCount,
        totalRestorationPlots,
        speciesUniqueCount
      },
      coralCoverBySite: coralCoverBySite.map(s => ({
        siteName: s.locationName || 'Unknown Site',
        siteId: s.siteId,
        region: s.region || 'India',
        meanCoralCover: Math.round(s.meanCoralCover * 10) / 10,
        meanBleaching: Math.round(s.meanBleaching * 10) / 10,
        latestCoralCover: Math.round(s.latestCoralCover * 10) / 10,
        latestBleaching: Math.round(s.latestBleaching * 10) / 10,
        surveyCount: s.surveyCount,
        lastSurveyDate: s.lastSurveyDate
      })),
      bleachingTrend: bleachingTrend.map(t => ({
        month: t._id,
        meanBleaching: Math.round(t.meanBleaching * 10) / 10,
        meanCoralCover: Math.round(t.meanCoralCover * 10) / 10,
        surveyCount: t.surveyCount
      })),
      restorationStatus: restorationStatus.map(r => ({
        siteName: r._id,
        coralSpecies: r.coralSpecies,
        survivalRatePercent: r.latestSurvivalRate,
        datePlanted: r.datePlanted,
        siteId: r.siteId
      })),
      speciesByType: speciesByType.map(s => ({
        type: s._id,
        totalSightingsCount: s.totalSightingsCount,
        uniqueTaxaCount: s.distinctTaxa.length
      })),
      activityFeed
    });
  } catch (error) {
    console.error('getDashboardSummary error:', error);
    res.status(500).json({ message: 'Failed to aggregate conservation telemetry' });
  }
};
