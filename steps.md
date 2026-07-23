# Simple Blog — Setup Guide

A minimal blog app split into two services: a **Next.js frontend** and a
**Node.js/Express JSON API backend**, backed by Postgres, sitting behind an
Nginx reverse proxy — all wired together with Docker Compose. Includes a
provisioning script for a fresh server and a GitHub Actions pipeline that
builds and deploys both services on every push to `main`.

## Architecture

```
Browser → Nginx (:80) → Next.js frontend (:3000, internal)
                              │
                              │  server-side only (getServerSideProps
                              │  + Next API routes), over the Docker
                              │  network — never exposed to the browser
                              ▼
                        Express backend (:3000, internal) → Postgres
```

The browser only ever talks to Nginx/Next.js. The backend is not published
on any host port — only reachable inside the Docker network — so there's
no CORS setup needed and no API surface exposed publicly.

## Project layout

```
blog-app/
├── backend/                  # Express JSON API
│   ├── server.js              # /api/posts routes, /health
│   ├── package.json
│   └── Dockerfile
├── frontend/                  # Next.js app (pages router)
│   ├── pages/
│   │   ├── index.js            # list posts (getServerSideProps)
│   │   ├── posts/new.js         # create post form (client component)
│   │   ├── posts/[id].js        # view/delete a post
│   │   └── api/posts/           # Next API routes that proxy to backend
│   ├── components/Header.js
│   ├── lib/api.js               # BACKEND_URL used server-side only
│   ├── styles/globals.css
│   ├── package.json
│   └── Dockerfile               # multi-stage, Next "standalone" output
├── db/
│   └── init.sql               # creates the posts table + seed post
├── nginx/
│   └── nginx.conf             # reverse proxy -> frontend:3000
├── scripts/
│   ├── provision.sh            # run once on a fresh server
│   └── deploy.sh                # run by CI/CD on every push
├── .github/workflows/
│   └── deploy.yml               # build + push both images, then deploy
├── docker-compose.yml
├── .env.example
└── steps.md                     # this file
```

---

## 1. Run it locally

Requirements: Docker + Docker Compose plugin installed.

```bash
cd blog-app
cp .env.example .env
docker compose up -d --build
```

Visit `http://localhost` — Nginx listens on port 80 and proxies to the
frontend container, which renders pages and calls the backend internally.
Postgres data persists in a named Docker volume (`db-data`) so it survives
restarts.

Useful commands:

```bash
docker compose ps                 # see running containers
docker compose logs -f frontend
docker compose logs -f backend
docker compose down                # stop everything
docker compose down -v             # stop and wipe the database volume
```

---

## 2. Push the project to GitHub

```bash
cd blog-app
git init
git add .
git commit -m "Initial commit: simple blog app (frontend + backend)"
git branch -M main
git remote add origin https://github.com/NetanTech/simple-blog.git
git push -u origin main
```

(Swap in whichever repo you create under your `NetanTech` org.)

---

## 3. Provision a server

Spin up a fresh Ubuntu 22.04/24.04 VM (any cloud works — GCP, Azure, a
plain VPS). Then SSH in and run:

```bash
curl -O https://raw.githubusercontent.com/NetanTech/simple-blog/main/scripts/provision.sh
sudo bash provision.sh https://github.com/NetanTech/simple-blog.git main
```

What it does:
1. Updates system packages
2. Installs Docker Engine + the Compose plugin
3. Adds your user to the `docker` group
4. Clones the repo into `/opt/simple-blog`
5. Copies `.env.example` to `.env` (edit this to change default DB creds)
6. Runs `docker compose up -d --build` (builds both frontend and backend
   images locally the first time)

After it finishes, the blog is reachable at `http://<server-ip>`.

> Open port 80 (and 22 for SSH) in your cloud provider's firewall/security
> group if you can't reach the site.

---

## 4. Set up the CI/CD pipeline

The workflow at `.github/workflows/deploy.yml` does two things on every
push to `main`:

1. **Build** — builds both the backend and frontend Docker images (via a
   matrix job) and pushes them to GitHub Container Registry (GHCR), each
   tagged with the commit SHA and `latest`.
2. **Deploy** — SSHes into your server and runs `scripts/deploy.sh`, which
   pulls both freshly-pushed images and restarts the stack with zero
   manual steps.

### One-time setup

**a. GHCR push** — no action needed, the build job uses the built-in
`GITHUB_TOKEN`.

**b. Add repo secrets** (Settings → Secrets and variables → Actions →
New repository secret):

| Secret | Value |
|---|---|
| `SERVER_HOST` | Your server's IP address |
| `SERVER_USER` | SSH user (e.g. `ubuntu`) |
| `SERVER_SSH_KEY` | Private key that can SSH into the server (paste the full PEM contents) |

Generate a deploy keypair if you don't already have one:

```bash
ssh-keygen -t ed25519 -f deploy_key -C "github-actions-deploy" -N ""
# Copy the PUBLIC key to the server:
ssh-copy-id -i deploy_key.pub ubuntu@<server-ip>
# Paste the PRIVATE key (deploy_key) into the SERVER_SSH_KEY secret
```

**c. Point the server at the CI-built images** — on the server, edit
`/opt/simple-blog/.env` and uncomment/set:

```
BACKEND_IMAGE=ghcr.io/netantech/simple-blog-backend:latest
FRONTEND_IMAGE=ghcr.io/netantech/simple-blog-frontend:latest
```

(lowercase — GHCR image names must be lowercase)

**d. Make sure the server can pull from GHCR.** If the packages are
private, create a GitHub Personal Access Token (classic) with
`read:packages` scope and export it as `GHCR_USER`/`GHCR_TOKEN` before
running `deploy.sh` manually the first time, or simply make both packages
public (Package settings → Change visibility) since this is a learning
project.

### From then on

Every `git push origin main` will:

```
push → GitHub Actions builds backend + frontend images → pushes both to
ghcr.io → SSHes into your server → pulls both new images → docker compose
up -d → old images pruned
```

You can watch it run under the repo's **Actions** tab.

---

## 5. Extending it

Ideas if you want to build on this as teaching material:

- Add a `staging` branch + workflow trigger for a staging environment
- Add Trivy image scanning to the workflow before push (matches the
  pattern from the GitOps portfolio project)
- Swap the SSH-deploy step for a webhook/watchtower-style pull, or move
  to ArgoCD if you containerize this onto Kubernetes
- Add basic auth or a login system before allowing post creation/deletion
- Add HTTPS via Let's Encrypt (certbot) in front of Nginx
- Add a Next.js API health-check page and wire it into the Nginx config
  for a proper `/healthz` endpoint
