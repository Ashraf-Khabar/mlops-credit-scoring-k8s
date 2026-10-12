kubectl get svc -n argocd
kubectl port-forward svc/argocd-server 8083:443 -n argocd