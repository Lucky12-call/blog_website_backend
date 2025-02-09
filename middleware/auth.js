import { User } from "../models/userSchema.js";
import { catchAsyncErrors } from "./catchAsyncError.js";
import ErrorHandler from "./error.js";
import jwt from "jsonwebtoken";

//Authentication
export const isAuthenticated = catchAsyncErrors(async (req, _, next) => {
  const { token } = req.cookies;
  if (!token) {
    return next(new ErrorHandler("User is not authenticated!", 400));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  req.user = await User.findById(decoded.id);
  next();
});

//Authorization
export const isAuthorized = (...roles) => {
  return (req, _, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Uer with this role ${req.user.role} is not allowed to access this resource`,
          400
        )
      );
    }
    next();
  };
};
