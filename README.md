# Tub’s Audio — immersive Room Lab

Static Three.js experience. Serve `dist/` using a static web server.

## Experience
The primary view is inside the room at listening height. Drag or use arrow keys on the scene to look around. As floor area changes, walls, ceiling, lighting strips, cabinet positions and quantities animate together. The left HiFi / BigFi / Stack navigation follows the active concept pairing. Selecting a product moves the camera to a cabinet; Back to the room restores the interior view. Overview and plan views remain available. Club lighting switches the room lighting. Fine tune exposes width, depth, height, the original four model appearances and centre-bass placement. Escape closes fine tuning or leaves product focus. Reduced-motion preferences disable transition interpolation. Loading and WebGL error states leave room and product controls available.

## Brand reference and assets
The corrected reference is https://tubs-audio-nz.netlify.app/. Product names, roles, the brand logo, central lady artwork, Fraunces, IBM Plex Sans and IBM Plex Mono follow that site. Fonts are locally hosted Google Fonts downloads. The image assets were copied from `/tubs-audio-logo.png` and `/hero-lady.webp` without image edits. All four Meshy model uploads remain represented by detailed derivatives of about 180,000 triangles each, switching to ~30,000 triangles beyond 11 m. Original UVs and PBR maps are retained where available; the incomplete Honeycomb upload has complete geometry but truncated texture bytes, so its broken texture references are removed in working copies and a satin cabinet material is applied. The untextured uploads also use satin materials. Textures are capped at 2K; Meshopt compression and shared model geometry keep transfers and rendering manageable; original uploads remain unchanged. Three.js 0.185.1 is locally vendored with its MIT license. Blender is optional for physical scaling, UVs, texture baking and exact product matching; this version does not require Blender.

## Calibration required
`dist/config.js` deliberately uses illustrative thresholds and editorial product pairings:
- Below 50 m²: HiFi, 2 OBSLK, using Industrial model artwork.
- 50–119 m²: BigFi, 2 DC12 + 4 GC118 Sub, using Honeycomb top artwork.
- 120 m² and above: Stack concept, 4 GC410 + 8 GC218, using Dual Fan top artwork.
These are not approved recommendations. The Stack group presents a conceptual assembly of catalogue components; it is not a claim that the assembly is the named Yeti product. Uploaded Meshy models have not been identified as exact matches to named products. Room height changes geometry, not recommended quantity. No SPL, coverage, interference, acoustics or safety calculation is made. More top cabinets do not automatically improve sound. Central-bass mode places tops on the floor; mounting/supports must be designed separately. All product buttons open the real catalogue entry through an explicit Explore product link.

Before customer use, confirm physical model-to-product mapping, cabinet dimensions, intended role, sensitivity, SPL measurement definitions, power, impedance, dispersion, frequency response, amplifier and crossover/DSP requirements, mounting and stacking limits. Replace thresholds with Tub’s approved rules, informed by intended levels, music, audience, geometry and room acoustics.

## Integration
Copy `dist/` into `/room-lab/` in the main website’s static assets and embed that relative path in a titled iframe at a suitable height, or link to it. Assets are relative and the app needs no backend, accounts or analytics. Catalogue links currently point to the supplied Netlify mockup; replace their common origin when the customer domain is finalized. Do not copy this checkout’s `.openai` hosting identity into another project.

## Validation
Static module and asset resolution, JavaScript syntax, area/dimension clamping, configuration boundaries, product counts, and model bounds across room sizes/layouts are checked. Browser visual and interaction QA has not been run. The app remains a design prototype until that QA and acoustic calibration are complete.

## Netlify hosting
Project: `tubs-room-lab` (site ID `dc2fa1cf-4b0a-47df-b0b2-0efab69f71fb`). `netlify.toml` publishes the existing `dist/` files without a build step.

## Simplified website interface
The main view shows the product rail, About/Contact links, Explore button and a compact room-size slider. Explore contains keyboard-accessible Room, System and Info tabs. Camera modes, lighting, dimensions, presets and reset live under Room; appearances and bass layout under System; instructions and prototype notes under Info. Product descriptions appear only when a product is selected.

## Physics-based acoustic view
Sound opens animated geometric rays, exact first-order receiver reflections, absorption patches and an independent Sabine estimate. A separate bass mode view solves ideal rectangular-room eigenfunctions. The latest cabinet envelopes and beam parameters use visually reviewed manufacturer sheets. See `ACOUSTICS.md` for equations, source URLs, assumptions and validation; earlier purely illustrative dimensions described above are superseded by `dist/speaker-specs.js`. Cabinet counts remain conceptual.

## Rebuilding model assets

Install development dependencies with `npm ci --prefix scripts`, then run `node scripts/optimize-models.mjs INPUT_DIRECTORY dist/assets` followed by `node scripts/compress-models.mjs dist/assets`. Always start from uploads: compression is a final step, not a repeated edit. These scripts never write to the source uploads. The old Python optimiser is superseded. Meshopt decoder is locally vendored with its license. Model textures are shared between repeated cabinets, while each instance owns its material; high/low models use 15% distance hysteresis. No new product CAD has been invented.
