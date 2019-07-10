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

// POST /admin/sqs/change-message-visibility
router.post('/admin/sqs/change-message-visibility', sqsChangeMessageVisibility)

// POST /admin/sqs/create-queue
router.post('/admin/sqs/create-queue', sqsCreateQueue)

export default router
