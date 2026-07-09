# CONTEXT — Deployment

How the site gets from a GitHub Release to `https://hhppll.online`.

> Update this file when you change the Dockerfile, Helm chart, CI, or any cluster
> assumption.

## The pipeline

```
feature branch → Pull Request → merge to main
  → create GitHub Release (tag vX.Y.Z)
    → GitHub Actions (.github/workflows/deploy.yml)
        builds Docker image → ghcr.io/huppl/hppl:<tag> (+ :latest)
        bumps image.tag in k8s/helm/hppl/values.yaml, commits back [skip ci]
    → ArgoCD (app "hppl") sees the values change, syncs
    → K3s runs the Deployment; Service (ClusterIP :80 → :3000)
    → Traefik IngressRoute serves it at https://hhppll.online (Let's Encrypt)
```

Everyday deploys: **create a GitHub Release** with a semver tag (`v1.2.3`).
Everything else is automatic. PRs to `main` are gated by `ci.yml` (lint + build).

## Branch protection

`main` is protected:
- No direct pushes — only through Pull Request.
- CI check (`ci.yml` → `build` job) must pass before merge.
- No force-push allowed.

## The VPS (context)

- Single-node **K3s** (Debian), reachable via `ssh vps`.
- **Traefik** (bundled with K3s) is the ingress. It has a `letsencrypt` ACME
  cert resolver (HTTP-01 challenge, email on file). HTTP→HTTPS redirect is
  cluster-wide. We use Traefik **IngressRoute** CRDs (not plain Ingress), matching
  every other app on the box.
- **ArgoCD** (namespace `argocd`) watches git and auto-syncs Helm charts.
- **DNS**: `hhppll.online` → the VPS public IP (already set). This is what lets
  Let's Encrypt issue the cert automatically — no manual certs, no cert-manager.

## Files

| File | What |
|------|------|
| `Dockerfile` | 3-stage build → Next.js standalone server on port 3000 |
| `.dockerignore` | keeps `legacy/`, `node_modules`, docs, k8s out of the build |
| `.env.production` | publishable `NEXT_PUBLIC_` values, baked in at build time |
| `k8s/helm/hppl/` | Helm chart: Deployment, Service, Traefik IngressRoute |
| `k8s/argocd/application.yaml` | the ArgoCD Application (apply once) |
| `.github/workflows/deploy.yml` | build + push + tag-bump (on release) |
| `.github/workflows/ci.yml` | lint + build gate (on pull request) |

## One-time bootstrap

Do these once; after that it's push-to-deploy.

1. **Image must be pullable by the cluster.** Simplest: make the GHCR package
   `ghcr.io/huppl/hppl` **public** (GitHub → Packages → package settings). If you
   keep it private, create a pull secret in the `hppl` namespace and list it under
   `imagePullSecrets` in `values.yaml`:
   ```
   kubectl create namespace hppl
   kubectl create secret docker-registry ghcr-pull -n hppl \
     --docker-server=ghcr.io --docker-username=<gh-user> --docker-password=<PAT-with-read:packages>
   ```
2. **ArgoCD must read this git repo.** If `Huppl/hppl` is private, add the repo in
   ArgoCD (UI: Settings → Repositories, or a repo secret) with a read token/deploy
   key. If public, nothing to do.
3. **Register the app:**
   ```
   kubectl apply -f k8s/argocd/application.yaml
   ```
   ArgoCD creates the `hppl` namespace and deploys. First image build must have run
   at least once (push to main) so a tag exists.

## Checking / debugging

```
ssh vps
kubectl get pods -n hppl
kubectl logs -n hppl deploy/hppl
kubectl get ingressroute -n hppl
kubectl -n argocd get application hppl
```

Cert not issuing? Confirm DNS still points at the VPS and Traefik logs
(`kubectl logs -n kube-system deploy/traefik`) show the ACME challenge.

## Changing config

- **Different Supabase project / public env** → edit `.env.production`, push.
- **Domain** → `values.yaml` `domain:` (and update DNS).
- **Resources / replicas** → `values.yaml`.
