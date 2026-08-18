output "public_ip" {
  value       = aws_eip.app.public_ip
  description = "Elastic IP of the instance — stable across stop/start/reboot."
}

output "frontend_url" {
  value = "http://${aws_eip.app.public_ip}"
}

output "backend_url" {
  value = "http://${aws_eip.app.public_ip}:3000"
}

output "swagger_url" {
  value = "http://${aws_eip.app.public_ip}:3000/docs"
}

output "ssh_command" {
  value = "ssh -i ~/.ssh/checkout-flow-ec2 ubuntu@${aws_eip.app.public_ip}"
}
