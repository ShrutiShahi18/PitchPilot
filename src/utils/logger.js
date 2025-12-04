const levels = {
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
  debug: 'DEBUG'
};

function log(level, message, meta) {
  const timestamp = new Date().toISOString();
  const payload = meta ? ` | ${JSON.stringify(meta, null, 2)}` : '';
  console.log(`[${timestamp}] [${levels[level] || 'LOG'}] ${message}${payload}`);
}

module.exports = {
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
  debug: (msg, meta) => log('debug', msg, meta)
};


