const isDev = process.env.NODE_ENV === 'development';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const timestamp = () => new Date().toISOString();

const logger = {
  info: (...args) => {
    console.log(`${colors.cyan}[INFO]${colors.reset} ${colors.gray}${timestamp()}${colors.reset}`, ...args);
  },
  warn: (...args) => {
    console.warn(`${colors.yellow}[WARN]${colors.reset} ${colors.gray}${timestamp()}${colors.reset}`, ...args);
  },
  error: (...args) => {
    console.error(`${colors.red}[ERROR]${colors.reset} ${colors.gray}${timestamp()}${colors.reset}`, ...args);
  },
  debug: (...args) => {
    if (isDev) {
      console.log(`${colors.green}[DEBUG]${colors.reset} ${colors.gray}${timestamp()}${colors.reset}`, ...args);
    }
  },
};

module.exports = logger;
