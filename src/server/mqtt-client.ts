import mqtt from "mqtt";
// import { api } from "~/trpc/react";

const MQTT_BROKER_URL = "ws://localhost:8080";
const TOPIC_SENSOR = "data/sensor";
const TOPIC_ACTUATOR = "data/actuator";

let client: mqtt.MqttClient | null = null;

export function initMqttClient(
  onSensorMessage: (data: any) => void,
  onActuatorMessage: (data: any) => void,
  onError: (err: Error) => void,
  onClose: () => void
) {
  if (client) return; // Prevent multiple connections

  client = mqtt.connect(MQTT_BROKER_URL);

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

  client.on("message", (topic, message) => {
    const msg = message.toString();
    console.log(`Received message from '${topic}': ${msg}`);

    try {
      const data = JSON.parse(msg);
      if (topic === TOPIC_SENSOR) {
        onSensorMessage(data);
      } else if (topic === TOPIC_ACTUATOR) {
        onActuatorMessage(data);
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  client.on("error", (err) => {
    console.error("MQTT client error:", err);
    client!.end();
    onError(err);
  });

  client.on("close", () => {
    console.log("Disconnected from MQTT broker");
    onClose();
  });
}

export function getMqttClient() {
  return client;
}