import crypto from 'node:crypto';
import { MessageFlags } from 'discord.js';
import { jsonDatabase } from '../database/jsonDatabase.js';
import { winnerService } from './winnerService.js';
import { schedulerService } from './schedulerService.js';
import { buildGiveawayPanel, buildWinnerAnnouncement } from '../utils/panelBuilder.js';
import { logger } from '../utils/logger.js';

export class GiveawayService {
  async createGiveaway({ guildId, channel, prize, description, winnerCount, durationMs, createdBy, client }) {
    const giveawayId = `gw_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const startTime = Date.now();
    const endTime = startTime + durationMs;

    const draftGiveaway = {
      giveawayId,
      guildId,
      channelId: channel.id,
      messageId: '',
      prize,
      description: description || '',
      winnerCount,
      participants: [],
      winners: [],
      startTime,
      endTime,
      status: 'active',
      createdBy,
      endedAt: null
    };

    const panel = buildGiveawayPanel(draftGiveaway);
    const message = await channel.send({
      components: [panel],
      flags: MessageFlags.IsComponentsV2
    });

    draftGiveaway.messageId = message.id;

    try {
      const saved = await jsonDatabase.saveGiveaway(draftGiveaway);
      schedulerService.schedule(giveawayId, endTime, async () => {
        await this.endGiveaway(giveawayId, client).catch(err => {
          logger.error(`Çekiliş sonlandırılırken hata (${giveawayId}):`, err);
        });
      });
      return saved;
    } catch (err) {
      await message.delete().catch(() => {});
      throw err;
    }
  }

  async joinGiveaway(giveawayId, userId, message) {
    let result = { success: false, reason: '' };

    const updated = await jsonDatabase.updateGiveaway(giveawayId, async giveaway => {
      if (giveaway.status === 'ended' || Date.now() >= giveaway.endTime) {
        result = { success: false, reason: 'ENDED' };
        return null;
      }
      if (giveaway.participants.includes(userId)) {
        result = { success: false, reason: 'ALREADY_JOINED' };
        return null;
      }

      giveaway.participants.push(userId);
      result = { success: true, giveaway };
      return giveaway;
    });

    if (result.success && updated && message) {
      const panel = buildGiveawayPanel(updated);
      await message.edit({
        components: [panel],
        flags: MessageFlags.IsComponentsV2
      }).catch(err => {
        logger.error(`Çekiliş paneli güncellenirken hata (${giveawayId}):`, err);
      });
      result.giveaway = updated;
    }

    return result;
  }

  async endGiveaway(giveawayId, client) {
    const existing = jsonDatabase.getGiveaway(giveawayId);
    if (!existing) {
      return { success: false, reason: 'NOT_FOUND' };
    }
    if (existing.status === 'ended') {
      return { success: false, reason: 'ALREADY_ENDED' };
    }

    schedulerService.cancel(giveawayId);

    const winners = winnerService.selectWinners(existing.participants, existing.winnerCount);
    const updated = await jsonDatabase.updateGiveaway(giveawayId, async giveaway => {
      if (giveaway.status === 'ended') return null;
      giveaway.status = 'ended';
      giveaway.winners = winners;
      giveaway.endedAt = Date.now();
      return giveaway;
    });

    if (!updated) {
      return { success: false, reason: 'ALREADY_ENDED' };
    }

    try {
      const channel = await client.channels.fetch(updated.channelId).catch(() => null);
      if (channel) {
        const message = await channel.messages.fetch(updated.messageId).catch(() => null);
        if (message) {
          const panel = buildGiveawayPanel(updated);
          await message.edit({
            components: [panel],
            flags: MessageFlags.IsComponentsV2
          }).catch(err => {
            logger.error(`Çekiliş sonlandırma paneli güncellenirken hata (${giveawayId}):`, err);
          });
        }

        const announcement = buildWinnerAnnouncement(updated, false);
        await channel.send({
          components: [announcement],
          flags: MessageFlags.IsComponentsV2
        }).catch(err => {
          logger.error(`Kazanan duyurusu gönderilirken hata (${giveawayId}):`, err);
        });
      }
    } catch (err) {
      logger.error(`Çekiliş sonlandırma Discord işlemleri sırasında hata (${giveawayId}):`, err);
    }

    logger.info(`Çekiliş sonlandırıldı: ${giveawayId} (${updated.prize})`);
    return { success: true, giveaway: updated };
  }

  async rerollGiveaway(giveawayId, client, requestedWinnerCount = null) {
    const existing = jsonDatabase.getGiveaway(giveawayId);
    if (!existing) {
      return { success: false, reason: 'NOT_FOUND' };
    }
    if (existing.status !== 'ended') {
      return { success: false, reason: 'NOT_ENDED' };
    }

    if (!existing.participants || existing.participants.length === 0) {
      return { success: false, reason: 'NO_PARTICIPANTS' };
    }

    const count = requestedWinnerCount || existing.winnerCount;
    const newWinners = winnerService.selectWinners(existing.participants, count, existing.winners);

    if (newWinners.length === 0) {
      return { success: false, reason: 'NO_OTHER_PARTICIPANTS' };
    }

    const updated = await jsonDatabase.updateGiveaway(giveawayId, async giveaway => {
      giveaway.winners = newWinners;
      return giveaway;
    });

    try {
      const channel = await client.channels.fetch(updated.channelId).catch(() => null);
      if (channel) {
        const message = await channel.messages.fetch(updated.messageId).catch(() => null);
        if (message) {
          const panel = buildGiveawayPanel(updated);
          await message.edit({
            components: [panel],
            flags: MessageFlags.IsComponentsV2
          }).catch(() => {});
        }

        const announcement = buildWinnerAnnouncement(updated, true);
        await channel.send({
          components: [announcement],
          flags: MessageFlags.IsComponentsV2
        }).catch(() => {});
      }
    } catch (err) {
      logger.error(`Reroll sırasında hata (${giveawayId}):`, err);
    }

    logger.info(`Çekiliş yeniden çekildi: ${giveawayId} (Yeni kazananlar: ${newWinners.join(', ')})`);
    return { success: true, giveaway: updated, winners: newWinners };
  }
}

export const giveawayService = new GiveawayService();

