# Joshbot Automated Testing Overview

Joshbot has automated tests that use [Mocha](https://mochajs.org/) as the test framework and [Chai](https://www.chaijs.com/) for the assertion library. Unit test files have the filename extension `.test.js`.

Linting is powered by [ESLint](https://www.npmjs.com/package/eslint) and leverages the [Airbnb linting rules](https://www.npmjs.com/package/eslint-config-airbnb-base).

## How to Run the Automated Tests

To run the full unit test suite, execute the following:

```shell
# Run all unit tests
$ npm test
```

To run the full unit test suite with code coverage, execute the following:

```shell
# Run all unit tests and generate coverage report
$ npm run coverage
```

To run the linter on all code, execute the following:

```shell
# Run linter on all code
$ npm run lint
```
