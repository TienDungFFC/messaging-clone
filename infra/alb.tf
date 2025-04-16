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

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS traffic"
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

# Create ACM certificate with validation records
resource "aws_acm_certificate" "chat_cert" {
  domain_name       = "messenger-aws.online"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# Add this to create validation records (if using Route53)
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.chat_cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  zone_id = "Z1040390RAUSXRYM7JIB" 
  name    = each.value.name
  type    = each.value.type
  records = [each.value.record]
  ttl     = 60
}

# Certificate validation
resource "aws_acm_certificate_validation" "chat_cert" {
  certificate_arn         = aws_acm_certificate.chat_cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# HTTPS listener with validated certificate
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.chat_alb.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = aws_acm_certificate_validation.chat_cert.certificate_arn # Reference the validated certificate

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.chat_service.arn
  }
}

# Redirect HTTP to HTTPS
resource "aws_lb_listener" "http_redirect" {
  load_balancer_arn = aws_lb.chat_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}