import crypto from 'node:crypto';

export class WinnerService {
  selectWinners(participants, winnerCount, excludeUserIds = []) {
    if (!Array.isArray(participants) || participants.length === 0 || winnerCount <= 0) {
      return [];
    }

    const excludeSet = new Set(excludeUserIds);
    const eligible = Array.from(new Set(participants)).filter(id => !excludeSet.has(id));

    if (eligible.length === 0) {
      return [];
    }

    if (eligible.length <= winnerCount) {
      return [...eligible];
    }

    const pool = [...eligible];
    const winners = [];

    for (let i = 0; i < winnerCount; i++) {
      const randomIndex = crypto.randomInt(0, pool.length);
      winners.push(pool[randomIndex]);
      pool.splice(randomIndex, 1);
    }

    return winners;
  }
}

export const winnerService = new WinnerService();

