import { Request, Response, NextFunction } from "express";
import { CartItemDTOSchema } from "@/schemas";
import redis from "@/redis";
import { v4 as uuid } from "uuid";
import { CART_TTL, INVENTORY_SERVICE } from "@/config";
import axios from "axios";

const addToCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate the request body
    const parsedBody = CartItemDTOSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({ error: parsedBody.error.issues });
    }

    let cartSessionId = (req.headers["x-cart-session-id"] as string) || null;

    // Check if cart session id is present in the request header and exits in store
    if (cartSessionId) {
      const exists = await redis.exists(`sessions:${cartSessionId}`);
      console.log("Session Exists: ", exists);

      if (!exists) {
        cartSessionId = null;
      }
    }

    // if cart session id is not present, create a new one
    if (!cartSessionId) {
      cartSessionId = uuid();
      console.log("New Session ID: ", cartSessionId);

      // Set the cart session id in the redis store
      await redis.setex(`sessions:${cartSessionId}`, CART_TTL, cartSessionId);

      // set the cart session id in the response header
      res.setHeader("x-cart-session-id", cartSessionId);
    }

    // check if the inventory is available
    const { data } = await axios.get(
      `${INVENTORY_SERVICE}/inventories/${parsedBody.data.inventoryId}`,
    );

    if (parseInt(data.quantity) < parsedBody.data.quantity) {
      return res.status(400).json({ message: "Inventory not available" });
    }

    // add item to the cart
    await redis.hset(
      `cart:${cartSessionId}`,
      parsedBody.data.productId,
      JSON.stringify({
        inventoryId: parsedBody.data.inventoryId,
        quantity: parsedBody.data.quantity,
      }),
    );

    // update the inventory
    await axios.put(
      `${INVENTORY_SERVICE}/inventories/${parsedBody.data.inventoryId}`,
      {
        quantity: parsedBody.data.quantity,
        actionType: "OUT",
      },
    );

    return res
      .status(201)
      .json({ message: "Item added to cart", cartSessionId });
  } catch (error) {
    next(error);
  }
};

export default addToCart;
