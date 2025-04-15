# Amazon ECR Repository for chat-service
resource "aws_ecr_repository" "chat_service" {
  name                 = "chat-service"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# ECR Lifecycle Policy to avoid storing too many images
resource "aws_ecr_lifecycle_policy" "chat_service_policy" {
  repository = aws_ecr_repository.chat_service.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 5 images"
        selection = {
          tagStatus     = "any"
          countType     = "imageCountMoreThan"
          countNumber   = 5
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

output "chat_service_repository_url" {
  value = aws_ecr_repository.chat_service.repository_url
  description = "The URL of the chat-service ECR repository"
}
