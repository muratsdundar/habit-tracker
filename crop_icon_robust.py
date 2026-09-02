import sys
import os
from PIL import Image

def get_crop_box(im, threshold=240):
    width, height = im.size
    pixels = im.load()
    
    left = width
    right = 0
    top = height
    bottom = 0
    
    found = False
    for y in range(height):
        for x in range(width):
            pixel = pixels[x, y]
            if len(pixel) == 4:
                r, g, b, a = pixel
                if a < 10: 
                    continue
            else:
                r, g, b = pixel[:3]
                
            if r < threshold or g < threshold or b < threshold:
                if x < left: left = x
                if x > right: right = x
                if y < top: top = y
                if y > bottom: bottom = y
                found = True
                
    if not found:
        return None
    return (left, top, right + 1, bottom + 1)

def process_icon():
    path = "/Users/mrts/.gemini/antigravity-ide/brain/667e4ef7-31ac-4885-8ca9-1ab8040cc976/habbit_infinity_chain_icon_1783252772095.png"
    
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return

    im = Image.open(path).convert('RGBA')
    bbox = get_crop_box(im)
    
    if bbox:
        print(f"Cropping to bbox: {bbox}")
        cropped = im.crop(bbox)
        
        icon_1024 = cropped.resize((1024, 1024), Image.Resampling.LANCZOS)
        
        base_dir = "/Users/mrts/Desktop/habit-tracker/mobile"
        targets = [
            f"{base_dir}/assets/images/icon.png",
            f"{base_dir}/assets/images/splash-icon.png",
            f"{base_dir}/assets/images/android-icon-foreground.png",
            f"{base_dir}/assets/images/android-icon-background.png",
            f"{base_dir}/assets/images/favicon.png",
            f"{base_dir}/ios/HabbiT/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png"
        ]
        
        for t in targets:
            os.makedirs(os.path.dirname(t), exist_ok=True)
            icon_1024.save(t, format="PNG")
            print(f"Saved to {t}")
            
    else:
        print("Could not determine bounding box (image might be entirely white).")

if __name__ == "__main__":
    process_icon()
