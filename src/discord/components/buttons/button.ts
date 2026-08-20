import {
  LabelBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ButtonInteraction,
} from "discord.js";

export default {
  customId: "sendMessageButton",

  async execute(interaction: ButtonInteraction, params: {}) {
    const modal = new ModalBuilder()
      .setCustomId(`sendMessageModal`)
      .setTitle("Message Modal");

    const input = new TextInputBuilder()
      .setCustomId("message")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("Write a message...")
      .setRequired(true);

    const label = new LabelBuilder()
      .setLabel("Message")
      .setTextInputComponent(input);

    modal.addLabelComponents(label);

    await interaction.showModal(modal);
  },
};
