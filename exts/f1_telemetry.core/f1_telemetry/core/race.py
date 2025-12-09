"""
Race Controller Module
======================

Manages the overall race simulation, including all cars, standings, and race control.
"""

import random
from typing import List, Optional, Dict, Any
from dataclasses import dataclass

try:
    import omni.usd
    from pxr import Usd, UsdGeom, Gf
    import carb
    HAS_OMNI = True
except ImportError:
    HAS_OMNI = False

from .car import Car, Team, DEFAULT_TEAMS, CarState
from .track import Track
from .telemetry import TelemetryManager


@dataclass
class RaceConfig:
    """Race configuration."""
    total_laps: int = 50
    formation_lap: bool = True
    safety_car_enabled: bool = True
    weather_changes: bool = False
    

class RaceController:
    """
    Race Controller
    
    Manages:
    - All cars in the race
    - Race state and timing
    - Safety car logic
    - Position calculations
    """
    
    def __init__(self, track: Track, telemetry: TelemetryManager, 
                 total_laps: int = 50, teams: Optional[List[Team]] = None):
        self.track = track
        self.telemetry = telemetry
        self.config = RaceConfig(total_laps=total_laps)
        
        # Use default teams if none provided
        self.teams = teams or DEFAULT_TEAMS
        
        # Create cars
        self.cars: List[Car] = []
        for i, team in enumerate(self.teams):
            car = Car(team, start_position=i + 1)
            # Set pit strategy (pit around lap 20-30)
            car.target_pit_lap = random.randint(20, 30)
            self.cars.append(car)
            
        # Race state
        self.is_running = False
        self.is_paused = False
        self.race_time = 0.0
        self.current_lap = 0
        self.speed_multiplier = 0.25  # Default 0.25x speed
        
        # Safety car
        self.safety_car_active = False
        self.safety_car_lap = 0
        
        # Race finished
        self.race_finished = False
        self.winner: Optional[Car] = None
        
    def setup_cars(self, stage) -> None:
        """Set up car prims in the USD stage."""
        if not HAS_OMNI:
            return
            
        cars_root = "/World/Cars"
        UsdGeom.Xform.Define(stage, cars_root)
        
        for i, car in enumerate(self.cars):
            car_path = f"{cars_root}/Car_{car.team.driver}"
            car.prim_path = car_path
            
            # Create car transform
            xform = UsdGeom.Xform.Define(stage, car_path)
            
            # Set initial position on grid
            grid_t = 0.98 - (i * 0.015)  # Staggered grid positions
            pos = self.track.get_point_at(grid_t)
            
            # Set transform
            xform.AddTranslateOp().Set(Gf.Vec3d(*pos))
            
            # Store initial track position
            car._track_t = grid_t
            
        if HAS_OMNI:
            carb.log_info(f"[f1_telemetry.core] Created {len(self.cars)} cars on grid")
            
    def start_race(self):
        """Start the race."""
        if HAS_OMNI:
            carb.log_info("[f1_telemetry.core] Race starting!")
            
        self.is_running = True
        self.is_paused = False
        self.race_time = 0.0
        
        # Start all cars
        for car in self.cars:
            car.start_race()
            
    def stop_race(self):
        """Stop the race."""
        self.is_running = False
        if HAS_OMNI:
            carb.log_info("[f1_telemetry.core] Race stopped")
            
    def pause_race(self):
        """Pause the race."""
        self.is_paused = True
        if HAS_OMNI:
            carb.log_info("[f1_telemetry.core] Race paused")
            
    def resume_race(self):
        """Resume the race."""
        self.is_paused = False
        if HAS_OMNI:
            carb.log_info("[f1_telemetry.core] Race resumed")
            
    def set_speed(self, speed: float):
        """Set simulation speed multiplier."""
        self.speed_multiplier = max(0.1, min(10.0, speed))
        
    def update(self, dt: float):
        """Update race simulation for one frame."""
        if not self.is_running or self.is_paused or self.race_finished:
            return
            
        # Update race time
        self.race_time += dt * self.speed_multiplier
        
        # Update all cars
        for car in self.cars:
            car.update(dt, self.track, self.speed_multiplier)
            
        # Update positions
        self._update_positions()
        
        # Check for collisions
        self._check_collisions()
        
        # Update telemetry
        self._update_telemetry()
        
        # Check for race finish
        self._check_race_finish()
        
        # Update USD transforms
        self._update_usd_transforms()
        
    def _update_positions(self):
        """Calculate current race positions."""
        # Sort by laps completed, then by track position
        sorted_cars = sorted(
            self.cars,
            key=lambda c: (
                -c.timing.current_lap,  # More laps = better
                -c.track_t if c.state == CarState.RACING else -1000,  # Further on track = better
                c.state != CarState.DNF  # DNF at back
            )
        )
        
        # Update positions
        for i, car in enumerate(sorted_cars):
            car.position = i + 1
            
        # Calculate gaps
        leader = sorted_cars[0]
        leader.timing.gap_to_leader = 0.0
        
        for i, car in enumerate(sorted_cars[1:], 1):
            if car.state == CarState.DNF:
                car.timing.gap_to_leader = float('inf')
                car.timing.gap_to_ahead = float('inf')
            else:
                # Estimate gap based on track position difference
                ahead = sorted_cars[i - 1]
                if car.timing.current_lap == ahead.timing.current_lap:
                    gap = (ahead.track_t - car.track_t)
                    if gap < 0:
                        gap += 1.0
                    car.timing.gap_to_ahead = gap * 90  # Rough conversion to seconds
                else:
                    car.timing.gap_to_ahead = (ahead.timing.current_lap - car.timing.current_lap) * 90
                    
                car.timing.gap_to_leader = car.timing.gap_to_ahead
                
        # Update current lap (leader's lap)
        self.current_lap = leader.timing.current_lap
        
    def _check_collisions(self):
        """Check for car-to-car collisions."""
        for i, car1 in enumerate(self.cars):
            if car1.state != CarState.RACING:
                continue
                
            for car2 in self.cars[i + 1:]:
                if car2.state != CarState.RACING:
                    continue
                    
                # Check if cars are close on track
                dist = abs(car1.track_t - car2.track_t)
                if dist > 0.5:
                    dist = 1.0 - dist  # Handle wrap-around
                    
                if dist < 0.003:  # Very close
                    # Apply minor damage to both
                    damage = random.uniform(1, 5)
                    car1.apply_damage(damage)
                    car2.apply_damage(damage)
                    
    def _update_telemetry(self):
        """Send telemetry data to the telemetry manager."""
        for i, car in enumerate(self.cars):
            self.telemetry.update_car_data(i, car.to_dict())
            
        # Update race data
        self.telemetry.update_race_data({
            "lap": self.current_lap,
            "total_laps": self.config.total_laps,
            "race_time": self.race_time,
            "safety_car": self.safety_car_active,
            "leader": self.cars[0].team.driver if self.cars else None,
            "standings": [car.team.driver for car in sorted(self.cars, key=lambda c: c.position)],
        })
        
    def _check_race_finish(self):
        """Check if race has finished."""
        for car in self.cars:
            if car.timing.current_lap >= self.config.total_laps and car.state == CarState.RACING:
                if not self.race_finished:
                    self.race_finished = True
                    self.winner = car
                    if HAS_OMNI:
                        carb.log_info(f"[f1_telemetry.core] {car.team.driver} wins!")
                car.state = CarState.FINISHED
                
    def _update_usd_transforms(self):
        """Update car transforms in USD."""
        if not HAS_OMNI:
            return
            
        stage = omni.usd.get_context().get_stage()
        if not stage:
            return
            
        for car in self.cars:
            if not car.prim_path:
                continue
                
            prim = stage.GetPrimAtPath(car.prim_path)
            if not prim:
                continue
                
            # Get world position and rotation
            pos = car.get_world_position(self.track)
            rot = car.get_world_rotation(self.track)
            
            # Update transform
            xformable = UsdGeom.Xformable(prim)
            xformable.ClearXformOpOrder()
            
            xformable.AddTranslateOp().Set(Gf.Vec3d(*pos))
            xformable.AddRotateXYZOp().Set(Gf.Vec3d(*rot))
            
    def get_standings(self) -> List[Dict[str, Any]]:
        """Get current race standings."""
        sorted_cars = sorted(self.cars, key=lambda c: c.position)
        return [car.to_dict() for car in sorted_cars]
    
    def get_car(self, index: int) -> Optional[Car]:
        """Get car by index."""
        if 0 <= index < len(self.cars):
            return self.cars[index]
        return None
    
    def get_car_by_driver(self, driver: str) -> Optional[Car]:
        """Get car by driver name."""
        for car in self.cars:
            if car.team.driver.lower() == driver.lower():
                return car
        return None
    
    def cleanup(self):
        """Clean up race controller resources."""
        self.is_running = False
        self.cars.clear()
