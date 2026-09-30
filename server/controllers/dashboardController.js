const Survey = require('../models/Survey');
const Species = require('../models/Species');
const Restoration = require('../models/Restoration');

// GET /api/dashboard/summary
exports.getDashboardSummary = async (req, res) => {
  try {
    const [
      totalSurveys,
      avgCoralCover,
      avgBleaching,
      activeRestorationSites,
      speciesCount,
      recentSurveys,
      coralCoverBySite,
      bleachingTrend,
      speciesByType,
      recentActivity
    ] = await Promise.all([
      // Total surveys count
      Survey.countDocuments(),

      // Average coral cover
      Survey.aggregate([
        { $group: { _id: null, avg: { $avg: '$coralCoverPercent' } } }
      ]),

      // Average bleaching
      Survey.aggregate([
        { $group: { _id: null, avg: { $avg: '$bleachingPercent' } } }
      ]),

      // Active restoration sites
      Restoration.countDocuments(),

      // Total unique species
      Species.distinct('name').then(names => names.length),

      // Recent surveys for feed
      Survey.find()
        .populate('surveyedBy', 'name')
        .sort({ date: -1 })
        .limit(5)
        .lean(),

      // Coral cover by site (for bar chart)
      Survey.aggregate([
        {
          $group: {
            _id: '$location',
            avgCoralCover: { $avg: '$coralCoverPercent' },
            avgBleaching: { $avg: '$bleachingPercent' },
            surveyCount: { $sum: 1 }
          }
        },
        { $sort: { avgCoralCover: -1 } },
        { $limit: 10 }
      ]),

      // Bleaching trend over time (for line chart)
      Survey.aggregate([
        { $sort: { date: 1 } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m', date: '$date' }
            },
            avgBleaching: { $avg: '$bleachingPercent' },
            avgCoralCover: { $avg: '$coralCoverPercent' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Species sightings by type
      Species.aggregate([
        {
          $group: {
            _id: '$type',
            totalCount: { $sum: '$count' },
            uniqueSpecies: { $addToSet: '$name' }
          }
        }
      ]),

      // Recent activity feed (mix of surveys, species, restoration)
      Promise.all([
        Survey.find().populate('surveyedBy', 'name').sort({ createdAt: -1 }).limit(3).lean(),
        Species.find().sort({ createdAt: -1 }).limit(3).lean(),
        Restoration.find().populate('loggedBy', 'name').sort({ createdAt: -1 }).limit(3).lean()
      ])
    ]);

    // Flatten and sort recent activity
    const [recentSurveyActivity, recentSpeciesActivity, recentRestorationActivity] = recentActivity;
    const activityFeed = [
      ...recentSurveyActivity.map(s => ({
        type: 'survey',
        title: `Reef survey at ${s.location}`,
        detail: `Coral cover: ${s.coralCoverPercent}%, Bleaching: ${s.bleachingPercent}%`,
        by: s.surveyedBy?.name || 'Unknown',
        date: s.createdAt
      })),
      ...recentSpeciesActivity.map(s => ({
        type: 'species',
        title: `${s.name} sighted`,
        detail: `${s.count} observed at ${s.location}`,
        by: null,
        date: s.createdAt
      })),
      ...recentRestorationActivity.map(r => ({
        type: 'restoration',
        title: `Restoration at ${r.siteName}`,
        detail: `${r.coralSpecies} — ${r.survivalRatePercent}% survival rate`,
        by: r.loggedBy?.name || 'Unknown',
        date: r.createdAt
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

    res.json({
      stats: {
        totalSurveys,
        avgCoralCover: avgCoralCover[0]?.avg ? Math.round(avgCoralCover[0].avg * 10) / 10 : 0,
        avgBleaching: avgBleaching[0]?.avg ? Math.round(avgBleaching[0].avg * 10) / 10 : 0,
        activeRestorationSites,
        speciesCount
      },
      coralCoverBySite: coralCoverBySite.map(s => ({
        location: s._id,
        avgCoralCover: Math.round(s.avgCoralCover * 10) / 10,
        avgBleaching: Math.round(s.avgBleaching * 10) / 10,
        surveyCount: s.surveyCount
      })),
      bleachingTrend: bleachingTrend.map(t => ({
        month: t._id,
        avgBleaching: Math.round(t.avgBleaching * 10) / 10,
        avgCoralCover: Math.round(t.avgCoralCover * 10) / 10,
        surveys: t.count
      })),
      speciesByType: speciesByType.map(s => ({
        type: s._id,
        totalCount: s.totalCount,
        uniqueSpecies: s.uniqueSpecies.length
      })),
      recentSurveys: recentSurveys.map(s => ({
        _id: s._id,
        location: s.location,
        coralCoverPercent: s.coralCoverPercent,
        bleachingPercent: s.bleachingPercent,
        surveyedBy: s.surveyedBy?.name || 'Unknown',
        date: s.date
      })),
      activityFeed
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ message: 'Failed to load dashboard data' });
  }
};
