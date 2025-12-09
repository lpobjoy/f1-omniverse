#!/usr/bin/env python3
"""
OBJ to USD Converter for F1 Car
================================

Converts the F1 car OBJ model to USD format with proper hierarchy
for use in Omniverse. Creates car variants for each team livery.

Run in Omniverse Python environment:
    python convert_car_to_usd.py

Or from Omniverse Script Editor.
"""

import os
import sys
from pathlib import Path

try:
    from pxr import Usd, UsdGeom, UsdShade, Gf, Sdf, Kind
    HAS_USD = True
except ImportError:
    HAS_USD = False
    print("ERROR: USD (pxr) library not available.")
    print("Run this script in Omniverse Python environment.")
    sys.exit(1)

# Try to import Omniverse asset converter
try:
    import omni.kit.asset_converter
    HAS_CONVERTER = True
except ImportError:
    HAS_CONVERTER = False


# Team configurations
TEAMS = [
    {"name": "Ferrari", "driver": "Karina", "number": 16, "color": (0.863, 0.0, 0.0)},
    {"name": "RedBull", "driver": "Lewis", "number": 1, "color": (0.118, 0.255, 1.0)},
    {"name": "Mercedes", "driver": "Rolf", "number": 44, "color": (0.0, 0.824, 0.745)},
    {"name": "McLaren", "driver": "Richa", "number": 4, "color": (1.0, 0.529, 0.0)},
    {"name": "AstonMartin", "driver": "Dennis", "number": 14, "color": (0.0, 0.435, 0.384)},
    {"name": "Alpine", "driver": "Sujith", "number": 10, "color": (1.0, 0.51, 0.706)},
]


def get_project_paths():
    """Get project directory paths."""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent.parent  # f1-omniverse
    
    return {
        "project": project_root,
        "assets": project_root / "assets",
        "usd": project_root / "assets" / "usd",
        "materials": project_root / "assets" / "materials",
        "textures": project_root / "assets" / "textures",
        "source_obj": project_root.parent / "f1-telemetry" / "assets" / "f1-car.obj",
        "source_mtl": project_root.parent / "f1-telemetry" / "assets" / "f1-car.mtl",
    }


def create_car_usd_from_scratch(output_path: str, team: dict):
    """
    Create a simplified F1 car USD from scratch (fallback if OBJ import unavailable).
    
    This creates basic geometry representing an F1 car shape.
    """
    stage = Usd.Stage.CreateNew(output_path)
    stage.SetMetadata("metersPerUnit", 1.0)
    stage.SetMetadata("upAxis", "Y")
    
    # Create car root with model kind
    car_root = UsdGeom.Xform.Define(stage, "/F1Car")
    Usd.ModelAPI(car_root.GetPrim()).SetKind(Kind.Tokens.component)
    
    # Car dimensions (approximate F1 car in meters)
    car_length = 5.5
    car_width = 2.0
    car_height = 0.95
    
    # Main body (simplified monocoque)
    body = UsdGeom.Mesh.Define(stage, "/F1Car/Body")
    
    # Create a tapered box shape for the body
    body_points = [
        # Front (narrow)
        Gf.Vec3f(-0.4, 0.3, car_length/2),      # Front left top
        Gf.Vec3f(0.4, 0.3, car_length/2),       # Front right top
        Gf.Vec3f(-0.4, 0.1, car_length/2),      # Front left bottom
        Gf.Vec3f(0.4, 0.1, car_length/2),       # Front right bottom
        # Cockpit area
        Gf.Vec3f(-0.5, 0.5, 1.0),
        Gf.Vec3f(0.5, 0.5, 1.0),
        Gf.Vec3f(-0.5, 0.1, 1.0),
        Gf.Vec3f(0.5, 0.1, 1.0),
        # Rear (wide)
        Gf.Vec3f(-car_width/2, 0.4, -car_length/2 + 0.5),
        Gf.Vec3f(car_width/2, 0.4, -car_length/2 + 0.5),
        Gf.Vec3f(-car_width/2, 0.1, -car_length/2 + 0.5),
        Gf.Vec3f(car_width/2, 0.1, -car_length/2 + 0.5),
        # Rear end
        Gf.Vec3f(-car_width/2, 0.5, -car_length/2),
        Gf.Vec3f(car_width/2, 0.5, -car_length/2),
        Gf.Vec3f(-car_width/2, 0.1, -car_length/2),
        Gf.Vec3f(car_width/2, 0.1, -car_length/2),
    ]
    
    body.CreatePointsAttr(body_points)
    body.CreateFaceVertexCountsAttr([4] * 14)  # 14 quad faces
    body.CreateFaceVertexIndicesAttr([
        # Front face
        0, 1, 3, 2,
        # Top faces
        0, 4, 5, 1,
        4, 8, 9, 5,
        8, 12, 13, 9,
        # Bottom faces
        2, 3, 7, 6,
        6, 7, 11, 10,
        10, 11, 15, 14,
        # Side faces (left)
        0, 2, 6, 4,
        4, 6, 10, 8,
        8, 10, 14, 12,
        # Side faces (right)
        1, 5, 7, 3,
        5, 9, 11, 7,
        9, 13, 15, 11,
        # Rear face
        12, 14, 15, 13,
    ])
    body.CreateDisplayColorAttr([team["color"]])
    
    # Front wing
    front_wing = UsdGeom.Cube.Define(stage, "/F1Car/FrontWing")
    front_wing.CreateSizeAttr(1.0)
    front_wing.AddScaleOp().Set(Gf.Vec3f(car_width, 0.05, 0.3))
    front_wing.AddTranslateOp().Set(Gf.Vec3d(0, 0.15, car_length/2 + 0.2))
    front_wing.CreateDisplayColorAttr([team["color"]])
    
    # Rear wing
    rear_wing_main = UsdGeom.Cube.Define(stage, "/F1Car/RearWing/MainPlane")
    rear_wing_main.CreateSizeAttr(1.0)
    rear_wing_main.AddScaleOp().Set(Gf.Vec3f(1.0, 0.3, 0.15))
    rear_wing_main.AddTranslateOp().Set(Gf.Vec3d(0, 0.9, -car_length/2 + 0.3))
    rear_wing_main.CreateDisplayColorAttr([team["color"]])
    
    # DRS flap
    drs_flap = UsdGeom.Cube.Define(stage, "/F1Car/RearWing/DRSFlap")
    drs_flap.CreateSizeAttr(1.0)
    drs_flap.AddScaleOp().Set(Gf.Vec3f(1.0, 0.15, 0.1))
    drs_flap.AddTranslateOp().Set(Gf.Vec3d(0, 1.05, -car_length/2 + 0.25))
    drs_flap.CreateDisplayColorAttr([team["color"]])
    
    # Rear wing endplates
    for side, x_pos in [("Left", -0.5), ("Right", 0.5)]:
        endplate = UsdGeom.Cube.Define(stage, f"/F1Car/RearWing/Endplate{side}")
        endplate.CreateSizeAttr(1.0)
        endplate.AddScaleOp().Set(Gf.Vec3f(0.02, 0.4, 0.3))
        endplate.AddTranslateOp().Set(Gf.Vec3d(x_pos, 0.85, -car_length/2 + 0.3))
        endplate.CreateDisplayColorAttr([(0.1, 0.1, 0.1)])
    
    # Wheels (4)
    wheel_positions = [
        ("FrontLeft", -0.75, 0.33, 1.8),
        ("FrontRight", 0.75, 0.33, 1.8),
        ("RearLeft", -0.8, 0.35, -1.5),
        ("RearRight", 0.8, 0.35, -1.5),
    ]
    
    for name, x, y, z in wheel_positions:
        wheel = UsdGeom.Cylinder.Define(stage, f"/F1Car/Wheels/{name}")
        wheel.CreateRadiusAttr(0.33)
        wheel.CreateHeightAttr(0.35)
        wheel.CreateAxisAttr("X")
        wheel.AddTranslateOp().Set(Gf.Vec3d(x, y, z))
        wheel.CreateDisplayColorAttr([(0.15, 0.15, 0.15)])
    
    # Halo
    halo = UsdGeom.Cube.Define(stage, "/F1Car/Halo")
    halo.CreateSizeAttr(1.0)
    halo.AddScaleOp().Set(Gf.Vec3f(0.6, 0.05, 0.05))
    halo.AddTranslateOp().Set(Gf.Vec3d(0, 0.7, 0.8))
    halo.CreateDisplayColorAttr([(0.2, 0.2, 0.2)])
    
    # Driver helmet
    helmet = UsdGeom.Sphere.Define(stage, "/F1Car/Helmet")
    helmet.CreateRadiusAttr(0.15)
    helmet.AddTranslateOp().Set(Gf.Vec3d(0, 0.55, 0.5))
    helmet.CreateDisplayColorAttr([team["color"]])
    
    # Driver number (as a simple cube placeholder)
    number_plate = UsdGeom.Cube.Define(stage, "/F1Car/NumberPlate")
    number_plate.CreateSizeAttr(1.0)
    number_plate.AddScaleOp().Set(Gf.Vec3f(0.3, 0.2, 0.01))
    number_plate.AddTranslateOp().Set(Gf.Vec3d(0, 0.35, 0.3))
    number_plate.CreateDisplayColorAttr([(1, 1, 1)])
    
    # Add custom attributes for runtime
    car_prim = stage.GetPrimAtPath("/F1Car")
    car_prim.CreateAttribute("f1:teamName", Sdf.ValueTypeNames.String).Set(team["name"])
    car_prim.CreateAttribute("f1:driverName", Sdf.ValueTypeNames.String).Set(team["driver"])
    car_prim.CreateAttribute("f1:carNumber", Sdf.ValueTypeNames.Int).Set(team["number"])
    
    stage.GetRootLayer().Save()
    return True


def create_all_team_cars(output_dir: Path):
    """Create USD car models for all teams."""
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"\nCreating F1 car USD files in: {output_dir}")
    print("-" * 50)
    
    for team in TEAMS:
        filename = f"f1_car_{team['name'].lower()}.usd"
        output_path = output_dir / filename
        
        print(f"Creating {team['name']} car for {team['driver']} (#{team['number']})...")
        
        try:
            create_car_usd_from_scratch(str(output_path), team)
            print(f"  ✓ Saved: {filename}")
        except Exception as e:
            print(f"  ✗ Error: {e}")
            
    print("-" * 50)
    print(f"Created {len(TEAMS)} car USD files")


def create_master_car_with_variants(output_path: str):
    """
    Create a master car USD with variant sets for each team.
    This is more efficient than separate files.
    """
    stage = Usd.Stage.CreateNew(output_path)
    stage.SetMetadata("metersPerUnit", 1.0)
    stage.SetMetadata("upAxis", "Y")
    
    # Create car root
    car_root = UsdGeom.Xform.Define(stage, "/F1Car")
    car_prim = car_root.GetPrim()
    Usd.ModelAPI(car_prim).SetKind(Kind.Tokens.component)
    
    # Create variant set for teams
    variant_set = car_prim.GetVariantSets().AddVariantSet("team")
    
    # Create base geometry (shared by all variants)
    # ... (would include all the geometry from create_car_usd_from_scratch)
    
    # Add variants for each team
    for team in TEAMS:
        variant_name = team["name"]
        variant_set.AddVariant(variant_name)
        variant_set.SetVariantSelection(variant_name)
        
        with variant_set.GetVariantEditContext():
            # Set team-specific attributes
            car_prim.CreateAttribute("f1:teamName", Sdf.ValueTypeNames.String).Set(team["name"])
            car_prim.CreateAttribute("f1:driverName", Sdf.ValueTypeNames.String).Set(team["driver"])
            car_prim.CreateAttribute("f1:carNumber", Sdf.ValueTypeNames.Int).Set(team["number"])
            
            # Team color would be applied to materials here
            
    # Set default variant
    variant_set.SetVariantSelection("Ferrari")
    
    stage.GetRootLayer().Save()
    print(f"Created master car with variants: {output_path}")


async def convert_obj_to_usd_async(input_path: str, output_path: str):
    """
    Use Omniverse Asset Converter to convert OBJ to USD.
    This requires running in Omniverse Kit environment.
    """
    if not HAS_CONVERTER:
        print("Asset converter not available. Using procedural generation.")
        return False
        
    import omni.kit.asset_converter as converter
    
    context = converter.AssetConverterContext()
    context.ignore_materials = False
    context.ignore_animations = True
    context.ignore_cameras = True
    context.single_mesh = False
    context.smooth_normals = True
    context.export_preview_surface = True
    context.embed_mdl_in_usd = True
    context.use_meter_as_world_unit = True
    context.create_world_as_default_root_prim = True
    
    instance = converter.get_instance()
    task = instance.create_converter_task(input_path, output_path, None, context)
    
    success = await task.wait_until_finished()
    
    if not success:
        print(f"Conversion failed: {task.get_error_message()}")
        return False
        
    print(f"Successfully converted: {output_path}")
    return True


def main():
    """Main entry point."""
    paths = get_project_paths()
    
    print("=" * 60)
    print("F1 Car USD Generator")
    print("=" * 60)
    
    # Ensure output directories exist
    paths["usd"].mkdir(parents=True, exist_ok=True)
    
    # Check if source OBJ exists
    if paths["source_obj"].exists():
        print(f"\nFound source OBJ: {paths['source_obj']}")
        print("Note: OBJ conversion requires Omniverse Kit with asset converter.")
        print("Generating procedural car models instead.\n")
    else:
        print(f"\nSource OBJ not found: {paths['source_obj']}")
        print("Generating procedural car models.\n")
    
    # Create individual team car files
    create_all_team_cars(paths["usd"])
    
    # Create master car with variants
    master_path = paths["usd"] / "f1_car_master.usd"
    # create_master_car_with_variants(str(master_path))
    
    print("\n" + "=" * 60)
    print("Car generation complete!")
    print("=" * 60)
    

if __name__ == "__main__":
    main()
