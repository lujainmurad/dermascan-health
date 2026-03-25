import io, datetime
import numpy as np
import cv2
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, Image as RLImage
from reportlab.lib.enums import TA_CENTER

TEAL=colors.HexColor("#0B6E6E"); LTEAL=colors.HexColor("#E1F5EE"); DGRAY=colors.HexColor("#2C2C2A")
WARN=colors.HexColor("#BA7517"); DANGER=colors.HexColor("#A32D2D")

def _cv2_to_rl(arr_bgr, width_cm):
    _,buf=cv2.imencode(".png",arr_bgr); bio=io.BytesIO(buf.tobytes()); img=RLImage(bio)
    aspect=arr_bgr.shape[0]/arr_bgr.shape[1]; img.drawWidth=width_cm*cm; img.drawHeight=width_cm*cm*aspect
    return img

def _table(title, rows):
    data=[[Paragraph(f"<b>{title}</b>",ParagraphStyle("th",fontName="Helvetica-Bold",fontSize=9,textColor=colors.white)),
           Paragraph("<b>Value</b>",ParagraphStyle("thv",fontName="Helvetica-Bold",fontSize=9,textColor=colors.white,alignment=TA_CENTER))]]
    for i,(label,value) in enumerate(rows):
        data.append([Paragraph(label,ParagraphStyle("td",fontName="Helvetica",fontSize=8,textColor=DGRAY)),
                     Paragraph(str(value),ParagraphStyle("tdv",fontName="Helvetica-Bold",fontSize=8,textColor=DGRAY,alignment=TA_CENTER))])
    t=Table(data,colWidths=[9*cm,5.5*cm])
    t.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),TEAL),("ROWBACKGROUNDS",(0,1),(-1,-1),[LTEAL,colors.white]),
                            ("GRID",(0,0),(-1,-1),0.3,colors.HexColor("#9FE1CB")),("TOPPADDING",(0,0),(-1,-1),4),
                            ("BOTTOMPADDING",(0,0),(-1,-1),4),("LEFTPADDING",(0,0),(-1,-1),6),
                            ("RIGHTPADDING",(0,0),(-1,-1),6),("VALIGN",(0,0),(-1,-1),"MIDDLE")]))
    return t

def generate_report(orig_rgb, overlay_rgb, mask_clean, features, prediction="Pending classifier", confidence=None, lesion_area_pct=0.0):
    buf=io.BytesIO()
    doc=SimpleDocTemplate(buf,pagesize=A4,leftMargin=1.8*cm,rightMargin=1.8*cm,topMargin=1.8*cm,bottomMargin=1.8*cm)
    story=[]
    story.append(Paragraph("DermaScan AI",ParagraphStyle("h",fontName="Helvetica-Bold",fontSize=18,textColor=TEAL,spaceAfter=2)))
    story.append(Paragraph("Dermoscopy Analysis Report",ParagraphStyle("s",fontName="Helvetica",fontSize=9,textColor=colors.HexColor("#5F5E5A"),spaceAfter=2)))
    story.append(Paragraph(f"Generated: {datetime.datetime.now().strftime('%d %B %Y, %H:%M')}",ParagraphStyle("d",fontName="Helvetica",fontSize=9,textColor=colors.HexColor("#5F5E5A"),spaceAfter=4)))
    story.append(HRFlowable(width="100%",thickness=1.5,color=TEAL,spaceAfter=10))
    orig_bgr=cv2.cvtColor(orig_rgb,cv2.COLOR_RGB2BGR); overlay_bgr=cv2.cvtColor(overlay_rgb,cv2.COLOR_RGB2BGR)
    it=Table([[Paragraph("<b>Original Image</b>",ParagraphStyle("ic",fontName="Helvetica-Bold",fontSize=8,textColor=DGRAY,alignment=TA_CENTER)),
               Paragraph("<b>Segmentation Overlay</b>",ParagraphStyle("ic2",fontName="Helvetica-Bold",fontSize=8,textColor=DGRAY,alignment=TA_CENTER))],
              [_cv2_to_rl(orig_bgr,8.5),_cv2_to_rl(overlay_bgr,8.5)]],colWidths=[9*cm,9*cm])
    it.setStyle(TableStyle([("ALIGN",(0,0),(-1,-1),"CENTER"),("VALIGN",(0,0),(-1,-1),"TOP"),("TOPPADDING",(0,0),(-1,-1),4),("BOTTOMPADDING",(0,0),(-1,-1),6)]))
    story.append(it); story.append(Spacer(1,0.3*cm))
    if prediction and prediction!="Pending classifier":
        bc=DANGER if "melanoma" in prediction.lower() else TEAL
        cf=f" — Confidence: {confidence*100:.1f}%" if confidence else ""
        story.append(Paragraph(f"{prediction}{cf}",ParagraphStyle("ban",fontName="Helvetica-Bold",fontSize=13,textColor=colors.white,backColor=bc,borderPadding=8,alignment=TA_CENTER,spaceAfter=6)))
    else:
        story.append(Paragraph("Classification: Pending classifier integration",ParagraphStyle("pend",fontName="Helvetica",fontSize=10,textColor=WARN,spaceAfter=6)))
    story.append(Spacer(1,0.2*cm))
    story.append(_table("Lesion Summary",[("Lesion area (% of image)",f"{lesion_area_pct:.2f}%"),("Shape area (px²)",f"{features.get('shape_area',0):.0f}"),("Perimeter (px)",f"{features.get('shape_perimeter',0):.1f}"),("Major axis (px)",f"{features.get('major_axis',0):.1f}"),("Minor axis (px)",f"{features.get('minor_axis',0):.1f}"),("Eccentricity",f"{features.get('eccentricity',0):.3f}"),("Sphericity",f"{features.get('shape_sphericity',0):.3f}"),("Solidity",f"{features.get('solidity',0):.3f}")]))
    story.append(Spacer(1,0.35*cm))
    story.append(_table("ABCDE Clinical Features",[("A — Asymmetry (axis-aligned)",f"{features.get('asym_axis_aligned',0):.3f}"),("A — Asymmetry (PCA axis)",f"{features.get('asym_pca',0):.3f}"),("B — Border irregularity",f"{features.get('border_irregularity',0):.3f}"),("B — Fractal dimension",f"{features.get('fractal_dim',0):.3f}"),("B — Convexity",f"{features.get('convexity',0):.3f}"),("C — Dominant color spread",f"{features.get('color_dominant_spread',0):.1f}"),("C — Number of ABCDE colors",f"{int(features.get('color_n_abcde_colors',0))}"),("C — White area fraction",f"{features.get('color_white_frac',0):.3f}"),("D/E — Lesion/image ratio",f"{features.get('lesion_to_image_ratio',0):.4f}"),("D/E — Extent",f"{features.get('extent',0):.3f}")]))
    story.append(Spacer(1,0.35*cm))
    story.append(_table("Texture Features",[("GLCM Contrast (mean)",f"{features.get('glcm_contrast_mean',0):.4f}"),("GLCM Correlation (mean)",f"{features.get('glcm_correlation_mean',0):.4f}"),("GLCM Energy (mean)",f"{features.get('glcm_energy_mean',0):.4f}"),("GLCM Homogeneity (mean)",f"{features.get('glcm_homogeneity_mean',0):.4f}"),("LBP Mean",f"{features.get('lbp_mean',0):.2f}"),("LBP Entropy",f"{features.get('lbp_entropy',0):.3f}"),("GLRLM SRE",f"{features.get('glrlm_sre',0):.4f}"),("GLRLM LRE",f"{features.get('glrlm_lre',0):.4f}"),("Histogram Mean",f"{features.get('hist_mean',0):.2f}"),("Histogram Entropy",f"{features.get('hist_entropy',0):.3f}")]))
    story.append(Spacer(1,0.35*cm))
    story.append(_table("Color Analysis",[("RGB Red mean",f"{features.get('color_rgb_ch0_mean',0):.1f}"),("RGB Green mean",f"{features.get('color_rgb_ch1_mean',0):.1f}"),("RGB Blue mean",f"{features.get('color_rgb_ch2_mean',0):.1f}"),("HSV Hue mean",f"{features.get('color_hsv_ch0_mean',0):.1f}"),("HSV Saturation mean",f"{features.get('color_hsv_ch1_mean',0):.1f}"),("LAB L* mean",f"{features.get('color_lab_ch0_mean',0):.1f}"),("LAB a* mean",f"{features.get('color_lab_ch1_mean',0):.1f}"),("LAB b* mean",f"{features.get('color_lab_ch2_mean',0):.1f}")]))
    story.append(Spacer(1,0.35*cm))
    story.append(HRFlowable(width="100%",thickness=1,color=TEAL,spaceAfter=8))
    story.append(Paragraph("Clinical Recommendation",ParagraphStyle("rh",fontName="Helvetica-Bold",fontSize=11,textColor=TEAL,spaceAfter=4)))
    asym=features.get("asym_axis_aligned",0); irreg=features.get("border_irregularity",0)
    n_col=features.get("color_n_abcde_colors",0); rs=0
    if asym>0.15: rs+=1
    if irreg>2.0: rs+=1
    if n_col>=3:  rs+=1
    if lesion_area_pct>10: rs+=1
    if rs>=3: rc=DANGER; rt="Multiple high-risk features detected. <b>Escalation to dermoscopic biopsy is recommended.</b>"
    elif rs==2: rc=WARN; rt="Moderate risk features present. Clinical correlation and follow-up recommended."
    else: rc=TEAL; rt="Low-risk feature profile. Routine monitoring recommended."
    story.append(Paragraph(rt,ParagraphStyle("rec",fontName="Helvetica",fontSize=9,textColor=rc,spaceAfter=6,leading=14)))
    story.append(HRFlowable(width="100%",thickness=0.5,color=colors.HexColor("#9FE1CB"),spaceAfter=6))
    story.append(Paragraph("<i>This report is generated by DermaScan AI and is intended to assist clinicians. It does not replace professional medical judgment.</i>",ParagraphStyle("disc",fontName="Helvetica-Oblique",fontSize=7,textColor=colors.HexColor("#888780"))))
    doc.build(story)
    return buf.getvalue()
