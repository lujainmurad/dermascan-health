import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD  = [0.229, 0.224, 0.225]

class ImageNetNorm(nn.Module):
    def __init__(self):
        super().__init__()
        self.register_buffer("mean", torch.tensor(IMAGENET_MEAN).view(1,3,1,1))
        self.register_buffer("std",  torch.tensor(IMAGENET_STD).view(1,3,1,1))
    def forward(self, x): return (x - self.mean) / self.std

class ConvBlock(nn.Module):
    def __init__(self, in_ch, out_ch, drop=0.0):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(in_ch, out_ch, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_ch), nn.ReLU(inplace=True),
            nn.Conv2d(out_ch, out_ch, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_ch), nn.ReLU(inplace=True),
            nn.Dropout2d(drop) if drop > 0.0 else nn.Identity(),
        )
    def forward(self, x): return self.net(x)

class SEBlock(nn.Module):
    def __init__(self, ch, r=16):
        super().__init__()
        mid = max(ch // r, 4)
        self.fc = nn.Sequential(
            nn.AdaptiveAvgPool2d(1), nn.Flatten(),
            nn.Linear(ch, mid), nn.ReLU(inplace=True),
            nn.Linear(mid, ch), nn.Sigmoid(),
        )
    def forward(self, x):
        return x * self.fc(x).view(x.size(0), x.size(1), 1, 1)

class DualDilationASPP(nn.Module):
    def __init__(self, in_ch, out_ch, rates_a=(6,12,18), rates_b=(3,6,9), drop=0.1):
        super().__init__()
        def _br(r):
            return nn.Sequential(
                nn.Conv2d(in_ch, out_ch, 3, padding=r, dilation=r, bias=False),
                nn.BatchNorm2d(out_ch), nn.ReLU(inplace=True))
        self.b0 = nn.Sequential(
            nn.Conv2d(in_ch, out_ch, 1, bias=False), nn.BatchNorm2d(out_ch), nn.ReLU(inplace=True))
        self.branches_a = nn.ModuleList([_br(r) for r in rates_a])
        self.branches_b = nn.ModuleList([_br(r) for r in rates_b])
        self.gap = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
            nn.Conv2d(in_ch, out_ch, 1, bias=False), nn.BatchNorm2d(out_ch), nn.ReLU(inplace=True))
        n = 1 + len(rates_a) + len(rates_b) + 1
        self.project = nn.Sequential(
            nn.Conv2d(n * out_ch, out_ch, 1, bias=False),
            nn.BatchNorm2d(out_ch), nn.ReLU(inplace=True), nn.Dropout2d(drop))
    def forward(self, x):
        h, w = x.shape[-2:]
        parts = [self.b0(x)] + [br(x) for br in self.branches_a] + [br(x) for br in self.branches_b]
        parts.append(F.interpolate(self.gap(x), (h,w), mode="bilinear", align_corners=False))
        return self.project(torch.cat(parts, dim=1))

class ChannelAttention(nn.Module):
    def __init__(self, ch, r=16):
        super().__init__()
        mid = max(ch // r, 1)
        self.mlp = nn.Sequential(nn.Flatten(), nn.Linear(ch,mid), nn.ReLU(inplace=True), nn.Linear(mid,ch))
    def forward(self, x):
        a = self.mlp(F.adaptive_avg_pool2d(x,1))
        m = self.mlp(F.adaptive_max_pool2d(x,1))
        return x * torch.sigmoid(a + m).view(x.size(0), x.size(1), 1, 1)

class SpatialAttentionCBAM(nn.Module):
    def __init__(self, ks=7):
        super().__init__()
        self.conv = nn.Conv2d(2, 1, ks, padding=(ks-1)//2, bias=False)
        self.bn   = nn.BatchNorm2d(1)
    def forward(self, x):
        avg = x.mean(dim=1, keepdim=True)
        mx, _ = x.max(dim=1, keepdim=True)
        return x * torch.sigmoid(self.bn(self.conv(torch.cat([avg, mx], dim=1))))

class CBAM(nn.Module):
    def __init__(self, ch):
        super().__init__()
        self.ca = ChannelAttention(ch)
        self.sa = SpatialAttentionCBAM()
    def forward(self, x): return self.sa(self.ca(x))

class UpBlock(nn.Module):
    def __init__(self, in_ch, skip_ch, out_ch, drop=0.1):
        super().__init__()
        self.up = nn.Sequential(
            nn.Upsample(scale_factor=2, mode="bilinear", align_corners=False),
            nn.Conv2d(in_ch, out_ch, 1, bias=False),
            nn.BatchNorm2d(out_ch), nn.ReLU(inplace=True),
        )
        self.cbam = CBAM(skip_ch)
        self.conv = ConvBlock(out_ch + skip_ch, out_ch, drop=drop)
        self.se   = SEBlock(out_ch)
    def forward(self, x, skip):
        g = self.up(x)
        if g.shape[-2:] != skip.shape[-2:]:
            g = F.interpolate(g, size=skip.shape[-2:], mode="bilinear", align_corners=False)
        return self.se(self.conv(torch.cat([g, self.cbam(skip)], dim=1)))

class ResNetUNetV4(nn.Module):
    def __init__(self, pretrained=False, drop=0.1):
        super().__init__()
        self.norm = ImageNetNorm()
        enc = models.resnet50(weights=None)
        self.stem = nn.Sequential(enc.conv1, enc.bn1, enc.relu)
        self.pool = enc.maxpool
        self.e1   = enc.layer1
        self.e2   = enc.layer2
        self.e3   = enc.layer3
        self.e4   = enc.layer4
        self.bot_reduce = nn.Sequential(
            nn.Conv2d(2048, 512, 1, bias=False), nn.BatchNorm2d(512), nn.ReLU(inplace=True))
        self.aspp     = DualDilationASPP(512, 512, drop=drop)
        self.cbam_bot = CBAM(512)
        self.d1 = UpBlock(512, 1024, 256, drop=drop)
        self.d2 = UpBlock(256,  512, 128, drop=drop)
        self.d3 = UpBlock(128,  256,  64, drop=drop)
        self.d4 = UpBlock( 64,   64,  64, drop=drop)
        self.final = nn.Sequential(
            nn.Upsample(scale_factor=2, mode="bilinear", align_corners=False),
            ConvBlock(64, 32, drop=0.0),
            nn.Conv2d(32, 1, 1),
        )
        self.aux0 = nn.Conv2d(512, 1, 1)
        self.aux1 = nn.Conv2d(256, 1, 1)
        self.aux2 = nn.Conv2d(128, 1, 1)

    def forward(self, x):
        x  = self.norm(x)
        s0 = self.stem(x)
        p  = self.pool(s0)
        s1 = self.e1(p)
        s2 = self.e2(s1)
        s3 = self.e3(s2)
        s4 = self.e4(s3)
        b  = self.cbam_bot(self.aspp(self.bot_reduce(s4)))
        d1 = self.d1(b,  s3)
        d2 = self.d2(d1, s2)
        d3 = self.d3(d2, s1)
        d4 = self.d4(d3, s0)
        return self.final(d4)

_model = None
_device = None

def get_model():
    global _model, _device
    if _model is not None:
        return _model, _device
    import os
    _device = torch.device("cpu")
    model_path = os.path.join(os.path.dirname(__file__), "best_model.pt")
    print(f"Loading model from {model_path}")
    checkpoint = torch.load(model_path, map_location=_device)
    if isinstance(checkpoint, dict):
        state = checkpoint.get("model_state", checkpoint.get("state_dict", checkpoint))
    else:
        state = checkpoint
    if any(k.startswith("module.") for k in state.keys()):
        state = {k.replace("module.", "", 1): v for k, v in state.items()}
    _model = ResNetUNetV4(pretrained=False, drop=0.1).to(_device)
    missing, unexpected = _model.load_state_dict(state, strict=False)
    if missing:   print(f"WARNING missing keys: {missing[:3]}")
    if unexpected: print(f"WARNING unexpected keys: {unexpected[:3]}")
    _model.eval()
    print("Model loaded successfully.")
    return _model, _device
