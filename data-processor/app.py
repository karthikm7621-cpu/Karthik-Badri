import logging
import os
from flask import Flask, jsonify, request, render_template

# Configure standard Python logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/process", methods=["POST"])
def process_data():
    """
    Secure RESTful API endpoint that accepts JSON POST requests, processes the data,
    and returns a JSON payload. Includes comprehensive error handling.
    """
    try:
        data = request.get_json()
        if not data:
            logger.warning("No JSON data provided in the request payload.")
            return jsonify({"error": "Invalid or missing JSON payload"}), 400

        # Core data processing logic (e.g., transforming, aggregating, or analyzing the data)
        # Here we simulate data processing by calculating statistics on the incoming JSON keys
        processed_result = {
            "status": "success",
            "metadata": {
                "items_processed": len(data.keys()),
                "data_types": {k: type(v).__name__ for k, v in data.items()},
            },
            "original_data": data,
        }

        logger.info(f"Successfully processed {len(data.keys())} items.")
        return jsonify(processed_result), 200

    except Exception as e:
        logger.error(f"Error processing data: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
