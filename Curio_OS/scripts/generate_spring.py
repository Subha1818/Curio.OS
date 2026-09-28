import os
import math
import random
from PIL import Image, ImageDraw

random.seed(42)

BASE_DIR = r"c:\Users\subha\OneDrive\Desktop\My OS\Curio_OS\public\assets\wallpapers"
W, H = 1920, 1080

def create_spring_layers():
    folder = os.path.join(BASE_DIR, "spring")
    os.makedirs(folder, exist_ok=True)

    # ─────────────────────────────────────────────────────────────
    # 1. Clean, Dreamy Pastel Spring Sky (bg.webp) - NO CLUNKY CLOUD BARS
    # ─────────────────────────────────────────────────────────────
    # Use full RGB mode to avoid any transparency/dark hole bugs!
    img_bg = Image.new("RGB", (W, H))
    draw_bg = ImageDraw.Draw(img_bg)

    sky_colors = [
        (0.00, (48, 14, 60)),     # Deep twilight amethyst
        (0.20, (96, 24, 88)),     # Rich magenta dusk
        (0.42, (180, 52, 120)),   # Sakura bloom rose
        (0.62, (236, 108, 168)),  # Vibrant pastel pink
        (0.78, (249, 168, 204)),  # Soft blossom blush
        (0.92, (253, 218, 228)),  # Warm morning rose
        (1.00, (254, 242, 246)),  # Golden peach dawn horizon
    ]

    # Pre-render vertical smooth gradient
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
                draw_bg.line([(0, y), (W, y)], fill=(r, g, b))
                break

    # Additive radial soft morning sun glow directly on RGB pixels (pure warmth, no dark circles!)
    sun_x, sun_y = int(W * 0.40), int(H * 0.54)
    sun_rad = 220
    pixels = img_bg.load()
    
    # Apply warm diffused radial glow
    for dy in range(-sun_rad, sun_rad + 1):
        py = sun_y + dy
        if py < 0 or py >= H:
            continue
        for dx in range(-sun_rad, sun_rad + 1):
            px = sun_x + dx
            if px < 0 or px >= W:
                continue
            dist = math.sqrt(dx * dx + dy * dy)
            if dist < sun_rad:
                factor = (1.0 - (dist / sun_rad)) ** 1.8
                cr, cg, cb = pixels[px, py]
                glow_r = int(55 * factor)
                glow_g = int(45 * factor)
                glow_b = int(25 * factor)
                pixels[px, py] = (
                    min(255, cr + glow_r),
                    min(255, cg + glow_g),
                    min(255, cb + glow_b)
                )

    # Clean sun disc (warm radiant ivory-peach)
    inner_rad = 32
    for dy in range(-inner_rad, inner_rad + 1):
        py = sun_y + dy
        if py < 0 or py >= H:
            continue
        for dx in range(-inner_rad, inner_rad + 1):
            px = sun_x + dx
            if px < 0 or px >= W:
                continue
            dist = math.sqrt(dx * dx + dy * dy)
            if dist <= inner_rad:
                t = 1.0 - (dist / inner_rad)
                cr, cg, cb = pixels[px, py]
                nr = int(cr * (1 - t) + 255 * t)
                ng = int(cg * (1 - t) + 248 * t)
                nb = int(cb * (1 - t) + 242 * t)
                pixels[px, py] = (nr, ng, nb)

    img_bg.save(os.path.join(folder, "bg.webp"), "WEBP", quality=92)
    print("Spring bg.webp created (clean gradient, no skies/cloud bars)")

    # ─────────────────────────────────────────────────────────────
    # 2. Rolling Spring Hills & Painterly Sakura Groves (hills.webp)
    # ─────────────────────────────────────────────────────────────
    img_hills = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw_h = ImageDraw.Draw(img_hills)

    # Layer A: Distant misty lilac mountains
    m_pts = [(0, H)]
    for x in range(0, W + 60, 40):
        # Organic mountain peaks
        my = int(H * 0.58 + math.sin(x * 0.002) * 55 + math.cos(x * 0.005) * 35)
        m_pts.append((x, my))
    m_pts.append((W, H))
    draw_h.polygon(m_pts, fill=(110, 40, 95, 210))

    # Layer B: Midground rolling green ridge
    h1_pts = [(0, H)]
    for x in range(0, W + 40, 20):
        hy = int(H * 0.69 + math.sin(x * 0.0028) * 45 + math.cos(x * 0.007) * 20)
        h1_pts.append((x, hy))
    h1_pts.append((W, H))
    draw_h.polygon(h1_pts, fill=(18, 52, 42, 240))

    # Clustered painterly Sakura trees on midground hill (clusters with stems, no bead rows!)
    tree_spots = [
        (140, 0.70), (280, 0.68), (420, 0.72), (640, 0.71),
        (820, 0.69), (1050, 0.71), (1280, 0.68), (1480, 0.72),
        (1700, 0.69), (1850, 0.70)
    ]
    for tx, y_ratio in tree_spots:
        ty = int(H * y_ratio + math.sin(tx * 0.0028) * 45)
        # Tree trunk
        draw_h.line([(tx, ty), (tx, ty - 22)], fill=(45, 25, 20, 250), width=3)
        # Organic leafy/blossom clusters
        for offset_x, offset_y, r, col in [
            (-12, -26, 18, (236, 72, 153, 235)),
            (12, -28, 16, (244, 114, 182, 235)),
            (0, -36, 20, (251, 182, 206, 245)),
            (-6, -42, 14, (254, 215, 226, 245)),
            (6, -40, 15, (249, 168, 204, 245)),
        ]:
            draw_h.ellipse(
                [tx + offset_x - r, ty + offset_y - r, tx + offset_x + r, ty + offset_y + r],
                fill=col
            )

    # Layer C: Foreground lush dark emerald meadow
    h2_pts = [(0, H)]
    for x in range(0, W + 30, 15):
        hy = int(H * 0.83 + math.sin(x * 0.0035 + 0.8) * 38)
        h2_pts.append((x, hy))
    h2_pts.append((W, H))
    draw_h.polygon(h2_pts, fill=(12, 38, 28, 255))

    # Gentle scattered petal fallen sparkles on foreground grass
    for fx in range(40, W - 40, 32):
        fy = int(H * 0.83 + math.sin(fx * 0.0035 + 0.8) * 38) + random.randint(18, 110)
        if fy < H - 15 and random.random() > 0.45:
            # delicate soft flower fleck
            draw_h.ellipse([fx - 2, fy - 2, fx + 2, fy + 2], fill=(244, 114, 182, 200))
            draw_h.ellipse([fx - 1, fy - 1, fx + 1, fy + 1], fill=(255, 255, 255, 220))

    img_hills.save(os.path.join(folder, "hills.webp"), "WEBP", quality=92)
    print("Spring hills.webp created (natural trees & hills)")

    # ─────────────────────────────────────────────────────────────
    # 3. Framing Sakura Blossom Branches (blossoms.webp)
    # ─────────────────────────────────────────────────────────────
    img_blossoms = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw_b = ImageDraw.Draw(img_blossoms)

    def draw_sakura_flower(bx, by, size=16):
        # 5 petals in radial star formation
        for angle in range(0, 360, 72):
            rad = math.radians(angle)
            px = bx + math.cos(rad) * (size * 0.75)
            py = by + math.sin(rad) * (size * 0.75)
            draw_b.ellipse(
                [px - size * 0.55, py - size * 0.55, px + size * 0.55, py + size * 0.55],
                fill=(244, 114, 182, 235)
            )
            draw_b.ellipse(
                [px - size * 0.35, py - size * 0.35, px + size * 0.35, py + size * 0.35],
                fill=(253, 218, 228, 245)
            )
        # Soft golden blossom core
        draw_b.ellipse(
            [bx - size * 0.22, by - size * 0.22, bx + size * 0.22, by + size * 0.22],
            fill=(253, 224, 71, 255)
        )

    # Top-Right Branch sweeping into frame
    branch1_points = [
        (W + 20, -10),
        (W - 130, 50),
        (W - 290, 95),
        (W - 470, 115),
        (W - 630, 175),
        (W - 750, 225),
    ]
    for i in range(len(branch1_points) - 1):
        draw_b.line([branch1_points[i], branch1_points[i + 1]], fill=(40, 22, 18, 255), width=13 - i * 2)

    sub_branches = [
        ((W - 290, 95), (W - 360, 180)),
        ((W - 470, 115), (W - 530, 215)),
        ((W - 630, 175), (W - 690, 275)),
        ((W - 390, 105), (W - 430, 35)),
    ]
    for start, end in sub_branches:
        draw_b.line([start, end], fill=(40, 22, 18, 255), width=5)

    flower_coords_1 = [
        (W - 110, 45), (W - 170, 75), (W - 230, 85), (W - 290, 105),
        (W - 350, 125), (W - 410, 115), (W - 470, 135), (W - 520, 165),
        (W - 590, 175), (W - 650, 205), (W - 710, 225), (W - 760, 245),
        (W - 350, 175), (W - 380, 195), (W - 510, 205), (W - 540, 225),
        (W - 670, 265), (W - 700, 295), (W - 420, 45), (W - 450, 25),
        (W - 190, 35), (W - 250, 125), (W - 320, 75), (W - 490, 95),
        (W - 600, 145), (W - 640, 235), (W - 730, 195), (W - 790, 265),
    ]
    for fx, fy in flower_coords_1:
        draw_sakura_flower(fx, fy, random.randint(14, 21))

    # Top-Left Branch sweeping in
    branch2_points = [
        (-20, -10),
        (90, 45),
        (210, 85),
        (330, 140),
        (430, 210),
    ]
    for i in range(len(branch2_points) - 1):
        draw_b.line([branch2_points[i], branch2_points[i + 1]], fill=(40, 22, 18, 255), width=11 - i * 2)

    flower_coords_2 = [
        (60, 35), (110, 55), (170, 75), (230, 95), (290, 120),
        (350, 150), (400, 180), (440, 220), (140, 115), (210, 145),
        (280, 180), (370, 115), (410, 250), (70, 85),
    ]
    for fx, fy in flower_coords_2:
        draw_sakura_flower(fx, fy, random.randint(13, 19))

    img_blossoms.save(os.path.join(folder, "blossoms.webp"), "WEBP", quality=92)
    print("Spring blossoms.webp created")

if __name__ == "__main__":
    create_spring_layers()
