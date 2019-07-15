# Joshbot API Documentation

## Routes

### POST `/market-quote`

A Slackbot slash command request endpoint used for getting market data for a particular security or currency like `BTCUSD`.

`POST http://localhost:4390/market-quote`

`Content-Type` must be `application/x-www-form-urlencoded`

Headers:

| Header                      | Description                 |
| --------------------------- | --------------------------- |
| `X-Slack-Request-Timestamp` | Timestamp from Slack server |
| `X-Slack-Signature`         | Slack signed signature      |

Parameters:

| Field          | Type   | Description                                                        |
| -------------- | ------ | ------------------------------------------------------------------ |
| `token`        | String | Slack verification token that is deprecated and should not be used |
| `team_id`      | String | Slack team ID                                                      |
| `team_domain`  | String | Slack workspace name                                               |
| `channel_id`   | String | Slack channel ID                                                   |
| `channel_name` | String | Slack channel name                                                 |
| `user_id`      | String | Slack user ID                                                      |
| `user_name`    | String | Slack plain text username                                          |
| `command`      | String | Slack slash command                                                |
| `text`         | String | Slack slash command text the occurs after the command string       |
| `response_url` | String | Slack response URL for delayed responses                           |
| `trigger_id`   | String | Slack trigger ID for dialogs                                       |

Success Response (Example):

```
HTTP/1.1 200 OK
{
  "response_type": "ephemeral",
  "text": "Here is your market quote for AYX",
  "attachments": [
    {
      "text": "$105.5200 USD as of 2019-06-26"
    }
  ]
}
```

### POST `/admin/sqs/change-message-visibility`

An administrative endpoint that provides SQS change message visibility control specific to Joshbot without having to use the AWS CLI.

`POST http://localhost:4390/admin/sqs/change-message-visibility`

`Content-Type` can be `application/x-www-form-urlencoded` or `application/json`

Headers:

| Header          | Description              |
| --------------- | ------------------------ |
| `Authorization` | `Bearer` schema with JWT |

Parameters:

| Field               | Type   | Description                    |
| ------------------- | ------ | ------------------------------ |
| `receiptHandle`     | String | SQS message receipt handle     |
| `queueUrl`          | String | SQS queue URL                  |
| `visibilityTimeout` | Number | SQS message visibility timeout |

Success Response (Example):

```
HTTP/1.1 200 OK
{
  "success": true,
  "awsResponse": {
    "ResponseMetadata": {
      "RequestId": "00000000-0000-0000-0000-000000000000"
    }
  }
}
```

Failing Responses (Example):

```
HTTP/1.1 401 Unauthorized
```

```
HTTP/1.1 400 Bad Request
{
  "errors": [
    "\"visibilityTimeout\" is required",
    "\"visibilityTimeouttt\" is not allowed"
  ]
}
```

```
HTTP/1.1 200 OK
{
  "success": false,
  "awsResponse": {
    "message": "AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.",
    "code": "AWS.SimpleQueueService.NonExistentQueue",
    "time": "2019-07-14T23:35:50.360Z",
    "statusCode": 400,
    "retryable": false,
    "retryDelay": 8.524071816023081
  }
}
```

### POST `/admin/sqs/create-queue`

An administrative endpoint that provides SQS create queue control specific to Joshbot without having to use the AWS CLI.

`POST http://localhost:4390/admin/sqs/create-queue`

`Content-Type` can be `application/x-www-form-urlencoded` or `application/json`

Headers:

| Header          | Description              |
| --------------- | ------------------------ |
| `Authorization` | `Bearer` schema with JWT |

Parameters:

| Field                | Type   | Description    |
| -------------------- | ------ | -------------- |
| `queueName`          | String | SQS queue name |

Success Response (Example):

```
HTTP/1.1 200 OK
{
  "success": true,
  "awsResponse": {
    "ResponseMetadata": {
      "RequestId": "00000000-0000-0000-0000-000000000000"
    },
    "QueueUrl": "http://localhost:9324/queue/joshbot"
  }
}
```

Failing Responses (Example):

```
HTTP/1.1 401 Unauthorized
```

```
HTTP/1.1 400 Bad Request
{
  "errors": [
    "\"queueName\" with value \"joshbot#\" fails to match the alphanumeric characters, hypens (-), and underscores (_) pattern"
  ]
}
```

```
HTTP/1.1 200 OK
{
  "success": false,
  "awsResponse": {
    "message": "connect ECONNREFUSED 127.0.0.1:9324",
    "errno": "ECONNREFUSED",
    "code": "NetworkingError",
    "syscall": "connect",
    "address": "127.0.0.1",
    "port": 9324,
    "region": "us-west-1",
    "hostname": "localhost",
    "retryable": true,
    "time": "2019-07-14T23:42:47.205Z"
  }
}
```

### POST `/admin/sqs/delete-queue`

An administrative endpoint that provides SQS delete queue control specific to Joshbot without having to use the AWS CLI.

`POST http://localhost:4390/admin/sqs/delete-queue`

`Content-Type` can be `application/x-www-form-urlencoded` or `application/json`

Headers:

| Header          | Description              |
| --------------- | ------------------------ |
| `Authorization` | `Bearer` schema with JWT |

Parameters:

| Field      | Type   | Description   |
| ---------- | ------ | ------------- |
| `queueUrl` | String | SQS queue URL |

Success Response (Example):

```
HTTP/1.1 200 OK
{
  "success": true,
  "awsResponse": {
    "ResponseMetadata": {
      "RequestId": "00000000-0000-0000-0000-000000000000"
    }
  }
}
```

Failing Responses (Example):

```
HTTP/1.1 401 Unauthorized
```

```
HTTP/1.1 400 Bad Request
{
  "errors": [
    "\"queueUrl\" is required",
    "\"queueUrle\" is not allowed"
  ]
}
```

```
HTTP/1.1 200 OK
{
  "success": false,
  "awsResponse": {
    "message": "AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.",
    "code": "AWS.SimpleQueueService.NonExistentQueue",
    "time": "2019-07-13T23:37:14.137Z",
    "statusCode": 400,
    "retryable": false,
    "retryDelay": 63.29521176887483
  }
}
```

### POST `/admin/sqs/delete-message`

An administrative endpoint that provides SQS delete message control specific to Joshbot without having to use the AWS CLI.

`POST http://localhost:4390/admin/sqs/delete-message`

`Content-Type` can be `application/x-www-form-urlencoded` or `application/json`

Parameters:

| Field           | Type   | Description                |
| --------------- | ------ | -------------------------- |
| `receiptHandle` | String | SQS message receipt handle |
| `queueUrl`      | String | SQS queue URL              |

Headers:

| Header          | Description              |
| --------------- | ------------------------ |
| `Authorization` | `Bearer` schema with JWT |

Success Response (Example):

```
HTTP/1.1 200 OK
{
  "success": true,
  "awsResponse": {
    "ResponseMetadata": {
      "RequestId": "00000000-0000-0000-0000-000000000000"
    }
  }
}
```

Failing Responses (Example):

```
HTTP/1.1 401 Unauthorized
```

```
HTTP/1.1 400 Bad Request
{
  "errors": [
    "\"receiptHandle\" is required",
    "\"receiptHandlee\" is not allowed"
  ]
}
```

```
HTTP/1.1 200 OK
{
  "success": false,
  "awsResponse": {
    "message": "AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.",
    "code": "AWS.SimpleQueueService.NonExistentQueue",
    "time": "2019-07-14T23:32:14.820Z",
    "statusCode": 400,
    "retryable": false,
    "retryDelay": 2.094220394947355
  }
}
```

### POST `/admin/sqs/receive-message`

An administrative endpoint that provides SQS receive message control specific to Joshbot without having to use the AWS CLI.

`POST http://localhost:4390/admin/sqs/receive-message`

`Content-Type` can be `application/x-www-form-urlencoded` or `application/json`

Headers:

| Header          | Description              |
| --------------- | ------------------------ |
| `Authorization` | `Bearer` schema with JWT |

Parameters:

| Field      | Type   | Description   |
| ---------- | ------ | ------------- |
| `queueUrl` | String | SQS queue URL |

Success Responses (Example):

```
HTTP/1.1 200 OK
{
  "success": true,
  "awsResponse": {
    "ResponseMetadata": {
      "RequestId": "00000000-0000-0000-0000-000000000000"
    }
  }
}
```

```
HTTP/1.1 200 OK
{
  "success": true,
  "awsResponse": {
    "ResponseMetadata": {
      "RequestId": "00000000-0000-0000-0000-000000000000"
    },
    "Messages": [
      {
        "MessageId": "446e5b44-0c97-4ea2-84ba-b8fb03e6ac8b",
        "ReceiptHandle": "446e5b44-0c97-4ea2-84ba-b8fb03e6ac8b#7de4fbcb-05b0-4a42-9eae-cdac65b99126",
        "MD5OfBody": "722c6e6716e4e266ac92d10c5aea8f5a",
        "Body": "{\"test1\":\"value1\",\"test2\":\"value2\"}",
        "Attributes": {
          "SentTimestamp": "1563146682231",
          "ApproximateReceiveCount": "1",
          "ApproximateFirstReceiveTimestamp": "1563146696090",
          "SenderId": "127.0.0.1",
          "MessageDeduplicationId": "",
          "MessageGroupId": ""
        }
      }
    ]
  }
}
```

Failing Responses (Example):

```
HTTP/1.1 401 Unauthorized
```

```
HTTP/1.1 400 Bad Request
{
  "errors": [
    "\"queueUrl\" is required",
    "\"queueUrle\" is not allowed"
  ]
}
```

```
HTTP/1.1 200 OK
{
  "success": false,
  "awsResponse": {
    "message": "AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.",
    "code": "AWS.SimpleQueueService.NonExistentQueue",
    "time": "2019-07-14T23:26:58.929Z",
    "statusCode": 400,
    "retryable": false,
    "retryDelay": 10.048092359873696
  }
}
```

### POST `/admin/sqs/send-message`

An administrative endpoint that provides SQS send message control specific to Joshbot without having to use the AWS CLI.

`POST http://localhost:4390/admin/sqs/send-message`

`Content-Type` can be `application/x-www-form-urlencoded` or `application/json`

Headers:

| Header          | Description              |
| --------------- | ------------------------ |
| `Authorization` | `Bearer` schema with JWT |

Parameters:

| Field         | Type   | Description         |
| ------------- | ------ | ------------------- |
| `queueUrl`    | String | SQS queue URL       |
| `messageBody` | Object | SQS message payload |

Success Response (Example):

```
HTTP/1.1 200 OK
{
  "success": true,
  "awsResponse": {
    "ResponseMetadata": {
      "RequestId": "00000000-0000-0000-0000-000000000000"
    },
    "MD5OfMessageBody": "722c6e6716e4e266ac92d10c5aea8f5a",
    "MD5OfMessageAttributes": "d41d8cd98f00b204e9800998ecf8427e",
    "MessageId": "b18f173e-f6db-4eeb-a9ad-7ae0afedb43d"
  }
}
```

Failing Responses (Example):

```
HTTP/1.1 401 Unauthorized
```

```
HTTP/1.1 400 Bad Request
{
  "errors": [
    "\"messageBody\" is required",
    "\"messageBodyy\" is not allowed"
  ]
}
```

```
HTTP/1.1 200 OK
{
  "success": false,
  "awsResponse": {
    "message": "AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.",
    "code": "AWS.SimpleQueueService.NonExistentQueue",
    "time": "2019-07-14T23:23:27.097Z",
    "statusCode": 400,
    "retryable": false,
    "retryDelay": 87.98913796612315
  }
}
```

### GET `/health`

A basic health check endpoint. Useful for system monitoring tools like [New Relic](https://newrelic.com/).

`GET http://localhost:4390/health`

Success Response:

```
HTTP/1.1 200 OK
{
  "status": "healthy"
}
```
