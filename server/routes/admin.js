const express = require('express');
const { getUsers, updateUserRole, deleteUser, getCommandCenterOverview, getUserProfile } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All admin routes require admin role
router.use(protect, authorize('admin'));

router.get('/command-center', getCommandCenterOverview);
router.get('/users', getUsers);
router.get('/users/:id', getUserProfile);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

module.exports = router;
