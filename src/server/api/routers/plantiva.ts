import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const plantivaRouter = createTRPCRouter({
  getDashboardData: publicProcedure.query(async ({ ctx }) => {
    const lastReading = await ctx.db.data.findFirst({
      orderBy: { time: 'desc' },
    });

    const last24Hours = await ctx.db.data.findMany({
      where: {
        time: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { time: 'asc' },
    });

    const lastWatered = await ctx.db.data.findFirst({
      where: { watered: true },
      orderBy: { time: 'desc' },
    });

    return {
      currentReading: lastReading,
      historicalData: last24Hours,
      lastWatered: lastWatered,
    };
  }),
});