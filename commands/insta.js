const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('insta')
    .setDescription('Send an Instagram-style post')
    .addStringOption(option => option.setName('text').setDescription('The text to post').setRequired(true))
    .addAttachmentOption(option => option.setName('attachment').setDescription('The image to post').setRequired(true)),
  async execute(interaction) {
    const text = interaction.options.getString('text');
    const attachment = interaction.options.getAttachment('attachment');

    if (!attachment) {
      await interaction.reply({ content: 'Please attach an image to your post', ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('Instagram Post')
      .setDescription(text)
      .setImage(attachment.url);

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('like')
          .setLabel('👌 0')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('dislike')
          .setLabel('👎 0')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('love')
          .setLabel('👍 0')
          .setStyle(ButtonStyle.Primary),
      );

    const channel = interaction.client.channels.cache.get('1270052314220335126'); // Replace with the ID of the channel where you want to send the embed

    if (!channel) {
      await interaction.reply({ content: 'Channel not found!', ephemeral: true });
      return;
    }

    await interaction.deferReply();

    const message = await channel.send({ embeds: [embed], components: [row] });

    await interaction.followUp({ content: 'Post sent successfully!' });

    const clickCache = {};

    const filter = (i) => i.customId === 'like' || i.customId === 'dislike' || i.customId === 'love';
    const collector = message.createMessageComponentCollector({ filter, time: 86400000 });

    collector.on('collect', async (i) => {
      await i.deferUpdate();

      const userId = i.user.id;
      const buttonId = i.customId;

      if (!clickCache[userId]) {
        clickCache[userId] = {};
      }

      if (!clickCache[userId][buttonId]) {
        clickCache[userId][buttonId] = 0;
      }

      clickCache[userId][buttonId]++;

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('like')
            .setLabel(`👌 ${clickCache[userId]['like'] || 0}`)
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('dislike')
            .setLabel(`👎 ${clickCache[userId]['dislike'] || 0}`)
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('love')
            .setLabel(`👍 ${clickCache[userId]['love'] || 0}`)
            .setStyle(ButtonStyle.Primary),
        );

      await i.editReply({ components: [row] });

      await i.followUp({ content: `You ${buttonId === 'like' ? 'liked' : buttonId === 'dislike' ? 'disliked' : 'loved'} the post!`, ephemeral: true });
    });
  }
};