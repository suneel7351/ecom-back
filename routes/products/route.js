import express from "express";
import Controller from "../../controllers/product/controller.js";
import { Authenticate, AuthrizeRole } from "../../middleware/Authentication.js";

export const router = express.Router();

router
  .route("/admin/product/new")
  .post(Authenticate, AuthrizeRole("admin"), Controller.createProduct);
router.route("/products").get(Controller.getAllProducts);
router
  .route("/admin/products")
  .get(Authenticate, AuthrizeRole("admin"), Controller.getAdminAllProducts);
router
  .route("/admin/product/:id")
  .put(Authenticate, AuthrizeRole("admin"), Controller.updateProduct)
  .delete(Authenticate, AuthrizeRole("admin"), Controller.deleteProduct);
router
  .route("/admin/product/stock/:id")
  .put(Authenticate, AuthrizeRole("admin"), Controller.updateProductStock);
router.route("/product/:id").get(Controller.singleProduct);

router.route("/product/review").put(Authenticate, Controller.productReview);
router.route("/all/products").get(Controller.getProducts)
router
  .route("/product/review/:id")
  .get(Controller.getAllReviews)
  .delete(Authenticate, Controller.deleteReview);
