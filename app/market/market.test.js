const config = require('config')
const nock = require('nock')
const sinon = require('sinon')
const { expect } = require('chai')
const { clone } = require('lodash')
const { describe, it } = require('mocha')
const request = require('supertest')(require('../server.js'))

const avBaseUri = config.get('alphaVantage.baseUri')
const avTimeout = config.get('alphaVantage.timeout')

const avErrorResponse = {
  'Error Message': 'Invalid API call. Please retry or visit the documentation (https://www.alphavantage.co/documentation/) for TIME_SERIES_DAILY.'
}

const avRateLimitResponse = {
  Note: 'Thank you for using Alpha Vantage! Our standard API call frequency is 5 calls per minute and 500 calls per day. Please visit https://www.alphavantage.co/premium/ if you would like to target a higher API call frequency.'
}

const avSuccessResponse = {
  'Meta Data': {
    '1. Information': 'Daily Prices (open, high, low, close) and Volumes',
    '2. Symbol': 'BTCUSD',
    '3. Last Refreshed': '2019-05-31 16:00:01',
    '4. Output Size': 'Compact',
    '5. Time Zone': 'US/Eastern'
  },
  'Time Series (Daily)': {
    '2019-05-31': {
      '1. open': '8269.5767',
      '2. high': '8335.4563',
      '3. low': '8262.4327',
      '4. close': '8293.4497',
      '5. volume': '1570'
    },
    '2019-05-30': {
      '1. open': '8664.5052',
      '2. high': '9097.6700',
      '3. low': '7918.5385',
      '4. close': '8270.4277',
      '5. volume': '70936'
    }
  }
}

const slackRequestPayload = {
  token: '3tpcmGNDMEl4P0l2RqWnKMZi',
  team_id: 'T1RBH78H1',
  team_domain: 'wynntastic',
  channel_id: 'D1SGHT8AK',
  channel_name: 'directmessage',
  user_id: 'U1SGC327J',
  user_name: 'josh',
  command: '/marketquote',
  text: 'BTCUSD',
  response_url: 'https://hooks.slack.com/commands/T1RBH78H1/641782664183/195nYfwGCJw2rx89dzBUS23r',
  trigger_id: '628507369075.59391246579.415102cf2dfe27c55e5a752d9fb4fe1d'
}

// Block outgoing HTTP requests
nock.disableNetConnect()

// Enable only localhost connections for integration tests
nock.enableNetConnect('127.0.0.1')

describe('[unit] POST /market-quote Slack slash command request replay attack caught', () => {
  it('Catches Slack slash command request replay attack (200)', () => {
    return request
      .post('/market-quote')
      .type('form')
      .send(slackRequestPayload)
      .set('X-Slack-Request-Timestamp', '1558290091')
      .set('X-Slack-Signature', 'v0=a5de1629f331a65e16741632ec71faed8b9e88e83ec9e8c21b7fcd8d57428f20')
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.an('object')
        expect(res.body).to.have.property('response_type', 'ephemeral')
        expect(res.body).to.have.property('text', 'There was a communication error with Joshbot. (code: 101)')
      })
  })
})

describe('[unit] POST /market-quote Slack slash command request invalid signature caught', () => {
  before(() => {
    sinon.useFakeTimers({ now: 1558290091000 })
  })

  after(() => {
    sinon.restore()
  })

  it('Catches Slack slash command request invalid signature (200)', () => {
    return request
      .post('/market-quote')
      .type('form')
      .send(slackRequestPayload)
      .set('X-Slack-Request-Timestamp', '1558290091')
      .set('X-Slack-Signature', 'v0=855f33caf1152b329651f870595434fae0476c60f616df6fce4d5760bb7error')
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.an('object')
        expect(res.body).to.have.property('response_type', 'ephemeral')
        expect(res.body).to.have.property('text', 'There was a communication error with Joshbot. (code: 102)')
      })
  })
})

describe('[unit] POST /market-quote Slack slash command request payload missing text argument(s)', () => {
  const slackRequestPayloadEmptyText = clone(slackRequestPayload)
  slackRequestPayloadEmptyText.text = ''

  before(() => {
    sinon.useFakeTimers({ now: 1558290091000 })
  })

  after(() => {
    sinon.restore()
  })

  it('Catches Slack slash command request payload with empty text argument(s) (200)', () => {
    return request
      .post('/market-quote')
      .type('form')
      .send(slackRequestPayloadEmptyText)
      .set('X-Slack-Request-Timestamp', '1558290091')
      .set('X-Slack-Signature', 'v0=69bbfccff09113e12d750734da22f2b12a7e8f085ab792d93bead1ff2fd7db4f')
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.an('object')
        expect(res.body).to.have.property('response_type', 'ephemeral')
        expect(res.body).to.have.property('text', 'You forgot to include your slash command argument! See examples below:')
        expect(res.body).to.have.property('attachments').that.is.an('array')
        expect(res.body.attachments).to.deep.include({ text: 'Getting a market quote: /marketquote BTCUSD' })
      })
  })
})

describe('[unit] POST /market-quote Slack slash command request payload schema is invalid', () => {
  const slackRequestPayloadNewSchema = clone(slackRequestPayload)
  slackRequestPayloadNewSchema.newfield = 'this should not be here'

  before(() => {
    sinon.useFakeTimers({ now: 1558290091000 })
  })

  after(() => {
    sinon.restore()
  })

  it('Catches Slack slash command request payload with an extra field (200)', () => {
    return request
      .post('/market-quote')
      .type('form')
      .send(slackRequestPayloadNewSchema)
      .set('X-Slack-Request-Timestamp', '1558290091')
      .set('X-Slack-Signature', 'v0=e46f3df4dc8f271bfff93af400bd4aa2790c683ca8da3fb1f1e700f6a54492a1')
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.an('object')
        expect(res.body).to.have.property('response_type', 'ephemeral')
        expect(res.body).to.have.property('text', 'There was a communication error with Joshbot. (code: 103)')
      })
  })
})

describe('[unit] POST /market-quote ticker symbol quote found', () => {
  before(() => {
    // Mock the time so that Slack slash command request repeat attack check is satisfied
    sinon.useFakeTimers({ now: 1558290091000 })

    // Mock the Alpha Vantage outbound API call
    nock(avBaseUri)
      .get('/query')
      .query(true) // mock the entire url regardless of the passed query string
      .reply(200, avSuccessResponse)
  })

  after(() => {
    sinon.restore()
    nock.cleanAll()
  })

  it('Succeeds base case (200)', () => {
    return request
      .post('/market-quote')
      .type('form')
      .send(slackRequestPayload)
      .set('X-Slack-Request-Timestamp', '1558290091')
      .set('X-Slack-Signature', 'v0=a5de1629f331a65e16741632ec71faed8b9e88e83ec9e8c21b7fcd8d57428f20')
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.an('object')
        expect(res.body).to.have.property('response_type', 'ephemeral')
        expect(res.body).to.have.property('text', 'Here is your market quote for BTCUSD')
        expect(res.body).to.have.property('attachments').that.is.an('array')
        expect(res.body.attachments).to.deep.include({ text: '$8293.4497 USD as of 2019-05-31' })
      })
  })
})

describe('[unit] POST /market-quote ticker symbol quote not found', () => {
  const slackRequestPayloadBadSymbol = clone(slackRequestPayload)
  slackRequestPayloadBadSymbol.text = 'N05'

  before(() => {
    // Mock the time so that Slack slash command request repeat attack check is satisfied
    sinon.useFakeTimers({ now: 1558290091000 })

    // Mock the Alpha Vantage outbound API call
    nock(avBaseUri)
      .get('/query')
      .query(true) // mock the entire url regardless of the passed query string
      .reply(200, avErrorResponse)
  })

  after(() => {
    sinon.restore()
    nock.cleanAll()
  })

  it('Fails ticker symbol not found (200)', () => {
    return request
      .post('/market-quote')
      .type('form')
      .send(slackRequestPayloadBadSymbol)
      .set('X-Slack-Request-Timestamp', '1558290091')
      .set('X-Slack-Signature', 'v0=5b15765b4dc91a3a9ec05b18001358a192062f14962e54bdbc466b87640c51a3')
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.an('object')
        expect(res.body).to.have.property('response_type', 'ephemeral')
        expect(res.body).to.have.property('text', 'I had trouble fetching the latest market data for N05. Make sure it\'s a valid ticker symbol and try again later.')
      })
  })
})

describe('[unit] POST /market-quote rate limit hit from Alpha Vantage API', () => {
  before(() => {
    // Mock the time so that Slack slash command request repeat attack check is satisfied
    sinon.useFakeTimers({ now: 1558290091000 })

    // Mock the Alpha Vantage outbound API call
    nock(avBaseUri)
      .get('/query')
      .query(true) // mock the entire url regardless of the passed query string
      .reply(200, avRateLimitResponse)
  })

  after(() => {
    sinon.restore()
    nock.cleanAll()
  })

  it('Rate limit occurs (200)', () => {
    return request
      .post('/market-quote')
      .type('form')
      .send(slackRequestPayload)
      .set('X-Slack-Request-Timestamp', '1558290091')
      .set('X-Slack-Signature', 'v0=a5de1629f331a65e16741632ec71faed8b9e88e83ec9e8c21b7fcd8d57428f20')
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.an('object')
        expect(res.body).to.have.property('response_type', 'ephemeral')
        expect(res.body).to.have.property('text', 'Circuits are busy! Hang tight while I fetch market data for BTCUSD...')
      })
  })
})

// TODO: This test needs work. Skipping it programmatically for now.
describe(`[unit] POST /market-quote timeout (over ${avTimeout}ms)`, function () { // eslint-disable-line func-names
  // Reference: https://stackoverflow.com/questions/23492043/change-default-timeout-for-mocha
  // May need to use the mocha.opts file approach with `--timeout 5000` instead

  // Override the Mocha timeout in this test to 5 seconds
  this.timeout(5000)

  before(() => {
    // Mock the time so that Slack slash command request repeat attack check is satisfied
    sinon.useFakeTimers({ now: 1558290091000 })

    // Mock the Alpha Vantage outbound API call
    nock(avBaseUri)
      .get('/query')
      .query(true) // mock the entire url regardless of the passed query string
      // .delay(3000) // TODO: Figure out why this hangs mocha for the entire timeout
      .reply(200, avSuccessResponse)
  })

  after(() => {
    sinon.restore()
    nock.cleanAll()
  })

  it.skip('Timeout occurs (200)', () => {
    return request
      .post('/market-quote')
      .type('form')
      .send(slackRequestPayload)
      .set('X-Slack-Request-Timestamp', '1558290091')
      .set('X-Slack-Signature', 'v0=a5de1629f331a65e16741632ec71faed8b9e88e83ec9e8c21b7fcd8d57428f20')
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.an('object')
        expect(res.body).to.have.property('response_type', 'ephemeral')
        expect(res.body).to.have.property('text', 'It\'s taking me longer to fetch market data for BTCUSD than usual. Hang tight!')
      })
  })
})

describe('[unit] POST /market-quote unknown response from Alpha Vantage API', () => { // eslint-disable-line func-names
  before(() => {
    // Mock the time so that Slack slash command request repeat attack check is satisfied
    sinon.useFakeTimers({ now: 1558290091000 })

    // Mock the Alpha Vantage outbound API call
    nock(avBaseUri)
      .get('/query')
      .query(true) // mock the entire url regardless of the passed query string
      .reply(200, { unknown: 'response' })
  })

  after(() => {
    sinon.restore()
    nock.cleanAll()
  })

  it('Unknown response occurs (200)', () => {
    return request
      .post('/market-quote')
      .type('form')
      .send(slackRequestPayload)
      .set('X-Slack-Request-Timestamp', '1558290091')
      .set('X-Slack-Signature', 'v0=a5de1629f331a65e16741632ec71faed8b9e88e83ec9e8c21b7fcd8d57428f20')
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.an('object')
        expect(res.body).to.have.property('response_type', 'ephemeral')
        expect(res.body).to.have.property('text', 'Things got really weird fetching market data for BTCUSD. I\'ll try again later and report back.')
      })
  })
})

describe('[unit] POST /market-quote error communicating with Alpha Vantage API', () => { // eslint-disable-line func-names
  before(() => {
    // Mock the time so that Slack slash command request repeat attack check is satisfied
    sinon.useFakeTimers({ now: 1558290091000 })

    // Mock the Alpha Vantage outbound API call
    nock(avBaseUri)
      .get('/query')
      .query(true) // mock the entire url regardless of the passed query string
      .reply(500)
  })

  after(() => {
    sinon.restore()
    nock.cleanAll()
  })

  it('Communication error (200)', () => {
    return request
      .post('/market-quote')
      .type('form')
      .send(slackRequestPayload)
      .set('X-Slack-Request-Timestamp', '1558290091')
      .set('X-Slack-Signature', 'v0=a5de1629f331a65e16741632ec71faed8b9e88e83ec9e8c21b7fcd8d57428f20')
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.an('object')
        expect(res.body).to.have.property('response_type', 'ephemeral')
        expect(res.body).to.have.property('text', 'I had a problem trying to fetch market data for BTCUSD. I\'ll try again later and report back.')
      })
  })
})
