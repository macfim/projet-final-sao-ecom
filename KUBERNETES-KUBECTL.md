# Kubernetes Deployment (kubectl)

Deploy using pure Kubernetes manifests with `kubectl`.

## Prerequisites

- Docker Desktop with Kubernetes enabled
- kubectl installed

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

## Step 3: Deploy

```bash
kubectl apply -f k8s/
```

## Step 4: Monitor Deployment

```bash
kubectl get pods -n ecommerce -w
```

Wait until all pods show `Running` status.

## Step 5: Access Application

```bash
kubectl port-forward -n ecommerce svc/api-gateway 3000:3000
```

Access: http://localhost:3000

## Update Deployment

Edit files in `k8s/` and apply:

```bash
kubectl apply -f k8s/
```

## Clean Up

```bash
kubectl delete -f k8s/
kubectl delete namespace ecommerce
```

