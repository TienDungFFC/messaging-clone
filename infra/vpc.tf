locals {
  name_prefix = "${var.service}-${var.env}"
}

# Get available AZs
data "aws_availability_zones" "available" {}

# Create VPC
resource "aws_vpc" "chat_vpc" {
  cidr_block                           = var.vpc_cidr
  enable_network_address_usage_metrics = true
  enable_dns_hostnames                 = true
  
  tags = {
    Name = "${local.name_prefix}-vpc"
  }
}

# Create public subnets
resource "aws_subnet" "public_subnets" {
  for_each = var.public_subnets

  vpc_id                  = aws_vpc.chat_vpc.id
  cidr_block              = each.value.cidr
  availability_zone       = each.value.az
  map_public_ip_on_launch = true
  
  tags = {
    Name = "${local.name_prefix}-pub-subnet-${each.value.az}"
  }
}

# Create private subnets
resource "aws_subnet" "private_subnets" {
  for_each = var.private_subnets

  vpc_id            = aws_vpc.chat_vpc.id
  cidr_block        = each.value.cidr
  availability_zone = each.value.az
  
  tags = {
    Name = "${local.name_prefix}-pvt-subnet-${each.value.az}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.chat_vpc.id
  
  tags = {
    Name = "${local.name_prefix}-igw"
  }
}

# Public route table
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.chat_vpc.id
  
  tags = {
    Name = "${local.name_prefix}-pub-rt"
  }
}

# Public route table association
resource "aws_route_table_association" "public_rt_assoc" {
  for_each = aws_subnet.public_subnets

  subnet_id      = each.value.id
  route_table_id = aws_route_table.public_rt.id
}

# Public route for internet gateway
resource "aws_route" "public_internet_route" {
  route_table_id         = aws_route_table.public_rt.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.igw.id
}

# NAT Gateway configuration
resource "aws_eip" "nat" {
  for_each = aws_subnet.public_subnets

  domain = "vpc"
  tags   = { Name = "${local.name_prefix}-nat-${each.value.availability_zone}" }
}

resource "aws_nat_gateway" "nat_gw" {
  for_each = aws_subnet.public_subnets

  allocation_id = aws_eip.nat[each.key].id
  subnet_id     = each.value.id
  
  tags = { 
    Name = "${local.name_prefix}-nat-${each.value.availability_zone}" 
  }
}

# Private route tables (one per AZ)
resource "aws_route_table" "private_rt" {
  for_each = aws_subnet.private_subnets

  vpc_id = aws_vpc.chat_vpc.id
  
  tags = {
    Name = "${local.name_prefix}-pvt-rt-${each.value.availability_zone}"
  }
}

# Private route table associations
resource "aws_route_table_association" "private_rt_assoc" {
  for_each = aws_subnet.private_subnets

  subnet_id      = each.value.id
  route_table_id = aws_route_table.private_rt[each.key].id
}

# Private route for NAT gateway
resource "aws_route" "private_nat_route" {
  for_each = aws_subnet.private_subnets

  route_table_id         = aws_route_table.private_rt[each.key].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.nat_gw[each.key].id
}

# Security Group for egress traffic
resource "aws_security_group" "egress_all" {
  name        = "${local.name_prefix}-egress-all"
  description = "Security group allowing all outbound traffic"
  vpc_id      = aws_vpc.chat_vpc.id
  
  tags = { 
    Name = "${local.name_prefix}-egress-all" 
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_vpc_security_group_egress_rule" "egress_all_ipv4" {
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
  security_group_id = aws_security_group.egress_all.id
  tags              = { Name = "egress-all-ipv4" }
}

resource "aws_vpc_security_group_egress_rule" "egress_all_ipv6" {
  ip_protocol       = "-1"
  cidr_ipv6         = "::/0"
  security_group_id = aws_security_group.egress_all.id
  tags              = { Name = "egress-all-ipv6" }
}
