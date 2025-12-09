"""
Car Module
==========

F1 car physics, state management, and USD representation.
"""

import math
from typing import Optional, Tuple, Dict, Any
from dataclasses import dataclass, field
from enum import Enum, auto

try:
    import omni.usd
    from pxr import Usd, UsdGeom, Gf, Sdf
    HAS_USD = True
except ImportError:
    HAS_USD = False


class CarState(Enum):
    """Current state of the car."""
    GRID = auto()          # On starting grid
    RACING = auto()        # Normal racing
    PIT_ENTRY = auto()     # Entering pit lane
    IN_PIT = auto()        # In pit box (stopped)
    PIT_EXIT = auto()      # Exiting pit lane
    DNF = auto()           # Did not finish
    FINISHED = auto()      # Crossed finish line


@dataclass
class Team:
    """Team configuration."""
    name: str
    driver: str
    number: int
    color: Tuple[int, int, int]  # RGB
    
    @property
    def color_normalized(self) -> Tuple[float, float, float]:
        """Get color as 0-1 floats."""
        return (self.color[0] / 255, self.color[1] / 255, self.color[2] / 255)


# Default teams for Pobstone GP
DEFAULT_TEAMS = [
    Team("Ferrari", "Karina", 16, (220, 0, 0)),
    Team("Red Bull", "Lewis", 1, (30, 65, 255)),
    Team("Mercedes", "Rolf", 44, (0, 210, 190)),
    Team("McLaren", "Richa", 4, (255, 135, 0)),
    Team("Aston Martin", "Dennis", 14, (0, 111, 98)),
    Team("Alpine", "Sujith", 10, (255, 130, 180)),
]


@dataclass
class CarTelemetry:
    """Real-time car telemetry data."""
    speed: float = 0.0              # km/h
    rpm: int = 0                    # Engine RPM
    gear: int = 1                   # Current gear (1-8)
    throttle: float = 0.0           # 0-1
    brake: float = 0.0              # 0-1
    drs: bool = False               # DRS active
    ers_deployment: float = 0.0     # ERS power deployment
    tire_wear: float = 100.0        # Tire condition %
    fuel_remaining: float = 100.0   # Fuel remaining %
    engine_temp: float = 90.0       # Engine temperature °C
    brake_temp: float = 400.0       # Brake temperature °C
    g_force_lat: float = 0.0        # Lateral G-force
    g_force_long: float = 0.0       # Longitudinal G-force


@dataclass
class LapTiming:
    """Lap timing information."""
    current_lap: int = 0
    lap_time: float = 0.0           # Current lap time
    last_lap_time: float = 0.0      # Previous lap time
    best_lap_time: float = float('inf')
    sector_1_time: float = 0.0
    sector_2_time: float = 0.0
    sector_3_time: float = 0.0
    gap_to_leader: float = 0.0
    gap_to_ahead: float = 0.0
    

class Car:
    """
    F1 Car simulation.
    
    Handles:
    - Position and movement on track
    - Physics simulation (simplified)
    - State management
    - USD representation
    """
    
    # Physics constants
    MAX_SPEED = 350.0           # km/h
    MIN_SPEED = 80.0            # km/h in corners
    ACCELERATION = 0.015        # Track position per second at max speed
    DECELERATION = 0.025        # Braking rate
    
    # Tire degradation
    TIRE_WEAR_RATE = 0.02       # % per lap base rate
    
    def __init__(self, team: Team, start_position: int):
        self.team = team
        self.start_position = start_position
        self.position = start_position  # Current race position
        
        # Track position (0-1)
        self._track_t: float = 0.0
        
        # State
        self.state = CarState.GRID
        
        # Telemetry
        self.telemetry = CarTelemetry()
        self.timing = LapTiming()
        
        # Pit strategy
        self.pit_stops_made = 0
        self.pit_stop_timer = 0.0
        self.target_pit_lap: Optional[int] = None
        
        # Physics state
        self._current_speed = 0.0
        self._target_speed = 0.0
        self._base_performance = 1.0 + (6 - start_position) * 0.01  # Slight variation by position
        
        # USD prim path (set when created in scene)
        self.prim_path: Optional[str] = None
        
        # Damage state
        self.damage = 0.0  # 0-100%
        
    @property
    def track_t(self) -> float:
        """Current position on track (0-1)."""
        return self._track_t
    
    @track_t.setter
    def track_t(self, value: float):
        """Set track position, wrapping at 1.0."""
        old_t = self._track_t
        self._track_t = value % 1.0
        
        # Check for lap completion
        if old_t > 0.95 and self._track_t < 0.05:
            self._on_lap_complete()
            
    def _on_lap_complete(self):
        """Called when car crosses the start/finish line."""
        self.timing.current_lap += 1
        self.timing.last_lap_time = self.timing.lap_time
        
        if self.timing.lap_time < self.timing.best_lap_time and self.timing.lap_time > 0:
            self.timing.best_lap_time = self.timing.lap_time
            
        self.timing.lap_time = 0.0
        
        # Apply tire wear
        wear_factor = 1.0 + (self.damage * 0.01)  # Damage increases wear
        self.telemetry.tire_wear -= self.TIRE_WEAR_RATE * wear_factor * 100
        self.telemetry.tire_wear = max(0, self.telemetry.tire_wear)
        
        # Consume fuel
        self.telemetry.fuel_remaining -= 2.0  # 2% per lap
        self.telemetry.fuel_remaining = max(0, self.telemetry.fuel_remaining)
        
    def update(self, dt: float, track, speed_multiplier: float = 1.0):
        """
        Update car state for one frame.
        
        Args:
            dt: Delta time in seconds
            track: Track instance for position queries
            speed_multiplier: Simulation speed multiplier
        """
        if self.state == CarState.DNF or self.state == CarState.FINISHED:
            return
            
        if self.state == CarState.GRID:
            return
            
        if self.state == CarState.IN_PIT:
            self._update_pit_stop(dt, speed_multiplier)
            return
            
        # Calculate target speed based on track position
        self._update_target_speed(track)
        
        # Update current speed
        self._update_speed(dt)
        
        # Update telemetry
        self._update_telemetry(track)
        
        # Calculate movement
        speed_factor = self._current_speed / self.MAX_SPEED
        performance = self._base_performance * (self.telemetry.tire_wear / 100)
        
        # Damage affects performance
        performance *= (1.0 - self.damage * 0.005)
        
        # Move along track
        movement = self.ACCELERATION * speed_factor * performance * dt * speed_multiplier
        self.track_t += movement
        
        # Update lap time
        self.timing.lap_time += dt * speed_multiplier
        
        # Check for pit entry
        if self._should_pit(track):
            self._enter_pit()
            
    def _update_target_speed(self, track):
        """Calculate target speed based on track characteristics."""
        bank = abs(track.get_bank_at(self.track_t))
        
        # Corners slow the car down
        if bank > 8:
            self._target_speed = self.MIN_SPEED + 50
        elif bank > 5:
            self._target_speed = self.MIN_SPEED + 100
        elif bank > 2:
            self._target_speed = self.MAX_SPEED - 80
        else:
            self._target_speed = self.MAX_SPEED
            
        # DRS boost on straights
        if track.is_in_drs_zone(self.track_t) and self.telemetry.drs:
            self._target_speed = min(self._target_speed + 20, self.MAX_SPEED)
            
    def _update_speed(self, dt: float):
        """Update current speed towards target."""
        if self._current_speed < self._target_speed:
            # Accelerating
            self._current_speed = min(
                self._current_speed + 50 * dt,
                self._target_speed
            )
            self.telemetry.throttle = 1.0
            self.telemetry.brake = 0.0
        else:
            # Braking
            self._current_speed = max(
                self._current_speed - 100 * dt,
                self._target_speed
            )
            self.telemetry.throttle = 0.0
            self.telemetry.brake = min(1.0, (self._current_speed - self._target_speed) / 100)
            
    def _update_telemetry(self, track):
        """Update telemetry values."""
        self.telemetry.speed = self._current_speed
        self.telemetry.rpm = int(8000 + (self._current_speed / self.MAX_SPEED) * 7000)
        self.telemetry.gear = min(8, max(1, int(self._current_speed / 40)))
        
        # DRS logic
        in_drs_zone = track.is_in_drs_zone(self.track_t)
        self.telemetry.drs = in_drs_zone and self.timing.gap_to_ahead < 1.0
        
        # G-forces based on bank angle
        bank = track.get_bank_at(self.track_t)
        self.telemetry.g_force_lat = bank * 0.3
        self.telemetry.g_force_long = (self.telemetry.throttle - self.telemetry.brake) * 2
        
    def _should_pit(self, track) -> bool:
        """Check if car should enter pit lane."""
        if self.state == CarState.PIT_ENTRY:
            return False
            
        # Auto pit on target lap
        if self.target_pit_lap and self.timing.current_lap >= self.target_pit_lap:
            pit_entry = track.pit_lane.entry_t
            if abs(self.track_t - pit_entry) < 0.02:
                return True
                
        # Emergency pit if tires critical
        if self.telemetry.tire_wear < 20:
            pit_entry = track.pit_lane.entry_t
            if abs(self.track_t - pit_entry) < 0.02:
                return True
                
        return False
    
    def _enter_pit(self):
        """Enter pit lane."""
        self.state = CarState.PIT_ENTRY
        
    def start_pit_stop(self, duration: float):
        """Start the stationary pit stop."""
        self.state = CarState.IN_PIT
        self.pit_stop_timer = duration
        
    def _update_pit_stop(self, dt: float, speed_multiplier: float):
        """Update pit stop timer."""
        self.pit_stop_timer -= dt * speed_multiplier
        
        if self.pit_stop_timer <= 0:
            self._complete_pit_stop()
            
    def _complete_pit_stop(self):
        """Complete pit stop and rejoin track."""
        self.state = CarState.PIT_EXIT
        self.pit_stops_made += 1
        
        # Fresh tires
        self.telemetry.tire_wear = 100.0
        
        # Refuel (if regulations allow)
        self.telemetry.fuel_remaining = 100.0
        
        # Minor repairs
        self.damage = max(0, self.damage - 20)
        
        self.target_pit_lap = None
        
    def exit_pit(self):
        """Exit pit lane back to track."""
        self.state = CarState.RACING
        
    def start_race(self):
        """Called when race starts."""
        self.state = CarState.RACING
        self._current_speed = 0
        
    def apply_damage(self, amount: float):
        """Apply damage to the car."""
        self.damage = min(100, self.damage + amount)
        
        # Check for DNF
        if self.damage >= 100:
            self.state = CarState.DNF
            
    def get_world_position(self, track) -> Tuple[float, float, float]:
        """Get world position from track."""
        return track.get_point_at(self.track_t)
    
    def get_world_rotation(self, track) -> Tuple[float, float, float]:
        """Get rotation (euler angles) from track tangent."""
        tangent = track.get_tangent_at(self.track_t)
        
        # Calculate yaw from tangent
        yaw = math.atan2(-tangent[0], -tangent[2])
        
        # Pitch from vertical component
        pitch = math.asin(tangent[1]) if abs(tangent[1]) < 1 else 0
        
        # Roll from bank angle
        roll = math.radians(track.get_bank_at(self.track_t))
        
        return (math.degrees(pitch), math.degrees(yaw), math.degrees(roll))
    
    def to_dict(self) -> Dict[str, Any]:
        """Export car state to dictionary."""
        return {
            "team": self.team.name,
            "driver": self.team.driver,
            "number": self.team.number,
            "position": self.position,
            "track_t": self.track_t,
            "state": self.state.name,
            "lap": self.timing.current_lap,
            "telemetry": {
                "speed": self.telemetry.speed,
                "rpm": self.telemetry.rpm,
                "gear": self.telemetry.gear,
                "throttle": self.telemetry.throttle,
                "brake": self.telemetry.brake,
                "drs": self.telemetry.drs,
                "tire_wear": self.telemetry.tire_wear,
                "fuel": self.telemetry.fuel_remaining,
            },
            "timing": {
                "lap_time": self.timing.lap_time,
                "last_lap": self.timing.last_lap_time,
                "best_lap": self.timing.best_lap_time if self.timing.best_lap_time != float('inf') else None,
                "gap_to_leader": self.timing.gap_to_leader,
            },
            "damage": self.damage,
            "pit_stops": self.pit_stops_made,
        }
