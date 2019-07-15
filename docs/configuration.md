# Joshbot Configuration System

# Config Directory and Files

Inside `./config` there are two configuration files. `default.json` is used for running the Joshbot application locally and `test.json` is used for running automated tests.

These configuration files allow you to tweak the parameters for Joshbot application operation and its dependencies.

`default.json` file contents:

```javascript
{
  "alphaVantage": {
    "apiKey": "xxxxxxxxxxxxxxxx",
    "queryUri": "https://www.alphavantage.co/query",
    "timeout": 2200
  },
  "app": {
    "port": 4390,
    "processRetryQueueInterval": 20000,
    "sqsMessageVisibilityTimeout": 60,
    "sqsQueueUrl": "http://localhost:9324/queue/joshbot"
  },
  "jwt": {
    "secretKey": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  "slack": {
    "signingSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  "sqs": {
    "accessKeyId": "key",
    "apiVersion": "2012-11-05",
    "endpoint": "http://localhost:9324",
    "region": "us-west-1",
    "secretAccessKey": "secret",
    "createQueue": {
      "delaySeconds": "0",
      "maximumMessageSize": "262144",
      "messageRetentionPeriod": "345600",
      "receiveMessageWaitTimeSeconds": "0",
      "visibilityTimeout": "30"
    },
    "receiveMessage": {
      "waitTimeSeconds": 1,
      "visibilityTimeout": 5,
      "maxNumberOfMessages": 10
    },
    "sendMessage": {
      "delaySeconds": 1
    }
  }
}
```
_Note: `alphaVantage.apiKey`, `jwt.secretKey`, and `slack.signingSecret` will need to be populated with real values in order for proper operation of Joshbot._

`test.json` file contents:

```javascript
{
  "alphaVantage": {
    "apiKey": "testtesttesttest",
    "baseUri": "https://www.alphavantage.co",
    "queryUri": "https://www.alphavantage.co/query",
    "timeout": 2200
  },
  "app": {
    "port": 4390
  },
  "jwt": {
    "secretKey": "testtesttesttesttesttesttesttesttesttesttesttesttesttesttesttest"
  },
  "slack": {
    "signingSecret": "testtesttesttesttesttesttesttest"
  },
  "sqs": {
    "accessKeyId": "key",
    "apiVersion": "2012-11-05",
    "endpoint": "http://localhost:9324",
    "region": "us-west-1",
    "secretAccessKey": "secret",
    "createQueue": {
      "delaySeconds": "0",
      "maximumMessageSize": "262144",
      "messageRetentionPeriod": "345600",
      "receiveMessageWaitTimeSeconds": "0",
      "visibilityTimeout": "30"
    },
    "receiveMessage": {
      "waitTimeSeconds": 1,
      "visibilityTimeout": 5,
      "maxNumberOfMessages": 10
    },
    "sendMessage": {
      "delaySeconds": 1
    }
  }
}

```
_Note: `alphaVantage.apiKey`, `jwt.secretKey`, and `slack.signingSecret` do not need to be populated with real values in order for proper operation of Joshbot automated tests. What is currently in the `test.json` file will suffice._
