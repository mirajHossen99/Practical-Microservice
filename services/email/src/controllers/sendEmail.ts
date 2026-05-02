import { Request, Response, NextFunction } from "express";
import { prisma } from "@/prisma";
import { EmailCreateDTOSchema } from "@/schemas";
import { defaultSender, transporter } from "@/config";

const sendEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate the request body
    const parsedBody = EmailCreateDTOSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({ error: parsedBody.error.issues });
    }

    // Create email option
    const { sender, recipient, subject, body, source } = parsedBody.data;
    const from = sender || defaultSender;
    const emailOption = {
        from,
        to: recipient,
        subject,
        text: body,
    }

    // Send the email
    const { rejected } = await transporter.sendMail(emailOption);
    if (rejected.length > 0) {
      return res.status(500).json({ error: "Failed to send email" });
    }

    // Save email record in the database
    await prisma.email.create({
      data: {
        sender: from,
        recipient,
        subject,
        body,
        source,
      },
    });

    return res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    next(error);
  }
};

export default sendEmail;