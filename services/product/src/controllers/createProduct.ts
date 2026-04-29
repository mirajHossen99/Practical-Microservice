import { Request, Response, NextFunction } from "express";
import { prisma } from "@/prisma";
import axios from "axios";
import { ProductCreateDTOSchema } from "@/schemas";
import { INVENTORY_URL } from "@/config";

const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Validate request body
    const parsedBody = ProductCreateDTOSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({
        message: "Invalid product data",
        error: parsedBody.error.issues,
      });
    }

    // Check if product with the same sku already exists
    const existingProduct = await prisma.product.findFirst({
      where: { sku: parsedBody.data.sku },
    });

    if (existingProduct) {
      return res
        .status(400)
        .json({ message: "Product with the same SKU already exists" });
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        ...parsedBody.data,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        description: true,
        status: true,
        price: true,
      },
    });
    console.log("Product created successfully", product.id);

    // Create inventory record for the new product
    const { data: inventory } = await axios.post(
      `${INVENTORY_URL}/inventories`,
      {
        productId: product.id,
        sku: product.sku,
      },
    );
    console.log("Inventory record created successfully", inventory.id);

    // update product with inventoryId
    await prisma.product.update({
      where: { id: product.id },
      data: { inventoryId: inventory.id },
    });
    console.log("Product updated with inventoryId successfully", product.id);

    return res.status(201).json({ ...product, inventoryId: inventory.id });
  } catch (error) {
    next(error);
  }
};

export default createProduct;
