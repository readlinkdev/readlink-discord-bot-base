import type { UserSelectMenuInteraction } from "discord.js";

export default {
  customId: "sendMessageToUser/:message",

  async execute(
    interaction: UserSelectMenuInteraction,
    { message }: { message: string },
  ) {
    await interaction.deferUpdate();

    const userId = interaction.values[0];

    try {
      const user = await interaction.client.users.fetch(userId);

      await user.send(message);

      await interaction.editReply({
        content: `Message sent to: <@${userId}>`,
        components: [],
      });
    } catch (error) {
      await interaction.editReply({
        content: `I couldn't send a DM to <@${userId}>.`,
        components: [],
      });

      throw error;
    }
  },
};
