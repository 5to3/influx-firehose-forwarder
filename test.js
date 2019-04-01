import test from 'ava';

const AWS = require('aws-sdk-mock');

test('send line to Firehose', async (t) => {
  const req = { rawBody: 'incubator_sensor1.lab2_unique.1h temp=30i 1554153451000000000' };
  const res = {
    status: (n) => {
      // Check if 201 response code is set
      t.is(n, 201);
      return { send: () => t.pass() };
    },
  };

  const expectedData = new Buffer.from(
    '{"timestamp":1554153451000000000,"measurement":"incubator_sensor1.lab2_unique.1h","fields":[{"temp":30}],"tags":[]}\n',
  );

  AWS.mock('Firehose', 'putRecord', async (params) => {
    // Check if the data in params is consistent
    t.deepEqual(params.Record.Data, expectedData);
  });

  return require('./app').processData(req, res, () => {});
});
