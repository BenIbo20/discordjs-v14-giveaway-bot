import { Events, ActivityType } from 'discord.js';
import { logger } from '../utils/logger.js';
import { schedulerService } from '../services/schedulerService.js';
import { giveawayService } from '../services/giveawayService.js';

export const name = Events.ClientReady;
export const once = true;

export async function execute(client) {
  logger.success(`Bot başarıyla başlatıldı: ${client.user.tag}`);

  try {
    client.user.setPresence({
      activities: [
        {
          name: 'github.com/BenIbo20',
          type: ActivityType.Custom,
          state: 'github.com/BenIbo20'
        }
      ],
      status: 'online'
    });
    await schedulerService.init(client, giveawayService);
  } catch (err) {
    logger.error('Başlangıç çekiliş zamanlayıcıları başlatılırken hata oluştu:', err);
  }
}

