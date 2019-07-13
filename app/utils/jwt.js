import config from 'config'
import jwt from 'jsonwebtoken'
import isUndefined from 'lodash/isUndefined.js'
import log from './log.js'

const jwtSecretKey = config.get('jwt.secretKey')

/**
 * Verifies that a JWT is valid and its payload contents
 * @param  {Request} req
 * @param  {Response} res
 * @param  {Function} next
 * @return {Object}
 */
function verifyJwt(req, res, next) {
  if (!isUndefined(req.headers.authorization) && req.headers.authorization.split(' ')[0] === 'Bearer') {
    // Authorization header is present and includes the Bearer schema
    const token = req.headers.authorization.split(' ')[1]

    try {
      const payload = jwt.verify(token, jwtSecretKey)
      const time = Math.floor(new Date().getTime() / 1000)

      if (payload.admin === true && payload.exp >= time) {
        // The JWT payload contains admin access is true and hasn't expired,
        // so pass control to the next middleware function
        next()
      } else {
        // The JWT payload does not contain admin access and/or has expired,
        // so deny access to requestor
        log.info(`While requesting ${req.path}, JWT payload does not contain admin access and/or has expired.`, { details: payload })
        res.status(401).send()
      }
    } catch (error) {
      // The JWT could not be verified, so deny access to requestor
      log.info(`While requesting ${req.path}, JWT could not be verified.`)
      res.status(401).send()
    }
  } else {
    // Authorization header is missing or Bearer schema is not included,
    // so deny access to requestor
    log.info(`While requesting ${req.path}, the authorization header or Bearer schema is missing.`)
    res.status(401).send()
  }
}

export default { verifyJwt }
