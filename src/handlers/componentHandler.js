import { MessageFlags } from 'discord.js';
import * as joinComponent from '../components/giveaway/join.js';
import * as statusComponent from '../components/giveaway/status.js';
import { buildNoticePanel, COLORS } from '../utils/panelBuilder.js';
import { logger } from '../utils/logger.js';

export async function handleComponentInteraction(interaction) {
  if (!interaction.isButton()) return;

  const [action, ...rest] = interaction.customId.split(':');
  const targetId = rest.join(':');

  try {
    switch (action) {
      case 'giveaway_join':
        await joinComponent.execute(interaction, targetId);
        break;
      case 'giveaway_status':
        await statusComponent.execute(interaction, targetId);
        break;
      default:
        logger.warn(`Bilinmeyen buton etkileşimi: ${interaction.customId}`);
        break;
    }
  } catch (err) {
    logger.error(`Buton etkileşimi sırasında hata (${interaction.customId}):`, err);

    const errorPanel = buildNoticePanel({
      title: 'Hata',
      description: 'İşleminiz gerçekleştirilirken beklenmeyen bir hata oluştu.',
      color: COLORS.DANGER
    });

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({
        components: [errorPanel],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      }).catch(() => {});
    } else {
      await interaction.reply({
        components: [errorPanel],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      }).catch(() => {});
    }
  }
}

