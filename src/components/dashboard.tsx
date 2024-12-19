"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Droplet, Thermometer, Wind, Fan } from "lucide-react";
import { api } from "~/trpc/react";
import mqtt from "mqtt";

// Helper function to format the last updated time and date using ISO string slicing
const formatLastUpdated = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const timeDiff = now.getTime() - date.getTime();
  const hoursDiff = timeDiff / (1000 * 3600);

  const timeString = date.toISOString().slice(11, 16);

  if (hoursDiff > 24) {
    const dateString = date
      .toISOString()
      .slice(0, 10)
      .split("-")
      .reverse()
      .join("/");
    return `${timeString} at ${dateString}`;
  } else {
    return `${timeString}`;
  }
};

type ReadingType = {
  id: number;
  time: Date;
  temperature: number;
  air_humidity: number;
  ground_humidity: number;
  watered: boolean;
  fanned: boolean;
};

interface Message {
  topic: string;
  msg: string;
}

interface SensorData {
  temperature: number;
  air_humidity: number;
  ground_humidity: number;
  time: string;
}

interface ActuatorData {
  watered: boolean;
  fanned: boolean;
  time: string;
}

export function DashboardComponent() {
  const { data, isLoading, error } = api.plantiva.getDashboardData.useQuery();
  const [currentReading, setCurrentReading] = useState<ReadingType | null>(
    null,
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [actuatorData, setActuatorData] = useState<ActuatorData | null>(null);
  const [lastWateredTime, setLastWateredTime] = useState<string | null>(null);
  const [lastFannedTime, setLastFannedTime] = useState<string | null>(null);

  const saveDataMutation = api.plantiva.saveData.useMutation();
  const getLastReadingQuery = api.plantiva.getLastReading.useQuery();

  useEffect(() => {
    const client = mqtt.connect("ws://192.168.170.62:8181");

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
        const currentTime = new Date();
        currentTime.setHours(currentTime.getHours() + 7); // Adjust for GMT+7
        const currentTimeString = currentTime.toISOString();

        if (topic === "data/sensor") {
          const data: SensorData = { ...JSON.parse(msg), time: currentTimeString };
          setSensorData(data);

          const combinedData = {
            temperature: data.temperature,
            air_humidity: data.air_humidity,
            ground_humidity: data.ground_humidity,
            watered: lastReading?.watered ?? false,
            fanned: lastReading?.fanned ?? false,
          };

          console.log("Current time:", currentTimeString);
          console.log("Combined sensor data to save:", combinedData);

          await saveDataMutation.mutateAsync(combinedData);

          console.log("Sensor data sent to tRPC for saving");
        } else if (topic === "data/actuator") {
          const data: ActuatorData = { ...JSON.parse(msg), time: currentTimeString };
          console.log(`Received message from '${topic}': ${msg}`);
          setActuatorData(data);

          // Update last watered and fanned times if the actuator data is true
          if (data.watered) {
            setLastWateredTime(data.time);
          }
          if (data.fanned) {
            setLastFannedTime(data.time);
          }

          // Fetch the latest sensor data before saving the actuator data
          const latestSensorData = await getLastReadingQuery.refetch();

          const combinedData = {
            temperature: latestSensorData.data?.temperature ?? 0,
            air_humidity: latestSensorData.data?.air_humidity ?? 0,
            ground_humidity: latestSensorData.data?.ground_humidity ?? 0,
            watered: data.watered,
            fanned: data.fanned,
          };

          console.log("Combined actuator data to save:", combinedData);

          await saveDataMutation.mutateAsync(combinedData);

          console.log("Actuator data sent to tRPC for saving");
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
  }, [sensorData, actuatorData, saveDataMutation, getLastReadingQuery]);

  useEffect(() => {
    console.log("Data changed:", data);
    if (data?.currentReading) {
      setCurrentReading(data.currentReading);
    }
    if (data?.lastWatered) {
      setLastWateredTime(data.lastWatered.time.toISOString());
    }
    if (data?.lastFanned) {
      setLastFannedTime(data.lastFanned.time.toISOString());
    }
  }, [data]);

  if (isLoading)
    return (
      <div className="grid h-screen w-screen place-items-center text-xl font-bold">
        Loading...
      </div>
    );
  if (error) return <div>An error occurred: {error.message}</div>;

  const historicalData = data?.historicalData.map((reading) => ({
    time: new Date(reading.time).toISOString().slice(11, 16),
    temperature: reading.temperature,
    airHumidity: reading.air_humidity,
    groundHumidity: reading.ground_humidity,
  }));

  const getLastUpdatedTime = (
    actuatorDataTime: string | null,
    lastReadingTime: string | null,
  ) => {
    if (actuatorDataTime) {
      return formatLastUpdated(actuatorDataTime);
    } else if (lastReadingTime) {
      return formatLastUpdated(lastReadingTime);
    } else {
      return "N/A";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-3xl font-bold">
          Plantiva - Dashboard
        </h1>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Temperature</CardTitle>
              <Thermometer className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sensorData?.temperature.toFixed(1) ??
                  currentReading?.temperature.toFixed(1) ??
                  "N/A"}
                °C
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Last Updated:{" "}
                {sensorData
                  ? formatLastUpdated(sensorData.time)
                  : currentReading
                    ? formatLastUpdated(currentReading.time.toISOString())
                    : "N/A"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Air Humidity
              </CardTitle>
              <Wind className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sensorData?.air_humidity.toFixed(1) ??
                  currentReading?.air_humidity.toFixed(1) ??
                  "N/A"}
                %
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Last Updated:{" "}
                {sensorData
                  ? formatLastUpdated(sensorData.time)
                  : currentReading
                    ? formatLastUpdated(currentReading.time.toISOString())
                    : "N/A"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ground Humidity
              </CardTitle>
              <Droplet className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sensorData?.ground_humidity.toFixed(1) ??
                  currentReading?.ground_humidity.toFixed(1) ??
                  "N/A"}
                %
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Last Updated:{" "}
                {sensorData
                  ? formatLastUpdated(sensorData.time)
                  : currentReading
                    ? formatLastUpdated(currentReading.time.toISOString())
                    : "N/A"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>24-Hour Monitoring</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    stroke="#ff7300"
                    name="Temperature (°C)"
                  />
                  <Line
                    type="monotone"
                    dataKey="airHumidity"
                    stroke="#8884d8"
                    name="Air Humidity (%)"
                  />
                  <Line
                    type="monotone"
                    dataKey="groundHumidity"
                    stroke="#82ca9d"
                    name="Ground Humidity (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Last Watered
              </CardTitle>
              <Droplet className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getLastUpdatedTime(
                  actuatorData?.watered ? actuatorData.time : null,
                  lastWateredTime,
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Next watering schedule not available
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Fanned</CardTitle>
              <Fan className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getLastUpdatedTime(
                  actuatorData?.fanned ? actuatorData.time : null,
                  lastFannedTime,
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Next fanning schedule not available
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// TODO:
// The data being fetched is already in correct time, so don't add +7 hours
// Add +7 to the received data from mqtt (sensorData and actuatorData?)

// TODO:
// - Make the chart display in interval of 1h only
// - Seperate MQTT logic to mqtt-client