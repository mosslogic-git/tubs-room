"""Generate lightweight geometry copies; keep uploaded originals unchanged.
Usage: python scripts/optimize.py INPUT_DIRECTORY
Textures are replaced by a neutral cabinet finish in the app.
"""
import struct,json,sys,pathlib,numpy as np,fast_simplification,trimesh
root=pathlib.Path(__file__).resolve().parents[1]
files=['Meshy_AI_Dual_Fan_Cabinet_0826014119_generate.glb','Meshy_AI_Meshy_AI_Industrial_D_0828112539_generate (1).glb','Meshy_AI_Honeycomb_Speaker_0828103132_texture.glb','Meshy_AI__0826020149_texture.glb']
for num,name in enumerate(files):
 with open(pathlib.Path(sys.argv[1])/name,'rb') as f:
  f.read(12);n,_=struct.unpack('<II',f.read(8));j=json.loads(f.read(n));n,_=struct.unpack('<II',f.read(8));b=f.read(n)
 def acc(k):
  a=j['accessors'][k];v=j['bufferViews'][a['bufferView']];dtype={5126:'<f4',5125:'<u4',5123:'<u2',5121:'u1'}[a['componentType']];c={'SCALAR':1,'VEC3':3,'VEC2':2,'VEC4':4}[a['type']];offset=v.get('byteOffset',0)+a.get('byteOffset',0)
  return np.ndarray((a['count'],c),dtype=dtype,buffer=b,offset=offset,strides=(v.get('byteStride',np.dtype(dtype).itemsize*c),np.dtype(dtype).itemsize)).copy()
 p=j['meshes'][0]['primitives'][0];v=acc(p['attributes']['POSITION']);f=acc(p['indices']).reshape(-1,3) if 'indices' in p else np.arange(len(v)).reshape(-1,3)
 mesh=trimesh.Trimesh(v,f,process=True);v,f=fast_simplification.simplify(mesh.vertices,mesh.faces,target_count=24000)
 mesh=trimesh.Trimesh(v,f,process=False);mesh.export(root/'dist/assets'/f'speaker-{num}.glb');print(name,len(f),'triangles',flush=True)
