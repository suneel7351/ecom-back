import express from "express";
import Controller from "../../controllers/product/orderController.js";
import { Authenticate, AuthrizeRole } from "../../middleware/Authentication.js";
export const router = express.Router();

router.route("/order/new").post(Authenticate, Controller.newOrder);
router.route("/order/me").get(Authenticate, Controller.getMyOrders);
router
  .route("/order/:id")
  .get(Authenticate, Controller.getOrderDetails)
  .delete(Authenticate, AuthrizeRole("admin"), Controller.deleteOrder)
  .put(Authenticate, AuthrizeRole("admin"), Controller.updateOrderStatus);
router
  .route("/admin/orders")
  .get(Authenticate, AuthrizeRole("admin"), Controller.getAllOrders);
router
  .route("/admin/order/:id")
  .delete(Authenticate, AuthrizeRole("admin"), Controller.deleteOrder)
  .put(Authenticate, AuthrizeRole("admin"), Controller.updateOrderStatus);
