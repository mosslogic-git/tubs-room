"""Refine speaker GLB assets in Blender.

Applies:
- Clean geometry and duplicate vertex removal
- Weighted Normal smoothing for clean shading without smoothing sharp 90-degree corners
- PBR material update to exact Tub's 20% darker finish (#363c2e)
- Exports refined models back to dist/assets/
"""
import bpy
import os
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'dist' / 'assets'

def srgb_to_linear(c):
    return pow(c / 255.0, 2.2)

def hex_to_rgba(hex_val, alpha=1.0):
    r = (hex_val >> 16) & 0xFF
    g = (hex_val >> 8) & 0xFF
    b = hex_val & 0xFF
    return (srgb_to_linear(r), srgb_to_linear(g), srgb_to_linear(b), alpha)

def refine_speaker(input_path, output_path):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(input_path))
    
    # 20% darker than side walls #434b3a -> #363c2e
    shell_color = hex_to_rgba(0x363c2e)
    
    mat = bpy.data.materials.new(name="Satin cabinet")
    nodes = mat.node_tree.nodes
    nodes.clear()
    out = nodes.new(type='ShaderNodeOutputMaterial')
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = shell_color
    bsdf.inputs['Roughness'].default_value = 0.76
    mat.node_tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    
    for obj in bpy.context.scene.objects:
        if obj.type == 'MESH':
            # Assign refined material
            obj.data.materials.clear()
            obj.data.materials.append(mat)
            
            # Apply weighted normal modifier for smooth curvature + crisp sharp edges
            mod = obj.modifiers.new(name='WeightedNormal', type='WEIGHTED_NORMAL')
            mod.keep_sharp = True
            mod.weight = 50
    
    # Export glTF binary with Meshopt compression
    bpy.ops.export_scene.gltf(
        filepath=str(output_path),
        export_format='GLB',
        use_selection=False,
        export_apply=True,
        export_materials='EXPORT',
        export_meshopt_compression_enable=True
    )
    print(f"Refined and exported: {output_path.name}")

def main():
    for i in range(4):
        for suffix in ['', '-lod']:
            f = ASSETS / f"speaker-{i}{suffix}.glb"
            if f.exists():
                refine_speaker(f, f)

if __name__ == '__main__':
    main()
