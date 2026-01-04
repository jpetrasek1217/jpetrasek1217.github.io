import re
import os
import torch
import torch.nn as nn
import base64
import numpy as np
from PIL import Image
from io import BytesIO
from typing import Dict, Optional
from torchvision import transforms
from hybrid_nn import HybridEvaluator

def load_model(model_path: str = "model.pth") -> nn.Module:
    """
    Load the pre-trained PyTorch model.
    
    Args:
        model_path: Path to the .pth file with saved weights
    
    Returns:
        Loaded model in evaluation mode
    """
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    
    # Initialize model architecture
    model = HybridEvaluator(num_numeric_features=6, num_classes=8, device=device)
    # Load saved weights
    if os.path.exists(model_path):
        model.load_state_dict(torch.load(model_path, map_location=torch.device(device)))
    else:
        print(f"Warning: Model file not found at {model_path}")
    
    model.to(device)
    model.eval()
    
    return model

def parse_video_length(video_length: str) -> float:
    """
    Convert video length from HH:MM:SS format to seconds
    
    Args:
        video_length: String in format "HH:MM:SS"
    
    Returns:
        Total seconds as float
    """
    try:
        match = re.match(r"(\d{2}):(\d{2}):(\d{2})", video_length)
        if match:
            hours, minutes, seconds = map(int, match.groups())
            total_seconds = hours * 3600 + minutes * 60 + seconds
            return float(total_seconds)
        else:
            raise ValueError(f"Invalid video length format: {video_length}")
    except Exception as e:
        print(f"Error parsing video length: {e}")
        return 0.0

def normalize_input(value: float, min_val: float, max_val: float, log_scale=False) -> float:
    """
    Normalize value to [0, 1] range
    """
    if log_scale:
        value = np.log1p(value)
        min_val = np.log1p(min_val)
        max_val = np.log1p(max_val)
    return float((value - min_val) / (max_val - min_val + 1e-9))

def preprocess_input(input_data: Dict) -> torch.Tensor:
    """
    Preprocess input data into tensor format suitable for model.
    
    IMPORTANT: Adjust this based on your model's expected input format.
    
    Args:
        input_data: Dictionary containing user input
    
    Returns:
        torch.Tensor ready for model inference
    """
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    # Extract and normalize numerical features
    video_length_seconds = parse_video_length(input_data["videoLength"])
    
    # Normalize features (adjust min/max values based on your data)
    features = [
        normalize_input(video_length_seconds, 0, 134675, log_scale=True),  # longest video in dataset
        normalize_input(input_data["videoTitleLength"], 1, 100), # need to change these so they are not hardcoded in v2
        normalize_input(input_data["channelSubscribers"], 0, 453000000, log_scale=True),
        normalize_input(input_data["totalChannelViews"], 0, 326000000000, log_scale=True),
        normalize_input(input_data["totalVideos"], 0, 645000),
        normalize_input(input_data["channelAgeYears"], 0, 20),
    ]
    
    # Convert to tensor
    features_tensor = torch.tensor(features, dtype=torch.float32).unsqueeze(0).to(device)
    
    return features_tensor

def predict(model: nn.Module, input_data: Dict) -> float:
    """
    Make a prediction using the loaded model.
    
    Args:
        model: The loaded PyTorch model
        input_data: Dictionary with user input
    
    Returns:
        Prediction value (CTR prediction or probability)
    """
    with torch.no_grad():
        # Preprocess input
        input_tensor = preprocess_input(input_data)
        # Get prediction
        output = model(
            input_data["thumbnail"],
            input_data["videoTitle"], 
            input_tensor,
            torch.tensor(input_data["videoUploadHour"], dtype=torch.long).unsqueeze(0), 
            torch.tensor(input_data["videoUploadDayofWeek"], dtype=torch.long).unsqueeze(0)
        )
        # Convert to Python float
        prediction = torch.argmax(output, dim=1).item()

    return prediction
