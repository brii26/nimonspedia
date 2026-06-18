#!/usr/bin/env python3
"""
Usage: python3 scripts/process-mascot.py <input_image>
Removes white background, generates favicon.ico + favicon.png
"""
import sys
from PIL import Image
import numpy as np

def remove_white_background(img, threshold=240):
    img = img.convert("RGBA")
    data = np.array(img)
    r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
    white_mask = (r > threshold) & (g > threshold) & (b > threshold)
    data[:,:,3] = np.where(white_mask, 0, a)
    return Image.fromarray(data)

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 process-mascot.py <input_image>")
        sys.exit(1)

    src = sys.argv[1]
    img = Image.open(src)
    img_no_bg = remove_white_background(img)

    # Save transparent PNG (512x512 for PWA)
    png_out = "public/favicon.png"
    img_no_bg.resize((512, 512), Image.LANCZOS).save(png_out)
    print(f"Saved {png_out}")

    # Save favicon.ico (multi-size)
    ico_out = "public/favicon.ico"
    sizes = [(16,16), (32,32), (48,48)]
    icons = [img_no_bg.resize(s, Image.LANCZOS) for s in sizes]
    icons[0].save(ico_out, format="ICO", sizes=sizes, append_images=icons[1:])
    print(f"Saved {ico_out}")

    # Save apple-touch-icon
    apple_out = "public/apple-touch-icon.png"
    img_no_bg.resize((180, 180), Image.LANCZOS).save(apple_out)
    print(f"Saved {apple_out}")

if __name__ == "__main__":
    main()
