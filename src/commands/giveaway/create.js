import { ChannelType, MessageFlags, PermissionFlagsBits } from 'discord.js';
import { giveawayService } from '../../services/giveawayService.js';
import { validatePrize, validateDuration, validateWinnerCount } from '../../utils/validators.js';
import { buildNoticePanel, COLORS } from '../../utils/panelBuilder.js';

export const data = subcommand =>
  subcommand
    .setName('create')
    .setDescription('Yeni bir çekiliş başlatır.')
    .addStringOption(opt =>
      opt
        .setName('prize')
        .setDescription('Çekiliş ödülü')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName('duration')
        .setDescription('Çekiliş süresi (Örn: 10m, 1h, 2d)')
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt
        .setName('winners')
        .setDescription('Kazanan sayısı')
        .setRequired(true)
        .setMinValue(1)
    )
    .addChannelOption(opt =>
      opt
        .setName('channel')
        .setDescription('Çekilişin gönderileceği kanal')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
    )
    .addStringOption(opt =>
      opt
        .setName('description')
        .setDescription('Çekiliş hakkında isteğe bağlı açıklama')
    );

export async function execute(interaction) {
  const prizeInput = interaction.options.getString('prize');
  const durationInput = interaction.options.getString('duration');
  const winnersInput = interaction.options.getInteger('winners');
  const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
  const descriptionInput = interaction.options.getString('description') || '';

  const prizeResult = validatePrize(prizeInput);
  if (!prizeResult.valid) {
    const panel = buildNoticePanel({
      title: 'Geçersiz Giriş',
      description: prizeResult.error,
      color: COLORS.DANGER
    });
    return interaction.reply({
      components: [panel],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    });
  }

  const durationResult = validateDuration(durationInput);
  if (!durationResult.valid) {
    const panel = buildNoticePanel({
      title: 'Geçersiz Giriş',
      description: durationResult.error,
      color: COLORS.DANGER
    });
    return interaction.reply({
      components: [panel],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    });
  }

  const winnersResult = validateWinnerCount(winnersInput);
  if (!winnersResult.valid) {
    const panel = buildNoticePanel({
      title: 'Geçersiz Giriş',
      description: winnersResult.error,
      color: COLORS.DANGER
    });
    return interaction.reply({
      components: [panel],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    });
  }

  const permissions = targetChannel.permissionsFor(interaction.client.user);
  if (!permissions || !permissions.has(PermissionFlagsBits.SendMessages) || !permissions.has(PermissionFlagsBits.ViewChannel)) {
    const panel = buildNoticePanel({
      title: 'Yetki Hatası',
      description: `Botun <#${targetChannel.id}> kanalında mesaj gönderme veya kanalı görüntüleme yetkisi yok.`,
      color: COLORS.DANGER
    });
    return interaction.reply({
      components: [panel],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    });
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const giveaway = await giveawayService.createGiveaway({
    guildId: interaction.guildId,
    channel: targetChannel,
    prize: prizeResult.value,
    description: descriptionInput,
    winnerCount: winnersResult.value,
    durationMs: durationResult.value,
    createdBy: interaction.user.id,
    client: interaction.client
  });

  const successPanel = buildNoticePanel({
    title: 'Çekiliş Başlatıldı 🎉',
    description: `Çekiliş başarıyla <#${targetChannel.id}> kanalında başlatıldı!\n\n**Çekiliş ID:** \`${giveaway.giveawayId}\`\n**Ödül:** ${giveaway.prize}\n**Kazanan Sayısı:** ${giveaway.winnerCount}`,
    color: COLORS.SUCCESS
  });

  return interaction.editReply({
    components: [successPanel],
    flags: MessageFlags.IsComponentsV2
  });
}

