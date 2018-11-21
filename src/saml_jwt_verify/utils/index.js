const { createLogger, format, transports } = require('winston');
const { printf } = format;

require('winston-daily-rotate-file');

/**************************************/
/*           Config logger            */
/**************************************/
var transport = new transports.DailyRotateFile({
  filename: process.env.logFileName,
  datePattern: 'DD-MM-YYYY',
  zippedArchive: true,
  maxSize: process.env.logFileMmaxSize,
  maxFiles: '14d',
});

const myFormat = printf((log) => {
  return `[${new Date()}] [${log.level}] : ${log.message}`;
});

const logger = createLogger({
  level: 'info',
  format: myFormat,
  transports: [transport],
});

// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: myFormat,
    })
  );
}

// logging all uncaugthException
process.on('uncaughtException', function(err) {
  logger.error(`Uncaught Exception ${err.stack}`);
});

module.exports = {
  logger: logger,
};
