import { z } from 'zod';

export const CartItemDTOSchema = z.object({
    productId: z.string(),
    inventoryId: z.string(),
    quantity: z.number().positive(),
});