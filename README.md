# Room Sound & Speaker Advisor — Spatial Acoustics Studio

Interactive 3D electroacoustic simulator and loudspeaker advisor. Serve `dist/` using any static web server.

## Experience
The primary view is inside the room at listening height. Drag on the scene to look around; WASD or arrow keys move through the room. As floor area changes, room boundaries, ceiling, lighting, loudspeaker arrays and subwoofers reconfigure dynamically. The left navigation lets you explore loudspeaker systems (Studio & HiFi, Club & Lounge, Main Dancefloor) with detailed physical driver specifications. Selecting a speaker frames the cabinet for 3D inspection. Overview and plan views provide macroscopic perspective. Sound simulation calculates direct sound propagation, stereo specular reflections, room resonance eigenmodes, dancefloor SPL coverage heatmaps, and structural sound isolation decoupling specifications.

## Acoustic Advisor & System Configurations
The advisor features three scalable acoustic tiers based on venue volume and acoustic demands:
- Intimate / HiFi (< 50 m²): Close Listening 2-way floorstander stereophonic configuration.
- Mid-Venue / Club (50–119 m²): High-output dual-concentric point sources with 18" subwoofers.
- Main Floor / Arena (120+ m²): High-SPL quad 10" point-source array tops with dual 18" subwoofers.

## Physics-Based Acoustic Analysis
- **Direct Sound & Early Reflections**: Ray tracing with frequency-dependent air/boundary absorption (500 Hz to 4 kHz), first arrival time, and Sabine RT60 reverberation estimation.
- **Stereo Reflection Symmetry**: Independent left and right channel ray reflections across walls, ceiling, and floor boundaries.
- **Bass Room Modes**: Exact 3D wave solutions for rectangular enclosure eigenfrequencies, showing nodal lines and pressure antinodes.
- **Dancefloor SPL Heatmap**: Direct sound pressure level mapping with inverse-square law attenuation and loudspeaker directivity modeling.
- **Sound Isolation Envelope**: Engineered architectural decoupling specifications (floating floors with elastomeric pucks, resilient sound-isolation wall clips, spring-isolated ceiling grids, and sound-lock entryways).

## Netlify Hosting
Configured for automated static deployment via `netlify.toml` publishing the `dist/` directory.

## Simplified website interface
The main view shows the product rail, About/Contact links, Explore button and a compact room-size slider. Explore contains keyboard-accessible Room, System and Info tabs. Camera modes, lighting, dimensions, presets and reset live under Room; appearances and bass layout under System; instructions and prototype notes under Info. Product descriptions appear only when a product is selected.

## Physics-based acoustic view
Sound opens animated geometric rays, exact first-order receiver reflections, absorption patches and an independent Sabine estimate. A separate bass mode view solves ideal rectangular-room eigenfunctions. The latest cabinet envelopes and beam parameters use visually reviewed manufacturer sheets. See `ACOUSTICS.md` for equations, source URLs, assumptions and validation; earlier purely illustrative dimensions described above are superseded by `dist/speaker-specs.js`. Cabinet counts remain conceptual.

## Rebuilding model assets

Install development dependencies with `npm ci --prefix scripts`, then run `node scripts/optimize-models.mjs INPUT_DIRECTORY dist/assets` followed by `node scripts/compress-models.mjs dist/assets`. Always start from uploads: compression is a final step, not a repeated edit. These scripts never write to the source uploads. The old Python optimiser is superseded. Meshopt decoder is locally vendored with its license. Model textures are shared between repeated cabinets, while each instance owns its material; high/low models use 15% distance hysteresis. No new product CAD has been invented.

## Camera zoom
Explore → Room includes a 75–300% camera zoom slider and minus/plus buttons next to the existing Inside / Overview / Plan viewpoints. Zoom is shared across viewpoints, room changes, product focus, and viewport resizing. Reset view and Reset room restore 100%. The lens zoom preserves camera position and direction.

Two-finger pinch on the scene and the mouse wheel use the same zoom controller; spread fingers to zoom in and bring them together to zoom out. One-finger movement still looks around inside and orbits in Overview / Plan. Touch handling is confined to the scene, leaving the surrounding interface's browser gestures alone.

Run `node tests/camera-zoom.mjs` for projection, controls, zoom bounds, reset, pinch transitions, cancellation, capture loss, multi-touch and wheel checks. These automated checks use the real Three.js perspective camera and simulated input events; physical touchscreen and visual browser QA have not been performed.

## Walk around the room
In Inside view, click the scene and hold WASD or arrow keys to move forward/backward or step sideways relative to the viewing direction. Drag to look through 360 degrees. The on-screen movement arrows support press-and-hold touch, mouse, and keyboard activation; you can hold a movement button with one thumb while looking with the other. Pinch zoom remains independent of walking.

Walking is constrained 0.35 m inside the room walls, including while dimensions animate smaller. It does not implement speaker cabinet collision. Movement stops when focus leaves the scene/controls, the window loses focus, the page is hidden, Explore opens, or the viewpoint changes. Reset view restores the starting position and zoom. Walking from a product close-up continues from the current camera position.

Run `node tests/camera-walk.mjs` for movement and input-lifecycle checks. These and the existing zoom/acoustic checks pass; browser and physical touchscreen QA remain unperformed.

## Inspect a speaker
Click or tap a cabinet directly in the 3D scene to select that exact instance, or choose a product in the rail. The camera automatically frames its physical cabinet dimensions, including stacked speakers and narrow screen layouts. Selection starts at 100% zoom. Pinch, scroll or use the close-up ± buttons to magnify details up to 300%; Fit speaker restores the full cabinet. Drag gently around the cabinet while keeping it centered. Back returns to the room; walking also exits inspection. Dragging, pinching and cancelled touches do not select objects.

`node tests/speaker-focus.mjs` verifies cabinet framing across screen ratios, magnification, nearest/individual stack cabinet selection, and tap/drag/pinch separation. Browser and physical-device QA remain unperformed.

## Floor DJ monitors
Two DJ monitor stacks sit directly on the floor behind the main system. No table or stands are rendered. Each base sub uses the exact dimensions of the current main-system sub (GC118 for the small layout); each DC12 top rests on its sub. Monitors face the DJ position and remain selectable for inspection. They are visual additions and are excluded from the main-system acoustic calculations.

## Cabinet proportions
Default cabinets are now clean dimensioned representations built directly in metres. Cabinet envelopes match the specification table, driver rings remain circular, and grille pitch is constant. GC118 height retains the documented assumption. Surface details are illustrative, not manufacturer CAD. Optional imported appearances use uniform scaling to fit within the target envelope, so they cannot squash driver/grille shapes; their envelopes can be smaller than the specified cabinet.
