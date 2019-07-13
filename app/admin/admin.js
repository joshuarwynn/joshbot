import express from 'express'
import isNull from 'lodash/isNull.js'
import Joi from '@hapi/joi'
import map from 'lodash/map.js'
import jwt from '../utils/jwt.js'
import log from '../utils/log.js'
import model from './admin-model.js'
import sqs from '../utils/sqs.js'

const router = express.Router()

/**
 * Helper function to validate admin request payload schema
 * @param  {Object} payload Request payload
 * @param  {Object} schema  Joi schema to check request payload
 * @return {Object}
 */
function validateAdminSchema(payload, schema) {
  const adminSchemaCheck = Joi.validate(payload, schema, { abortEarly: false })

  if (!isNull(adminSchemaCheck.error)) {
    return { success: false, errors: map(adminSchemaCheck.error.details, 'message') }
  }
  return { success: true }
}

/**
 * Helper function to execute SQS method
 * @param  {Object} sqsMethod SQS method name and function with parameters passed
 * @param  {Response} res
 * @return {Object}
 */
async function executeSqsMethod(sqsMethod, res) {
  try {
    // Attempt to execute the SQS method with parameters passed
    const sqsMethodResult = await sqsMethod.methodFunction

    // Log the result and pass through successful SQS method response
    log.info('SQS method execution succeeded.', { details: { method: sqsMethod.methodName, result: sqsMethodResult } })
    res.status(200).send(sqsMethodResult)
  } catch (error) {
    // Log the result and pass through unsuccessful SQS method response
    log.info('SQS method execution failed.', { details: { method: sqsMethod.methodName, result: error } })
    res.status(200).send(error)
  }
}

/**
 * Control flow callback for POST /admin/sqs/change-message-visibility
 * @param  {Request} req
 * @param  {Response} res
 * @return {Object}
 */
function sqsChangeMessageVisibility(req, res) {
  // Verify that request payload schema is valid
  const requestSchemaCheck = validateAdminSchema(
    req.body,
    model.changeMessageVisibilityRequestSchema
  )

  if (requestSchemaCheck.success === true) {
    // If request payload schema is verified, build the parameters object,
    // SQS method object, and pass along to execute the SQS method
    const parameters = {
      queueUrl: req.body.queueUrl,
      receiptHandle: req.body.receiptHandle,
      visibilityTimeout: req.body.visibilityTimeout
    }

    const sqsMethod = {
      methodFunction: sqs.changeMessageVisibility(parameters),
      methodName: 'changeMessageVisibility'
    }

    executeSqsMethod(sqsMethod, res)
  } else {
    res.status(400).send({ errors: requestSchemaCheck.errors })
  }
}

/**
 * Control flow callback for POST /admin/sqs/create-queue
 * @param  {Reqest} req
 * @param  {Response} res
 * @return {Object}
 */
function sqsCreateQueue(req, res) {
  // Verify that request payload schema is valid
  const requestSchemaCheck = validateAdminSchema(req.body, model.createQueueRequestSchema)

  if (requestSchemaCheck.success === true) {
    // If request payload schema is verified, build the parameters object,
    // SQS method object, and pass along to execute the SQS method
    const parameters = { queueName: req.body.queueName }

    const sqsMethod = {
      methodFunction: sqs.createQueue(parameters),
      methodName: 'createQueue'
    }

    executeSqsMethod(sqsMethod, res)
  } else {
    res.status(400).send({ errors: requestSchemaCheck.errors })
  }
}

/**
 * Control flow callback for POST /admin/sqs/delete-queue
 * @param  {Reqest} req
 * @param  {Response} res
 * @return {Object}
 */
function sqsDeleteQueue(req, res) {
  // Verify that request payload schema is valid
  const requestSchemaCheck = validateAdminSchema(req.body, model.deleteQueueRequestSchema)

  if (requestSchemaCheck.success === true) {
    // If request payload schema is verified, build the parameters object,
    // SQS method object, and pass along to execute the SQS method
    const parameters = { queueUrl: req.body.queueUrl }

    const sqsMethod = {
      methodFunction: sqs.deleteQueue(parameters),
      methodName: 'deleteQueue'
    }

    executeSqsMethod(sqsMethod, res)
  } else {
    res.status(400).send({ errors: requestSchemaCheck.errors })
  }
}

/**
 * Control flow callback for POST /admin/sqs/delete-message
 * @param  {Request} req
 * @param  {Response} res
 * @return {Object}
 */
function sqsDeleteMessage(req, res) {
  // Verify that request payload schema is valid
  const requestSchemaCheck = validateAdminSchema(req.body, model.deleteMessageRequestSchema)

  if (requestSchemaCheck.success === true) {
    // If request payload schema is verified, build the parameters object,
    // SQS method object, and pass along to execute the SQS method
    const parameters = {
      queueUrl: req.body.queueUrl,
      receiptHandle: req.body.receiptHandle
    }

    const sqsMethod = {
      methodFunction: sqs.deleteMessage(parameters),
      methodName: 'deleteMessage'
    }

    executeSqsMethod(sqsMethod, res)
  } else {
    res.status(400).send({ errors: requestSchemaCheck.errors })
  }
}

/**
 * Control flow callback for POST /admin/sqs/receive-message
 * @param  {Request} req
 * @param  {Response} res
 * @return {Object}
 */
function sqsReceiveMessage(req, res) {
  // Verify that request payload schema is valid
  const requestSchemaCheck = validateAdminSchema(req.body, model.receiveMessageRequestSchema)

  if (requestSchemaCheck.success === true) {
    // If request payload schema is verified, build the parameters object,
    // SQS method object, and pass along to execute the SQS method
    const parameters = { queueUrl: req.body.queueUrl }

    const sqsMethod = {
      methodFunction: sqs.receiveMessage(parameters),
      methodName: 'receiveMessage'
    }

    executeSqsMethod(sqsMethod, res)
  } else {
    res.status(400).send({ errors: requestSchemaCheck.errors })
  }
}

/**
 * Control flow callback for POST /admin/sqs/send-message
 * @param  {Request} req
 * @param  {Response} res
 * @return {Object}
 */
function sqsSendMessage(req, res) {
  // Verify that request payload schema is valid
  const requestSchemaCheck = validateAdminSchema(req.body, model.sendMessageRequestSchema)

  if (requestSchemaCheck.success === true) {
    // If request payload schema is verified, build the parameters object,
    // SQS method object, and pass along to execute the SQS method
    const parameters = {
      queueUrl: req.body.queueUrl,
      messageBody: req.body.messageBody
    }

    const sqsMethod = {
      methodFunction: sqs.sendMessage(parameters),
      methodName: 'sendMessage'
    }

    executeSqsMethod(sqsMethod, res)
  } else {
    res.status(400).send({ errors: requestSchemaCheck.errors })
  }
}

// Verify JWT for all /admin routes
router.use('/admin*', jwt.verifyJwt)

// POST /admin/sqs/change-message-visibility
router.post('/admin/sqs/change-message-visibility', sqsChangeMessageVisibility)

// POST /admin/sqs/create-queue
router.post('/admin/sqs/create-queue', sqsCreateQueue)

// POST /admin/sqs/delete-queue
router.post('/admin/sqs/delete-queue', sqsDeleteQueue)

// POST /admin/sqs/delete-message
router.post('/admin/sqs/delete-message', sqsDeleteMessage)

// POST /admin/sqs/receive-message
router.post('/admin/sqs/receive-message', sqsReceiveMessage)

// POST /admin/sqs/send-message
router.post('/admin/sqs/send-message', sqsSendMessage)

export default router
