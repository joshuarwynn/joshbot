const config = require('config')
const express = require('express')
const fs = require('fs')
const morgan = require('morgan')
const path = require('path')
const log = require('./utils/log')

const accessLogStream = fs.createWriteStream(
  path.join(
    __dirname,
    (process.env.NODE_ENV !== 'test') ? '../logs/access.log' : '../logs/access.test.log'
  ),
  { flags: 'a' }
)

const app = express()
const port = config.get('app.port')
const router = express.Router()
const urlencoded = express.urlencoded({ extended: true })

// Express configuration
app.set('x-powered-by', false)

// Initialize middleware
app.use(morgan('combined', { stream: accessLogStream }))
app.use(router)
router.use(urlencoded)

// Initialize routes
router.use(require('./health/health'))

app.start = function start() {
  app.listen(port, (error) => {
    if (error) {
      return error
    }
    log.info(`Joshbot listening for commands on port ${port}`)
    return 0
  })
}

module.exports = app
