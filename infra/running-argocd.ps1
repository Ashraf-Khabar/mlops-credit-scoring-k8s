kubectl get svc -n argocd
kubectl port-forward svc/argocd-server 8081:80 -n argocd