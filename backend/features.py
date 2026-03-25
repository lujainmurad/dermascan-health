import math, warnings, logging
import numpy as np
import cv2

warnings.filterwarnings("ignore")
logging.getLogger("radiomics").setLevel(logging.ERROR)
logging.getLogger("pykwalify").setLevel(logging.ERROR)

try:
    import SimpleITK as sitk
    from radiomics import featureextractor as _rx_extractor
    _RADIOMICS_OK = True
except ImportError:
    _RADIOMICS_OK = False

RADIOMICS_CLASSES = ["firstorder","shape2D","glcm","glrlm","glszm","ngtdm"]
_EXTRACTOR = None

def _get_extractor():
    global _EXTRACTOR
    if _EXTRACTOR is None and _RADIOMICS_OK:
        params = {
            "setting": {"binWidth":25,"resampledPixelSpacing":None,"interpolator":"sitkBSpline","force2D":True,"force2Ddimension":0},
            "featureClass": {cls:[] for cls in RADIOMICS_CLASSES},
        }
        ext = _rx_extractor.RadiomicsFeatureExtractor(params)
        ext.disableAllFeatures()
        for cls in RADIOMICS_CLASSES:
            ext.enableFeatureClassByName(cls)
        _EXTRACTOR = ext
    return _EXTRACTOR

def _safe(v):
    try:
        f = float(v)
        return 0.0 if (math.isnan(f) or math.isinf(f)) else f
    except Exception:
        return 0.0

def _mstats(arr):
    arr = arr.astype(np.float64)
    if arr.size == 0: return 0.,0.,0.,0.
    mu = arr.mean(); std = arr.std()+1e-9
    return float(mu),float(arr.std()),_safe(((arr-mu)**3).mean()/std**3),_safe(((arr-mu)**4).mean()/std**4)

def _resize(rgb, mask, max_dim=512):
    h,w = rgb.shape[:2]; scale = max_dim/max(h,w)
    if scale >= 1.0: return rgb, mask
    nh,nw = int(h*scale),int(w*scale)
    return cv2.resize(rgb,(nw,nh),interpolation=cv2.INTER_AREA), cv2.resize(mask,(nw,nh),interpolation=cv2.INTER_NEAREST)

def pyradiomics_features(roi_gray, bw):
    ext = _get_extractor()
    if ext is None or bw.sum()==0: return {}
    try:
        img_sitk  = sitk.GetImageFromArray(roi_gray.astype(np.int16))
        mask_sitk = sitk.GetImageFromArray(bw.astype(np.uint8))
        img_sitk.SetSpacing([1.0,1.0]); mask_sitk.SetSpacing([1.0,1.0])
        result = ext.execute(img_sitk, mask_sitk, label=1)
        return {k.replace("original_","rx_",1):_safe(v) for k,v in result.items() if not k.startswith("diagnostics_")}
    except Exception:
        return {}

def asymmetry_features(bw, area, contours):
    if area==0: return {k:0.0 for k in("asym_axis_aligned","asym_pca","compactness","elongation","axis_ratio")}
    feats={}; M=cv2.moments(bw); cx=M["m10"]/(M["m00"]+1e-9); cy=M["m01"]/(M["m00"]+1e-9)
    feats["asym_axis_aligned"]=_safe((float((bw!=np.fliplr(bw)).sum())+float((bw!=np.flipud(bw)).sum()))/(2.*area))
    ys,xs=np.where(bw>0); pts=np.stack([xs-cx,ys-cy],axis=1).astype(np.float32)
    _,_,Vt=np.linalg.svd(pts,full_matrices=False); proj=pts@Vt[0]
    h1,h2=(proj>=0).sum(),(proj<0).sum(); feats["asym_pca"]=_safe(abs(h1-h2)/(h1+h2+1e-9))
    if contours:
        cnt=max(contours,key=cv2.contourArea); peri=cv2.arcLength(cnt,True)+1e-9
        feats["compactness"]=_safe(4*math.pi*area/peri**2)
        if len(cnt)>=5:
            (_,_),(ma,mi),_=cv2.fitEllipse(cnt)
            feats["elongation"]=_safe(mi/(ma+1e-9)); feats["axis_ratio"]=_safe(ma/(mi+1e-9))
        else: feats["elongation"]=1.0; feats["axis_ratio"]=1.0
    else: feats["compactness"]=feats["elongation"]=0.0; feats["axis_ratio"]=1.0
    return feats

def _fractal(bw):
    edge=cv2.Canny((bw*255).astype(np.uint8),50,150); sizes,counts=[],[]
    s=2
    while s<=128:
        h2=(edge.shape[0]//s)*s; w2=(edge.shape[1]//s)*s
        if h2==0 or w2==0: s*=2; continue
        nb=edge[:h2,:w2].reshape(h2//s,s,w2//s,s).any(axis=(1,3)).sum()
        if nb>0: sizes.append(s); counts.append(nb)
        s*=2
    if len(sizes)<2: return 1.0
    return _safe(np.polyfit(np.log(1./np.array(sizes,np.float64)),np.log(np.array(counts,np.float64)),1)[0])

def border_features(bw, area, contours, roi_gray):
    if not contours or area==0:
        return {k:0.0 for k in("border_irregularity","fractal_dim","convexity","solidity","edge_grad_mean","edge_grad_std")}
    cnt=max(contours,key=cv2.contourArea); peri=cv2.arcLength(cnt,True)+1e-9
    hull=cv2.convexHull(cnt); ha=cv2.contourArea(hull)+1e-9; hp=cv2.arcLength(hull,True)+1e-9
    sx=cv2.Sobel(roi_gray,cv2.CV_32F,1,0,ksize=3); sy=cv2.Sobel(roi_gray,cv2.CV_32F,0,1,ksize=3)
    ins=np.sqrt(sx**2+sy**2)[bw>0]
    return {"border_irregularity":_safe(peri**2/(4*math.pi*area)),"fractal_dim":_fractal(bw),
            "convexity":_safe(hp/peri),"solidity":_safe(area/ha),
            "edge_grad_mean":_safe(float(ins.mean())) if ins.size else 0.0,
            "edge_grad_std":_safe(float(ins.std())) if ins.size else 0.0}

_ABCDE_COLORS={"col_white":([200,200,200],[255,255,255]),"col_red":([0,0,120],[80,80,255]),
               "col_ltbrown":([100,80,80],[200,160,160]),"col_dkbrown":([20,10,10],[100,80,80]),
               "col_blue":([100,0,0],[255,80,80]),"col_black":([0,0,0],[50,50,50])}

def color_features(roi_rgb, bw):
    feats={}; mask=bw.astype(bool)
    if not mask.any():
        for sp in("rgb","hsv","lab"):
            for c in range(3):
                for s in("mean","std","skew","kurt","entropy"): feats[f"color_{sp}_ch{c}_{s}"]=0.0
        feats.update(color_white_frac=0.,color_dark_frac=0.,color_dominant_spread=0.,color_n_abcde_colors=0.)
        for k in _ABCDE_COLORS: feats[k]=0.0
        return feats
    roi_hsv=cv2.cvtColor(roi_rgb,cv2.COLOR_RGB2HSV).astype(np.float32)
    roi_lab=cv2.cvtColor(roi_rgb,cv2.COLOR_RGB2LAB).astype(np.float32)
    roi_f=roi_rgb.astype(np.float32)
    def _ch(img,ci,prefix):
        vals=img[:,:,ci][mask].astype(np.float64); mu,sd,sk,ku=_mstats(vals)
        p=np.histogram(vals,bins=64,range=(0,255))[0]; p=p/(p.sum()+1e-9)
        feats[f"{prefix}_mean"]=_safe(mu); feats[f"{prefix}_std"]=_safe(sd)
        feats[f"{prefix}_skew"]=_safe(sk); feats[f"{prefix}_kurt"]=_safe(ku)
        feats[f"{prefix}_entropy"]=_safe(-float((p*np.log2(p+1e-9)).sum()))
    for ci in range(3):
        _ch(roi_f,ci,f"color_rgb_ch{ci}"); _ch(roi_hsv,ci,f"color_hsv_ch{ci}"); _ch(roi_lab,ci,f"color_lab_ch{ci}")
    px=roi_rgb[mask]; n=len(px)+1e-9
    feats["color_white_frac"]=_safe(float(np.all(px>200,1).sum())/n)
    feats["color_dark_frac"]=_safe(float(np.all(px<50,1).sum())/n)
    lum=0.299*px[:,0].astype(float)+0.587*px[:,1]+0.114*px[:,2]
    feats["color_dominant_spread"]=_safe(float(np.percentile(lum,75)-np.percentile(lum,25)))
    roi_bgr=cv2.cvtColor(roi_rgb,cv2.COLOR_RGB2BGR); bw_u8=(bw*255).astype(np.uint8); nc=0
    for k,(lo,hi) in _ABCDE_COLORS.items():
        cm=cv2.inRange(roi_bgr,np.array(lo,np.uint8),np.array(hi,np.uint8))
        cm=cv2.bitwise_and(cm,cm,mask=bw_u8); frac=float(cm.sum()/255)/n
        feats[k]=_safe(frac)
        if frac>0.01: nc+=1
    feats["color_n_abcde_colors"]=float(nc)
    return feats

def _glcm(patch,levels=32):
    q=np.clip(patch.astype(np.float32)/255.*(levels-1),0,levels-1).astype(np.int32)
    ii,jj=np.mgrid[0:levels,0:levels]
    res={k:[] for k in("contrast","dissimilarity","homogeneity","energy","correlation")}
    for dy,dx in[(0,1),(-1,1),(1,0),(1,1)]:
        r2=slice(max(0,-dy),q.shape[0]-dy if dy>0 else None); r1=slice(dy if dy>0 else max(0,-dy),None if dy<=0 else None)
        c2=slice(max(0,-dx),q.shape[1]-dx if dx>0 else None); c1=slice(dx if dx>0 else max(0,-dx),None if dx<=0 else None)
        a=q[r2,c2].ravel(); b=q[r1,c1].ravel()
        g=np.zeros((levels,levels),np.float64); np.add.at(g,(a,b),1); np.add.at(g,(b,a),1); g/=(g.sum()+1e-9)
        diff=ii-jj
        res["contrast"].append(float((diff**2*g).sum())); res["dissimilarity"].append(float((np.abs(diff)*g).sum()))
        res["homogeneity"].append(float((g/(1+diff**2)).sum())); res["energy"].append(float((g**2).sum()))
        mi_=(ii*g).sum(); mj_=(jj*g).sum()
        si=math.sqrt(float(((ii-mi_)**2*g).sum())+1e-9); sj=math.sqrt(float(((jj-mj_)**2*g).sum())+1e-9)
        res["correlation"].append(float(((ii-mi_)*(jj-mj_)*g).sum()/(si*sj)))
    out={}
    for k,v in res.items(): out[f"glcm_{k}_mean"]=_safe(float(np.mean(v))); out[f"glcm_{k}_std"]=_safe(float(np.std(v)))
    return out

def _lbp(gray,bw,n_points=8,radius=1):
    g=gray.astype(np.int32); lbp=np.zeros_like(g)
    for p in range(n_points):
        theta=2*math.pi*p/n_points; dy=int(round(-radius*math.sin(theta))); dx=int(round(radius*math.cos(theta)))
        nb=np.roll(np.roll(g,-dy,axis=0),-dx,axis=1); lbp+=((nb>=g).astype(np.int32)<<p)
    ins=lbp[bw>127].astype(np.float64)
    if ins.size==0: return {"lbp_mean":0.,"lbp_std":0.,"lbp_entropy":0.}
    p=np.histogram(ins,bins=n_points+2,range=(0,255))[0]; p=p/(p.sum()+1e-9)
    return {"lbp_mean":_safe(float(ins.mean())),"lbp_std":_safe(float(ins.std())),
            "lbp_entropy":_safe(-float((p*np.log2(p+1e-9)).sum()))}

def _gabor(gray_f32,bw):
    feats={}
    for sc in(3,5,9):
        for ang in(0,45,90,135):
            kern=cv2.getGaborKernel((sc*2+1,sc*2+1),sc*.56,math.radians(ang),sc*1.2,.5,0,cv2.CV_32F)
            ins=cv2.filter2D(gray_f32,cv2.CV_32F,kern)[bw>127]
            feats[f"gabor_s{sc}_a{ang}_energy"]=_safe(float((ins**2).mean())) if ins.size else 0.
    return feats

def texture_features(roi_gray,bw):
    area=bw.sum()
    z={f"glcm_{k}_{s}":0. for k in("contrast","dissimilarity","homogeneity","energy","correlation") for s in("mean","std")}
    if area==0:
        z.update(lbp_mean=0.,lbp_std=0.,lbp_entropy=0.)
        for sc in(3,5,9):
            for a in(0,45,90,135): z[f"gabor_s{sc}_a{a}_energy"]=0.
        return z
    ys,xs=np.where(bw>0); patch=roi_gray[ys.min():ys.max()+1,xs.min():xs.max()+1]
    feats=_glcm(patch); feats.update(_lbp(roi_gray,bw)); feats.update(_gabor(roi_gray.astype(np.float32)/255.,bw))
    return feats

def evolution_features(bw,area,contours,img_shape):
    img_area=float(img_shape[0]*img_shape[1]); feats={"lesion_to_image_ratio":_safe(area/(img_area+1e-9))}
    if not contours or area==0:
        for k in("bbox_fill_ratio","extent","major_axis","minor_axis","eccentricity"): feats[k]=0.
        return feats
    cnt=max(contours,key=cv2.contourArea); x,y,w,h=cv2.boundingRect(cnt)
    feats["bbox_fill_ratio"]=_safe(area/img_area); feats["extent"]=_safe(area/(float(w*h)+1e-9))
    if len(cnt)>=5:
        (_,_),(ma,mi),_=cv2.fitEllipse(cnt)
        feats["major_axis"]=_safe(float(ma)); feats["minor_axis"]=_safe(float(mi))
        feats["eccentricity"]=_safe(math.sqrt(max(0.,1-(mi/(ma+1e-9))**2)))
    else: feats["major_axis"]=feats["minor_axis"]=feats["eccentricity"]=0.
    return feats

def histogram_radiomics(roi_gray,bw):
    vals=roi_gray[bw.astype(bool)].astype(np.float64)
    z={k:0. for k in("hist_energy","hist_entropy","hist_mean","hist_variance","hist_kurtosis",
        "hist_skewness","hist_p10","hist_p25","hist_p75","hist_p90","hist_iqr","hist_range",
        "hist_rms","hist_uniformity","hist_median","hist_mad")}
    if vals.size==0: return z
    p=np.histogram(vals,bins=128,range=(0,255))[0]; p=p/(p.sum()+1e-9)
    mu=vals.mean(); sig=vals.std()+1e-9; p10,p25,p75,p90=np.percentile(vals,[10,25,75,90])
    return {"hist_energy":_safe(float((p**2).sum())),"hist_entropy":_safe(float(-(p*np.log2(p+1e-9)).sum())),
            "hist_mean":_safe(float(mu)),"hist_variance":_safe(float(vals.var())),
            "hist_kurtosis":_safe(float(((vals-mu)**4).mean()/sig**4)),
            "hist_skewness":_safe(float(((vals-mu)**3).mean()/sig**3)),
            "hist_p10":_safe(float(p10)),"hist_p25":_safe(float(p25)),
            "hist_p75":_safe(float(p75)),"hist_p90":_safe(float(p90)),
            "hist_iqr":_safe(float(p75-p25)),"hist_range":_safe(float(vals.max()-vals.min())),
            "hist_rms":_safe(float(math.sqrt((vals**2).mean()))),"hist_uniformity":_safe(float((p**2).sum())),
            "hist_median":_safe(float(np.median(vals))),"hist_mad":_safe(float(np.abs(vals-mu).mean()))}

def shape_radiomics(bw,area,contours):
    z={k:0. for k in("shape_perimeter","shape_area","shape_sphericity","shape_roundness",
        "shape_pd_ratio","shape_max_diameter","shape_min_diameter")}
    if not contours or area==0: return z
    cnt=max(contours,key=cv2.contourArea); peri=cv2.arcLength(cnt,True)+1e-9
    feats={"shape_perimeter":_safe(peri),"shape_area":_safe(area),
           "shape_sphericity":_safe(4*math.pi*area/peri**2),
           "shape_roundness":_safe(4*area/(math.pi*(peri/math.pi)**2)),
           "shape_pd_ratio":_safe(peri/(2*math.sqrt(math.pi*area)))}
    pts=cv2.convexHull(cnt)[:,0,:]
    if len(pts)>=2:
        d=np.sqrt(((pts[:,None]-pts[None,:])**2).sum(-1))
        feats["shape_max_diameter"]=_safe(float(d.max()))
        pos=d[d>0]; feats["shape_min_diameter"]=_safe(float(pos.min()) if pos.size else 0.)
    else: feats["shape_max_diameter"]=feats["shape_min_diameter"]=0.
    return feats

def glrlm_features(roi_gray,bw,levels=32,max_run=64):
    area=bw.sum()
    z={k:0. for k in("glrlm_sre","glrlm_lre","glrlm_gln","glrlm_rln","glrlm_rp","glrlm_lgre","glrlm_hgre")}
    if area==0: return z
    q=np.clip(roi_gray.astype(np.float32)/255.*(levels-1),0,levels-1).astype(np.int32)
    glrlm=np.zeros((levels,max_run),np.float64); H,W=q.shape
    for row in range(H):
        rq=q[row]; rb=bw[row]
        if not rb.any(): continue
        vals=rq*rb; changes=np.diff(vals,prepend=-(levels+1))!=0; mon=np.diff(rb.astype(np.int8),prepend=0)>0
        starts=np.where((changes|mon)&(rb>0))[0]; ends=np.append(starts[1:],W)
        for s,e in zip(starts,ends):
            sl=rb[s:e]; off=np.argmin(sl)
            ln=off if (not sl[off]) and off>0 else len(sl)
            glrlm[rq[s],min(ln,max_run)-1]+=1
    total=glrlm.sum()+1e-9
    RL=np.arange(1,max_run+1,dtype=np.float64)[np.newaxis,:]; GL=np.arange(1,levels+1,dtype=np.float64)[:,np.newaxis]
    return {"glrlm_sre":_safe(float((glrlm/(RL**2)).sum()/total)),"glrlm_lre":_safe(float((glrlm*RL**2).sum()/total)),
            "glrlm_gln":_safe(float((glrlm.sum(1)**2).sum()/total)),"glrlm_rln":_safe(float((glrlm.sum(0)**2).sum()/total)),
            "glrlm_rp":_safe(float(total/area)),"glrlm_lgre":_safe(float((glrlm/(GL**2)).sum()/total)),
            "glrlm_hgre":_safe(float((glrlm*GL**2).sum()/total))}

def hu_moments_features(bw):
    hu=cv2.HuMoments(cv2.moments(bw)).flatten()
    return {f"hu_moment_{i+1}":_safe(-math.copysign(1,h)*math.log10(abs(h)+1e-15)) for i,h in enumerate(hu)}

def fourier_descriptor_features(contours,n_desc=10):
    feats={f"fourier_desc_{i+1}":0. for i in range(n_desc)}
    if not contours: return feats
    cnt=max(contours,key=cv2.contourArea)[:,0,:]
    if len(cnt)<n_desc*2: return feats
    z=cnt[:,0].astype(np.float64)+1j*cnt[:,1].astype(np.float64)
    fd=np.fft.fft(z); norm=abs(fd[1])+1e-9
    for i,m in enumerate(np.abs(fd[1:n_desc+1])/norm): feats[f"fourier_desc_{i+1}"]=_safe(float(m))
    return feats

def extract_features_from_arrays(roi_rgb: np.ndarray, mask_clean: np.ndarray) -> dict:
    mask_bin=cv2.resize(mask_clean,(roi_rgb.shape[1],roi_rgb.shape[0]),interpolation=cv2.INTER_NEAREST)
    roi_rgb_s,mask_s=_resize(roi_rgb,mask_bin,max_dim=512)
    roi_gray_s=cv2.cvtColor(cv2.cvtColor(roi_rgb_s,cv2.COLOR_RGB2BGR),cv2.COLOR_BGR2GRAY)
    bw=(mask_s>127).astype(np.uint8); area=float(bw.sum())
    contours,_=cv2.findContours(bw,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
    record={}
    record.update(asymmetry_features(bw,area,contours))
    record.update(border_features(bw,area,contours,roi_gray_s))
    record.update(color_features(roi_rgb_s,bw))
    record.update(texture_features(roi_gray_s,bw))
    record.update(evolution_features(bw,area,contours,roi_rgb_s.shape[:2]))
    record.update(histogram_radiomics(roi_gray_s,bw))
    record.update(shape_radiomics(bw,area,contours))
    record.update(glrlm_features(roi_gray_s,bw))
    record.update(hu_moments_features(bw))
    record.update(fourier_descriptor_features(contours))
    record.update(pyradiomics_features(roi_gray_s,bw))
    return record
