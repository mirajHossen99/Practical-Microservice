import { z } from "zod";
import { Status } from "../prisma/generated/prisma/enums";

export const ProductCreateDTOSchema = z.object({
    sku: z.string().min(3).max(10),
    name: z.string().min(3).max(250),
    description: z.string().max(1000).optional(),
    price: z.number().min(0).default(0),
    status: z.nativeEnum(Status).optional().default(Status.DRAFT),
    
});

