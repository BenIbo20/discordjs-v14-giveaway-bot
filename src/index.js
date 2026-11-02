import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import { logger } from './utils/logger.js';
import { jsonDatabase } from './database/jsonDatabase.js';
import { registerEvents } from './handlers/eventHandler.js';

function validateEnv() {
  const missing = [];
  if (!process.env.BOT_TOKEN) missing.push('BOT_TOKEN');
  if (!process.env.CLIENT_ID) missing.push('CLIENT_ID');

  if (missing.length > 0) {
    logger.error(`Eksik ortam değişkenleri: ${missing.join(', ')}. Lütfen .env dosyanızı yapılandırın.`);
    process.exit(1);
  }
}

process.on('unhandledRejection', reason => {
  logger.error('İşlenmeyen Promise Reddi:', reason);
});

process.on('uncaughtException', error => {
  logger.error('Yakalanamayan İstisna:', error);
});

async function main() {
  validateEnv();

  try {
    await jsonDatabase.init();

    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds
      ]
    });

    registerEvents(client);

    await client.login(process.env.BOT_TOKEN);
  } catch (err) {
    logger.error('Bot başlatılırken kritik hata oluştu:', err);
    process.exit(1);
  }
}

main();

