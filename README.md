# ML DevSecOps Credit Scoring Platform

End-to-end **MLOps / DevSecOps** project that delivers a credit scoring application with containerized services, CI/CD, GitOps (Argo CD), Kubernetes environments, and cluster monitoring.

The application predicts a client's **payment default risk** from simple inputs (age and annual income). The prediction logic is currently a lightweight heuristic and is designed to be replaced later by a trained ML model.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start (Local)](#quick-start-local)
- [API Reference](#api-reference)
- [Docker Images](#docker-images)
- [Kubernetes Deployment](#kubernetes-deployment)
- [GitOps with Argo CD](#gitops-with-argo-cd)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring (Grafana / Prometheus)](#monitoring-grafana--prometheus)
- [Environments](#environments)
- [Security Notes](#security-notes)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

This repository demonstrates a production-oriented workflow for an ML-backed API:

1. **Develop** a FastAPI credit scoring service and a static Nginx frontend.
2. **Build & push** Docker images via GitHub Actions on every relevant push to `main`.
3. **Update** Kubernetes manifests (GitOps source of truth) with the new image tags.
4. **Sync** the desired state to the cluster automatically with Argo CD.
5. **Observe** the cluster with Prometheus and Grafana.

| Layer | Component | Role |
|-------|-----------|------|
| Frontend | Nginx + HTML/JS | Credit simulation UI |
| Backend | FastAPI + Uvicorn | `/predict` scoring API |
| Local runtime | Docker Compose | Frontend + PostgreSQL for local tests |
| Orchestration | Kubernetes | Dev & Staging deployments/services |
| GitOps | Argo CD | Continuous sync from Git to cluster |
| CI/CD | GitHub Actions | Test → Build → Push → Manifest update |
| Observability | kube-prometheus-stack | Metrics + Grafana dashboards |

---

## Architecture

```text
┌─────────────────┐     push (app/**)      ┌──────────────────────┐
│  Developer / Git │ ─────────────────────► │  GitHub Actions CI   │
└────────┬────────┘                         │  - test              │
         │                                  │  - build & push      │
         │                                  │  - update dev.yml    │
         │                                  └──────────┬───────────┘
         │                                             │ commit image tags
         ▼                                             ▼
┌─────────────────┐                         ┌──────────────────────┐
│  Git Repository │ ◄───────────────────────│  kubernetes/dev/dev.yml│
│  (source of     │                         └──────────────────────┘
│   truth)        │
└────────┬────────┘
         │ Argo CD sync (automated)
         ▼
┌─────────────────────────────────────────────────────────────┐
│                     Kubernetes Cluster                        │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐ │
│  │ namespace:dev │   │ ns: staging  │   │ monitoring stack │ │
│  │ API + Front  │   │ API + Front  │   │ Prometheus/Grafana│ │
│  └──────────────┘   └──────────────┘   └──────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Request flow (in cluster):**

1. User opens the frontend (NodePort `30081` in `dev`, `30082` in `staging`).
2. Nginx serves the UI and can proxy `/api/` to the internal `ml-api-svc:8000`.
3. The API returns a risk level (`Élevé` / `Faible`) and a computed score.

---

## Project Structure

```text
ml-dev-sec-ops-project/
├── app/
│   ├── api/
│   │   ├── main.py              # FastAPI credit scoring API
│   │   ├── requirements.txt     # Python dependencies
│   │   └── dockerfile           # Multi-stage API image
│   └── front-end/
│       ├── index.html           # Credit simulation UI
│       ├── nginx.conf           # Reverse proxy + static files
│       └── dockerfile           # Nginx Alpine image
├── kubernetes/
│   ├── argo-cd/
│   │   ├── application-env.yaml       # Argo CD app → dev
│   │   ├── application-staging.yaml   # Argo CD app → staging
│   │   └── repo-secret.yaml           # Git repo registration for Argo CD
│   ├── dev/
│   │   └── dev.yml              # Deployments & Services (dev)
│   └── staging/
│       └── staging.yml          # Deployments & Services (staging)
├── infra/
│   └── deployement-k8s-grafana-monitoring.ps1
├── .github/
│   └── workflows/
│       └── deploy-dev.yml       # CI/CD: build, push, update manifests
├── docker-compose.yml           # Local frontend + PostgreSQL
├── .gitignore
└── README.md
```

---

## Tech Stack

| Category | Technology |
|----------|------------|
| API | Python 3.11, FastAPI, Uvicorn, Pydantic |
| Frontend | HTML/JS, Nginx Alpine |
| Containers | Docker (multi-stage builds) |
| Local orchestration | Docker Compose |
| Cluster | Kubernetes |
| GitOps | Argo CD |
| CI/CD | GitHub Actions |
| Registry | Docker Hub (`akaax/ml-api`, `akaax/ml-frontend`) |
| Monitoring | Prometheus + Grafana (`kube-prometheus-stack`) |
| Database (local) | PostgreSQL 15 Alpine |

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- [kubectl](https://kubernetes.io/docs/tasks/tools/) configured for your cluster
- [Helm](https://helm.sh/docs/intro/install/) (for monitoring)
- A Kubernetes cluster (local or remote): Minikube, kind, Docker Desktop, AKS, EKS, GKE, etc.
- [Argo CD](https://argo-cd.readthedocs.io/) installed in the cluster (for GitOps)
- GitHub repository secrets (for CI/CD):
  - `DOCKER_USERNAME`
  - `DOCKER_PASSWORD`

Optional for local API development:

- Python 3.11+
- `pip`

---

## Quick Start (Local)

### 1. Clone the repository

```bash
git clone https://github.com/Ashraf-Khabar/mlops-credit-scoring-k8s.git
cd mlops-credit-scoring-k8s
```

### 2. Run the API locally (without Docker)

```bash
cd app/api
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- OpenAPI schema: [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

### 3. Run with Docker Compose

```bash
docker compose up --build
```

This starts:

| Service | Port | Description |
|---------|------|-------------|
| `frontend` | `8080` → `80` | Nginx UI |
| `database` | (internal) | PostgreSQL 15 (`devops_user` / `qa_database`) |

Open the UI at [http://localhost:8080](http://localhost:8080).

> **Note:** Compose currently builds the frontend and a PostgreSQL database. For a full local stack including the API, either run the API with Uvicorn (step 2) or add an `api` service to `docker-compose.yml`.

### 4. Build images manually

```bash
# API
docker build -t akaax/ml-api:local ./app/api
docker run -p 8000:8000 akaax/ml-api:local

# Frontend
docker build -t akaax/ml-frontend:local ./app/front-end
docker run -p 8080:80 akaax/ml-frontend:local
```

---

## API Reference

**Base URL (local):** `http://localhost:8000`

### `POST /predict`

Predicts credit default risk from client data.

**Request body**

```json
{
  "age": 35,
  "revenu": 45000
}
```

| Field | Type | Description |
|-------|------|-------------|
| `age` | `integer` | Client age |
| `revenu` | `float` | Annual income |

**Response**

```json
{
  "donnees_recues": {
    "age": 35,
    "revenu": 45000.0
  },
  "score_calcule": 1285.71,
  "niveau_risque": "Faible"
}
```

**Scoring rule (placeholder model)**

```text
ratio = revenu / age
risk  = "Élevé" if ratio < 1000 else "Faible"
```

This rule is intentional scaffolding: replace it with a serialized ML model (joblib/ONNX/etc.) when ready.

**Example with cURL**

```bash
curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d "{\"age\": 35, \"revenu\": 45000}"
```

---

## Docker Images

### API image (`app/api/dockerfile`)

- **Multi-stage build** for smaller runtime images
- Base: `python:3.11-slim`
- Exposes port `8000`
- Entrypoint: `uvicorn main:app --host 0.0.0.0 --port 8000`

### Frontend image (`app/front-end/dockerfile`)

- Base: `nginx:alpine-slim`
- Serves `index.html`
- Proxies `/api/` → `http://ml-api-svc:8000/` (in-cluster service name)

Published tags from CI follow the short Git commit SHA, for example:

```text
akaax/ml-api:<sha>
akaax/ml-frontend:<sha>
```

---

## Kubernetes Deployment

### Namespaces

Create the target namespaces if they do not exist:

```bash
kubectl create namespace dev
kubectl create namespace staging
```

### Deploy manually (without Argo CD)

**Dev**

```bash
kubectl apply -f kubernetes/dev/dev.yml
```

**Staging**

```bash
kubectl apply -f kubernetes/staging/staging.yml
```

### Services & access

| Environment | Component | Service type | Access |
|-------------|-----------|--------------|--------|
| `dev` | Frontend | NodePort | `http://<node-ip>:30081` |
| `dev` | API | ClusterIP | `ml-api-svc.dev.svc.cluster.local:8000` |
| `staging` | Frontend | NodePort | `http://<node-ip>:30082` |
| `staging` | API | ClusterIP | `ml-api-svc.staging.svc.cluster.local:8000` |

**Resource defaults (API & Frontend)**

- Requests: `100m` CPU / `128Mi` memory
- Limits: `500m` CPU / `512Mi` memory

**Replicas**

- API: `1`
- Frontend: `2`

### Useful kubectl commands

```bash
# Pods
kubectl get pods -n dev
kubectl get pods -n staging

# Services
kubectl get svc -n dev
kubectl get svc -n staging

# Logs
kubectl logs -n dev deploy/ml-api-deploy -f
kubectl logs -n dev deploy/ml-frontend-deploy -f

# Port-forward API for local testing
kubectl port-forward -n dev svc/ml-api-svc 8000:8000
```

---

## GitOps with Argo CD

Argo CD continuously reconciles the cluster with the manifests in this repository.

### Applications

| Application | Path | Destination namespace | Sync |
|-------------|------|------------------------|------|
| `credit-scoring-app-dev` | `kubernetes/dev` | `dev` | Automated (prune + self-heal) |
| `credit-scoring-app-staging` | `kubernetes/staging` | `staging` | Automated (prune + self-heal) |

### Register the repository and applications

```bash
# Register Git repository (adjust credentials as needed)
kubectl apply -f kubernetes/argo-cd/repo-secret.yaml

# Create Argo CD Applications
kubectl apply -f kubernetes/argo-cd/application-env.yaml
kubectl apply -f kubernetes/argo-cd/application-staging.yaml
```

### Expected GitOps flow

1. A developer merges a change under `app/**` into `main`.
2. GitHub Actions builds new images and updates `kubernetes/dev/dev.yml` with the commit SHA tags.
3. Argo CD detects the Git change and syncs the `dev` namespace.
4. Staging can be promoted by updating `kubernetes/staging/staging.yml` (manually or via a future promotion pipeline).

---

## CI/CD Pipeline

Workflow file: [`.github/workflows/deploy-dev.yml`](.github/workflows/deploy-dev.yml)

**Trigger:** push to `main` when files under `app/**` change.

```text
Push to main (app/**)
        │
        ▼
   ┌─────────┐
   │  test   │  (placeholder environment check)
   └────┬────┘
        │
        ▼
┌───────────────────┐
│ build-and-deploy  │
│ 1. Checkout       │
│ 2. Docker Hub login│
│ 3. Short SHA tag  │
│ 4. Build/push API │
│ 5. Build/push FE  │
│ 6. sed update     │
│    kubernetes/dev │
│ 7. Commit & push  │
└───────────────────┘
```

### Required GitHub secrets

| Secret | Purpose |
|--------|---------|
| `DOCKER_USERNAME` | Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub password or access token |

### Image naming convention

```text
akaax/ml-api:<short-sha>
akaax/ml-frontend:<short-sha>
```

The workflow rewrites image references in `kubernetes/dev/dev.yml` and commits:

```text
Auto-update: API and Frontend to <short-sha> in DEV
```

---

## Monitoring (Grafana / Prometheus)

Script: [`infra/deployement-k8s-grafana-monitoring.ps1`](infra/deployement-k8s-grafana-monitoring.ps1)

Installs / upgrades the **kube-prometheus-stack** Helm chart and opens a local tunnel to Grafana.

### Run (Windows PowerShell)

```powershell
.\infra\deployement-k8s-grafana-monitoring.ps1
```

What the script does:

1. Adds the `prometheus-community` Helm repo
2. Installs/upgrades `k8s-grafana-monitoring` (kube-prometheus-stack)
3. Waits for the Grafana deployment rollout
4. Port-forwards Grafana to [http://localhost:8081](http://localhost:8081)
5. Prints the admin password from the Kubernetes secret

Default credentials:

| Field | Value |
|-------|-------|
| URL | `http://localhost:8081` |
| Username | `admin` |
| Password | Retrieved from the cluster secret by the script |

---

## Environments

| Environment | Namespace | Image pull policy | Frontend NodePort | Purpose |
|-------------|-----------|-------------------|-------------------|---------|
| Development | `dev` | `Always` | `30081` | Continuous delivery from CI |
| Staging | `staging` | `Never` (local/preloaded images) | `30082` | Pre-production validation |

> Staging currently uses `imagePullPolicy: Never` and tags such as `ml-api:latest` / `ml-frontend:latest`. Load images into the cluster (or change the policy/tags) before relying on Staging in a remote registry workflow.

---

## Security Notes

This project is educational / portfolio-oriented. Before production use, harden at least the following:

- **CORS:** API currently allows `allow_origins=["*"]` — restrict to the real frontend origin.
- **Secrets:** Do not commit real Docker Hub or Git credentials. Prefer Sealed Secrets, External Secrets, or a cloud secret manager. `repo-secret.yaml` should not contain plaintext tokens in Git.
- **Database credentials** in `docker-compose.yml` are demo values — rotate and inject via secrets.
- **Authentication / authorization:** The `/predict` endpoint is public; add API keys, JWT, or a gateway for real deployments.
- **Network policies:** Limit pod-to-pod traffic in Kubernetes.
- **Image scanning:** Add Trivy / Grype (or similar) in CI as part of a DevSecOps pipeline.
- **Least privilege:** Use dedicated service accounts and RBAC for Argo CD and deploy bots.
- **TLS:** Terminate HTTPS at an Ingress controller; avoid plain NodePort exposure in production.

---

## Roadmap

Suggested next improvements:

- [ ] Replace the heuristic scorer with a trained ML model artifact
- [ ] Add unit/integration tests and wire them into the `test` job
- [ ] Add container vulnerability scanning (Trivy) and dependency scanning
- [ ] Add an `api` service to Docker Compose for one-command local demos
- [ ] Introduce Ingress + TLS instead of NodePort
- [ ] Promote images from `dev` → `staging` → `prod` via a controlled pipeline
- [ ] Persist predictions in PostgreSQL and expose history endpoints
- [ ] Add model monitoring (drift, latency, prediction distribution)
- [ ] Add Horzontal Pod Autoscaler (HPA) based on CPU/RPS

---

## Contributing

1. Fork the repository and create a feature branch.
2. Make focused changes under `app/` or `kubernetes/` as needed.
3. Test locally (API + Docker build).
4. Open a pull request against `main`.
5. Ensure CI secrets are configured on the target repository if you expect image push to succeed.

Coding guidelines:

- Keep API contracts stable (`DonneesClient` / `/predict` response shape) or version them.
- Prefer small, reviewable PRs.
- Do not commit secrets, local kubeconfigs, or `.env` files with credentials.

---

## License

No license file is currently included in this repository. Add an open-source license (MIT, Apache-2.0, etc.) if you intend to share the project publicly.

---

## Authors / Maintainers

- Repository: [Ashraf-Khabar/mlops-credit-scoring-k8s](https://github.com/Ashraf-Khabar/mlops-credit-scoring-k8s)
- Docker Hub images: `akaax/ml-api`, `akaax/ml-frontend`

---

## Quick Reference

```bash
# Local API
cd app/api && uvicorn main:app --reload --port 8000

# Local Compose
docker compose up --build

# Apply K8s (dev)
kubectl apply -f kubernetes/dev/dev.yml

# Argo CD apps
kubectl apply -f kubernetes/argo-cd/

# Monitoring (PowerShell)
.\infra\deployement-k8s-grafana-monitoring.ps1
```
