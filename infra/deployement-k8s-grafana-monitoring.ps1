# Define variables
$MONITORING = "k8s-grafana-monitoring"
$NAMESPACE = "default"

Write-Host "Updating Helm repositories..." -ForegroundColor Cyan
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

Write-Host "`nInstalling/Upgrading Prometheus Stack..." -ForegroundColor Cyan
helm upgrade --install $MONITORING prometheus-community/kube-prometheus-stack --namespace=$NAMESPACE

Write-Host "`nWaiting for Grafana deployment to be ready (this can take a minute)..." -ForegroundColor Yellow
# This command intelligently waits for the pod to be fully ready instead of a hardcoded 5 seconds
kubectl rollout status deployment/$MONITORING-grafana -n $NAMESPACE

Write-Host "`nStarting port-forwarding in the background (daemon mode)..." -ForegroundColor Cyan
# Run port-forward in a background PowerShell job
Start-Job -Name "GrafanaTunnel" -ScriptBlock {
    param($mon_name,$ns)
    kubectl port-forward svc/$mon_name-grafana 8081:80 -n$ns
} -ArgumentList $MONITORING,$NAMESPACE | Out-Null

Write-Host "`nGrafana is now running in the background!" -ForegroundColor Green
Write-Host "URL: http://localhost:8081" -ForegroundColor White

# Extract the default password directly from the Kubernetes secret
$GRAFANA_PASSWORD = kubectl get secret $MONITORING -n $NAMESPACE -o jsonpath="{.data.admin-password}"
$DECODED_PASSWORD = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($GRAFANA_PASSWORD))

Write-Host "Username: admin" -ForegroundColor White
Write-Host "Password: $DECODED_PASSWORD" -ForegroundColor White

kubectl port-forward svc/k8s-grafana-monitoring 8081:80 --address 0.0.0.0