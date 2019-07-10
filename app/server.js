import config from 'config'
import express from 'express'
import morgan from 'morgan'
import { createWriteStream } from 'fs'
import { join as pathJoin, resolve as pathResolve } from 'path'
import adminRoutes from './admin/admin.js'
import healthRoutes from './health/health.js'
import marketRoutes from './market/market.js'
import log from './utils/log.js'

const accessLogStream = createWriteStream(
  pathJoin(
    pathResolve(),
    (process.env.NODE_ENV !== 'test') ? 'logs/access.log' : 'logs/access.test.log'
  ),
  { flags: 'a' }
)

const app = express()
const port = config.get('app.port')
const router = express.Router()
const json = express.json()
const urlencoded = express.urlencoded({ extended: true })

// Express configuration
app.set('x-powered-by', false)

// Initialize middleware
app.use(morgan('combined', { stream: accessLogStream }))
app.use(router)
router.use(json)
router.use(urlencoded)

// Initialize routes
router.use(adminRoutes)
router.use(healthRoutes)
router.use(marketRoutes)

app.start = function start() {
  app.listen(port, (error) => {
    if (error) {
      return error
    }
    log.info(`Joshbot listening for commands on port ${port}`)
    return 0
  })
}

export default app
