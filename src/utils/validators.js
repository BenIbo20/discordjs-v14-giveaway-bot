import { parseDuration } from './duration.js';

export function validatePrize(prize) {
  if (!prize || typeof prize !== 'string') {
    return { valid: false, error: 'Ödül başlığı geçerli bir metin olmalıdır.' };
  }
  const trimmed = prize.trim();
  if (trimmed.length < 1 || trimmed.length > 256) {
    return { valid: false, error: 'Ödül başlığı 1 ile 256 karakter arasında olmalıdır.' };
  }
  return { valid: true, value: trimmed };
}

export function validateDuration(durationStr) {
  const ms = parseDuration(durationStr);
  if (!ms) {
    return { valid: false, error: 'Geçersiz süre biçimi. Örnek: `10m`, `1h`, `2d`, `1d 2h`' };
  }
  if (ms < 5000) {
    return { valid: false, error: 'Çekiliş süresi en az 5 saniye olmalıdır.' };
  }
  const maxMs = 30 * 24 * 60 * 60 * 1000;
  if (ms > maxMs) {
    return { valid: false, error: 'Çekiliş süresi en fazla 30 gün olabilir.' };
  }
  return { valid: true, value: ms };
}

export function validateWinnerCount(winners) {
  const count = parseInt(winners, 10);
  if (isNaN(count) || count < 1) {
    return { valid: false, error: 'Kazanan sayısı en az 1 olmalıdır.' };
  }
  if (count > 50) {
    return { valid: false, error: 'Kazanan sayısı en fazla 50 olabilir.' };
  }
  return { valid: true, value: count };
}

export function validateGiveawayId(id) {
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    return { valid: false, error: 'Geçersiz çekiliş ID.' };
  }
  return { valid: true, value: id.trim() };
}

