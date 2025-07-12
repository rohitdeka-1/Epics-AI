# Epics-AI

## Overview

Epics-AI is an end-to-end AI-powered crop monitoring system using a drone equipped with a Raspberry Pi, camera, GPS, and telemetry. The system captures crop images, uploads them to the cloud, processes them with a machine learning model, and visualizes results on a dashboard.

---

## System Architecture Diagram

### Visual Diagram

![System Architecture](assets/diagram1.png)

### Mermaid Diagram (for Markdown viewers that support Mermaid)

```mermaid
flowchart LR
    %% Drone System
    APM[APM 2.8 Flight Controller]
    GPS[GPS Module (NEO-M8N)]
    Pi[Raspberry Pi Zero W2]
    Cam[Pi Camera (OV5647)]
    WiFi[Wi-Fi Telemetry Module]
    Pi --> Cam
    Pi --> GPS
    Pi --> WiFi
    Pi --> APM

    %% Drone Process
    Capture[Capture Crop Image]
    ReadGPS[Read GPS via MAVLink]
    Upload[Upload via Wi-Fi]
    Pi --> Capture
    Pi --> ReadGPS
    Pi --> Upload

    %% Cloud Storage
    Cloud[Cloudinary /drone-images]

    %% ML Processing System
    Webhook[Node.js Express Webhook]
    Classifier[ML Classifier (CNN)]
    DB[SQLite/CSV]
    Webhook --> Classifier
    Classifier --> DB

    %% Dashboard (Optional)
    Frontend[React/HTML Frontend]
    ImageViewer[Image Viewer]
    Map[Map View]
    Trends[Historical Trends]
    Status[Status & Alerts]
    Recs[Recommendations]
    Frontend -->|Displays| ImageViewer
    Frontend --> Map
    Frontend --> Trends
    Frontend --> Status
    Frontend --> Recs

    Capture -->|Image + Metadata| Cloud
    ReadGPS -->|Metadata| Cloud
    Upload -->|Image + Metadata| Cloud
    Cloud -->|Webhook on new upload| Webhook
    DB -->|Classification Result| Frontend
    Classifier -->|Failed Classification| Status
```

---

## Components

### 1. Drone System
- **APM 2.8 Flight Controller**
- **GPS Module (NEO-M8N)**
- **Raspberry Pi Zero W2**
- **Pi Camera (OV5647)**
- **Wi-Fi Telemetry Module**

### 2. Process Flow from Drone
- Pi captures crop images
- Reads GPS coordinates via MAVLink
- Uploads image to Cloudinary via Wi-Fi

### 3. Cloud Storage
- **Cloudinary folder:** `/drone-images`
- Stores image and metadata

### 4. ML Processing System (Laptop or Server)
- **Node.js Express Webhook Server**
- Receives Cloudinary webhook on new upload
- Downloads image
- Runs ML classifier (e.g. CNN model)
- Stores classification result in SQLite/CSV

### 5. Optional Dashboard
- Simple frontend (React or HTML)
- Displays image + classification status
- Shows map coordinates

---

## Data & Control Flow

- **Data Flow:** Drone → Cloudinary → Webhook → ML → Dashboard
- **Control Flow:** Classification result/alerts → Dashboard

---

## How to Add an Image to the README

1. Place your image (e.g., `diagram1.png`) in the `assets/` folder (create it if it doesn't exist).
2. Reference it in your README using Markdown:

   ```markdown
   ![System Architecture](assets/diagram1.png)
   ```

---

## Quick Start

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```
2. Set up your `.env` file with Cloudinary credentials.
3. Run the uploader script on the Raspberry Pi:
   ```bash
   node RaspberryPi_Uploader/upload-script.js
   ```
4. Set up the ML processing server and dashboard as per your requirements.