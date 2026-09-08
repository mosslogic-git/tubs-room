# Acoustic model and evidence

This browser implementation is a physics-based **idealized rectangular-room model**, not a measured prediction of a venue. It has two separate regimes rather than treating bass as rays. It does not calculate acoustic isolation, external noise, STI, calibrated SPL, or an optimized speaker quantity.

## Manufacturer evidence

Reviewed linked sheets from the user's reference site on 2026-09-07. The PDFs are image-only; their first pages were rendered and visually read. `dist/speaker-specs.js` records source URLs and values.

| Product | Published response | Dispersion used | Dimensions / qualification |
|---|---|---|---|
| DC12 | 70 Hz–20 kHz | 100°; circular symmetry is a model assumption | 646 × 400 × 353 mm (W/H/D) |
| GC410 | 75 Hz–20 kHz | 110° H, 10° up, 50° down | 700 × 700 × 430 mm; sheet lists crossing to GC218 and other subs at 75 Hz |
| OBSLK | 35 Hz–20 kHz | Not supplied; explicitly omnidirectional comparison | 444 × 900 × 296 mm |
| GC118 Sub | 32–90 Hz | Omnidirectional LF assumption | 650 mm width, 750 mm depth; 680 mm standalone height assumed, since drawing labels overall monitor-stack height |
| GC218 | 32–90 Hz | Omnidirectional LF assumption | Drawing is 600 W × 1300 H × 750 D mm; placed on its side in the concept scene |

The scene scales the Meshy stand-ins to these envelope dimensions; those meshes are not identified manufacturer CAD. Source positions use 70% cabinet height at the front face, an explicit acoustic-centre approximation. Physical support, stacking orientation and topology still require manufacturer approval. Catalogue power/output figures are recorded, but not converted to a calibrated source level because test reference conditions, drive signal, DSP and polar responses are absent. The existing area thresholds remain editorial concept configurations.

## Paths and reflections

- SI coordinates: x = width, y = height, z = room length. Six infinite planes bounded by a rectangular room. Empty room, closed boundaries; furniture and cabinet diffraction are omitted.
- Dry-air approximation: `c = 331.3 sqrt(1 + T/273.15)` m/s.
- Analytic mirror sources find direct and all first-order source-to-listener paths. Arrival time is total path length divided by c.
- At each ray hit the corresponding normal component of the direction reverses. Simultaneous corner hits reflect each affected axis. Rays are traced to four bounces.
- Per-boundary energy multiplies by `(1-alpha)`. Receiver energy is proportional to source directional gain times the product of reflection factors divided by squared total path length. Sources are added incoherently for this energy comparison.
- A smooth Gaussian beam is fitted to nominal angles, **assuming** the quoted bounds mean −6 dB. DC12 uses a circular cone; GC410 uses separate upper/lower vertical angles and horizontal spread. These are frequency-independent approximations, not measured polar data. OBSLK deliberately has no invented directional angle.
- Frequency selection gates sources by their stated response ranges; it does not invent a frequency response curve or crossover. Materials remain explicit user-entered absorption values at the selected band, not an undocumented material library. Air absorption and scattering are omitted.
- Ray samples illustrate directions and energy decay; they are not a converged statistical RIR, SPL heat map or intensity-field calculation. Paths to the listener are computed analytically rather than inferred from sparse ray hits.

## Treatment

Candidate wall/ceiling absorbers are centred on first-order mirror points, ranked by receiver energy. 1.2 × 1.2 m patches are clamped within the room and overlapping rectangles are rejected to avoid double-counting area. Floor reflections are displayed but not automatically fitted with upright panels. Patch absorption only changes hits inside the patch. A panel coefficient below the wall coefficient does not reduce effective absorption; the modeled value is the larger of the two.

The independent diffuse-field estimate is `T60 = 24 ln(10) V/(c A)` with area-weighted absorption A. It is a Sabine approximation, not a decay fit to the displayed four-bounce rays, and may be unreliable in strongly non-diffuse or heavily absorptive rooms. It does not apply to the modal bass view. The app reports before/after estimates without claiming an optimal target.

These patches are internal absorption, **not soundproofing**. Isolation requires assembly transmission loss, penetrations, doors/windows, structural coupling and flanking paths. No room colour or mesh surface can establish those properties. Site measurement is required for an isolation design.

## Bass modes

For rigid rectangular boundaries the exact mode family is:
`f = c/2 sqrt((nx/W)^2 + (ny/H)^2 + (nz/L)^2)` and
`p = cos(nx*pi*(x+W/2)/W) cos(ny*pi*y/H) cos(nz*pi*(z+L/2)/L) cos(2*pi*f*t)`.

The visual displays a listener-height horizontal slice, with blue/rose showing opposite phase and dark regions near nodes. Modes between 20 and 150 Hz are enumerated. A normalized source-coupling factor is the mean eigenfunction value at all in-range cabinet sources, assuming equal strength and equal phase. It is a modal excitation indicator, not a driven steady-state pressure solution. No damping, transfer magnitude, crossover or absolute SPL is predicted. Zero coupling is allowed and produces an unexcited view under the stated assumptions. Reflection treatment does not silently change the rigid-boundary mode calculation.

Playback defaults to 40× slower; the displayed clock is physical simulation time in milliseconds. Real-time playback may be undersampled by the screen. Reduced-motion users start paused and can explicitly choose Play.

## References

- [Pyroomacoustics room simulation](https://pyroomacoustics.readthedocs.io/en/pypi-release/pyroomacoustics.room.html): image-source methods, ray methods, absorption and Sabine approximation.
- [COMSOL hybrid room acoustics](https://www.comsol.com/blogs/modeling-room-acoustics-using-a-hybrid-approach): distinguishes modal and high-frequency methods.
- [COMSOL eigenmodes of a room](https://doc.comsol.com/6.4/doc/com.comsol.help.models.mph.eigenmodes_of_room/eigenmodes_of_room.html): ideal rigid boundaries and analytic rectangular-room modes.
- [Penn State room-mode excitation](https://www.acs.psu.edu/drussell/Demos/roommodes/driving.html): source placement and modal excitation.

## Validation

`node tests/acoustics.mjs` checks closed-form mirror distances, inverse-square energy, bounce directions and losses, complete absorption, nominal beam boundary gains, analytic modal frequencies/nodes, Sabine treatment monotonicity and cabinet envelopes across room sizes/layouts. These mathematical tests passed. JavaScript syntax and UI references were checked. No browser visual QA or comparison with measurements has been performed.

## Balanced display

The default view shows up to four in-band direct speaker-to-listener paths, preserving both sides of the current system. Small travelling rings and 12-point fading trails make propagation visible without a dense ray overlay. Ring size and trail length are illustrative direction cues, not wavelength, pressure, SPL, or an audio-reactive effect. Timing remains distance / sound speed with the selected slow-motion factor.

Early reflections adds up to three panel-associated first-order paths on distinct surfaces, selected from the untreated ranking so paths stay fixed when treatment is toggled. Treatment shows those panels and scales reflected brightness by relative receiver energy. Whole-system estimates and all panel candidates remain in collapsed details. Bass modes stay separate. Dynamic particle culling is disabled because the pulse buffers move every frame. Reduced-motion playback remains paused by default.
