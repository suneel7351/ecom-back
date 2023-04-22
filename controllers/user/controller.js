import { AsyncError } from "../../middleware/AsyncError.js";
import ErrorHandler from "../../utility/errorHandlerClass.js";
import User from "../../models/user/User.js";
import { sendToken } from "../../utility/sendToken.js";
import { sendMail } from "../../utility/sendMail.js";
import crypto from "crypto";
import cloudinary from "cloudinary";
class Controller {
  // User Register

  static register = AsyncError(async (req, res, next) => {
    const { name, email, password, avatar } = req.body;
    if (!name || !email || !password) {
      return next(new ErrorHandler(400, "All fields are required."));
    }

    let user = await User.findOne({ email });
    if (user) {
      return next(
        new ErrorHandler(400, "User with this email is already exist.")
      );
    }

    const upload = await cloudinary.v2.uploader.upload(avatar, {
      folder: "EccomerUser",
    });

    user = new User({
      name,
      email,
      password,
      avatar: {
        public_id: upload.public_id,
        url: upload.secure_url,
      },
    });

    await user.save();
    sendToken(user, res, 201, "User registered successfully.");
  });

  // User Login

  static login = AsyncError(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new ErrorHandler(400, "All fields are required."));
    }
    let user = await User.findOne({ email }).select("+password");
    if (!user) {
      return next(
        new ErrorHandler(
          400,
          "Email or password incorrect,login with correct credentials."
        )
      );
    }
    const match = await user.comparePassword(password);

    if (!match) {
      return next(
        new ErrorHandler(
          400,
          "Invalid Email or password ,login with correct credentials."
        )
      );
    }
    sendToken(user, res, 200, "Logged in successfully.");
  });
  static logout = AsyncError(async (req, res, next) => {
    res.cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
      secure: true,
    });

    res.status(200).json({
      success: true,
      message: "Logged Out Successfully.",
    });
  });

  // Get my profile

  static profile = AsyncError(async (req, res, next) => {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new ErrorHandler(404, "User not found."));
    }
    res.status(200).json({ success: true, user });
  });

  // Send Reset Password Token to reset password

  static sendResetPasswordToken = AsyncError(async (req, res, next) => {
    const { email } = req.body;
    if (!email) {
      return next(new ErrorHandler(400, "Email is required."));
    }
    let user = await User.findOne({ email });
    if (!user) {
      return next(new ErrorHandler(404, "User not found."));
    }
    const token = user.generateResetPasswordToken();
    await user.save();

    const message = `Your Reset password link is :- \n\n  ${process.env.CLIENT_URL}/password/reset/${token}`;
    try {
      await sendMail(email, "Send token to reset Password", message);
      res.status(200).json({
        success: true,
        message: "Token send successfully on your mail",
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save();
      return next(new ErrorHandler(400, error.message));
    }
  });

  // Reset Password

  static forgotPassword = AsyncError(async (req, res, next) => {
    const { password, confirmPassword, token } = req.body;
    if (!password || !confirmPassword || !token) {
      return next(new ErrorHandler(400, "All fields are required."));
    }
    if (password !== confirmPassword) {
      return next(
        new ErrorHandler(400, "Password and confirm password must be same.")
      );
    }
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    let user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) {
      return next(new ErrorHandler(400, "Invalid Token or has been expired."));
    }
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password reset successfully." });
  });

  // Change Password

  static changePassword = AsyncError(async (req, res, next) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return next(
        new ErrorHandler(
          400,
          "Old password and New password both are required."
        )
      );
    }
    const user = await User.findById(req.user._id).select("+password");
    const match = await user.comparePassword(oldPassword);
    if (!match) {
      return next(new ErrorHandler(400, "incorrect old password."));
    }
    user.password = newPassword;
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "Password changed successfully." });
  });

  // Update Profile except password

  static updateProfile = AsyncError(async (req, res, next) => {
    const { name, email, avatar } = req.body;
    let user = await User.findById(req.user._id);
    if (name) {
      user.name = name;
    }
    if (email) {
      user.email = email;
    }
    if (avatar) {
      await cloudinary.v2.uploader.destroy(user.avatar.public_id);
      const upload = await cloudinary.v2.uploader.upload(avatar, {
        folder: "EccomerUser",
      });
      user.avatar = {
        public_id: upload.public_id,
        url: upload.secure_url,
      };
    }
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "Profile updated successfully." });
  });

  // get Users (Admin Route)

  static getAllUsers = AsyncError(async (req, res, next) => {
    const users = await User.find();
    res.status(200).json({ success: true, users });
  });

  // Get User Details (Admin Route)

  static getUserDetails = AsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(
        new ErrorHandler(404, `User not found with this id : ${req.params.id}`)
      );
    }
    res.status(200).json({ success: true, user });
  });

  // Update User Role (Admin Route)

  static updateUserRole = AsyncError(async (req, res, next) => {
    if (!req.body.role) {
      return next(new ErrorHandler(400, "Role is required."));
    }
    let user = await User.findById(req.params.id);
    if (!user) {
      return next(
        new ErrorHandler(404, `User not found with this id : ${req.params.id}`)
      );
    }

    if (req.body.role) {
      user.role = req.body.role;
    }
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "User role update successfully." });
  });

  // Delete User (Admin Route)

  static deleteUser = AsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(
        new ErrorHandler(404, `User not found with this id : ${req.params.id}`)
      );
    }

    await cloudinary.v2.uploader.destroy(user.avatar.public_id);

    await user.remove();

    res
      .status(200)
      .json({ success: true, message: "User deleted successfully." });
  });
}

export default Controller;
