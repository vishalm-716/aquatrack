const User = require('../models/User');
const Survey = require('../models/Survey');
const Site = require('../models/Site');
const Restoration = require('../models/Restoration');
const Species = require('../models/Species');

// GET /api/admin/command-center
exports.getCommandCenterOverview = async (req, res) => {
  try {
    const [
      pendingSurveys,
      pendingSpecies,
      pendingRestorations,
      flaggedSurveysNoPhoto,
      flaggedSevereBleaching,
      foreignSurveysCount,
      foreignSpeciesCount,
      foreignRestorationsCount,
      users,
      sites,
      restorationsNeedingFollowup,
      regionalAgg
    ] = await Promise.all([
      // 1. Pending verification queue - Surveys
      Survey.find({ status: 'pending', isForeignLegacy: { $ne: true } })
        .populate('surveyedBy', 'name email role')
        .populate('siteId', 'name region')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),

      // 1b. Pending verification queue - Biodiversity Species
      Species.find({
        $or: [{ status: 'pending' }, { status: { $exists: false } }, { status: null }],
        isForeignLegacy: { $ne: true }
      })
        .populate('recordedBy', 'name email role')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),

      // 1c. Pending verification queue - Restoration Plots
      Restoration.find({
        $or: [{ status: 'pending' }, { status: { $exists: false } }, { status: null }],
        isForeignLegacy: { $ne: true }
      })
        .populate('loggedBy', 'name email role')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),

      // 2. Data quality flags: Missing photos
      Survey.find({
        isForeignLegacy: { $ne: true },
        $or: [{ photoUrl: '' }, { photoUrl: null }]
      })
        .select('location region date bleachingPercent surveyedBy')
        .populate('surveyedBy', 'name email')
        .limit(10)
        .lean(),

      // 3. Bleaching alerts (>= 30%)
      Survey.find({
        isForeignLegacy: { $ne: true },
        bleachingPercent: { $gte: 30 }
      })
        .populate('surveyedBy', 'name email')
        .sort({ date: -1 })
        .limit(10)
        .lean(),

      // 4. Foreign legacy audit counts
      Survey.countDocuments({ isForeignLegacy: true }),
      Species.countDocuments({ isForeignLegacy: true }),
      Restoration.countDocuments({ isForeignLegacy: true }),

      // 5. User counts
      User.find({}).select('role').lean(),

      // 6. Indian Sites
      Site.find({ isForeignLegacy: { $ne: true } }).lean(),

      // 7. Restoration plots needing follow-up (survival rate < 75%)
      Restoration.find({ isForeignLegacy: { $ne: true }, survivalRatePercent: { $lt: 75 } })
        .populate('loggedBy', 'name email')
        .populate('siteId', 'name region')
        .lean(),

      // 8. Regional Coverage breakdown
      Survey.aggregate([
        { $match: { isForeignLegacy: { $ne: true } } },
        {
          $group: {
            _id: '$region',
            totalSurveys: { $sum: 1 },
            meanCoralCover: { $avg: '$coralCoverPercent' },
            meanBleaching: { $avg: '$bleachingPercent' },
            latestSurvey: { $max: '$date' }
          }
        }
      ])
    ]);

    const userRoles = { admin: 0, researcher: 0, public: 0 };
    users.forEach(u => {
      if (userRoles[u.role] !== undefined) userRoles[u.role]++;
    });

    const regionsList = [
      'Gulf of Mannar',
      'Gulf of Kachchh',
      'Lakshadweep',
      'Andaman & Nicobar Islands'
    ];

    const regMap = new Map(regionalAgg.map(r => [r._id, r]));
    const regionalCoverage = regionsList.map(regName => {
      const agg = regMap.get(regName) || {};
      const regSites = sites.filter(s => s.region === regName);
      return {
        region: regName,
        siteCount: regSites.length,
        surveyCount: agg.totalSurveys || 0,
        meanCoralCover: agg.meanCoralCover ? Math.round(agg.meanCoralCover * 10) / 10 : 0,
        meanBleaching: agg.meanBleaching ? Math.round(agg.meanBleaching * 10) / 10 : 0,
        latestSurvey: agg.latestSurvey || null
      };
    });

    res.json({
      pendingSurveys,
      pendingSpecies,
      pendingRestorations,
      totalPending: pendingSurveys.length + pendingSpecies.length + pendingRestorations.length,
      dataQualityFlags: {
        missingPhotosCount: flaggedSurveysNoPhoto.length,
        missingPhotosList: flaggedSurveysNoPhoto,
        severeBleachingAlerts: flaggedSevereBleaching,
        foreignLegacyAudited: {
          surveys: foreignSurveysCount,
          species: foreignSpeciesCount,
          restorations: foreignRestorationsCount,
          total: foreignSurveysCount + foreignSpeciesCount + foreignRestorationsCount
        }
      },
      regionalCoverage,
      userRoleSummary: {
        totalUsers: users.length,
        admins: userRoles.admin,
        researchers: userRoles.researcher,
        public: userRoles.public
      },
      restorationFollowUp: restorationsNeedingFollowup
    });
  } catch (error) {
    console.error('getCommandCenterOverview error:', error);
    res.status(500).json({ message: 'Failed to aggregate command center data' });
  }
};

// GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// PUT /api/admin/users/:id/role
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'researcher', 'public'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user role' });
  }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User removed' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// GET /api/admin/users/:id — detailed profile with activity stats
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Gather surveys submitted by this user
    const [surveys, restorations, speciesSightings] = await Promise.all([
      Survey.find({ surveyedBy: user._id, isForeignLegacy: { $ne: true } })
        .select('location region date coralCoverPercent bleachingPercent depth status')
        .sort({ date: -1 })
        .limit(10)
        .lean(),
      Restoration.find({ loggedBy: user._id, isForeignLegacy: { $ne: true } })
        .select('siteName method status date')
        .sort({ date: -1 })
        .limit(5)
        .lean(),
      Species.find({ loggedBy: user._id, isForeignLegacy: { $ne: true } })
        .select('name type location date')
        .sort({ date: -1 })
        .limit(5)
        .lean()
    ]);

    // Compute quick stats
    const surveyStats = surveys.length > 0 ? {
      total: surveys.length,
      verified: surveys.filter(s => s.status === 'verified').length,
      pending: surveys.filter(s => s.status === 'pending').length,
      avgCover: Math.round(surveys.reduce((a, s) => a + (s.coralCoverPercent || 0), 0) / surveys.length * 10) / 10,
      avgBleaching: Math.round(surveys.reduce((a, s) => a + (s.bleachingPercent || 0), 0) / surveys.length * 10) / 10,
    } : null;

    res.json({
      user,
      surveys,
      restorations,
      speciesSightings,
      surveyStats
    });
  } catch (error) {
    console.error('getUserProfile error:', error);
    res.status(500).json({ message: 'Failed to load user profile' });
  }
};

// GET /api/admin/verification-queue (Unified queue across all 3 data loggings)
exports.getUnifiedVerificationQueue = async (req, res) => {
  try {
    const pendingFilter = {
      $or: [{ status: 'pending' }, { status: { $exists: false } }, { status: null }],
      isForeignLegacy: { $ne: true }
    };

    const [surveys, species, restorations] = await Promise.all([
      Survey.find(pendingFilter)
        .populate('surveyedBy', 'name email role')
        .populate('siteId', 'name region coordinates')
        .sort({ date: -1, createdAt: -1 }),
      Species.find(pendingFilter)
        .populate('recordedBy', 'name email role')
        .populate('linkedSurvey', 'location date')
        .sort({ sightingDate: -1, createdAt: -1 }),
      Restoration.find(pendingFilter)
        .populate('loggedBy', 'name email role')
        .populate('siteId', 'name region')
        .sort({ datePlanted: -1, createdAt: -1 })
    ]);

    const totalPending = surveys.length + species.length + restorations.length;

    res.json({
      surveys,
      species,
      restorations,
      totalPending
    });
  } catch (error) {
    console.error('getUnifiedVerificationQueue error:', error);
    res.status(500).json({ message: 'Failed to fetch unified verification queue' });
  }
};

