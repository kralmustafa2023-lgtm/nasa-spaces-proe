import bpy
import os
import sys

args = sys.argv[sys.argv.index("--") + 1:]
source, target = args[0], args[1]
extension = os.path.splitext(source)[1].lower()
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)

if extension == ".blend":
    bpy.ops.wm.open_mainfile(filepath=source)
elif extension == ".fbx":
    bpy.ops.import_scene.fbx(filepath=source)
elif extension == ".obj":
    bpy.ops.wm.obj_import(filepath=source)
elif extension == ".3ds":
    bpy.ops.import_scene.max3ds(filepath=source)
elif extension == ".gltf":
    bpy.ops.import_scene.gltf(filepath=source)
else:
    raise RuntimeError("Desteklenmeyen Blender içe aktarma biçimi: " + extension)

missing = []
for image in bpy.data.images:
    if image.packed_file:
        continue
    image_path = bpy.path.abspath(image.filepath)
    if image.filepath and not os.path.isfile(image_path):
        missing.append(image.filepath)

os.makedirs(os.path.dirname(target), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=target,
    export_format="GLB",
    export_image_format="AUTO",
    export_copyright="NASA source asset; see project asset report",
)
print("MISSING_TEXTURES=" + "|".join(missing))
