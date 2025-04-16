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
      az   = "ap-southeast-1a"
    },
    subnet2 = {
      cidr = "10.0.16.0/20"
      az   = "ap-southeast-1b"
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

variable "log_retention_days" {
  description = "Number of days to retain logs in CloudWatch"
  type        = number
  default     = 30
}

variable "chat_service_cpu" {
  description = "CPU units for the chat service task"
  type        = string
  default     = "256"  
}

variable "chat_service_memory" {
  description = "Memory for the chat service task"
  type        = string
  default     = "512"
}

variable "chat_service_desired_count" {
  description = "Desired count of chat service tasks"
  type        = number
  default     = 2
}

variable "ecr_repository_url" {
  description = "ECR repository URL for the chat service image"
  type        = string
  default     = "430118811750.dkr.ecr.ap-southeast-1.amazonaws.com/messaging/chat-service:latest"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}