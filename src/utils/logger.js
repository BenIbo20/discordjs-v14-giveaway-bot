const TIMEZONE = process.env.LOG_TIMEZONE || 'Europe/Istanbul';

const ANSI = {
  RESET: '\x1b[0m',
  GRAY: '\x1b[90m',
  WHITE: '\x1b[97m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  RED: '\x1b[31m',
  BLUE: '\x1b[34m'
};

function getTimestamp() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  return formatter.format(now).replace('T', ' ');
}

function formatLog(levelTag, levelColor, message, ...args) {
  const timestamp = getTimestamp();
  const timePart = `${ANSI.GRAY}[${timestamp}]${ANSI.RESET}`;
  const tagPart = `${levelColor}[${levelTag}]${ANSI.RESET}`;
  
  let formattedMessage = typeof message === 'string' ? message : String(message);
  if (args.length > 0) {
    const extra = args.map(arg => {
      if (arg instanceof Error) {
        return arg.stack || arg.message;
      }
      if (typeof arg === 'object') {
        return JSON.stringify(arg, null, 2);
      }
      return String(arg);
    }).join(' ');
    formattedMessage = `${formattedMessage} ${extra}`;
  }

  const messagePart = `${ANSI.WHITE}${formattedMessage}${ANSI.RESET}`;
  return `${timePart} ${tagPart} ${messagePart}\n`;
}

export const logger = {
  info(message, ...args) {
    process.stdout.write(formatLog('INFO', ANSI.WHITE, message, ...args));
  },
  success(message, ...args) {
    process.stdout.write(formatLog('SUCCESS', ANSI.GREEN, message, ...args));
  },
  warn(message, ...args) {
    process.stdout.write(formatLog('WARN', ANSI.YELLOW, message, ...args));
  },
  error(message, ...args) {
    process.stderr.write(formatLog('ERROR', ANSI.RED, message, ...args));
  },
  debug(message, ...args) {
    process.stdout.write(formatLog('DEBUG', ANSI.BLUE, message, ...args));
  }
};

