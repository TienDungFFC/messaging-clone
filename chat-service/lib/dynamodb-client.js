import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import config from './config.js';

let dynamoDbEndpoint = config.DYNAMODB_ENDPOINT || 'http://localhost:8000';

const ddbClient = new DynamoDBClient({
  region: config.REGION,
  endpoint: dynamoDbEndpoint,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

export { ddbClient };
