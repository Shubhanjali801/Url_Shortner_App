Here's the redeploy process after code changes. It has two parts — rebuild/push from your machine, then pull/restart on the EC2. **Copy-paste, don't run anything of mine.**

## Part A — On your local machine (rebuild image + push to ECR)
Run from the `app/` folder:
```bash
cd ~/Desktop/ENGINEERING/URL_Shortner_Impementation/app

# 1. Rebuild the image with your new code
docker build -t urlshort-app:latest .

# 2. Log in to ECR
aws ecr get-login-password --region us-east-1 \
  | docker login --username AWS --password-stdin 197002356271.dkr.ecr.us-east-1.amazonaws.com

# 3. Tag + push to ECR
docker tag urlshort-app:latest 197002356271.dkr.ecr.us-east-1.amazonaws.com/url-shortener:latest
docker push 197002356271.dkr.ecr.us-east-1.amazonaws.com/url-shortener:latest
```

## Part B — On the EC2 instance (pull new image + restart app)
```bash
# 4. SSH into the server
ssh -i app/deploy/aws-ec2/urlshort-key.pem ec2-user@3.235.104.110

# 5. Pull the new image and recreate ONLY the app container
cd /opt/urlshort
aws ecr get-login-password --region us-east-1 \
  | sudo docker login --username AWS --password-stdin 197002356271.dkr.ecr.us-east-1.amazonaws.com
sudo docker compose pull app
BASE_URL=$(cat LIVE_URL.txt) sudo docker compose up -d app
```

That's it — new code is live.

## Why it's done this way (important)
- **Only the `app` container is recreated** → the `cloudflared` container keeps running, so your **URL stays the same**. Do *not* run `docker compose up -d` (no service name) or `restart` — that would restart cloudflared and give you a **new URL**.
- **`BASE_URL=$(cat LIVE_URL.txt)`** re-injects your current public URL, so short links keep pointing at the right domain. If you skip it, short links would break (default to localhost).
- **DB migrations apply automatically** — the app container runs `prisma migrate deploy` on startup, so any new Prisma migration in your code is applied when the app recreates.

## Verify it worked
From anywhere:
```bash
curl https://press-camcorders-mines-specs.trycloudflare.com/health
```

---

💡 **One-liner shortcut** (once SSH'd in, for future redeploys): run Part B step 5 as a single copy-paste block. If you'd like, I can save that as a `redeploy.sh` script on the instance so it's just `bash redeploy.sh` next time — say the word (I won't run anything now).

=========================================================================================================================


You're on. Let me provision the whole thing via CLI in `us-east-1` (matching your ECR image). I'll create a key pair, IAM role, security group, and launch the instance with the self-deploying user-data.

First, the setup — key pair, IAM role for ECR pull, and a security group locked to your IP:

Setup mostly done — key pair, IAM role, instance profile, and SSH-locked security group all created. Only the AMI lookup failed (no SSM permission), but I can find it via a different API. Let me get the AMI and launch the instance:

🚀 **Instance launched: `i-00c27cc62c2c80332`.** Now it's booting and self-deploying (installs Docker, pulls your image, starts the stack, opens the tunnel — ~3–4 min). Let me get its public IP and fix the key permissions so I can SSH in for the URL:

Instance is live at **3.235.104.110**. Now I'll poll it over SSH until the self-deploy finishes and writes the live URL (~3–4 min). Running in the background:

I'll wait for the SSH poll to catch the deployment finishing.

🎉 **Deployed on AWS EC2 — self-deploy succeeded!** All 4 containers running, live URL:
```
https://press-camcorders-mines-specs.trycloudflare.com
```

Let me verify it end-to-end over the public internet:

✅ **Everything passes over the public internet on AWS.** health `ok`, create works, redirect `302`, home page `200`.

# 🎉 Your app is now permanently live on AWS EC2

## 🔒 Live secure URL — share with your friend
```
https://press-camcorders-mines-specs.trycloudflare.com
```
Runs 24/7 on AWS — **your PC can be off**, friend can use it anytime, encrypted HTTPS.

## Your AWS resources
| Resource | Value |
|----------|-------|
| Instance | `i-00c27cc62c2c80332` (t3.small, us-east-1) |
| Public IP | `3.235.104.110` |
| SSH key | [urlshort-key.pem](URL_Shortner_Impementation/app/deploy/aws-ec2/urlshort-key.pem) |
| Cost | ~$15/mo while running |

## Manage it (SSH in)
```bash
ssh -i app/deploy/aws-ec2/urlshort-key.pem ec2-user@3.235.104.110

# on the instance:
cat /opt/urlshort/LIVE_URL.txt                          # current URL
cd /opt/urlshort && sudo docker compose ps              # status
sudo docker compose logs cloudflared | grep trycloudflare
```

## 💸 To stop billing (when you no longer need it)
```bash
aws ec2 terminate-instances --instance-ids i-00c27cc62c2c80332 --region us-east-1
```

## One caveat
The `trycloudflare.com` URL stays stable as long as the instance keeps running (it will — `restart: unless-stopped`). If you ever reboot the instance or restart the cloudflared container, you'll get a **new** URL — SSH in and `cat /opt/urlshort/LIVE_URL.txt` to see the current one. For a **fixed** URL that never changes, you'd add a domain (I can set that up anytime).

Let me record the EC2 deployment in memory:

Your URL shortener is now **permanently deployed on AWS EC2** and secure at 🔒 **https://press-camcorders-mines-specs.trycloudflare.com** — running 24/7, your PC can be off, ready for your friend abroad.

**Quick recap of what's live:**
- t3.small instance `i-00c27cc62c2c80332` in us-east-1 (~$15/mo)
- App + Postgres + Redis + Cloudflare tunnel, all auto-started on boot
- Locked down: only SSH open (from your IP), no web ports exposed
- SSH key saved at [app/deploy/aws-ec2/urlshort-key.pem](URL_Shortner_Impementation/app/deploy/aws-ec2/urlshort-key.pem)

Two reminders: **terminate the instance** when you're done to stop billing, and if you ever want a **fixed URL that survives reboots**, get a domain and I'll wire up permanent HTTPS. Enjoy — go share it! 🚀