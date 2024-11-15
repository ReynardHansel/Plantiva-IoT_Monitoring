import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest } from "next/server";
import { env } from "~/env";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { startTcpServer } from "~/server/tcp-server";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { WebSocketServer } from "ws";

// Start TCP server
// startTcpServer();

const createContext = async (req: NextRequest) => {
  return createTRPCContext({
    headers: req.headers,
  });
};

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req),
    onError:
      env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`
            );
          }
        : undefined,
  });

// WebSocket handler (commented out)

if (env.NODE_ENV !== "production") {
  const wss = new WebSocketServer({ port: 8080 });
  applyWSSHandler({
    wss,
    router: appRouter,
    createContext: () => createTRPCContext({ headers: new Headers() }),
  });
  console.log("WebSocket Server listening on ws://localhost:8080");
}


export { handler as GET, handler as POST };