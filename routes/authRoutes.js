import express from "express";
import {
  signupFounder,
  signinFounder,
  signupSupport,
  signinSupport,
  getFounders,
  deleteFounder,
  updateSupport,
  getSupports,
  deleteSupport,
  getSupportProfile,
  getFounderProfile,
  getFounderTransactions,
  getFounderBalance,
  getSupportTransactions,
  getNotifications,
  transferCredit,
  getSupportById,
  getSupportCardType,
  logout,
  markNotificationAsRead,
  deductCommission,
  getSuperAgents,
  syncBalance,
  getSupportBalance,
  syncOfflineCommissions,
  syncOfflineSummaries,
  resetSupportBalance
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ---------- Founder Routes ----------
router.post("/founder/signup", signupFounder);
router.post("/founder/signin", signinFounder);
router.get("/founder", protect("founder"), getFounders);
router.delete("/founder/:id", protect("founder"), deleteFounder);
router.get("/founder/profile", protect("founder"), getFounderProfile);
router.get("/founder/balance", protect("founder"), getFounderBalance);
router.get("/transaction", protect("founder"), getFounderTransactions);
router.get("/founder/notifications", protect("founder"), getNotifications);
router.post("/transaction", protect("founder"), transferCredit);
router.post("/support/deduct", protect("support"), deductCommission);
// ---------- Support Routes ----------
router.post("/support/signup", protect("founder"), signupSupport);

router.post("/support/signin", signinSupport);
router.get("/support", protect("founder"), getSupports); 
router.delete("/support/:id", protect("founder"), deleteSupport);
router.put("/support/:id", protect("founder"), updateSupport);
router.get("/support/profile", protect("support"), getSupportProfile);
router.get("/support/transactions", protect("support"), getSupportTransactions);
router.get("/support/notifications", protect("support"), getNotifications);
router.patch("/support/notifications/:id", protect("support"), markNotificationAsRead);
router.get("/support/:id/card-type", protect("support"), getSupportCardType);
router.get("/support/:id", protect("support"), getSupportById);
router.get('/support/super-agents', protect("founder"), getSuperAgents);
router.post('/support/sync-balance', protect("support"), syncBalance);
router.get("/support/balance", protect("support"), getSupportBalance);
router.post("/sync/commissions", protect("support"), syncOfflineCommissions);
router.post("/sync/game-summaries", protect("support"), syncOfflineSummaries);
router.post("/support/reset-balance", protect("support"), resetSupportBalance);

// ---------- Common ----------
router.post("/logout", logout);

export default router;
