# Kubernetes Deployment (ArgoCD + Helm)

Deploy using **ArgoCD** (GitOps) with **Helm** charts for automated deployments.

**How it works:** ArgoCD watches your Git repository and uses Helm charts to deploy automatically.

## Prerequisites

- Docker Desktop with Kubernetes enabled
- kubectl installed
- Helm 3.x installed
- Git repository

## Step 1: Enable Kubernetes

1. Docker Desktop → Settings → Kubernetes → Enable
2. Verify:

```bash
kubectl cluster-info
```

## Step 2: Build Docker Images

```bash
docker build -t user-service:latest ./user-service
docker build -t product-service:latest ./product-service
docker build -t order-service:latest ./order-service
docker build -t notification-service:latest ./notification-service
docker build -t api-gateway:latest ./api-gateway
```

## Step 3: Install ArgoCD

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl get pods -n argocd -w
```

Wait for all pods to be Running (1-2 minutes).

## Step 4: Access ArgoCD UI

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Get password:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

Access: https://localhost:8080 (Username: `admin`)

## Step 5: Deploy Application

```bash
kubectl apply -f argocd/application.yaml
```

ArgoCD uses your Helm chart (`helm/ecommerce/`) to deploy automatically.

## Step 6: Monitor Deployment

```bash
kubectl get applications -n argocd
kubectl get pods -n ecommerce -w
```

Wait until all pods show `Running` status.

## Step 7: Access Application

```bash
kubectl port-forward -n ecommerce svc/api-gateway 3000:3000
```

Access: http://localhost:3000

## Future Deployments (GitOps)

1. Update `helm/ecommerce/values.yaml` or templates
2. Commit and push:

```bash
git add helm/ecommerce/
git commit -m "Update deployment"
git push origin main
```

3. ArgoCD automatically deploys!

## Clean Up

```bash
kubectl delete application ecommerce -n argocd
kubectl delete namespace ecommerce
```

## Alternative Deployment Methods

- **kubectl only:** See `KUBERNETES-KUBECTL.md`
- **Helm only:** See `KUBERNETES-HELM.md`
