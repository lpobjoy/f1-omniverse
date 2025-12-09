# F1 Telemetry - Pobstone GP
## GitHub Copilot Instructions

This file provides context and guidelines for AI assistants working on this codebase.

---

## Project Overview

**F1 Telemetry - Pobstone GP** is a real-time F1 racing simulation built on NVIDIA Omniverse. It simulates 6 cars racing around "Pobstone GP" (based on Silverstone) with live telemetry, pit stops, and photorealistic rendering via RTX.

### Origin
This project was migrated from a Three.js prototype. The original implementation is in `/f1-telemetry/` for reference.

---

## Architecture

### Extensions
```
f1_telemetry.core  - Simulation engine (track, cars, race logic)
f1_telemetry.ui    - User interface (dashboard, standings, controls)
```

### Key Classes
- `Track` - Track geometry and spline interpolation
- `Car` - Vehicle state, physics, and telemetry
- `RaceController` - Race management and position tracking
- `TelemetryManager` - Real-time data collection and distribution
- `TelemetryDashboard` - Main UI window
- `StandingsWindow` - Race positions display
- `RaceControlPanel` - Start/stop/speed controls

---

## Coding Standards

### Python Style
- Use type hints for all function parameters and returns
- Use dataclasses for data structures
- Document all public methods with docstrings
- Follow PEP 8 naming conventions

### Omniverse Patterns
```python
# Extension startup pattern
class MyExtension(omni.ext.IExt):
    def on_startup(self, ext_id: str):
        carb.log_info(f"[my.extension] Starting up...")
        
    def on_shutdown(self):
        carb.log_info(f"[my.extension] Shutting down...")

# UI window pattern
self._window = ui.Window("Title", width=400, height=300)
with self._window.frame:
    with ui.VStack():
        ui.Label("Content")

# Update subscription pattern
self._sub = omni.kit.app.get_app().get_update_event_stream().create_subscription_to_pop(
    self._on_update,
    name="MyExtension.Update"
)
```

### USD Patterns
```python
# Create prim
xform = UsdGeom.Xform.Define(stage, "/World/MyObject")
xform.AddTranslateOp().Set(Gf.Vec3d(x, y, z))

# Update transform
xformable = UsdGeom.Xformable(prim)
xformable.ClearXformOpOrder()
xformable.AddTranslateOp().Set(position)
```

---

## Key Data

### Track Points
57 control points define the Pobstone GP circuit. Stored in `pobstone_gp.json`.

### Teams (6 total)
| Team | Driver | Number | Color (RGB) |
|------|--------|--------|-------------|
| Ferrari | Karina | 16 | (220, 0, 0) |
| Red Bull | Lewis | 1 | (30, 65, 255) |
| Mercedes | Rolf | 44 | (0, 210, 190) |
| McLaren | Richa | 4 | (255, 135, 0) |
| Aston Martin | Dennis | 14 | (0, 111, 98) |
| Alpine | Sujith | 10 | (255, 130, 180) |

### DRS Zones
1. Hangar Straight: t=0.40 to t=0.48
2. Wellington Straight: t=0.62 to t=0.72

### Pit Lane
- Entry: t=0.92
- Exit: t=0.06
- Stop duration: 3.5 seconds

### Race Settings
- Total laps: 50
- Default speed: 0.25x
- Grid positions: Staggered from t=0.98

---

## Common Tasks

### Adding a New Team
1. Add entry to `DEFAULT_TEAMS` in `car.py`
2. Add entry to `pobstone_gp.json` teams array
3. Add color to `StandingsRow.TEAM_COLORS` in `standings.py`
4. Create MDL material for livery

### Modifying Track
1. Edit `pobstone_gp.json` points array
2. Re-run `generate_track.py` to update USD
3. Test spline interpolation

### Adding UI Element
1. Create widget class in appropriate module
2. Add to parent window's `build` method
3. Subscribe to updates if needed
4. Clean up in `destroy` method

---

## Import Handling

Omniverse modules (`omni.*`, `carb`, `pxr`) are only available in the Omniverse runtime. Use conditional imports:

```python
try:
    import omni.usd
    from pxr import Usd, UsdGeom, Gf
    HAS_USD = True
except ImportError:
    HAS_USD = False

# Later in code
if HAS_USD:
    # USD-specific code
```

---

## Testing

### Unit Tests
Place in `exts/*/tests/` directories. Run via Kit test runner.

### Manual Testing
1. Launch Omniverse Code
2. Enable extensions in Extension Manager
3. Open scene with track USD
4. Click "Start Race" in Race Control panel

---

## File Locations

| File | Purpose |
|------|---------|
| `f1_telemetry.kit` | Application manifest |
| `exts/f1_telemetry.core/config/extension.toml` | Core extension config |
| `exts/f1_telemetry.core/data/pobstone_gp.json` | Track data |
| `exts/f1_telemetry.core/scripts/generate_track.py` | USD generator |
| `exts/f1_telemetry.core/f1_telemetry/core/` | Core Python modules |
| `exts/f1_telemetry.ui/f1_telemetry/ui/` | UI Python modules |
| `assets/usd/` | Generated USD files |
| `docs/` | Documentation |

---

## Performance Considerations

1. **USD Updates**: Batch transform updates, minimize prim traversal
2. **UI Updates**: Use subscription model, avoid polling
3. **Telemetry**: Use channels with buffer limits
4. **Materials**: Use MDL instancing, avoid unique materials per object

---

## Debugging

### Logging
```python
import carb
carb.log_info("Info message")
carb.log_warn("Warning message")
carb.log_error("Error message")
```

### Console
View logs in Omniverse Console window (Window > Console)

---

## References

- [Omniverse Kit SDK Docs](https://docs.omniverse.nvidia.com/kit/docs/kit-manual)
- [omni.ui Documentation](https://docs.omniverse.nvidia.com/kit/docs/omni.ui)
- [USD API Reference](https://openusd.org/docs/api)
- Original Three.js Implementation: `../../f1-telemetry/`

---

## Do's and Don'ts

### Do
- ✅ Use type hints
- ✅ Handle missing USD gracefully
- ✅ Clean up subscriptions in shutdown
- ✅ Log important state changes
- ✅ Keep UI responsive

### Don't
- ❌ Block the main thread
- ❌ Create USD prims every frame
- ❌ Ignore cleanup in on_shutdown
- ❌ Hardcode file paths
- ❌ Mix UI and simulation logic
