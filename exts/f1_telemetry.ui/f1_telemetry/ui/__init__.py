"""
F1 Telemetry UI Extension
=========================

User interface for the F1 racing telemetry dashboard.
Displays real-time data, standings, and race information.

Modules:
    - dashboard: Main telemetry dashboard window
    - standings: Race standings panel
    - timing: Timing tower
    - controls: Race control buttons
"""

from .extension import F1TelemetryUIExtension

__all__ = ["F1TelemetryUIExtension"]
