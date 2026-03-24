from flask import Flask, jsonify, request
import numpy as np
import json
import tensorflow as tf
from PIL import Image
import os
import time
import threading

app = Flask(__name__)

# -------------------- CONFIG --------------------

MODEL_PATH = "model/plant_disease_classification.keras"
LABELS_PATH = "plant_disease.json"
STATE_FILE = "state.json"
RESULTS_FILE = "results.json"
IMAGE_FOLDER = "./Images"

# -------------------- LOAD MODEL --------------------

print("Loading model...")
model = tf.keras.models.load_model(MODEL_PATH)
print("Model loaded successfully!")

with open(LABELS_PATH, 'r') as file:
    plant_disease = json.load(file)

# -------------------- STATE MANAGEMENT --------------------

def load_state():
    if not os.path.exists(STATE_FILE):
        return {"processed": []}
    try:
        with open(STATE_FILE, "r") as f:
            data = json.load(f)
            if "processed" not in data:
                data["processed"] = []
            return data
    except json.JSONDecodeError:
        # File exists but empty or invalid, reset it
        return {"processed": []}


def save_state(state):
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)

# -------------------- RESULT STORAGE --------------------

def save_result(new_result):
    if os.path.exists(RESULTS_FILE):
        try:
            with open(RESULTS_FILE, "r") as f:
                data = json.load(f)
        except:
            data = []
    else:
        data = []

    data.append(new_result)

    with open(RESULTS_FILE, "w") as f:
        json.dump(data, f, indent=2)

# -------------------- IMAGE PROCESSING --------------------

def process_image(image_path):
    img = Image.open(image_path).resize((160, 160))

    img_array = tf.keras.utils.img_to_array(img)
    img_array = np.array([img_array]) / 255.0  # normalization

    prediction = model.predict(img_array)
    prediction_label = plant_disease[prediction.argmax()]

    return prediction_label

# -------------------- FOLDER SCANNER --------------------

def scan_folder():
    while True:
        state = load_state()
        processed_set = set(state["processed"])

        if not os.path.exists(IMAGE_FOLDER):
            os.makedirs(IMAGE_FOLDER)

        files = os.listdir(IMAGE_FOLDER)

        for file in files:
            file_path = os.path.join(IMAGE_FOLDER, file)

            # Skip already processed
            if file_path in processed_set:
                continue

            # Only process images
            if not file.lower().endswith(('.png', '.jpg', '.jpeg')):
                continue

            print(f"\nProcessing new image: {file_path}")

            try:
                prediction = process_image(file_path)

                print(f"Prediction: {prediction}")

                # ✅ Save result (fixed JSON format)
                save_result({
                    "image": file_path,
                    "prediction": prediction
                })

                # ✅ Update state
                state["processed"].append(file_path)

            except Exception as e:
                print(f"Error processing {file_path}: {e}")

        save_state(state)

        time.sleep(5)  # scan every 5 seconds

# -------------------- OPTIONAL API --------------------

@app.route('/predict-file', methods=['POST'])
def predict_file():
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files['image']
    img = Image.open(file.stream).resize((160, 160))

    img_array = tf.keras.utils.img_to_array(img)
    img_array = np.array([img_array]) / 255.0

    prediction = model.predict(img_array)
    prediction_label = plant_disease[prediction.argmax()]

    return jsonify({
        "success": True,
        "prediction": prediction_label
    })

# -------------------- MAIN --------------------

if __name__ == "__main__":
    # Start background scanner
    scanner_thread = threading.Thread(target=scan_folder)
    scanner_thread.daemon = True
    scanner_thread.start()

    print("AI server running...")
    print(f"Watching folder: {IMAGE_FOLDER}")

    app.run(debug=True)
