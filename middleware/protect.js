import jwt from "jsonwebtoken";
import Founder from "../models/founderModel.js";
import Support from "../models/supportModel.js";

export const protect = (role) => async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: "Not authorized, no token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (role === "founder") {
      const user = await Founder.findById(decoded.id);
      if (!user) return res.status(401).json({ message: "Founder not found" });
      req.user = user;
      req.userId = user._id;
    } else if (role === "support") {
      const user = await Support.findById(decoded.id);
      if (!user) return res.status(401).json({ message: "Support not found" });
      req.user = user;
      req.userId = user._id;
    } else {
      return res.status(403).json({ message: "Invalid role" });
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: "Token failed" });
  }
};
