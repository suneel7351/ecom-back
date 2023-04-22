import app from "./app.js";
import cloudinary from "cloudinary";
import Razorpay from "razorpay";

// Uncaught Error
process.on("uncaughtException", (err) => {
  console.log(`Server is shutting down due to ${err.message}`);
  process.exit(1);
});

const PORT = process.env.PORT || 6900;
cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECERET,
});

export const instance = new Razorpay({
  key_id: process.env.PAY_API_KEY_ID,
  key_secret: process.env.PAY_API_SECRET,
});

const server = app.listen(process.env.PORT, () => {
  console.log(`Server is running on ${PORT}`);
});

// Unhandle Promise Rejection

process.on("unhandledRejection", (err) => {
  console.log(`Server shutting down due to : ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});
