"""
Standings Window
================

Race standings display panel showing positions, gaps, and timing.
"""

import omni.ui as ui
import omni.kit.app
from typing import Optional, List, Dict, Any


class StandingsRow:
    """A single row in the standings table."""
    
    TEAM_COLORS = {
        "Ferrari": (220, 0, 0),
        "Red Bull": (30, 65, 255),
        "Mercedes": (0, 210, 190),
        "McLaren": (255, 135, 0),
        "Aston Martin": (0, 111, 98),
        "Alpine": (255, 130, 180),
    }
    
    def __init__(self):
        self._position_label: Optional[ui.Label] = None
        self._color_bar: Optional[ui.Rectangle] = None
        self._driver_label: Optional[ui.Label] = None
        self._gap_label: Optional[ui.Label] = None
        self._lap_label: Optional[ui.Label] = None
        self._tire_indicator: Optional[ui.Rectangle] = None
        self._pit_label: Optional[ui.Label] = None
        
    def build(self, parent_stack):
        """Build the row UI."""
        with ui.HStack(height=30, spacing=5):
            # Position
            self._position_label = ui.Label(
                "1",
                width=30,
                style={"font_size": 18, "color": ui.color.white}
            )
            
            # Team color bar
            self._color_bar = ui.Rectangle(
                width=5, height=25,
                style={"background_color": ui.color(220, 0, 0)}
            )
            
            # Driver name
            self._driver_label = ui.Label(
                "Driver",
                width=100,
                style={"font_size": 14}
            )
            
            # Gap
            self._gap_label = ui.Label(
                "+0.000",
                width=80,
                style={"font_size": 12, "color": ui.color(180, 180, 180)}
            )
            
            # Current lap
            self._lap_label = ui.Label(
                "L1",
                width=40,
                style={"font_size": 12}
            )
            
            # Tire status
            self._tire_indicator = ui.Rectangle(
                width=15, height=15,
                style={"background_color": ui.color(0, 255, 0), "border_radius": 7}
            )
            
            # Pit stops
            self._pit_label = ui.Label(
                "0",
                width=20,
                style={"font_size": 12}
            )
            
    def update(self, data: Dict[str, Any]):
        """Update the row with new data."""
        if self._position_label:
            self._position_label.text = str(data.get("position", "?"))
            
        if self._color_bar:
            team = data.get("team", "")
            color = self.TEAM_COLORS.get(team, (100, 100, 100))
            self._color_bar.style = {"background_color": ui.color(*color)}
            
        if self._driver_label:
            self._driver_label.text = data.get("driver", "Unknown")
            
        if self._gap_label:
            gap = data.get("timing", {}).get("gap_to_leader", 0)
            if gap == 0:
                self._gap_label.text = "LEADER"
            elif gap == float('inf'):
                self._gap_label.text = "DNF"
            else:
                self._gap_label.text = f"+{gap:.3f}"
                
        if self._lap_label:
            lap = data.get("lap", 0)
            self._lap_label.text = f"L{lap}"
            
        if self._tire_indicator:
            tire_wear = data.get("telemetry", {}).get("tire_wear", 100)
            if tire_wear > 60:
                color = ui.color(0, 255, 0)  # Green
            elif tire_wear > 30:
                color = ui.color(255, 200, 0)  # Yellow
            else:
                color = ui.color(255, 0, 0)  # Red
            self._tire_indicator.style = {"background_color": color, "border_radius": 7}
            
        if self._pit_label:
            self._pit_label.text = str(data.get("pit_stops", 0))


class StandingsWindow:
    """
    Race standings window.
    
    Displays current race positions and gaps.
    """
    
    WINDOW_NAME = "Race Standings"
    
    def __init__(self):
        self._window: Optional[ui.Window] = None
        self._rows: List[StandingsRow] = []
        self._update_sub = None
        self._race_time_label: Optional[ui.Label] = None
        self._lap_label: Optional[ui.Label] = None
        
        self._build_window()
        
    def _build_window(self):
        """Build the standings window."""
        self._window = ui.Window(
            self.WINDOW_NAME,
            width=350,
            height=350,
            visible=True
        )
        
        with self._window.frame:
            with ui.VStack(spacing=5, style={"margin": 5}):
                # Header
                with ui.HStack(height=30):
                    ui.Label(
                        "STANDINGS",
                        style={"font_size": 16, "color": ui.color(220, 0, 0)}
                    )
                    ui.Spacer()
                    self._lap_label = ui.Label(
                        "Lap 0/50",
                        style={"font_size": 14}
                    )
                    
                with ui.HStack(height=20):
                    self._race_time_label = ui.Label(
                        "Race Time: 00:00:00",
                        style={"font_size": 12, "color": ui.color(150, 150, 150)}
                    )
                    
                ui.Separator(height=2)
                
                # Column headers
                with ui.HStack(height=20, spacing=5):
                    ui.Label("P", width=30, style={"font_size": 10})
                    ui.Spacer(width=5)
                    ui.Label("Driver", width=100, style={"font_size": 10})
                    ui.Label("Gap", width=80, style={"font_size": 10})
                    ui.Label("Lap", width=40, style={"font_size": 10})
                    ui.Label("T", width=15, style={"font_size": 10})
                    ui.Label("Pit", width=20, style={"font_size": 10})
                    
                ui.Separator(height=1)
                
                # Standings rows
                with ui.ScrollingFrame():
                    with ui.VStack(spacing=2):
                        for i in range(6):  # 6 cars
                            row = StandingsRow()
                            row.build(None)
                            self._rows.append(row)
                            
        # Subscribe to updates
        self._update_sub = omni.kit.app.get_app().get_update_event_stream().create_subscription_to_pop(
            self._on_update,
            name="StandingsWindow.Update"
        )
        
    def _on_update(self, event):
        """Update standings from telemetry."""
        try:
            from f1_telemetry.core import get_extension
            core = get_extension()
            if not core:
                return
                
            # Get race data
            if core.telemetry:
                race_data = core.telemetry.get_race_data()
                if self._lap_label:
                    current = race_data.get("lap", 0)
                    total = race_data.get("total_laps", 50)
                    self._lap_label.text = f"Lap {current}/{total}"
                    
                if self._race_time_label:
                    time_secs = race_data.get("race_time", 0)
                    hours = int(time_secs // 3600)
                    mins = int((time_secs % 3600) // 60)
                    secs = int(time_secs % 60)
                    self._race_time_label.text = f"Race Time: {hours:02d}:{mins:02d}:{secs:02d}"
                    
            # Get standings
            standings = core.get_standings()
            for i, row in enumerate(self._rows):
                if i < len(standings):
                    row.update(standings[i])
                    
        except ImportError:
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
        if self._update_sub:
            self._update_sub = None
        if self._window:
            self._window.destroy()
            self._window = None
