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
  name        = "${local.name_prefix}-chat-service"
  description = "Security group for Chat Service ECS tasks"
  vpc_id      = aws_vpc.main.id
  tags        = { Name = "${local.name_prefix}-chat-service" }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_vpc_security_group_egress_rule" "chat_service_all" {
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
  security_group_id = aws_security_group.chat_service_sg.id
  tags              = { Name = "all-outbound" }
}

resource "aws_vpc_security_group_ingress_rule" "chat_service_http" {
  description                  = "Allow HTTP from ALB"
  security_group_id            = aws_security_group.chat_service_sg.id
  referenced_security_group_id = aws_security_group.alb_sg.id
  ip_protocol                  = "tcp"
  from_port                    = 80
  to_port                      = 80
  tags                         = { Name = "chat-service-http" }
}

# IAM - ECS Task Execution Role
resource "aws_iam_role" "chat_service_exec" {
  name               = "${local.name_prefix}-chat-service-exec"
  assume_role_policy = data.aws_iam_policy_document.chat_service_exec_assume.json
  tags               = { "Name" = "${local.name_prefix}-chat-service-exec" }
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
  name               = "${local.name_prefix}-chat-service"
  assume_role_policy = data.aws_iam_policy_document.chat_service_assume.json
  tags               = { "Name" = "${local.name_prefix}-chat-service" }
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

# Log
resource "aws_cloudwatch_log_group" "chat_service" {
  name              = "/${local.name_prefix}/ecs/chat-service"
  retention_in_days = var.log_retention_days
  tags              = { "Name" = "${local.name_prefix}-chat-service" }
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
      image     = "${var.ecr_repository_url}:latest"
      essential = true

      portMappings = [
        {
          containerPort = 80
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV",
          value = var.environment
        },
        {
          name  = "REDIS_HOST",
          value = var.redis_endpoint
        },
        {
          name  = "REDIS_PORT",
          value = "6379"
        },
        {
          name  = "SERVICE_NAME",
          value = "chat-service"
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
  
  depends_on = [aws_cloudwatch_log_group.chat_service]
}

# ECS Service
resource "aws_ecs_service" "chat_service" {
  name            = "${local.name_prefix}-chat-service"
  cluster         = aws_ecs_cluster.chat_cluster.id
  task_definition = aws_ecs_task_definition.chat_task.arn
  desired_count   = var.chat_service_desired_count
  launch_type     = "FARGATE"
  
  network_configuration {
    subnets          = [for subnet in aws_subnet.private_subnets : subnet.id]
    security_groups  = [aws_security_group.chat_service_sg.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.chat_tg.arn
    container_name   = "${local.name_prefix}-chat-service"
    container_port   = 80
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  deployment_controller {
    type = "ECS"
  }
  
  depends_on = [
    aws_lb_target_group.chat_tg,
    aws_security_group.chat_service_sg,
  ]
}

# Target Group for Chat Service
resource "aws_lb_target_group" "chat_tg" {
  name        = "${local.name_prefix}-chat-tg"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

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
  
  tags = {
    Name = "${local.name_prefix}-chat-tg"
  }
}

# New Task Definition for Notification Service
resource "aws_ecs_task_definition" "notification_task" {
  family                   = "notification-task"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  network_mode             = "awsvpc"

  container_definitions = <<EOF
    [
    {
        "name": "notification-service",
        "image": "amazon/amazon-ecs-sample",
        "portMappings": [
        {
            "containerPort": 8080,
            "protocol": "tcp"
        }
        ]
    }
    ]
    EOF

  execution_role_arn = var.execution_role_arn
  task_role_arn      = var.task_role_arn
}

# ECS Fargate Service for Notification Service
resource "aws_ecs_service" "notification_service" {
  name            = "notification-service"
  cluster         = aws_ecs_cluster.chat_cluster.id
  task_definition = aws_ecs_task_definition.notification_task.arn
  desired_count   = 2
  launch_type     = "FARGATE"
  
  network_configuration {
    subnets          = [for subnet in aws_subnet.private_subnets : subnet.id]
    security_groups  = []
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.notification_tg.arn
    container_name   = "notification-service"
    container_port   = 8080
  }

  depends_on = [aws_lb_listener.http_listener]
}

# Target Group for Notification Service
resource "aws_lb_target_group" "notification_tg" {
  name        = "notification-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

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
}
