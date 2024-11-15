"use client";

import React, { useState, useEffect } from "react";
import mqtt from "mqtt";

interface Message {
  topic: string;
  msg: string;
}

export default function Dummy() {
  const [messages, setMessages] = useState<Message[]>([]);

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

    client.on("message", (topic, message) => {
      const msg = message.toString();
      console.log(`Received message from '${topic}': ${msg}`);
      setMessages((prevMessages) => [...prevMessages, { topic, msg }]);
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
  }, []);

  return (
    <div className="h-screen w-screen bg-white">
      <div>
        <p>Dummy Trial</p>
        {messages.map((message, index) => (
          <div key={index}>
            <strong>{message.topic}:</strong> {message.msg}
          </div>
        ))}
      </div>
    </div>
  );
}