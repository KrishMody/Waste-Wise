import os
import cv2
import numpy as np
import onnxruntime as ort

MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "model", "best.onnx"))

CLASS_NAMES = [
    'Air-Conditioner', 'Bar-Phone', 'Battery', 'Blood-Pressure-Monitor', 'Boiler',
    'CRT-Monitor', 'CRT-TV', 'Calculator', 'Camera', 'Ceiling-Fan',
    'Christmas-Lights', 'Clothes-Iron', 'Coffee-Machine', 'Compact-Fluorescent-Lamps',
    'Computer-Keyboard', 'Computer-Mouse', 'Cooled-Dispenser', 'Cooling-Display',
    'Dehumidifier', 'Desktop-PC', 'Digital-Oscilloscope', 'Dishwasher', 'Drone',
    'Electric-Bicycle', 'Electric-Guitar', 'Electrocardiograph-Machine', 'Electronic-Keyboard',
    'Exhaust-Fan', 'Flashlight', 'Flat-Panel-Monitor', 'Flat-Panel-TV', 'Floor-Fan',
    'Freezer', 'Glucose-Meter', 'HDD', 'Hair-Dryer', 'Headphone', 'LED-Bulb',
    'Laptop', 'Microwave', 'Music-Player', 'Neon-Sign', 'Network-Switch',
    'Non-Cooled-Dispenser', 'Oven', 'PCB', 'Patient-Monitoring-System', 'Photovoltaic-Panel',
    'PlayStation-5', 'Power-Adapter', 'Printer', 'Projector', 'Pulse-Oximeter',
    'Range-Hood', 'Refrigerator', 'Rotary-Mower', 'Router', 'SSD', 'Server',
    'Smart-Watch', 'Smartphone', 'Smoke-Detector', 'Soldering-Iron', 'Speaker',
    'Stove', 'Straight-Tube-Fluorescent-Lamp', 'Street-Lamp', 'TV-Remote-Control',
    'Table-Lamp', 'Tablet', 'Telephone-Set', 'Toaster', 'Tumble-Dryer',
    'USB-Flash-Drive', 'Vacuum-Cleaner', 'Washing-Machine', 'Xbox-Series-X'
]

# Statutory Hazard Tier and Guidance Rules
HAZARD_RULES = {
    # Tier 1: Critical Fire, Chemical & Bio Hazards
    "Battery": ("Immediate Hazard", "Class I", "Lithium cell prone to thermal runaway, fire, and toxic HF gas release.", "Do not crush. Insulate terminals with tape and deposit in a specialized sand-buffered hazardous e-waste kiosk."),
    "Smoke-Detector": ("Immediate Hazard", "Class I", "Contains trace Americium-241 ionizing radiation source.", "Must not enter general scrap. Hand over to specialized hazardous waste processing."),
    "Blood-Pressure-Monitor": ("Immediate Hazard", "Class I", "Potential elemental mercury and medical contamination risk.", "Do not puncture. Channel directly to certified bio-medical/hazardous e-waste facilities."),
    "Patient-Monitoring-System": ("Immediate Hazard", "Class I", "Institutional medical electronic assembly.", "Mandatory channelization to clinical e-waste recyclers."),
    "Pulse-Oximeter": ("Immediate Hazard", "Class I", "Button cell and bio-electronic casing.", "Remove batteries before drop-off at an authorized e-waste facility."),
    "Glucose-Meter": ("Immediate Hazard", "Class I", "Bio-chemical residue and lithium cell hazard.", "Dispose via specialized medical electronics take-back collection."),

    # Tier 2: Heavy Metal & Toxic Phosphors
    "CRT-Monitor": ("Regulated", "Class II", "Funnel glass contains high lead oxide concentrations and implosion risk.", "Handle with heavy cushioning. Deliver to licensed glass/CRT dismantler."),
    "CRT-TV": ("Regulated", "Class II", "High lead oxide and toxic phosphor powder content.", "Do not crack casing. Must be processed by authorized WEEE recycling facility."),
    "Compact-Fluorescent-Lamps": ("Regulated", "Class II", "Contains toxic vaporized elemental mercury.", "Package intact in protective cartons; dispose via authorized lamp collection bins."),
    "Straight-Tube-Fluorescent-Lamp": ("Regulated", "Class II", "Contains toxic vaporized elemental mercury.", "Prevent glass breakage; requires mercury recovery distillation."),
    "Neon-Sign": ("Regulated", "Class II", "Inert/toxic gas blend and high-voltage transformer coils.", "Deliver to commercial electrical waste recovery center."),
    "PCB": ("Regulated", "Class II", "High concentrations of lead solder, cadmium, and brominated flame retardants.", "Strictly prohibited from landfills. Requires hydrometallurgical metal recovery."),

    # Tier 3: Halogenated Refrigerants & Heavy Cooling
    "Air-Conditioner": ("Regulated", "Class II", "Contains ozone-depleting refrigerant gases (HFCs/HCFCs).", "Must undergo certified gas evacuation before compressor and coil scrap recovery."),
    "Refrigerator": ("Regulated", "Class II", "Contains refrigerant fluid and compressor lubricants.", "Requires professional degassing at an authorized municipal processing hub."),
    "Freezer": ("Regulated", "Class II", "Pressurized cooling loop with chemical refrigerants.", "Depressurize and evacuate refrigerant prior to scrap shredding."),
    "Dehumidifier": ("Regulated", "Class II", "Compressor circuit fluids and cooling agents.", "Hand over to white-goods e-waste collection depot."),
    "Cooled-Dispenser": ("Regulated", "Class II", "Pressurized refrigerant and condenser elements.", "Dispose through licensed commercial cooling appliance handlers."),
    "Cooling-Display": ("Regulated", "Class II", "Commercial refrigerant inventory.", "Route to industrial refrigeration recovery unit.")
}

DEFAULT_HAZARD = ("Low Risk", "Class III", "General electrical scrap with minimal hazardous chemical leaching risk.", "Route to municipal e-waste bin or consumer drop-off point for material recovery.")

# Initialize ONNX Runtime Session
session = None
input_name = None
output_name = None

if os.path.exists(MODEL_PATH):
    session = ort.InferenceSession(MODEL_PATH, providers=["CPUExecutionProvider"])
    input_name = session.get_inputs()[0].name
    output_name = session.get_outputs()[0].name
    print(f"[AI MODEL] Loaded ONNX model from {MODEL_PATH}")
else:
    print(f"[AI MODEL WARNING] Model file not found at {MODEL_PATH}. Check file path.")


def preprocess_image(img: np.ndarray, img_size: int = 640):
    """Applies letterbox padding and normalization for YOLOv8."""
    h, w = img.shape[:2]
    scale = min(img_size / h, img_size / w)
    nh, nw = int(h * scale), int(w * scale)
    resized = cv2.resize(img, (nw, nh), interpolation=cv2.INTER_LINEAR)

    top = (img_size - nh) // 2
    bottom = img_size - nh - top
    left = (img_size - nw) // 2
    right = img_size - nw - left
    padded = cv2.copyMakeBorder(resized, top, bottom, left, right, cv2.BORDER_CONSTANT, value=(114, 114, 114))

    tensor = padded[:, :, ::-1].transpose(2, 0, 1).astype(np.float32) / 255.0
    return np.expand_dims(tensor, axis=0)


def classify_waste_item(hint_text: str = "", filename: str = "", image_bytes: bytes = None) -> dict:
    """
    Runs YOLO ONNX detection on the uploaded image.
    Falls back gracefully if no image is supplied or no box meets threshold.
    """
    if session is not None and image_bytes:
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if img is not None:
                inp = preprocess_image(img)
                preds = session.run([output_name], {input_name: inp})[0]

                # YOLOv8 output shape: [1, 81, 8400] (4 box coordinates + 77 classes)
                preds = np.transpose(preds[0], (1, 0))  # [8400, 81]
                raw_boxes = preds[:, :4]
                scores = preds[:, 4:]

                class_ids = np.argmax(scores, axis=1)
                confidences = np.max(scores, axis=1)

                best_idx = int(np.argmax(confidences))
                best_conf = float(confidences[best_idx])
                top_label = CLASS_NAMES[class_ids[best_idx]]

                # Log detection telemetry to terminal
                print(f"[YOLO INFERENCE] Detected: {top_label} with confidence: {best_conf:.3f}")

                # Adjusted sensitivity threshold for real-world webcam conditions
                if best_conf >= 0.12:
                    detected_class = top_label
                    tier, hazard_class, rationale, instructions = HAZARD_RULES.get(detected_class, DEFAULT_HAZARD)

                    # Compute bounding box scaled back to original image size
                    orig_h, orig_w = img.shape[:2]
                    scale = min(640 / orig_h, 640 / orig_w)
                    pad_x = (640 - int(orig_w * scale)) // 2
                    pad_y = (640 - int(orig_h * scale)) // 2

                    cx, cy, bw, bh = raw_boxes[best_idx]
                    x1 = max(0, int((cx - bw / 2 - pad_x) / scale))
                    y1 = max(0, int((cy - bh / 2 - pad_y) / scale))
                    w_box = min(orig_w - x1, int(bw / scale))
                    h_box = min(orig_h - y1, int(bh / scale))

                    return {
                        "item_name": detected_class.replace("-", " "),
                        "stream_type": "E-Waste",
                        "hazard_tier": tier,
                        "hazard_class": hazard_class,
                        "confidence_score": round(best_conf, 2),
                        "box": {
                            "x": x1,
                            "y": y1,
                            "width": w_box,
                            "height": h_box
                        },
                        "hazard_rationale": rationale,
                        "disposal_instructions": instructions
                    }
        except Exception as e:
            print(f"[INFERENCE ERROR] {e}")

    # Fallback response if image had no clear detection or manual hint was provided
    item_hint = (hint_text or filename or "General E-Waste").lower()
    for key, (tier, h_class, rationale, instructions) in HAZARD_RULES.items():
        if key.lower() in item_hint:
            return {
                "item_name": key.replace("-", " "),
                "stream_type": "E-Waste",
                "hazard_tier": tier,
                "hazard_class": h_class,
                "confidence_score": 0.85,
                "box": None,
                "hazard_rationale": rationale,
                "disposal_instructions": instructions
            }

    tier, h_class, rationale, instructions = DEFAULT_HAZARD
    return {
        "item_name": "Electronic Component (General)",
        "stream_type": "E-Waste",
        "hazard_tier": tier,
        "hazard_class": h_class,
        "confidence_score": 0.80,
        "box": None,
        "hazard_rationale": rationale,
        "disposal_instructions": instructions
    }