import { User } from "../models/userSchema.js";
import { catchAsyncErrors } from "../middleware/catchAsyncError.js";
import { sendToken } from "../utils/jwtToken.js";
import cloudinary from "cloudinary";

// register
export const register = catchAsyncErrors(async (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "User avatar required!" });
  }

  const { avatar } = req.files;

  const allowedFormats = ["image/png", "image/jpg", "image/jpeg", "image/webp"];
  if (!allowedFormats.includes(avatar.mimetype)) {
    return res.status(400).json({
      success: false,
      message:
        "Invalid file type. Please provide your avatar in png, jpg, webp formate!",
    });
  }

  const { name, email, password, role, education, phone } = req.body;

  if (
    !name ||
    !email ||
    !password ||
    !role ||
    !education ||
    !phone ||
    !avatar
  ) {
    return res.status(400).json({
      success: false,
      message: "Please fill full details",
    });
  }

  let user = await User.findOne({ email });
  if (user) {
    return res.status(400).json({
      success: false,
      message: "User already exists",
    });
  }

  const cloudinaryResponse = await cloudinary.uploader.upload(
    avatar.tempFilePath
  );

  if (!cloudinaryResponse || cloudinaryResponse.error) {
    console.error(
      "Cloudinary error:",
      cloudinaryResponse.error || "unknown cloudinary error!"
    );
  }

  user = await User.create({
    name,
    email,
    password,
    role,
    education,
    phone,
    avatar: {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    },
  });
  sendToken(user, 200, "User registered successfully!", res);
});

// login
export const logIn = catchAsyncErrors(async (req, res, next) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: "Please fill full form!",
    });
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid email and password!",
    });
  }

  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return res.status(400).json({
      success: false,
      message: "Invalid email and password!",
    });
  }

  if (user.role !== role) {
    return res.status(400).json({
      success: false,
      message: `User with provided role (${role}) not found`,
    });
  }

  sendToken(user, 200, "User logged successfully!", res);
});

//logout function
export const logOut = catchAsyncErrors(async (_, res) => {
  res
    .status(200)
    .cookie("token", "", {
      expires: new Date(Date.now()),
      httpOnly: true,
    })
    .json({
      success: true,
      message: "User Logged Out!",
    });
});

export const getMyProfile = catchAsyncErrors(async (req, res) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    user,
  });
});

export const getAllAuthors = catchAsyncErrors(async (_, res) => {
  const authors = await User.find({ role: "Author" });

  res.status(200).json({
    success: true,
    authors,
  });
});
