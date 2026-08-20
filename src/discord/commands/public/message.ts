import {
  ActionRowBuilder,
  ButtonBuilder,
  SlashCommandBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  MessageFlags,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("message")
    .setDescription("Write the message you want to send to the selected user."),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply({
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`sendMessageButton`)
            .setLabel("Message User")
            .setStyle(ButtonStyle.Primary),
        ),
      ],
      flags: [MessageFlags.Ephemeral],
    });
  },
};
