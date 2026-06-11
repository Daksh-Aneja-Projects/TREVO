from PIL import Image
import sys

img = Image.open(sys.argv[1]).convert("RGBA")
pixels = img.load()
w, h = img.size

corners = []
for x, y in [(0,0), (w-1,0), (0,h-1), (w-1,h-1),
              (10,10), (w-11,10), (10,h-11), (w-11,h-11)]:
    corners.append(pixels[x, y][:3])

bg_r = sum(c[0] for c in corners) // len(corners)
bg_g = sum(c[1] for c in corners) // len(corners)
bg_b = sum(c[2] for c in corners) // len(corners)

threshold = 45

for y_pos in range(h):
    for x_pos in range(w):
        r, g, b, a = pixels[x_pos, y_pos]
        dist = ((r - bg_r)**2 + (g - bg_g)**2 + (b - bg_b)**2) ** 0.5
        if dist < threshold:
            pixels[x_pos, y_pos] = (r, g, b, 0)
        elif dist < threshold + 20:
            factor = (dist - threshold) / 20
            pixels[x_pos, y_pos] = (r, g, b, int(a * factor))

bbox = img.getbbox()
if bbox:
    img = img.crop(bbox)

img.save(sys.argv[2], "PNG")
print(f"Done. Output: {sys.argv[2]}, Size: {img.size}")
