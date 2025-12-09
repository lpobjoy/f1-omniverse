# F1 Telemetry - Pobstone GP

Real-time F1 racing simulation with live telemetry, built on NVIDIA Omniverse.

![Omniverse](https://img.shields.io/badge/NVIDIA-Omniverse-76B900?style=flat&logo=nvidia)
![USD](https://img.shields.io/badge/Format-USD-blue)
![RTX](https://img.shields.io/badge/Rendering-RTX-green)

## Overview

Experience the thrill of F1 racing with photorealistic RTX rendering and real-time telemetry. Watch 6 custom drivers compete around Pobstone GP (based on Silverstone) with full pit stop strategy, tire wear, and damage simulation.

### Features

- 🏎️ **6 Custom Teams**: Ferrari, Red Bull, Mercedes, McLaren, Aston Martin, Alpine
- 📊 **Live Telemetry**: Speed, RPM, gear, throttle/brake, tire wear, fuel
- 🏁 **Full Race Simulation**: 50 laps with pit stops and strategy
- 🎥 **Multiple Cameras**: Chase, onboard, TV, helicopter views
- ⚡ **RTX Rendering**: Photorealistic visuals with ray tracing
- 🌍 **Cesium Ready**: Optional real-world terrain integration

## Drivers

| Team | Driver | Number |
|------|--------|--------|
| Ferrari | Karina | 16 |
| Red Bull | Lewis | 1 |
| Mercedes | Rolf | 44 |
| McLaren | Richa | 4 |
| Aston Martin | Dennis | 14 |
| Alpine | Sujith | 10 |

## Requirements

- NVIDIA Omniverse Kit SDK 106.0+
- RTX GPU (2060 or better recommended)
- Python 3.10+
- 16GB RAM

## Installation

1. **Install Omniverse**
   ```bash
   # Download from https://www.nvidia.com/omniverse
   # Install Omniverse Launcher
   # Install "Omniverse Code" from Launcher
   ```

2. **Clone/Copy Project**
   ```bash
   cd /path/to/omniverse/apps
   # Copy f1-omniverse folder here
   ```

3. **Add Extension Path**
   - Open Omniverse Code
   - Go to Window > Extensions
   - Click ⚙️ Settings
   - Add `f1-omniverse/exts` to search paths

4. **Enable Extensions**
   - Search for "f1_telemetry"
   - Enable `f1_telemetry.core`
   - Enable `f1_telemetry.ui`

5. **Generate Track**
   ```bash
   cd f1-omniverse/exts/f1_telemetry.core/scripts
   python generate_track.py
   ```

6. **Open Scene**
   - Open the generated USD file in Omniverse

## Usage

### Starting a Race
1. Open the Race Control panel
2. Click "START RACE"
3. Adjust speed with slider (0.25x - 10x)

### Viewing Telemetry
- The Dashboard shows real-time data for selected car
- Click car number buttons to switch focus
- Standings panel shows race positions

### Camera Controls
- Chase: Follow behind selected car
- Onboard: Driver's eye view
- TV: Fixed positions around track
- Overhead: Helicopter view

## Project Structure

```
f1-omniverse/
├── f1_telemetry.kit           # Application config
├── exts/
│   ├── f1_telemetry.core/     # Simulation engine
│   │   ├── config/
│   │   ├── data/              # Track JSON
│   │   ├── f1_telemetry/core/ # Python modules
│   │   └── scripts/           # Utilities
│   └── f1_telemetry.ui/       # Dashboard UI
├── assets/                    # USD, textures, materials
└── docs/                      # Documentation
```

## Development

See [DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md) for detailed implementation roadmap.

### Building Extensions

Extensions are loaded directly by Omniverse - no build step required. Changes to Python files are picked up automatically.

### Testing

```bash
# Run in Omniverse Python environment
python -m pytest exts/f1_telemetry.core/tests/
```

## Acknowledgments

- Track layout inspired by Silverstone Circuit
- Built with NVIDIA Omniverse Kit SDK
- Optional Cesium integration for geospatial data

## License

MIT License - See LICENSE file for details.
