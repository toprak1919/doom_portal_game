# DOOM Portal Game

A 3D game combining DOOM-like mechanics with portal gameplay, built using Three.js.

## Recent Fixes and Implementations

### 1. Module Loading Fixes
- Replaced local Three.js imports with CDN-based ES modules
- Added import map to index.html for proper module resolution
- Fixed BufferGeometryUtils import to use correct export name
### 2. Audio System Implementation
- Added procedural background music with chord progression
- Implemented sound effects (gunshots, footsteps, portal sounds)
- Added volume control and audio management
- Created AudioEngine class with Web Audio API

### 3. Physics System Improvements
- Implemented capsule-based collision detection
- Added wall colliders with AABB checks
- Improved player movement restrictions

### 4. Level Generation
- Added procedural level generation with cellular automata
- Implemented geometry merging for better performance
- Added proper wall placement logic
- Created guaranteed starting areas

### 5. UI Improvements
- Added message overlay system
- Enhanced minimap with player direction
- Implemented settings panel
- Added map generation controls

### 6. Portal System
- Implemented portal rendering
- Added portal camera transforms
- Created portal placement system
- Added portal effects and sounds

## File Structure
├── index.html
├── styles.css
└── src/
├── engine/
│ ├── Renderer.js
│ ├── Physics.js
│ ├── Input.js
│ └── Audio.js
└── game/
├── Level.js
├── Player.js
├── Enemy.js
├── Portal.js
├── UI.js
└── Main.js
## Key Changes by File

### index.html
- Removed local Three.js script
- Added ES module shims and import map
- Added UI elements for game controls

### Main.js
- Updated imports to use ES modules
- Added portal manager initialization
- Improved game loop

### Level.js
- Fixed BufferGeometryUtils import
- Improved geometry merging
- Enhanced level generation

### Audio.js
- Implemented Web Audio API
- Added procedural music system
- Created sound effects

### Physics.js
- Added capsule collision system
- Improved wall colliders
- Enhanced movement restrictions

### UI.js
- Added message overlay
- Improved minimap
- Enhanced settings controls

## Running the Game
1. Serve the game directory using a local web server
2. Open index.html in a modern browser
3. Click "New Game" to start

## Browser Support
- Requires a modern browser with ES modules support
- Web Audio API support required for sound
- WebGL support required for graphics

## Known Issues
- None currently reported

## Future Improvements
- Add more enemy types
- Implement save/load system
- Add more level generation algorithms
- Enhance portal effects