"""
Minimal Kokoro TTS server — OpenAI-compatible /v1/audio/speech endpoint.
Usage: python scripts/kokoro_server.py
Listens on http://localhost:8880
"""

import io
import struct
import numpy as np
import lameenc
import uvicorn
from fastapi import FastAPI
from fastapi.responses import Response
from pydantic import BaseModel
from pathlib import Path

SCRIPT_DIR  = Path(__file__).parent
MODEL_PATH  = SCRIPT_DIR / "kokoro-v1.0.onnx"
VOICES_PATH = SCRIPT_DIR / "voices-v1.0.bin"

BASE = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0"
MODEL_URL  = f"{BASE}/kokoro-v1.0.onnx"
VOICES_URL = f"{BASE}/voices-v1.0.bin"

def download_if_missing(url, dest, label):
    if dest.exists():
        return
    print(f"  Downloading {label}… this may take a few minutes.")
    import urllib.request
    urllib.request.urlretrieve(url, dest)
    print(f"  ✓ {dest.name}")

# ── lazy-load model ──────────────────────────────────────────────────────────
_kokoro = None

def get_kokoro():
    global _kokoro
    if _kokoro is None:
        from kokoro_onnx import Kokoro
        print("Loading Kokoro model…")
        download_if_missing(MODEL_URL,  MODEL_PATH,  "kokoro model (~310 MB)")
        download_if_missing(VOICES_URL, VOICES_PATH, "voices (~10 MB)")
        _kokoro = Kokoro(str(MODEL_PATH), str(VOICES_PATH))
        print("Model loaded ✓")
    return _kokoro


# ── helpers ─────────────────────────────────────────────────────────────────
def float32_to_mp3(samples: np.ndarray, sample_rate: int) -> bytes:
    # lameenc expects int16
    pcm = (samples * 32767).clip(-32768, 32767).astype(np.int16)
    enc = lameenc.Encoder()
    enc.set_bit_rate(128)
    enc.set_in_sample_rate(sample_rate)
    enc.set_channels(1)
    enc.set_quality(2)
    mp3_bytes = enc.encode(pcm.tobytes())
    mp3_bytes += enc.flush()
    return bytes(mp3_bytes)


def float32_to_wav(samples: np.ndarray, sample_rate: int) -> bytes:
    pcm = (samples * 32767).clip(-32768, 32767).astype(np.int16)
    buf = io.BytesIO()
    num_samples = len(pcm)
    byte_rate   = sample_rate * 2
    data_size   = num_samples * 2
    buf.write(b"RIFF")
    buf.write(struct.pack("<I", 36 + data_size))
    buf.write(b"WAVE")
    buf.write(b"fmt ")
    buf.write(struct.pack("<IHHIIHH", 16, 1, 1, sample_rate, byte_rate, 2, 16))
    buf.write(b"data")
    buf.write(struct.pack("<I", data_size))
    buf.write(pcm.tobytes())
    return buf.getvalue()


# ── API ─────────────────────────────────────────────────────────────────────
app = FastAPI(title="Kokoro TTS")

class SpeechRequest(BaseModel):
    model:           str = "kokoro"
    input:           str
    voice:           str = "af_nicole"  # smooth, calm American female
    response_format: str = "mp3"
    speed:           float = 1.0

@app.get("/v1/models")
def list_models():
    return {"data": [{"id": "kokoro"}]}

@app.post("/v1/audio/speech")
async def speech(req: SpeechRequest):
    kokoro = get_kokoro()
    samples, sample_rate = kokoro.create(
        req.input,
        voice=req.voice,
        speed=req.speed,
        lang="en-us",
    )
    if req.response_format == "wav":
        audio = float32_to_wav(samples, sample_rate)
        media = "audio/wav"
    else:  # mp3 (default)
        audio = float32_to_mp3(samples, sample_rate)
        media = "audio/mpeg"
    return Response(content=audio, media_type=media)


if __name__ == "__main__":
    print("\n🎙  Kokoro TTS server starting on http://localhost:8880")
    print("   Press Ctrl+C to stop\n")
    uvicorn.run(app, host="0.0.0.0", port=8880, log_level="info")
