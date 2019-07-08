const config = require('config')
const crypto = require('crypto')
const Joi = require('@hapi/joi')
const qs = require('qs')
const { filter, isNull } = require('lodash')
const log = require('./log')

const slackSigningSecret = config.get('slack.signingSecret')

// Joi schema for a properly formed Slack slash command request
const slackPostSchema = Joi.object().keys({
  token: Joi.string(), // deprecated property that shouldn't be used per Slack
  team_id: Joi.string().required(),
  team_domain: Joi.string().required(),
  channel_id: Joi.string().required(),
  channel_name: Joi.string().required(),
  user_id: Joi.string().required(),
  user_name: Joi.string().required(),
  command: Joi.string().required(),
  text: Joi.string().min(1).required(),
  response_url: Joi.string().uri().required(),
  trigger_id: Joi.string().required()
})

/**
 * Verifies that Slack slash command request is valid
 * @param  {Request}   req
 * @param  {Response}   res
 * @param  {Function} next
 * @return {Object}
 */
function validateSlackRequest(req, res, next) {
  const requestBody = qs.stringify(req.body, { format: 'RFC1738' })
  const slackTimestamp = req.headers['x-slack-request-timestamp']
  const slackSignature = req.headers['x-slack-signature']
  const time = Math.floor(new Date().getTime() / 1000)
  const signatureBaseString = `v0:${slackTimestamp}:${requestBody}`
  const mySignature = `v0=${crypto.createHmac('sha256', slackSigningSecret).update(signatureBaseString, 'utf8').digest('hex')}`

  if (Math.abs(time - slackTimestamp) > 300) {
    // If Slack timestamp header is greater than +/- 5 minutes from local time, then it could
    // be a replay attack. Log a warning and send a failing response message.
    log.warn('Possible replay attack detected while validating Slack slash command request.', {
      details: {
        requestBody: req.body,
        requestHeaders: req.headers
      }
    })

    res.status(200).send({
      response_type: 'ephemeral',
      text: 'There was a communication error with Joshbot. (code: 101)'
    })
  } else if (crypto.timingSafeEqual(Buffer.from(slackSignature, 'utf8'), Buffer.from(mySignature, 'utf8'))) {
    // If signatures match, pass control to the next middleware function
    next()
  } else {
    // If signature is invalid, log a warning and send a failing response message
    log.warn('Invalid signature detected while validating Slack slash command request.', {
      details: {
        requestBody: req.body,
        requestHeaders: req.headers
      }
    })

    res.status(200).send({
      response_type: 'ephemeral',
      text: 'There was a communication error with Joshbot. (code: 102)'
    })
  }
}

/**
 * Verifies that Slack slash command request payload is properly formed and if user
 * provided text argument(s) along with the slash command
 * @param  {Request}   req
 * @param  {Response}   res
 * @param  {Function} next
 * @return {Object}
 */
function validateSlackSchema(req, res, next) {
  const slackSchemaCheck = Joi.validate(req.body, slackPostSchema, { abortEarly: false })

  if (isNull(slackSchemaCheck.error)) {
    // If payload is properly formed, pass control to the next middleware function
    next()
  } else {
    // Check to see if the text property is empty
    const badText = filter(slackSchemaCheck.error.details, { type: 'any.empty', path: ['text'] })

    if (badText.length !== 0) {
      // If text property comes back empty, send a generic failing response message
      // with an array of usage hints based on current slash commands available
      res.status(200).send({
        response_type: 'ephemeral',
        text: 'You forgot to include your slash command argument! See examples below:',
        attachments: [{ text: 'Getting a market quote: /marketquote BTCUSD' }]
      })
    } else {
      // If validation is failing, log an error for admin intervention
      // as a possible, breaking schema change may have occurred from Slack
      log.error('Improperly formed Slack slash command request payload detected.', { details: slackSchemaCheck.error.details })

      res.status(200).send({
        response_type: 'ephemeral',
        text: 'There was a communication error with Joshbot. (code: 103)'
      })
    }
  }
}

module.exports = { validateSlackRequest, validateSlackSchema }
