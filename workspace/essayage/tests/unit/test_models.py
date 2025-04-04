import pytest
from app.models.face import Point2D, Point3D, FaceLandmarks, GlassesPosition

def test_point2d_creation():
    point = Point2D(x=1.0, y=2.0)
    assert point.x == 1.0
    assert point.y == 2.0

def test_point3d_creation():
    point = Point3D(x=1.0, y=2.0, z=3.0)
    assert point.x == 1.0
    assert point.y == 2.0
    assert point.z == 3.0

def test_face_landmarks_creation():
    landmarks = [
        Point2D(x=1.0, y=2.0),
        Point2D(x=3.0, y=4.0)
    ]
    face_landmarks = FaceLandmarks(
        landmarks=landmarks,
        image_width=640,
        image_height=480
    )
    assert len(face_landmarks.landmarks) == 2
    assert face_landmarks.image_width == 640
    assert face_landmarks.image_height == 480

def test_glasses_position_creation():
    position = Point3D(x=1.0, y=2.0, z=3.0)
    rotation = Point3D(x=0.1, y=0.2, z=0.3)
    scale = Point3D(x=1.0, y=1.0, z=1.0)
    
    glasses_pos = GlassesPosition(
        position=position,
        rotation=rotation,
        scale=scale
    )
    
    assert glasses_pos.position.x == 1.0
    assert glasses_pos.rotation.y == 0.2
    assert glasses_pos.scale.z == 1.0

def test_invalid_point2d():
    with pytest.raises(ValueError):
        Point2D(x="invalid", y=2.0)

def test_invalid_face_landmarks():
    with pytest.raises(ValueError):
        FaceLandmarks(
            landmarks=[],  # Liste vide non valide
            image_width=-1,  # Largeur négative non valide
            image_height=480
        ) 