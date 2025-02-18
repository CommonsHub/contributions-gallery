import { Application, send } from "oak";
import { getMessagesFromChannel } from "./lib/discord.ts";

const app = new Application();

// Serve static files from the dist directory
app.use(async (ctx, next) => {
  try {
    const path = ctx.request.url.pathname;
    const queryString = ctx.request.url.search || "";
    console.log(`GET ${path}${queryString}`);
    if (path.startsWith("/api")) {
      await next();
      return;
    }

    await send(ctx, path, {
      root: `${Deno.cwd()}/dist`,
      index: "index.html",
    });
  } catch {
    // If file not found, serve index.html (for SPA routing)
    await send(ctx, "/", {
      root: `${Deno.cwd()}/dist`,
      index: "index.html",
    });
  }
});

// CORS middleware
app.use(async (ctx, next) => {
  ctx.response.headers.set("Access-Control-Allow-Origin", "*");
  ctx.response.headers.set(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  ctx.response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE"
  );

  await next();
});

// Your routes here
app.use(async (ctx) => {
  if (ctx.request.url.pathname.startsWith("/api/discord")) {
    // Your discord endpoint logic here
    const channelId = ctx.request.url.searchParams.get("channelId");
    const type = ctx.request.url.searchParams.get("type");
    const since = ctx.request.url.searchParams.get("since");
    if (!channelId) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Channel ID is required" };
      return;
    }

    const messages = await getMessagesFromChannel(channelId, type, since);

    ctx.response.body = messages;
    console.log(`Response: ${messages.length} messages`);
    ctx.response.headers.set("Content-Type", "application/json");
  }
});

const port = parseInt(Deno.env.get("PORT") || "3003");
console.log(`Server running on port ${port}`);
await app.listen({ port });
