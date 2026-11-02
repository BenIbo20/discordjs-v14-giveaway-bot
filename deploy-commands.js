import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { getCommandsJSON } from './src/handlers/commandHandler.js';
import { logger } from './src/utils/logger.js';

async function deploy() {
  const token = process.env.BOT_TOKEN;
  const clientId = process.env.CLIENT_ID;
  const guildId = process.env.GUILD_ID;

  if (!token || !clientId) {
    logger.error('deploy-commands için BOT_TOKEN ve CLIENT_ID ortam değişkenleri zorunludur.');
    process.exit(1);
  }

  const commands = getCommandsJSON();
  const rest = new REST({ version: '10' }).setToken(token);

  try {
    logger.info(`${commands.length} adet uygulama komutu Discord API'ye yükleniyor...`);

    if (guildId) {
      logger.info(`Komutlar sunucuya kaydediliyor (GUILD_ID: ${guildId})...`);
      const data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );
      logger.success(`Toplam ${data.length} adet komut sunucuya başarıyla kaydedildi!`);
    } else {
      logger.info('Komutlar genel (global) olarak kaydediliyor...');
      const data = await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands }
      );
      logger.success(`Toplam ${data.length} adet komut genel olarak başarıyla kaydedildi!`);
    }
  } catch (err) {
    logger.error('Komutlar kaydedilirken hata oluştu:', err);
    process.exit(1);
  }
}

deploy();

