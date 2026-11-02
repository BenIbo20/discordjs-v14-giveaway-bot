import { MessageFlags } from 'discord.js';
import { giveawayService } from '../../services/giveawayService.js';
import { jsonDatabase } from '../../database/jsonDatabase.js';
import { validateGiveawayId } from '../../utils/validators.js';
import { buildNoticePanel, COLORS } from '../../utils/panelBuilder.js';

export const data = subcommand =>
  subcommand
    .setName('end')
    .setDescription('Aktif bir çekilişi erkenden sonlandırır.')
    .addStringOption(opt =>
      opt
        .setName('giveaway_id')
        .setDescription('Sonlandırılacak çekilişin ID değeri')
        .setRequired(true)
    );

export async function execute(interaction) {
  const idInput = interaction.options.getString('giveaway_id');
  const idResult = validateGiveawayId(idInput);

  if (!idResult.valid) {
    const panel = buildNoticePanel({
      title: 'Geçersiz Giriş',
      description: idResult.error,
      color: COLORS.DANGER
    });
    return interaction.reply({
      components: [panel],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    });
  }

  const giveaway = jsonDatabase.getGiveaway(idResult.value);
  if (!giveaway || giveaway.guildId !== interaction.guildId) {
    const panel = buildNoticePanel({
      title: 'Bulunamadı',
      description: `\`${idResult.value}\` ID numaralı çekiliş bu sunucuda bulunamadı.`,
      color: COLORS.DANGER
    });
    return interaction.reply({
      components: [panel],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    });
  }

  if (giveaway.status === 'ended') {
    const panel = buildNoticePanel({
      title: 'Zaten Sonlanmış',
      description: 'Bu çekiliş zaten daha önce sonlandırılmış.',
      color: COLORS.WARNING
    });
    return interaction.reply({
      components: [panel],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    });
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const result = await giveawayService.endGiveaway(idResult.value, interaction.client);
  if (!result.success) {
    const panel = buildNoticePanel({
      title: 'Hata',
      description: 'Çekiliş sonlandırılırken bir hata oluştu veya çekiliş zaten sonlanmış.',
      color: COLORS.DANGER
    });
    return interaction.editReply({
      components: [panel],
      flags: MessageFlags.IsComponentsV2
    });
  }

  const successPanel = buildNoticePanel({
    title: 'Çekiliş Sonlandırıldı 🛑',
    description: `**${result.giveaway.prize}** (\`${result.giveaway.giveawayId}\`) çekilişi başarıyla erkenden sonlandırıldı ve kazananlar duyuruldu.`,
    color: COLORS.SUCCESS
  });

  return interaction.editReply({
    components: [successPanel],
    flags: MessageFlags.IsComponentsV2
  });
}

