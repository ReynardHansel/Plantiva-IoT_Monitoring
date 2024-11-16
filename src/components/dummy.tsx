"use client";

import React, { useState, useEffect } from "react";
import mqtt from "mqtt";
import { api } from "~/trpc/react";

interface Message {
  topic: string;
  msg: string;
}

interface SensorData {
  temperature: number;
  air_humidity: number;
  ground_humidity: number;
}

interface ActuatorData {
  watered: boolean;
  fanned: boolean;
}

export default function Dummy() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [actuatorData, setActuatorData] = useState<ActuatorData | null>(null);

  const saveDataMutation = api.plantiva.saveData.useMutation();
  const getLastReadingQuery = api.plantiva.getLastReading.useQuery();

  useEffect(() => {
    const client = mqtt.connect("ws://localhost:8080");

    client.on("connect", () => {
      console.log("Connected to the broker");

      const topic1 = "data/sensor";
      const topic2 = "data/actuator";

      client.subscribe(topic1, (err) => {
        if (err) {
          console.error("Subscription error:", err);
        } else {
          console.log(`Subscribed to topic '${topic1}'`);
        }
      });

      client.subscribe(topic2, (err) => {
        if (err) {
          console.error("Subscription error:", err);
        } else {
          console.log(`Subscribed to topic '${topic2}'`);
        }
      });
    });

    client.on("message", async (topic, message) => {
      const msg = message.toString();
      console.log(`Received message from '${topic}': ${msg}`);
      setMessages((prevMessages) => [...prevMessages, { topic, msg }]);

      try {
        const lastReading = getLastReadingQuery.data;

        if (topic === "data/sensor") {
          const data: SensorData = JSON.parse(msg);
          setSensorData(data);

          if (lastReading) {
            // Save sensor data to the database
            const combinedData = {
              temperature: data.temperature,
              air_humidity: data.air_humidity,
              ground_humidity: data.ground_humidity,
              watered: lastReading.watered,
              fanned: lastReading.fanned,
            };

            console.log("Combined sensor data to save:", combinedData);

            await saveDataMutation.mutateAsync(combinedData);

            console.log("Sensor data sent to tRPC for saving");
          } else {
            console.error("No last reading available to combine with sensor data");
          }
        } else if (topic === "data/actuator") {
          const data: ActuatorData = JSON.parse(msg);
          setActuatorData(data);

          if (lastReading) {
            // Save actuator data to the database
            const combinedData = {
              temperature: lastReading.temperature,
              air_humidity: lastReading.air_humidity,
              ground_humidity: lastReading.ground_humidity,
              watered: data.watered,
              fanned: data.fanned,
            };

            console.log("Combined actuator data to save:", combinedData);

            await saveDataMutation.mutateAsync(combinedData);

            console.log("Actuator data sent to tRPC for saving");
          } else {
            console.error("No last reading available to combine with actuator data");
          }
        }
      } catch (error) {
        console.error("Error processing message:", error);
      }
    });

    client.on("error", (err) => {
      console.error("Connection error:", err);
      client.end();
    });

    client.on("close", () => {
      console.log("Disconnected from the broker");
    });

    return () => {
      client.end();
    };
  }, [sensorData, actuatorData, saveDataMutation, getLastReadingQuery.data]);

  return (
    <div className="h-screen w-screen bg-white">
      <div>
        <p>Dummy Trial</p>
        <div className="mb-4">
          <strong>Sensor Data:</strong> {JSON.stringify(sensorData)}
          <strong>Actuator Data:</strong> {JSON.stringify(actuatorData)}
        </div>
        {messages.map((message, index) => (
          <div key={index}>
            <strong>{message.topic}:</strong> {message.msg}
          </div>
        ))}
      </div>
    </div>
  );
}