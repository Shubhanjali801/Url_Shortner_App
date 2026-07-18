# Relaunch the URL shortener on a FRESH EC2 instance after terminating the old one.
# Reuses the existing ECR image, IAM role, key pair, and security group (ap-south-1).
# Run from PowerShell:  .\relaunch.ps1
$ErrorActionPreference = "Stop"
$env:PATH += ";C:\Program Files\Amazon\AWSCLIV2"

$REGION = "ap-south-1"
$SG     = "sg-033f3da617ad6e5a7"
$deploy = Split-Path -Parent $MyInvocation.MyCommand.Path
$ud     = "file://" + ($deploy -replace '\\', '/') + "/user-data.sh"

Write-Host "== refreshing SSH rule to your current IP =="
$MYIP = (Invoke-RestMethod "https://checkip.amazonaws.com").Trim()
try { aws ec2 authorize-security-group-ingress --group-id $SG --protocol tcp --port 22 --cidr "$MYIP/32" --region $REGION 2>$null | Out-Null } catch {}
Write-Host "   allowed SSH from $MYIP"

Write-Host "== finding latest Amazon Linux 2023 AMI =="
$AMI = aws ec2 describe-images --owners amazon --region $REGION `
  --filters "Name=name,Values=al2023-ami-2023.*-x86_64" "Name=state,Values=available" `
  --query "reverse(sort_by(Images,&CreationDate))[0].ImageId" --output text
Write-Host "   AMI = $AMI"

Write-Host "== launching t3.small =="
$IID = aws ec2 run-instances --image-id $AMI --instance-type t3.small `
  --key-name urlshort-key --security-group-ids $SG `
  --iam-instance-profile Name=ec2-ecr-pull `
  --user-data $ud `
  --block-device-mappings 'DeviceName=/dev/xvda,Ebs={VolumeSize=20,VolumeType=gp3}' `
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=urlshort}]' `
  --region $REGION --query "Instances[0].InstanceId" --output text
Write-Host "   instance = $IID"

Write-Host "== waiting for it to boot =="
aws ec2 wait instance-running --instance-ids $IID --region $REGION
$IP = aws ec2 describe-instances --instance-ids $IID --region $REGION `
  --query "Reservations[0].Instances[0].PublicIpAddress" --output text

Write-Host ""
Write-Host "=================================================="
Write-Host " Instance : $IID"
Write-Host " Public IP: $IP"
Write-Host ""
Write-Host " It self-deploys in ~4 min. Then get your live URL:"
Write-Host "   ssh -i urlshort-key.pem ec2-user@$IP `"cat /opt/urlshort/LIVE_URL.txt`""
Write-Host ""
Write-Host " Stop billing later:"
Write-Host "   aws ec2 terminate-instances --instance-ids $IID --region $REGION"
Write-Host "=================================================="
