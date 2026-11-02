import { MessageFlags } from 'discord.js';
import { giveawayService } from '../../services/giveawayService.js';
import { buildNoticePanel, COLORS } from '../../utils/panelBuilder.js';

export async function execute(interaction, giveawayId) {
  const result = await giveawayService.joinGiveaway(giveawayId, interaction.user.id, interaction.message);

  if (!result.success) {
    if (result.reason === 'ALREADY_JOINED') {
      const panel = buildNoticePanel({
        title: 'Zaten Katıldınız',
        description: 'Bu çekilişe daha önce zaten katıldınız. Bol şans dileriz! 🍀',
        color: COLORS.WARNING
      });
      return interaction.reply({
        components: [panel],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
    }

    if (result.reason === 'ENDED') {
      const panel = buildNoticePanel({
        title: 'Çekiliş Sona Erdi',
        description: 'Bu çekiliş sona erdiği için artık katılamazsınız.',
        color: COLORS.DANGER
      });
      return interaction.reply({
        components: [panel],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
    }

    const panel = buildNoticePanel({
      title: 'Hata',
      description: 'Çekiliş bulunamadı veya bir sorun oluştu.',
      color: COLORS.DANGER
    });
    return interaction.reply({
      components: [panel],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    });
  }

  const panel = buildNoticePanel({
    title: 'Katılım Başarılı 🎉',
    description: `**${result.giveaway.prize}** çekilişine başarıyla katıldınız!\nToplam katılımcı sayısı: **${result.giveaway.participants.length}**\nBol şans! 🍀`,
    color: COLORS.SUCCESS
  });

  return interaction.reply({
    components: [panel],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
  });
}

