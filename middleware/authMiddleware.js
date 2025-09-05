import jwt from "jsonwebtoken";
import DonorUser from "../models/DonorUser.js";
import Admin from "../models/Admin.js";
import ErrorResponse from "../utils/errorResponse.js";

export const protect = async (req, res, next) => {
  let token;

  // 1. Extract token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new ErrorResponse("Not authorized to access this route", 401));
  }

  try {
    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Try to find user in DonorUser model
    let user = await DonorUser.findById(decoded.id);
    
    // 4. If not found, try Admin model
    if (!user) {
      user = await Admin.findById(decoded.id);
    }

    // 5. If still not found, return error
    if (!user) {
      return next(new ErrorResponse("No user found with this ID", 404));
    }

    // 6. Attach found user to request
    req.user = user;

    next();
  } catch (err) {
    console.error("JWT Verification Error:", err.message);
    return next(new ErrorResponse("Not authorized to access this route", 401));
  }
};
