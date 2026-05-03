import { Request, Response, NextFunction } from "express";
import { prisma } from "@/prisma";
import { EmailVerificationDTOSchema } from "@/schemas";
import axios from "axios";
import { EMAIL_SERVICE } from "@/config";

const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate the request body
    const parsedBody = EmailVerificationDTOSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({ error: parsedBody.error.issues });
    }

    // Check if the user with email exists
    const user = await prisma.user.findUnique({
      where: { email: parsedBody.data.email },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the verification code for the user
    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        userId: user.id,
        code: parsedBody.data.code,
      },
    });

    if (!verificationCode) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    // if the verification code has expired
    if (verificationCode.expiresAt < new Date()) {
      return res.status(400).json({ error: "Verification code has expired" });
    }

    // Mark the user as verified
    await prisma.user.update({
      where: { id: user.id },
      data: { verified: true, status: "ACTIVE" },
    });

    // Update the verification code status to used
    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { status: "USED", verifiedAt: new Date() },
    });

    // Send success email
    await axios.post(`${EMAIL_SERVICE}/emails/send`, {
      recipient: user.email,
      subject: "Email Verified",
      body: `Hello ${user.name}, your email has been verified successfully. You can now log in to your account.`,
      source: "verify-email",
    });


    return res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    next(error);
  }
};

export default verifyEmail;
