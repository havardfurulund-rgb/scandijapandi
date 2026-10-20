#!/usr/bin/env python3
"""Studio pass v2 for product cutouts.

Takes the 2000x2500 studio photos in content/launch/product-studio, isolates the
object from the flat beige background, polishes the photo (white balance,
contrast, clarity, dust), and re-composes it centred on a soft paper gradient
with a natural contact shadow. Outputs 4:5 (1200x1500) and square (900x900)
web images into public/launch/products.

The product itself is never altered – only cut out, graded and re-lit.
"""
import sys, os
import numpy as np
import cv2
from PIL import Image, ImageFilter

SRC = "content/launch/product-studio"
OUT = "public/launch/products"
IDS = sys.argv[1:] or ["5475", "5476", "5479", "5477", "5465", "5469"]

PAPER_CENTER = np.array([246, 243, 237], dtype=np.float32)  # warm paper
PAPER_EDGE = np.array([228, 223, 214], dtype=np.float32)


def object_mask(img_bgr):
    """Mask of the object. The backdrop is a smooth beige gradient, so the
    object is found by chroma difference and local texture – not by lightness,
    which varies across the backdrop."""
    h, w = img_bgr.shape[:2]
    lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
    band = np.concatenate([lab[:60].reshape(-1, 3), lab[-60:].reshape(-1, 3), lab[:, :60].reshape(-1, 3), lab[:, -60:].reshape(-1, 3)])
    bg = np.median(band, axis=0)
    chroma = np.sqrt((lab[:, :, 1] - bg[1]) ** 2 + (lab[:, :, 2] - bg[2]) ** 2)
    L = lab[:, :, 0]
    mean = cv2.blur(L, (9, 9))
    sq = cv2.blur(L * L, (9, 9))
    texture = np.sqrt(np.maximum(sq - mean * mean, 0))
    dark = L < bg[0] - 55          # clearly darker than the backdrop (shadow is only ~15-25 darker)
    mask = ((chroma > 7) | (texture > 7) | dark).astype(np.uint8)
    # near-white = cropped frame edge, never object
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    mask[(hsv[:, :, 2] > 240) & (hsv[:, :, 1] < 18)] = 0
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, k, iterations=3)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)), iterations=2)
    n, labels, stats, _ = cv2.connectedComponentsWithStats(mask, 8)
    if n > 1:
        areas = stats[1:, cv2.CC_STAT_AREA]
        keep = [i + 1 for i, a in enumerate(areas) if a > areas.max() * 0.03]
        mask = np.isin(labels, keep).astype(np.uint8)
    # fill only small enclosed holes (knit gaps), keep large ones open
    inv = (1 - mask).astype(np.uint8)
    n2, lab2, st2, _ = cv2.connectedComponentsWithStats(inv, 4)
    obj_area = mask.sum()
    for i in range(1, n2):
        x, y, ww, hh, area = st2[i]
        touches = x == 0 or y == 0 or x + ww == w or y + hh == h
        if not touches and area < obj_area * 0.02:
            mask[lab2 == i] = 1
    return mask


def grade(img_bgr, mask):
    """White balance on the backdrop, gentle contrast + clarity, dust removal."""
    img = img_bgr.astype(np.float32)
    bg_pix = img[mask == 0]
    if len(bg_pix) > 1000:
        bg_mean = bg_pix.mean(axis=0)
        target = bg_mean.mean()
        gain = target / np.maximum(bg_mean, 1)
        gain = np.clip(gain, 0.9, 1.1)
        img = img * gain
    # S-curve contrast in LAB L
    lab = cv2.cvtColor(np.clip(img, 0, 255).astype(np.uint8), cv2.COLOR_BGR2LAB).astype(np.float32)
    L = lab[:, :, 0] / 255.0
    L = np.clip((L - 0.5) * 1.12 + 0.5 + 0.03, 0, 1)
    lab[:, :, 0] = L * 255
    img = cv2.cvtColor(lab.astype(np.uint8), cv2.COLOR_LAB2BGR)
    # clarity: unsharp mask with large radius, modest amount
    blur = cv2.GaussianBlur(img, (0, 0), 6)
    img = cv2.addWeighted(img, 1.25, blur, -0.25, 0)
    # fine sharpen
    blur2 = cv2.GaussianBlur(img, (0, 0), 1.2)
    img = cv2.addWeighted(img, 1.35, blur2, -0.35, 0)
    return np.clip(img, 0, 255).astype(np.uint8)


def paper(w, h):
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    cx, cy = w / 2, h * 0.45
    r = np.sqrt(((xx - cx) / (w * 0.75)) ** 2 + ((yy - cy) / (h * 0.75)) ** 2)
    t = np.clip(r, 0, 1)[..., None]
    rgb = PAPER_CENTER * (1 - t) + PAPER_EDGE * t
    # subtle paper grain
    rng = np.random.default_rng(7)
    grain = rng.normal(0, 1.6, (h, w, 1))
    return np.clip(rgb + grain, 0, 255).astype(np.uint8)


def compose(img_rgb, alpha, out_w, out_h, fill=0.74):
    ys, xs = np.where(alpha > 0.5)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    obj = img_rgb[y0:y1 + 1, x0:x1 + 1]
    a = alpha[y0:y1 + 1, x0:x1 + 1]
    oh, ow = obj.shape[:2]
    scale = min(out_w * fill / ow, out_h * fill / oh)
    nw, nh = int(ow * scale), int(oh * scale)
    obj = cv2.resize(obj, (nw, nh), interpolation=cv2.INTER_AREA)
    a = cv2.resize(a, (nw, nh), interpolation=cv2.INTER_AREA)
    canvas = paper(out_w, out_h).astype(np.float32)
    ox, oy = (out_w - nw) // 2, int((out_h - nh) * 0.48)
    # contact shadow: blurred, offset alpha, multiplied in
    sh = np.zeros((out_h, out_w), np.float32)
    sh[oy:oy + nh, ox:ox + nw] = a
    sh = cv2.GaussianBlur(sh, (0, 0), out_w * 0.018)
    sh = np.roll(sh, int(out_h * 0.012), axis=0)
    canvas *= (1 - 0.28 * sh)[..., None]
    # object
    region = canvas[oy:oy + nh, ox:ox + nw]
    region[:] = obj * a[..., None] + region * (1 - a[..., None])
    return np.clip(canvas, 0, 255).astype(np.uint8)


def process(pid):
    src = os.path.join(SRC, f"IMG_{pid}_studio_2000x2500.jpg")
    bgr = cv2.imread(src)
    mask = object_mask(bgr)
    graded = grade(bgr, mask)
    alpha = cv2.GaussianBlur(mask.astype(np.float32), (0, 0), 2.0)
    rgb = cv2.cvtColor(graded, cv2.COLOR_BGR2RGB)
    out45 = compose(rgb, alpha, 1200, 1500)
    outsq = compose(rgb, alpha, 900, 900, fill=0.78)
    Image.fromarray(out45).save(os.path.join(OUT, f"dyra-{pid}-4x5.jpg"), quality=80, optimize=True, progressive=True)
    Image.fromarray(outsq).save(os.path.join(OUT, f"dyra-{pid}-sq.jpg"), quality=80, optimize=True, progressive=True)
    cov = mask.mean()
    print(f"{pid}: mask coverage {cov:.2%}")


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for pid in IDS:
        process(pid)
