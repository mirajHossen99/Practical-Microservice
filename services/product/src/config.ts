import dotenv from "dotenv";

dotenv.config({
  path: ".env",
});

export const INVENTORY_URL = process.env.INVENTORY_URL || "http://localhost:4002";