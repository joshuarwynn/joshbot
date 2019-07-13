#!/usr/bin/env node --experimental-modules
import crypto from 'crypto'
import jwt from 'jsonwebtoken'

// Generate a cryptographically strong 32-byte pseudo-random string for a secret key
const secretKey = crypto.randomBytes(32).toString('hex')

// Generate a signed JWT using HMAC SHA256 that expires in 30 days
const options = {
  algorithm: 'HS256',
  expiresIn: '30d'
}
const signedJwt = jwt.sign({ admin: true }, secretKey, options)

console.log('Here is your secret key and signed JWT. Don\'t lose it!') // eslint-disable-line no-console
console.log('Secret Key: ', secretKey) // eslint-disable-line no-console
console.log('Signed JWT: ', signedJwt) // eslint-disable-line no-console
