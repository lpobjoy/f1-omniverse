"""
Race Control Panel
==================

Controls for race simulation - start, stop, pause, speed adjustment.
"""

import omni.ui as ui
from typing import Optional


class RaceControlPanel:
    """
    Race control panel for managing the simulation.
    
    Provides buttons for:
    - Start/Stop race
    - Pause/Resume
    - Speed control
    - Camera selection
    """
    
    WINDOW_NAME = "Race Control"
    
    def __init__(self):
        self._window: Optional[ui.Window] = None
        self._speed_slider: Optional[ui.FloatSlider] = None
        self._status_label: Optional[ui.Label] = None
        self._start_btn: Optional[ui.Button] = None
        self._pause_btn: Optional[ui.Button] = None
        
        self._build_window()
        
    def _build_window(self):
        """Build the control panel window."""
        self._window = ui.Window(
            self.WINDOW_NAME,
            width=300,
            height=250,
            visible=True
        )
        
        with self._window.frame:
            with ui.VStack(spacing=10, style={"margin": 10}):
                # Header
                ui.Label(
                    "RACE CONTROL",
                    style={"font_size": 18, "color": ui.color(220, 0, 0)},
                    alignment=ui.Alignment.CENTER
                )
                
                # Status
                with ui.HStack():
                    ui.Label("Status:", width=60)
                    self._status_label = ui.Label(
                        "Ready",
                        style={"color": ui.color(0, 255, 0)}
                    )
                    
                ui.Separator(height=2)
                
                # Main controls
                ui.Label("Race Controls", style={"font_size": 14})
                with ui.HStack(spacing=10):
                    self._start_btn = ui.Button(
                        "START RACE",
                        height=40,
                        clicked_fn=self._on_start,
                        style={
                            "background_color": ui.color(0, 100, 0),
                            "font_size": 14
                        }
                    )
                    
                with ui.HStack(spacing=10):
                    self._pause_btn = ui.Button(
                        "PAUSE",
                        height=30,
                        clicked_fn=self._on_pause
                    )
                    ui.Button(
                        "STOP",
                        height=30,
                        clicked_fn=self._on_stop,
                        style={"background_color": ui.color(100, 0, 0)}
                    )
                    
                ui.Separator(height=2)
                
                # Speed control
                ui.Label("Simulation Speed", style={"font_size": 14})
                with ui.HStack():
                    ui.Button("0.25x", width=50, clicked_fn=lambda: self._set_speed(0.25))
                    ui.Button("0.5x", width=50, clicked_fn=lambda: self._set_speed(0.5))
                    ui.Button("1x", width=50, clicked_fn=lambda: self._set_speed(1.0))
                    ui.Button("2x", width=50, clicked_fn=lambda: self._set_speed(2.0))
                    ui.Button("5x", width=50, clicked_fn=lambda: self._set_speed(5.0))
                    
                with ui.HStack():
                    ui.Label("Speed:", width=50)
                    self._speed_slider = ui.FloatSlider(min=0.1, max=10.0)
                    self._speed_slider.model.set_value(0.25)
                    self._speed_slider.model.add_value_changed_fn(self._on_speed_changed)
                    
                ui.Separator(height=2)
                
                # Camera controls
                ui.Label("Camera", style={"font_size": 14})
                with ui.HStack(spacing=5):
                    ui.Button("Chase", clicked_fn=lambda: self._set_camera("chase"))
                    ui.Button("Onboard", clicked_fn=lambda: self._set_camera("onboard"))
                    ui.Button("TV", clicked_fn=lambda: self._set_camera("tv"))
                    ui.Button("Overhead", clicked_fn=lambda: self._set_camera("overhead"))
                    
    def _on_start(self):
        """Handle start button click."""
        try:
            from f1_telemetry.core import get_extension
            core = get_extension()
            if core:
                core.start_race()
                if self._status_label:
                    self._status_label.text = "Racing"
                    self._status_label.style = {"color": ui.color(0, 255, 0)}
                if self._start_btn:
                    self._start_btn.text = "RESTART"
        except ImportError:
            pass
            
    def _on_pause(self):
        """Handle pause button click."""
        try:
            from f1_telemetry.core import get_extension
            core = get_extension()
            if core and core.race_controller:
                if core.race_controller.is_paused:
                    core.resume_race()
                    if self._pause_btn:
                        self._pause_btn.text = "PAUSE"
                    if self._status_label:
                        self._status_label.text = "Racing"
                        self._status_label.style = {"color": ui.color(0, 255, 0)}
                else:
                    core.pause_race()
                    if self._pause_btn:
                        self._pause_btn.text = "RESUME"
                    if self._status_label:
                        self._status_label.text = "Paused"
                        self._status_label.style = {"color": ui.color(255, 200, 0)}
        except ImportError:
            pass
            
    def _on_stop(self):
        """Handle stop button click."""
        try:
            from f1_telemetry.core import get_extension
            core = get_extension()
            if core:
                core.stop_race()
                if self._status_label:
                    self._status_label.text = "Stopped"
                    self._status_label.style = {"color": ui.color(255, 0, 0)}
                if self._start_btn:
                    self._start_btn.text = "START RACE"
        except ImportError:
            pass
            
    def _set_speed(self, speed: float):
        """Set simulation speed."""
        if self._speed_slider:
            self._speed_slider.model.set_value(speed)
        self._apply_speed(speed)
        
    def _on_speed_changed(self, model):
        """Handle speed slider change."""
        self._apply_speed(model.as_float)
        
    def _apply_speed(self, speed: float):
        """Apply speed to simulation."""
        try:
            from f1_telemetry.core import get_extension
            core = get_extension()
            if core:
                core.set_simulation_speed(speed)
        except ImportError:
            pass
            
    def _set_camera(self, camera_type: str):
        """Set camera mode."""
        # Camera switching would be implemented here
        # This would interact with Omniverse viewport camera system
        pass
        
    def show(self):
        """Show the window."""
        if self._window:
            self._window.visible = True
            
    def hide(self):
        """Hide the window."""
        if self._window:
            self._window.visible = False
            
    def destroy(self):
        """Destroy the window."""
        if self._window:
            self._window.destroy()
            self._window = None
