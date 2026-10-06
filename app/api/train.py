from sklearn.linear_model import LogisticRegression
import joblib
import numpy as np

# [age, revenu] -> 0 (Risque élevé), 1 (Accepté)
X = np.array([[22, 15000], [45, 80000], [25, 30000], [50, 120000]])
y = np.array([0, 1, 0, 1])

model = LogisticRegression()
model.fit(X, y)
joblib.dump(model, 'model.joblib')