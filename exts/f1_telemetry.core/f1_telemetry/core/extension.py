"""
F1 Telemetry Core Extension Entry Point
=======================================

Main extension class that initializes and manages the F1 simulation.
"""

import omni.ext
import omni.kit.app
import omni.usd
import carb
from typing import Optional

from .track import Track
from .race import RaceController
from .telemetry import TelemetryManager


# Global extension instance for access from other modules
_extension_instance: Optional["F1TelemetryCoreExtension"] = None


def get_extension() -> Optional["F1TelemetryCoreExtension"]:
    """Get the current extension instance."""
    return _extension_instance


class F1TelemetryCoreExtension(omni.ext.IExt):
    """
    F1 Telemetry Core Extension
    
    Manages the core simulation components:
    - Track geometry and spline
    - Race controller and car physics
    - Real-time telemetry data
    """
    
    def __init__(self):
        super().__init__()
        self._track: Optional[Track] = None
        self._race_controller: Optional[RaceController] = None
        self._telemetry: Optional[TelemetryManager] = None
        self._update_sub = None
        self._stage_event_sub = None
        
    def on_startup(self, ext_id: str):
        """Called when the extension is started."""
        global _extension_instance
        _extension_instance = self
        
        carb.log_info("[f1_telemetry.core] Extension starting up...")
        
        # Load settings from kit file
        settings = carb.settings.get_settings()
        self._total_laps = settings.get("/f1/simulation/totalLaps") or 50
        self._track_scale = settings.get("/f1/simulation/trackScale") or 2.0
        self._elevation_offset = settings.get("/f1/simulation/elevationOffset") or 15.0
        
        # Initialize components
        self._initialize_components()
        
        # Subscribe to stage events
        usd_context = omni.usd.get_context()
        if usd_context:
            self._stage_event_sub = usd_context.get_stage_event_stream().create_subscription_to_pop(
                self._on_stage_event,
                name="F1TelemetryCore.StageEvents"
            )
        
        # Subscribe to update events for simulation loop
        self._update_sub = omni.kit.app.get_app().get_update_event_stream().create_subscription_to_pop(
            self._on_update,
            name="F1TelemetryCore.Update"
        )
        
        carb.log_info("[f1_telemetry.core] Extension started successfully!")
        
    def on_shutdown(self):
        """Called when the extension is shut down."""
        global _extension_instance
        
        carb.log_info("[f1_telemetry.core] Extension shutting down...")
        
        # Unsubscribe from events
        if self._update_sub:
            self._update_sub = None
        if self._stage_event_sub:
            self._stage_event_sub = None
            
        # Cleanup components
        if self._race_controller:
            self._race_controller.cleanup()
            self._race_controller = None
            
        if self._telemetry:
            self._telemetry.cleanup()
            self._telemetry = None
            
        if self._track:
            self._track = None
            
        _extension_instance = None
        
        carb.log_info("[f1_telemetry.core] Extension shut down.")
        
    def _initialize_components(self):
        """Initialize all simulation components."""
        # Create track with Pobstone GP (Silverstone) data
        self._track = Track(
            scale=self._track_scale,
            elevation_offset=self._elevation_offset
        )
        self._track.load_from_data()
        
        # Create telemetry manager
        self._telemetry = TelemetryManager()
        
        # Create race controller
        self._race_controller = RaceController(
            track=self._track,
            telemetry=self._telemetry,
            total_laps=self._total_laps
        )
        
    def _on_stage_event(self, event):
        """Handle USD stage events."""
        if event.type == int(omni.usd.StageEventType.OPENED):
            carb.log_info("[f1_telemetry.core] Stage opened, setting up scene...")
            self._setup_scene()
        elif event.type == int(omni.usd.StageEventType.CLOSING):
            carb.log_info("[f1_telemetry.core] Stage closing, cleaning up...")
            if self._race_controller:
                self._race_controller.stop_race()
                
    def _on_update(self, event):
        """Called every frame to update simulation."""
        if self._race_controller and self._race_controller.is_running:
            dt = event.payload["dt"]
            self._race_controller.update(dt)
            
    def _setup_scene(self):
        """Set up the USD scene with track and cars."""
        stage = omni.usd.get_context().get_stage()
        if not stage:
            carb.log_warn("[f1_telemetry.core] No stage available for scene setup")
            return
            
        # Build track geometry in USD
        if self._track:
            self._track.build_usd(stage)
            
        # Set up cars in the scene
        if self._race_controller:
            self._race_controller.setup_cars(stage)
            
    # === Public API ===
    
    @property
    def track(self) -> Optional[Track]:
        """Get the track instance."""
        return self._track
    
    @property
    def race_controller(self) -> Optional[RaceController]:
        """Get the race controller."""
        return self._race_controller
    
    @property
    def telemetry(self) -> Optional[TelemetryManager]:
        """Get the telemetry manager."""
        return self._telemetry
    
    def start_race(self):
        """Start the race simulation."""
        if self._race_controller:
            self._race_controller.start_race()
            
    def stop_race(self):
        """Stop the race simulation."""
        if self._race_controller:
            self._race_controller.stop_race()
            
    def pause_race(self):
        """Pause the race simulation."""
        if self._race_controller:
            self._race_controller.pause_race()
            
    def resume_race(self):
        """Resume the race simulation."""
        if self._race_controller:
            self._race_controller.resume_race()
            
    def set_simulation_speed(self, speed: float):
        """Set the simulation speed multiplier."""
        if self._race_controller:
            self._race_controller.set_speed(speed)
            
    def get_standings(self) -> list:
        """Get current race standings."""
        if self._race_controller:
            return self._race_controller.get_standings()
        return []
    
    def get_car_telemetry(self, car_index: int) -> dict:
        """Get telemetry for a specific car."""
        if self._telemetry:
            return self._telemetry.get_car_data(car_index)
        return {}
