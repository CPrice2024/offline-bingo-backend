import express from "express";
import {
  transferCredit,
  getFounderTransactions,
  getSentTransactions,
  getNotifications,
  getFounderBalance
} from "../controllers/creditController.js";
import { protect } from "../middleware/protect.js"; 
const router = express.Router();

// 🛡️ Apply founder protection middleware
router.post("/transfer", protect("founder"), transferCredit);
router.get("/founder/transactions", protect("founder"), getFounderTransactions); // ✅ this one was missing protection
router.get("/transactions/sent", protect("founder"), getSentTransactions);
router.get("/notifications", protect("support"), getNotifications);
router.get("/founder/balance", protect("founder"), getFounderBalance);

export default router;
