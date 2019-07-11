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
 * @param  {string} receiptHandle            Message receipt handle
 * @param  {string} queueUrl                 SQS queue URL
 * @param  {number} messageVisibilityTimeout Message visibility timeout
 * @return {Promise}
 */
function changeMessageVisibility(receiptHandle, queueUrl, messageVisibilityTimeout) {
  return sqs.changeMessageVisibility({
    QueueUrl: queueUrl,
    ReceiptHandle: receiptHandle,
    VisibilityTimeout: messageVisibilityTimeout
  }).promise()
}

/**
 * Creates a queue in SQS
 * @param  {string} queueName Name of SQS queue to be created
 * @return {Promise}
 */
function createQueue(queueName) {
  return sqs.createQueue({
    QueueName: queueName,
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
 * @param  {string} queueUrl SQS queue URL
 * @return {Promise}
 */
function deleteQueue(queueUrl) {
  return sqs.deleteQueue({
    QueueUrl: queueUrl
  }).promise()
}

/**
 * Deletes an SQS message
 * @param  {string} receiptHandle Message receipt handle
 * @param  {string} queueUrl      SQS queue URL
 * @return {Promise}
 */
function deleteMessage(queueUrl, receiptHandle) {
  return sqs.deleteMessage({
    QueueUrl: queueUrl,
    ReceiptHandle: receiptHandle
  }).promise()
}

/**
 * Receives an SQS message
 * @param  {string} queueUrl SQS queue URL
 * @return {Promise}
 */
function receiveMessage(queueUrl) {
  return sqs.receiveMessage({
    QueueUrl: queueUrl,
    AttributeNames: ['All'],
    WaitTimeSeconds: waitTimeSeconds,
    VisibilityTimeout: receiveMessageVisibilityTimeout,
    MaxNumberOfMessages: maxNumberOfMessages
  }).promise()
}

/**
 * Sends an SQS message
 * @param  {Object} payload  JSON message payload
 * @param  {string} queueUrl SQS queue URL
 * @return {Promise}
 */
function sendMessage(queueUrl, messageBody) {
  return sqs.sendMessage({
    MessageBody: JSON.stringify(messageBody),
    QueueUrl: queueUrl,
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
