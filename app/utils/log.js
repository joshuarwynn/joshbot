const winston = require('winston')

const level = process.env.LOG_LEVEL || 'info'

// This creates a new instance of Winston to combined.log
const log = winston.createLogger({
  level,
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: './logs/combined.log' })
  ]
})

module.exports = log
