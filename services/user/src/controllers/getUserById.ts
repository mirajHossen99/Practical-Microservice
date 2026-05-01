import e, { Request, Response, NextFunction } from "express";
import { prisma } from "@/prisma";

const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Find the user by Id
    const user = await prisma.user.findUnique({
      where: { id: id as string },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};
