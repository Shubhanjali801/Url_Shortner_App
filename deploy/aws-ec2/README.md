# Deploy the URL Shortener on AWS EC2 (permanent, ~$5–15/mo)

Runs the whole stack (app + Postgres + Redis + free HTTPS via Cloudflare tunnel) on a
single always-on EC2 instance. Cheapest permanent AWS option. Your PC can be off.

## Cost
- **t3.small** (2 GB) ≈ $15/mo, or **t3.micro** (1 GB) ≈ $7.5/mo (tight but works).
- 20 GB disk ≈ $2/mo. No load balancer, no NAT — cloudflared is outbound-only.

---

## One-time IAM role (lets the instance pull from ECR)
1. IAM → Roles → Create role → AWS service → EC2.
2. Attach policy **`AmazonEC2ContainerRegistryReadOnly`**.
3. Name it `ec2-ecr-pull` and create.

## Launch the instance
1. EC2 → Launch instance.
2. **AMI:** Amazon Linux 2023. **Type:** t3.small.
3. **Key pair:** create/select one (for SSH).
4. **Network / Security group:** allow **SSH (22) from My IP** only.
   - You do **NOT** need to open 80/443 — the tunnel is outbound. This is more secure.
5. **Advanced details → IAM instance profile:** pick `ec2-ecr-pull`.
6. **Advanced details → User data:** paste the entire contents of [`user-data.sh`](user-data.sh).
7. Launch.

## Get your live URL
The user-data self-deploys on first boot (~3–4 min). Then SSH in and read it:
```bash
ssh -i your-key.pem ec2-user@<INSTANCE_PUBLIC_IP>
cat /opt/urlshort/LIVE_URL.txt        # -> https://<something>.trycloudflare.com
```
That's your live, secure URL. Open it, use the form, share it. 🔒

---

## If you skip user-data (manual deploy)
SSH in, then:
```bash
# install docker + compose (AL2023)
sudo dnf install -y docker && sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user && newgrp docker
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# copy docker-compose.yml + deploy.sh here (scp or paste), then:
bash deploy.sh          # logs into ECR, starts stack, prints the live URL
```

## Operating it
```bash
cd /opt/urlshort
docker compose ps                       # status
docker compose logs cloudflared | grep trycloudflare   # current URL
docker compose restart                  # restart (NOTE: gives a NEW tunnel URL)
docker compose down                     # stop everything
bash deploy.sh                          # redeploy + refresh URL
```

## Updating the app later
Rebuild the image locally, push to ECR, then on the instance:
```bash
cd /opt/urlshort && bash deploy.sh      # pulls the new image
```

## ⚠️ Notes
- **URL changes on cloudflared restart.** On an always-on instance it stays stable
  because the container keeps running. For a *fixed* URL you'd need a domain (then use
  Caddy/ALB+ACM or a Cloudflare named tunnel).
- **Stop billing:** terminate the instance in the EC2 console when done.
- Postgres data persists in the `pgdata` volume across restarts (not across instance
  termination — for durable data use RDS).
