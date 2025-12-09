#!/usr/bin/env python3
"""
F1 Telemetry Asset Generator - Master Script
=============================================

This script generates all USD assets for the F1 Telemetry project.
Run in Omniverse Python environment.

Usage:
    # From Omniverse Script Editor:
    exec(open("/path/to/generate_all_assets.py").read())
    
    # Or from command line with Omniverse Python:
    /path/to/omniverse/python generate_all_assets.py
"""

import os
import sys
from pathlib import Path
from datetime import datetime

# Add script directory to path for imports
SCRIPT_DIR = Path(__file__).parent
sys.path.insert(0, str(SCRIPT_DIR))

# Import generators
try:
    from generate_track import TrackGenerator
    from convert_car_to_usd import create_all_team_cars
    HAVE_GENERATORS = True
except ImportError as e:
    HAVE_GENERATORS = False
    print(f"Warning: Could not import generators: {e}")

# Check for USD
try:
    from pxr import Usd, UsdGeom, Gf, Sdf
    HAS_USD = True
except ImportError:
    HAS_USD = False


def get_project_paths():
    """Get all project paths."""
    # Navigate from scripts/ to project root
    project_root = SCRIPT_DIR.parent.parent.parent  # f1-omniverse
    
    return {
        "root": project_root,
        "exts": project_root / "exts",
        "assets": project_root / "assets",
        "usd": project_root / "assets" / "usd",
        "materials": project_root / "assets" / "materials",
        "textures": project_root / "assets" / "textures",
        "data": SCRIPT_DIR.parent / "data",
    }


def print_header(title: str):
    """Print a section header."""
    print("\n" + "=" * 60)
    print(f" {title}")
    print("=" * 60 + "\n")


def check_environment():
    """Check if running in proper environment."""
    print_header("Environment Check")
    
    checks = {
        "USD (pxr) library": HAS_USD,
        "Generator modules": HAVE_GENERATORS,
    }
    
    all_ok = True
    for name, status in checks.items():
        symbol = "✓" if status else "✗"
        print(f"  {symbol} {name}")
        if not status:
            all_ok = False
            
    # Check for Omniverse
    try:
        import omni
        print("  ✓ Omniverse runtime")
    except ImportError:
        print("  ✗ Omniverse runtime (optional for asset generation)")
        
    return all_ok


def generate_track_usd(paths: dict) -> bool:
    """Generate the track USD file."""
    print_header("Generating Track USD")
    
    if not HAVE_GENERATORS:
        print("  ✗ Cannot generate track - generators not available")
        return False
        
    import json
    
    # Load track data
    track_data_path = paths["data"] / "pobstone_gp.json"
    if not track_data_path.exists():
        print(f"  ✗ Track data not found: {track_data_path}")
        return False
        
    print(f"  Loading track data from: {track_data_path}")
    with open(track_data_path, 'r') as f:
        track_data = json.load(f)
        
    # Create generator
    generator = TrackGenerator(track_data)
    
    # Output path
    output_path = paths["usd"] / "pobstone_gp_track.usd"
    paths["usd"].mkdir(parents=True, exist_ok=True)
    
    print(f"  Generating track to: {output_path}")
    
    try:
        success = generator.generate_usd(str(output_path))
        if success:
            print(f"  ✓ Track USD generated successfully")
            return True
        else:
            print(f"  ✗ Track generation failed")
            return False
    except Exception as e:
        print(f"  ✗ Error generating track: {e}")
        import traceback
        traceback.print_exc()
        return False


def generate_car_usds(paths: dict) -> bool:
    """Generate car USD files for all teams."""
    print_header("Generating Car USD Files")
    
    if not HAVE_GENERATORS:
        print("  ✗ Cannot generate cars - generators not available")
        return False
        
    paths["usd"].mkdir(parents=True, exist_ok=True)
    
    try:
        create_all_team_cars(paths["usd"])
        print("  ✓ Car USD files generated")
        return True
    except Exception as e:
        print(f"  ✗ Error generating cars: {e}")
        import traceback
        traceback.print_exc()
        return False


def create_master_scene(paths: dict) -> bool:
    """Create a master USD scene that references all assets."""
    print_header("Creating Master Scene")
    
    if not HAS_USD:
        print("  ✗ USD library not available")
        return False
        
    output_path = paths["usd"] / "pobstone_gp_scene.usd"
    
    try:
        stage = Usd.Stage.CreateNew(str(output_path))
        stage.SetMetadata("metersPerUnit", 1.0)
        stage.SetMetadata("upAxis", "Y")
        
        # Create world root
        world = UsdGeom.Xform.Define(stage, "/World")
        
        # Reference track
        track_path = paths["usd"] / "pobstone_gp_track.usd"
        if track_path.exists():
            track_ref = stage.DefinePrim("/World/Track")
            track_ref.GetReferences().AddReference(str(track_path))
            print(f"  ✓ Referenced track: {track_path.name}")
        else:
            print(f"  ! Track USD not found (will generate placeholder)")
            UsdGeom.Xform.Define(stage, "/World/Track")
            
        # Create cars group
        cars_xform = UsdGeom.Xform.Define(stage, "/World/Cars")
        
        # Reference each car
        team_files = [
            ("Ferrari", "f1_car_ferrari.usd"),
            ("RedBull", "f1_car_redbull.usd"),
            ("Mercedes", "f1_car_mercedes.usd"),
            ("McLaren", "f1_car_mclaren.usd"),
            ("AstonMartin", "f1_car_astonmartin.usd"),
            ("Alpine", "f1_car_alpine.usd"),
        ]
        
        grid_positions = [
            (0, 0.5, -5),    # P1 - Karina
            (3, 0.5, -15),   # P2 - Lewis
            (0, 0.5, -25),   # P3 - Rolf
            (3, 0.5, -35),   # P4 - Richa
            (0, 0.5, -45),   # P5 - Dennis
            (3, 0.5, -55),   # P6 - Sujith
        ]
        
        for i, (team_name, filename) in enumerate(team_files):
            car_path = paths["usd"] / filename
            car_prim_path = f"/World/Cars/{team_name}"
            
            if car_path.exists():
                car_xform = UsdGeom.Xform.Define(stage, car_prim_path)
                car_xform.GetPrim().GetReferences().AddReference(str(car_path))
                
                # Set grid position
                pos = grid_positions[i]
                car_xform.AddTranslateOp().Set(Gf.Vec3d(*pos))
                
                print(f"  ✓ Referenced car: {filename} at grid P{i+1}")
            else:
                print(f"  ! Car USD not found: {filename}")
                
        # Create camera
        camera = UsdGeom.Camera.Define(stage, "/World/MainCamera")
        camera.AddTranslateOp().Set(Gf.Vec3d(50, 30, 50))
        camera.AddRotateXYZOp().Set(Gf.Vec3d(-20, 45, 0))
        
        # Create dome light for environment
        try:
            from pxr import UsdLux
            dome_light = UsdLux.DomeLight.Define(stage, "/World/EnvironmentLight")
            dome_light.CreateIntensityAttr(1.0)
            print("  ✓ Created environment lighting")
        except ImportError:
            print("  ! UsdLux not available - skipping lighting")
            
        # Set default prim
        stage.SetDefaultPrim(world.GetPrim())
        
        # Save
        stage.GetRootLayer().Save()
        print(f"\n  ✓ Master scene saved: {output_path.name}")
        return True
        
    except Exception as e:
        print(f"  ✗ Error creating master scene: {e}")
        import traceback
        traceback.print_exc()
        return False


def list_materials(paths: dict):
    """List available MDL materials."""
    print_header("Available Materials")
    
    materials_dir = paths["materials"]
    if not materials_dir.exists():
        print("  No materials directory found")
        return
        
    mdl_files = list(materials_dir.glob("*.mdl"))
    if not mdl_files:
        print("  No MDL files found")
        return
        
    for mdl_file in sorted(mdl_files):
        print(f"  • {mdl_file.name}")
        
        # Try to list exports in the file
        try:
            with open(mdl_file, 'r') as f:
                content = f.read()
                # Find export material declarations
                import re
                exports = re.findall(r'export\s+material\s+(\w+)', content)
                for exp in exports:
                    print(f"      └─ {exp}")
        except:
            pass


def generate_summary_report(paths: dict, results: dict):
    """Generate a summary report of what was created."""
    print_header("Generation Summary")
    
    # Results
    for task, success in results.items():
        symbol = "✓" if success else "✗"
        print(f"  {symbol} {task}")
        
    # List generated files
    print("\nGenerated Files:")
    usd_files = list(paths["usd"].glob("*.usd")) if paths["usd"].exists() else []
    for f in sorted(usd_files):
        size_kb = f.stat().st_size / 1024
        print(f"  • {f.name} ({size_kb:.1f} KB)")
        
    # Instructions
    print("\n" + "-" * 60)
    print("Next Steps:")
    print("-" * 60)
    print("""
1. Open Omniverse Code or Create
2. Open: assets/usd/pobstone_gp_scene.usd
3. Enable f1_telemetry.core and f1_telemetry.ui extensions
4. Click 'Start Race' in Race Control panel

Note: Materials in assets/materials/ can be applied via
the Materials panel in Omniverse.
""")


def main():
    """Main entry point."""
    start_time = datetime.now()
    
    print("\n" + "=" * 60)
    print(" F1 TELEMETRY - ASSET GENERATION")
    print(" Pobstone GP - NVIDIA Omniverse")
    print("=" * 60)
    print(f"\nStarted: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Get paths
    paths = get_project_paths()
    print(f"\nProject Root: {paths['root']}")
    
    # Check environment
    env_ok = check_environment()
    
    if not env_ok:
        print("\n⚠ Warning: Not all dependencies available.")
        print("  Some features may be limited.\n")
        
    # Create output directories
    paths["usd"].mkdir(parents=True, exist_ok=True)
    paths["textures"].mkdir(parents=True, exist_ok=True)
    
    # Track results
    results = {}
    
    # Generate assets
    if HAS_USD:
        results["Track USD"] = generate_track_usd(paths)
        results["Car USD Files"] = generate_car_usds(paths)
        results["Master Scene"] = create_master_scene(paths)
    else:
        print("\n⚠ USD library not available - skipping USD generation")
        print("  Run this script in Omniverse Python environment.")
        results["USD Generation"] = False
        
    # List materials
    list_materials(paths)
    
    # Summary
    generate_summary_report(paths, results)
    
    # Timing
    elapsed = datetime.now() - start_time
    print(f"\nCompleted in {elapsed.total_seconds():.1f} seconds")
    print("=" * 60 + "\n")
    
    return all(results.values())


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
