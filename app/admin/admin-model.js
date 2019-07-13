import Joi from '@hapi/joi'

// Joi schema for an SQS change message visibility request
const changeMessageVisibilityRequestSchema = Joi.object().keys({
  queueUrl: Joi.string().uri().required(),
  receiptHandle: Joi.string().required(),
  visibilityTimeout: Joi.number().min(0).max(43200).required()
})

// Joi schema for an SQS create queue request
const createQueueRequestSchema = Joi.object().keys({
  queueName: Joi.string().regex(/^[-_a-z0-9]+$/, 'alphanumeric characters, hypens (-), and underscores (_)').required()
})

// Joi schema for an SQS delete queue request
const deleteQueueRequestSchema = Joi.object().keys({
  queueUrl: Joi.string().uri().required()
})

// Joi schema for an SQS delete message request
const deleteMessageRequestSchema = Joi.object().keys({
  queueUrl: Joi.string().uri().required(),
  receiptHandle: Joi.string().required()
})

// Joi schema for an SQS receive message request
const receiveMessageRequestSchema = Joi.object().keys({
  queueUrl: Joi.string().uri().required()
})

// Joi schema for an SQS send message request
const sendMessageRequestSchema = Joi.object().keys({
  messageBody: Joi.object().required(),
  queueUrl: Joi.string().uri().required()
})

export default {
  changeMessageVisibilityRequestSchema,
  createQueueRequestSchema,
  deleteQueueRequestSchema,
  deleteMessageRequestSchema,
  receiveMessageRequestSchema,
  sendMessageRequestSchema
}
