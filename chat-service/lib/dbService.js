import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
  BatchGetCommand
} from '@aws-sdk/lib-dynamodb';

// Make sure to properly configure for production:
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Create document client with marshalling options
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
});

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'ChatTable';

const dbService = {
  /**
   * Put an item in the DynamoDB table
   * @param {Object} item - The item to put
   * @returns {Promise<Object>} Result with success flag
   */
  async putItem(item) {
    try {
      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: item
      }));
      
      return { success: true, data: item };
    } catch (error) {
      console.error('DynamoDB put error:', error);
      return { success: false, error };
    }
  },
  
  /**
   * Get an item from the DynamoDB table
   * @param {Object} key - The key of the item to get
   * @returns {Promise<Object>} Result with success flag and data
   */
  async getItem(key) {
    try {
      const result = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: key
      }));
      
      return { success: true, data: result.Item };
    } catch (error) {
      console.error('DynamoDB get error:', error);
      return { success: false, error };
    }
  },
  
  /**
   * Query items from the DynamoDB table
   * @param {String} keyConditionExpression - Key condition expression
   * @param {Object} expressionAttributeValues - Expression attribute values
   * @param {String} filterExpression - Optional filter expression
   * @param {String} indexName - Optional index name
   * @returns {Promise<Object>} Result with success flag and data
   */
  async query(keyConditionExpression, expressionAttributeValues, filterExpression = null, indexName = null) {
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues
    };
    
    if (indexName) {
      params.IndexName = indexName;
    }
    
    if (filterExpression) {
      params.FilterExpression = filterExpression;
    }
    
    try {
      const result = await docClient.send(new QueryCommand(params));
      return { success: true, data: result.Items };
    } catch (error) {
      console.error('DynamoDB query error:', error);
      return { success: false, error };
    }
  },
  
  /**
   * Update an item in the DynamoDB table
   * @param {Object} key - The key of the item to update
   * @param {String} updateExpression - Update expression
   * @param {Object} expressionAttributeValues - Expression attribute values
   * @param {Object} expressionAttributeNames - Optional expression attribute names
   * @returns {Promise<Object>} Result with success flag and updated data
   */
  async updateItem(key, updateExpression, expressionAttributeValues, expressionAttributeNames = null) {
    const params = {
      TableName: TABLE_NAME,
      Key: key,
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };
    
    if (expressionAttributeNames) {
      params.ExpressionAttributeNames = expressionAttributeNames;
    }
    
    try {
      const result = await docClient.send(new UpdateCommand(params));
      return { success: true, data: result.Attributes };
    } catch (error) {
      console.error('DynamoDB update error:', error);
      return { success: false, error };
    }
  },
  
  /**
   * Delete an item from the DynamoDB table
   * @param {Object} key - The key of the item to delete
   * @returns {Promise<Object>} Result with success flag
   */
  async deleteItem(key) {
    try {
      await docClient.send(new DeleteCommand({
        TableName: TABLE_NAME,
        Key: key
      }));
      
      return { success: true };
    } catch (error) {
      console.error('DynamoDB delete error:', error);
      return { success: false, error };
    }
  },
  
  /**
   * Scan items from the DynamoDB table
   * @param {String} filterExpression - Optional filter expression
   * @param {Object} expressionAttributeValues - Optional expression attribute values
   * @returns {Promise<Object>} Result with success flag and data
   */
  async scan(filterExpression = null, expressionAttributeValues = null) {
    const params = {
      TableName: TABLE_NAME
    };
    
    if (filterExpression) {
      params.FilterExpression = filterExpression;
      params.ExpressionAttributeValues = expressionAttributeValues;
    }
    
    try {
      const result = await docClient.send(new ScanCommand(params));
      return { success: true, data: result.Items };
    } catch (error) {
      console.error('DynamoDB scan error:', error);
      return { success: false, error };
    }
  },

  /**
   * Batch get items from the DynamoDB table
   * @param {Array<Object>} keys - The keys of the items to get
   * @returns {Promise<Object>} Result with success flag and data
   */
  async batchGetItems(keys) {
    try {
      const params = {
        RequestItems: {
          [TABLE_NAME]: {
            Keys: keys
          }
        }
      };
      
      const result = await docClient.send(new BatchGetCommand(params));
      
      return { 
        success: true, 
        data: result.Responses[TABLE_NAME] || [] 
      };
    } catch (error) {
      console.error('DynamoDB batch get error:', error);
      return { success: false, error };
    }
  }
};

export { dbService, docClient, client, TABLE_NAME };
