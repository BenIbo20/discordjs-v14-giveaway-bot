import { MessageFlags } from 'discord.js';
import { giveawayService } from '../../services/giveawayService.js';
import { jsonDatabase } from '../../database/jsonDatabase.js';
import { validateGiveawayId, validateWinnerCount } from '../../utils/validators.js';
import { buildNoticePanel, COLORS } from '../../utils/panelBuilder.js';

export const data = subcommand =>
  subcommand
    .setName('reroll')
    .setDescription('Tamamlanmış bir çekiliş için yeniden kazanan belirler.')
    .addStringOption(opt =>
      opt
        .setName('giveaway_id')
        .setDescription('Yeniden kazanan seçilecek çekilişin ID değeri')
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt
        .setName('winners')
        .setDescription('Seçilecek yeni kazanan sayısı (varsayılan: çekilişteki kazanan sayısı)')
        .setMinValue(1)
    );

export async function execute(interaction) {
  const idInput = interaction.options.getString('giveaway_id');
  const winnersInput = interaction.options.getInteger('winners');

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

  if (winnersInput !== null) {
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

  if (giveaway.status !== 'ended') {
    const panel = buildNoticePanel({
      title: 'Çekiliş Henüz Bitmedi',
      description: 'Yeniden kazanan seçebilmek için çekilişin tamamlanmış olması gerekir.',
      color: COLORS.WARNING
    });
    return interaction.reply({
      components: [panel],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    });
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const result = await giveawayService.rerollGiveaway(idResult.value, interaction.client, winnersInput);

  if (!result.success) {
    let desc = 'Yeniden kazanan seçilirken bir hata oluştu.';
    if (result.reason === 'NO_PARTICIPANTS') {
      desc = 'Bu çekilişte hiçbir katılımcı bulunmadığı için yeni kazanan seçilemez.';
    } else if (result.reason === 'NO_OTHER_PARTICIPANTS') {
      desc = 'Önceki kazananlar dışında çekilişe katılmış başka uygun katılımcı bulunmuyor.';
    }

    const panel = buildNoticePanel({
      title: 'Kazanan Seçilemedi',
      description: desc,
      color: COLORS.WARNING
    });
    return interaction.editReply({
      components: [panel],
      flags: MessageFlags.IsComponentsV2
    });
  }

  const winnersMentions = result.winners.map(id => `<@${id}>`).join(', ');
  const successPanel = buildNoticePanel({
    title: 'Yeni Kazanan(lar) Belirlendi 🎊',
    description: `**${result.giveaway.prize}** (\`${result.giveaway.giveawayId}\`) çekilişi için yeni kazanan(lar) seçildi:\n\n${winnersMentions}\n\nKanalda duyuru yapıldı.`,
    color: COLORS.SUCCESS
  });

  return interaction.editReply({
    components: [successPanel],
    flags: MessageFlags.IsComponentsV2
  });
}

