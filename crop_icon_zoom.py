import sys
import os
from PIL import Image

def process_icon():
    path = "/Users/mrts/.gemini/antigravity-ide/brain/667e4ef7-31ac-4885-8ca9-1ab8040cc976/habbit_infinity_chain_icon_1783252772095.png"
    
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return

    im = Image.open(path).convert('RGBA')
    width, height = im.size
    
    # We want to crop out the white corners. 
    # Let's find how far the white goes from the edges at the diagonals.
    # The simplest way to remove corners of a squircle and make it a full square 
    # is to crop a smaller square from the center.
    # If the squircle is roughly standard, cropping the center 70-80% will yield a solid square.
    
    # Let's find the first non-white pixel on the diagonal (0,0) to (width/2, height/2)
    pixels = im.load()
    crop_margin = 0
    for i in range(min(width, height) // 2):
        r, g, b, a = pixels[i, i]
        if r < 240 or g < 240 or b < 240:
            crop_margin = i
            break
            
    # Add a little buffer to be safe
    crop_margin = int(crop_margin * 1.2)
    
    # If crop_margin is 0, maybe it's not white at the corners?
    if crop_margin == 0:
        crop_margin = int(width * 0.15) # fallback 15% crop
        
    print(f"Calculated crop margin: {crop_margin}")
    
    left = crop_margin
    top = crop_margin
    right = width - crop_margin
    bottom = height - crop_margin
    
    print(f"Cropping to: {left}, {top}, {right}, {bottom}")
    cropped = im.crop((left, top, right, bottom))
    
    # Resize back to 1024x1024
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

if __name__ == "__main__":
    process_icon()
