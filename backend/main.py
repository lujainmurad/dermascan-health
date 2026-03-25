import base64, logging
import numpy as np
import cv2
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from segmentation import run_segmentation_pipeline
from features import extract_features_from_arrays
from report import generate_report

logging.getLogger("radiomics").setLevel(logging.ERROR)
logging.getLogger("pykwalify").setLevel(logging.ERROR)

app = FastAPI(title="DermaScan AI Backend")
app.add_middleware(CORSMiddleware,allow_origins=["*"],allow_credentials=True,allow_methods=["*"],allow_headers=["*"])

def _decode_rgb(image_bytes):
    nparr=np.frombuffer(image_bytes,np.uint8)
    img_bgr=cv2.imdecode(nparr,cv2.IMREAD_COLOR)
    if img_bgr is None: raise ValueError("Could not decode image")
    return cv2.cvtColor(img_bgr,cv2.COLOR_BGR2RGB)

@app.get("/health")
def health():
    return {"status":"ok","message":"DermaScan AI backend is running"}

@app.post("/analyze/clinician")
async def analyze_clinician(image: UploadFile = File(...)):
    if image.content_type not in ("image/jpeg","image/png","image/jpg"):
        raise HTTPException(status_code=400,detail="Only JPEG and PNG accepted.")
    image_bytes=await image.read()
    if len(image_bytes)>20*1024*1024:
        raise HTTPException(status_code=400,detail="Image too large (max 20MB).")
    try:
        result=run_segmentation_pipeline(image_bytes)
        orig_rgb=_decode_rgb(image_bytes)
        nparr=np.frombuffer(result["mask_png"],np.uint8)
        mask_clean=cv2.imdecode(nparr,cv2.IMREAD_GRAYSCALE)
        features=extract_features_from_arrays(orig_rgb,mask_clean)
        nparr2=np.frombuffer(result["overlay_png"],np.uint8)
        overlay_rgb=cv2.cvtColor(cv2.imdecode(nparr2,cv2.IMREAD_COLOR),cv2.COLOR_BGR2RGB)
        pdf_bytes=generate_report(orig_rgb=orig_rgb,overlay_rgb=overlay_rgb,mask_clean=mask_clean,
                                   features=features,prediction="Pending classifier",
                                   confidence=None,lesion_area_pct=result["lesion_area_pct"])
        pdf_b64=base64.b64encode(pdf_bytes).decode("utf-8")
        feature_summary={"asymmetry":round(features.get("asym_axis_aligned",0),3),
                         "border_irregularity":round(features.get("border_irregularity",0),3),
                         "n_colors":int(features.get("color_n_abcde_colors",0)),
                         "solidity":round(features.get("solidity",0),3),
                         "lesion_area_pct":result["lesion_area_pct"],
                         "major_axis":round(features.get("major_axis",0),1),
                         "minor_axis":round(features.get("minor_axis",0),1),
                         "eccentricity":round(features.get("eccentricity",0),3),
                         "glcm_contrast":round(features.get("glcm_contrast_mean",0),4),
                         "lbp_entropy":round(features.get("lbp_entropy",0),3)}
        overlay_b64=base64.b64encode(result["overlay_png"]).decode("utf-8")
        mask_b64=base64.b64encode(result["mask_png"]).decode("utf-8")
        return JSONResponse({"overlay_image":f"data:image/png;base64,{overlay_b64}",
                             "mask_image":f"data:image/png;base64,{mask_b64}",
                             "lesion_area_pct":result["lesion_area_pct"],
                             "prediction":"Pending classifier","confidence":None,
                             "recommendation":"Segmentation and feature extraction complete. Classification pending.",
                             "feature_summary":feature_summary,
                             "report_pdf":f"data:application/pdf;base64,{pdf_b64}",
                             "report_ready":True})
    except Exception as e:
        raise HTTPException(status_code=500,detail=f"Pipeline error: {str(e)}")

@app.post("/analyze/patient")
async def analyze_patient(image: UploadFile = File(...)):
    if image.content_type not in ("image/jpeg","image/png","image/jpg"):
        raise HTTPException(status_code=400,detail="Only JPEG and PNG accepted.")
    image_bytes=await image.read()
    if len(image_bytes)>20*1024*1024:
        raise HTTPException(status_code=400,detail="Image too large (max 20MB).")
    try:
        result=run_segmentation_pipeline(image_bytes)
        area_pct=result["lesion_area_pct"]
        if area_pct>15.0:   risk_level="high";     confidence=round(min(0.55+area_pct/200,0.85),3); recommendation="The lesion appears significant. Please consult a dermatologist."; should_consult=True
        elif area_pct>5.0:  risk_level="moderate"; confidence=0.45; recommendation="The lesion warrants professional evaluation."; should_consult=True
        else:               risk_level="low";      confidence=0.30; recommendation="The lesion appears small. Monitor and consult if changes occur."; should_consult=False
        return JSONResponse({"risk_level":risk_level,"confidence":confidence,"lesion_area_pct":area_pct,"recommendation":recommendation,"should_consult":should_consult})
    except Exception as e:
        raise HTTPException(status_code=500,detail=f"Pipeline error: {str(e)}")

if __name__=="__main__":
    import uvicorn
    uvicorn.run("main:app",host="0.0.0.0",port=8000,reload=True)
