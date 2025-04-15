provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  description = "AWS region to deploy resources"
  default     = "ap-southeast-1"
  type        = string
}

variable "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  default     = "ChatTable"
  type        = string
}

resource "aws_dynamodb_table" "chat_table" {
  name         = var.dynamodb_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  attribute {
    name = "GSI1PK"
    type = "S"
  }

  attribute {
    name = "GSI1SK"
    type = "S"
  }

  attribute {
    name = "GSI2PK"
    type = "S"
  }

  attribute {
    name = "GSI2SK"
    type = "S"
  }

  attribute {
    name = "GSI3PK"
    type = "S"
  }

  attribute {
    name = "GSI3SK"
    type = "S"
  }

  attribute {
    name = "GSI4PK"
    type = "S"
  }

  attribute {
    name = "GSI4SK"
    type = "S"
  }

  # GSI1: User email lookup and user messages
  global_secondary_index {
    name               = "GSI1"
    hash_key           = "GSI1PK"
    range_key          = "GSI1SK"
    projection_type    = "ALL"
  }

  # GSI2: Username lookup
  global_secondary_index {
    name               = "GSI2"
    hash_key           = "GSI2PK"
    range_key          = "GSI2SK"
    projection_type    = "ALL"
  }

  # GSI3: Read receipts by user
  global_secondary_index {
    name               = "GSI3"
    hash_key           = "GSI3PK"
    range_key          = "GSI3SK"
    projection_type    = "ALL"
  }

  # GSI4: Conversations by last activity
  global_secondary_index {
    name               = "GSI4"
    hash_key           = "GSI4PK"
    range_key          = "GSI4SK"
    projection_type    = "ALL"
  }

  tags = {
    Name        = "ChatTable"
    Environment = "Production"
    Project     = "MessagingClone"
  }
}

output "dynamodb_table_name" {
  value = aws_dynamodb_table.chat_table.name
}

output "dynamodb_table_arn" {
  value = aws_dynamodb_table.chat_table.arn
}
