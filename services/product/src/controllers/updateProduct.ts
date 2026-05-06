import { Request, Response, NextFunction } from "express";
import { prisma } from "@/prisma";
import axios from "axios";
import { ProductUpdateDTOSchema } from "@/schemas";
import { INVENTORY_URL } from "@/config";

const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Validate request body
    const parsedBody = ProductUpdateDTOSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({
        message: "Invalid product data",
        error: parsedBody.error.issues,
      });
    }

    // Check if the product exists
    const product = await prisma.product.findUnique({
      where: {
        id: req.params.id as string,
      },
    });

    if (!product) {
      return res.status(400).json({
        message: "Product not found",
      });
    }

    // update the product
    const updatedProduct = await prisma.product.update({
      where: {
        id: req.params.id as string,
      },
      data: parsedBody.data,
    });

    return res.status(200).json({ data: updatedProduct });
  } catch (error) {
    next(error);
  }
};

export default updateProduct;
