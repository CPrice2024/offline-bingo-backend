import jwt from "jsonwebtoken";
import Founder from "../models/founderModel.js";
import Support from "../models/supportModel.js";

export const protect = (role) => async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: "Not authorized, no token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ensure role matches
    if (decoded.role !== role) {
      return res.status(403).json({ message: `Access denied for role: ${decoded.role}` });
    }

    let user;
    if (role === "founder") {
      user = await Founder.findById(decoded.id).select("-password");
    } else if (role === "support") {
      user = await Support.findById(decoded.id).select("-password");
    }

    if (!user) return res.status(401).json({ message: `${role} not found` });

    req.user = user;
    req.userId = user._id;

    next();
  } catch (err) {
    console.error("❌ Token verification failed:", err.message);
    return res.status(401).json({ message: "Token failed" });
  }
};
