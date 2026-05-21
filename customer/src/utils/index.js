const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const amqplib=require('amqplib');
const { APP_SECRET,MESSAGE_BROKER_URL,EXCHANGE_NAME,QUEUE_NAME, CUSTOMER_BINDING_KEY } = require("../config");

//Utility functions
module.exports.GenerateSalt = async () => {
  return await bcrypt.genSalt();
};

module.exports.GeneratePassword = async (password, salt) => {
  return await bcrypt.hash(password, salt);
};

module.exports.ValidatePassword = async (
  enteredPassword,
  savedPassword,
  salt
) => {
  return (await this.GeneratePassword(enteredPassword, salt)) === savedPassword;
};

module.exports.GenerateSignature = async (payload) => {
  try {
    return await jwt.sign(payload, APP_SECRET, { expiresIn: "30d" });
  } catch (error) {
    console.log(error);
    return error;
  }
};

module.exports.ValidateSignature = async (req) => {
  try {
    const signature = req.get("Authorization");
    console.log(signature);
    const payload = await jwt.verify(signature.split(" ")[1], APP_SECRET);
    req.user = payload;
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

module.exports.FormateData = (data) => {
  if (data) {
    return { data };
  } else {
    throw new Error("Data Not found!");
  }
};

//message broker

module.exports.CreateChannel = async () => {
  if (!MESSAGE_BROKER_URL) {
    console.warn("MESSAGE_BROKER_URL is not set. Skipping message broker connection.");
    return null;
  }

  try {
    const connection = await amqplib.connect(MESSAGE_BROKER_URL);
    const channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, "direct", { durable: true });
    return channel;
  } catch (error) {
    console.warn("Message broker connection failed. Continuing without broker.", error.message);
    return null;
  }
};

module.exports.SubscribeMessage = async (channel, service, queueName) => {
  if (!channel) {
    console.warn("SubscribeMessage skipped: channel is not initialized.");
    return;
  }

  const resolvedQueue =
    typeof queueName === "string" && queueName.trim()
      ? queueName
      : (QUEUE_NAME || "CUSTOMER_QUEUE");

  const appQueue = await channel.assertQueue(resolvedQueue);

  await channel.bindQueue(appQueue.queue, EXCHANGE_NAME, CUSTOMER_BINDING_KEY);

  channel.consume(appQueue.queue, (data) => {
    if (!data) {
      return;
    }

    const content = data.content.toString();
    console.log("received data");
    console.log(content);

    if (service && typeof service.SubscribeEvents === "function") {
      try {
        service.SubscribeEvents(JSON.parse(content));
      } catch (error) {
        console.error("Failed to parse message payload:", error.message);
      }
    }
    channel.ack(data);
  });
};