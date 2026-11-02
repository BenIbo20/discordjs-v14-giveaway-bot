import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import * as createSubcommand from '../commands/giveaway/create.js';
import * as endSubcommand from '../commands/giveaway/end.js';
import * as rerollSubcommand from '../commands/giveaway/reroll.js';
import * as listSubcommand from '../commands/giveaway/list.js';
import { buildNoticePanel, COLORS } from '../utils/panelBuilder.js';
import { logger } from '../utils/logger.js';

const giveawayCommand = new SlashCommandBuilder()
  .setName('giveaway')
  .setDescription('Çekiliş yönetim komutları.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

giveawayCommand.addSubcommand(sub => createSubcommand.data(sub));
giveawayCommand.addSubcommand(sub => endSubcommand.data(sub));
giveawayCommand.addSubcommand(sub => rerollSubcommand.data(sub));
giveawayCommand.addSubcommand(sub => listSubcommand.data(sub));

const subcommands = new Map([
  ['create', createSubcommand],
  ['end', endSubcommand],
  ['reroll', rerollSubcommand],
  ['list', listSubcommand]
]);

export function getCommandsJSON() {
  return [giveawayCommand.toJSON()];
}

export async function handleCommandInteraction(interaction) {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName !== 'giveaway') return;

  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) && !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    const permPanel = buildNoticePanel({
      title: 'Yetkisiz İşlem',
      description: 'Bu komutu kullanabilmek için `Sunucuyu Yönet` yetkisine sahip olmalısınız.',
      color: COLORS.DANGER
    });
    return interaction.reply({
      components: [permPanel],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    });
  }

  const subcommandName = interaction.options.getSubcommand();
  const handler = subcommands.get(subcommandName);

  if (!handler) {
    const errorPanel = buildNoticePanel({
      title: 'Bilinmeyen Alt Komut',
      description: `\`${subcommandName}\` alt komutu bulunamadı.`,
      color: COLORS.DANGER
    });
    return interaction.reply({
      components: [errorPanel],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    });
  }

  try {
    await handler.execute(interaction);
  } catch (err) {
    logger.error(`Komut çalıştırılırken hata oluştu (/giveaway ${subcommandName}):`, err);

    const errorPanel = buildNoticePanel({
      title: 'Komut Hatası',
      description: 'Komut işlenirken beklenmeyen bir hata meydana geldi.',
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
