import express from "express";
import Controller from "../../controllers/user/controller.js";
import { Authenticate, AuthrizeRole } from "../../middleware/Authentication.js";
export const router = express.Router();

router.route("/user/register").post(Controller.register);
router.route("/user/login").post(Controller.login);
router.route("/user/logout").get(Controller.logout);
router.route("/user/profile").get(Authenticate, Controller.profile);
router
  .route("/user/password/reset/token")
  .post(Controller.sendResetPasswordToken);
router.route("/user/password/forgot").post(Controller.forgotPassword);

router
  .route("/user/password/update")
  .put(Authenticate, Controller.changePassword);
router
  .route("/user/profile/update")
  .put(Authenticate, Controller.updateProfile);

router
  .route("/admin/users")
  .get(Authenticate, AuthrizeRole("admin"), Controller.getAllUsers);

router
  .route("/admin/user/:id")
  .get(Authenticate, AuthrizeRole("admin"), Controller.getUserDetails)
  .put(Authenticate, AuthrizeRole("admin"), Controller.updateUserRole)
  .delete(Authenticate, AuthrizeRole("admin"), Controller.deleteUser);

router.route("/admin/");
