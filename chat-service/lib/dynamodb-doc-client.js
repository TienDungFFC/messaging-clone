import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { ddbClient } from './dynamodb-client.js';

const marshallOptions = {
  convertEmptyValues: false,
  removeUndefinedValues: false,
  convertClassInstanceToMap: false
};

const unmarshallOptions = {
  wrapNumbers: false
};

const translateConfig = { marshallOptions, unmarshallOptions };

const DynamoDB = DynamoDBDocumentClient.from(ddbClient, translateConfig);

export { DynamoDB };
