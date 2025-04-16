# ECS Cluster
resource "aws_ecs_cluster" "chat_cluster" {
  name = "${local.name_prefix}-chat-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  
  tags = {
    Name = "${local.name_prefix}-chat-cluster"
  }
}

# Security Group
resource "aws_security_group" "chat_service_sg" {
  name        = "${local.name_prefix}-chat-service-sg"
  description = "Security group for chat service"
  vpc_id      = aws_vpc.chat_vpc.id
  tags        = { 
    Name = "${local.name_prefix}-chat-service-sg"
    Environment = var.environment
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_vpc_security_group_egress_rule" "chat_service_all" {
  ip_protocol       = "-1"  # All protocols
  cidr_ipv4         = "0.0.0.0/0"  # All destinations
  security_group_id = aws_security_group.chat_service_sg.id
  tags              = { Name = "all-outbound" }
}

resource "aws_vpc_security_group_ingress_rule" "chat_service_http" {
  description                  = "Allow HTTP from ALB"
  security_group_id            = aws_security_group.chat_service_sg.id
  referenced_security_group_id = aws_security_group.alb_sg.id
  ip_protocol                  = "tcp"
  from_port                    = 3000
  to_port                      = 3000
  tags                         = { Name = "chat-service-http" }
}

# IAM - ECS Task Execution Role
resource "aws_iam_role" "chat_service_exec" {
  name               = "${local.name_prefix}-chat-service-exec-role"
  assume_role_policy = data.aws_iam_policy_document.chat_service_exec_assume.json
  tags               = { 
    Name = "${local.name_prefix}-chat-service-exec-role"
    Environment = var.environment
  }
}

data "aws_iam_policy_document" "chat_service_exec_assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "chat_service_exec" {
  statement {
    sid = "GetSecrets"
    actions = [
      "ssm:GetParameters",
      "secretsmanager:GetSecretValue",
      "kms:Decrypt"
    ]
    resources = [
      "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/common/*",
      "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/${local.name_prefix}/*",
      "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:/common/*",
      "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:/${local.name_prefix}/*",
      "arn:aws:kms:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:key/*"
    ]
  }
}

resource "aws_iam_role_policy" "chat_service_exec" {
  role   = aws_iam_role.chat_service_exec.name
  policy = data.aws_iam_policy_document.chat_service_exec.json
}

resource "aws_iam_role_policy_attachment" "chat_service_exec" {
  role       = aws_iam_role.chat_service_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}


# IAM - ECS Task Role
resource "aws_iam_role" "chat_service" {
  name               = "${local.name_prefix}-chat-service-task-role"
  assume_role_policy = data.aws_iam_policy_document.chat_service_assume.json
  tags               = { 
    Name = "${local.name_prefix}-chat-service-task-role"
    Environment = var.environment
  }
}

data "aws_iam_policy_document" "chat_service_assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type = "Service"
      identifiers = [
        "ecs-tasks.amazonaws.com",
        "events.amazonaws.com",
      ]
    }
  }
}

data "aws_iam_policy_document" "chat_service" {
  statement {
    sid    = "AllowSSM"
    effect = "Allow"
    actions = [
      "ssmmessages:CreateControlChannel",
      "ssmmessages:CreateDataChannel",
      "ssmmessages:OpenControlChannel",
      "ssmmessages:OpenDataChannel"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "AllowS3Access"
    effect = "Allow"
    actions = [
      "s3:ListBucket",
      "s3:GetObject",
      "s3:PutObject"
    ]
    resources = [
      "arn:aws:s3:::${local.name_prefix}-storage",
      "arn:aws:s3:::${local.name_prefix}-storage/*"
    ]
  }
  
  statement {
    sid    = "AllowDynamoDBAccess"
    effect = "Allow"
    actions = [
      "dynamodb:BatchGetItem",
      "dynamodb:GetItem",
      "dynamodb:Query",
      "dynamodb:Scan",
      "dynamodb:BatchWriteItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem"
    ]
    resources = [
      "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/${local.name_prefix}-*"
    ]
  }
}

resource "aws_iam_role_policy" "chat_service" {
  role   = aws_iam_role.chat_service.name
  policy = data.aws_iam_policy_document.chat_service.json
}

resource "aws_iam_role_policy_attachment" "chat_service_cloudwatch" {
  role       = aws_iam_role.chat_service.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchFullAccess"
}

# resource "aws_iam_role_policy" "dynamodb_policy" {
#   name = "${local.name_prefix}-dynamodb-policy"
#   role = aws_iam_role.chat_service.id

#   policy = jsonencode({
#     Version = "2012-10-17",
#     Statement = [
#       {
#         Action = [
#           "dynamodb:GetItem",
#           "dynamodb:PutItem",
#           "dynamodb:UpdateItem",
#           "dynamodb:DeleteItem",
#           "dynamodb:Query",
#           "dynamodb:Scan",
#           "dynamodb:BatchGetItem",
#           "dynamodb:BatchWriteItem"
#         ],
#         Effect   = "Allow",
#         Resource = [
#           "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/messaging-${var.environment}-table",
#           "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/messaging-${var.environment}-table/index/*"
#         ]
#       }
#     ]
#   })
# }

resource "aws_iam_role_policy_attachment" "dynamodb_full_access" {
  role       = aws_iam_role.chat_service.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
}

resource "aws_iam_role_policy_attachment" "elasticache_full_access" {
  role       = aws_iam_role.chat_service.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonElastiCacheFullAccess"
}

# Log
resource "aws_cloudwatch_log_group" "chat_service" {
  name              = "/ecs/${local.name_prefix}-chat-service"
  retention_in_days = var.log_retention_days
  tags              = { 
    Name = "${local.name_prefix}-chat-service-logs"
    Environment = var.environment
  }
}

# Task Definition
resource "aws_ecs_task_definition" "chat_task" {
  family                   = "${local.name_prefix}-chat-service"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.chat_service_cpu
  memory                   = var.chat_service_memory
  execution_role_arn       = aws_iam_role.chat_service_exec.arn
  task_role_arn            = aws_iam_role.chat_service.arn

  container_definitions = jsonencode([
    {
      name      = "${local.name_prefix}-chat-service"
      image     = "430118811750.dkr.ecr.ap-southeast-1.amazonaws.com/messaging/chat-service:latest"
      essential = true

      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV",
          value = var.environment
        },
        {
          name  = "REDIS_URL",
          value = "redis://${aws_elasticache_replication_group.messaging_cache.primary_endpoint_address}:6379"
        },
        {
          name  = "REDIS_PORT",
          value = "6379"
        },
        {
          name  = "DYNAMODB_TABLE",
          value = "ChatTable"
        },
        {
          name  = "AWS_REGION",
          value = data.aws_region.current.name
        },
        {
          name  = "PORT",
          value = "3000"
        },
        {
          name  = "JWT_SECRET",
          value = "a_very_secure_and_long_jwt_secret_key_for_development"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.chat_service.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "ecs"
        }
      }
      
    }
  ])

  tags = {
    Name        = "${local.name_prefix}-chat-task"
    Environment = var.environment
  }
}

# ECS Service
resource "aws_ecs_service" "chat_service" {
  name                               = "${local.name_prefix}-chat-service"
  cluster                            = aws_ecs_cluster.chat_cluster.id
  task_definition                    = aws_ecs_task_definition.chat_task.arn
  desired_count                      = var.chat_service_desired_count
  launch_type                        = "FARGATE"
  scheduling_strategy                = "REPLICA"
  platform_version                   = "LATEST"
  health_check_grace_period_seconds  = 120
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200
  force_new_deployment = true

  network_configuration {
    subnets          = [local.private_subnet_for_tasks]
    security_groups  = [aws_security_group.chat_service_sg.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.chat_service.arn
    container_name   = "${local.name_prefix}-chat-service"
    container_port   = 3000
  }

  deployment_controller {
    type = "ECS"
  }

  lifecycle {
    ignore_changes = [desired_count]
  }

  depends_on = [aws_lb_listener.https, aws_lb_listener.http_redirect]
  
  tags = {
    Name        = "${local.name_prefix}-chat-service"
    Environment = var.environment
  }
}

# Target Group for Chat Service
resource "aws_lb_target_group" "chat_service" {
  name                 = "${local.name_prefix}-chat-tg"
  port                 = 3000
  protocol             = "HTTP"
  vpc_id               = aws_vpc.chat_vpc.id
  target_type          = "ip"
  deregistration_delay = 30

  health_check {
    enabled             = true
    interval            = 30
    path                = "/health"
    port                = "traffic-port"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    protocol            = "HTTP"
    matcher             = "200"
  }
  
  lifecycle {
    create_before_destroy = true
  }
  
  tags = {
    Name        = "${local.name_prefix}-chat-tg"
    Environment = var.environment
  }

  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
    enabled         = true
  }
}

# Auto-scaling configuration for the chat service
resource "aws_appautoscaling_target" "chat_service_target" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.chat_cluster.name}/${aws_ecs_service.chat_service.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# CPU-based auto-scaling policy
resource "aws_appautoscaling_policy" "chat_service_cpu" {
  name               = "${local.name_prefix}-chat-service-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.chat_service_target.resource_id
  scalable_dimension = aws_appautoscaling_target.chat_service_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.chat_service_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }

    target_value       = 30
    scale_in_cooldown  = 60
    scale_out_cooldown = 60
  }
}

# Memory-based auto-scaling policy
resource "aws_appautoscaling_policy" "chat_service_memory" {
  name               = "${local.name_prefix}-chat-service-memory-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.chat_service_target.resource_id
  scalable_dimension = aws_appautoscaling_target.chat_service_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.chat_service_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }

    target_value       = 30
    scale_in_cooldown  = 60
    scale_out_cooldown = 60
  }
}

locals {
  nat_gateway_az = values(aws_subnet.public_subnets)[0].availability_zone
  private_subnet_for_tasks = [
    for subnet_key, subnet in aws_subnet.private_subnets :
    subnet.id if subnet.availability_zone == local.nat_gateway_az
  ][0]
}
