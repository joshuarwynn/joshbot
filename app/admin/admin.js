import express from 'express'
import sqs from '../utils/sqs.js'

const router = express.Router()

/**
 * Control flow callback for POST /admin/sqs/change-message-visibility
 * @param  {Request} req
 * @param  {Response} res
 * @return {Object}
 */
async function sqsChangeMessageVisibility(req, res) {
  try {
    const visibilityChanged = await sqs.changeMessageVisibility(
      req.body.receiptHandle,
      req.body.queueName,
      parseInt(req.body.visibilityTimeout, 10)
    )
    res.status(200).send(visibilityChanged)
  } catch (error) {
    res.status(200).send({ error })
  }
}

/**
 * Control flow callback for POST /admin/sqs/create-queue
 * @param  {Reqest} req
 * @param  {Response} res
 * @return {Object}
 */
async function sqsCreateQueue(req, res) {
  try {
    const queueCreated = await sqs.createQueue(req.body.queueName)
    res.status(200).send(queueCreated)
  } catch (error) {
    res.status(200).send({ error })
  }
}

/**
 * Control flow callback for POST /admin/sqs/delete-queue
 * @param  {Reqest} req
 * @param  {Response} res
 * @return {Object}
 */
async function sqsDeleteQueue(req, res) {
  try {
    const queueDeleted = await sqs.deleteQueue(req.body.queueUrl)
    res.status(200).send(queueDeleted)
  } catch (error) {
    res.status(200).send({ error })
  }
}

/**
 * Control flow callback for POST /admin/sqs/delete-message
 * @param  {Request} req
 * @param  {Response} res
 * @return {Object}
 */
async function sqsDeleteMessage(req, res) {
  try {
    const messageDeleted = await sqs.deleteMessage(req.body.queueUrl, req.body.receiptHandle)
    res.status(200).send(messageDeleted)
  } catch (error) {
    res.status(200).send({ error })
  }
}

/**
 * Control flow callback for POST /admin/sqs/receive-message
 * @param  {Request} req
 * @param  {Response} res
 * @return {Object}
 */
async function sqsReceiveMessage(req, res) {
  try {
    const receivedMessages = await sqs.receiveMessage(req.body.queueUrl)
    res.status(200).send(receivedMessages)
  } catch (error) {
    res.status(200).send({ error })
  }
}

/**
 * Control flow callback for POST /admin/sqs/send-message
 * @param  {Request} req
 * @param  {Response} res
 * @return {Object}
 */
async function sqsSendMessage(req, res) {
  try {
    const sentMessage = await sqs.sendMessage(req.body.queueUrl, req.body.messageBody)
    res.status(200).send(sentMessage)
  } catch (error) {
    res.status(200).send({ error })
  }
}

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
