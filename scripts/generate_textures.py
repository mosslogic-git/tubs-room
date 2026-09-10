"""Generate seamless PBR texture maps for Club Room floor and walls using Blender.

Outputs:
- dist/assets/floor-diffuse.png : Polished industrial concrete base color
- dist/assets/floor-normal.png  : Surface micro-relief and aggregate bump
- dist/assets/floor-roughness.png: Troweled concrete sheen variations
- dist/assets/wall-normal.png   : Acoustic felt / stippled plaster relief
- dist/assets/wall-roughness.png: Matte acoustic diffusion map
"""
import bpy
import numpy as np
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'dist' / 'assets'
ASSETS.mkdir(parents=True, exist_ok=True)

def save_image_from_numpy(arr_rgba, path):
    """Save RGBA float array [0, 1] as PNG using Blender."""
    h, w, c = arr_rgba.shape
    name = path.stem
    if name in bpy.data.images:
        bpy.data.images.remove(bpy.data.images[name])
    img = bpy.data.images.new(name, width=w, height=h, alpha=True)
    img.pixels.foreach_set(arr_rgba.astype(np.float32).flatten())
    img.filepath_raw = str(path.resolve())
    img.file_format = 'PNG'
    img.save()

def generate_fourier_noise(size=512, octaves=6, seed=42, decay=0.9):
    rng = np.random.default_rng(seed)
    field = np.zeros((size, size), dtype=np.float32)
    x = np.linspace(0, 2 * np.pi, size, endpoint=False)
    y = np.linspace(0, 2 * np.pi, size, endpoint=False)
    X, Y = np.meshgrid(x, y)
    
    for oct in range(1, octaves + 1):
        freq = 2 ** (oct - 1)
        amp = 1.0 / (freq ** decay)
        num_modes = min(freq * 4, 32)
        for _ in range(num_modes):
            kx = int(rng.integers(-freq * 2, freq * 2 + 1))
            ky = int(rng.integers(-freq * 2, freq * 2 + 1))
            if kx == 0 and ky == 0:
                continue
            phase = float(rng.uniform(0, 2 * np.pi))
            field += amp * np.cos(kx * X + ky * Y + phase)
            
    field = (field - field.min()) / (field.max() - field.min() + 1e-8)
    return field

def height_to_normal_map(height, strength=2.2):
    gx = (np.roll(height, -1, axis=1) - np.roll(height, 1, axis=1)) * 0.5
    gy = (np.roll(height, -1, axis=0) - np.roll(height, 1, axis=0)) * 0.5
    
    nx = -gx * strength
    ny = -gy * strength
    nz = np.ones_like(nx)
    
    length = np.sqrt(nx**2 + ny**2 + nz**2)
    nx /= length
    ny /= length
    nz /= length
    
    r = (nx + 1.0) * 0.5
    g = (ny + 1.0) * 0.5
    b = nz
    a = np.ones_like(r)
    
    return np.stack([r, g, b, a], axis=-1)

def build_floor_textures(size=512):
    print("Generating floor textures in Blender...")
    macro = generate_fourier_noise(size, octaves=4, seed=101, decay=1.2)
    med = generate_fourier_noise(size, octaves=6, seed=202, decay=0.85)
    micro = generate_fourier_noise(size, octaves=7, seed=303, decay=0.6)
    
    floor_height = macro * 0.45 + med * 0.35 + micro * 0.20
    
    # 1. Diffuse (Sage concrete base #535747 = linear 0.086, 0.095, 0.063)
    base_r, base_g, base_b = 83 / 255.0, 87 / 255.0, 71 / 255.0
    tone = (floor_height - 0.5) * 0.24 + 1.0
    
    specks = (generate_fourier_noise(size, octaves=8, seed=404, decay=0.3) > 0.88).astype(np.float32)
    specks_dark = (generate_fourier_noise(size, octaves=8, seed=505, decay=0.3) > 0.88).astype(np.float32)
    
    r = np.clip(base_r * tone + specks * (22/255.0) - specks_dark * (18/255.0), 0.0, 1.0)
    g = np.clip(base_g * tone + specks * (20/255.0) - specks_dark * (18/255.0), 0.0, 1.0)
    b = np.clip(base_b * tone + specks * (16/255.0) - specks_dark * (16/255.0), 0.0, 1.0)
    a = np.ones_like(r)
    
    diffuse = np.stack([r, g, b, a], axis=-1)
    save_image_from_numpy(diffuse, ASSETS / 'floor-diffuse.png')
    
    # 2. Normal Map
    normal = height_to_normal_map(floor_height, strength=2.2)
    save_image_from_numpy(normal, ASSETS / 'floor-normal.png')
    
    # 3. Roughness Map
    rough = (0.70 + (1.0 - macro) * 0.15 + micro * 0.08).clip(0.0, 1.0)
    rough_rgba = np.stack([rough, rough, rough, np.ones_like(rough)], axis=-1)
    save_image_from_numpy(rough_rgba, ASSETS / 'floor-roughness.png')
    print("Saved floor textures.")

def build_wall_textures(size=512):
    print("Generating wall textures in Blender...")
    stipple = generate_fourier_noise(size, octaves=7, seed=606, decay=0.55)
    y = np.linspace(0, 2 * np.pi, size, endpoint=False)
    x = np.linspace(0, 2 * np.pi, size, endpoint=False)
    X, _ = np.meshgrid(x, y)
    vertical_ribs = (np.sin(X * 32) * 0.5 + 0.5).astype(np.float32)
    
    wall_height = stipple * 0.70 + vertical_ribs * 0.30
    
    # 1. Normal Map
    wall_normal = height_to_normal_map(wall_height, strength=1.6)
    save_image_from_numpy(wall_normal, ASSETS / 'wall-normal.png')
    
    # 2. Roughness Map
    rough = (0.85 + stipple * 0.10).clip(0.0, 1.0)
    rough_rgba = np.stack([rough, rough, rough, np.ones_like(rough)], axis=-1)
    save_image_from_numpy(rough_rgba, ASSETS / 'wall-roughness.png')
    print("Saved wall textures.")

def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build_floor_textures()
    build_wall_textures()
    print("All PBR textures generated successfully using Blender!")

if __name__ == '__main__':
    main()
