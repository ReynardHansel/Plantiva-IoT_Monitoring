import * as mqtt from "mqtt";
import { db } from "~/server/db";

const MQTT_BROKER_URL = "mqtt://192.168.253.62:1873";
const MQTT_TOPIC = "data/sensor";

let client: mqtt.MqttClient | null = null;

export function initMqttClient() {
  if (client) return; // Prevent multiple connections

  client = mqtt.connect(MQTT_BROKER_URL);

  client.on("connect", () => {
    console.log("Connected to MQTT broker");
    client!.subscribe(MQTT_TOPIC, (err) => {
      if (err) {
        console.error("Error subscribing to topic:", err);
      } else {
        console.log(`Subscribed to topic: ${MQTT_TOPIC}`);
      }
    });
  });

  client.on("message", async (topic, message) => {
    console.log(`Received message on topic ${topic}: ${message.toString()}`);

    try {
      const data = JSON.parse(message.toString());
      await db.data.create({
        data: {
          temperature: data.temperature,
          air_humidity: data.air_humidity,
          ground_humidity: data.ground_humidity,
          watered: data.watered,
          fanned: data.fanned,
        },
      });
      console.log("Data saved to database");
    } catch (error) {
      console.error("Error saving data to database:", error);
    }
  });

  client.on("error", (err) => {
    // console.error("reached here");
    console.error("MQTT client error:", err);
  });
}

export function getMqttClient() {
  return client;
}
