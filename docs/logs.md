# Joshbot Log Overview

Joshbot is configured to use [Winston](https://www.npmjs.com/package/winston) for general system-level logging and [Morgan](https://www.npmjs.com/package/morgan) for HTTP request logging.

## Log File Location

When the Joshbot app is running, you'll find the following log files:

- `./logs/access.log`
- `./logs/combined.log`

When the Joshbot app is executing automated tests, you'll find the following log files (for debugging purposes only):

- `./logs/access.test.log`
- `./logs/combined.test.log`
