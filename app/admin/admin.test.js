import clone from 'lodash/clone.js'
import nock from 'nock'
import request from 'supertest'
import sinon from 'sinon'
import { expect } from 'chai'
import { describe, it } from 'mocha'
import app from '../server.js'

const testJwtMalformed = 'badjwt.badjwt.badjwt'
const testJwtExpired = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbiI6dHJ1ZSwiaWF0IjoxNTYzMDUxMTQ5LCJleHAiOjE1NjMwNTExNTl9.S9DjCmEmeRQ-C5npb34ExKsvUJlXcGe3GBKWArlW2nI'
const testJwtNoAdminAccess = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhc2RmIjp0cnVlLCJpYXQiOjE1NjMwNTEwMjMsImV4cCI6MTU2NTY0MzAyM30.Vn_zKWKs8EPyiUGGHm2UsPNJoesF89ecfSPkblnu3Pc'
const testJwtPassing = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbiI6dHJ1ZSwiaWF0IjoxNTYzMDUwMDA1LCJleHAiOjE1NjU2NDIwMDV9.nABVpiyOFBusgodvWEcthVeVhFdiZmf2dpV1o5t2v6o'

const changeMessageVisibilityRequest = {
  queueUrl: 'http://localhost:9324/queue/joshbot',
  receiptHandle: '3dbeeedf-699b-40c2-a10d-48e9bda0d666#82bdea9f-675e-46f6-968d-3e76b23f6a43',
  visibilityTimeout: 30
}
const createQueueRequest = { queueName: 'joshbot' }
const deleteQueueRequest = { queueUrl: 'http://localhost:9324/queue/joshbot' }
const deleteMessageRequest = {
  queueUrl: 'http://localhost:9324/queue/joshbot',
  receiptHandle: '3dbeeedf-699b-40c2-a10d-48e9bda0d666#82bdea9f-675e-46f6-968d-3e76b23f6a43'
}
const receiveMessageRequest = { queueUrl: 'http://localhost:9324/queue/joshbot' }
const sendMessageRequest = { messageBody: { test: 'body' }, queueUrl: 'http://localhost:9324/queue/joshbot' }

// Block outgoing HTTP requests
nock.disableNetConnect()

// Enable only localhost connections for integration tests
nock.enableNetConnect('127.0.0.1')

describe('[unit] POST /admin/sqs/change-message-visibility', () => {
  before(() => {
    // Fix time to ensure the test JWTs remain time relative
    sinon.useFakeTimers({ now: 1563051161000 })
  })

  after(() => {
    sinon.restore()
  })

  it('JWT has expired (401)', () => {
    return request(app)
      .post('/admin/sqs/change-message-visibility')
      .type('json')
      .send(changeMessageVisibilityRequest)
      .set('Authorization', `Bearer ${testJwtExpired}`)
      .expect(401)
  })

  it('JWT does not have admin access (401)', () => {
    return request(app)
      .post('/admin/sqs/change-message-visibility')
      .type('json')
      .send(changeMessageVisibilityRequest)
      .set('Authorization', `Bearer ${testJwtNoAdminAccess}`)
      .expect(401)
  })

  it('JWT could not be verified (401)', () => {
    return request(app)
      .post('/admin/sqs/change-message-visibility')
      .type('json')
      .send(changeMessageVisibilityRequest)
      .set('Authorization', `Bearer ${testJwtMalformed}`)
      .expect(401)
  })

  it('Authorization header is malformed (401)', () => {
    return request(app)
      .post('/admin/sqs/change-message-visibility')
      .type('json')
      .send(changeMessageVisibilityRequest)
      .set('Authorization', 'this is totally wrong')
      .expect(401)
  })

  it('Fails request payload schema validation (400)', () => {
    const changeMessageVisibilityRequestBad = clone(changeMessageVisibilityRequest)
    changeMessageVisibilityRequestBad.queueUrl = 'http//localhost:9324/queue/joshbot'
    changeMessageVisibilityRequestBad.receiptHandle = 12
    changeMessageVisibilityRequestBad.visibilityTimeout = 44000
    changeMessageVisibilityRequestBad.unknown = 'unknown property'

    return request(app)
      .post('/admin/sqs/change-message-visibility')
      .type('json')
      .send(changeMessageVisibilityRequestBad)
      .set('Authorization', `Bearer ${testJwtPassing}`)
      .expect(400)
      .then((res) => {
        expect(res.body).to.be.an('object')
        expect(res.body).to.have.property('errors').that.is.an('array')
        expect(res.body.errors).to.have.members([
          '"queueUrl" must be a valid uri',
          '"receiptHandle" must be a string',
          '"visibilityTimeout" must be less than or equal to 43200',
          '"unknown" is not allowed'
        ])
      })
  })
})

describe('[unit] POST /admin/sqs/create-queue', () => {
  before(() => {
    // Fix time to ensure the test JWTs remain time relative
    sinon.useFakeTimers({ now: 1563051161000 })
  })

  after(() => {
    sinon.restore()
  })

  it('JWT has expired (401)', () => {
    return request(app)
      .post('/admin/sqs/create-queue')
      .type('json')
      .send(createQueueRequest)
      .set('Authorization', `Bearer ${testJwtExpired}`)
      .expect(401)
  })

  it('JWT does not have admin access (401)', () => {
    return request(app)
      .post('/admin/sqs/create-queue')
      .type('json')
      .send(createQueueRequest)
      .set('Authorization', `Bearer ${testJwtNoAdminAccess}`)
      .expect(401)
  })

  it('JWT could not be verified (401)', () => {
    return request(app)
      .post('/admin/sqs/create-queue')
      .type('json')
      .send(createQueueRequest)
      .set('Authorization', `Bearer ${testJwtMalformed}`)
      .expect(401)
  })

  it('Authorization header is malformed (401)', () => {
    return request(app)
      .post('/admin/sqs/create-queue')
      .type('json')
      .send(createQueueRequest)
      .set('Authorization', 'this is totally wrong')
      .expect(401)
  })

  it('Fails request payload schema validation (400)', () => {
    const createQueueRequestBad = clone(createQueueRequest)
    createQueueRequestBad.queueName = 'joshbot_@#$%!'
    createQueueRequestBad.unknown = 'unknown property'

    return request(app)
      .post('/admin/sqs/create-queue')
      .type('json')
      .send(createQueueRequestBad)
      .set('Authorization', `Bearer ${testJwtPassing}`)
      .expect(400)
      .then((res) => {
        expect(res.body).to.be.an('object')
        expect(res.body).to.have.property('errors').that.is.an('array')
        expect(res.body.errors).to.have.members([
          '"queueName" with value "joshbot_@#$%!" fails to match the alphanumeric characters, hypens (-), and underscores (_) pattern',
          '"unknown" is not allowed'
        ])
      })
  })
})

describe('[unit] POST /admin/sqs/delete-queue', () => {
  before(() => {
    // Fix time to ensure the test JWTs remain time relative
    sinon.useFakeTimers({ now: 1563051161000 })
  })

  after(() => {
    sinon.restore()
  })

  it('JWT has expired (401)', () => {
    return request(app)
      .post('/admin/sqs/delete-queue')
      .type('json')
      .send(deleteQueueRequest)
      .set('Authorization', `Bearer ${testJwtExpired}`)
      .expect(401)
  })

  it('JWT does not have admin access (401)', () => {
    return request(app)
      .post('/admin/sqs/delete-queue')
      .type('json')
      .send(deleteQueueRequest)
      .set('Authorization', `Bearer ${testJwtNoAdminAccess}`)
      .expect(401)
  })

  it('JWT could not be verified (401)', () => {
    return request(app)
      .post('/admin/sqs/delete-queue')
      .type('json')
      .send(deleteQueueRequest)
      .set('Authorization', `Bearer ${testJwtMalformed}`)
      .expect(401)
  })

  it('Authorization header is malformed (401)', () => {
    return request(app)
      .post('/admin/sqs/delete-queue')
      .type('json')
      .send(deleteQueueRequest)
      .set('Authorization', 'this is totally wrong')
      .expect(401)
  })

  it('Fails request payload schema validation (400)', () => {
    const deleteQueueRequestBad = clone(deleteQueueRequest)
    deleteQueueRequestBad.queueUrl = 'http//localhost:9324/queue/joshbot'
    deleteQueueRequestBad.unknown = 'unknown property'

    return request(app)
      .post('/admin/sqs/delete-queue')
      .type('json')
      .send(deleteQueueRequestBad)
      .set('Authorization', `Bearer ${testJwtPassing}`)
      .expect(400)
      .then((res) => {
        expect(res.body).to.be.an('object')
        expect(res.body).to.have.property('errors').that.is.an('array')
        expect(res.body.errors).to.have.members([
          '"queueUrl" must be a valid uri',
          '"unknown" is not allowed'
        ])
      })
  })
})

describe('[unit] POST /admin/sqs/delete-message', () => {
  before(() => {
    // Fix time to ensure the test JWTs remain time relative
    sinon.useFakeTimers({ now: 1563051161000 })
  })

  after(() => {
    sinon.restore()
  })

  it('JWT has expired (401)', () => {
    return request(app)
      .post('/admin/sqs/delete-message')
      .type('json')
      .send(deleteMessageRequest)
      .set('Authorization', `Bearer ${testJwtExpired}`)
      .expect(401)
  })

  it('JWT does not have admin access (401)', () => {
    return request(app)
      .post('/admin/sqs/delete-message')
      .type('json')
      .send(deleteMessageRequest)
      .set('Authorization', `Bearer ${testJwtNoAdminAccess}`)
      .expect(401)
  })

  it('JWT could not be verified (401)', () => {
    return request(app)
      .post('/admin/sqs/delete-message')
      .type('json')
      .send(deleteMessageRequest)
      .set('Authorization', `Bearer ${testJwtMalformed}`)
      .expect(401)
  })

  it('Authorization header is malformed (401)', () => {
    return request(app)
      .post('/admin/sqs/delete-message')
      .type('json')
      .send(deleteMessageRequest)
      .set('Authorization', 'this is totally wrong')
      .expect(401)
  })

  it('Fails request payload schema validation (400)', () => {
    const deleteMessageRequestBad = clone(deleteMessageRequest)
    deleteMessageRequestBad.queueUrl = 'http//localhost:9324/queue/joshbot'
    deleteMessageRequestBad.receiptHandle = 42
    deleteMessageRequestBad.unknown = 'unknown property'

    return request(app)
      .post('/admin/sqs/delete-message')
      .type('json')
      .send(deleteMessageRequestBad)
      .set('Authorization', `Bearer ${testJwtPassing}`)
      .expect(400)
      .then((res) => {
        expect(res.body).to.be.an('object')
        expect(res.body).to.have.property('errors').that.is.an('array')
        expect(res.body.errors).to.have.members([
          '"queueUrl" must be a valid uri',
          '"receiptHandle" must be a string',
          '"unknown" is not allowed'
        ])
      })
  })
})

describe('[unit] POST /admin/sqs/receive-message', () => {
  before(() => {
    // Fix time to ensure the test JWTs remain time relative
    sinon.useFakeTimers({ now: 1563051161000 })
  })

  after(() => {
    sinon.restore()
  })

  it('JWT has expired (401)', () => {
    return request(app)
      .post('/admin/sqs/receive-message')
      .type('json')
      .send(receiveMessageRequest)
      .set('Authorization', `Bearer ${testJwtExpired}`)
      .expect(401)
  })

  it('JWT does not have admin access (401)', () => {
    return request(app)
      .post('/admin/sqs/receive-message')
      .type('json')
      .send(receiveMessageRequest)
      .set('Authorization', `Bearer ${testJwtNoAdminAccess}`)
      .expect(401)
  })

  it('JWT could not be verified (401)', () => {
    return request(app)
      .post('/admin/sqs/receive-message')
      .type('json')
      .send(receiveMessageRequest)
      .set('Authorization', `Bearer ${testJwtMalformed}`)
      .expect(401)
  })

  it('Authorization header is malformed (401)', () => {
    return request(app)
      .post('/admin/sqs/receive-message')
      .type('json')
      .send(receiveMessageRequest)
      .set('Authorization', 'this is totally wrong')
      .expect(401)
  })

  it('Fails request payload schema validation (400)', () => {
    const receiveMessageRequestBad = clone(receiveMessageRequest)
    receiveMessageRequestBad.queueUrl = 'http//localhost:9324/queue/joshbot'
    receiveMessageRequestBad.unknown = 'unknown property'

    return request(app)
      .post('/admin/sqs/receive-message')
      .type('json')
      .send(receiveMessageRequestBad)
      .set('Authorization', `Bearer ${testJwtPassing}`)
      .expect(400)
      .then((res) => {
        expect(res.body).to.be.an('object')
        expect(res.body).to.have.property('errors').that.is.an('array')
        expect(res.body.errors).to.have.members([
          '"queueUrl" must be a valid uri',
          '"unknown" is not allowed'
        ])
      })
  })
})

describe('[unit] POST /admin/sqs/send-message', () => {
  before(() => {
    // Fix time to ensure the test JWTs remain time relative
    sinon.useFakeTimers({ now: 1563051161000 })
  })

  after(() => {
    sinon.restore()
  })

  it('JWT has expired (401)', () => {
    return request(app)
      .post('/admin/sqs/send-message')
      .type('json')
      .send(sendMessageRequest)
      .set('Authorization', `Bearer ${testJwtExpired}`)
      .expect(401)
  })

  it('JWT does not have admin access (401)', () => {
    return request(app)
      .post('/admin/sqs/send-message')
      .type('json')
      .send(sendMessageRequest)
      .set('Authorization', `Bearer ${testJwtNoAdminAccess}`)
      .expect(401)
  })

  it('JWT could not be verified (401)', () => {
    return request(app)
      .post('/admin/sqs/send-message')
      .type('json')
      .send(sendMessageRequest)
      .set('Authorization', `Bearer ${testJwtMalformed}`)
      .expect(401)
  })

  it('Authorization header is malformed (401)', () => {
    return request(app)
      .post('/admin/sqs/send-message')
      .type('json')
      .send(sendMessageRequest)
      .set('Authorization', 'this is totally wrong')
      .expect(401)
  })

  it('Fails request payload schema validation (400)', () => {
    const sendMessageRequestBad = clone(sendMessageRequest)
    sendMessageRequestBad.messageBody = 'this should be an object!'
    sendMessageRequestBad.queueUrl = 'http//localhost:9324/queue/joshbot'
    sendMessageRequestBad.unknown = 'unknown property'

    return request(app)
      .post('/admin/sqs/send-message')
      .type('json')
      .send(sendMessageRequestBad)
      .set('Authorization', `Bearer ${testJwtPassing}`)
      .expect(400)
      .then((res) => {
        expect(res.body).to.be.an('object')
        expect(res.body).to.have.property('errors').that.is.an('array')
        expect(res.body.errors).to.have.members([
          '"messageBody" must be an object',
          '"queueUrl" must be a valid uri',
          '"unknown" is not allowed'
        ])
      })
  })
})
