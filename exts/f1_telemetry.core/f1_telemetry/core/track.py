"""
Track Module
============

Handles track geometry, spline interpolation, and USD generation for Pobstone GP.
"""

import math
import json
from typing import List, Tuple, Optional, Dict, Any
from dataclasses import dataclass, field
from pathlib import Path

try:
    import omni.usd
    from pxr import Usd, UsdGeom, Gf, Sdf
    HAS_USD = True
except ImportError:
    HAS_USD = False


@dataclass
class TrackPoint:
    """A single point on the track spline."""
    x: float
    y: float  # Elevation
    z: float
    bank: float = 0.0
    
    def to_tuple(self) -> Tuple[float, float, float]:
        return (self.x, self.y, self.z)


@dataclass
class DRSZone:
    """DRS activation zone on track."""
    start: float  # Track position (0-1)
    end: float
    
    def contains(self, t: float) -> bool:
        """Check if position t is within this DRS zone."""
        if self.start < self.end:
            return self.start <= t <= self.end
        # Handle wrap-around zones
        return t >= self.start or t <= self.end


@dataclass 
class PitLane:
    """Pit lane configuration."""
    entry_t: float = 0.92
    exit_t: float = 0.06
    pit_stop_duration: float = 3.5  # seconds
    
    
@dataclass
class TrackConfig:
    """Complete track configuration."""
    name: str = "Pobstone GP"
    location: str = "Silverstone, UK"
    latitude: float = 52.0786
    longitude: float = -0.9489
    total_length_km: float = 5.891
    
    
class Track:
    """
    Track geometry and spline management for Pobstone GP.
    
    Handles:
    - Loading track data from JSON
    - Catmull-Rom spline interpolation
    - Track width calculation
    - USD geometry generation
    """
    
    # Pobstone GP (Silverstone) track points - 57 control points
    DEFAULT_TRACK_POINTS = [
        # Start/Finish straight
        {"x": 0, "y": 0, "z": 0, "bank": 0},
        {"x": 50, "y": 1, "z": 5, "bank": 0},
        {"x": 100, "y": 2, "z": 3, "bank": 0},
        {"x": 150, "y": 2, "z": 0, "bank": 0},
        {"x": 200, "y": 3, "z": -5, "bank": 0},
        
        # Turn 1 (Copse)
        {"x": 250, "y": 4, "z": -15, "bank": 5},
        {"x": 280, "y": 5, "z": -40, "bank": 10},
        {"x": 290, "y": 5, "z": -70, "bank": 8},
        
        # Maggots/Becketts complex
        {"x": 280, "y": 4, "z": -100, "bank": -8},
        {"x": 250, "y": 3, "z": -125, "bank": 10},
        {"x": 220, "y": 3, "z": -145, "bank": -10},
        {"x": 195, "y": 4, "z": -170, "bank": 8},
        {"x": 180, "y": 5, "z": -195, "bank": -5},
        
        # Chapel
        {"x": 175, "y": 6, "z": -220, "bank": 3},
        {"x": 180, "y": 6, "z": -250, "bank": 0},
        
        # Hangar Straight
        {"x": 190, "y": 5, "z": -280, "bank": 0},
        {"x": 200, "y": 4, "z": -320, "bank": 0},
        {"x": 210, "y": 3, "z": -360, "bank": 0},
        {"x": 215, "y": 2, "z": -400, "bank": 0},
        
        # Stowe
        {"x": 215, "y": 2, "z": -430, "bank": 6},
        {"x": 200, "y": 2, "z": -455, "bank": 10},
        {"x": 170, "y": 3, "z": -470, "bank": 8},
        
        # Vale
        {"x": 140, "y": 4, "z": -475, "bank": 3},
        {"x": 110, "y": 5, "z": -470, "bank": -5},
        
        # Club
        {"x": 85, "y": 5, "z": -455, "bank": 8},
        {"x": 70, "y": 4, "z": -430, "bank": 10},
        {"x": 65, "y": 3, "z": -400, "bank": 5},
        
        # After Club chicane
        {"x": 55, "y": 2, "z": -370, "bank": -3},
        {"x": 40, "y": 2, "z": -340, "bank": 5},
        {"x": 20, "y": 3, "z": -310, "bank": 3},
        
        # Abbey
        {"x": -10, "y": 4, "z": -285, "bank": 8},
        {"x": -45, "y": 5, "z": -265, "bank": 10},
        {"x": -75, "y": 5, "z": -250, "bank": 6},
        
        # Farm
        {"x": -100, "y": 4, "z": -240, "bank": -5},
        {"x": -120, "y": 3, "z": -225, "bank": 8},
        {"x": -130, "y": 3, "z": -200, "bank": 5},
        
        # Village
        {"x": -135, "y": 4, "z": -170, "bank": 10},
        {"x": -130, "y": 5, "z": -140, "bank": 8},
        {"x": -115, "y": 5, "z": -115, "bank": 5},
        
        # The Loop
        {"x": -95, "y": 4, "z": -100, "bank": 12},
        {"x": -70, "y": 3, "z": -95, "bank": 10},
        {"x": -50, "y": 2, "z": -100, "bank": 8},
        
        # Aintree
        {"x": -35, "y": 2, "z": -110, "bank": 5},
        {"x": -25, "y": 2, "z": -120, "bank": -3},
        
        # Wellington Straight
        {"x": -20, "y": 2, "z": -135, "bank": 0},
        {"x": -25, "y": 2, "z": -155, "bank": 0},
        {"x": -35, "y": 2, "z": -175, "bank": 0},
        
        # Brooklands
        {"x": -50, "y": 3, "z": -190, "bank": 8},
        {"x": -75, "y": 4, "z": -195, "bank": 10},
        {"x": -100, "y": 4, "z": -185, "bank": 8},
        
        # Luffield
        {"x": -115, "y": 3, "z": -165, "bank": 10},
        {"x": -120, "y": 2, "z": -140, "bank": 12},
        {"x": -115, "y": 2, "z": -110, "bank": 10},
        
        # Woodcote approach
        {"x": -100, "y": 1, "z": -80, "bank": 5},
        {"x": -75, "y": 1, "z": -50, "bank": 3},
        {"x": -50, "y": 0, "z": -25, "bank": 0},
        {"x": -25, "y": 0, "z": -10, "bank": 0},
    ]
    
    DEFAULT_DRS_ZONES = [
        {"start": 0.40, "end": 0.48},  # Hangar Straight
        {"start": 0.62, "end": 0.72},  # Wellington Straight
    ]
    
    def __init__(self, scale: float = 2.0, elevation_offset: float = 15.0):
        self.scale = scale
        self.elevation_offset = elevation_offset
        self.config = TrackConfig()
        self.points: List[TrackPoint] = []
        self.drs_zones: List[DRSZone] = []
        self.pit_lane = PitLane()
        self.track_width = 12.0  # meters
        
        # Cached spline data
        self._spline_cache: Dict[int, Tuple[Gf.Vec3d, Gf.Vec3d, float]] = {} if HAS_USD else {}
        
    def load_from_data(self, data_path: Optional[str] = None):
        """Load track data from JSON file or use defaults."""
        if data_path and Path(data_path).exists():
            with open(data_path, 'r') as f:
                data = json.load(f)
                self._parse_track_data(data)
        else:
            self._load_defaults()
            
    def _load_defaults(self):
        """Load default Pobstone GP track data."""
        self.points = [
            TrackPoint(
                x=p["x"] * self.scale,
                y=p["y"] * self.scale + self.elevation_offset,
                z=p["z"] * self.scale,
                bank=p.get("bank", 0)
            )
            for p in self.DEFAULT_TRACK_POINTS
        ]
        
        self.drs_zones = [
            DRSZone(start=z["start"], end=z["end"])
            for z in self.DEFAULT_DRS_ZONES
        ]
        
    def _parse_track_data(self, data: dict):
        """Parse track data from a dictionary."""
        self.config.name = data.get("name", self.config.name)
        self.config.location = data.get("location", self.config.location)
        
        if "points" in data:
            self.points = [
                TrackPoint(
                    x=p["x"] * self.scale,
                    y=p["y"] * self.scale + self.elevation_offset,
                    z=p["z"] * self.scale,
                    bank=p.get("bank", 0)
                )
                for p in data["points"]
            ]
            
        if "drs_zones" in data:
            self.drs_zones = [
                DRSZone(start=z["start"], end=z["end"])
                for z in data["drs_zones"]
            ]
            
        if "pit_lane" in data:
            pit = data["pit_lane"]
            self.pit_lane = PitLane(
                entry_t=pit.get("entry_t", 0.92),
                exit_t=pit.get("exit_t", 0.06),
                pit_stop_duration=pit.get("duration", 3.5)
            )
            
    def get_point_at(self, t: float) -> Tuple[float, float, float]:
        """
        Get a point on the track at position t (0-1).
        Uses Catmull-Rom spline interpolation.
        """
        t = t % 1.0  # Wrap around
        n = len(self.points)
        
        # Find the four control points for interpolation
        segment = t * n
        i = int(segment)
        local_t = segment - i
        
        p0 = self.points[(i - 1) % n]
        p1 = self.points[i % n]
        p2 = self.points[(i + 1) % n]
        p3 = self.points[(i + 2) % n]
        
        # Catmull-Rom interpolation
        return self._catmull_rom(p0, p1, p2, p3, local_t)
    
    def _catmull_rom(self, p0: TrackPoint, p1: TrackPoint, p2: TrackPoint, 
                     p3: TrackPoint, t: float) -> Tuple[float, float, float]:
        """Catmull-Rom spline interpolation."""
        t2 = t * t
        t3 = t2 * t
        
        x = 0.5 * ((2 * p1.x) +
                   (-p0.x + p2.x) * t +
                   (2*p0.x - 5*p1.x + 4*p2.x - p3.x) * t2 +
                   (-p0.x + 3*p1.x - 3*p2.x + p3.x) * t3)
        
        y = 0.5 * ((2 * p1.y) +
                   (-p0.y + p2.y) * t +
                   (2*p0.y - 5*p1.y + 4*p2.y - p3.y) * t2 +
                   (-p0.y + 3*p1.y - 3*p2.y + p3.y) * t3)
        
        z = 0.5 * ((2 * p1.z) +
                   (-p0.z + p2.z) * t +
                   (2*p0.z - 5*p1.z + 4*p2.z - p3.z) * t2 +
                   (-p0.z + 3*p1.z - 3*p2.z + p3.z) * t3)
        
        return (x, y, z)
    
    def get_tangent_at(self, t: float) -> Tuple[float, float, float]:
        """Get the tangent vector at position t."""
        delta = 0.001
        p1 = self.get_point_at(t - delta)
        p2 = self.get_point_at(t + delta)
        
        dx = p2[0] - p1[0]
        dy = p2[1] - p1[1]
        dz = p2[2] - p1[2]
        
        # Normalize
        length = math.sqrt(dx*dx + dy*dy + dz*dz)
        if length > 0:
            dx /= length
            dy /= length
            dz /= length
            
        return (dx, dy, dz)
    
    def get_bank_at(self, t: float) -> float:
        """Get the bank angle at position t."""
        t = t % 1.0
        n = len(self.points)
        segment = t * n
        i = int(segment)
        local_t = segment - i
        
        bank1 = self.points[i % n].bank
        bank2 = self.points[(i + 1) % n].bank
        
        return bank1 + (bank2 - bank1) * local_t
    
    def is_in_drs_zone(self, t: float) -> bool:
        """Check if position t is in any DRS zone."""
        return any(zone.contains(t) for zone in self.drs_zones)
    
    def get_total_length(self) -> float:
        """Calculate approximate total track length."""
        total = 0.0
        samples = 1000
        
        prev_point = self.get_point_at(0)
        for i in range(1, samples + 1):
            t = i / samples
            point = self.get_point_at(t)
            dx = point[0] - prev_point[0]
            dy = point[1] - prev_point[1]
            dz = point[2] - prev_point[2]
            total += math.sqrt(dx*dx + dy*dy + dz*dz)
            prev_point = point
            
        return total
    
    def build_usd(self, stage) -> None:
        """Build track geometry in USD stage."""
        if not HAS_USD:
            return
            
        # Create track root prim
        track_path = "/World/Track"
        UsdGeom.Xform.Define(stage, track_path)
        
        # Build track surface mesh
        self._build_track_surface(stage, f"{track_path}/Surface")
        
        # Build curbs
        self._build_curbs(stage, f"{track_path}/Curbs")
        
        # Build barriers
        self._build_barriers(stage, f"{track_path}/Barriers")
        
        # Build grandstands
        self._build_grandstands(stage, f"{track_path}/Grandstands")
        
        # Build pit lane
        self._build_pit_lane(stage, f"{track_path}/PitLane")
        
    def _build_track_surface(self, stage, path: str):
        """Build the main track surface mesh."""
        if not HAS_USD:
            return
            
        # Generate track mesh vertices
        samples = 500
        half_width = self.track_width / 2
        
        points = []
        face_vertex_counts = []
        face_vertex_indices = []
        
        for i in range(samples):
            t = i / samples
            center = self.get_point_at(t)
            tangent = self.get_tangent_at(t)
            bank = math.radians(self.get_bank_at(t))
            
            # Calculate perpendicular vector (right side)
            perp_x = -tangent[2]
            perp_z = tangent[0]
            length = math.sqrt(perp_x*perp_x + perp_z*perp_z)
            if length > 0:
                perp_x /= length
                perp_z /= length
            
            # Apply bank angle
            perp_y = math.sin(bank)
            
            # Add left and right edge points
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
            
            points.extend([Gf.Vec3f(*left), Gf.Vec3f(*right)])
            
            # Create quad faces
            if i > 0:
                idx = i * 2
                face_vertex_counts.append(4)
                face_vertex_indices.extend([
                    idx - 2, idx - 1, idx + 1, idx
                ])
        
        # Close the loop
        face_vertex_counts.append(4)
        face_vertex_indices.extend([
            samples * 2 - 2, samples * 2 - 1, 1, 0
        ])
        
        # Create the mesh
        mesh = UsdGeom.Mesh.Define(stage, path)
        mesh.CreatePointsAttr(points)
        mesh.CreateFaceVertexCountsAttr(face_vertex_counts)
        mesh.CreateFaceVertexIndicesAttr(face_vertex_indices)
        mesh.CreateSubdivisionSchemeAttr("none")
        
    def _build_curbs(self, stage, path: str):
        """Build track curbs (kerbs)."""
        # Simplified curb generation - would be expanded for full implementation
        UsdGeom.Xform.Define(stage, path)
        
    def _build_barriers(self, stage, path: str):
        """Build track barriers."""
        UsdGeom.Xform.Define(stage, path)
        
    def _build_grandstands(self, stage, path: str):
        """Build grandstand structures."""
        UsdGeom.Xform.Define(stage, path)
        
    def _build_pit_lane(self, stage, path: str):
        """Build pit lane and pit boxes."""
        UsdGeom.Xform.Define(stage, path)
        
    def export_to_json(self, filepath: str):
        """Export track data to JSON file."""
        data = {
            "name": self.config.name,
            "location": self.config.location,
            "latitude": self.config.latitude,
            "longitude": self.config.longitude,
            "scale": self.scale,
            "elevation_offset": self.elevation_offset,
            "track_width": self.track_width,
            "points": [
                {"x": p.x / self.scale, "y": (p.y - self.elevation_offset) / self.scale, 
                 "z": p.z / self.scale, "bank": p.bank}
                for p in self.points
            ],
            "drs_zones": [
                {"start": z.start, "end": z.end}
                for z in self.drs_zones
            ],
            "pit_lane": {
                "entry_t": self.pit_lane.entry_t,
                "exit_t": self.pit_lane.exit_t,
                "duration": self.pit_lane.pit_stop_duration
            }
        }
        
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
