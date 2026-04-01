import express from 'express';
import * as controller from '../controllers/journalController.js';

const router = express.Router();

// Save entry (create or update)
router.post('/entries', controller.saveEntry);

// Get single entry by date (YYYY-MM-DD)
router.get('/entries/:date', controller.getEntry);

// Get all entries
router.get('/entries', controller.getAllEntries);

// Get entries by month (year/month)
router.get('/entries/:year/:month', controller.getEntriesByMonth);

// Get streak info
router.get('/streak', controller.getStreak);

// Get statistics
router.get('/stats', controller.getStats);

export default router;
