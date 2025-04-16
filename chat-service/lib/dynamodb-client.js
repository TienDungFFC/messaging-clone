import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import config from './config.js';

const isLocalDevelopment = process.env.NODE_ENV === 'development' || process.env.IS_LOCAL === 'true';

const clientConfig = {
  region: config.REGION || 'ap-southeast-1'
};

if (isLocalDevelopment) {
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  };
}

const ddbClient = new DynamoDBClient(clientConfig);

export { ddbClient };