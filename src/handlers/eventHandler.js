import * as readyEvent from '../events/ready.js';
import * as interactionCreateEvent from '../events/interactionCreate.js';
import { logger } from '../utils/logger.js';

export function registerEvents(client) {
  const events = [readyEvent, interactionCreateEvent];

  for (const event of events) {
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  }

  logger.info(`${events.length} adet olay dinleyicisi başarıyla kaydedildi.`);
}

