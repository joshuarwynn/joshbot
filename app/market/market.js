import config from 'config'
import express from 'express'
import isNull from 'lodash/isNull.js'
import Joi from '@hapi/joi'
import request from 'superagent'
import log from '../utils/log.js'
import model from './market-model.js'
import slack from '../utils/slack.js'

const avApiKey = config.get('alphaVantage.apiKey')
const avQueryUri = config.get('alphaVantage.queryUri')
const avTimeout = config.get('alphaVantage.timeout')
const router = express.Router()

/**
 * Helper function to perform a non-blocking delay
 * @param  {number} time Time in milliseconds to delay
 * @return {Promise}
 */
function delay(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time, 'timeout')
  })
}

/**
 * Sends a request to the Alpha Vantage API to get
 * time series (daily) market information for a ticker symbol
 * @param  {string} symbol Ticker symbol
 * @return {Promise}
 */
function getMarketQuote(symbol) {
  return request
    .get(avQueryUri)
    .query({
      function: 'TIME_SERIES_DAILY',
      symbol,
      apikey: avApiKey,
      outputsize: 'compact',
      datatype: 'json'
    })
}

/**
 * Checks the Alpha Vantage API response shape and
 * returns back a corresponding result code
 * @param  {Object} avResponseBody Response body from Alpha Vantage API
 * @return {string}                Result code
 */
function validateAvSchema(avResponseBody) {
  // First check for a normal Time Series (Daily) response
  const avTimeSeriesDailySchemaCheck = Joi.validate(
    avResponseBody,
    model.avTimeSeriesDailySchema,
    { abortEarly: false }
  )

  if (!isNull(avTimeSeriesDailySchemaCheck.error)) {
    // Check for an error response
    const avErrorSchemaCheck = Joi.validate(avResponseBody, model.avErrorSchema)

    if (!isNull(avErrorSchemaCheck.error)) {
      // Check for a rate limit response
      const avRateLimitSchemaCheck = Joi.validate(avResponseBody, model.avRateLimitSchema)

      if (!isNull(avRateLimitSchemaCheck.error)) {
        // Finally the response shape is unknown
        return 'unknownResponse'
      }
      return 'rateLimitResponse'
    }
    return 'errorResponse'
  }
  return 'passingResponse'
}

/**
 * Control flow callback for POST /market-quote
 * @param  {Request} req
 * @param  {Response} res
 * @return {Object}
 */
async function marketQuote(req, res) {
  const tickerSymbol = req.body.text

  try {
    // Since Slack will throw a default timeout error if the response takes longer than 3 seconds,
    // this 'race' is set to prevent that from happening. A programmed delay set just below 3
    // seconds will resolve before a longer than expected response from the Alpha Vantage API.
    // This will give the Joshbot app an opportunity to reply back to Slack with a meaningful
    // message that things are delayed.
    const marketQuoteResponse = await Promise.race([getMarketQuote(tickerSymbol), delay(avTimeout)])
    const avSchemaCheck = (marketQuoteResponse === 'timeout') ? 'timeout' : validateAvSchema(marketQuoteResponse.body)

    switch (avSchemaCheck) {
      case 'passingResponse': {
        // In this case, the response from the Alpha Vantage API was successful
        const lastRefreshedDate = marketQuoteResponse.body['Meta Data']['3. Last Refreshed'].substring(0, 10)
        const latestClosePrice = marketQuoteResponse.body['Time Series (Daily)'][lastRefreshedDate]['4. close']

        log.info(`Slack bot request for market data on ${tickerSymbol} was satisfied.`)

        res.status(200).send({
          response_type: 'ephemeral',
          text: `Here is your market quote for ${tickerSymbol}`,
          attachments: [{ text: `$${latestClosePrice} USD as of ${lastRefreshedDate}` }]
        })

        break
      }
      case 'errorResponse': {
        // In this case, an error response was returned from the Alpha Vantage API
        log.error('Alpha Vantage response shape has changed or there was an error returned.', { details: marketQuoteResponse.body })

        res.status(200).send({
          response_type: 'ephemeral',
          text: `I had trouble fetching the latest market data for ${tickerSymbol}. Make sure it's a valid ticker symbol and try again later.`
        })

        break
      }
      case 'rateLimitResponse': {
        // In this case, a rate limit response was returned from the Alpha Vantage API
        log.info('Alpha Vantage rate limit hit.')

        res.status(200).send({
          response_type: 'ephemeral',
          text: `Circuits are busy! Hang tight while I fetch market data for ${tickerSymbol}...`
        })

        // TODO: Add Slack slash command request to SQS queue to be processed again later

        break
      }
      case 'timeout': {
        // In this case, the programmed timeout beat out the response from the Alpha Vantage API
        log.info(`Alpha Vantage response was longer than ${avTimeout}ms for request.`)

        res.status(200).send({
          response_type: 'ephemeral',
          text: `It's taking me longer to fetch market data for ${tickerSymbol} than usual... Hang tight!`
        })

        // TODO: Add Slack slash command request to SQS queue to be processed again later

        break
      }
      case 'unknownResponse':
      default: {
        // In this  case, the response shape from the Alpha Vantage API was undetermined
        log.error('Alpha Vantage response shape is not recognized.', { details: marketQuoteResponse.body })

        res.status(200).send({
          response_type: 'ephemeral',
          text: `Things got really weird fetching market data for ${tickerSymbol}. I'll try again later and report back.`
        })

        // TODO: Add Slack slash command request to SQS queue to be processed again later
      }
    }
  } catch (error) {
    // There was an error response (non-200) coming back from the Alpha Vantage API
    log.error('Error caught attempting to communicate with Alpha Vantage API.', { details: error })

    res.status(200).send({
      response_type: 'ephemeral',
      text: `I had a problem trying to fetch market data for ${tickerSymbol}. I'll try again later and report back.`
    })

    // TODO: Add Slack slash command request to SQS queue to be processed again later
  }
}

// POST /market-quote
router.post('/market-quote', slack.validateSlackRequest, slack.validateSlackSchema, marketQuote)

export default router
