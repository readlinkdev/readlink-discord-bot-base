import {
  ActionRowBuilder,
  MessageFlags,
  UserSelectMenuBuilder,
  type ModalSubmitInteraction,
} from "discord.js";

export default {
  customId: "sendMessageModal",

  async execute(interaction: ModalSubmitInteraction, params: {}) {
    const message = interaction.fields.getTextInputValue("message");

    const userSelect = new UserSelectMenuBuilder()
      .setCustomId(`sendMessageToUser/${message}`)
      .setPlaceholder("Select a user")
      .setMinValues(1)
      .setMaxValues(1);

    const row = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
      userSelect,
    );

    await interaction.reply({
      content: "Please select a user:",
      components: [row],
      flags: [MessageFlags.Ephemeral],
    });
  },
};
