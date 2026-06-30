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
    from app.routes.auth import auth_bp
    from app.routes.hr import hr_bp
    from app.routes.attendance import attendance_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(api_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(hr_bp)
    app.register_blueprint(attendance_bp)

    import logging
    from flask import request
    from datetime import datetime

    # Setup audit logger
    audit_logger = logging.getLogger("audit")
    audit_logger.setLevel(logging.INFO)
    file_handler = logging.FileHandler("audit.log")
    file_handler.setFormatter(logging.Formatter("%(asctime)s - %(message)s"))
    audit_logger.addHandler(file_handler)

    @app.before_request
    def log_api_requests():
        if request.path.startswith("/api/"):
            audit_logger.info(f"Method: {request.method} | Path: {request.path} | IP: {request.remote_addr}")

    @app.before_request
    def seed_default_users_if_needed():
        from app.models import User, Employee

        if not app.config.get("_seeded", False):
            # Workaround for setting config before request in multi-threaded environment
            app.config["_seeded"] = True
            try:
                db.create_all()
                if not User.query.filter_by(username="Owner1").first():
                    owner_user = User(
                        username="Owner1",
                        password_hash=generate_password_hash("Karthik@7621"),
                        role="Main Owner",
                        status="Active",
                        stream="Backend",
                    )
                    db.session.add(owner_user)
                    
                    owner_emp = Employee(
                        employee_id_string="EMP-1000",
                        full_name="Owner1",
                        department="Backend",
                        role="Main Owner",
                        username="Owner1",
                        status="Active",
                        stream="Backend"
                    )
                    db.session.add(owner_emp)

                if not User.query.filter_by(username="karthik").first():
                    karthik_user = User(
                        username="karthik",
                        password_hash=generate_password_hash("Karthik@7621"),
                        role="Employee",
                        status="Active",
                        stream="Frontend",
                    )
                    db.session.add(karthik_user)
                    
                    karthik_emp = Employee(
                        employee_id_string="EMP-1001",
                        full_name="karthik",
                        department="Frontend",
                        role="Employee",
                        username="karthik",
                        status="Active",
                        stream="Frontend"
                    )
                    db.session.add(karthik_emp)

                db.session.commit()
            except Exception as e:
                db.session.rollback()

    return app
