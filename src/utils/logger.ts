const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const getTimestamp = () => {
  return new Date().toISOString();
};

export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`${colors.cyan}[INFO]${colors.reset} ${colors.gray}${getTimestamp()}${colors.reset} ${message}`, ...args);
  },
  success: (message: string, ...args: any[]) => {
    console.log(`${colors.green}[OK]${colors.reset} ${colors.gray}${getTimestamp()}${colors.reset} ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`${colors.yellow}[WARN]${colors.reset} ${colors.gray}${getTimestamp()}${colors.reset} ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`${colors.red}[ERROR]${colors.reset} ${colors.gray}${getTimestamp()}${colors.reset} ${message}`, ...args);
  },
  request: (method: string, path: string, statusCode: number, duration: number) => {
    const color = statusCode >= 400 ? colors.red : statusCode >= 300 ? colors.yellow : colors.green;
    console.log(
      `${colors.magenta}[REQ]${colors.reset} ${colors.gray}${getTimestamp()}${colors.reset} ${method} ${path} ${color}${statusCode}${colors.reset} ${colors.gray}${duration}ms${colors.reset}`
    );
  },
};
