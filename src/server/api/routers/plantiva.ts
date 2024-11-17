import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import EventEmitter from "events";
import { getMqttClient } from "~/server/mqtt-client";
const ee = new EventEmitter();

export const plantivaRouter = createTRPCRouter({
  getDashboardData: publicProcedure.query(async ({ ctx }) => {
    const lastReading = await ctx.db.data.findFirst({
      orderBy: { time: "desc" },
    });

    const last24Hours = await ctx.db.data.findMany({
      where: {
        time: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },

      orderBy: { time: "asc" },
    });

    const lastWatered = await ctx.db.data.findFirst({
      where: { watered: true },
      orderBy: { time: "desc" },
    });

    const lastFanned = await ctx.db.data.findFirst({
      where: { fanned: true },
      orderBy: { time: "desc" },
    });

    return {
      currentReading: lastReading,
      historicalData: last24Hours,
      lastWatered: lastWatered,
      lastFanned: lastFanned,
    };
  }),

  saveData: publicProcedure
    .input(
      z.object({
        temperature: z.number(),
        air_humidity: z.number(),
        ground_humidity: z.number(),
        watered: z.boolean(),
        fanned: z.boolean(),
      }),
    )

    .mutation(async ({ input, ctx }) => {
      const createdData = await ctx.db.data.create({
        data: {
          temperature: input.temperature,
          air_humidity: input.air_humidity,
          ground_humidity: input.ground_humidity,
          watered: input.watered,
          fanned: input.fanned,
        },
      });

      console.log("Data saved to database:", createdData);
      return createdData;
    }),

  getLastReading: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.data.findFirst({
      orderBy: { time: "desc" },
    });
  }),

  onUpdate: publicProcedure.subscription(async function* () {
    const mqttClient = getMqttClient();

    if (!mqttClient) {
      throw new Error("MQTT client not initialized");
    }

    while (true) {
      const data = await new Promise<{
        temperature: number;
        air_humidity: number;
        ground_humidity: number;
      }>((resolve) => {
        mqttClient.once("message", (topic, message) => {
          const parsedData = JSON.parse(message.toString());

          resolve({
            temperature: parsedData.temperature,
            air_humidity: parsedData.air_humidity,
            ground_humidity: parsedData.ground_humidity,
          });
        });
      });

      yield data;
    }
  }),
});