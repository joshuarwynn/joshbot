import Joi from '@hapi/joi'

// Joi schema for an error response from the Alpha Vantage API
const avErrorSchema = Joi.object().keys({
  'Error Message': Joi.string().required()
})

// Joi schema for a rate limited response from the Alpha Vantage API
const avRateLimitSchema = Joi.object().keys({
  Note: Joi.string().required().valid('Thank you for using Alpha Vantage! Our standard API call frequency is 5 calls per minute and 500 calls per day. Please visit https://www.alphavantage.co/premium/ if you would like to target a higher API call frequency.')
})

// Joi schema for a properly formed Alpha Vantage API
// time series (daily) response
const avTimeSeriesDailySchema = Joi.object().keys({
  'Meta Data': Joi.object().keys({
    '1. Information': Joi.string().valid('Daily Prices (open, high, low, close) and Volumes'),
    '2. Symbol': Joi.string(),
    '3. Last Refreshed': Joi.string().isoDate().required(),
    '4. Output Size': Joi.string().valid('Compact'),
    '5. Time Zone': Joi.string()
  }),
  'Time Series (Daily)': Joi.object().pattern(Joi.string().isoDate(), Joi.object().keys({
    '1. open': Joi.string(),
    '2. high': Joi.string(),
    '3. low': Joi.string(),
    '4. close': Joi.string().required(),
    '5. volume': Joi.string()
  }))
})

export default { avErrorSchema, avRateLimitSchema, avTimeSeriesDailySchema }
