"use client";

import React from "react";
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
import { Droplet, Thermometer, Wind } from "lucide-react";
import { api } from "~/trpc/react";

export function DashboardComponent() {
  const { data, isLoading, error } = api.plantiva.getDashboardData.useQuery();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>An error occurred: {error.message}</div>;
  console.log("Raw historical data:", data?.historicalData);

  const currentReading = data?.currentReading;
  const historicalData = data?.historicalData.map((reading) => ({
    time: new Date(reading.time).toISOString().slice(11, 16), //* --> Ambil si bagian time nya aja, biar gausa urusan sama GMT+7 dll
    temperature: reading.temperature,
    airHumidity: reading.air_humidity,
    groundHumidity: reading.ground_humidity,
  }));
  const lastWatered = data?.lastWatered;

  //   console.log('Historical Data:', historicalData);

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-3xl font-bold">
          IoT Plant Monitoring Dashboard
        </h1>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Temperature</CardTitle>
              <Thermometer className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentReading?.temperature.toFixed(1)}°C
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Last updated:{" "}
                {new Date(currentReading?.time ?? "").toISOString().slice(11, 16)}
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
                {currentReading?.air_humidity.toFixed(1)}%
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Last updated:{" "}
                {new Date(currentReading?.time ?? "").toISOString().slice(11, 16)}
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
                {currentReading?.ground_humidity.toFixed(1)}%
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Last updated:{" "}
                {new Date(currentReading?.time ?? "").toISOString().slice(11, 16)}
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Watered</CardTitle>
            <Droplet className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lastWatered
                ? new Date(lastWatered.time).toISOString().slice(11, 16)
                : "N/A"}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Next watering schedule not available
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
