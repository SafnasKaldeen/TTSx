# Sinhala Text-to-Speech (TTS) Application 🗣️

[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-ee4c2c.svg)](https://pytorch.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)

## Overview

This project is a high-quality **Sinhala Text-to-Speech (TTS)** application that converts Sinhala text into natural, intelligible speech. It leverages advanced deep learning models to synthesize speech, aiming to support digital accessibility, preserve cultural heritage, and provide educational resources in the Sinhala language. This also supports multiple speaker voices, allowing for a more personalized user experience and we can do voice adaptation to create new voices based on existing datasets (Development stage).

## Features

- Converts Sinhala text input to natural-sounding speech audio.
- Supports multiple speaker voices via speaker adaptation.
- Uses VITS for high-quality speech synthesis.
- Easy-to-use command-line interface and/or API for integration.
- Supports fine-tuning on new voices or datasets via the framework.

---

## Installation

### Prerequisites

- Python 3.8 or above
- [PyTorch](https://pytorch.org/) (version compatible with your CUDA or CPU)
- `pip` package manager

### Clone the repository

```bash
git clone https://github.com/SafnasKaldeen/TTSx.git
cd TTSx
```

### Start the UI

```bash
cd UI
cd client
npm install --force
npm run dev
```

### Start the server in a new terminal

```bash
cd APIs
source venv/bin/activate
uvicorn main:app --reload
```

## 🚀 Quick Start

### Access the Application

Once both the UI and server are running:

- **Frontend**: Open your browser and navigate to `http://localhost:3000` (or the port shown in your terminal)
- **API Documentation**: Visit `http://localhost:8000/docs` for interactive API documentation

## 📁 Project Structure

```
TTSx/
├── UI/                       # Frontend application
│   └── client/              # React/Next.js client
├── APIs/                     # Backend API server
│   ├── main.py              # FastAPI main application
│   ├── models/              # TTS model files
│   ├── utils/               # Utility functions
│   └── venv/                # Python virtual environment
├── datasets/                 # Training datasets
├── configs/                  # Configuration files
├── examples/                 # Usage examples
├── docs/                     # Documentation
└── README.md                 # This file
```

## 🎯 Supported Features

### Text Processing

- **Unicode Support**: Full Sinhala Unicode character support
- **Text Normalization**: Automatic handling of numbers, dates, abbreviations
- **Punctuation Processing**: Natural pause and intonation handling
- **Mixed Language**: Support for Sinhala-English mixed text
- **Post-Processing**: Denoising and audio enhancement options

### Voice Options

- **Female Voices**: `Dinithi`, `Oshadi`
- **Male Voices**: `Yasindu`, `Mettananda`, `Isuru`
- **Custom Voices**: Train your own voices using the modified adaptation framework for both windows and linux

### Output Formats

- WAV (16kHz, 22kHz, 44.1kHz)
- MP3 (with optional compression)
- Real-time streaming support
