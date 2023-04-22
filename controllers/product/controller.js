import Product from "../../models/product/Product.js";
import ErrorHandler from "../../utility/errorHandlerClass.js";
import { AsyncError } from "../../middleware/AsyncError.js";
import ApiFeatures from "../../utility/ApiFeatures.js";
import cloudinary from "cloudinary";

class Controller {
  static createProduct = AsyncError(async (req, res) => {
    let images = [];
    let imagesLink = [];
    if (typeof req.body.images === "string") {
      images.push(req.body.images);
    } else {
      images = req.body.images;
    }

    for (let i = 0; i < images.length; i++) {
      const uploader = await cloudinary.v2.uploader.upload(images[i], {
        folder: "products",
      });

      imagesLink.push({
        public_id: uploader.public_id,
        url: uploader.secure_url,
      });
    }
    req.body.images = imagesLink;
    req.body.user = req.user._id;
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, product });
  });
  static updateProduct = AsyncError(async (req, res, next) => {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return next(new ErrorHandler(404, "Product not found."));
    }

    for (let i = 0; i < product.images.length; i++) {
      await cloudinary.v2.uploader.destroy(product.images[i].public_id);
    }

    let images = [];
    let imgLinks = [];

    if (typeof req.body.images === "string") {
      images.push(req.body.images);
    } else {
      images = req.body.images;
    }

    for (let i = 0; i < images.length; i++) {
      const uploader = await cloudinary.v2.uploader.upload(images[i], {
        folder: "products",
      });

      imgLinks.push({
        public_id: uploader.public_id,
        url: uploader.secure_url,
      });
    }

    req.body.images = imgLinks;

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });

    res.status(200).json({ success: true, product });
  });
  static getAllProducts = AsyncError(async (req, res) => {
    const resultPerPage = Number(process.env.PAGE);
    const count = await Product.countDocuments();
    const apiFeatures = new ApiFeatures(req.query, Product.find())
      .search()
      .filter();

    let products = await apiFeatures.query;
    const filteredProducts = products.length;
    apiFeatures.pagination(resultPerPage);
    products = await apiFeatures.query.clone();
    res.status(200).json({
      success: true,
      products,
      productCount: count,
      resultPerPage,
      filteredProducts,
    });
  });
  static getProducts = AsyncError(async (req, res) => {
    const products = await Product.find();
    res.status(200).json({ success: true, products });
  });
  static getAdminAllProducts = AsyncError(async (req, res) => {
    const products = await Product.find({});

    res.status(200).json({
      success: true,
      products,
    });
  });
  static singleProduct = AsyncError(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return next(new ErrorHandler(404, "Product not found."));
    }
    res.status(200).json({ success: true, product });
  });
  static deleteProduct = AsyncError(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return next(new ErrorHandler(404, "Product not found."));
    }

    // await Product.remove({ _id: req.params.id });
    for (let i = 0; i < product.images.length; i++) {
      await cloudinary.v2.uploader.destroy(product.images[i].public_id);
    }

    await Product.deleteOne({ _id: req.params.id });
    res
      .status(200)
      .json({ success: true, message: "Product deleted successfully." });
  });

  // Add review

  static productReview = AsyncError(async (req, res, next) => {
    const { rating, comment, productId } = req.body;

    let review = {
      name: req.user.name,
      user: req.user._id,
      comment,
      rating: Number(rating),
    };

    let product = await Product.findById(productId);
    if (!product) {
      return next(
        new ErrorHandler(404, `Product not found with this id : ${productId}`)
      );
    }

    const isReviewed = product.reviews.find(
      (item) => item.user.toString() === req.user._id.toString()
    );

    if (isReviewed) {
      product.reviews.forEach((element) => {
        if (element.user.toString() === req.user._id.toString()) {
          element.comment = comment;
          element.rating = rating;
        }
      });
    } else {
      product.reviews.push(review);
      product.numOfReviews = product.reviews.length;
    }
    let avg = 0;
    product.reviews.forEach((element) => {
      avg = avg + element.rating;
    });

    product.ratings = avg / product.reviews.length;

    await product.save();

    res.status(200).json({ success: true, message: "Review" });
  });

  // Get All Reviews of a product

  static getAllReviews = AsyncError(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return next(new ErrorHandler(404, "Product not found."));
    }
    res.status(200).json({ success: true, reviews: product.reviews });
  });

  // Update Product Stock (Admin route)
  static updateProductStock = AsyncError(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    const { stock } = req.body;
    if (!product) {
      return next(new ErrorHandler(404, "Product not found."));
    }
    if (!stock) {
      return next(new ErrorHandler(404, "Stock is required."));
    }
    product.Stock += Number(stock);
    await product.save();
    res
      .status(200)
      .json({ success: true, message: "Product Stock update Successfully." });
  });

  // Delete Review

  static deleteReview = AsyncError(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return next(new ErrorHandler(404, "Product not found."));
    }
    const reviews = product.reviews.filter(
      (item) => item._id.toString() !== req.query.id
    );

    let avg = 0;
    reviews.forEach((element) => (avg += element.rating));
    let ratings = 0;

    if (reviews.length === 0) {
      ratings = 0;
    } else {
      ratings = avg / reviews.length;
    }
    const numOfReviews = reviews.length;

    await Product.findByIdAndUpdate(req.params.id, {
      ratings,
      numOfReviews,
      reviews,
    });

    res
      .status(200)
      .json({ success: true, message: "Review deleted successfully." });
  });
}

export default Controller;
