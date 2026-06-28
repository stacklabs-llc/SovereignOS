import os
import argparse
import math
from PIL import Image, ImageDraw, ImageFont

# Color Palette
BG_COLOR = (10, 15, 20, 255)
GRID_COLOR = (15, 30, 25, 255)
NEON_GREEN = (0, 255, 128, 255)
NEON_BLUE = (0, 192, 255, 255)
TEXT_COLOR = (240, 248, 255, 255)
TEXT_MUTED = (120, 140, 150, 255)
BORDER_COLOR = (0, 128, 64, 255)

FONT_SANS = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"

def draw_arrow(draw, start, end, color, width=3, arrowhead_length=15):
    # Draw main line
    draw.line([start, end], fill=color, width=width)
    
    # Calculate angle of line
    dx = end[0] - start[0]
    dy = end[1] - start[1]
    angle = math.atan2(dy, dx)
    
    # Arrow head points
    p1 = (end[0] - arrowhead_length * math.cos(angle - math.pi/6),
          end[1] - arrowhead_length * math.sin(angle - math.pi/6))
    p2 = (end[0] - arrowhead_length * math.cos(angle + math.pi/6),
          end[1] - arrowhead_length * math.sin(angle + math.pi/6))
    
    draw.polygon([end, p1, p2], fill=color)

def generate_whiff_graphic(args):
    # Create image
    img = Image.new("RGBA", (800, 800), BG_COLOR)
    draw = ImageDraw.Draw(img)
    
    # Load fonts
    try:
        font_large = ImageFont.truetype(FONT_BOLD, 28)
        font_med = ImageFont.truetype(FONT_BOLD, 18)
        font_small = ImageFont.truetype(FONT_SANS, 14)
        font_header = ImageFont.truetype(FONT_BOLD, 14)
    except IOError:
        font_large = font_med = font_small = font_header = ImageFont.load_default()

    # Draw grid lines
    grid_spacing = 40
    for x in range(0, 800, grid_spacing):
        draw.line([(x, 0), (x, 800)], fill=GRID_COLOR, width=1)
    for y in range(0, 800, grid_spacing):
        draw.line([(0, y), (800, y)], fill=GRID_COLOR, width=1)
        
    # Draw outer frame border
    draw.rectangle([(10, 10), (790, 790)], outline=BORDER_COLOR, width=2)
    # Corner brackets
    bracket_len = 30
    # Top Left
    draw.line([(10, 10), (10 + bracket_len, 10)], fill=NEON_GREEN, width=4)
    draw.line([(10, 10), (10, 10 + bracket_len)], fill=NEON_GREEN, width=4)
    # Top Right
    draw.line([(790, 10), (790 - bracket_len, 10)], fill=NEON_GREEN, width=4)
    draw.line([(790, 10), (790, 10 + bracket_len)], fill=NEON_GREEN, width=4)
    # Bottom Left
    draw.line([(10, 790), (10 + bracket_len, 790)], fill=NEON_GREEN, width=4)
    draw.line([(10, 790), (10, 790 - bracket_len)], fill=NEON_GREEN, width=4)
    # Bottom Right
    draw.line([(790, 790), (790 - bracket_len, 790)], fill=NEON_GREEN, width=4)
    draw.line([(790, 790), (790, 790 - bracket_len)], fill=NEON_GREEN, width=4)

    # Header Bar
    draw.rectangle([(10, 10), (790, 50)], fill=(20, 30, 40, 200), outline=BORDER_COLOR, width=1)
    draw.text((25, 22), "STATUS: SWING ANALYSIS", fill=NEON_GREEN, font=font_header)
    draw.text((280, 22), f"PLAYER: {args.batter.upper()}", fill=TEXT_COLOR, font=font_header)
    draw.text((560, 22), f"PITCHER: {args.pitcher.upper()}", fill=TEXT_COLOR, font=font_header)
    
    # Draw home plate outline in perspective (centered bottom)
    plate_points = [
        (400, 700),  # Front tip
        (460, 640),  # Right corner
        (460, 580),  # Right back
        (340, 580),  # Left back
        (340, 640),  # Left corner
    ]
    draw.polygon(plate_points, outline=(0, 128, 96, 255), width=2)
    
    # Draw baseball (Target)
    ball_center = (400, 450)
    ball_radius = 28
    draw.ellipse([
        (ball_center[0] - ball_radius, ball_center[1] - ball_radius),
        (ball_center[0] + ball_radius, ball_center[1] + ball_radius)
    ], fill=(20, 60, 40, 255), outline=NEON_GREEN, width=3)
    # Stitches
    draw.arc([
        (ball_center[0] - ball_radius - 5, ball_center[1] - ball_radius),
        (ball_center[0] + 5, ball_center[1] + ball_radius)
    ], 310, 50, fill=(255, 64, 64, 255), width=2)
    draw.arc([
        (ball_center[0] - 5, ball_center[1] - ball_radius),
        (ball_center[0] + ball_radius + 5, ball_center[1] + ball_radius)
    ], 130, 230, fill=(255, 64, 64, 255), width=2)
    draw.text((ball_center[0] - 50, ball_center[1] + 35), "TARGET: BASEBALL", fill=TEXT_MUTED, font=font_small)

    # Draw swing path dotted line
    path_points = []
    for t in range(0, 50, 5):
        # Parametric curve representing swing arc passing over the plate
        # Bat comes from right/top down, sweeps through, exit left/up
        x = 650 - (t * 8)
        y = 250 + (t * 4) + (0.15 * (t - 25)**2)
        path_points.append((x, y))
        draw.ellipse([(x-3, y-3), (x+3, y+3)], fill=NEON_BLUE)
        
    # Draw bat cylinder wireframe (sweeping through)
    bat_x = 400
    bat_y = 270 # Over the top of the ball
    
    # Draw bat barrel cylindrical lines
    draw.ellipse([(bat_x - 120, bat_y - 20), (bat_x + 120, bat_y + 20)], outline=NEON_BLUE, width=1)
    
    # Draw bat cylinder
    bat_start = (180, 450) # handle
    bat_end = (600, 200) # barrel end
    draw.line([bat_start, bat_end], fill=(0, 96, 192, 100), width=35)
    
    # Draw bat wireframe rings
    steps = 15
    for s in range(steps):
        ratio = s / (steps - 1)
        px = bat_start[0] + ratio * (bat_end[0] - bat_start[0])
        py = bat_start[1] + ratio * (bat_end[1] - bat_start[1])
        thickness = 8 + int(ratio * 20)
        draw.ellipse([(px - thickness, py - thickness/2), (px + thickness, py + thickness/2)], outline=NEON_BLUE, width=1)
        
    draw.text((540, 240), "SWING PATH", fill=TEXT_MUTED, font=font_small)

    # Miss Distance Spatial Gap line
    # Sweet spot is around 400, 310 (bat is above ball)
    sweet_spot = (400, 310)
    gap_start = sweet_spot
    gap_end = (400, ball_center[1] - ball_radius)
    
    # Draw vertical double headed arrow showing miss gap
    draw_arrow(draw, (400, gap_start[1] + 10), gap_end, NEON_GREEN, width=3)
    draw_arrow(draw, (400, gap_end[1] - 10), gap_start, NEON_GREEN, width=3)
    
    # Miss Distance Value Label
    miss_text = f"MISS DISTANCE: {args.miss_distance} INCHES"
    draw.text((420, 370), miss_text, fill=NEON_GREEN, font=font_large)

    # Telemetry data card (bottom right)
    card_x = 440
    card_y = 560
    draw.rectangle([(card_x, card_y), (770, 770)], fill=(15, 25, 35, 220), outline=NEON_BLUE, width=1)
    
    # Card Header
    draw.text((card_x + 15, card_y + 15), "STATCAST TELEMETRY", fill=NEON_BLUE, font=font_med)
    draw.line([(card_x + 15, card_y + 42), (755, card_y + 42)], fill=GRID_COLOR, width=1)
    
    # Card Data Lines
    draw.text((card_x + 15, card_y + 55), "VERTICAL DELTA:", fill=TEXT_MUTED, font=font_small)
    draw.text((card_x + 180, card_y + 55), f"{args.vertical_delta} IN ({args.vertical_alignment})", fill=NEON_GREEN, font=font_small)
    
    draw.text((card_x + 15, card_y + 85), "HORIZONTAL DELTA:", fill=TEXT_MUTED, font=font_small)
    draw.text((card_x + 180, card_y + 85), f"{args.horizontal_delta} IN ({args.horizontal_alignment})", fill=NEON_GREEN, font=font_small)
    
    draw.text((card_x + 15, card_y + 115), "SWING SPEED:", fill=TEXT_MUTED, font=font_small)
    draw.text((card_x + 180, card_y + 115), f"{args.swing_speed} MPH", fill=NEON_GREEN, font=font_small)
    
    draw.text((card_x + 15, card_y + 145), "PITCH METRIC:", fill=TEXT_MUTED, font=font_small)
    draw.text((card_x + 180, card_y + 145), f"{args.pitch_name} @ {args.pitch_speed} MPH", fill=NEON_GREEN, font=font_small)

    # Save Image
    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    img.save(args.output, "PNG")
    print(f"Generated whiff graphic at {args.output}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--miss_distance", type=float, default=8.4)
    parser.add_argument("--vertical_alignment", type=str, default="OVER")
    parser.add_argument("--vertical_delta", type=float, default=-5.2)
    parser.add_argument("--horizontal_alignment", type=str, default="FLAILED")
    parser.add_argument("--horizontal_delta", type=float, default=6.6)
    parser.add_argument("--swing_speed", type=float, default=78.2)
    parser.add_argument("--pitch_speed", type=float, default=90.5)
    parser.add_argument("--pitch_name", type=str, default="Slider")
    parser.add_argument("--batter", type=str, default="Ronald Acuna Jr.")
    parser.add_argument("--pitcher", type=str, default="Edwin Diaz")
    parser.add_argument("--output", type=str, required=True)
    args = parser.parse_args()
    
    generate_whiff_graphic(args)
