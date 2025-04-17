terraform {
  backend "s3" {
    bucket         = "phoneix-terraform-state"
    key            = "phoneix/application/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "phoneix-terraform-locks"
    encrypt        = true
  }
} 