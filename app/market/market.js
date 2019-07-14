import config from 'config'
import express from 'express'
import forEach from 'lodash/forEach.js'
import isNull from 'lodash/isNull.js'
import Joi from '@hapi/joi'
import request from 'superagent'
import log from '../utils/log.js'
import model from './market-model.js'
import slack from '../utils/slack.js'
import sqs from '../utils/sqs.js'

const avApiKey = config.get('alphaVantage.apiKey')
const avQueryUri = config.get('alphaVantage.queryUri')
const avTimeout = config.get('alphaVantage.timeout')
const queueUrl = config.get('app.sqsQueueUrl')
const processRetryQueueInterval = config.get('app.processRetryQueueInterval')
const router = express.Router()
const visibilityTimeout = config.get('app.sqsMessageVisibilityTimeout')

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
 * Helper function to execute SQS method
 * @param  {Object} sqsMethod SQS method name and function with parameters passed
 */
async function executeSqsMethod(sqsMethod) {
  try {
    // Attempt to execute the SQS method with parameters passed
    const sqsMethodResult = await sqsMethod.methodFunction

    // Log the result and pass through successful SQS method response
    log.info('SQS method execution succeeded.', { details: { method: sqsMethod.methodName, result: sqsMethodResult } })
  } catch (error) {
    // Log the result and pass through unsuccessful SQS method response
    log.error('SQS method execution failed.', { details: { method: sqsMethod.methodName, result: error } })
  }
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
 * Helper function that POSTs responses back to Slack
 * @param  {Object} parameters Parameters for assembling the request
 * @return {Promise}
 */
function sendDelayedResponseToSlack(parameters) {
  return request
    .post(parameters.slackRequest.response_url)
    .type('json')
    .send({
      response_type: 'ephemeral',
      text: `Sorry for the delay! Here is your market quote for ${parameters.marketData.tickerSymbol}`,
      attachments: [{ text: `$${parameters.marketData.latestClosePrice} USD as of ${parameters.marketData.lastRefreshedDate}` }]
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
  const avTimeSeriesDailySchemaCheck = Joi.validate(avResponseBody, model.avTimeSeriesDailySchema)

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
  const slackRequest = req.body
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

        // Add Slack slash command request to SQS queue to be processed again later
        executeSqsMethod({
          methodFunction: sqs.sendMessage({ queueUrl, messageBody: slackRequest }),
          methodName: 'sendMessage'
        })

        break
      }
      case 'timeout': {
        // In this case, the programmed timeout beat out the response from the Alpha Vantage API
        log.info(`Alpha Vantage response was longer than ${avTimeout}ms for request.`)

        res.status(200).send({
          response_type: 'ephemeral',
          text: `It's taking me longer to fetch market data for ${tickerSymbol} than usual... Hang tight!`
        })

        // Add Slack slash command request to SQS queue to be processed again later
        executeSqsMethod({
          methodFunction: sqs.sendMessage({ queueUrl, messageBody: slackRequest }),
          methodName: 'sendMessage'
        })

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

        // Add Slack slash command request to SQS queue to be processed again later
        executeSqsMethod({
          methodFunction: sqs.sendMessage({ queueUrl, messageBody: slackRequest }),
          methodName: 'sendMessage'
        })
      }
    }
  } catch (error) {
    // There was an error response (non-200) coming back from the Alpha Vantage API
    log.error('Error caught attempting to communicate with Alpha Vantage API.', { details: error })

    res.status(200).send({
      response_type: 'ephemeral',
      text: `I had a problem trying to fetch market data for ${tickerSymbol}. I'll try again later and report back.`
    })

    // Add Slack slash command request to SQS queue to be processed again later
    executeSqsMethod({
      methodFunction: sqs.sendMessage({ queueUrl, messageBody: slackRequest }),
      methodName: 'sendMessage'
    })
  }
}

/**
 * Function that polls the SQS queue on a configured interval
 * and attempts to retry processing Slack slash command requests
 */
async function processRetryQueue() {
  try {
    const receivedMessages = await sqs.receiveMessage({ queueUrl })
    const time = Math.floor(new Date().getTime() / 1000)

    forEach(receivedMessages.Messages, async (message) => {
      const messageSentTime = Math.floor(parseInt(message.Attributes.SentTimestamp, 10) / 1000)
      const receiptHandle = message.ReceiptHandle
      const slackRequest = JSON.parse(message.Body)
      const tickerSymbol = slackRequest.text

      if ((time - messageSentTime) > 1800) {
        // If message creation timestamp is older than 30 minutes, delete and
        // notify admin. Slack will not accept response URLs that are older than 30 minutes.
        // Messages this old indicate a cascading problem from Slack and/or the Alpha Vantage API.
        log.error('Slack request older than 30 minutes was detected. Message will be deleted.', { details: message })

        executeSqsMethod({
          methodFunction: sqs.deleteMessage({ queueUrl, receiptHandle }),
          methodName: 'deleteMessage'
        })
      } else {
        // Attempt to communicate with Alpha Vantage API to get time series (daily) information
        try {
          const marketQuoteResponse = await getMarketQuote(slackRequest.text)
          const avSchemaCheck = validateAvSchema(marketQuoteResponse.body)

          switch (avSchemaCheck) {
            case 'passingResponse': {
              // A successful response shape comes back from the Alpha Vantage API
              const lastRefreshedDate = marketQuoteResponse.body['Meta Data']['3. Last Refreshed'].substring(0, 10)
              const latestClosePrice = marketQuoteResponse.body['Time Series (Daily)'][lastRefreshedDate]['4. close']

              try {
                // Attempt to send the delayed response back to Slack
                const sendResponseResult = await sendDelayedResponseToSlack({
                  slackRequest,
                  marketData: { latestClosePrice, lastRefreshedDate, tickerSymbol }
                })

                if (sendResponseResult.status === 200) {
                  // Delete the SQS message upon successful response from Slack
                  executeSqsMethod({
                    methodFunction: sqs.deleteMessage({ queueUrl, receiptHandle }),
                    methodName: 'deleteMessage'
                  })
                } else {
                  // If for some reason Slack doesn't return a 200 status code
                  // and isn't caught in the catch below, don't delete the message.
                  // As a basic backoff mechanism (not exponential), increase the message
                  // visibility timeout higher so that it can be retried later.
                  executeSqsMethod({
                    methodFunction: sqs.changeMessageVisibility({
                      queueUrl, receiptHandle, visibilityTimeout
                    }),
                    methodName: 'changeMessageVisibility'
                  })
                }
              } catch (sendResponseError) {
                if (sendResponseError.status === 404) {
                  // If Slack replies with a 404, the message's Slack response URL is likely expired
                  // or no longer valid, so delete the SQS message.
                  log.error('Slack response URL is responding with a 404. Message will be deleted.', { details: message })

                  executeSqsMethod({
                    methodFunction: sqs.deleteMessage({ queueUrl, receiptHandle }),
                    methodName: 'deleteMessage'
                  })
                } else {
                  // There's likely a 500-level error occurring, so message won't be deleted
                  // just in case Slack's API is momentarily down. Notifying admin of error
                  // as Slack could be down for a long period of time.
                  log.error('Error caught attempting to send delayed response to Slack.', { details: sendResponseError })

                  // As a basic backoff mechanism (not exponential), increase the message
                  // visibility timeout higher so that it can be retried later.
                  executeSqsMethod({
                    methodFunction: sqs.changeMessageVisibility({
                      queueUrl, receiptHandle, visibilityTimeout
                    }),
                    methodName: 'changeMessageVisibility'
                  })
                }
              }

              break
            }
            case 'errorResponse':
            case 'rateLimitResponse':
            case 'unknownResponse':
            default: {
              // Catch-all for when an error, rate limit, or unknown response is returned from the
              // Alpha Vantage API.
              log.error('Alpha Vantage API responded with an error, rate limit, or unknown response.', { details: message })

              // Since the error could be related to the Alpha Vantage API being momentarily
              // down, the message won't be deleted.
              // As a basic backoff mechanism (not exponential), increase the message
              // visibility timeout higher so that it can be retried later.
              executeSqsMethod({
                methodFunction: sqs.changeMessageVisibility({
                  queueUrl, receiptHandle, visibilityTimeout
                }),
                methodName: 'changeMessageVisibility'
              })
            }
          }
        } catch (getMarketQuoteError) {
          // General error catching for requests to the Alpha Vantage API
          log.error('Error caught attempting to communicate with Alpha Vantage API: ', { details: getMarketQuoteError })
        }
      }
    })
  } catch (receivedMessagesError) {
    // General error catching for SQS message receiving
    log.error('Error caught attempting to receive messages from SQS queue.', { details: receivedMessagesError })
  }
}

// Initialize the Slack slash command request retry queue
setInterval(processRetryQueue, processRetryQueueInterval)

// POST /market-quote
router.post('/market-quote', slack.validateSlackRequest, slack.validateSlackSchema, marketQuote)

export default router
