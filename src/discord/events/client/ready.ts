import { Events, ActivityType, type Client } from "discord.js";

export default {
  name: Events.ClientReady,
  once: true,
  async execute(readyClient: Client) {
    readyClient.user?.setPresence({
      status: "online",
      activities: [
        {
          name: "https://github.com/readlinkdev",
          type: ActivityType.Custom,
        },
      ],
    });
  },
};
