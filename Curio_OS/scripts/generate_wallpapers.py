import os
import math
import random
from PIL import Image, ImageDraw, ImageFilter

random.seed(42)

BASE_DIR = r"c:\Users\subha\OneDrive\Desktop\My OS\Curio_OS\public\assets\wallpapers"
W, H = 1920, 1080

def create_twilight_layers():
    folder = os.path.join(BASE_DIR, "twilight")
    os.makedirs(folder, exist_ok=True)

    # 1. Sky & Clouds (bg.webp)
    img_bg = Image.new("RGBA", (W, H))
    draw_bg = ImageDraw.Draw(img_bg)

    # Sky gradient (vertical)
    sky_colors = [
        (0.00, (26, 11, 46)),    # Deep midnight violet
        (0.25, (56, 18, 86)),    # Purple dusk
        (0.50, (126, 34, 100)),  # Rich magenta
        (0.70, (217, 70, 38)),   # Fiery orange
        (0.85, (249, 115, 22)),  # Warm amber
        (1.00, (254, 215, 120)), # Soft peach gold horizon
    ]

    for y in range(H):
        ratio = y / H
        # Find segment
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

    # Glowing low sunset sun
    sun_x, sun_y = int(W * 0.65), int(H * 0.62)
    for rad in range(120, 0, -2):
        alpha = int(120 * (1 - rad / 120))
        draw_bg.ellipse([sun_x - rad, sun_y - rad, sun_x + rad, sun_y + rad], fill=(255, 230, 180, alpha))
    draw_bg.ellipse([sun_x - 35, sun_y - 35, sun_x + 35, sun_y + 35], fill=(255, 250, 220, 240))

    # Pixel-art stylized clouds
    cloud_colors = [(180, 70, 110, 110), (140, 50, 95, 90), (220, 120, 100, 130)]
    for _ in range(14):
        cx = random.randint(-100, W + 100)
        cy = random.randint(int(H * 0.2), int(H * 0.65))
        c_w = random.randint(180, 500)
        c_h = random.randint(16, 40)
        c_col = random.choice(cloud_colors)
        # Draw chunky pill shaped cloud
        draw_bg.rounded_rectangle([cx, cy, cx + c_w, cy + c_h], radius=c_h // 2, fill=c_col)
        # Inner fluff
        draw_bg.rounded_rectangle([cx + 30, cy + 4, cx + c_w - 40, cy + c_h - 4], radius=(c_h - 8) // 2, fill=(c_col[0] + 20, c_col[1] + 20, c_col[2] + 20, c_col[3]))

    img_bg.save(os.path.join(folder, "bg.webp"), "WEBP", quality=90)
    print("Twilight bg.webp created")

    # 2. Distant & Mid Mountains (mountains.webp)
    img_mountains = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw_m = ImageDraw.Draw(img_mountains)

    # Layer 1: Distant mountain peaks (lighter purple-mauve)
    m1_points = [(0, H)]
    x = 0
    y = int(H * 0.58)
    while x <= W + 50:
        step = random.randint(40, 90)
        dy = random.randint(-45, 45)
        y = max(int(H * 0.45), min(int(H * 0.65), y + dy))
        m1_points.append((x, y))
        x += step
    m1_points.append((W, H))
    draw_m.polygon(m1_points, fill=(65, 28, 85, 210))

    # Layer 2: Midground sharp peaks (deep indigo purple)
    m2_points = [(0, H)]
    x = 0
    y = int(H * 0.68)
    while x <= W + 50:
        step = random.randint(50, 120)
        peak_height = random.randint(100, 220)
        peak_x = x + step // 2
        m2_points.append((x, y))
        m2_points.append((peak_x, y - peak_height))
        x += step
        y = int(H * 0.68) + random.randint(-20, 20)
    m2_points.append((W, H))
    draw_m.polygon(m2_points, fill=(38, 16, 58, 240))

    # Highlight slopes on peaks
    for i in range(1, len(m2_points) - 2, 2):
        px, py = m2_points[i + 1]
        lx, ly = m2_points[i]
        draw_m.line([(lx, ly), (px, py)], fill=(120, 60, 140, 120), width=3)

    img_mountains.save(os.path.join(folder, "mountains.webp"), "WEBP", quality=90)
    print("Twilight mountains.webp created")

    # 3. Foreground Pine Forest (forest.webp)
    img_forest = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw_f = ImageDraw.Draw(img_forest)

    # Mist layer above trees
    mist_y = int(H * 0.72)
    for y in range(mist_y, int(H * 0.82)):
        alpha = int(45 * (1 - abs(y - (mist_y + 40)) / 50))
        draw_f.line([(0, y), (W, y)], fill=(180, 130, 200, max(0, alpha)))

    # Pine trees in layers
    # Back tree line
    tree_x = -20
    while tree_x < W + 40:
        th = random.randint(90, 160)
        tw = random.randint(28, 48)
        base_y = int(H * 0.88)
        top_y = base_y - th
        draw_f.polygon([
            (tree_x, base_y),
            (tree_x + tw // 2, top_y),
            (tree_x + tw, base_y)
        ], fill=(22, 10, 36, 255))
        tree_x += random.randint(14, 28)

    # Front tree line (darker silhouette)
    tree_x = -15
    while tree_x < W + 40:
        th = random.randint(130, 220)
        tw = random.randint(38, 65)
        base_y = H
        top_y = base_y - th
        draw_f.polygon([
            (tree_x, base_y),
            (tree_x + tw // 2, top_y),
            (tree_x + tw, base_y)
        ], fill=(12, 5, 22, 255))
        tree_x += random.randint(20, 42)

    # Ground base
    draw_f.rectangle([(0, int(H * 0.94)), (W, H)], fill=(10, 4, 18, 255))

    img_forest.save(os.path.join(folder, "forest.webp"), "WEBP", quality=90)
    print("Twilight forest.webp created")

def create_neon_layers():
    folder = os.path.join(BASE_DIR, "neon")
    os.makedirs(folder, exist_ok=True)

    # 1. Sky & Distant Skyline (skyline-back.webp)
    img_bg = Image.new("RGBA", (W, H))
    draw_bg = ImageDraw.Draw(img_bg)

    # Cyberpunk gradient
    sky_colors = [
        (0.00, (8, 10, 24)),
        (0.40, (15, 14, 38)),
        (0.70, (28, 16, 52)),
        (1.00, (40, 18, 60)),
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

    # Distant building blocks
    x = 0
    while x < W:
        bw = random.randint(50, 110)
        bh = random.randint(250, 500)
        top_y = H - bh
        draw_bg.rectangle([(x, top_y), (x + bw, H)], fill=(18, 16, 40, 255))
        # Faint windows
        for wy in range(top_y + 15, H - 50, 18):
            for wx in range(x + 8, x + bw - 8, 12):
                if random.random() > 0.4:
                    draw_bg.rectangle([(wx, wy), (wx + 6, wy + 8)], fill=(60, 80, 120, 80))
        x += bw + random.randint(4, 15)

    img_bg.save(os.path.join(folder, "skyline-back.webp"), "WEBP", quality=90)
    print("Neon skyline-back.webp created")

    # 2. Midground Towers & Neon Billboards (skyline-mid.webp)
    img_mid = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw_mid = ImageDraw.Draw(img_mid)

    x = 20
    b_idx = 0
    while x < W:
        bw = random.randint(90, 180)
        bh = random.randint(350, 680)
        top_y = H - bh
        # Building body
        draw_mid.rectangle([(x, top_y), (x + bw, H)], fill=(12, 10, 28, 255))
        draw_mid.line([(x, top_y), (x + bw, top_y)], fill=(34, 211, 238, 120), width=2)
        draw_mid.line([(x, top_y), (x, H)], fill=(236, 72, 153, 100), width=1)

        # Lit windows (cyan & warm amber)
        for wy in range(top_y + 25, H - 80, 22):
            for wx in range(x + 12, x + bw - 12, 16):
                prob = random.random()
                if prob > 0.65:
                    col = (34, 211, 238, 190) if prob > 0.85 else (251, 191, 36, 170)
                    draw_mid.rectangle([(wx, wy), (wx + 8, wy + 12)], fill=col)

        # Neon Signs & Billboards
        if b_idx % 2 == 0 and bh > 420:
            sign_y = top_y + 40
            sign_w = bw - 30
            # Pink neon sign box
            draw_mid.rectangle([(x + 15, sign_y), (x + 15 + sign_w, sign_y + 35)], outline=(244, 114, 182, 230), width=2, fill=(20, 8, 30, 220))
            # Text simulation bars
            neon_label = "CURIO" if b_idx % 4 == 0 else "NEON"
            draw_mid.rectangle([(x + 25, sign_y + 10), (x + 15 + sign_w - 10, sign_y + 25)], fill=(236, 72, 153, 200))
        elif b_idx % 3 == 0 and bh > 500:
            # Vertical Japanese/cyber neon bar
            sign_x = x + bw - 22
            sign_y = top_y + 30
            for sy in range(sign_y, sign_y + 110, 18):
                draw_mid.rounded_rectangle([(sign_x, sy), (sign_x + 12, sy + 12)], radius=3, fill=(34, 211, 238, 220))

        x += bw + random.randint(15, 45)
        b_idx += 1

    img_mid.save(os.path.join(folder, "skyline-mid.webp"), "WEBP", quality=90)
    print("Neon skyline-mid.webp created")

    # 3. Foreground Rooftops & Structures (foreground.webp)
    img_fg = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw_fg = ImageDraw.Draw(img_fg)

    # Near rooftops, water towers, antennas
    x = -20
    while x < W + 50:
        rw = random.randint(140, 280)
        rh = random.randint(140, 280)
        top_y = H - rh
        draw_fg.rectangle([(x, top_y), (x + rw, H)], fill=(6, 5, 14, 255))
        draw_fg.line([(x, top_y), (x + rw, top_y)], fill=(30, 25, 55, 255), width=2)

        # Antenna spire
        if random.random() > 0.4:
            ax = x + rw // 2
            draw_fg.line([(ax, top_y), (ax, top_y - 65)], fill=(20, 18, 35, 255), width=2)
            # Red warning beacon
            draw_fg.ellipse([ax - 3, top_y - 68, ax + 3, top_y - 62], fill=(239, 68, 68, 240))

        # Water tank / AC unit
        if random.random() > 0.5:
            tx = x + random.randint(20, max(21, rw - 60))
            draw_fg.rounded_rectangle([(tx, top_y - 30), (tx + 40, top_y)], radius=4, fill=(10, 8, 20, 255))

        x += rw - random.randint(10, 30)

    # Cables stretching across
    draw_fg.line([(0, H - 240), (W * 0.4, H - 180)], fill=(12, 10, 22, 180), width=1)
    draw_fg.line([(W * 0.35, H - 180), (W, H - 260)], fill=(12, 10, 22, 180), width=1)

    img_fg.save(os.path.join(folder, "foreground.webp"), "WEBP", quality=90)
    print("Neon foreground.webp created")

def create_void_layers():
    folder = os.path.join(BASE_DIR, "void")
    os.makedirs(folder, exist_ok=True)

    # 1. Deep Cosmic Nebula (nebula-deep.webp)
    img_bg = Image.new("RGBA", (W, H))
    draw_bg = ImageDraw.Draw(img_bg)

    # Dark interstellar base
    sky_colors = [
        (0.00, (4, 3, 10)),
        (0.35, (12, 6, 26)),
        (0.70, (8, 4, 18)),
        (1.00, (2, 2, 6)),
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

    # Glowing nebula gas clouds (violet, magenta, indigo blobs)
    nebula_blobs = [
        (W * 0.35, H * 0.40, 480, (99, 102, 241)),  # Indigo
        (W * 0.65, H * 0.45, 520, (192, 132, 252)), # Lavender
        (W * 0.45, H * 0.65, 420, (236, 72, 153)),  # Magenta
        (W * 0.80, H * 0.25, 360, (79, 70, 229)),   # Deep purple
    ]
    for cx, cy, radius, col in nebula_blobs:
        for r in range(int(radius), 0, -12):
            alpha = int(45 * (1 - r / radius) ** 1.8)
            draw_bg.ellipse([cx - r, cy - r * 0.7, cx + r, cy + r * 0.7], fill=(col[0], col[1], col[2], alpha))

    # Dense background star dust (tiny static pinpricks)
    for _ in range(350):
        sx = random.randint(0, W)
        sy = random.randint(0, H)
        sa = random.randint(80, 210)
        draw_bg.point((sx, sy), fill=(230, 230, 255, sa))

    img_bg.save(os.path.join(folder, "nebula-deep.webp"), "WEBP", quality=90)
    print("Void nebula-deep.webp created")

    # 2. Nebula Gas Filaments & Stardust (nebula-dust.webp)
    img_dust = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw_dust = ImageDraw.Draw(img_dust)

    # Whispering cosmic dust trails
    trail_centers = [
        (W * 0.25, H * 0.35, 300, (147, 51, 234)),
        (W * 0.55, H * 0.50, 360, (244, 114, 182)),
        (W * 0.75, H * 0.60, 280, (129, 140, 248)),
    ]
    for cx, cy, rad, col in trail_centers:
        for r in range(int(rad), 0, -15):
            alpha = int(30 * (1 - r / rad) ** 2)
            draw_dust.ellipse([cx - r, cy - r * 0.5, cx + r, cy + r * 0.5], fill=(col[0], col[1], col[2], alpha))

    # Medium stars with soft 4-point flares
    for _ in range(25):
        sx = random.randint(50, W - 50)
        sy = random.randint(50, H - 50)
        s_sz = random.randint(2, 4)
        draw_dust.ellipse([sx - s_sz, sy - s_sz, sx + s_sz, sy + s_sz], fill=(255, 255, 255, 220))
        # Cross flare
        flare_len = s_sz * 4
        draw_dust.line([(sx - flare_len, sy), (sx + flare_len, sy)], fill=(200, 220, 255, 120), width=1)
        draw_dust.line([(sx, sy - flare_len), (sx, sy + flare_len)], fill=(200, 220, 255, 120), width=1)

    img_dust.save(os.path.join(folder, "nebula-dust.webp"), "WEBP", quality=90)
    print("Void nebula-dust.webp created")

if __name__ == "__main__":
    create_twilight_layers()
    create_neon_layers()
    create_void_layers()
    print("All wallpaper layers generated successfully!")
