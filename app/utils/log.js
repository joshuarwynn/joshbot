const winston = require('winston')

const level = process.env.LOG_LEVEL || 'info'

// This creates a new instance of Winston to combined.log or combined.test.log
const log = winston.createLogger({
  level,
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      filename: (process.env.NODE_ENV !== 'test') ? './logs/combined.log' : './logs/combined.test.log'
    })
  ]
})

module.exports = log
