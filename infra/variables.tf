variable "execution_role_arn" {
  type        = string
  description = "ARN of the ECS Task Execution Role"
}

variable "task_role_arn" {
  type        = string
  description = "ARN of the ECS Task Role"
}