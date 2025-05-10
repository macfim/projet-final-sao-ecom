const { Kafka } = require("kafkajs");

const KAFKA_BROKER = process.env.KAFKA_BROKER || "localhost:9092";

// Setup Kafka consumer
const kafka = new Kafka({
  clientId: "notification-service",
  brokers: [KAFKA_BROKER],
});

const consumer = kafka.consumer({ groupId: "notification-group" });

// Handle order created event
const handleOrderCreated = (orderData) => {
  console.log(`Notification: New order created with ID: ${orderData.id}`);
  console.log(`Sending email notification to user ${orderData.userId}`);
  // In a real system, this would send an actual email
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
