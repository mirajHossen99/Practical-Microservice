import amqp from "amqplib";
import { defaultSender, QUEUE_URL, transporter } from "./config";
import { prisma } from "./prisma";

const receiveFromQueue = async (
  queue: string,
  callback: (message: string) => void,
) => {
  const connection = await amqp.connect(QUEUE_URL);
  const channel = await connection.createChannel();

  const exchange = "order";
  await channel.assertExchange(exchange, "direct", { durable: true });

  const q = await channel.assertQueue(queue, { durable: true });
  await channel.bindQueue(q.queue, exchange, queue);

  channel.consume(
    q.queue,
    (msg) => {
      if (msg) {
        callback(msg.content.toString());
      }
    },
    { noAck: true },
  );
};

receiveFromQueue("send-email", async (msg) => {
  // console.log(`Received send-email: ${msg}`);

  const parsedBody = JSON.parse(msg);

  // Create email option
  const { id, userEmail, userName, grandTotal } = parsedBody;
  const from = defaultSender;
  const subject = "Order Confirmation";
  const body = `Thank you ${userName} for your order. Your order id is ${id}. Your order total is ${grandTotal}`;

  const emailOption = {
    from,
    to: userEmail,
    subject,
    text: body,
  };

  // Send the email
  const { rejected } = await transporter.sendMail(emailOption);
  if (rejected.length > 0) {
    console.log("Email rejected: ", rejected);
    return;
  }

  // Save email record in the database
  await prisma.email.create({
    data: {
      sender: from,
      recipient: userEmail,
      subject,
      body,
      source: "Checkout",
    },
  });
  console.log("Email sent");
});
