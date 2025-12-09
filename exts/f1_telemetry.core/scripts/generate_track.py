#!/usr/bin/env python3
"""
Track Generator Script
======================

Converts track JSON data to USD format for use in Omniverse.
Can be run standalone or imported as a module.

Usage:
    python generate_track.py [--input pobstone_gp.json] [--output track.usd]
"""

import argparse
import json
import math
from pathlib import Path
from typing import List, Tuple, Dict, Any

try:
    from pxr import Usd, UsdGeom, Gf, Sdf, UsdShade
    HAS_USD = True
except ImportError:
    HAS_USD = False
    print("Warning: USD (pxr) library not available. Run this in Omniverse Python environment.")


def catmull_rom_interpolate(p0: Tuple, p1: Tuple, p2: Tuple, p3: Tuple, t: float) -> Tuple:
    """Catmull-Rom spline interpolation between p1 and p2."""
    t2 = t * t
    t3 = t2 * t
    
    def interp(v0, v1, v2, v3):
        return 0.5 * ((2 * v1) +
                      (-v0 + v2) * t +
                      (2*v0 - 5*v1 + 4*v2 - v3) * t2 +
                      (-v0 + 3*v1 - 3*v2 + v3) * t3)
    
    return (
        interp(p0[0], p1[0], p2[0], p3[0]),
        interp(p0[1], p1[1], p2[1], p3[1]),
        interp(p0[2], p1[2], p2[2], p3[2])
    )


def interpolate_bank(bank0: float, bank1: float, t: float) -> float:
    """Linear interpolation for bank angle."""
    return bank0 + (bank1 - bank0) * t


class TrackGenerator:
    """Generates USD track geometry from JSON data."""
    
    def __init__(self, track_data: Dict[str, Any]):
        self.data = track_data
        self.scale = track_data.get("scale", 2.0)
        self.elevation_offset = track_data.get("elevation_offset", 15.0)
        self.track_width = track_data.get("track_width", 12.0)
        
        # Parse points
        self.points = []
        self.banks = []
        for p in track_data.get("points", []):
            self.points.append((
                p["x"] * self.scale,
                p["y"] * self.scale + self.elevation_offset,
                p["z"] * self.scale
            ))
            self.banks.append(p.get("bank", 0))
            
    def get_point_at(self, t: float) -> Tuple[float, float, float]:
        """Get position on track at normalized position t (0-1)."""
        t = t % 1.0
        n = len(self.points)
        
        segment = t * n
        i = int(segment)
        local_t = segment - i
        
        p0 = self.points[(i - 1) % n]
        p1 = self.points[i % n]
        p2 = self.points[(i + 1) % n]
        p3 = self.points[(i + 2) % n]
        
        return catmull_rom_interpolate(p0, p1, p2, p3, local_t)
    
    def get_tangent_at(self, t: float) -> Tuple[float, float, float]:
        """Get tangent direction at position t."""
        delta = 0.001
        p1 = self.get_point_at(t - delta)
        p2 = self.get_point_at(t + delta)
        
        dx = p2[0] - p1[0]
        dy = p2[1] - p1[1]
        dz = p2[2] - p1[2]
        
        length = math.sqrt(dx*dx + dy*dy + dz*dz)
        if length > 0:
            dx /= length
            dy /= length
            dz /= length
            
        return (dx, dy, dz)
    
    def get_bank_at(self, t: float) -> float:
        """Get bank angle at position t."""
        t = t % 1.0
        n = len(self.banks)
        segment = t * n
        i = int(segment)
        local_t = segment - i
        
        return interpolate_bank(self.banks[i % n], self.banks[(i + 1) % n], local_t)
    
    def generate_surface_mesh(self, samples: int = 500) -> Dict[str, List]:
        """Generate track surface mesh vertices and faces."""
        half_width = self.track_width / 2
        
        points = []
        normals = []
        uvs = []
        face_vertex_counts = []
        face_vertex_indices = []
        
        for i in range(samples):
            t = i / samples
            center = self.get_point_at(t)
            tangent = self.get_tangent_at(t)
            bank = math.radians(self.get_bank_at(t))
            
            # Calculate perpendicular (right) vector
            perp_x = -tangent[2]
            perp_z = tangent[0]
            length = math.sqrt(perp_x*perp_x + perp_z*perp_z)
            if length > 0:
                perp_x /= length
                perp_z /= length
                
            perp_y = math.sin(bank)
            
            # Left and right edge points
            left = (
                center[0] - perp_x * half_width,
                center[1] - perp_y * half_width,
                center[2] - perp_z * half_width
            )
            right = (
                center[0] + perp_x * half_width,
                center[1] + perp_y * half_width,
                center[2] + perp_z * half_width
            )
            
            points.extend([left, right])
            
            # Normals (up direction adjusted for bank)
            normal = (0, 1, 0)  # Simplified - should calculate proper normal
            normals.extend([normal, normal])
            
            # UVs
            u = t
            uvs.extend([(u, 0), (u, 1)])
            
            # Create quad faces (except for first point)
            if i > 0:
                idx = i * 2
                face_vertex_counts.append(4)
                face_vertex_indices.extend([idx - 2, idx, idx + 1, idx - 1])
                
        # Close the loop
        face_vertex_counts.append(4)
        face_vertex_indices.extend([
            samples * 2 - 2, 0, 1, samples * 2 - 1
        ])
        
        return {
            "points": points,
            "normals": normals,
            "uvs": uvs,
            "face_vertex_counts": face_vertex_counts,
            "face_vertex_indices": face_vertex_indices
        }
    
    def generate_curb_mesh(self, side: str = "left", samples: int = 500) -> Dict[str, List]:
        """Generate curb mesh for left or right side of track."""
        curb_width = 1.5
        curb_height = 0.1
        half_width = self.track_width / 2
        
        offset = -half_width - curb_width/2 if side == "left" else half_width + curb_width/2
        
        points = []
        face_vertex_counts = []
        face_vertex_indices = []
        
        for i in range(samples):
            t = i / samples
            center = self.get_point_at(t)
            tangent = self.get_tangent_at(t)
            
            perp_x = -tangent[2]
            perp_z = tangent[0]
            length = math.sqrt(perp_x*perp_x + perp_z*perp_z)
            if length > 0:
                perp_x /= length
                perp_z /= length
                
            # Curb position
            curb_center = (
                center[0] + perp_x * offset,
                center[1],
                center[2] + perp_z * offset
            )
            
            inner = (
                curb_center[0] - perp_x * curb_width/2,
                curb_center[1],
                curb_center[2] - perp_z * curb_width/2
            )
            outer = (
                curb_center[0] + perp_x * curb_width/2,
                curb_center[1] + curb_height,
                curb_center[2] + perp_z * curb_width/2
            )
            
            points.extend([inner, outer])
            
            if i > 0:
                idx = i * 2
                face_vertex_counts.append(4)
                face_vertex_indices.extend([idx - 2, idx, idx + 1, idx - 1])
                
        return {
            "points": points,
            "face_vertex_counts": face_vertex_counts,
            "face_vertex_indices": face_vertex_indices
        }
    
    def generate_usd(self, output_path: str):
        """Generate complete USD file with track geometry."""
        if not HAS_USD:
            print("Cannot generate USD without pxr library")
            return False
            
        # Create stage
        stage = Usd.Stage.CreateNew(output_path)
        stage.SetMetadata("metersPerUnit", 1.0)
        stage.SetMetadata("upAxis", "Y")
        
        # Create root
        world = UsdGeom.Xform.Define(stage, "/World")
        track_root = UsdGeom.Xform.Define(stage, "/World/PobstoneGP")
        
        # Generate track surface
        print("Generating track surface...")
        surface_data = self.generate_surface_mesh(500)
        surface = UsdGeom.Mesh.Define(stage, "/World/PobstoneGP/TrackSurface")
        
        surface.CreatePointsAttr([Gf.Vec3f(*p) for p in surface_data["points"]])
        surface.CreateFaceVertexCountsAttr(surface_data["face_vertex_counts"])
        surface.CreateFaceVertexIndicesAttr(surface_data["face_vertex_indices"])
        surface.CreateSubdivisionSchemeAttr("none")
        
        # Add display color (dark gray for asphalt)
        surface.CreateDisplayColorAttr([(0.15, 0.15, 0.15)])
        
        # Generate left curb
        print("Generating left curb...")
        left_curb_data = self.generate_curb_mesh("left", 500)
        left_curb = UsdGeom.Mesh.Define(stage, "/World/PobstoneGP/LeftCurb")
        left_curb.CreatePointsAttr([Gf.Vec3f(*p) for p in left_curb_data["points"]])
        left_curb.CreateFaceVertexCountsAttr(left_curb_data["face_vertex_counts"])
        left_curb.CreateFaceVertexIndicesAttr(left_curb_data["face_vertex_indices"])
        left_curb.CreateDisplayColorAttr([(0.9, 0.1, 0.1)])  # Red/white would alternate
        
        # Generate right curb
        print("Generating right curb...")
        right_curb_data = self.generate_curb_mesh("right", 500)
        right_curb = UsdGeom.Mesh.Define(stage, "/World/PobstoneGP/RightCurb")
        right_curb.CreatePointsAttr([Gf.Vec3f(*p) for p in right_curb_data["points"]])
        right_curb.CreateFaceVertexCountsAttr(right_curb_data["face_vertex_counts"])
        right_curb.CreateFaceVertexIndicesAttr(right_curb_data["face_vertex_indices"])
        right_curb.CreateDisplayColorAttr([(0.9, 0.9, 0.9)])
        
        # Create markers for DRS zones
        print("Creating DRS zone markers...")
        drs_root = UsdGeom.Xform.Define(stage, "/World/PobstoneGP/DRSZones")
        for i, zone in enumerate(self.data.get("drs_zones", [])):
            start_pos = self.get_point_at(zone["start"])
            marker = UsdGeom.Cube.Define(stage, f"/World/PobstoneGP/DRSZones/Zone{i+1}Start")
            marker.CreateSizeAttr(3.0)
            marker.AddTranslateOp().Set(Gf.Vec3d(*start_pos))
            marker.CreateDisplayColorAttr([(0, 1, 0)])  # Green
            
        # Create pit lane markers
        print("Creating pit lane markers...")
        pit = self.data.get("pit_lane", {})
        entry_pos = self.get_point_at(pit.get("entry_t", 0.92))
        exit_pos = self.get_point_at(pit.get("exit_t", 0.06))
        
        pit_entry = UsdGeom.Cube.Define(stage, "/World/PobstoneGP/PitLane/Entry")
        pit_entry.CreateSizeAttr(2.0)
        pit_entry.AddTranslateOp().Set(Gf.Vec3d(*entry_pos))
        pit_entry.CreateDisplayColorAttr([(1, 0.5, 0)])
        
        pit_exit = UsdGeom.Cube.Define(stage, "/World/PobstoneGP/PitLane/Exit")
        pit_exit.CreateSizeAttr(2.0)
        pit_exit.AddTranslateOp().Set(Gf.Vec3d(*exit_pos))
        pit_exit.CreateDisplayColorAttr([(0.5, 1, 0)])
        
        # Create start/finish line
        print("Creating start/finish line...")
        sf_pos = self.get_point_at(0)
        sf_line = UsdGeom.Cube.Define(stage, "/World/PobstoneGP/StartFinish")
        sf_line.CreateSizeAttr(1.0)
        sf_line.AddScaleOp().Set(Gf.Vec3f(self.track_width, 0.1, 1.0))
        sf_line.AddTranslateOp().Set(Gf.Vec3d(*sf_pos))
        sf_line.CreateDisplayColorAttr([(1, 1, 1)])
        
        # Create ground plane
        print("Creating ground plane...")
        ground = UsdGeom.Mesh.Define(stage, "/World/Ground")
        ground_size = 2000
        ground.CreatePointsAttr([
            Gf.Vec3f(-ground_size, 0, -ground_size),
            Gf.Vec3f(ground_size, 0, -ground_size),
            Gf.Vec3f(ground_size, 0, ground_size),
            Gf.Vec3f(-ground_size, 0, ground_size),
        ])
        ground.CreateFaceVertexCountsAttr([4])
        ground.CreateFaceVertexIndicesAttr([0, 1, 2, 3])
        ground.CreateDisplayColorAttr([(0.2, 0.4, 0.15)])  # Grass green
        
        # Save stage
        stage.GetRootLayer().Save()
        print(f"Track USD saved to: {output_path}")
        return True


def main():
    parser = argparse.ArgumentParser(description="Generate USD track from JSON data")
    parser.add_argument(
        "--input", "-i",
        default="pobstone_gp.json",
        help="Input JSON file path"
    )
    parser.add_argument(
        "--output", "-o", 
        default="track.usd",
        help="Output USD file path"
    )
    args = parser.parse_args()
    
    # Find input file
    input_path = Path(args.input)
    if not input_path.exists():
        # Try relative to script location
        script_dir = Path(__file__).parent
        input_path = script_dir / "data" / args.input
        if not input_path.exists():
            print(f"Error: Could not find input file: {args.input}")
            return 1
            
    # Load JSON
    print(f"Loading track data from: {input_path}")
    with open(input_path, 'r') as f:
        track_data = json.load(f)
        
    # Determine output path
    output_path = Path(args.output)
    if not output_path.is_absolute():
        script_dir = Path(__file__).parent
        output_path = script_dir.parent / "assets" / "usd" / args.output
        
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Generate USD
    generator = TrackGenerator(track_data)
    success = generator.generate_usd(str(output_path))
    
    return 0 if success else 1


if __name__ == "__main__":
    exit(main())
