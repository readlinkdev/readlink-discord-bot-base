import "dotenv/config";

import * as z from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]).default("development"),

  DISCORD_TOKEN: z.string().min(1, "DISCORD_TOKEN is missing"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is missing"),

  GUILD_ID: z.string().min(1, "GUILD_ID is missing"),
});

const result = EnvSchema.safeParse(process.env);

if (!result.success) {
  console.error("❌ Invalid environment variables:");
  console.error(z.prettifyError(result.error));

  process.exit(1);
}

export const env = result.data;
