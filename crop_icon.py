import sys
import os

try:
    from PIL import Image, ImageChops
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'Pillow'])
    from PIL import Image, ImageChops

def process_icon():
    path = "/Users/mrts/.gemini/antigravity-ide/brain/667e4ef7-31ac-4885-8ca9-1ab8040cc976/habbit_infinity_chain_icon_1783252772095.png"
    
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return

    im = Image.open(path).convert('RGBA')
    bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
    diff = ImageChops.difference(im, bg)
    bbox = diff.getbbox()
    
    if bbox:
        print(f"Cropping to bbox: {bbox}")
        cropped = im.crop(bbox)
        
        # We need a rounded or square image without the white padding.
        # Ensure it is resized to 1024x1024 for app icons
        icon_1024 = cropped.resize((1024, 1024), Image.Resampling.LANCZOS)
        
        # Target paths
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
            # Create directories if needed
            os.makedirs(os.path.dirname(t), exist_ok=True)
            icon_1024.save(t, format="PNG")
            print(f"Saved to {t}")
            
    else:
        print("Could not determine bounding box (image might be entirely white).")

if __name__ == "__main__":
    process_icon()
