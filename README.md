# A-Frame VR Web Project - Starý Most

This project is a WebVR application built using [A-Frame](https://aframe.io/) under project [Most - město, které nezaniklo](https://most.vugtk.cz/). It provides multiple interactive 3D scenes (e.g. city, village, test environments) and includes a backend service for text-to-speech (TTS) using Google Cloud Text-to-Speech API.
---

## Project Structure

```
project/
│
├── app.py                  # Flask backend server
├── templates/              # HTML A-Frame scenes
│   └── testScene.html
│   
│
├── cert.pem               # SSL certificate (local HTTPS)
├── key.pem                # SSL key (local HTTPS)
└── README.md
```

---

## Requirements

- Python 3.8+
- pip
- Flask
- Flask-CORS
- requests
- Google Cloud Text-to-Speech API key

### Install dependencies

```bash
pip install flask flask-cors requests
```

---

## Environment Setup

Before running the server, set your Google TTS API key:

### Linux / macOS:
```bash
export GOOGLE_TTS_KEY="your_api_key_here"
```

### Windows (PowerShell):
```powershell
setx GOOGLE_TTS_KEY "your_api_key_here"
```

---

## How to Run Locally

### 1. Start backend server

```bash
python app.py
```

The server will start on:

```
https://localhost:8443
```

> The server uses HTTPS (required for WebXR features). Your browser may show a security warning due to a self-signed certificate — you need to accept it manually.

---

### 2. Open the application

Open one of the following in your browser:

- https://localhost:8443
- https://localhost:8443/testScene


## Public version of this application is hosted on https://vmck.sic.cz:8044/testScene.html 