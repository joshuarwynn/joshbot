const config = require('config')
const express = require('express')
const fs = require('fs')
const morgan = require('morgan')
const path = require('path')
const log = require('./utils/log')

const accessLogStream = fs.createWriteStream(path.join(__dirname, '../logs/access.log'), { flags: 'a' })
const app = express()
const port = config.get('app.port')
const router = express.Router()
const urlencoded = express.urlencoded({ extended: true })

// Initialize middleware
app.use(morgan('combined', { stream: accessLogStream }))
app.use(router)
router.use(urlencoded)

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
