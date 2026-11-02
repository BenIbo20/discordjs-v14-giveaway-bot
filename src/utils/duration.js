const TIME_UNITS = {
  s: 1000,
  sn: 1000,
  sec: 1000,
  second: 1000,
  seconds: 1000,
  m: 60 * 1000,
  dk: 60 * 1000,
  min: 60 * 1000,
  minute: 60 * 1000,
  minutes: 60 * 1000,
  h: 60 * 60 * 1000,
  sa: 60 * 60 * 1000,
  hour: 60 * 60 * 1000,
  hours: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  gün: 24 * 60 * 60 * 1000,
  gun: 24 * 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
  days: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
  hafta: 7 * 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  weeks: 7 * 24 * 60 * 60 * 1000
};

export function parseDuration(input) {
  if (!input || typeof input !== 'string') return null;
  const regex = /(\d+)\s*([a-zA-ZğüşıöçĞÜŞİÖÇ]+)/g;
  let totalMs = 0;
  let match;
  let matchedAny = false;

  while ((match = regex.exec(input.trim())) !== null) {
    matchedAny = true;
    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    if (isNaN(value) || value <= 0) return null;
    const unitMultiplier = TIME_UNITS[unit];
    if (!unitMultiplier) return null;

    totalMs += value * unitMultiplier;
  }

  if (!matchedAny) {
    const rawNumber = parseInt(input.trim(), 10);
    if (!isNaN(rawNumber) && rawNumber > 0 && String(rawNumber) === input.trim()) {
      return rawNumber * 60 * 1000;
    }
    return null;
  }

  return totalMs > 0 ? totalMs : null;
}

export function formatDuration(ms) {
  if (!ms || ms <= 0) return '0 saniye';

  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  const parts = [];
  if (days > 0) parts.push(`${days} gün`);
  if (hours > 0) parts.push(`${hours} saat`);
  if (minutes > 0) parts.push(`${minutes} dakika`);
  if (seconds > 0 && days === 0 && hours === 0) parts.push(`${seconds} saniye`);

  return parts.length > 0 ? parts.join(' ') : '1 saniyeden az';
}

