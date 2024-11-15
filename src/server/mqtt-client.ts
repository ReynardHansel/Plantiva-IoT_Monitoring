import * as mqtt from "mqtt";
import { db } from "~/server/db";

const MQTT_BROKER_URL = "ws://localhost:8080";
const TOPIC_SENSOR = "data/sensor";
const TOPIC_ACTUATOR = "data/actuator";

let client: mqtt.MqttClient | null = null;

export function initMqttClient() {
  if (client) return; // Prevent multiple connections

  client = mqtt.connect(MQTT_BROKER_URL);

  //* ON CONNECT:
  client.on("connect", () => {
    console.log("Connected to MQTT broker");

    client!.subscribe(TOPIC_SENSOR, (err) => {
      if (err) {
        console.error("Error subscribing to topic:", err);
      } else {
        console.log(`Subscribed to topic: ${TOPIC_SENSOR}`);
      }
    });

    client!.subscribe(TOPIC_ACTUATOR, (err) => {
      if (err) {
        console.error("Error subscribing to topic:", err);
      } else {
        console.log(`Subscribed to topic: ${TOPIC_ACTUATOR}`);
      }
    });
  });

  client.on("message", async (topic, message) => {
    console.log(`Received message on topic ${topic}: ${message.toString()}`);
  
    try {
      const data = JSON.parse(message.toString());
      console.log("Parsed data:", data); // Log the parsed data
  
      const createdData = await db.data.create({
        data: {
          temperature: data.temperature,
          air_humidity: data.air_humidity,
          ground_humidity: data.ground_humidity,
          watered: data.watered,
          fanned: data.fanned,
        },
      });
  
      console.log("Data saved to database:", createdData); // Log the created data
    } catch (error) {
      console.error("Error saving data to database:", error);
    }
  });

  client.on("error", (err) => {
    // console.error("reached here");
    console.error("MQTT client error:", err);
    client!.end();
  });

  client.on("close", () => {
    console.log("Disconnected from MQTT broker");
  })
}

export function getMqttClient() {
  return client;
}
