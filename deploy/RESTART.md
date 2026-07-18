# App is terminated currently 
run this command : 
```
cd  ~/Desktop/ENGINEERING/System_Design/URLShortner_Impementation/app/deploy/aws-ec2
powershell -ExecutionPolicy Bypass -File relaunch.ps1

```
Then get live URL 
```
ssh -i urlshort-key.pem ec2-user@<New_public_Ip> "cat /opt/urlshort/LIVE_URL.txt

``
After testing Terminate otherwise AWS will charge it

```
cd  ~/Desktop/ENGINEERING/System_Design/URLShortner_Impementation/app/deploy/aws-ec2
aws ec2 terminate-instances --instance-ids i-0d175fee0c10b6619 --region ap-south-1
```