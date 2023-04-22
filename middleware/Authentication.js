import jwt from "jsonwebtoken";
import User from "../models/user/User.js";
import ErrorHandler from "../utility/errorHandlerClass.js";
import { AsyncError } from "./AsyncError.js";
const { verify } = jwt;

export const Authenticate = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      // return next(new ErrorHandler(400, "Login to continue."));
      return res
        .status(400)
        .json({ success: false, message: "Login to continue." });
    }
    const { id } = verify(token, process.env.JWT_SECERET);
    req.user = await User.findById(id);
    next();
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Inter server error" });
  }
};

export const AuthrizeRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(400, "Only admin allow to access this resources.")
      );
    }
    next();
  };
};
