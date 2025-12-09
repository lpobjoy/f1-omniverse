"""
F1 Telemetry Core Extension
===========================

Core simulation engine for F1 racing telemetry at Pobstone GP.
Handles physics, race logic, car management, and telemetry data.

Modules:
    - track: Track spline and geometry management
    - car: F1 car physics and state
    - race: Race control and simulation
    - telemetry: Real-time telemetry data collection
"""

from .extension import F1TelemetryCoreExtension, get_extension

__all__ = ["F1TelemetryCoreExtension", "get_extension"]
