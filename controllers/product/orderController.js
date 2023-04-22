import ErrorHandler from "../../utility/errorHandlerClass.js";
import { AsyncError } from "../../middleware/AsyncError.js";
import Order from "../../models/product/Order.js";
import Product from "../../models/product/Product.js";
class Controller {
  static newOrder = AsyncError(async (req, res, next) => {
    const {
      shippingInfo,
      orderItems,
      paymentInfo,
      taxPrice,
      shippingPrice,
      itemsPrice,
      totalPrice,
    } = req.body;
    const order = await Order.create({
      shippingInfo,
      orderItems,
      paymentInfo,
      taxPrice,
      shippingPrice,
      itemsPrice,
      totalPrice,
      user: req.user._id,
      paidAt: Date.now(),
    });

    res.status(201).json({ success: true, order });
  });

  //   Get single order details
  static getOrderDetails = AsyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email"
    );
    if (!order) {
      return next(new ErrorHandler(404, "Order not found."));
    }
    res.status(200).json({ success: true, order });
  });

  //   Logged in user orders

  static getMyOrders = AsyncError(async (req, res, next) => {
    const orders = await Order.find({ user: req.user._id });
    res.status(200).json({ success: true, orders });
  });

  //   get all orders
  static getAllOrders = AsyncError(async (req, res, next) => {
    const orders = await Order.find();

    let totalBalance = 0;
    orders.forEach((element) => {
      totalBalance += element.totalPrice;
    });
    res.status(200).json({ success: true, orders, totalBalance });
  });

  static updateStock = async (id, quantity) => {
    const product = await Product.findById(id);
    product.Stock -= quantity;
    await product.save();
  };

  //   update order status (Admin Route)
  static updateOrderStatus = AsyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return next(new ErrorHandler(404, "Order not found."));
    }
    if (order.orderStatus === "Delivered") {
      return next(new ErrorHandler(400, "Order already delivered."));
    }

    if (order.orderStatus === "Shipped") {
      order.orderItems.forEach(async (element) => {
        await this.updateStock(element.product, element.quantity);
      });
    }

    order.orderStatus = req.body.status;
    if (req.body.status === "Delivered") {
      order.delivered = Date.now();
    }
    await order.save();
    res
      .status(200)
      .json({ success: true, message: "Status change successfully." });
  });

  //   Delete Order

  static deleteOrder = AsyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return next(new ErrorHandler(404, "Order not found."));
    }

    await order.remove();
    res
      .status(200)
      .json({ success: true, message: "Order deleted successfully." });
  });
}

export default Controller;
