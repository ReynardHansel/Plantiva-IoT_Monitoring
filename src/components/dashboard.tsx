"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Droplet, Thermometer, Wind } from "lucide-react"
import { api } from "~/trpc/react"


// Mock data for the chart
const data = [
  { time: "00:00", temperature: 22, airHumidity: 60, groundHumidity: 40 },
  { time: "04:00", temperature: 21, airHumidity: 62, groundHumidity: 38 },
  { time: "08:00", temperature: 23, airHumidity: 58, groundHumidity: 42 },
  { time: "12:00", temperature: 26, airHumidity: 55, groundHumidity: 45 },
  { time: "16:00", temperature: 28, airHumidity: 52, groundHumidity: 48 },
  { time: "20:00", temperature: 25, airHumidity: 57, groundHumidity: 44 },
]

export function DashboardComponent() {
  const data2 = api.plantiva.getDashboardData.useQuery()
  if (data2.data) {
    console.log(data2.data[0]?.ground_humidity);
  } else {
    console.log("Data is not yet available");
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">IoT Plant Monitoring Dashboard</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Temperature</CardTitle>
              <Thermometer className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24°C</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">+2°C from last hour</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Air Humidity</CardTitle>
              <Wind className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">58%</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">-2% from last hour</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ground Humidity</CardTitle>
              <Droplet className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">42%</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">+5% from last hour</p>
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
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="temperature" stroke="#ff7300" name="Temperature (°C)" />
                  <Line type="monotone" dataKey="airHumidity" stroke="#8884d8" name="Air Humidity (%)" />
                  <Line type="monotone" dataKey="groundHumidity" stroke="#82ca9d" name="Ground Humidity (%)" />
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
            <div className="text-2xl font-bold">2 hours ago</div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Next watering in approximately 10 hours</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// TODO: Display the fetched data in the dashboard