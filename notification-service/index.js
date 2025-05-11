const { Kafka } = require("kafkajs");
const nodemailer = require("nodemailer");

const KAFKA_BROKER = process.env.KAFKA_BROKER || "localhost:9092";
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const RECEIVER_EMAIL = process.env.RECEIVER_EMAIL;

// Setup email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// Setup Kafka consumer
const kafka = new Kafka({
  clientId: "notification-service",
  brokers: [KAFKA_BROKER],
});

const consumer = kafka.consumer({ groupId: "notification-group" });

// Handle order created event
const handleOrderCreated = async (orderData) => {
  console.log(`Notification: New order created with ID: ${orderData.orderId}`);

  try {
    await transporter.sendMail({
      from: EMAIL_USER,
      to: RECEIVER_EMAIL,
      subject: "Order Confirmation",
      text: `
      New order #${orderData.orderId} has been created.

      Order details:
      User ID: ${orderData.userId}
      `,
    });
    console.log(`Email notification sent to ${RECEIVER_EMAIL}`);
  } catch (error) {
    console.error("Failed to send email:", error);
  }
};

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: "order-events", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const messageValue = JSON.parse(message.value.toString());
        console.log({
          value: message.value.toString(),
        });

        // Handle different event types
        if (messageValue.type === "ORDER_CREATED") {
          handleOrderCreated(messageValue.data);
        }
      } catch (error) {
        console.error("Error processing message:", error);
      }
    },
  });
};

// Start the service
console.log("Starting Notification Service...");
run().catch(console.error);
