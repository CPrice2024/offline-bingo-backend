import express from 'express';
import {
  saveGameSummary,
  saveWinningCard,
  getSupportGameResults,
  getAllSupportGameResults,
  getFounderSupportResults,
} from '../controllers/gameResultController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/save-summary', protect('support'), saveGameSummary); 
router.post('/save-winner', protect('support'), saveWinningCard);
router.get('/support-results', protect('support'), getSupportGameResults);
router.get("/founder-support-results", protect("founder"), getFounderSupportResults);

// 🔐 Founder route to get all supports' game results
router.get('/all-support-results', protect('founder'), getAllSupportGameResults); 

export default router;
