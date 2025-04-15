# ALB
resource "aws_lb" "chat_alb" {
  name               = "chat-alb"
  load_balancer_type = "application"
  subnets            = [for subnet in aws_subnet.public_subnets : subnet.id]
  security_groups    = [aws_security_group.alb_sg.id]
}

# ALB Security Group
resource "aws_security_group" "alb_sg" {
  name        = "chat-alb-sg"
  description = "Security group for chat application ALB"
  vpc_id      = aws_vpc.chat_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTP traffic"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name = "chat-alb-sg"
  }
}

# ALB Listener
resource "aws_lb_listener" "http_listener" {
  load_balancer_arn = aws_lb.chat_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.chat_tg.arn
  }
}

# Target Group
resource "aws_lb_target_group" "chat_tg" {
  name        = "chat-tg"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.chat_vpc.id
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

  # Required for WebSocket support
  stickiness {
    type            = "app_cookie"
    cookie_duration = 86400
    enabled         = true
    cookie_name     = "chat_session"
  }
}