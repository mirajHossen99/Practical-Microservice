import redis from "@/redis";
import { Request, Response, NextFunction } from "express";

const clearCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cartSessionId = (req.headers["x-cart-session-id"] as string) || null;
    if (!cartSessionId) {
      return res.status(200).json({ message: "Cart is empty" });
    }

    // check if the session id exists in the store
    const session = await redis.exists(`sessions:${cartSessionId}`);
    if (!session) {
      delete req.headers["x-cart-session-id"];
      return res.status(200).json({ message: "Cart is empty" });
    }

    // clear the cart
    await redis.del(`sessions:${cartSessionId}`);
    await redis.del(`cart:${cartSessionId}`);

    // clear the headers
    delete req.headers["x-cart-session-id"];

    return res.status(200).json({ message: "Cart cleared" });
  } catch (error) {
    next(error);
  }
};

export default clearCart;
