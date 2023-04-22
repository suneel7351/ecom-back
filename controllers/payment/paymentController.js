import { AsyncError } from "../../middleware/AsyncError.js";
import User from "../../models/user/User.js";
import ErrorHandler from "../../utility/errorHandlerClass.js";
import { instance } from "../../server.js";
import crypto from "crypto";
import PaymentModel from "../../models/Payment.js";
class Payment {
  static createOrder = AsyncError(async (req, res, next) => {
    let user = await User.findById(req.user._id);
    const { amount } = req.body;
    if (!amount) return next(new ErrorHandler(400, "Amount is required."));
    if (user.role === "admin") {
      return next(
        new ErrorHandler(
          400,
          "There is not need to buy subscription for Admin."
        )
      );
    }
    const options = {
      amount: amount * 100, // amount in paise
      currency: "INR",
      receipt: "receipt_order_74394",
      payment_capture: 1,
    };

    const order = await instance.orders.create(options);

    res.status(201).json({
      success: true,
      order,
    });
  });

  static verification = AsyncError(async (req, res, next) => {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
      req.body;

    const generated_signature = crypto
      .createHmac("sha256", process.env.PAY_API_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isVerified = generated_signature === razorpay_signature;

    if (!isVerified) {
      // return res.redirect(`${process.env.CLIENT_URL}/payment/fail`);
      return res.status(200).json({ success: false, message: "not verified" });
    }

    await PaymentModel.create({
      razorpay_signature,
      razorpay_payment_id,
      razorpay_order_id,
    });

    // res.redirect(
    //   `${process.env.CLIENT_URL}/payment/success?reference=${razorpay_payment_id}`
    // );
    res.status(200).json({ success: true, id: razorpay_payment_id });
  });

  static getKeyId = AsyncError(async (req, res, next) => {
    res.status(200).json({
      success: true,
      key: process.env.PAY_API_KEY_ID,
    });
  });

  static cancelSubscription = AsyncError(async (req, res, next) => {
    let user = await User.findById(req.user._id);
    let refund = false;
    const subscriptionId = user.subscription.id;
    // cancel subscription
    await instance.subscriptions.cancel(subscriptionId);

    // Find Payment by razorpay subscription id
    let payment = await PaymentModel.findOne({
      razorpay_subscription_id: subscriptionId,
    });

    const diff = Date.now() - payment.createdAt;
    const refundTime = process.env.REFUND_DAY * 24 * 60 * 60 * 1000;
    if (refundTime > diff) {
      await instance.payments.refund(payment.razorpay_payment_id);
      refund = true;
    }
    await payment.deleteOne({ razorpay_subscription_id: subscriptionId });
    user.subscription.id = undefined;
    user.subscription.status = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: refund
        ? "Subscription cancelled,you will get refund within 7 working days."
        : "Subscription cancelled,No refund because subscription is cancelled after 7 days.",
    });
  });
}
export default Payment;
