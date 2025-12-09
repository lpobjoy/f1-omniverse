"""
F1 Telemetry UI Extension Entry Point
=====================================

Main extension class that creates and manages the UI windows.
"""

import omni.ext
import omni.ui as ui
import omni.kit.app
import carb
from typing import Optional

from .dashboard import TelemetryDashboard
from .standings import StandingsWindow
from .controls import RaceControlPanel


class F1TelemetryUIExtension(omni.ext.IExt):
    """
    F1 Telemetry UI Extension
    
    Creates the user interface components:
    - Telemetry dashboard with gauges and graphs
    - Race standings panel
    - Race control buttons
    """
    
    def __init__(self):
        super().__init__()
        self._dashboard: Optional[TelemetryDashboard] = None
        self._standings: Optional[StandingsWindow] = None
        self._controls: Optional[RaceControlPanel] = None
        self._menu = None
        
    def on_startup(self, ext_id: str):
        """Called when the extension is started."""
        carb.log_info("[f1_telemetry.ui] Extension starting up...")
        
        # Create menu items
        self._create_menu()
        
        # Create main windows
        self._dashboard = TelemetryDashboard()
        self._standings = StandingsWindow()
        self._controls = RaceControlPanel()
        
        carb.log_info("[f1_telemetry.ui] Extension started successfully!")
        
    def on_shutdown(self):
        """Called when the extension is shut down."""
        carb.log_info("[f1_telemetry.ui] Extension shutting down...")
        
        # Destroy windows
        if self._dashboard:
            self._dashboard.destroy()
            self._dashboard = None
            
        if self._standings:
            self._standings.destroy()
            self._standings = None
            
        if self._controls:
            self._controls.destroy()
            self._controls = None
            
        # Remove menu
        if self._menu:
            self._menu = None
            
        carb.log_info("[f1_telemetry.ui] Extension shut down.")
        
    def _create_menu(self):
        """Create menu items for the extension."""
        self._menu = ui.Menu("F1 Telemetry")
        with self._menu:
            ui.MenuItem("Show Dashboard", triggered_fn=self._show_dashboard)
            ui.MenuItem("Show Standings", triggered_fn=self._show_standings)
            ui.MenuItem("Show Race Control", triggered_fn=self._show_controls)
            ui.Separator()
            ui.MenuItem("Start Race", triggered_fn=self._start_race)
            ui.MenuItem("Stop Race", triggered_fn=self._stop_race)
            ui.MenuItem("Pause/Resume", triggered_fn=self._toggle_pause)
            
    def _show_dashboard(self):
        """Show the telemetry dashboard."""
        if self._dashboard:
            self._dashboard.show()
            
    def _show_standings(self):
        """Show the standings window."""
        if self._standings:
            self._standings.show()
            
    def _show_controls(self):
        """Show the race control panel."""
        if self._controls:
            self._controls.show()
            
    def _start_race(self):
        """Start the race via core extension."""
        try:
            from f1_telemetry.core import get_extension
            core = get_extension()
            if core:
                core.start_race()
        except ImportError:
            carb.log_warn("[f1_telemetry.ui] Could not find core extension")
            
    def _stop_race(self):
        """Stop the race via core extension."""
        try:
            from f1_telemetry.core import get_extension
            core = get_extension()
            if core:
                core.stop_race()
        except ImportError:
            carb.log_warn("[f1_telemetry.ui] Could not find core extension")
            
    def _toggle_pause(self):
        """Toggle race pause state."""
        try:
            from f1_telemetry.core import get_extension
            core = get_extension()
            if core and core.race_controller:
                if core.race_controller.is_paused:
                    core.resume_race()
                else:
                    core.pause_race()
        except ImportError:
            carb.log_warn("[f1_telemetry.ui] Could not find core extension")
