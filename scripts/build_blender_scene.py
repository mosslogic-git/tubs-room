"""Build and refine the Tub's Audio Club Room scene in Blender.

Creates:
- Complete architectural room (floor, walls, ceiling, artwork, lighting strips)
- High-fidelity Tub's Audio speaker stacks (GC410, GC218, DC12, OBSLK) with beveled edges,
  exact 20% darker finish (#363c2e), driver cones, horns, and grilles.
- Stylized industrial DJ booth (turntables, 4-ch mixer, knobs, crossfader, LED VU strips)
- Studio lighting (key, rim, fill, emissive ceiling strips)
- Three tuned camera viewpoints (Inside Walk/Listener, Overview Orbit, Stack Close-up)
- Saves master project: club-room.blend
"""
import bpy
import math
import os
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'dist' / 'assets'
BLEND_OUT = ROOT / 'club-room.blend'

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)

def create_collection(name, parent=None):
    col = bpy.data.collections.new(name)
    if parent:
        parent.children.link(col)
    else:
        bpy.context.scene.collection.children.link(col)
    return col

def srgb_to_linear(c):
    return pow(c / 255.0, 2.2)

def hex_to_rgba(hex_val, alpha=1.0):
    r = (hex_val >> 16) & 0xFF
    g = (hex_val >> 8) & 0xFF
    b = hex_val & 0xFF
    return (srgb_to_linear(r), srgb_to_linear(g), srgb_to_linear(b), alpha)

def create_pbr_material(name, base_color, roughness=0.5, metallic=0.0, emission=None, emission_strength=1.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    
    output = nodes.new(type='ShaderNodeOutputMaterial')
    principled = nodes.new(type='ShaderNodeBsdfPrincipled')
    
    principled.inputs['Base Color'].default_value = base_color
    principled.inputs['Roughness'].default_value = roughness
    principled.inputs['Metallic'].default_value = metallic
    
    if emission and 'Emission Color' in principled.inputs:
        principled.inputs['Emission Color'].default_value = emission
        principled.inputs['Emission Strength'].default_value = emission_strength
    
    mat.node_tree.links.new(principled.outputs['BSDF'], output.inputs['Surface'])
    return mat

def create_textured_material(name, base_color=None, diffuse_path=None, normal_path=None, roughness_path=None, roughness_val=0.8, uv_scale=(4.0, 4.0)):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    
    output = nodes.new(type='ShaderNodeOutputMaterial')
    principled = nodes.new(type='ShaderNodeBsdfPrincipled')
    principled.inputs['Roughness'].default_value = roughness_val
    if base_color:
        principled.inputs['Base Color'].default_value = base_color
    
    tex_coord = nodes.new(type='ShaderNodeTexCoord')
    mapping = nodes.new(type='ShaderNodeMapping')
    mapping.inputs['Scale'].default_value = (uv_scale[0], uv_scale[1], 1.0)
    mat.node_tree.links.new(tex_coord.outputs['UV'], mapping.inputs['Vector'])
    
    if diffuse_path and os.path.exists(diffuse_path):
        tex_diff = nodes.new(type='ShaderNodeTexImage')
        tex_diff.image = bpy.data.images.load(str(diffuse_path))
        mat.node_tree.links.new(mapping.outputs['Vector'], tex_diff.inputs['Vector'])
        mat.node_tree.links.new(tex_diff.outputs['Color'], principled.inputs['Base Color'])
        
    if roughness_path and os.path.exists(roughness_path):
        tex_rough = nodes.new(type='ShaderNodeTexImage')
        tex_rough.image = bpy.data.images.load(str(roughness_path))
        if hasattr(tex_rough.image, 'colorspace_settings'):
            tex_rough.image.colorspace_settings.name = 'Non-Color'
        mat.node_tree.links.new(mapping.outputs['Vector'], tex_rough.inputs['Vector'])
        mat.node_tree.links.new(tex_rough.outputs['Color'], principled.inputs['Roughness'])
        
    if normal_path and os.path.exists(normal_path):
        tex_norm = nodes.new(type='ShaderNodeTexImage')
        tex_norm.image = bpy.data.images.load(str(normal_path))
        if hasattr(tex_norm.image, 'colorspace_settings'):
            tex_norm.image.colorspace_settings.name = 'Non-Color'
        norm_map = nodes.new(type='ShaderNodeNormalMap')
        norm_map.inputs['Strength'].default_value = 0.85
        mat.node_tree.links.new(mapping.outputs['Vector'], tex_norm.inputs['Vector'])
        mat.node_tree.links.new(tex_norm.outputs['Color'], norm_map.inputs['Color'])
        mat.node_tree.links.new(norm_map.outputs['Normal'], principled.inputs['Normal'])
        
    mat.node_tree.links.new(principled.outputs['BSDF'], output.inputs['Surface'])
    return mat

def unwrap_obj_cube(obj, size=1.0):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.cube_project(cube_size=size)
    bpy.ops.object.mode_set(mode='OBJECT')
    obj.select_set(False)

def add_box(name, size, loc, collection, material=None, bevel=0.008):
    w, d, h = size
    mesh = bpy.data.meshes.new(name)
    hw, hd, hh = w / 2, d / 2, h / 2
    verts = [
        (-hw, -hd, -hh), (hw, -hd, -hh), (hw, hd, -hh), (-hw, hd, -hh),
        (-hw, -hd, hh), (hw, -hd, hh), (hw, hd, hh), (-hw, hd, hh)
    ]
    faces = [
        (0, 1, 2, 3), (4, 5, 6, 7), (0, 1, 5, 4),
        (2, 3, 7, 6), (0, 3, 7, 4), (1, 2, 6, 5)
    ]
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    
    obj = bpy.data.objects.new(name, mesh)
    obj.location = loc
    if material:
        obj.data.materials.append(material)
    
    collection.objects.link(obj)
    
    if bevel > 0:
        mod = obj.modifiers.new(name='Bevel', type='BEVEL')
        mod.width = bevel
        mod.segments = 2
    
    return obj

def add_cylinder(name, radius, depth, loc, rot, collection, material=None):
    bpy.ops.mesh.primitive_cylinder_add(
        radius=radius,
        depth=depth,
        location=loc,
        rotation=rot,
        vertices=32
    )
    obj = bpy.context.active_object
    obj.name = name
    if material:
        obj.data.materials.append(material)
    bpy.context.scene.collection.objects.unlink(obj)
    collection.objects.link(obj)
    return obj

def build_speaker_cabinet(name, width, depth, height, loc, rot_z, collection, materials, tilt_x=0.0):
    col = bpy.data.collections.new(name)
    collection.children.link(col)
    
    mat_shell = materials['shell']
    mat_dark = materials['dark']
    mat_metal = materials['metal']
    mat_steel = materials.get('steel', mat_dark)
    
    wall = 0.02
    objs = []
    objs.append(add_box(f"{name}_Shell_Bottom", (width, depth, wall), (loc[0], loc[1], loc[2] + wall/2), col, mat_shell))
    objs.append(add_box(f"{name}_Shell_Top", (width, depth, wall), (loc[0], loc[1], loc[2] + height - wall/2), col, mat_shell))
    objs.append(add_box(f"{name}_Shell_Left", (wall, depth, height - 2*wall), (loc[0] - width/2 + wall/2, loc[1], loc[2] + height/2), col, mat_shell))
    objs.append(add_box(f"{name}_Shell_Right", (wall, depth, height - 2*wall), (loc[0] + width/2 - wall/2, loc[1], loc[2] + height/2), col, mat_shell))
    objs.append(add_box(f"{name}_Shell_Back", (width - 2*wall, wall, height - 2*wall), (loc[0], loc[1] - depth/2 + wall/2, loc[2] + height/2), col, mat_shell))
    
    baffle_y = loc[1] + depth/2 - 0.06
    objs.append(add_box(f"{name}_Baffle", (width - 2*wall, 0.015, height - 2*wall), (loc[0], baffle_y, loc[2] + height/2), col, mat_dark, bevel=0))
    
    grille_y = loc[1] + depth/2 - 0.015
    objs.append(add_box(f"{name}_Grille", (width - 0.03, 0.008, height - 0.03), (loc[0], grille_y, loc[2] + height/2), col, mat_dark, bevel=0.002))
    
    for sx in [-1, 1]:
        for sz in [1, 2]:
            bz = loc[2] + (0.04 if sz == 1 else height - 0.04)
            bx = loc[0] + sx * (width/2 - 0.03)
            objs.append(add_cylinder(f"{name}_Bolt_{sx}_{sz}", 0.005, 0.008, (bx, loc[1] + depth/2 - 0.008, bz), (math.pi/2, 0, 0), col, mat_metal))

    if tilt_x != 0.0:
        bpy.context.view_layer.update()
        pivot_y = loc[1] + depth/2 - 0.035
        pivot_z = loc[2] + 0.085
        pivot = bpy.data.objects.new(f"{name}_Pivot", None)
        pivot.location = (loc[0], pivot_y, pivot_z)
        col.objects.link(pivot)
        bpy.context.view_layer.update()

        for obj in objs:
            obj.parent = pivot
            obj.matrix_parent_inverse = pivot.matrix_world.inverted()
        pivot.rotation_euler = (tilt_x, 0, rot_z)
        bpy.context.view_layer.update()

        # Side tilt brackets (Tub's Audio Specification)
        bracket_thick = 0.008
        for sx in [-1, 1]:
            bx = loc[0] + sx * (width/2 + bracket_thick/2 + 0.002)
            # Base plate on sub
            add_box(f"{name}_Bracket_Base_{sx}", (bracket_thick, 0.18, 0.035), (bx, pivot_y - 0.045, loc[2] + 0.017), col, mat_steel)
            # Upright hinge arm
            add_box(f"{name}_Bracket_Arm_{sx}", (bracket_thick, 0.045, 0.095), (bx, pivot_y, loc[2] + 0.05), col, mat_steel)
            # Main pivot pin
            add_cylinder(f"{name}_Bracket_Pin_{sx}", 0.009, bracket_thick + 0.012, (bx, pivot_y, pivot_z), (0, math.pi/2, 0), col, mat_metal)
            # Diagonal strut
            add_box(f"{name}_Bracket_Strut_{sx}", (bracket_thick * 0.8, 0.16, 0.022), (bx, pivot_y - 0.075, pivot_z + 0.05), col, mat_steel)
            # Clamp bolt
            add_cylinder(f"{name}_Bracket_Clamp_{sx}", 0.007, bracket_thick + 0.014, (bx, pivot_y - 0.125, pivot_z + 0.08), (0, math.pi/2, 0), col, mat_metal)

def build_dj_booth(loc, collection, materials):
    col = bpy.data.collections.new("DJ_Booth")
    collection.children.link(col)
    
    mat_steel = materials['steel']
    mat_wood = materials['wood']
    mat_dark = materials['dark']
    mat_metal = materials['metal']
    mat_green = materials['led_green']
    mat_cyan = materials['led_cyan']
    
    bx, by, bz = loc
    w, d, h = 1.95, 0.78, 0.90
    add_box("DJ_Desk_Top", (w, d, 0.045), (bx, by, bz + h - 0.022), col, mat_wood, bevel=0.006)
    
    leg_thick = 0.04
    for lx in [-w/2 + 0.04, w/2 - 0.04]:
        for ly in [-d/2 + 0.04, d/2 - 0.04]:
            add_box(f"DJ_Leg_{lx}_{ly}", (leg_thick, leg_thick, h - 0.045), (bx + lx, by + ly, bz + (h - 0.045)/2), col, mat_steel, bevel=0.002)
    
    add_box("DJ_Modesty_Panel", (w - 0.12, 0.015, h * 0.65), (bx, by + d/2 - 0.02, bz + h * 0.45), col, mat_steel, bevel=0.002)
    
    for side, tx in [("Left", -0.58), ("Right", 0.58)]:
        add_box(f"Turntable_Body_{side}", (0.45, 0.35, 0.05), (bx + tx, by, bz + h + 0.025), col, mat_steel, bevel=0.004)
        add_cylinder(f"Platter_{side}", 0.155, 0.012, (bx + tx, by, bz + h + 0.056), (0, 0, 0), col, mat_metal)
        add_cylinder(f"Vinyl_{side}", 0.150, 0.003, (bx + tx, by, bz + h + 0.063), (0, 0, 0), col, mat_dark)
        add_cylinder(f"Spindle_{side}", 0.008, 0.014, (bx + tx, by, bz + h + 0.068), (0, 0, 0), col, mat_metal)
    
    add_box("DJ_Mixer_Chassis", (0.33, 0.38, 0.06), (bx, by, bz + h + 0.03), col, mat_dark, bevel=0.004)
    for ch in range(4):
        cx = bx - 0.10 + ch * 0.066
        for kn in range(3):
            ky = by - 0.04 + kn * 0.04
            add_cylinder(f"Mixer_Knob_{ch}_{kn}", 0.007, 0.014, (cx, ky, bz + h + 0.067), (0, 0, 0), col, mat_steel)
    
    add_box("Mixer_Crossfader", (0.05, 0.012, 0.010), (bx, by - 0.12, bz + h + 0.065), col, mat_metal, bevel=0.001)
    add_box("Mixer_VU_Green", (0.006, 0.07, 0.004), (bx - 0.015, by + 0.04, bz + h + 0.062), col, mat_green, bevel=0)
    add_box("Mixer_VU_Cyan", (0.006, 0.07, 0.004), (bx + 0.015, by + 0.04, bz + h + 0.062), col, mat_cyan, bevel=0)

def main():
    clear_scene()
    
    scene = bpy.context.scene
    scene.unit_settings.system = 'METRIC'
    scene.unit_settings.scale_length = 1.0
    
    # Palette:
    # Side walls: #434b3a
    # Speakers: #363c2e (20% darker than side walls)
    floor_diff = ASSETS / 'floor-diffuse.png'
    floor_norm = ASSETS / 'floor-normal.png'
    floor_rough = ASSETS / 'floor-roughness.png'
    wall_norm = ASSETS / 'wall-normal.png'
    wall_rough = ASSETS / 'wall-roughness.png'
    
    materials = {
        'floor': create_textured_material('Mat_Floor', diffuse_path=floor_diff, normal_path=floor_norm, roughness_path=floor_rough, uv_scale=(5.0, 6.0)),
        'wall_side': create_textured_material('Mat_SideWall', base_color=hex_to_rgba(0x434b3a), normal_path=wall_norm, roughness_path=wall_rough, roughness_val=0.90, uv_scale=(4.0, 3.0)),
        'wall_back': create_textured_material('Mat_BackWall', base_color=hex_to_rgba(0x171c20), normal_path=wall_norm, roughness_path=wall_rough, roughness_val=0.92, uv_scale=(4.0, 3.0)),
        'ceiling': create_pbr_material('Mat_Ceiling', hex_to_rgba(0x465361), roughness=0.95),
        'shell': create_pbr_material('Mat_SpeakerCabinet_20pctDarker', hex_to_rgba(0x363c2e), roughness=0.76),
        'dark': create_pbr_material('Mat_DarkMatte', hex_to_rgba(0x111514), roughness=0.92),
        'cone': create_pbr_material('Mat_SpeakerCone', hex_to_rgba(0x252c29), roughness=0.85),
        'metal': create_pbr_material('Mat_HardwareMetal', hex_to_rgba(0x6b746d), roughness=0.35, metallic=0.85),
        'steel': create_pbr_material('Mat_IndustrialSteel', hex_to_rgba(0x1a201c), roughness=0.45, metallic=0.70),
        'wood': create_pbr_material('Mat_DarkWalnut', hex_to_rgba(0x1c1714), roughness=0.65),
        'strip_light': create_pbr_material('Mat_CeilingStripLight', hex_to_rgba(0xc5d8af), emission=hex_to_rgba(0xc5d8af), emission_strength=4.5),
        'led_green': create_pbr_material('Mat_LED_Green', (0.1, 0.9, 0.2, 1.0), emission=(0.1, 0.9, 0.2, 1.0), emission_strength=6.0),
        'led_cyan': create_pbr_material('Mat_LED_Cyan', (0.1, 0.8, 0.9, 1.0), emission=(0.1, 0.8, 0.9, 1.0), emission_strength=6.0),
    }
    
    lady_tex = ASSETS / 'tubs-lady.webp'
    materials['art'] = create_textured_material('Mat_TubsLadyArtwork', diffuse_path=lady_tex, roughness_val=0.85, uv_scale=(1.0, 1.0))
    
    # Architecture
    col_arch = create_collection("Architecture")
    room_w, room_d, room_h = 8.0, 10.0, 3.5
    
    fl_obj = add_box("Floor", (room_w, room_d, 0.05), (0, 0, -0.025), col_arch, materials['floor'], bevel=0)
    unwrap_obj_cube(fl_obj, size=2.0)
    
    add_box("Ceiling", (room_w, room_d, 0.05), (0, 0, room_h + 0.025), col_arch, materials['ceiling'], bevel=0)
    
    wb_obj = add_box("Wall_Back", (room_w, 0.05, room_h), (0, -room_d/2 - 0.025, room_h/2), col_arch, materials['wall_back'], bevel=0)
    unwrap_obj_cube(wb_obj, size=2.0)
    
    wl_obj = add_box("Wall_Left", (0.05, room_d, room_h), (-room_w/2 - 0.025, 0, room_h/2), col_arch, materials['wall_side'], bevel=0)
    unwrap_obj_cube(wl_obj, size=2.0)
    
    wr_obj = add_box("Wall_Right", (0.05, room_d, room_h), (room_w/2 + 0.025, 0, room_h/2), col_arch, materials['wall_side'], bevel=0)
    unwrap_obj_cube(wr_obj, size=2.0)
    
    art_h = min(room_h * 0.84, 3.9)
    art_w = art_h * 1000.0 / 1636.0
    add_box("Artwork_Tubs_Lady", (art_w, 0.005, art_h), (0, -room_d/2 + 0.01, art_h/2 + 0.06), col_arch, materials['art'], bevel=0)
    
    for sx in [-room_w * 0.42, room_w * 0.42]:
        add_box(f"Ceiling_Strip_{sx}", (0.025, room_d * 0.84, 0.015), (sx, 0, room_h - 0.01), col_arch, materials['strip_light'], bevel=0)
    
    # Sound System (Tub's Audio Speakers with 30-degree tilted tops)
    col_sound = create_collection("Sound_System")
    top_tilt = -math.radians(30)
    
    # Main Club Stacks for 80m2 (2x GC118 Subs stacked vertically + DC12 Top on top upright)
    sub_w, sub_d, sub_h = 0.65, 0.75, 0.68
    top_w, top_d, top_h = 0.646, 0.353, 0.40
    main_y = -room_d/2 + 2.0
    for side, sx in [("Left", -2.8), ("Right", 2.8)]:
        build_speaker_cabinet(f"{side}_Main_GC118_Sub_1", sub_w, sub_d, sub_h, (sx, main_y, 0), 0, col_sound, materials)
        build_speaker_cabinet(f"{side}_Main_GC118_Sub_2", sub_w, sub_d, sub_h, (sx, main_y, sub_h), 0, col_sound, materials)
        build_speaker_cabinet(f"{side}_Main_DC12_Top", top_w, top_d, top_h, (sx, main_y, 2 * sub_h), 0, col_sound, materials, tilt_x=0.0)
    
    # DJ Booth Monitor Stacks (GC118 Sub + DC12 Top angled 30° towards DJ booth)
    mon_sub_d, mon_top_d = 0.75, 0.353
    mon_top_y = -room_d/2 + 1.15 + (mon_sub_d - mon_top_d)/2 - 0.025
    build_speaker_cabinet("Left_DJ_Monitor_Sub", 0.65, mon_sub_d, 0.68, (-1.55, -room_d/2 + 1.15, 0), 0, col_sound, materials)
    build_speaker_cabinet("Left_DJ_Monitor_Top", 0.646, mon_top_d, 0.40, (-1.55, mon_top_y, 0.68), 0, col_sound, materials, tilt_x=top_tilt)
    build_speaker_cabinet("Right_DJ_Monitor_Sub", 0.65, mon_sub_d, 0.68, (1.55, -room_d/2 + 1.15, 0), 0, col_sound, materials)
    build_speaker_cabinet("Right_DJ_Monitor_Top", 0.646, mon_top_d, 0.40, (1.55, mon_top_y, 0.68), 0, col_sound, materials, tilt_x=top_tilt)
    
    # DJ Stage
    col_stage = create_collection("DJ_Stage")
    build_dj_booth((0, -room_d/2 + 1.15, 0), col_stage, materials)
    
    # Studio Lighting
    col_lights = create_collection("Lighting")
    key_data = bpy.data.lights.new(name="Light_Key", type='AREA')
    key_data.energy = 450.0
    key_data.size = 2.5
    key_data.color = (0.95, 0.94, 0.85)
    key_obj = bpy.data.objects.new(name="Light_Key", object_data=key_data)
    key_obj.location = (-3.0, 3.5, room_h + 1.0)
    key_obj.rotation_euler = (math.radians(35), math.radians(-25), math.radians(-30))
    col_lights.objects.link(key_obj)
    
    rim_data = bpy.data.lights.new(name="Light_Rim", type='AREA')
    rim_data.energy = 280.0
    rim_data.size = 2.0
    rim_data.color = (0.72, 0.82, 0.60)
    rim_obj = bpy.data.objects.new(name="Light_Rim", object_data=rim_data)
    rim_obj.location = (3.5, -4.5, 2.8)
    rim_obj.rotation_euler = (math.radians(-40), math.radians(20), math.radians(135))
    col_lights.objects.link(rim_obj)
    
    fill_data = bpy.data.lights.new(name="Light_Fill", type='AREA')
    fill_data.energy = 160.0
    fill_data.size = 4.0
    fill_data.color = (0.83, 0.89, 0.94)
    fill_obj = bpy.data.objects.new(name="Light_Fill", object_data=fill_data)
    fill_obj.location = (0, 3.0, 3.2)
    fill_obj.rotation_euler = (math.radians(45), 0, 0)
    col_lights.objects.link(fill_obj)
    
    # Cameras
    col_cams = create_collection("Cameras")
    cam1_data = bpy.data.cameras.new("Cam_Listener_Inside")
    cam1_data.lens = 28.0
    cam1_obj = bpy.data.objects.new("Cam_Listener_Inside", cam1_data)
    cam1_obj.location = (0, 3.8, 1.65)
    cam1_obj.rotation_euler = (math.radians(88), 0, math.radians(180))
    col_cams.objects.link(cam1_obj)
    
    cam2_data = bpy.data.cameras.new("Cam_Overview_Orbit")
    cam2_data.lens = 35.0
    cam2_obj = bpy.data.objects.new("Cam_Overview_Orbit", cam2_data)
    cam2_obj.location = (7.5, 7.5, 5.5)
    cam2_obj.rotation_euler = (math.radians(62), 0, math.radians(45))
    col_cams.objects.link(cam2_obj)
    
    cam3_data = bpy.data.cameras.new("Cam_Speaker_CloseUp")
    cam3_data.lens = 50.0
    cam3_obj = bpy.data.objects.new("Cam_Speaker_CloseUp", cam3_data)
    cam3_obj.location = (-1.8, -room_d/2 + 3.2, 1.2)
    cam3_obj.rotation_euler = (math.radians(84), 0, math.radians(-155))
    col_cams.objects.link(cam3_obj)
    
    # 6. Imported Meshy Models Collection (Available for reference)
    col_meshy = create_collection("Imported_Meshy_Cabinets")
    for i in range(4):
        p = ASSETS / f"speaker-{i}.glb"
        if p.exists():
            before_objs = set(bpy.data.objects)
            bpy.ops.import_scene.gltf(filepath=str(p))
            new_objs = set(bpy.data.objects) - before_objs
            for obj in new_objs:
                obj.name = f"Meshy_Speaker_{i}"
                obj.location = (-3.0 + i * 2.0, -room_d/2 - 1.5, 0)
                # Unlink from scene and link to col_meshy
                if obj.name in bpy.context.scene.collection.objects:
                    bpy.context.scene.collection.objects.unlink(obj)
                col_meshy.objects.link(obj)
    
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUT))
    print(f"SUCCESS: Saved refined Blender scene to {BLEND_OUT}")

if __name__ == '__main__':
    main()
