# Joshbot New Developer Setup

Here you will find all the new developer setup instructions to get Joshbot up and running locally.

## Joshbot Prerequisites

**Node.js**

Grab the most current version of Node.js and npm ([download here](https://nodejs.org/)). Follow the installation instructions to get them installed locally.

You will need Node.js `v12.x.x` and npm `v5.x.x`. Joshbot makes use of newer ES6 functionality and utilizes the experimental features flag when executing. At the time of this writing, the most current versions of Node.js and npm are `v12.x.x` and `v6.x.x`, respectively.

**Docker**

Create a [Docker Hub](https://hub.docker.com/signup) account. Once you have a Docker Hub account, log in to your account and download Docker Desktop. Make sure to install the Docker CLI, too.

**Alpha Vantage API**

Get a [free API key](https://www.alphavantage.co/support/#api-key) from [Alpha Vantage](https://www.alphavantage.co/). This is used to grab market data for the Joshbot service. Make sure you use a legitimate email address!

**ngrok**

Grab the most current version of ngrok ([download here](https://ngrok.com/)). Slack has an [excellent guide](https://api.slack.com/tutorials/tunneling-with-ngrok) for installing and troubleshooting ngrok.

**AWS Command Line Interface (AWS CLI)**

Grab the most current version of the AWS CLI. Follow the AWS [installation and configuration instructions](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html).

**Slack App**

1) Identify an existing Slack workspace that you'll want to connect your Slack App to. If you don't have a Slack workspace to use, you can create one [here](https://slack.com/get-started).

2) Create a [Slack App](https://api.slack.com/apps) and connect it to your desired Slack workspace.

3) Configure your Slack App slash command (i.e. `/marketquote`) and add a temporary `Request URL`. If you've already started up ngrok, use your `Forwarding` URL with the `/market-quote` route included (for example `https://8fc0e0dd.ngrok.io/market-quote`).

TODO: Place instructional image here.

4) Grab the `Signing Secret` from the `Basic Information` section under `Settings` within your newly created [Slack App](https://api.slack.com/apps).

TODO: Place instructional image here.

## Joshbot Installation

1) Grab the Joshbot repo and install node modules:

```shell
# Clone the Joshbot repo and install dependencies
$ git clone git@github.com:joshuarwynn/joshbot.git
$ cd joshbot && npm install
```

2) Generate a signed [JSON Web Token (JWT)](https://jwt.io/) with its secret key:

```shell
# Generate a secret key and signed JWT via the npm script
$ npm run generate-jwt
```
```shell
# Alternatively generate a secret key and signed JWT
# via the executable ./bin/generate-jwt.js file
$ ./bin/generate-jwt.js
```

3) Modify the following `./config/default.json` sections to place your [Alpha Vantage](https://www.alphavantage.co/) API key, [JWT](https://jwt.io/) secret key, and Slack signing secret:

```javascript
"alphaVantage": {
  "apiKey": "xxxxxxxxxxxxxxxx",
  "queryUri": "https://www.alphavantage.co/query",
  "timeout": 2200
}
```
```javascript
"jwt": {
  "secretKey": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
},
```
```javascript
"slack": {
  "signingSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
},
```

4) Grab the [Alpine SQS](https://hub.docker.com/r/roribio16/alpine-sqs/) Dockerized ElasticMQ server with web UI, initialize it, and create the `joshbot` queue:

```shell
# Grabs the Alpine SQS image from Docker Hub
$ docker pull roribio16/alpine-sqs
```
```shell
# Initializes the Alpine SQS service
$ docker run --name alpine-sqs -p 9324:9324 -p 9325:9325 -d roribio16/alpine-sqs:latest
```
```shell
# Creates a queue called joshbot using the AWS CLI
$ aws --endpoint-url http://localhost:9324 sqs create-queue --queue-name joshbot
```

## Joshbot Initialization

1) If you have stopped the [Alpine SQS](https://hub.docker.com/r/roribio16/alpine-sqs/) service, restart it and make sure it is running:

```shell
# Starts the Alpine SQS service
$ docker start alpine-sqs
```
```shell
# Lists out the currently running Docker containers
$ docker ps
```

2) Initialize [ngrok](https://ngrok.com/) to open the secure tunnel to your localhost:

```shell
# Creates a secure tunnel to your localhost
$ ngrok http 4390
```

3) Grab the `Forwarding` URL from the `ngrok http 4390` output and place it into your [Slack App](https://api.slack.com/apps) `Slash Commands` configuration:

```console
ngrok by @inconshreveable

Session Status                online
Session Expires               7 hours, 57 minutes
Version                       2.3.30
Region                        United States (us)
Web Interface                 http://127.0.0.1:4040
Forwarding                    http://e91d6a20.ngrok.io -> http://localhost:4390
Forwarding                    https://e91d6a20.ngrok.io -> http://localhost:4390

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```
_Note: you will need to make this change to your [Slack App](https://api.slack.com/apps) `Slash Commands` configuration each time you restart [ngrok](https://ngrok.com/). The forwarding URL will change each time you restart or it will expire after 8 hours._

TODO: Place instructional image here.

4) Initialize the Joshbot [Node.js](https://nodejs.org/) service:

```shell
# Initializes the Joshbot service
$ npm start
```

5) Execute your Slack slash command inside your Slack account to get a market quote:

TODO: Place instructional image here.

Cheers :beers: if your favorite security is on the rise! Hang in there if it isn't :relaxed:.
