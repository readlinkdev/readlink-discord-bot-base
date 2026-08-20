import { GatewayIntentBits } from "discord.js";

import { Client } from "@/client";

import { env } from "@/env";

import { Logger } from "@/shared/logger";

async function bootstrap() {
  const logger = new Logger("Bootstrap");

  logger.log("Starting application...");

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  await client.loadClientModules();

  await client.login(env.DISCORD_TOKEN);

  logger.success("Application started");
}

await bootstrap();
