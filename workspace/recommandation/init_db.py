from database import SessionLocal, Glasses, Style

def init_db():
    db = SessionLocal()
    try:
        # Création des styles
        styles = {
            "classique": Style(name="classique"),
            "moderne": Style(name="moderne"),
            "sport": Style(name="sport"),
            "vintage": Style(name="vintage")
        }
        
        for style in styles.values():
            db.add(style)
        db.commit()

        # Création des lunettes
        glasses_data = [
            {
                "brand": "RayBan",
                "model": "Wayfarer",
                "image_url": "rayban_wayfarer.jpg",
                "category": "rectangulaires",
                "price": 159.99,
                "description": "Lunettes rectangulaires classiques",
                "styles": [styles["classique"], styles["vintage"]]
            },
            {
                "brand": "Oakley",
                "model": "Round",
                "image_url": "oakley_round.jpg",
                "category": "rondes",
                "price": 129.99,
                "description": "Lunettes rondes modernes",
                "styles": [styles["moderne"], styles["sport"]]
            },
            {
                "brand": "Police",
                "model": "Square",
                "image_url": "police_square.jpg",
                "category": "carrées",
                "price": 189.99,
                "description": "Lunettes carrées élégantes",
                "styles": [styles["moderne"], styles["classique"]]
            },
            {
                "brand": "Gucci",
                "model": "Oval",
                "image_url": "gucci_oval.jpg",
                "category": "ovales",
                "price": 249.99,
                "description": "Lunettes ovales luxueuses",
                "styles": [styles["classique"], styles["moderne"]]
            }
        ]

        for glass_data in glasses_data:
            glass = Glasses(
                brand=glass_data["brand"],
                model=glass_data["model"],
                image_url=glass_data["image_url"],
                category=glass_data["category"],
                price=glass_data["price"],
                description=glass_data["description"]
            )
            glass.styles.extend(glass_data["styles"])
            db.add(glass)

        db.commit()
        print("Base de données initialisée avec succès!")

    except Exception as e:
        print(f"Erreur lors de l'initialisation de la base de données: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db() 