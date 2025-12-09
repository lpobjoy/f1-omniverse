"""
Telemetry Module
================

Real-time telemetry data collection and distribution.
"""

from typing import Dict, Any, List, Callable, Optional
from dataclasses import dataclass, field
from collections import deque
import time
import json

try:
    import carb
    HAS_CARB = True
except ImportError:
    HAS_CARB = False


@dataclass
class TelemetrySnapshot:
    """A single telemetry data point."""
    timestamp: float
    data: Dict[str, Any]
    

class TelemetryChannel:
    """
    A telemetry channel for streaming data.
    
    Stores a rolling buffer of data points and notifies subscribers.
    """
    
    def __init__(self, name: str, buffer_size: int = 1000):
        self.name = name
        self.buffer_size = buffer_size
        self._buffer: deque = deque(maxlen=buffer_size)
        self._subscribers: List[Callable[[TelemetrySnapshot], None]] = []
        
    def push(self, data: Dict[str, Any]):
        """Push new data to the channel."""
        snapshot = TelemetrySnapshot(
            timestamp=time.time(),
            data=data
        )
        self._buffer.append(snapshot)
        
        # Notify subscribers
        for callback in self._subscribers:
            try:
                callback(snapshot)
            except Exception as e:
                if HAS_CARB:
                    carb.log_warn(f"Telemetry subscriber error: {e}")
                    
    def subscribe(self, callback: Callable[[TelemetrySnapshot], None]):
        """Subscribe to channel updates."""
        if callback not in self._subscribers:
            self._subscribers.append(callback)
            
    def unsubscribe(self, callback: Callable[[TelemetrySnapshot], None]):
        """Unsubscribe from channel updates."""
        if callback in self._subscribers:
            self._subscribers.remove(callback)
            
    def get_latest(self) -> Optional[TelemetrySnapshot]:
        """Get the most recent data point."""
        return self._buffer[-1] if self._buffer else None
    
    def get_history(self, count: int = 100) -> List[TelemetrySnapshot]:
        """Get recent data points."""
        return list(self._buffer)[-count:]
    
    def clear(self):
        """Clear the buffer."""
        self._buffer.clear()
        
        
class TelemetryManager:
    """
    Telemetry Manager
    
    Central hub for all telemetry data:
    - Car telemetry (speed, rpm, etc.)
    - Race data (positions, gaps, etc.)
    - Track conditions
    - Timing data
    """
    
    def __init__(self):
        # Car telemetry channels (one per car)
        self._car_channels: Dict[int, TelemetryChannel] = {}
        
        # Race-level telemetry
        self._race_channel = TelemetryChannel("race", buffer_size=500)
        
        # Timing channel
        self._timing_channel = TelemetryChannel("timing", buffer_size=1000)
        
        # Current state cache
        self._car_data: Dict[int, Dict[str, Any]] = {}
        self._race_data: Dict[str, Any] = {}
        
        # Data export buffer
        self._export_buffer: List[Dict[str, Any]] = []
        
    def get_or_create_car_channel(self, car_index: int) -> TelemetryChannel:
        """Get or create a telemetry channel for a car."""
        if car_index not in self._car_channels:
            self._car_channels[car_index] = TelemetryChannel(
                f"car_{car_index}",
                buffer_size=1000
            )
        return self._car_channels[car_index]
    
    def update_car_data(self, car_index: int, data: Dict[str, Any]):
        """Update telemetry data for a car."""
        self._car_data[car_index] = data
        
        channel = self.get_or_create_car_channel(car_index)
        channel.push(data)
        
    def update_race_data(self, data: Dict[str, Any]):
        """Update race-level telemetry."""
        self._race_data = data
        self._race_channel.push(data)
        
        # Add to export buffer
        export_entry = {
            "timestamp": time.time(),
            "race": data,
            "cars": dict(self._car_data)
        }
        self._export_buffer.append(export_entry)
        
        # Limit buffer size
        if len(self._export_buffer) > 10000:
            self._export_buffer = self._export_buffer[-5000:]
            
    def get_car_data(self, car_index: int) -> Dict[str, Any]:
        """Get current data for a car."""
        return self._car_data.get(car_index, {})
    
    def get_race_data(self) -> Dict[str, Any]:
        """Get current race data."""
        return self._race_data
    
    def get_all_car_data(self) -> Dict[int, Dict[str, Any]]:
        """Get data for all cars."""
        return dict(self._car_data)
    
    def subscribe_to_car(self, car_index: int, 
                         callback: Callable[[TelemetrySnapshot], None]):
        """Subscribe to a car's telemetry updates."""
        channel = self.get_or_create_car_channel(car_index)
        channel.subscribe(callback)
        
    def subscribe_to_race(self, callback: Callable[[TelemetrySnapshot], None]):
        """Subscribe to race telemetry updates."""
        self._race_channel.subscribe(callback)
        
    def unsubscribe_from_car(self, car_index: int,
                             callback: Callable[[TelemetrySnapshot], None]):
        """Unsubscribe from a car's telemetry."""
        if car_index in self._car_channels:
            self._car_channels[car_index].unsubscribe(callback)
            
    def unsubscribe_from_race(self, callback: Callable[[TelemetrySnapshot], None]):
        """Unsubscribe from race telemetry."""
        self._race_channel.unsubscribe(callback)
        
    def get_standings(self) -> List[Dict[str, Any]]:
        """Get current standings from telemetry data."""
        standings = list(self._car_data.values())
        standings.sort(key=lambda x: x.get("position", 999))
        return standings
    
    def export_to_json(self, filepath: str):
        """Export telemetry history to JSON file."""
        with open(filepath, 'w') as f:
            json.dump(self._export_buffer, f, indent=2, default=str)
            
    def export_lap_data(self, car_index: int) -> List[Dict[str, Any]]:
        """Export lap-by-lap data for a car."""
        channel = self._car_channels.get(car_index)
        if not channel:
            return []
            
        history = channel.get_history(1000)
        lap_data = []
        current_lap = -1
        
        for snapshot in history:
            lap = snapshot.data.get("lap", 0)
            if lap != current_lap:
                current_lap = lap
                lap_data.append({
                    "lap": lap,
                    "timestamp": snapshot.timestamp,
                    "data": snapshot.data
                })
                
        return lap_data
    
    def cleanup(self):
        """Clean up telemetry manager."""
        for channel in self._car_channels.values():
            channel.clear()
        self._race_channel.clear()
        self._timing_channel.clear()
        self._car_data.clear()
        self._race_data.clear()
        self._export_buffer.clear()
