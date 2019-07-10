import AWS from 'aws-sdk'
import config from 'config'

// SQS connection variables
const accessKeyId = config.get('sqs.accessKeyId')
const apiVersion = config.get('sqs.apiVersion')
const endpoint = new AWS.Endpoint(config.get('sqs.endpoint'))
const region = config.get('sqs.region')
const secretAccessKey = config.get('sqs.secretAccessKey')

// SQS createQueue variables
const delaySeconds = config.get('sqs.createQueue.delaySeconds')
const maximumMessageSize = config.get('sqs.createQueue.maximumMessageSize')
const messageRetentionPeriod = config.get('sqs.createQueue.messageRetentionPeriod')
const receiveMessageWaitTimeSeconds = config.get('sqs.createQueue.receiveMessageWaitTimeSeconds')
const queueVisibilityTimeout = config.get('sqs.createQueue.visibilityTimeout')

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
      DelaySeconds: delaySeconds,
      MaximumMessageSize: maximumMessageSize,
      MessageRetentionPeriod: messageRetentionPeriod,
      ReceiveMessageWaitTimeSeconds: receiveMessageWaitTimeSeconds,
      VisibilityTimeout: queueVisibilityTimeout
    }
  }).promise()
}

export default { changeMessageVisibility, createQueue }
