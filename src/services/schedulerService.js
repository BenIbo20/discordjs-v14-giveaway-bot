import { logger } from '../utils/logger.js';
import { jsonDatabase } from '../database/jsonDatabase.js';

const MAX_TIMEOUT_MS = 2147483647;

export class SchedulerService {
  constructor() {
    this.timers = new Map();
  }

  async init(client, giveawayService) {
    const activeGiveaways = jsonDatabase.getActiveGiveaways();
    logger.info(`Aktif çekilişler kontrol ediliyor: ${activeGiveaways.length} adet bulundu.`);

    for (const giveaway of activeGiveaways) {
      const now = Date.now();
      if (giveaway.endTime <= now) {
        logger.info(`Süresi dolmuş çekiliş sonlandırılıyor: ${giveaway.giveawayId}`);
        await giveawayService.endGiveaway(giveaway.giveawayId, client).catch(err => {
          logger.error(`Çekiliş sonlandırılırken hata (${giveaway.giveawayId}):`, err);
        });
      } else {
        this.schedule(giveaway.giveawayId, giveaway.endTime, async () => {
          await giveawayService.endGiveaway(giveaway.giveawayId, client).catch(err => {
            logger.error(`Zamanlanmış çekiliş sonlandırılırken hata (${giveaway.giveawayId}):`, err);
          });
        });
      }
    }
  }

  schedule(giveawayId, endTime, onEnd) {
    this.cancel(giveawayId);

    const now = Date.now();
    const delay = Math.max(0, endTime - now);

    if (delay > MAX_TIMEOUT_MS) {
      const timer = setTimeout(() => {
        this.schedule(giveawayId, endTime, onEnd);
      }, MAX_TIMEOUT_MS);
      this.timers.set(giveawayId, timer);
      return;
    }

    const timer = setTimeout(async () => {
      this.timers.delete(giveawayId);
      try {
        await onEnd();
      } catch (err) {
        logger.error(`Çekiliş sonlandırma callback hatası (${giveawayId}):`, err);
      }
    }, delay);

    this.timers.set(giveawayId, timer);
  }

  cancel(giveawayId) {
    if (this.timers.has(giveawayId)) {
      clearTimeout(this.timers.get(giveawayId));
      this.timers.delete(giveawayId);
    }
  }

  has(giveawayId) {
    return this.timers.has(giveawayId);
  }
}

export const schedulerService = new SchedulerService();

