from flask import Blueprint, send_from_directory, current_app

main_bp = Blueprint("main", __name__)


@main_bp.route("/")
def index():
    return send_from_directory(current_app.static_folder, "index.html")


@main_bp.route("/<path:filename>")
def serve_static(filename):
    return send_from_directory(current_app.static_folder, filename)
