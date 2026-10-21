import os
import cv2
import numpy as np
import onnxruntime as ort

MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "model", "best.onnx"))
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
    # =========================================================================
    # TIER 1: CLASS I — IMMEDIATE HAZARD (Fire, Heavy Chemical, Radiation & Bio)
    # =========================================================================
    "Battery": (
        "Immediate Hazard", "Class I",
        "Lithium or heavy metal cell prone to thermal runaway, spontaneous fire, and toxic hydrofluoric acid gas release.",
        "Do not puncture or crush. Insulate contact terminals with non-conductive tape and deposit in a specialized sand-buffered hazardous e-waste kiosk."
    ),
    "Smoke-Detector": (
        "Immediate Hazard", "Class I",
        "Contains an ionizing radiation micro-source (Americium-241) and sensitive detection circuits.",
        "Must not enter general or municipal scrap. Hand over intact to specialized radiological/hazardous waste processing facilities."
    ),
    "Blood-Pressure-Monitor": (
        "Immediate Hazard", "Class I",
        "Potential toxic elemental mercury column and clinical bio-hazard contamination risk.",
        "Do not break casing or manometer tube. Channel directly to certified biomedical and hazardous e-waste recovery centers."
    ),
    "Patient-Monitoring-System": (
        "Immediate Hazard", "Class I",
        "Institutional clinical medical electronics assembly with bio-chemical residue and high-density capacitors.",
        "Mandatory channelization to certified bio-medical clinical equipment recyclers. Decontaminate before shipment."
    ),
    "Pulse-Oximeter": (
        "Immediate Hazard", "Class I",
        "Miniature lithium button-cell and clinical photoplethysmographic sensor assembly.",
        "Remove lithium cells before disposal; deposit both module and battery in certified clinical e-waste containment."
    ),
    "Glucose-Meter": (
        "Immediate Hazard", "Class I",
        "Contains potential blood-borne bio-chemical residue, micro-reagent traces, and coin cell battery.",
        "Dispose via specialized medical electronics take-back collection. Never mix with standard dry recyclables."
    ),
    "Electrocardiograph-Machine": (
        "Immediate Hazard", "Class I",
        "Clinical diagnostic hardware with high-voltage defibrillation protection circuits and bio-sensor lead hazards.",
        "Route strictly through licensed medical equipment disposal channels for decontamination and controlled component recovery."
    ),
    "Electric-Bicycle": (
        "Immediate Hazard", "Class I",
        "High-capacity lithium-ion traction battery pack (36V-48V) susceptible to catastrophic thermal runaway and arc flash.",
        "Discharge and isolate traction battery pack. Ship under hazardous goods protocols directly to authorized high-voltage lithium recyclers."
    ),
    "Photovoltaic-Panel": (
        "Immediate Hazard", "Class I",
        "Contains hazardous heavy metals including cadmium telluride, lead solder matrix, and antimony-doped glass.",
        "Prevent glass fracture and water leaching. Transport intact to specialized photovoltaic recovery centers for thermal/chemical delamination."
    ),

    # =========================================================================
    # TIER 2: CLASS II — REGULATED WASTE (Lead Glass, Mercury, PCBs, Refrigerants)
    # =========================================================================
    # Leaded Funnel Glass & Phosphor Coatings
    "CRT-Monitor": (
        "Regulated", "Class II",
        "Cathode ray funnel glass contains up to 2-3 kg of hazardous lead oxide and explosive implosion hazard under vacuum.",
        "Handle with protective cushioning. Strictly prohibited from shredders; deliver intact to licensed CRT glass recovery facilities."
    ),
    "CRT-TV": (
        "Regulated", "Class II",
        "Vacuum tube containing heavy lead oxide glass matrix, internal toxic phosphor powders, and barium getter.",
        "Do not crack screen or puncture neck. Must undergo certified manual dismantling and lead extraction at an authorized WEEE facility."
    ),
    "Compact-Fluorescent-Lamps": (
        "Regulated", "Class II",
        "Contains vaporized elemental mercury (Hg) and hazardous rare-earth phosphor powder coatings.",
        "Package intact in protective sleeves to prevent fracture. Deposit in dedicated mercury vapor recovery distillation bins."
    ),
    "Straight-Tube-Fluorescent-Lamp": (
        "Regulated", "Class II",
        "Pressurized mercury vapor discharge tube and hazardous phosphor powder lining.",
        "Prevent tube breakage. Must be processed using negative-pressure mercury drum-top crushers with activated carbon filtration."
    ),
    "Neon-Sign": (
        "Regulated", "Class II",
        "High-voltage step-up transformer coils, lead solder terminals, and noble/mercury gas discharge tubes.",
        "Handle fragile glass tubes with care; deliver to certified commercial illumination scrap and hazardous electrical dismantlers."
    ),

    # Circuit Boards & Core Electronic Assemblies
    "PCB": (
        "Regulated", "Class II",
        "Dense concentrations of lead-tin solder, brominated flame retardants (BFRs), beryllium copper, and cadmium.",
        "Strictly prohibited from landfills and open burning. Requires authorized hydrometallurgical or pyrometallurgical precious metal recovery."
    ),
    "Desktop-PC": (
        "Regulated", "Class II",
        "Complex assembly containing motherboards, tantalum/electrolytic capacitors, power supply units, and lead solder joints.",
        "Dismantle peripheral cards; route motherboards and power modules to licensed WEEE segregation hubs for multi-stream material sorting."
    ),
    "Server": (
        "Regulated", "Class II",
        "High-density multi-socket printed circuit boards, high-power redundant power units, and gold/palladium contacts.",
        "Decommission storage media securely; dispatch enterprise chassis to certified commercial IT asset disposition (ITAD) facilities."
    ),
    "Power-Adapter": (
        "Regulated", "Class II",
        "High-voltage electrolytic filter capacitors, copper windings, and flame-retarded ABS/polycarbonate casings.",
        "Deposit in designated small IT equipment collection bins. Requires automated granulation and copper recovery."
    ),
    "Digital-Oscilloscope": (
        "Regulated", "Class II",
        "Precision instrumentation populated with high-grade multi-layer PCBs, calibrated attenuation networks, and power converters.",
        "Channel through specialized test equipment refurbishers or certified electronic instrumentation reclaimers."
    ),
    "Soldering-Iron": (
        "Regulated", "Class II",
        "High-temperature heating cartridge and tip contaminated with leaded solder residue, rosin fluxes, and nichrome wire.",
        "Isolate tip and cord; deliver to specialized workshop electronics collection point."
    ),

    # Halogenated Refrigerants, Compressors & Heavy Thermal Appliances
    "Air-Conditioner": (
        "Regulated", "Class II",
        "Pressurized refrigeration loop containing ozone-depleting and high-GWP fluorinated greenhouse gases (HFC/HCFC/CFC).",
        "Mandatory recovery and certified evacuation of refrigerant gases before compressor stripping and aluminum/copper heat exchanger recovery."
    ),
    "Refrigerator": (
        "Regulated", "Class II",
        "Pressurized refrigerant fluid, cyclopentane insulation blowing agents, and compressor lubricating oil.",
        "Requires professional degassing and oil drainage at an authorized municipal processing hub prior to shredder processing."
    ),
    "Freezer": (
        "Regulated", "Class II",
        "Hermetically sealed compressor charging system filled with pressurized fluorocarbon refrigerants and compressor lubricants.",
        "Evacuate refrigerant gas under closed-loop recovery before mechanical shearing and polyurethane foam degassing."
    ),
    "Dehumidifier": (
        "Regulated", "Class II",
        "Integrated miniature refrigeration compressor circuit, heat exchanger fins, and condensate collector.",
        "Deliver to white-goods collection depots equipped with certified gas recovery and condenser drain units."
    ),
    "Cooled-Dispenser": (
        "Regulated", "Class II",
        "Compressor-driven cooling coil with pressurized refrigerant charge and internal sanitizing thermal elements.",
        "Route to industrial commercial cooling appliance handlers for compliant refrigerant extraction and metal recycling."
    ),
    "Cooling-Display": (
        "Regulated", "Class II",
        "Large-capacity commercial refrigerant volume, condenser coils, and heavy insulated glass panels.",
        "Evacuate commercial refrigerant inventory on-site or at an accredited commercial cold-chain recycling facility."
    ),
    "Washing-Machine": (
        "Regulated", "Class II",
        "Heavy concrete counterweights, high-torque electric motor coils, hydraulic dampeners, and capacitor circuitry.",
        "Drain residual water; transport to certified large household appliance recycling facilities for ferrous and copper motor reclamation."
    ),
    "Tumble-Dryer": (
        "Regulated", "Class II",
        "High-power resistance heating coils, lint ignition hazard, drive motor windings, and electronic timer controllers.",
        "Deliver to major household appliance drop-off facilities for magnetic motor segregation and metal recovery."
    ),
    "Dishwasher": (
        "Regulated", "Class II",
        "High-wattage immersion heating elements, pump motor windings, internal bitumen sound-deadening mats, and circuit boards.",
        "Route to white-goods processing depots for separation of stainless steel tub, motor magnets, and controller electronics."
    ),
    "Boiler": (
        "Regulated", "Class II",
        "Heavy-duty heating coils, mineral scale encrustation, pressurized vessel structure, and thermal insulation jackets.",
        "Ensure complete pressure relief and drainage. Transport to industrial thermal equipment scrap dismantlers."
    ),
    "Oven": (
        "Regulated", "Class II",
        "High-temperature mineral wool insulation, heavy heating resistance elements, and electronic thermostat assemblies.",
        "Deliver to scrap metal and household appliance recyclers; isolate fiberglass/mineral wool insulation during dismantling."
    ),
    "Microwave": (
        "Regulated", "Class II",
        "High-voltage transformer and lethal high-voltage capacitor; magnetron tube containing beryllium oxide ceramic insulator.",
        "Do not disassemble magnetron or discharge high-voltage capacitor manually. Hand over intact to certified appliance dismantlers."
    ),
    "Stove": (
        "Regulated", "Class II",
        "Heavy electrical heating elements, induction coil matrices, and structural cast iron/enamelled steel panels.",
        "Transport to authorized large domestic appliance take-back centers for thermal element and sheet steel recycling."
    ),
    "Range-Hood": (
        "Regulated", "Class II",
        "Centrifugal blower motor, heavy grease-saturated duct filters, and illumination/speed control boards.",
        "Remove oily grease filters; channel motor housing and chassis to general electrical scrap recycling."
    ),
    "Drone": (
        "Regulated", "Class II",
        "High-discharge lithium-polymer battery pack, brushless permanent-magnet motors, and radio transceiver PCBs.",
        "Detach Li-Po battery pack for Class I battery handling; route drone airframe and motor ESC modules to WEEE drop-off."
    ),

    # =========================================================================
    # TIER 3: CLASS III — LOW RISK (Consumer Digital, Peripherals, AV & Small Appliances)
    # =========================================================================
    # Personal Computing & Consumer Portables
    "Smartphone": (
        "Low Risk", "Class III",
        "Consumer handheld digital terminal with integrated lithium-ion pouch cell, OLED/LCD panel, and micro-circuitry.",
        "Power off device; deposit in certified consumer electronics retail kiosk or municipal e-waste collection bin."
    ),
    "Bar-Phone": (
        "Low Risk", "Class III",
        "Legacy mobile phone with modular removable battery and plastic chassis.",
        "Remove rechargeable battery pack for separate hazardous handling; route handset body to municipal e-waste bin."
    ),
    "Tablet": (
        "Low Risk", "Class III",
        "Solid-state flat touchscreen computing terminal with embedded lithium battery and display glass.",
        "Do not puncture display; deposit at consumer electronics drop-off location or authorized refurbisher."
    ),
    "Laptop": (
        "Low Risk", "Class III",
        "Portable personal computer featuring lithium battery pack, display panel, keyboard, and modular motherboard.",
        "Detach battery if removable; route to certified IT equipment collection bin or municipal electronic scrap drop-off."
    ),
    "Smart-Watch": (
        "Low Risk", "Class III",
        "Wearable wrist device containing small coin-sized lithium battery, optical heart-rate sensor, and silicon wrist strap.",
        "Deposit intact in small consumer electronics recycling container at local collection depots."
    ),
    "Headphone": (
        "Low Risk", "Class III",
        "Neodymium audio driver magnets, copper voice coils, headband plastic, and optional Bluetooth lithium micro-cell.",
        "Deposit in consumer small appliance / audio collection container."
    ),
    "Music-Player": (
        "Low Risk", "Class III",
        "Portable digital audio player with flash memory, small rechargeable lithium cell, and plastic/aluminum case.",
        "Deposit in consumer electronic accessories drop-off bin."
    ),

    # Displays, Imaging & Office Peripherals
    "Flat-Panel-Monitor": (
        "Low Risk", "Class III",
        "LED/LCD display panel with polarizers, driver ICs, external power brick, and aluminum stand.",
        "Prevent panel breakage; drop off at municipal electronic waste collection center for glass/plastic separation."
    ),
    "Flat-Panel-TV": (
        "Low Risk", "Class III",
        "Large-format LED/OLED television with internal driver logic, optical diffusing layers, and plastic housing.",
        "Protect front glass from impact; route to designated bulk consumer electronics collection point."
    ),
    "Computer-Keyboard": (
        "Low Risk", "Class III",
        "Molded ABS/PBT plastic housing, flexible silicone membrane matrix, keycaps, and USB connection cable.",
        "Place into standard municipal electronic accessories bin for mechanical plastic and copper wire recycling."
    ),
    "Computer-Mouse": (
        "Low Risk", "Class III",
        "Lightweight plastic shell, optical LED/laser sensor module, miniature switches, and USB cable.",
        "Deposit in consumer electronics drop-off bin or plastic recovery stream."
    ),
    "TV-Remote-Control": (
        "Low Risk", "Class III",
        "Infrared emitter LED, rubber button keypad, injection-molded plastic shell, and dry battery compartment.",
        "Remove AAA/AA alkaline dry batteries before disposal; place plastic body into consumer e-waste bin."
    ),
    "Calculator": (
        "Low Risk", "Class III",
        "Low-voltage CMOS computing circuit, reflective monochrome LCD screen, rubber keypad, and small solar cell.",
        "Deposit in general office electronics or municipal e-waste recycling box."
    ),
    "Camera": (
        "Low Risk", "Class III",
        "Optical lens glass elements, image sensor, aluminum/magnesium frame, and electronic flash unit.",
        "Remove modular rechargeable battery; drop off body and lens at consumer camera/electronics collection kiosk."
    ),
    "Printer": (
        "Low Risk", "Class III",
        "Stepper motors, scanner optical sensor, logic mainboard, and steel structural support rails.",
        "Remove toner or liquid ink cartridges before drop-off; deliver chassis to municipal e-waste depot."
    ),
    "Projector": (
        "Low Risk", "Class III",
        "High-lumen optical projection lens assembly, internal cooling fans, power board, and DLP/LCD engine.",
        "Remove high-intensity discharge projection lamp if present; route chassis to consumer AV drop-off."
    ),
    "Telephone-Set": (
        "Low Risk", "Class III",
        "Wired landline telephone containing dynamic receiver element, coil handset cord, keypad, and ABS casing.",
        "Drop into municipal small electronic appliance bin."
    ),

    # Data Storage & Networking
    "HDD": (
        "Low Risk", "Class III",
        "Cast aluminum chassis, high-grade neodymium voice-coil magnets, and magnetic storage platters.",
        "Perform cryptographic sanitization or degaussing; deliver to certified IT recycler for aluminum and magnet recovery."
    ),
    "SSD": (
        "Low Risk", "Class III",
        "Solid-state NAND flash silicon memory chips, controller IC, and aluminum/plastic 2.5-inch or M.2 form-factor casing.",
        "Securely erase data; deposit in IT asset recycling collection container for silicon and substrate recovery."
    ),
    "USB-Flash-Drive": (
        "Low Risk", "Class III",
        "Miniature monolithic flash memory circuit, USB connector plug, and protective exterior casing.",
        "Drop off in small electronics recycling bins at retail or municipal drop-off kiosks."
    ),
    "Router": (
        "Low Risk", "Class III",
        "Networking motherboard, external plastic antennas, RJ45 Ethernet ports, and 12V DC power connector.",
        "Deliver to consumer electronic collection hubs for circuit board and ABS plastic reclaim."
    ),
    "Network-Switch": (
        "Low Risk", "Class III",
        "Multi-port Ethernet switching fabric, metal rack-mount enclosure, and internal switching power supply.",
        "Route to enterprise IT scrap take-back center or general computer waste container."
    ),

    # Household Prep & Personal Appliances
    "Coffee-Machine": (
        "Low Risk", "Class III",
        "Die-cast heating block, pump motor, water level switches, and food-grade heat-resistant plastics.",
        "Empty water reservoir; deposit at small household appliance collection depot."
    ),
    "Toaster": (
        "Low Risk", "Class III",
        "Mica insulated heating resistance cards, mechanical pop-up spring carriage, and sheet metal crumb tray.",
        "Clean crumb debris; hand over to municipal small domestic appliance scrap collection."
    ),
    "Hair-Dryer": (
        "Low Risk", "Class III",
        "Electric blower fan motor, mica/nichrome open heating wire coil, bimetal thermal cutoff, and power cord.",
        "Deposit in municipal small household appliance collection bin."
    ),
    "Clothes-Iron": (
        "Low Risk", "Class III",
        "Cast aluminum soleplate with embedded heating element, bimetallic thermostat, and water chamber.",
        "Drain water reservoir; place into household electrical appliance recovery container."
    ),
    "Vacuum-Cleaner": (
        "Low Risk", "Class III",
        "High-RPM universal suction motor, plastic cyclonic dust canister, cord retraction reel, and copper cable.",
        "Empty dust compartment and filters; transport to municipal small appliance recycling depot."
    ),
    "Ceiling-Fan": (
        "Low Risk", "Class III",
        "Heavy permanent split-capacitor AC induction motor stator, copper magnet wire, and sheet steel/aluminum blades.",
        "Dismantle fan blades; deliver heavy motor assembly to ferrous/copper scrap collection."
    ),
    "Floor-Fan": (
        "Low Risk", "Class III",
        "Fractional horsepower induction motor, steel wire safety cage, plastic impellers, and speed selector switch.",
        "Deliver to municipal household electrical appliance depot."
    ),
    "Exhaust-Fan": (
        "Low Risk", "Class III",
        "Shaded-pole electric ventilation motor, plastic louver shutter assembly, and wiring terminal.",
        "Deposit in residential appliance scrap collection."
    ),
    "Non-Cooled-Dispenser": (
        "Low Risk", "Class III",
        "Non-refrigerated water distribution stand with food-grade plastic plumbing and mechanical spigot valves.",
        "Disassemble plastic and sheet metal components for standard municipal material recycling."
    ),
    "Rotary-Mower": (
        "Low Risk", "Class III",
        "Corded or battery-electric lawn mower deck, heavy rotary cutting blade, safety interlock, and high-torque motor.",
        "Remove detachable battery pack; route structural steel deck and electric motor to outdoor appliance scrap."
    ),

    # Illumination & Luminaire Fixtures
    "Table-Lamp": (
        "Low Risk", "Class III",
        "Ceramic, metal, or plastic decorative base with standard light bulb socket and inline rotary power switch.",
        "Remove separate light bulb; deposit lamp fixture in household electrical fixture recycling."
    ),
    "Street-Lamp": (
        "Low Risk", "Class III",
        "Die-cast aluminum weather-sealed housing, tempered optical glass lens, and luminaire terminal block.",
        "Ensure lamp bulb/source is separated; route heavy aluminum housing to commercial metal recycling."
    ),
    "LED-Bulb": (
        "Low Risk", "Class III",
        "Surface-mount LED semiconductor emitter array, aluminum heat spreader, and miniature driver circuit.",
        "Deposit in dedicated municipal bulb collection container. Mercury-free and safe for non-hazardous collection."
    ),
    "Christmas-Lights": (
        "Low Risk", "Class III",
        "Extensive PVC-insulated copper wire string with miniature decorative series incandescent/LED bulbs.",
        "Tangle-free bundle; deliver to municipal scrap wire and holiday lighting take-back program."
    ),
    "Flashlight": (
        "Low Risk", "Class III",
        "Machined aluminum or plastic tube, parabolic optical reflector, slide switch, and LED emitter module.",
        "Remove disposable or rechargeable batteries before disposal; place body in small electronics bin."
    ),

    # Entertainment & Consoles
    "PlayStation-5": (
        "Low Risk", "Class III",
        "Home gaming console featuring APU heatsink, internal SSD/optical drive, internal PSU, and ABS outer shell.",
        "Deliver to authorized electronics take-back center or gaming hardware repair/recycling kiosk."
    ),
    "Xbox-Series-X": (
        "Low Risk", "Class III",
        "Vertical console hardware with vapor chamber cooling system, split motherboard architecture, and power supply.",
        "Channel through consumer electronics retail drop-off or certified IT/gaming equipment recyclers."
    ),
    "Speaker": (
        "Low Risk", "Class III",
        "MDF wooden or plastic acoustic enclosure, heavy ferrite/neodymium magnets, paper cones, and crossover circuit.",
        "Drop off in audio/video household electronics collection point."
    ),
    "Electronic-Keyboard": (
        "Low Risk", "Class III",
        "Full-size synthesizer/keyboard keybed with elastomeric switch contacts, audio DAC board, and power module.",
        "Deliver to electronic instrument repairers or municipal small appliance collection points."
    ),
    "Electric-Guitar": (
        "Low Risk", "Class III",
        "Wood body, passive inductive magnetic pickup coils, copper wiring, potentiometer knobs, and output jack.",
        "Deliver to musical instrument refurbisher or general dry scrap recycler."
    )
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