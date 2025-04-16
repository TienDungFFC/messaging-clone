data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

data "aws_vpc" "main" {
  id = aws_vpc.chat_vpc.id
}

data "aws_availability_zones" "available" {
  state = "available"
}
