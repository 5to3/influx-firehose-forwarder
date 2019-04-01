#!/usr/bin/env node

const express = require('express');
const lineToJSON = require('influx-line-protocol-parser');
const AWS = require('aws-sdk');

AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });

const app = express();
const port = process.env.FH_PORT || 3000;
const host = process.env.FH_HOST || 'localhost';
const firehose = new AWS.Firehose();

/**
 * bodyParser - Adds aa `rawBody` attribute to the request object that contains
 * the incoming body payload.
 *
 * @param {Object} req  The express request object
 * @param {Object} res  The express response object
 * @param {Function} next Call to the next handler
 */
const bodyParser = (req, res, next) => {
  req.rawBody = '';
  req.setEncoding('utf8');
  req.on('data', chunk => (req.rawBody += chunk));
  req.on('end', () => next());
};

/**
 * errorHandler - Sets the response status to 500 and logs the error to the console.
 *
 * @param {Object} err  The error that occured
 * @param {Object} req  The express request object
 * @param {Object} res  The express response object
 * @param {Function} next Call to the next handler
 */
const errorHandler = (err, req, res, next) => {
  console.error(err);
  res.status(500).send();
};

/**
 * asyncHandler - Simple wrapper to correctly handle async functions in express.
 *
 * @param {Function} fn The async function to be wrapped
 */
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

/**
 * processData - Transforms the incoming data line into a Firehose compatible payload
 * and sends it off to AWS. There is no retry logic here as InfluxDB will try to resend
 * the line in case a subscriber returns a non 2xx response code.
 *
 * @param {Object} req  The express request object
 * @param {Object} res  The express response object
 * @param {Function} next Call to the next handler
 */
const processData = async (req, res, next) => {
  const line = new Buffer.from(`${JSON.stringify(lineToJSON(req.rawBody))}\n`);
  const streamResponse = await firehose
    .putRecord({
      DeliveryStreamName: process.env.FH_DELIVERY_STREAM,
      Record: { Data: line },
    })
    .promise();

  res.status(201).send();
};

app.use(bodyParser);
app.post('/write', asyncHandler(processData));
app.use(errorHandler);

app.listen(port, host, () => {
  console.log(`Influx-Firehose-forwarder is listening on ${host}:${port}`);
});

module.exports = {
  processData,
};
