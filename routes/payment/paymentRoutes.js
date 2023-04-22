import express from "express";
import Payment from "../../controllers/payment/paymentController.js";
// import PaymentController from "../../controllers/payment/paymentController.js";
import { Authenticate } from "../../middleware/Authentication.js";
export const router = express.Router();

router.route("/getKey").get(Payment.getKeyId);

router.route("/create-order").post(Authenticate, Payment.createOrder);
router.route("/verify").post(Authenticate,Payment.verification)