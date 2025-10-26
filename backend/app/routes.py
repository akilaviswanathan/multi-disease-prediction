# Updated backend/app/routes.py
from flask import Blueprint, request, jsonify
from .models import predict_disease, predict_all_diseases  # Add predict_all import

bp = Blueprint('api', __name__)

@bp.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if not data or 'disease' not in data or 'data' not in data:
            return jsonify({"error": "Missing 'disease' or 'data' in request"}), 400
        result = predict_disease(data['disease'], data['data'])
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/multi-predict', methods=['POST'])
def multi_predict():
    try:
        data = request.get_json()
        if not data or 'data' not in data:
            return jsonify({"error": "Missing 'data' in request (dict of {disease: [features]})"}), 400
        results = predict_all_diseases(data['data'])
        return jsonify({"results": results}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500