output "vpc_id" {
  description = "ID of the created VPC"
  value       = aws_vpc.chat_vpc.id
}

output "public_subnet_ids" {
  description = "IDs of the created public subnets"
  value = [for subnet in aws_subnet.public_subnets : subnet.id]
}

output "private_subnet_ids" {
  description = "IDs of the created private subnets"
  value = [for subnet in aws_subnet.private_subnets : subnet.id]
}

output "alb_dns_name" {
  description = "The DNS name of the ALB"
  value       = aws_lb.chat_alb.dns_name
}
