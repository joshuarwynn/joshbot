import AWS from 'aws-sdk'
import config from 'config'

// SQS connection variables
const accessKeyId = config.get('sqs.accessKeyId')
const apiVersion = config.get('sqs.apiVersion')
const endpoint = new AWS.Endpoint(config.get('sqs.endpoint'))
const region = config.get('sqs.region')
const secretAccessKey = config.get('sqs.secretAccessKey')

// SQS createQueue variables
const createQueueDelaySeconds = config.get('sqs.createQueue.delaySeconds')
const maximumMessageSize = config.get('sqs.createQueue.maximumMessageSize')
const messageRetentionPeriod = config.get('sqs.createQueue.messageRetentionPeriod')
const receiveMessageWaitTimeSeconds = config.get('sqs.createQueue.receiveMessageWaitTimeSeconds')
const createQueueVisibilityTimeout = config.get('sqs.createQueue.visibilityTimeout')

// SQS receiveMessage variables
const waitTimeSeconds = config.get('sqs.receiveMessage.waitTimeSeconds')
const receiveMessageVisibilityTimeout = config.get('sqs.receiveMessage.visibilityTimeout')
const maxNumberOfMessages = config.get('sqs.receiveMessage.maxNumberOfMessages')

// SQS sendMessage variables
const sendMessageDelaySeconds = config.get('sqs.sendMessage.delaySeconds')

// Connect to SQS
const sqs = new AWS.SQS({
  accessKeyId,
  apiVersion,
  endpoint,
  region,
  secretAccessKey
})

/**
 * Changes an SQS message visibility timeout value
 * @param  {Object} parameters Change SQS message visibility parameters
 * @return {Promise}
 */
function changeMessageVisibility(parameters) {
  return sqs.changeMessageVisibility({
    QueueUrl: parameters.queueUrl,
    ReceiptHandle: parameters.receiptHandle,
    VisibilityTimeout: parameters.visibilityTimeout
  }).promise()
}

/**
 * Creates a queue in SQS
 * @param  {Object} parameters Create SQS queue parameters
 * @return {Promise}
 */
function createQueue(parameters) {
  return sqs.createQueue({
    QueueName: parameters.queueName,
    Attributes: {
      DelaySeconds: createQueueDelaySeconds,
      MaximumMessageSize: maximumMessageSize,
      MessageRetentionPeriod: messageRetentionPeriod,
      ReceiveMessageWaitTimeSeconds: receiveMessageWaitTimeSeconds,
      VisibilityTimeout: createQueueVisibilityTimeout
    }
  }).promise()
}

/**
 * Deletes a queue in SQS
 * @param  {Object} parameters Delete SQS queue parameters
 * @return {Promise}
 */
function deleteQueue(parameters) {
  return sqs.deleteQueue({
    QueueUrl: parameters.queueUrl
  }).promise()
}

/**
 * Deletes an SQS message
 * @param  {Object} parameters Delete SQS message parameters
 * @return {Promise}
 */
function deleteMessage(parameters) {
  return sqs.deleteMessage({
    QueueUrl: parameters.queueUrl,
    ReceiptHandle: parameters.receiptHandle
  }).promise()
}

/**
 * Receives an SQS message
 * @param  {Object} parameters Receive SQS message parameters
 * @return {Promise}
 */
function receiveMessage(parameters) {
  return sqs.receiveMessage({
    QueueUrl: parameters.queueUrl,
    AttributeNames: ['All'],
    WaitTimeSeconds: waitTimeSeconds,
    VisibilityTimeout: receiveMessageVisibilityTimeout,
    MaxNumberOfMessages: maxNumberOfMessages
  }).promise()
}

/**
 * Sends an SQS message
 * @param  {Object} parameters  Send SQS message parameters
 * @return {Promise}
 */
function sendMessage(parameters) {
  return sqs.sendMessage({
    MessageBody: JSON.stringify(parameters.messageBody),
    QueueUrl: parameters.queueUrl,
    DelaySeconds: sendMessageDelaySeconds
  }).promise()
}

export default {
  changeMessageVisibility,
  createQueue,
  deleteQueue,
  deleteMessage,
  receiveMessage,
  sendMessage
}
