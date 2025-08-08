import express from "express";
import { transferCredit } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Only founder can send credit
router.post("/", protect("founder"), transferCredit);

export default router;
