import cv2
import numpy as np
import torch
import torch.nn.functional as F
from model import get_model

IMG_SIZE = (384, 384)
THR = 0.5

def preprocess(image_bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise ValueError("Could not decode image")
    orig_h, orig_w = img_bgr.shape[:2]
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    img_r   = cv2.resize(img_rgb, IMG_SIZE, interpolation=cv2.INTER_LINEAR)
    img_f   = img_r.astype(np.float32) / 255.0
    tensor  = torch.tensor(np.transpose(img_f, (2,0,1))[None], dtype=torch.float32)
    return tensor, img_rgb, orig_h, orig_w

def predict_mask(tensor):
    model, device = get_model()
    tensor = tensor.to(device)
    with torch.no_grad():
        logit = model(tensor)
        if isinstance(logit, tuple): logit = logit[0]
        prob  = torch.sigmoid(logit)[0, 0].cpu().numpy()
    mask = (prob > THR).astype(np.uint8) * 255
    return mask, prob

def keep_largest_blob(mask_u8):
    _, binary = cv2.threshold(mask_u8, 127, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return np.zeros_like(mask_u8)
    largest = max(contours, key=cv2.contourArea)
    clean   = np.zeros_like(mask_u8)
    cv2.drawContours(clean, [largest], -1, 255, thickness=cv2.FILLED)
    return clean

def create_overlay(orig_rgb, mask_u8, alpha=0.4):
    orig_h, orig_w = orig_rgb.shape[:2]
    mask_resized   = cv2.resize(mask_u8, (orig_w, orig_h), interpolation=cv2.INTER_NEAREST)
    overlay = orig_rgb.copy().astype(np.float32)
    teal = np.array([11, 110, 110], dtype=np.float32)
    lesion_pixels = mask_resized > 127
    overlay[lesion_pixels] = alpha * teal + (1 - alpha) * overlay[lesion_pixels]
    overlay = overlay.clip(0, 255).astype(np.uint8)
    contours, _ = cv2.findContours(mask_resized, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cv2.drawContours(overlay, contours, -1, (11, 110, 110), 2)
    return overlay

def run_segmentation_pipeline(image_bytes):
    tensor, orig_rgb, orig_h, orig_w = preprocess(image_bytes)
    mask_model, prob = predict_mask(tensor)
    mask_orig  = cv2.resize(mask_model, (orig_w, orig_h), interpolation=cv2.INTER_NEAREST)
    mask_clean = keep_largest_blob(mask_orig)
    overlay    = create_overlay(orig_rgb, mask_clean)
    _, overlay_enc = cv2.imencode(".png", cv2.cvtColor(overlay, cv2.COLOR_RGB2BGR))
    _, mask_enc    = cv2.imencode(".png", mask_clean)
    total_px   = orig_h * orig_w
    lesion_px  = int((mask_clean > 127).sum())
    lesion_pct = round(100.0 * lesion_px / max(total_px, 1), 2)
    return {
        "overlay_png":     overlay_enc.tobytes(),
        "mask_png":        mask_enc.tobytes(),
        "lesion_area_pct": lesion_pct,
    }
