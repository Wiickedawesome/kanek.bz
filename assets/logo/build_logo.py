#!/usr/bin/env python3
"""
Official Kanek Brand Logo Generator
Generates:
  - kanek_logo.svg        (Full canvas vector with typography, 2720x1536)
  - kanek_logo_icon.svg   (Tight toucan emblem vector, 1000x970)
  - kanek_logo.png        (Full canvas raster, 2720x1536)
  - kanek_logo_icon.png   (Tight toucan emblem raster, 1000x970)

Also syncs exports to public/logo/ for Next.js website distribution.
"""

import os
import shutil
import subprocess

DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.abspath(os.path.join(DIR, "../../public/logo"))

os.makedirs(DIR, exist_ok=True)
os.makedirs(PUBLIC_DIR, exist_ok=True)

OUT_SVG = os.path.join(DIR, "kanek_logo.svg")
OUT_ICON_SVG = os.path.join(DIR, "kanek_logo_icon.svg")
OUT_PNG = os.path.join(DIR, "kanek_logo.png")
OUT_ICON_PNG = os.path.join(DIR, "kanek_logo_icon.png")

def build():
    # 1. Ensure master SVGs exist
    if not os.path.exists(OUT_SVG) or not os.path.exists(OUT_ICON_SVG):
        raise FileNotFoundError("Master SVG templates not found in assets/logo/")
    
    # 2. Render high-res raster PNGs via Inkscape
    print("Rendering high-res raster PNGs via Inkscape...")
    cmd_full = f"/snap/bin/inkscape {OUT_SVG} --export-type=png --export-filename={OUT_PNG} --export-width=2720 --export-height=1536"
    subprocess.run(cmd_full, shell=True, check=True)
    print(f"Exported {OUT_PNG}")
    
    cmd_icon = f"/snap/bin/inkscape {OUT_ICON_SVG} --export-type=png --export-filename={OUT_ICON_PNG} --export-width=1000 --export-height=970"
    subprocess.run(cmd_icon, shell=True, check=True)
    print(f"Exported {OUT_ICON_PNG}")
    
    # 3. Sync to public/logo/
    print(f"Syncing official assets to {PUBLIC_DIR}...")
    for fname in ["kanek_logo.svg", "kanek_logo_icon.svg", "kanek_logo.png", "kanek_logo_icon.png"]:
        src = os.path.join(DIR, fname)
        dst = os.path.join(PUBLIC_DIR, fname)
        shutil.copyfile(src, dst)
        print(f"  Synced {fname} -> public/logo/")
    
    print("Build and sync completed successfully!")

if __name__ == "__main__":
    build()
