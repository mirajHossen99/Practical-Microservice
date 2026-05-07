import { z } from "zod";

export const OrderDTOSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  userEmail: z.string(),
  cartSessionId: z.string(),
});

export const CartItemDTOSchema = z.object({
  productId: z.string(),
  inventoryId: z.string(),
  quantity: z.number(),
});
