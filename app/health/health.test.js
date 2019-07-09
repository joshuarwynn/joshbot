import request from 'supertest'
import { expect } from 'chai'
import { describe, it } from 'mocha'
import app from '../server.js'

describe('[unit] GET /health', () => {
  it('Succeeds base case (200)', () => {
    return request(app)
      .get('/health')
      .expect(200)
      .then((res) => {
        expect(res).to.not.have.deep.property('headers.x-powered-by')
        expect(res.body).to.have.property('status', 'healthy')
      })
  })
})
