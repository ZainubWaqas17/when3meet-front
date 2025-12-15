// routes/availabilityRoutes.js
const router = require('express').Router({ mergeParams: true });
const ctrl = require('../controllers/availability_controller');

// Upsert participant availability for an event
// PUT /api/events/:eventId/availabilities
router.put('/events/:eventId/availabilities', ctrl.upsertAvailability);

// List & read
// GET /api/events/:eventId/availabilities
// GET /api/availabilities/:availabilityId
router.get('/events/:eventId/availabilities', ctrl.listAvailabilitiesForEvent);
router.get('/availabilities/:availabilityId', ctrl.getAvailability);

// Delete
// DELETE /api/availabilities/:availabilityId
// DELETE /api/events/:eventId/availabilities/by-email
router.delete('/availabilities/:availabilityId', ctrl.deleteAvailability);
router.delete('/events/:eventId/availabilities/by-email', ctrl.deleteAvailabilityByEmail);

module.exports = router;
