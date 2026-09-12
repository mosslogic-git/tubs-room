"""Generate realistic PBR texture maps for studio monitors and stands using Blender.

Outputs:
- dist/assets/cabinet-normal.png    : Fine-pebble powder-coat stipple for monitor enclosure
- dist/assets/cabinet-roughness.png : Microscopic sheen variation for satin black finish
- dist/assets/cone-normal.png       : Concentric micro-ribs + woven composite fiber weave
- dist/assets/waveguide-normal.png  : Fine bead-blasted cast-aluminum texture
- dist/assets/stand-normal.png      : Heavy sand-cast / textured structural steel
- dist/assets/stand-roughness.png   : Industrial matte finish for pedestal stands
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
    print(f"Saved: {path.name} ({w}x{h})")

def height_to_normal_map(height, strength=1.5):
    """Convert heightfield to tangent-space normal map."""
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

def build_cabinet_textures(size=512):
    print("Building studio monitor cabinet textures...")
    micro = generate_fourier_noise(size, octaves=7, seed=701, decay=0.5)
    nano = generate_fourier_noise(size, octaves=8, seed=702, decay=0.35)
    cabinet_height = micro * 0.65 + nano * 0.35
    
    norm = height_to_normal_map(cabinet_height, strength=1.8)
    save_image_from_numpy(norm, ASSETS / 'cabinet-normal.png')
    
    rough = (0.78 + (micro - 0.5) * 0.12).clip(0.65, 0.92)
    rough_rgba = np.stack([rough, rough, rough, np.ones_like(rough)], axis=-1)
    save_image_from_numpy(rough_rgba, ASSETS / 'cabinet-roughness.png')

def build_cone_textures(size=512):
    print("Building woofer cone textures...")
    x = np.linspace(-1, 1, size)
    y = np.linspace(-1, 1, size)
    X, Y = np.meshgrid(x, y)
    R = np.sqrt(X**2 + Y**2)
    
    rings = np.sin(R * np.pi * 64) * 0.5 + 0.5
    u = (X + Y) * 48
    v = (X - Y) * 48
    weave = (np.sin(u * np.pi) * np.cos(v * np.pi) * 0.5 + 0.5)
    noise = generate_fourier_noise(size, octaves=6, seed=801, decay=0.6)
    
    cone_height = rings * 0.35 + weave * 0.45 + noise * 0.20
    cone_norm = height_to_normal_map(cone_height, strength=2.2)
    save_image_from_numpy(cone_norm, ASSETS / 'cone-normal.png')

def build_waveguide_textures(size=512):
    print("Building waveguide textures...")
    noise1 = generate_fourier_noise(size, octaves=8, seed=901, decay=0.4)
    noise2 = generate_fourier_noise(size, octaves=7, seed=902, decay=0.5)
    wg_height = noise1 * 0.6 + noise2 * 0.4
    
    wg_norm = height_to_normal_map(wg_height, strength=1.4)
    save_image_from_numpy(wg_norm, ASSETS / 'waveguide-normal.png')

def build_stand_textures(size=512):
    print("Building pedestal stand textures...")
    macro = generate_fourier_noise(size, octaves=5, seed=1001, decay=0.8)
    stipple = generate_fourier_noise(size, octaves=7, seed=1002, decay=0.45)
    crackle = generate_fourier_noise(size, octaves=8, seed=1003, decay=0.3)
    
    stand_height = macro * 0.25 + stipple * 0.50 + crackle * 0.25
    stand_norm = height_to_normal_map(stand_height, strength=2.6)
    save_image_from_numpy(stand_norm, ASSETS / 'stand-normal.png')
    
    stand_rough = (0.84 + (stipple - 0.5) * 0.16).clip(0.70, 0.95)
    stand_rough_rgba = np.stack([stand_rough, stand_rough, stand_rough, np.ones_like(stand_rough)], axis=-1)
    save_image_from_numpy(stand_rough_rgba, ASSETS / 'stand-roughness.png')

def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build_cabinet_textures(512)
    build_cone_textures(512)
    build_waveguide_textures(512)
    build_stand_textures(512)
    print("All studio monitor & stand textures generated successfully!")

if __name__ == '__main__':
    main()
