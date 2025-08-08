import jwt from "jsonwebtoken";

export const generateToken = (user, role) => {
  return jwt.sign(
    { id: user._id, role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};
