# F1 Telemetry - Pobstone GP
## NVIDIA Omniverse Development Plan

### Project Overview

This project migrates the F1 telemetry simulation from Three.js to NVIDIA Omniverse, enabling photorealistic RTX rendering, USD-based assets, and potential integration with Cesium for real-world geospatial context.

### Project Goals

1. **Like-for-like Migration**: Port all Three.js functionality to Omniverse
2. **Photorealistic Rendering**: Leverage RTX ray tracing for realistic visuals
3. **USD Asset Pipeline**: Convert all assets to USD format with MDL materials
4. **Real-time Telemetry**: Maintain live telemetry dashboard capabilities
5. **Cesium Integration**: Optional real-world terrain at Silverstone coordinates

---

## Phase 1: Foundation Setup (Week 1-2)

### 1.1 Development Environment
- [ ] Install NVIDIA Omniverse Launcher
- [ ] Install Omniverse Kit SDK (latest stable)
- [ ] Install Omniverse Code for extension development
- [ ] Set up Python 3.10+ with USD libraries
- [ ] Configure VS Code with Omniverse extensions

### 1.2 Project Structure
- [x] Create `f1-omniverse/` project directory
- [x] Create extension scaffolds (`f1_telemetry.core`, `f1_telemetry.ui`)
- [x] Create `f1_telemetry.kit` application manifest
- [x] Set up extension configuration (extension.toml files)
- [x] Export track data to JSON format

### 1.3 Build System
- [ ] Test `./repo.sh build` with kit-app-template
- [ ] Link local extensions to Kit app
- [ ] Create development launch configuration
- [ ] Set up hot-reload for extension development

---

## Phase 2: Asset Pipeline (Week 2-3)

### 2.1 3D Model Conversion
- [ ] Convert F1 car OBJ to USD format
- [ ] Set up USD hierarchy (body, wheels, wing elements)
- [ ] Create car variants for each team livery
- [ ] Test car models in Omniverse viewport

### 2.2 Track Generation
- [x] Create track generator script (JSON → USD)
- [ ] Generate track surface mesh in USD
- [ ] Add curb geometry with proper segmentation
- [ ] Create barriers and run-off areas
- [ ] Add grandstand and pit building structures

### 2.3 Material Pipeline
- [ ] Create asphalt MDL material with wear texture
- [ ] Create grass MDL material for surroundings
- [ ] Create curb materials (red/white striping)
- [ ] Create team-specific car materials (6 liveries)
- [ ] Set up material instances for variation

### 2.4 Texture Processing
- [ ] Convert PNG textures to proper format
- [ ] Create PBR texture sets (albedo, normal, roughness)
- [ ] Optimize textures for RTX rendering
- [ ] Set up texture streaming for performance

---

## Phase 3: Core Simulation (Week 3-4)

### 3.1 Track System
- [x] Port Catmull-Rom spline interpolation to Python
- [x] Create Track class with point queries
- [ ] Implement sector timing zones
- [ ] Add DRS zone detection
- [ ] Create pit lane entry/exit logic

### 3.2 Car Physics
- [x] Create Car class with state management
- [x] Port telemetry data structure
- [ ] Implement speed calculation based on track position
- [ ] Add tire wear simulation
- [ ] Add fuel consumption

### 3.3 Race Controller
- [x] Create RaceController class
- [x] Port position calculation logic
- [ ] Implement gap calculations
- [ ] Add pit stop logic
- [ ] Create collision detection system

### 3.4 USD Scene Updates
- [ ] Create OmniGraph node for car movement
- [ ] Implement USD transform updates each frame
- [ ] Optimize for 60 FPS performance
- [ ] Add wheel rotation animation

---

## Phase 4: UI Dashboard (Week 4-5)

### 4.1 Main Dashboard
- [x] Create TelemetryDashboard window class
- [ ] Implement speedometer gauge (circular)
- [ ] Implement RPM bar with color gradient
- [ ] Add throttle/brake visualization
- [ ] Create gear indicator
- [ ] Add DRS status indicator

### 4.2 Standings Panel
- [x] Create StandingsWindow class
- [ ] Implement live position updates
- [ ] Add gap calculations display
- [ ] Show tire/pit status icons
- [ ] Add team color indicators

### 4.3 Race Control
- [x] Create RaceControlPanel class
- [ ] Wire up Start/Stop/Pause buttons
- [ ] Implement speed slider (0.25x - 10x)
- [ ] Add camera selection buttons
- [ ] Create session info display

### 4.4 Timing Tower
- [ ] Create TimingTower panel
- [ ] Show lap times with delta
- [ ] Highlight fastest lap
- [ ] Show sector times
- [ ] Add purple/green sector indicators

---

## Phase 5: Camera System (Week 5-6)

### 5.1 Chase Camera
- [ ] Implement smooth follow camera
- [ ] Add distance/height controls
- [ ] Handle camera transitions between cars

### 5.2 Onboard Camera
- [ ] Position camera at driver eye level
- [ ] Add slight movement for realism
- [ ] Implement look-ahead based on track

### 5.3 TV Camera
- [ ] Create fixed camera positions around track
- [ ] Implement auto-switching based on action
- [ ] Add zoom controls

### 5.4 Helicopter Camera
- [ ] Implement overhead tracking view
- [ ] Add smooth pan controls
- [ ] Create broadcast-style framing

---

## Phase 6: Cesium Integration (Week 6-7) [Optional]

### 6.1 Setup
- [ ] Install Cesium for Omniverse extension
- [ ] Configure Cesium Ion access token
- [ ] Set up coordinate reference system

### 6.2 Terrain Integration
- [ ] Load Silverstone area terrain (52.0786°N, 0.9489°W)
- [ ] Align track model with real coordinates
- [ ] Adjust elevation to match terrain

### 6.3 Imagery
- [ ] Add satellite imagery layer
- [ ] Blend with procedural textures
- [ ] Optimize loading and caching

---

## Phase 7: Polish & Optimization (Week 7-8)

### 7.1 Visual Enhancements
- [ ] Add environment lighting (HDRI)
- [ ] Configure RTX settings for quality
- [ ] Add motion blur for cars
- [ ] Implement tire smoke effects
- [ ] Add sparks on bottoming out

### 7.2 Audio (Optional)
- [ ] Add engine sound per car
- [ ] Doppler effect for passing cars
- [ ] Crowd ambience

### 7.3 Performance
- [ ] Profile and optimize USD updates
- [ ] Implement LOD for distant objects
- [ ] Optimize material complexity
- [ ] Target 60 FPS at 1080p

### 7.4 Testing
- [ ] Test all UI interactions
- [ ] Verify telemetry accuracy
- [ ] Test race completion scenarios
- [ ] Validate pit stop mechanics

---

## Technical Specifications

### Target Platform
- NVIDIA Omniverse Kit SDK 106.0+
- Python 3.10+
- RTX GPU (2060+ recommended)
- 16GB RAM minimum

### Dependencies
```toml
[dependencies]
"omni.kit.uiapp" = {}
"omni.kit.window.viewport" = {}
"omni.physx" = {}
"omni.graph" = {}
"omni.usd" = {}
"omni.hydra.rtx" = {}
"omni.ui" = {}
# Optional:
"cesium.omniverse" = {}
```

### Directory Structure
```
f1-omniverse/
├── f1_telemetry.kit              # Application manifest
├── exts/
│   ├── f1_telemetry.core/        # Core simulation
│   │   ├── config/extension.toml
│   │   ├── data/pobstone_gp.json
│   │   ├── f1_telemetry/core/
│   │   │   ├── __init__.py
│   │   │   ├── extension.py
│   │   │   ├── track.py
│   │   │   ├── car.py
│   │   │   ├── race.py
│   │   │   └── telemetry.py
│   │   └── scripts/
│   │       └── generate_track.py
│   │
│   └── f1_telemetry.ui/          # UI Dashboard
│       ├── config/extension.toml
│       └── f1_telemetry/ui/
│           ├── __init__.py
│           ├── extension.py
│           ├── dashboard.py
│           ├── standings.py
│           └── controls.py
│
├── assets/
│   ├── usd/                      # USD scene files
│   ├── textures/                 # PBR textures
│   └── materials/                # MDL materials
│
└── docs/
    ├── DEVELOPMENT_PLAN.md
    └── TODO.md
```

---

## Key Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Frame Rate | 60 FPS | TBD |
| Telemetry Latency | <16ms | TBD |
| Cars Simulated | 6 | 6 |
| Track Points | 57 | 57 |
| Total Laps | 50 | 50 |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| USD performance | High | Use OmniGraph for transforms |
| Material complexity | Medium | LOD materials, optimize shaders |
| Cesium compatibility | Low | Cesium is optional enhancement |
| UI responsiveness | Medium | Separate UI from simulation thread |

---

## Success Criteria

1. ✅ All 6 cars race around Pobstone GP track
2. ✅ Real-time telemetry updates at 60 FPS
3. ✅ Pit stops function correctly
4. ✅ RTX rendering produces photorealistic output
5. ✅ UI dashboard matches Three.js functionality
6. ⭕ Cesium terrain integration (optional)
