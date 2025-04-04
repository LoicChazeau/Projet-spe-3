from fastapi import FastAPI
import cv2

app = FastAPI()

# Initialiser la capture vidéo depuis la webcam (indice 0)
cap = cv2.VideoCapture(0)

# Définir la largeur et la hauteur du cadre (facultatif)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

while True:
    # Capturer image par image
    ret, frame = cap.read()

    if not ret:
        print("Erreur lors de la capture de l'image")
        break

    # Afficher l'image capturée
    cv2.imshow('Flux vidéo', frame)

    # Quitter la boucle si la touche 'q' est enfoncée
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Libérer la capture et fermer les fenêtres
cap.release()
cv2.destroyAllWindows()

@app.get("/")
def read_root():
    return {"message": "Service Essayage is up!"}