import { z } from "zod";

export const InventoryDTOSchema = z.object({
    productId: z.string(),
    sku: z.string(),
    quantity: z.number().int().positive().optional().default(0)
    
});

export type InventoryCreateDTO = z.infer<typeof InventoryDTOSchema>;