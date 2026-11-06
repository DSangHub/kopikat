#!/usr/bin/env python3
"""Scale the existing KopyCat mark into Android launcher, splash, and Play listing files."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
RES = ROOT / "android" / "app" / "src" / "main" / "res"
ICON = ROOT / "native" / "brand" / "app-icons" / "icon-1024.png"
SPLASH = ROOT / "native" / "brand" / "splash" / "splash-2732x2732.png"
CREAM = (245, 240, 230)
INK = (21, 44, 42)


def save(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, "PNG")


def main() -> None:
    icon = Image.open(ICON).convert("RGBA")
    splash = Image.open(SPLASH).convert("RGB")
    launchers = {"mipmap-mdpi": 48, "mipmap-hdpi": 72, "mipmap-xhdpi": 96, "mipmap-xxhdpi": 144, "mipmap-xxxhdpi": 192}
    foregrounds = {"mipmap-mdpi": 108, "mipmap-hdpi": 162, "mipmap-xhdpi": 216, "mipmap-xxhdpi": 324, "mipmap-xxxhdpi": 432}
    for folder, size in launchers.items():
        frame = icon.resize((size, size), Image.Resampling.LANCZOS).convert("RGB")
        save(frame, RES / folder / "ic_launcher.png")
        save(frame, RES / folder / "ic_launcher_round.png")
    for folder, size in foregrounds.items():
        canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        inner = int(size * 0.72)
        mark = icon.resize((inner, inner), Image.Resampling.LANCZOS)
        canvas.paste(mark, ((size - inner) // 2, (size - inner) // 2), mark)
        save(canvas, RES / folder / "ic_launcher_foreground.png")

    splashes = {
        "drawable": (480, 480),
        "drawable-port-mdpi": (320, 480),
        "drawable-port-hdpi": (480, 800),
        "drawable-port-xhdpi": (720, 1280),
        "drawable-port-xxhdpi": (960, 1600),
        "drawable-port-xxxhdpi": (1280, 1920),
        "drawable-land-mdpi": (480, 320),
        "drawable-land-hdpi": (800, 480),
        "drawable-land-xhdpi": (1280, 720),
        "drawable-land-xxhdpi": (1600, 960),
        "drawable-land-xxxhdpi": (1920, 1280),
    }
    for folder, canvas_size in splashes.items():
        canvas = Image.new("RGB", canvas_size, CREAM)
        scale = min(canvas_size) * 0.72 / splash.width
        resized = splash.resize((max(1, int(splash.width * scale)), max(1, int(splash.height * scale))), Image.Resampling.LANCZOS)
        canvas.paste(resized, ((canvas_size[0] - resized.width) // 2, (canvas_size[1] - resized.height) // 2))
        save(canvas, RES / folder / "splash.png")

    play = ROOT / "native" / "brand" / "play"
    play.mkdir(parents=True, exist_ok=True)
    icon.resize((512, 512), Image.Resampling.LANCZOS).save(play / "icon-512.png", "PNG")
    feature = Image.new("RGB", (1024, 500), CREAM)
    mark = icon.resize((280, 280), Image.Resampling.LANCZOS).convert("RGB")
    feature.paste(mark, (70, 110))
    draw = ImageDraw.Draw(feature)
    word = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf", 72)
    tag = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf", 32)
    draw.text((390, 170), "KopyCat", font=word, fill=INK)
    draw.text((390, 270), "Tap it. Kopy it. Keep it.", font=tag, fill=INK)
    feature.save(play / "feature-graphic.png", "PNG")
    print(f"Wrote Android assets under {RES} and {play}")


if __name__ == "__main__":
    main()
