import os
import math
import random
from PIL import Image, ImageDraw

random.seed(1337)

BASE_DIR = r"c:\Users\subha\OneDrive\Desktop\My OS\Curio_OS\public\assets\wallpapers"
W, H = 1920, 1080

def create_spring_layers():
    folder = os.path.join(BASE_DIR, "spring")
    os.makedirs(folder, exist_ok=True)

    # 1. Pastel Spring Sky (bg.webp)
    img_bg = Image.new("RGBA", (W, H))
    draw_bg = ImageDraw.Draw(img_bg)

    sky_colors = [
        (0.00, (68, 22, 92)),    # Deep lavender twilight
        (0.25, (136, 42, 114)),  # Soft magenta violet
        (0.50, (219, 75, 138)),  # Sakura rose pink
        (0.70, (244, 114, 182)), # Pastel bubblegum pink
        (0.85, (251, 182, 206)), # Soft blush peach
        (1.00, (255, 238, 242)), # Radiant morning blossom glow
    ]

    for y in range(H):
        ratio = y / H
        for i in range(len(sky_colors) - 1):
            r1, c1 = sky_colors[i]
            r2, c2 = sky_colors[i + 1]
            if r1 <= ratio <= r2:
                t = (ratio - r1) / (r2 - r1)
                r = int(c1[0] + (c2[0] - c1[0]) * t)
                g = int(c1[1] + (c2[1] - c1[1]) * t)
                b = int(c1[2] + (c2[2] - c1[2]) * t)
                draw_bg.line([(0, y), (W, y)], fill=(r, g, b, 255))
                break

    # Glowing soft morning sun in warm pastel peach
    sun_x, sun_y = int(W * 0.38), int(H * 0.52)
    for rad in range(140, 0, -2):
        alpha = int(95 * (1 - rad / 140))
        draw_bg.ellipse([sun_x - rad, sun_y - rad, sun_x + rad, sun_y + rad], fill=(255, 220, 230, alpha))
    draw_bg.ellipse([sun_x - 38, sun_y - 38, sun_x + 38, sun_y + 38], fill=(255, 250, 245, 240))

    # Fluffy drifting pastel clouds
    cloud_colors = [(255, 220, 235, 120), (245, 190, 220, 100), (255, 240, 245, 140)]
    for _ in range(16):
        cx = random.randint(-100, W + 100)
        cy = random.randint(int(H * 0.15), int(H * 0.60))
        c_w = random.randint(200, 520)
        c_h = random.randint(18, 44)
        c_col = random.choice(cloud_colors)
        draw_bg.rounded_rectangle([cx, cy, cx + c_w, cy + c_h], radius=c_h // 2, fill=c_col)
        draw_bg.rounded_rectangle([cx + 35, cy + 4, cx + c_w - 45, cy + c_h - 4], radius=(c_h - 8) // 2, fill=(255, 255, 255, c_col[3]))

    img_bg.save(os.path.join(folder, "bg.webp"), "WEBP", quality=90)
    print("Spring bg.webp created")

    # 2. Rolling Spring Hills & Cherry Blossom Groves (hills.webp)
    img_hills = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw_h = ImageDraw.Draw(img_hills)

    # Distant mountain silhouettes in soft pastel violet
    m_pts = [(0, H)]
    x = 0
    y = int(H * 0.58)
    while x <= W + 50:
        step = random.randint(45, 100)
        y = max(int(H * 0.48), min(int(H * 0.66), y + random.randint(-40, 40)))
        m_pts.append((x, y))
        x += step
    m_pts.append((W, H))
    draw_h.polygon(m_pts, fill=(120, 48, 110, 190))

    # Midground lush green rolling hill with sakura clumps
    h1_pts = [(0, H)]
    for x in range(0, W + 50, 40):
        hy = int(H * 0.68 + math.sin(x * 0.003) * 60 + math.cos(x * 0.006) * 25)
        h1_pts.append((x, hy))
    h1_pts.append((W, H))
    draw_h.polygon(h1_pts, fill=(22, 60, 48, 230))

    # Blooming cherry blossom groves on midground hills
    for tx in range(60, W, 85):
        ty = int(H * 0.68 + math.sin(tx * 0.003) * 60 + math.cos(tx * 0.006) * 25) - 8
        if random.random() > 0.3:
            # Tree puff
            trad = random.randint(22, 42)
            draw_h.ellipse([tx - trad, ty - trad, tx + trad, ty + trad // 2], fill=(244, 114, 182, 230))
            draw_h.ellipse([tx - trad + 6, ty - trad - 6, tx + trad - 6, ty + trad // 3], fill=(251, 207, 232, 240))

    # Foreground rolling hill (fresh spring green)
    h2_pts = [(0, H)]
    for x in range(0, W + 50, 30):
        hy = int(H * 0.82 + math.sin(x * 0.004 + 1) * 45)
        h2_pts.append((x, hy))
    h2_pts.append((W, H))
    draw_h.polygon(h2_pts, fill=(14, 45, 34, 255))

    # Flower patches on foreground grass
    for fx in range(30, W - 30, 24):
        fy = int(H * 0.82 + math.sin(fx * 0.004 + 1) * 45) + random.randint(15, 120)
        if fy < H - 10 and random.random() > 0.4:
            draw_h.ellipse([fx - 3, fy - 3, fx + 3, fy + 3], fill=(251, 113, 133, 240))
            draw_h.ellipse([fx - 1, fy - 1, fx + 1, fy + 1], fill=(255, 255, 255, 255))

    img_hills.save(os.path.join(folder, "hills.webp"), "WEBP", quality=90)
    print("Spring hills.webp created")

    # 3. Foreground Framing Sakura Branches & Blooms (blossoms.webp)
    img_blossoms = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw_b = ImageDraw.Draw(img_blossoms)

    def draw_sakura_flower(bx, by, size=16):
        # 5 petals in star formation
        for angle in range(0, 360, 72):
            rad = math.radians(angle)
            px = bx + math.cos(rad) * (size * 0.8)
            py = by + math.sin(rad) * (size * 0.8)
            draw_b.ellipse([px - size * 0.6, py - size * 0.6, px + size * 0.6, py + size * 0.6], fill=(244, 114, 182, 240))
            draw_b.ellipse([px - size * 0.35, py - size * 0.35, px + size * 0.35, py + size * 0.35], fill=(251, 207, 232, 250))
        # Golden center
        draw_b.ellipse([bx - size * 0.25, by - size * 0.25, bx + size * 0.25, by + size * 0.25], fill=(252, 211, 77, 255))

    # Top-Right Branch sweeping into frame
    branch1_points = [
        (W + 20, -10),
        (W - 120, 60),
        (W - 280, 110),
        (W - 460, 130),
        (W - 620, 190),
        (W - 740, 240),
    ]
    for i in range(len(branch1_points) - 1):
        draw_b.line([branch1_points[i], branch1_points[i + 1]], fill=(42, 24, 18, 255), width=14 - i * 2)

    # Sub-branches
    sub_branches = [
        ((W - 280, 110), (W - 350, 200)),
        ((W - 460, 130), (W - 520, 230)),
        ((W - 620, 190), (W - 680, 290)),
        ((W - 380, 120), (W - 420, 40)),
    ]
    for start, end in sub_branches:
        draw_b.line([start, end], fill=(42, 24, 18, 255), width=6)

    # Abundant blossoms along branch 1
    flower_coords_1 = [
        (W - 100, 50), (W - 160, 85), (W - 220, 95), (W - 280, 120),
        (W - 340, 140), (W - 400, 130), (W - 460, 150), (W - 510, 180),
        (W - 580, 190), (W - 640, 220), (W - 700, 240), (W - 750, 260),
        (W - 340, 190), (W - 370, 210), (W - 500, 220), (W - 530, 240),
        (W - 660, 280), (W - 690, 310), (W - 410, 50), (W - 440, 30),
        (W - 180, 40), (W - 240, 140), (W - 310, 80), (W - 480, 100),
        (W - 590, 150), (W - 630, 250), (W - 720, 210), (W - 780, 280),
    ]
    for fx, fy in flower_coords_1:
        draw_sakura_flower(fx, fy, random.randint(14, 22))

    # Top-Left Branch sweeping in
    branch2_points = [
        (-20, -10),
        (100, 50),
        (220, 90),
        (340, 150),
        (440, 220),
    ]
    for i in range(len(branch2_points) - 1):
        draw_b.line([branch2_points[i], branch2_points[i + 1]], fill=(42, 24, 18, 255), width=12 - i * 2)

    flower_coords_2 = [
        (70, 40), (120, 60), (180, 80), (240, 100), (300, 130),
        (360, 160), (410, 190), (450, 230), (150, 120), (220, 150),
        (290, 190), (380, 120), (420, 260), (80, 90),
    ]
    for fx, fy in flower_coords_2:
        draw_sakura_flower(fx, fy, random.randint(13, 20))

    img_blossoms.save(os.path.join(folder, "blossoms.webp"), "WEBP", quality=90)
    print("Spring blossoms.webp created")

if __name__ == "__main__":
    create_spring_layers()
