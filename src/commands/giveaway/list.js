import {
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize
} from 'discord.js';
import { jsonDatabase } from '../../database/jsonDatabase.js';
import { buildNoticePanel, COLORS } from '../../utils/panelBuilder.js';

export const data = subcommand =>
  subcommand
    .setName('list')
    .setDescription('Sunucudaki aktif çekilişleri listeler.');

export async function execute(interaction) {
  const activeGiveaways = jsonDatabase
    .getActiveGiveaways()
    .filter(g => g.guildId === interaction.guildId);

  if (activeGiveaways.length === 0) {
    const emptyPanel = buildNoticePanel({
      title: 'Aktif Çekiliş Yok',
      description: 'Bu sunucuda şu anda devam eden herhangi bir aktif çekiliş bulunmuyor.',
      color: COLORS.PRIMARY
    });
    return interaction.reply({
      components: [emptyPanel],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    });
  }

  const container = new ContainerBuilder().setAccentColor(COLORS.PRIMARY);

  const headerDisplay = new TextDisplayBuilder().setContent(
    `# 📋 Aktif Çekilişler\n> Bu sunucuda devam eden **${activeGiveaways.length}** adet aktif çekiliş listelenmiştir.`
  );
  container.addTextDisplayComponents(headerDisplay);
  container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

  activeGiveaways.forEach((gw, index) => {
    const endUnix = Math.floor(gw.endTime / 1000);
    let itemText = `### ${index + 1}. 🎁 ${gw.prize}\n`;
    itemText += `• **ID:** \`${gw.giveawayId}\`\n`;
    itemText += `• **Kanal:** <#${gw.channelId}>\n`;
    itemText += `• **Kazanan Sayısı:** \`${gw.winnerCount}\` kişi\n`;
    itemText += `• **Katılımcı:** \`${gw.participants.length}\` kişi\n`;
    itemText += `• **Bitiş:** <t:${endUnix}:R> (<t:${endUnix}:F>)`;

    const itemDisplay = new TextDisplayBuilder().setContent(itemText);
    container.addTextDisplayComponents(itemDisplay);

    if (index < activeGiveaways.length - 1) {
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    }
  });

  return interaction.reply({
    components: [container],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
  });
}
