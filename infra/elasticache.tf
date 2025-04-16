# ElastiCache Cluster for Redis
resource "aws_elasticache_replication_group" "messaging_cache" {
  replication_group_id       = "${local.name_prefix}-redis"
  description                = "Redis cluster for ${local.name_prefix} messaging application"
  automatic_failover_enabled = false
  engine                     = "redis"
  engine_version             = "7.0"
  multi_az_enabled           = false
  node_type                  = "cache.t3.micro"
  num_cache_clusters         = 1
  parameter_group_name       = aws_elasticache_parameter_group.messaging_cache.id
  subnet_group_name          = aws_elasticache_subnet_group.messaging_cache.name
  security_group_ids         = [aws_security_group.elasticache_sg.id]
  maintenance_window         = "sun:05:00-sun:06:00"
  snapshot_window            = "03:00-04:00"
  snapshot_retention_limit   = 1
  apply_immediately          = true
  auto_minor_version_upgrade = true
  at_rest_encryption_enabled = true
  transit_encryption_enabled = false

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.elasticache_slow_log.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
  }
  
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.elasticache_engine_log.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "engine-log"
  }

  tags = { "Name" = "${local.name_prefix}-redis" }
}

# Parameter Group
resource "aws_elasticache_parameter_group" "messaging_cache" {
  name   = "${local.name_prefix}-redis-params"
  family = "redis7"
  
  parameter {
    name  = "timeout"
    value = "300"
  }
  
  parameter {
    name  = "maxmemory-policy"
    value = "volatile-lru"
  }

  tags = { "Name" = "${local.name_prefix}-redis-params" }
}

# Subnet Group
resource "aws_elasticache_subnet_group" "messaging_cache" {
  name       = "${local.name_prefix}-redis-subnet"
  subnet_ids = [for subnet in aws_subnet.private_subnets : subnet.id]
  tags       = { "Name" = "${local.name_prefix}-redis-subnet" }
}

# Security Group
resource "aws_security_group" "elasticache_sg" {
  name        = "${local.name_prefix}-elasticache"
  description = "Security group for ElastiCache Redis"
  vpc_id      = aws_vpc.chat_vpc.id
  tags        = { "Name" = "${local.name_prefix}-elasticache" }
}

resource "aws_vpc_security_group_egress_rule" "elasticache_all" {
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
  security_group_id = aws_security_group.elasticache_sg.id
  tags              = { Name = "all-outbound" }
}

# Allow access from chat service
resource "aws_vpc_security_group_ingress_rule" "redis_chat_service" {
  security_group_id            = aws_security_group.elasticache_sg.id
  referenced_security_group_id = aws_security_group.chat_service_sg.id
  ip_protocol                  = "tcp"
  from_port                    = 6379
  to_port                      = 6379
  tags                         = { Name = "redis-chat-service" }
}

# CloudWatch Logs
resource "aws_cloudwatch_log_group" "elasticache_slow_log" {
  name              = "/${local.name_prefix}/elasticache/slow-log"
  retention_in_days = var.log_retention_days
  tags              = { "Name" = "${local.name_prefix}-elasticache-slow-log" }
}

resource "aws_cloudwatch_log_group" "elasticache_engine_log" {
  name              = "/${local.name_prefix}/elasticache/engine-log"
  retention_in_days = var.log_retention_days
  tags              = { "Name" = "${local.name_prefix}-elasticache-engine-log" }
}

# Variables
variable "redis_engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.0"
}

variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = map(string)
  default = {
    "dev"        = "cache.t3.micro"
    "staging"    = "cache.t3.small"
    "production" = "cache.t3.medium"
  }
}

variable "redis_cluster_size" {
  description = "Number of Redis nodes"
  type        = map(number)
  default = {
    "dev"        = 1
    "staging"    = 1
    "production" = 2
  }
}