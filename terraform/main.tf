terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }
  
  backend "s3" {
    bucket         = "vision-monitor-terraform-state"
    key            = "vision-monitor/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "vision-monitor-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region
}

provider "docker" {
  host = "unix:///var/run/docker.sock"
}
