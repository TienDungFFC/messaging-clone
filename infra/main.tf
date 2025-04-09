provider "aws" {
  region = "ap-southeast-1"
}

# Create VPC
resource "aws_vpc" "chat_vpc" {
  cidr_block = "10.0.0.0/16"
  tags = {
    Name = "chat-vpc"
  }
}

# Create public subnets (two AZs)
resource "aws_subnet" "public_subnets" {
  count             = 2
  vpc_id            = aws_vpc.chat_vpc.id
  cidr_block        = cidrsubnet(aws_vpc.chat_vpc.cidr_block, 4, count.index)
  map_public_ip_on_launch = true
  availability_zone  = element(data.aws_availability_zones.available.names, count.index)

  tags = {
    Name = "public-subnet-${count.index}"
  }
}

# Create private subnets (two AZs)
resource "aws_subnet" "private_subnets" {
  count             = 2
  vpc_id            = aws_vpc.chat_vpc.id
  cidr_block        = cidrsubnet(aws_vpc.chat_vpc.cidr_block, 4, count.index + 2)
  availability_zone = element(data.aws_availability_zones.available.names, count.index)

  tags = {
    Name = "private-subnet-${count.index}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.chat_vpc.id
}

# Route Table for public subnets
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.chat_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "public-route-table"
  }
}

# Associate public subnets with the public route table
resource "aws_route_table_association" "public_rt_assoc" {
  count          = 2
  subnet_id      = aws_subnet.public_subnets[count.index].id
  route_table_id = aws_route_table.public_rt.id
}

# ECS Cluster
resource "aws_ecs_cluster" "chat_cluster" {
  name = "chat-ecs-cluster"
}

# ALB
resource "aws_lb" "chat_alb" {
  name               = "chat-alb"
  load_balancer_type = "application"
  subnets            = [for subnet in aws_subnet.public_subnets : subnet.id]
  security_groups    = []
}

# ALB Listener
resource "aws_lb_listener" "http_listener" {
  load_balancer_arn = aws_lb.chat_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      message_body = "Chat ALB up and running"
      status_code  = "200"
    }
  }
}

# Task Definition (example)
resource "aws_ecs_task_definition" "chat_task" {
  family                   = "chat-task"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  network_mode             = "awsvpc"

  container_definitions = <<EOF
    [
    {
        "name": "chat-service",
        "image": "amazon/amazon-ecs-sample",
        "portMappings": [
        {
            "containerPort": 80,
            "protocol": "tcp"
        }
        ]
    }
    ]
    EOF

  execution_role_arn = var.execution_role_arn
  task_role_arn      = var.task_role_arn
}

# ECS Fargate Service
resource "aws_ecs_service" "chat_service" {
  name            = "chat-service"
  cluster         = aws_ecs_cluster.chat_cluster.id
  task_definition = aws_ecs_task_definition.chat_task.arn
  desired_count   = 2
  launch_type     = "FARGATE"
  network_configuration {
    subnets          = [for subnet in aws_subnet.private_subnets : subnet.id]
    security_groups  = []
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.chat_tg.arn
    container_name   = "chat-service"
    container_port   = 80
  }

  depends_on = [aws_lb_listener.http_listener]
}

# Target Group
resource "aws_lb_target_group" "chat_tg" {
  name        = "chat-tg"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.chat_vpc.id
  target_type = "ip"
}

# Listener Rule to forward traffic 
resource "aws_lb_listener_rule" "chat_rule" {
  listener_arn = aws_lb_listener.http_listener.arn
  priority     = 1
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.chat_tg.arn
  }
  condition {
    host_header {
      values = ["example.com"]
    }
  }
}

data "aws_availability_zones" "available" {}