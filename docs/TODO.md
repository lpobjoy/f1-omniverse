# F1 Telemetry - Pobstone GP
## TODO Checklist

### Legend
- ✅ Complete
- 🔄 In Progress
- ⏳ Not Started
- ❌ Blocked

---

## Phase 1: Foundation Setup

### Development Environment
- ⏳ Install NVIDIA Omniverse Launcher
- ⏳ Install Omniverse Kit SDK
- ⏳ Install Omniverse Code
- ⏳ Set up Python environment with USD
- ⏳ Configure VS Code extensions

### Project Structure
- ✅ Create project directory structure
- ✅ Create f1_telemetry.kit manifest
- ✅ Create f1_telemetry.core extension scaffold
- ✅ Create f1_telemetry.ui extension scaffold
- ✅ Export track data to JSON

### Build System
- ⏳ Test kit-app-template build
- ⏳ Link extensions to Kit
- ⏳ Create launch configuration
- ⏳ Set up hot-reload

---

## Phase 2: Asset Pipeline

### 3D Models
- ⏳ Convert F1 car OBJ → USD
- ⏳ Set up car USD hierarchy
- ⏳ Create 6 team livery variants
- ⏳ Test models in viewport

### Track Generation
- ✅ Create generate_track.py script
- ⏳ Run track generation (needs USD libs)
- ⏳ Add curb geometry
- ⏳ Add barriers
- ⏳ Add grandstands

### Materials
- ⏳ Create asphalt MDL
- ⏳ Create grass MDL
- ⏳ Create curb MDL
- ⏳ Create 6 car livery MDLs
- ⏳ Set up material instances

### Textures
- ⏳ Convert textures from f1-telemetry
- ⏳ Create PBR texture sets
- ⏳ Optimize for RTX

---

## Phase 3: Core Simulation

### Track System
- ✅ Catmull-Rom spline interpolation
- ✅ Track class with point queries
- ⏳ Sector timing zones
- ⏳ DRS zone detection
- ⏳ Pit lane logic

### Car Physics
- ✅ Car class with state
- ✅ Telemetry data structure
- ✅ Speed calculation
- ✅ Tire wear simulation
- ✅ Fuel consumption

### Race Controller
- ✅ RaceController class
- ✅ Position calculation
- ✅ Gap calculations
- ✅ Pit stop logic
- ⏳ Collision detection

### USD Integration
- ⏳ OmniGraph car movement node
- ⏳ Transform updates
- ⏳ 60 FPS optimization
- ⏳ Wheel animation

---

## Phase 4: UI Dashboard

### Main Dashboard
- ✅ TelemetryDashboard class
- ⏳ Speedometer gauge
- ⏳ RPM bar
- ⏳ Throttle/brake bars
- ⏳ Gear indicator
- ⏳ DRS indicator

### Standings Panel
- ✅ StandingsWindow class
- ⏳ Live position updates
- ⏳ Gap display
- ⏳ Status icons
- ⏳ Team colors

### Race Control
- ✅ RaceControlPanel class
- ⏳ Wire up buttons
- ⏳ Speed slider
- ⏳ Camera selection
- ⏳ Session info

### Timing Tower
- ⏳ TimingTower panel
- ⏳ Lap times with delta
- ⏳ Fastest lap highlight
- ⏳ Sector times
- ⏳ Sector indicators

---

## Phase 5: Camera System

### Cameras
- ⏳ Chase camera
- ⏳ Onboard camera
- ⏳ TV camera positions
- ⏳ Helicopter camera
- ⏳ Auto-switching logic

---

## Phase 6: Cesium Integration (Optional)

### Setup
- ⏳ Install Cesium extension
- ⏳ Configure Ion token
- ⏳ Set up CRS

### Integration
- ⏳ Load Silverstone terrain
- ⏳ Align track model
- ⏳ Add satellite imagery

---

## Phase 7: Polish

### Visual
- ⏳ HDRI lighting
- ⏳ RTX configuration
- ⏳ Motion blur
- ⏳ Tire smoke
- ⏳ Sparks effects

### Performance
- ⏳ Profile USD updates
- ⏳ Implement LOD
- ⏳ Optimize materials
- ⏳ Target 60 FPS

### Testing
- ⏳ UI interaction tests
- ⏳ Telemetry accuracy
- ⏳ Race completion
- ⏳ Pit stop validation

---

## Quick Start Checklist

When ready to start development:

1. ⏳ Install Omniverse Launcher from https://www.nvidia.com/omniverse
2. ⏳ Install "Omniverse Code" app from Launcher
3. ⏳ Open Code and enable developer mode
4. ⏳ Add `f1-omniverse/exts` to extension search paths
5. ⏳ Enable `f1_telemetry.core` and `f1_telemetry.ui` extensions
6. ⏳ Run `generate_track.py` to create track USD
7. ⏳ Open generated scene and start race!

---

## Notes

- All `omni.*` imports require Omniverse runtime
- `pxr` library available in Omniverse Python or via `pip install usd-core`
- Track data in `exts/f1_telemetry.core/data/pobstone_gp.json`
- Team colors match Three.js version exactly
