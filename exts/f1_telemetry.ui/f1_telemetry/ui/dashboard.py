"""
Telemetry Dashboard
===================

Main telemetry dashboard window with gauges, graphs, and car data.
"""

import omni.ui as ui
import omni.kit.app
import carb
from typing import Optional, Dict, Any


class SpeedometerWidget:
    """Circular speedometer gauge widget."""
    
    def __init__(self, width: int = 200, height: int = 200):
        self.width = width
        self.height = height
        self._value = 0.0
        self._max_value = 350.0
        self._frame: Optional[ui.Frame] = None
        self._value_label: Optional[ui.Label] = None
        
    def build(self):
        """Build the speedometer widget."""
        with ui.ZStack(width=self.width, height=self.height):
            # Background circle
            ui.Circle(
                radius=self.width // 2 - 5,
                style={"background_color": ui.color(30, 30, 30)}
            )
            # Value arc would go here with custom drawing
            # Center label
            with ui.VStack():
                ui.Spacer()
                with ui.HStack():
                    ui.Spacer()
                    self._value_label = ui.Label(
                        "0",
                        style={"font_size": 36, "color": ui.color.white}
                    )
                    ui.Spacer()
                ui.Label(
                    "km/h",
                    alignment=ui.Alignment.CENTER,
                    style={"font_size": 14, "color": ui.color(150, 150, 150)}
                )
                ui.Spacer()
                
    def set_value(self, value: float):
        """Update the speedometer value."""
        self._value = min(value, self._max_value)
        if self._value_label:
            self._value_label.text = f"{int(self._value)}"


class TelemetryGaugePanel:
    """Panel containing all telemetry gauges."""
    
    def __init__(self):
        self._speedometer: Optional[SpeedometerWidget] = None
        self._rpm_bar: Optional[ui.ProgressBar] = None
        self._throttle_bar: Optional[ui.ProgressBar] = None
        self._brake_bar: Optional[ui.ProgressBar] = None
        self._drs_indicator: Optional[ui.Rectangle] = None
        self._gear_label: Optional[ui.Label] = None
        self._tire_bars: Dict[str, ui.ProgressBar] = {}
        
    def build(self):
        """Build the gauge panel."""
        with ui.VStack(spacing=10):
            # Speed and RPM section
            with ui.HStack(spacing=20):
                # Speedometer
                with ui.VStack(width=200):
                    ui.Label("SPEED", style={"font_size": 12})
                    self._speedometer = SpeedometerWidget()
                    self._speedometer.build()
                    
                # RPM and Gear
                with ui.VStack(width=150, spacing=5):
                    ui.Label("RPM", style={"font_size": 12})
                    self._rpm_bar = ui.ProgressBar(height=20)
                    self._rpm_bar.model.set_value(0.5)
                    
                    ui.Spacer(height=10)
                    ui.Label("GEAR", style={"font_size": 12})
                    self._gear_label = ui.Label(
                        "N",
                        style={"font_size": 48, "color": ui.color.white},
                        alignment=ui.Alignment.CENTER
                    )
                    
            ui.Separator(height=2)
            
            # Throttle and Brake
            with ui.HStack(spacing=20):
                with ui.VStack(width=200):
                    ui.Label("THROTTLE", style={"font_size": 12, "color": ui.color(0, 255, 0)})
                    self._throttle_bar = ui.ProgressBar(height=15)
                    self._throttle_bar.model.set_value(0)
                    
                with ui.VStack(width=200):
                    ui.Label("BRAKE", style={"font_size": 12, "color": ui.color(255, 0, 0)})
                    self._brake_bar = ui.ProgressBar(height=15)
                    self._brake_bar.model.set_value(0)
                    
            # DRS Indicator
            with ui.HStack():
                ui.Label("DRS:", style={"font_size": 14})
                self._drs_indicator = ui.Rectangle(
                    width=60, height=20,
                    style={"background_color": ui.color(50, 50, 50)}
                )
                ui.Label("OFF", name="drs_label", style={"font_size": 12})
                
            ui.Separator(height=2)
            
            # Tire wear
            ui.Label("TIRE WEAR", style={"font_size": 12})
            with ui.HStack(spacing=10):
                for tire in ["FL", "FR", "RL", "RR"]:
                    with ui.VStack(width=60):
                        ui.Label(tire, alignment=ui.Alignment.CENTER)
                        self._tire_bars[tire] = ui.ProgressBar(height=15)
                        self._tire_bars[tire].model.set_value(1.0)
                        
    def update(self, telemetry: Dict[str, Any]):
        """Update all gauges with new telemetry data."""
        if not telemetry:
            return
            
        # Speed
        if self._speedometer:
            self._speedometer.set_value(telemetry.get("speed", 0))
            
        # RPM (normalize to 0-1 for progress bar, assuming 15000 max)
        if self._rpm_bar:
            rpm_norm = telemetry.get("rpm", 0) / 15000
            self._rpm_bar.model.set_value(rpm_norm)
            
        # Gear
        if self._gear_label:
            gear = telemetry.get("gear", 0)
            self._gear_label.text = "N" if gear == 0 else str(gear)
            
        # Throttle/Brake
        if self._throttle_bar:
            self._throttle_bar.model.set_value(telemetry.get("throttle", 0))
        if self._brake_bar:
            self._brake_bar.model.set_value(telemetry.get("brake", 0))
            
        # DRS
        if self._drs_indicator:
            drs_active = telemetry.get("drs", False)
            color = ui.color(0, 255, 0) if drs_active else ui.color(50, 50, 50)
            self._drs_indicator.style = {"background_color": color}
            
        # Tire wear (all same value for now)
        tire_wear = telemetry.get("tire_wear", 100) / 100
        for bar in self._tire_bars.values():
            bar.model.set_value(tire_wear)


class TelemetryDashboard:
    """
    Main telemetry dashboard window.
    
    Displays real-time telemetry data for the selected car.
    """
    
    WINDOW_NAME = "F1 Telemetry Dashboard"
    
    def __init__(self):
        self._window: Optional[ui.Window] = None
        self._gauge_panel: Optional[TelemetryGaugePanel] = None
        self._selected_car: int = 0
        self._driver_label: Optional[ui.Label] = None
        self._team_label: Optional[ui.Label] = None
        self._lap_label: Optional[ui.Label] = None
        self._position_label: Optional[ui.Label] = None
        self._update_sub = None
        
        self._build_window()
        
    def _build_window(self):
        """Build the dashboard window."""
        self._window = ui.Window(
            self.WINDOW_NAME,
            width=500,
            height=600,
            visible=True
        )
        
        with self._window.frame:
            with ui.ScrollingFrame():
                with ui.VStack(spacing=10, style={"margin": 10}):
                    # Header
                    with ui.HStack(height=40):
                        ui.Label(
                            "POBSTONE GP",
                            style={"font_size": 24, "color": ui.color(220, 0, 0)}
                        )
                        ui.Spacer()
                        self._position_label = ui.Label(
                            "P1",
                            style={"font_size": 32, "color": ui.color.white}
                        )
                        
                    # Driver info
                    with ui.HStack():
                        self._driver_label = ui.Label(
                            "Karina",
                            style={"font_size": 20}
                        )
                        ui.Label(" - ", style={"font_size": 20})
                        self._team_label = ui.Label(
                            "Ferrari",
                            style={"font_size": 20, "color": ui.color(220, 0, 0)}
                        )
                        ui.Spacer()
                        self._lap_label = ui.Label(
                            "Lap 1/50",
                            style={"font_size": 16}
                        )
                        
                    ui.Separator(height=2)
                    
                    # Car selector
                    with ui.HStack(height=30):
                        ui.Label("Select Car:", width=80)
                        for i in range(6):
                            btn = ui.Button(
                                str(i + 1),
                                width=40,
                                clicked_fn=lambda idx=i: self._select_car(idx)
                            )
                            
                    ui.Separator(height=2)
                    
                    # Gauge panel
                    self._gauge_panel = TelemetryGaugePanel()
                    self._gauge_panel.build()
                    
        # Subscribe to updates
        self._update_sub = omni.kit.app.get_app().get_update_event_stream().create_subscription_to_pop(
            self._on_update,
            name="TelemetryDashboard.Update"
        )
        
    def _select_car(self, index: int):
        """Select a car to display."""
        self._selected_car = index
        
    def _on_update(self, event):
        """Update dashboard with latest telemetry."""
        try:
            from f1_telemetry.core import get_extension
            core = get_extension()
            if not core or not core.telemetry:
                return
                
            # Get car data
            car_data = core.get_car_telemetry(self._selected_car)
            if not car_data:
                return
                
            # Update header
            if self._driver_label:
                self._driver_label.text = car_data.get("driver", "Unknown")
            if self._team_label:
                self._team_label.text = car_data.get("team", "Unknown")
            if self._position_label:
                self._position_label.text = f"P{car_data.get('position', '?')}"
            if self._lap_label:
                race_data = core.telemetry.get_race_data()
                current = race_data.get("lap", 0)
                total = race_data.get("total_laps", 50)
                self._lap_label.text = f"Lap {current}/{total}"
                
            # Update gauges
            if self._gauge_panel and "telemetry" in car_data:
                self._gauge_panel.update(car_data["telemetry"])
                
        except ImportError:
            pass
            
    def show(self):
        """Show the dashboard window."""
        if self._window:
            self._window.visible = True
            
    def hide(self):
        """Hide the dashboard window."""
        if self._window:
            self._window.visible = False
            
    def destroy(self):
        """Destroy the dashboard."""
        if self._update_sub:
            self._update_sub = None
        if self._window:
            self._window.destroy()
            self._window = None
