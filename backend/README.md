# YouTube CTR Predictor - FastAPI Backend

This is the FastAPI backend for the YouTube CTR prediction system.

## Setup

1. **Create a Python virtual environment:**

   ```bash
   python -m venv venv
   ```

2. **Activate the virtual environment:**

   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`

3. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

4. **Place your trained model:**

   - Put your `model.pth` file in the `backend/` directory

5. **Update the model architecture:**
   - Edit `model.py` and replace the `YouTubeCTRModel` class with your actual model architecture
   - Make sure the input features in `preprocess_input()` match your model's expected input

## Running the Server

```bash
python main.py
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Health Check

```
GET /health
```

### Make Prediction

```
POST /predict
Content-Type: application/json

{
  "videoTitle": "My Awesome Video",
  "videoLength": "10:30:45",
  "channelSubscribers": 50000,
  "totalChannelViews": 1000000,
  "totalVideos": 150,
  "videoUploadDayofWeek": 3,
  "videoUploadHour": 14,
  "channelAgeYears": 5
}
```

Optional: Include a thumbnail image via multipart form data with field name `thumbnail`

## Important Configuration Steps

1. **Update Model Architecture**: The `YouTubeCTRModel` class in `model.py` is a placeholder. Replace it with your actual model architecture.

2. **Update Input Preprocessing**: The `preprocess_input()` function needs to match how you trained your model. Adjust:

   - Feature normalization ranges
   - Input feature order
   - Any text processing for video title

3. **Model Path**: By default, looks for `model.pth` in the backend directory. Change `model_path` parameter in `load_model()` if needed.

## Notes

- The API automatically detects and uses GPU (CUDA) if available
- CORS is enabled to allow communication from your Next.js frontend
- All numeric inputs are validated according to specified constraints
