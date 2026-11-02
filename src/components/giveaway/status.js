import { MessageFlags } from 'discord.js';
import { jsonDatabase } from '../../database/jsonDatabase.js';
import { buildStatusPanel, buildNoticePanel, COLORS } from '../../utils/panelBuilder.js';

export async function execute(interaction, giveawayId) {
  const giveaway = jsonDatabase.getGiveaway(giveawayId);

  if (!giveaway) {
    const panel = buildNoticePanel({
      title: 'Hata',
      description: 'Çekiliş bilgileri bulunamadı.',
      color: COLORS.DANGER
    });
    return interaction.reply({
      components: [panel],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    });
  }

  const panel = buildStatusPanel(giveaway, interaction.user.id);

  return interaction.reply({
    components: [panel],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
  });
}

