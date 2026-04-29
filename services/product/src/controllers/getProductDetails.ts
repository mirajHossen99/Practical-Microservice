import { Request, Response, NextFunction } from "express";
import { prisma } from "@/prisma";
import { INVENTORY_URL } from "@/config";
import axios from "axios";

const getProductDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {

    // Check validate product
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: id as string },
      select: {
        id: true,
        name: true,
        sku: true,
        description: true,
        price: true,
        inventoryId: true,
      },
      
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // If inventoryId is null, create inventory record for the product
    if (product.inventoryId === null) {
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

      // Return product details with inventory information
      return res.status(200).json({
        data: {
          ...product,
          inventoryId: inventory.id,
          stock: inventory.quantity || 0,
          stockStatus: inventory.quantity > 0 ? "In Stock" : "Out of Stock",
        },
      });
    }

    // If inventoryId is not null, return product details with inventory information
    const { data: inventory } = await axios.get(
      `${INVENTORY_URL}/inventories/${product.inventoryId}`,
    );

    return res.status(200).json({
      data: {
        ...product,
        inventoryId: product.inventoryId,
        stock: inventory.quantity || 0,
        stockStatus: inventory.quantity > 0 ? "In Stock" : "Out of Stock",
      },
    });

  } catch (error) {
    next(error);
  }
};

export default getProductDetails;
