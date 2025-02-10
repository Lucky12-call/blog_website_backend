import { User } from "../models/userSchema.js";
import { catchAsyncErrors } from "./catchAsyncError.js";
import jwt from "jsonwebtoken";

//Authentication
export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    return res
      .status(400)
      .json({ success: false, message: "User is not authenticated!" });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  req.user = await User.findById(decoded.id);
  next();
});

//Authorization
export const isAuthorized = (...roles) => {
  return (req, _, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(400)
        .json({
          success: false,
          message: `Uer with this role ${req.user.role} is not allowed to access this resource`,
        });
    }
    next();
  };
};
