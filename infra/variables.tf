variable "execution_role_arn" {
  description = "ARN of the IAM role that allows ECS to execute tasks"
  type        = string
}

variable "task_role_arn" {
  description = "ARN of the IAM role that ECS tasks can use to call AWS services"
  type        = string
}

variable "service" {
  description = "Name of the service"
  type        = string
  default     = "chat"
}

variable "env" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnets" {
  description = "Map of public subnet configurations"
  type = map(object({
    cidr = string
    az   = string
  }))
  default = {
    subnet1 = {
      cidr = "10.0.0.0/20"
      az   = "us-east-1a"
    },
    subnet2 = {
      cidr = "10.0.16.0/20"
      az   = "us-east-1b"
    }
  }
}

variable "private_subnets" {
  description = "Map of private subnet configurations"
  type = map(object({
    cidr = string
    az   = string
  }))
  default = {
    subnet1 = {
      cidr = "10.0.32.0/20"
      az   = "ap-southeast-1a" 
    },
    subnet2 = {
      cidr = "10.0.48.0/20"
      az   = "ap-southeast-1b"
    }
  }
}

variable "environment" {
  description = "Environment name (dev, test, prod)"
  type        = string
  default     = "dev"
}

variable "log_retention_days" {
  description = "Number of days to retain logs in CloudWatch"
  type        = number
  default     = 30
}

variable "chat_service_cpu" {
  description = "CPU units for the chat service task"
  type        = string
  default     = "512"
}

variable "chat_service_memory" {
  description = "Memory for the chat service task"
  type        = string
  default     = "1024"
}

variable "chat_service_desired_count" {
  description = "Desired count of chat service tasks"
  type        = number
  default     = 2
}

variable "ecr_repository_url" {
  description = "ECR repository URL for the chat service image"
  type        = string
}

variable "redis_endpoint" {
  description = "Redis endpoint for the chat service"
  type        = string
}