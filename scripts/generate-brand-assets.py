#!/usr/bin/env python3
"""Draw the KopyCat mark and write the iOS icon set, splash, and web icons."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
INK = (21, 44, 42, 255)
CORAL = (255, 110, 85, 255)
CREAM = (245, 240, 230, 255)
WHITE = (255, 255, 255, 255)

ICON_SIZES = {
    "icon-20.png": 20,
    "icon-20@2x.png": 40,
    "icon-20@3x.png": 60,
    "icon-29.png": 29,
    "icon-29@2x.png": 58,
    "icon-29@3x.png": 87,
    "icon-40.png": 40,
    "icon-40@2x.png": 80,
    "icon-40@3x.png": 120,
    "icon-60@2x.png": 120,
    "icon-60@3x.png": 180,
    "icon-76.png": 76,
    "icon-76@2x.png": 152,
    "icon-83.5@2x.png": 167,
    "icon-1024.png": 1024,
}


def font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def draw_mark(size: int, background: tuple[int, int, int, int] | None) -> Image.Image:
    image = Image.new("RGBA", (size, size), background or (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    margin = int(size * 0.16)
    box = [margin, margin, size - margin, size - margin]
    # The site mark is a circle with one tighter corner. At icon size a circle stays intact.
    draw.ellipse(box, fill=CORAL)
    glyph = font(int(size * 0.46), bold=True)
    text = "K"
    left, top, right, bottom = draw.textbbox((0, 0), text, font=glyph)
    x = (size - (right - left)) / 2 - left
    y = (size - (bottom - top)) / 2 - top - size * 0.02
    draw.text((x, y), text, font=glyph, fill=WHITE)
    return image


def flatten(image: Image.Image, background: tuple[int, int, int, int]) -> Image.Image:
    base = Image.new("RGBA", image.size, background)
    base.alpha_composite(image)
    return base.convert("RGB")


def main() -> None:
    master = draw_mark(1024, INK)
    icon_dir = ROOT / "native" / "brand" / "app-icons"
    icon_dir.mkdir(parents=True, exist_ok=True)
    for name, size in ICON_SIZES.items():
        master.resize((size, size), Image.Resampling.LANCZOS).convert("RGB").save(icon_dir / name, "PNG")

    web_icon = ROOT / "app" / "icon.png"
    apple_icon = ROOT / "app" / "apple-icon.png"
    master.resize((512, 512), Image.Resampling.LANCZOS).convert("RGB").save(web_icon, "PNG")
    master.resize((180, 180), Image.Resampling.LANCZOS).convert("RGB").save(apple_icon, "PNG")

    splash_dir = ROOT / "native" / "brand" / "splash"
    splash_dir.mkdir(parents=True, exist_ok=True)
    for name, size in (("splash-2732x2732.png", 2732), ("splash-2732x2732-1.png", 1366), ("splash-2732x2732-2.png", 912)):
        canvas = Image.new("RGB", (size, size), CREAM[:3])
        mark = draw_mark(int(size * 0.34), None)
        flat = flatten(mark, CREAM)
        x = (size - flat.width) // 2
        y = int(size * 0.30)
        canvas.paste(flat, (x, y))
        draw = ImageDraw.Draw(canvas)
        word = font(int(size * 0.07), bold=True)
        label = "KopyCat"
        left, top, right, bottom = draw.textbbox((0, 0), label, font=word)
        draw.text(((size - (right - left)) / 2, y + flat.height + size * 0.04), label, font=word, fill=INK[:3])
        tag = font(int(size * 0.028))
        line = "Tap it. Kopy it. Keep it."
        left, top, right, bottom = draw.textbbox((0, 0), line, font=tag)
        draw.text(((size - (right - left)) / 2, y + flat.height + size * 0.13), line, font=tag, fill=INK[:3])
        canvas.save(splash_dir / name, "PNG")
    print(f"Wrote icons to {icon_dir} and splash to {splash_dir}")


if __name__ == "__main__":
    main()
