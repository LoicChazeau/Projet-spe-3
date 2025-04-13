from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import json
import os

app = FastAPI(title="Optical Factory Recommendation Service")

# Chargement des données de montures
with open('data/frames.json', 'r') as f:
    FRAMES_DATA = json.load(f)

class RecommendationRequest(BaseModel):
    user_id: str
    preferences: Dict

class FrameRecommendation(BaseModel):
    frame_id: str
    name: str
    brand: str
    style: str
    color: str
    score: float

def calculate_similarity(user_prefs: Dict, frame: Dict) -> float:
    """
    Calcule la similarité entre les préférences utilisateur et une monture.
    """
    # Poids pour chaque caractéristique
    weights = {
        'style': 0.4,
        'color': 0.3,
        'brand': 0.2,
        'price': 0.1
    }
    
    score = 0
    for feature, weight in weights.items():
        if feature in user_prefs and feature in frame:
            if feature == 'price':
                # Pour le prix, on préfère les montures moins chères
                max_price = max(f['price'] for f in FRAMES_DATA)
                score += weight * (1 - frame['price'] / max_price)
            else:
                # Pour les autres caractéristiques, on utilise une correspondance exacte
                score += weight * (1 if user_prefs[feature] == frame[feature] else 0)
    
    return score

@app.post("/recommendations", response_model=List[FrameRecommendation])
async def get_recommendations(request: RecommendationRequest):
    try:
        # Calcul des scores pour chaque monture
        recommendations = []
        for frame in FRAMES_DATA:
            score = calculate_similarity(request.preferences, frame)
            recommendations.append(FrameRecommendation(
                frame_id=frame['id'],
                name=frame['name'],
                brand=frame['brand'],
                style=frame['style'],
                color=frame['color'],
                score=score
            ))
        
        # Tri par score décroissant
        recommendations.sort(key=lambda x: x.score, reverse=True)
        
        # Retourne les 5 meilleures recommandations
        return recommendations[:5]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}