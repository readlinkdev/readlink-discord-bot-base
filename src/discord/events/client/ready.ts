import { Events, ActivityType, type Client } from "discord.js";

export default {
  name: Events.ClientReady,
  once: true,
  async execute(readyClient: Client) {
    readyClient.user?.setPresence({
      status: "online",
      activities: [
        {
          name: "Coding with discord.js",
          type: ActivityType.Playing,
        },
      ],
    });
  },
};
