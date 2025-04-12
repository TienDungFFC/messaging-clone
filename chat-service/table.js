const { DynamoDBClient, CreateTableCommand, ListTablesCommand } = require('@aws-sdk/client-dynamodb');

// Kết nối với DynamoDB local để phát triển
const client = new DynamoDBClient({
  region: 'us-east-1',
  endpoint: 'http://localhost:8000',
  credentials: {
    accessKeyId: 'dummy',
    secretAccessKey: 'dummy',
  },
});

// Định nghĩa cấu trúc bảng
const tables = [
  {
    TableName: 'Messages',
    KeySchema: [
      { AttributeName: 'conversationId', KeyType: 'HASH' },  // Partition key
      { AttributeName: 'messageId', KeyType: 'RANGE' }  // Sort key
    ],
    AttributeDefinitions: [
      { AttributeName: 'conversationId', AttributeType: 'S' },
      { AttributeName: 'messageId', AttributeType: 'S' },
      { AttributeName: 'senderId', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'SenderIndex',
        KeySchema: [
          { AttributeName: 'senderId', KeyType: 'HASH' }
        ],
        Projection: {
          ProjectionType: 'ALL'
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  },
  {
    TableName: 'Conversations',
    KeySchema: [
      { AttributeName: 'conversationId', KeyType: 'HASH' }  // Partition key
    ],
    AttributeDefinitions: [
      { AttributeName: 'conversationId', AttributeType: 'S' },
      { AttributeName: 'participants', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'ParticipantsIndex',
        KeySchema: [
          { AttributeName: 'participants', KeyType: 'HASH' }
        ],
        Projection: {
          ProjectionType: 'ALL'
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  },
  {
    TableName: 'Users',
    KeySchema: [
      { AttributeName: 'userId', KeyType: 'HASH' }  // Partition key
    ],
    AttributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'email', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'EmailIndex',
        KeySchema: [
          { AttributeName: 'email', KeyType: 'HASH' }
        ],
        Projection: {
          ProjectionType: 'ALL'
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  }
];

// Kiểm tra và tạo bảng nếu chưa tồn tại
const setupTables = async () => {
  try {
    const listTablesResponse = await client.send(new ListTablesCommand({}));
    const existingTables = listTablesResponse.TableNames || [];

    for (const table of tables) {
      if (!existingTables.includes(table.TableName)) {
        console.log(`Tạo bảng ${table.TableName}...`);
        await client.send(new CreateTableCommand(table));
        console.log(`Đã tạo bảng ${table.TableName}`);
      } else {
        console.log(`Bảng ${table.TableName} đã tồn tại`);
      }
    }
  } catch (error) {
    console.error('Lỗi khi thiết lập bảng DynamoDB:', error);
  }
};

setupTables();