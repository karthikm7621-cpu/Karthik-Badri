from flask import Flask
from werkzeug.security import generate_password_hash

from app.extensions import db

def create_app(config_object=None):
    app = Flask(__name__, static_folder="../static")
    
    # Configuration
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///ems.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JSON_SORT_KEYS"] = False
    
    if config_object:
        app.config.update(config_object)
        
    try:
        from flask_cors import CORS
        CORS(app)
    except ImportError:
        pass

    # Initialize extensions
    db.init_app(app)

    # Register blueprints
    from app.routes.main import main_bp
    from app.routes.api import api_bp
    app.register_blueprint(main_bp)
    app.register_blueprint(api_bp)

    @app.before_request
    def seed_default_users_if_needed():
        from app.models import User
        if not app.config.get("_seeded", False):
            # Workaround for setting config before request in multi-threaded environment
            app.config["_seeded"] = True
            try:
                db.create_all()
                if not User.query.filter_by(username="Owner1").first():
                    db.session.add(
                        User(
                            username="Owner1",
                            password_hash=generate_password_hash("Karthik@7621"),
                            role="Main Owner",
                            status="Active",
                            stream="Backend",
                        )
                    )
                if not User.query.filter_by(username="karthik").first():
                    db.session.add(
                        User(
                            username="karthik",
                            password_hash=generate_password_hash("Karthik@7621"),
                            role="Employee",
                            status="Active",
                            stream="Frontend",
                        )
                    )
                db.session.commit()
            except Exception:
                db.session.rollback()

    return app
