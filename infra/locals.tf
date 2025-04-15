locals {
  name_prefix = "${var.environment}-messaging"
  
  common_tags = {
    Environment = var.environment
    Project     = "messaging-clone"
    Terraform   = "true"
  }
}
