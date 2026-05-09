import { Request, Response, NextFunction } from "express";
import { prisma } from "@/prisma";
import axios from "axios";
import { OrderDTOSchema, CartItemDTOSchema } from "@/schemas";
import { PRODUCT_SERVICE, EMAIL_SERVICE, CART_SERVICE } from "@/config";
import { z } from "zod";
import sendToQueue from "@/queue";

const checkout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const parsedBody = OrderDTOSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({ errors: parsedBody.error.issues });
    }

    // Get cart details
    const { data: cartData } = await axios.get(`${CART_SERVICE}/cart/my-cart`, {
      headers: {
        "x-cart-session-id": parsedBody.data.cartSessionId,
      },
    });

    const cartItems = z.array(CartItemDTOSchema).safeParse(cartData.items);
    if (!cartItems.success) {
      return res.status(400).json({ errors: cartItems.error.issues });
    }

    if (cartItems.data.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Get product details from cart items
    const productDetails = await Promise.all(
      cartItems.data.map(async (item) => {
        const { data: product } = await axios.get(
          `${PRODUCT_SERVICE}/products/${item.productId}`,
        );
        return {
          productId: product.id as string,
          productName: product.name as string,
          sku: product.sku as string,
          price: product.price as number,
          quantity: item.quantity,
          total: (product.price as number) * item.quantity,
        };
      }),
    );

    const subTotal = productDetails.reduce((acc, item) => acc + item.total, 0);

    // TODO: will handle tax calculation later
    const tax = 0;
    const grandTotal = subTotal + tax;

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: parsedBody.data.userId,
        userName: parsedBody.data.userName,
        userEmail: parsedBody.data.userEmail,
        subTotal,
        tax,
        grandTotal,
        orderItems: {
          create: productDetails.map((item) => ({
            ...item,
          })),
        },
      },
    });

    console.log('Order created: ', order.id);

    // clear cart
    // await axios.get(`${CART_SERVICE}/cart/clear`, {
    //   headers: {
    //     "x-cart-session-id": parsedBody.data.cartSessionId,
    //   },
    // });

    // Send email
    // await axios.post(`${EMAIL_SERVICE}/emails/send`, {
    //   recipient: parsedBody.data.userEmail,
    //   subject: "Order Confirmation",
    //   body: `Thank you ${order.userName} for your order. Your order id is ${order.id}. Your order total is ${order.grandTotal}`,
    //   source: "Checkout",
    // });

    // send to queue
    sendToQueue("send-email", JSON.stringify(order));
    sendToQueue(
      "clear-cart",
      JSON.stringify({ cartSessionId: parsedBody.data.cartSessionId }),
    );

    return res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

export default checkout;
