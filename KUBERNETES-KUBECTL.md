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

This includes Prometheus and Grafana for monitoring.

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

## Monitoring & Observability

### Access Prometheus

```bash
kubectl port-forward -n ecommerce svc/prometheus 9090:9090
```

Access: http://localhost:9090

Prometheus automatically scrapes:
- **Application metrics**: All services with `prometheus.io/scrape: "true"` annotation
- **Cluster metrics**: Kubernetes nodes and pods

### Access Grafana

```bash
kubectl port-forward -n ecommerce svc/grafana 3001:3000
```

Access: http://localhost:3001
- Username: `admin`
- Password: `admin`

Grafana includes a pre-configured dashboard showing:
- Pod status
- CPU usage
- Memory usage

## Clean Up

```bash
kubectl delete -f k8s/
kubectl delete namespace ecommerce
```

