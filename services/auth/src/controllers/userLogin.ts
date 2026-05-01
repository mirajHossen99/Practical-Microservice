import { Request, Response, NextFunction } from "express";
import { prisma } from "@/prisma";
import { UserLoginDTOSchema } from "@/schemas";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { LoginAttempt } from "../../prisma/generated/prisma/enums";

type LoginHistory = {
  userId: string;
  ipAddress: string | undefined;
  userAgent: string | undefined;
  attempt: LoginAttempt;
};

const createLoginHistory = async (info: LoginHistory) => {
  await prisma.loginHistory.create({
    data: {
      userId: info.userId,
      ipAddress: info.ipAddress,
      userAgent: info.userAgent,
      attempt: info.attempt,
    },
  });
};

const userLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check
    const ipAddress =
      (req.headers["x-forwarded-for"] as string) || req.ip || "";
    const userAgent = (req.headers["user-agent"] as string) || "";

    // Validate the request body
    const parsedBody = UserLoginDTOSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({ error: parsedBody.error.issues });
    }

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { email: parsedBody.data.email },
    });

    if (!user) {
      await createLoginHistory({
        userId: "Guest",
        ipAddress,
        userAgent,
        attempt: "FAILED",
      });

      return res.status(404).json({ error: "Invalid credentials" });
    }

    // compare the password
    const isPasswordValid = await bcrypt.compare(
      parsedBody.data.password,
      user.password,
    );
    if (!isPasswordValid) {
      await createLoginHistory({
        userId: user.id,
        ipAddress,
        userAgent,
        attempt: "FAILED",
      });

      return res.status(404).json({ error: "Invalid credentials" });
    }

    // Check if the user is verified
    if (!user.verified) {
      await createLoginHistory({
        userId: user.id,
        ipAddress,
        userAgent,
        attempt: "FAILED",
      });

      return res.status(403).json({ error: "User is not verified" });
    }

    // Check if the user is active
    if (user.status !== "ACTIVE") {
      await createLoginHistory({
        userId: user.id,
        ipAddress,
        userAgent,
        attempt: "FAILED",
      });

      return res.status(403).json({
        message: `Your account is ${user.status.toLocaleLowerCase()}`,
      });
    }

    // Generate Access token
    const accessToken = jwt.sign(
      {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "1h" },
    );

    await createLoginHistory({
      userId: user.id,
      ipAddress,
      userAgent,
      attempt: "SUCCESS",
    });

    return res.status(200).json({ accessToken });
  } catch (error) {
    next(error);
  }
};

export default userLogin;
