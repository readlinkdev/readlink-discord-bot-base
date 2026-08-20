import { drizzle } from "drizzle-orm/libsql";

import { env } from "@/env";

const db = drizzle({ connection: { url: env.DATABASE_URL } });

export { db };
