// ---------------------------------------------------------------------------
//  Content for the portfolio "solar system".
//
//  Visual encoding (also shown in the on-screen legend):
//    planet size      = scope of the project (importance 1-5)
//    ring             = a paper or preprint exists for the project
//    moons            = findings / methods / features; moon size = weight (1-3)
//                       3 = headline result, 2 = key method, 1 = supporting detail
//    satellites       = links (paper, code, archive, video)
//    inclination      = distance from the core field. Astrodynamics and GNC sit
//                       near the reference plane; robotics, RL, games and
//                       aerodynamics are tilted out of it.
//    orbit radius     = inner: papers, middle: research code, outer: apps/tools
//
//  Orbital elements are real Keplerian elements: a (scene units), e, i, node (Ω),
//  argp (ω), M0 (mean anomaly at t=0, deg). Periods follow Kepler's third law.
//  Stars, language and last-push date are fetched live from the GitHub API.
// ---------------------------------------------------------------------------

export const GITHUB_USER = 'Bishwaswarup';
const gh = (repo) => `https://github.com/${GITHUB_USER}/${repo}`;

export const categories = {
  sda: { label: 'Space domain awareness', color: '#5eead4' },
  gnc: { label: 'Guidance, navigation & control', color: '#60a5fa' },
  dyn: { label: 'Astrodynamics', color: '#f5a623' },
  robo: { label: 'Robotics', color: '#f472b6' },
  ai: { label: 'Learning & games', color: '#a78bfa' },
  tools: { label: 'Mission tools', color: '#34d399' },
  aero: { label: 'Aerodynamics', color: '#ff7a59' },
  lab: { label: 'Lab work', color: '#e2e8f0' },
};

export const profile = {
  name: 'Bishwaswarup Nayak',
  handle: '@Bishwaswarup',
  callSign: 'Mission Control',
  title: 'Bishwaswarup Nayak',
  role: 'BS (Research) Physics, Indian Institute of Science, Bengaluru',
  tagline: 'Spacecraft GNC · state estimation · cislunar astrodynamics',
  location: 'Bengaluru, India',
  email: 'bishwaswarup@iisc.ac.in',
  github: `https://github.com/${GITHUB_USER}`,
  interests: [
    'Spacecraft guidance, navigation and control',
    'Vision-based relative navigation and proximity operations',
    'State estimation and uncertainty propagation',
    'Space domain awareness',
    'Cislunar astrodynamics and solar-sail dynamics',
  ],
  education: [
    {
      where: 'Indian Institute of Science (IISc), Bengaluru',
      what: 'Bachelor of Science (Research), Physics',
      when: 'Aug 2023 – Jul 2027 (expected)',
      notes: [
        'Four-year research degree with a compulsory final-year thesis.',
        'Thesis (Apr 2027): Synthesis and Magnetic Characterisation of 2D Magnetic Materials, with Prof. Akshay Singh.',
        'JEE Advanced 2023: All India Rank 554.',
      ],
    },
  ],
  // doi: shown as text on the paper cards and linked via https://doi.org/<doi>
  papers: [
    {
      id: 'P1',
      title: 'Custody Horizons for Ground-Based Angles-Only Tracking of Cislunar Periodic Orbits',
      venue: 'Submitted to The Journal of the Astronautical Sciences, 2026',
      doi: '10.5281/zenodo.23075048',
      doiLabel: 'Code & data (Zenodo)',
      links: [
        { label: 'Zenodo', url: 'https://doi.org/10.5281/zenodo.23075048' },
        { label: 'Code', url: gh('cislunar-custody') },
      ],
      planet: 'cislunar-custody',
    },
    {
      id: 'P2',
      title: 'Vision-Based Closed-Loop Spacecraft Rendezvous: Measurement Availability as a Limiting Constraint',
      venue: 'Manuscript, Advances in Space Research, 2026',
      doi: '10.5281/zenodo.23079349',
      doiLabel: 'Code & data (Zenodo)',
      links: [
        { label: 'Zenodo', url: 'https://doi.org/10.5281/zenodo.23079349' },
        { label: 'Code', url: gh('vision-satellite-rendezvous') },
      ],
      planet: 'vision-rendezvous',
    },
    {
      id: 'P3',
      title:
        'Dissolution of the Collinear Structure in the Solar-Sail Circular Restricted Three-Body Problem: An Exact Tidal-Parity Threshold and a Universal Frequency Bound',
      venue: 'Submitted to Celestial Mechanics and Dynamical Astronomy, 2026',
      doi: '10.21203/rs.3.rs-11257328/v1',
      doiLabel: 'Preprint (Research Square)',
      links: [
        { label: 'Research Square', url: 'https://doi.org/10.21203/rs.3.rs-11257328/v1' },
        { label: 'Code', url: gh('SOLAR_SAIL') },
      ],
      planet: 'solar-sail',
    },
    {
      id: 'P4',
      title: 'Gait-Aware Command Timing for Decentralized Quadruped Swarms',
      venue: 'Preprint, Research Square, 2026',
      doi: '10.21203/rs.3.rs-11332226/v1',
      doiLabel: 'Preprint (Research Square)',
      links: [
        { label: 'Research Square', url: 'https://doi.org/10.21203/rs.3.rs-11332226/v1' },
        { label: 'Code & videos', url: gh('robot') },
      ],
      planet: 'robot',
    },
  ],
  tests: [
    {
      name: 'GRE General',
      total: '326',
      parts: [
        { label: 'Verbal', value: '159' },
        { label: 'Quant', value: '167' },
        { label: 'Writing', value: '4.5' },
      ],
    },
    {
      name: 'TOEFL iBT',
      when: 'Sep 2026',
      total: '5.5 / 6 (110 / 120)',
      parts: [
        { label: 'Reading', value: '6.0' },
        { label: 'Listening', value: '6.0' },
        { label: 'Speaking', value: '5.0' },
        { label: 'Writing', value: '4.5' },
      ],
    },
  ],
  experience: [
    {
      where: 'OUSUMS Laboratory, Department of Physics, IISc',
      what: 'Research Assistant with Prof. Akshay Singh',
      when: 'Feb 2026 – present',
      notes: [
        'Control design for a robotic arm that assembles 2D heterostructures; stacking and scoring of 2D flakes.',
        'Thesis: synthesising 2D magnetic materials (CrSBr, CrBr₃) and measuring their magnetic properties.',
      ],
    },
    {
      where: 'Independent research, IISc',
      what: 'Cislunar SDA, vision-based rendezvous, solar-sail CR3BP, quadruped swarms',
      when: '2026',
      notes: ['Four papers and preprints, each with open code, tests and reproducible figures.'],
    },
  ],
  skills: [
    {
      group: 'GNC & estimation',
      items: 'EKF, MEKF, UKF, Gaussian-mixture and particle filters · unscented and Monte Carlo propagation · Cramér–Rao bounds, consider covariance · NEES/NIS consistency · EPnP + RANSAC · LQR, MPC',
    },
    {
      group: 'Dynamics',
      items: 'HCW/J2 relative dynamics · rigid-body attitude · CR3BP periodic orbits, differential correction, continuation, multiple shooting · invariant manifolds · Floquet and controllability analysis · DE440 · SGP4 · Lambert',
    },
    {
      group: 'Programming',
      items: 'Python (NumPy, SciPy, Matplotlib, OpenCV, PyTorch, Gymnasium, Stable-Baselines3, Streamlit) · MATLAB/Simulink · Git',
    },
    {
      group: 'Hardware & lab',
      items: 'Electronics and PCB design (Altium) · SolidWorks · soldering and welding · 2D-flake stacking and heterostructure assembly',
    },
  ],
  coursework: [
    'AE 201A Flight & Space Mechanics',
    'AE 221 Aerodynamics',
    'AE 264 Vibrations',
    'CP 214 Foundations of Robotics',
    'AE 211 Math. Methods for Aerospace',
    'PH 354 Computational Physics',
    'NPTEL Drone Systems & Control',
  ],
  honours: [
    'JEE Advanced 2023: All India Rank 554',
    'JEE Main 2023: 99.9989 percentile',
    'KVPY Fellow (SA), DST, 2022',
    'NTSE Scholar, 2022',
    'IISER Aptitude Test rank 7 · NEST rank 14 (2023)',
    'PRMO/RMO qualifier, 2019',
    'Kabaddi: Odisha state team',
  ],
};

// ---------------------------------------------------------------------------
//  Bodies
// ---------------------------------------------------------------------------
export const bodies = [
  // ----- Station: current lab work (closest to the star) -------------------
  {
    id: 'ousums',
    type: 'station',
    name: 'OUSUMS Lab',
    category: 'lab',
    status: 'Feb 2026 – present',
    tagline: 'Robotic 2D-heterostructure assembly and 2D magnets',
    description:
      'Research assistant in the OUSUMS Laboratory (Prof. Akshay Singh, Department of Physics, IISc). I work on control design for a robotic arm that assembles 2D heterostructures, and on the stacking and scoring of 2D flakes. My final-year thesis synthesises 2D magnetic materials such as CrSBr and CrBr₃ and characterises their magnetism.',
    stack: ['Robotic arm control', '2D materials', 'Experimental CMP'],
    importance: 2,
    orbit: { a: 5, e: 0.0, i: 0, node: 0, argp: 0, M0: 40 },
    moons: [
      { name: 'Robotic stacking', detail: 'Control design for a robotic arm that assembles 2D heterostructures.', weight: 3 },
      { name: 'Thesis: 2D magnets', detail: 'Synthesis and magnetic characterisation of CrSBr and CrBr₃ (submission Apr 2027).', weight: 2 },
      { name: 'Flake scoring', detail: 'Stacking and scoring of exfoliated 2D flakes.', weight: 1 },
    ],
    satellites: [],
  },

  // ----- Inner orbits: projects with papers ---------------------------------
  {
    id: 'cislunar-custody',
    repoName: 'cislunar-custody',
    name: 'Cislunar Custody',
    category: 'sda',
    status: 'Submitted · J. Astronautical Sciences',
    paper: 'P1',
    tagline: 'How long can a cislunar object go unobserved before ground telescopes lose it?',
    description:
      'Defines the custody horizon: the longest observation gap after which 99 % of an object’s probability mass still lies inside a telescope search pattern. Mapped over a simulated year of ground-based angles-only tracking of the 9:2 NRHO, an L1 halo, an L2 Lyapunov orbit and a DRO from a four-site network of 1 m telescopes, in the CR3BP and in a JPL DE440 ephemeris model with solar radiation pressure.',
    stack: ['Python', 'NumPy', 'SciPy', 'JPL DE440', 'EKF/UKF/GM-UKF/PF', 'Monte Carlo'],
    importance: 5,
    orbit: { a: 8.5, e: 0.05, i: 1.5, node: 20, argp: 0, M0: 0 },
    moons: [
      { name: 'Custody split by stability', detail: 'Near-stable orbits (NRHO, DRO) keep custody beyond 30 days after ≥3 days of tracking; unstable L1/L2 orbits are lost after 11–17 days.', weight: 3 },
      { name: 'UT predicts the horizon', detail: 'Unscented-transform covariance propagation predicts the horizon (log-R² 0.93–1.00); the finite-time Lyapunov exponent does not (log-R² ≤ 0.04).', weight: 3 },
      { name: 'GM-UKF reacquisition', detail: 'After a 3-day gap a Gaussian-mixture UKF reacquired in 100 % of 100 runs versus 37 % for the EKF.', weight: 2 },
      { name: 'Lunar-phase blackout', detail: 'Targets sit 4–14° from the Moon, imposing an 8.5–15.7 day monthly blackout no ground network can close.', weight: 2 },
      { name: 'Stability-index law', detail: 'Across 30 members of five orbit families the horizon falls with the stability index (Spearman ρ = −0.92 above index 10).', weight: 2 },
      { name: 'Linear false custody', detail: 'After 14 days on the L1 halo an EKF-style 99 % ellipse holds only 5.4 % of the true probability; the UT ellipse holds 98 %.', weight: 1 },
      { name: 'Ephemeris check', detail: 'The main conclusions are reproduced for 60 cases in a JPL DE440 ephemeris model with solar radiation pressure.', weight: 2 },
      { name: 'Operator = ideal search', detail: 'Centring the search on the operator’s own UT prediction gives the same horizon as an idealised search on the true mean (median ratio 1.00).', weight: 1 },
      { name: 'Bias sensitivity', detail: 'Site biases and solar-pressure errors shorten horizons by about 1 % at nominal levels but make covariance-based custody claims overconfident.', weight: 1 },
      { name: 'Visibility model', detail: 'Twilight, Moon exclusion, Earth shadow and moonlight photometry for a four-site network of 1 m telescopes; the Moon-exclusion angle matters more than aperture.', weight: 1 },
      { name: '59 tests · claims check', detail: 'Every number in the paper is checked against the code; 59 unit tests in CI.', weight: 1 },
    ],
    satellites: [
      { label: 'Zenodo archive', kind: 'doi', url: 'https://doi.org/10.5281/zenodo.23075048' },
      { label: 'Code', kind: 'code', url: gh('cislunar-custody') },
    ],
  },
  {
    id: 'vision-rendezvous',
    repoName: 'vision-satellite-rendezvous',
    name: 'Vision Rendezvous',
    category: 'gnc',
    status: 'Manuscript · Adv. Space Res.',
    paper: 'P2',
    tagline: 'Measurement availability, not pose accuracy, limits vision-based rendezvous',
    description:
      'A closed-loop simulation of rendezvous with a tumbling, non-cooperative target in which perception, estimation and guidance are causally coupled: the camera viewpoint at each step results from the previous pose solution. HCW relative dynamics, torque-free attitude, synthetic monocular keypoints, RANSAC–EPnP pose estimation, a multiplicative EKF, and LQR / receding-horizon guidance, each validated in isolation and then flown together on estimated, not true, states.',
    stack: ['Python', 'HCW', 'EPnP + RANSAC', 'MEKF / UKF', 'LQR', 'MPC', 'Monte Carlo'],
    importance: 5,
    orbit: { a: 11.5, e: 0.07, i: 4, node: 110, argp: 40, M0: 120 },
    moons: [
      { name: 'Availability limits the loop', detail: 'Over 3,915 control steps of 100 dispersed Monte Carlo trials the pose solve succeeds on 100 % of steps beyond 6 m and on 1.7 % inside 1 m.', weight: 3 },
      { name: 'Fill-range law', detail: 'The knee is predicted in closed form by the field-of-view fill range z_fill = fL/W = 6.25 m: inside it, keypoints leave the frame.', weight: 3 },
      { name: 'Threshold, not drift', detail: 'Median terminal range varies by 3 cm from 0.3 to 3.0 px of noise; at 4 px docking falls to 85/100 through a failing tail.', weight: 2 },
      { name: 'Causality test', detail: 'Withholding measurements from an ideal sensor on the vision pipeline’s availability schedule reproduces the failures (77/100 docking): lost, not inaccurate, measurements cause them.', weight: 2 },
      { name: 'Noise-aware gating', detail: 'Scaling the RANSAC inlier threshold to about 3σ restores docking at 4 px to 94/100.', weight: 2 },
      { name: 'Robust PnP', detail: 'RANSAC–EPnP solves all 200 trials at every outlier fraction up to 30 %; bare EPnP fails in 99 % at 5 %.', weight: 1 },
      { name: 'Four vs six points', detail: 'Accepting four correspondences instead of six moves the knee inwards (4–5 m → 2–3 m) but does not remove it.', weight: 1 },
      { name: 'Filter consistency', detail: 'Mean NIS 6.044 over 3,600 updates (n_z = 6), inside the 95 % χ² bounds [5.887, 6.113].', weight: 1 },
      { name: 'Bit-for-bit reproducible', detail: 'Every Monte Carlo trial is seeded from its own spawned seed sequence; a reproduce/ directory reruns every experiment and checks each quoted number.', weight: 1 },
    ],
    satellites: [
      { label: 'Zenodo archive', kind: 'doi', url: 'https://doi.org/10.5281/zenodo.23079349' },
      { label: 'Code', kind: 'code', url: gh('vision-satellite-rendezvous') },
    ],
  },
  {
    id: 'solar-sail',
    repoName: 'SOLAR_SAIL',
    name: 'Solar Sail CR3BP',
    category: 'dyn',
    status: 'Submitted · Celest. Mech. Dyn. Astron.',
    paper: 'P3',
    tagline: 'When does a solar sail stop having a Lagrange point?',
    description:
      'A face-on solar sail does not displace the collinear Lagrange point, it dissolves it into a heliocentric hovering point. The study derives the rate of that degeneration, an exact tidal-parity threshold valid for every mass ratio, a universal frequency bound, and a controllability degeneracy at zero cone angle, with every number checked against the code. Earlier claims that did not survive scrutiny (a "displaced L1", a 0.05 m/s transfer, LQR on a fictitious thruster) are documented and withdrawn in the repository.',
    stack: ['Python', 'CR3BP', 'Floquet analysis', 'Controllability', 'Continuation'],
    importance: 4,
    orbit: { a: 14.5, e: 0.09, i: 2.5, node: 200, argp: 80, M0: 230 },
    moons: [
      { name: 'Exact threshold', detail: 'β_crit = 2μ^(1/3) − μ^(2/3), valid for all mass ratios (≈ 0.0286 for Sun–Earth). No expansion, no root-finding.', weight: 3 },
      { name: 'Universal frequency bound', detail: 'A μ-independent bound ν/ω ∈ [2√2/3, 1) on the collinear frequency ratio.', weight: 3 },
      { name: 'Controllability degeneracy', detail: 'At zero cone angle the linearised control Jacobian loses rank (Kalman rank 4/6: the vertical mode is unreachable); any small cone angle restores it.', weight: 2 },
      { name: 'Hardware reality check', detail: 'Tidal parity is 4.6× beyond the best sail flown (LightSail-2, β ≈ 0.0062) and 1.4× beyond the most ambitious funded design.', weight: 2 },
      { name: 'Control-authority peak', detail: 'Authority on the true 6×2 sail Jacobian peaks at α₀ = arctan(1/√2) = 35.264°, recovering the classical optimal cone angle; it also maximises out-of-plane authority.', weight: 1 },
      { name: 'No halo termination', detail: 'A checked negative result: the apparent halo-family bifurcation is an artifact (fit exponents 1.17 and 1.70, not 0.5).', weight: 1 },
      { name: '175-assertion audit', detail: 'Every number in the paper is asserted against the code; agreement with independent root-finding to 2.1 × 10⁻¹⁶.', weight: 1 },
    ],
    satellites: [
      { label: 'Research Square', kind: 'paper', url: 'https://doi.org/10.21203/rs.3.rs-11257328/v1' },
      { label: 'Code', kind: 'code', url: gh('SOLAR_SAIL') },
    ],
  },
  {
    id: 'robot',
    repoName: 'robot',
    name: 'Quadruped Swarms',
    category: 'robo',
    status: 'Preprint · Research Square',
    paper: 'P4',
    tagline: 'Gait-phase-aware command timing for decentralized Unitree Go1 swarms',
    description:
      'A trotting quadruped cannot change velocity at any instant: how well it absorbs a new command depends on where in the gait cycle it arrives. This work measures that dependence for a Bezier trot controller on a simulated Unitree Go1 in MuJoCo and builds a decentralized swarm layer around it: ORCA solved one gait period ahead, a commander that holds non-urgent changes and releases them at the least destabilising phase, and a gait-aware slew limiter.',
    stack: ['Python', 'MuJoCo', 'ORCA', 'Bezier trot', 'Permutation tests'],
    importance: 5,
    orbit: { a: 17.5, e: 0.06, i: 17, node: 300, argp: 10, M0: 300 },
    moons: [
      { name: 'Fewer urgent events', detail: 'Urgent avoidance events −22 to −39 % in crowded or obstructed scenarios (6–32 robots).', weight: 3 },
      { name: 'Zero falls', detail: '0 falls in 230 full-system runs (baseline: 2 in 170); p99 body tilt −19 to −24 %.', weight: 3 },
      { name: 'Hold vs phase', detail: 'Holding and planning ahead reduce urgent events; choosing the phase adds a smaller, consistent tilt reduction (−5.9 % p99).', weight: 2 },
      { name: 'Capability map', detail: 'Tilt vs gait phase map, held-out R² 0.98 on isolated steps; transfers only in part inside the swarm.', weight: 2 },
      { name: '53 m obstacle course', detail: 'Team of 6 through pole slalom, gate, chicane, moving obstacles and pillars; max tilt 18.3° → 13.7°.', weight: 1 },
      { name: '1,110 paired runs', detail: 'Paired by seed, exact sign-flip permutation tests, Holm-corrected.', weight: 1 },
      { name: 'Honest limits', detail: 'With 4 robots the method increases urgent events; collision avoidance is validated, not guaranteed.', weight: 1 },
    ],
    satellites: [
      { label: 'Research Square', kind: 'paper', url: 'https://doi.org/10.21203/rs.3.rs-11332226/v1' },
      { label: 'Code & videos', kind: 'code', url: gh('robot') },
    ],
  },

  // ----- Middle orbits: research code ---------------------------------------
  {
    id: 'ants-rl',
    repoName: 'ANTS_RL',
    name: 'ANTS-RL',
    category: 'ai',
    status: 'v0.2 · experiments running',
    tagline: 'Deep RL foraging under partial observability',
    description:
      'A small, fully reproducible deep-RL testbed: an ant with a 7×7 egocentric view must find food in procedurally generated 11×11 mazes. PPO with a CNN policy; the study asks how much memory (none, frame stacking, LSTM), how many training layouts, and which reward (sparse, exact potential-based shaping, ad-hoc) an agent needs to navigate unseen mazes. v0.2 audited and withdrew the v0 numbers.',
    stack: ['Python', 'PyTorch', 'Stable-Baselines3', 'Gymnasium', 'PPO / RecurrentPPO'],
    importance: 3,
    orbit: { a: 20.5, e: 0.08, i: 23, node: 60, argp: 200, M0: 60 },
    moons: [
      { name: 'Held-out evaluation', detail: 'Every method, learned or hand-coded, is scored on the same held-out maze layouts: success and SPL with 95 % bootstrap CIs.', weight: 3 },
      { name: 'Memory × layouts grid', detail: 'Memory {none, stack, LSTM} × training layouts {1, 8, 64, 512, ∞}.', weight: 2 },
      { name: 'Exact PBRS', detail: 'γΦ(s′) − Φ(s) on geodesic BFS distance, policy-invariant; compared with sparse and legacy rewards.', weight: 2 },
      { name: 'v0 audit', detail: 'Found and fixed eight issues (fixed maze, unseeded RNG, wrong shaping) and withdrew the v0 claims.', weight: 2 },
      { name: 'Baselines', detail: 'Random walk 24 %, wall follower 100 % (SPL 0.64), oracle SPL 1.0.', weight: 1 },
      { name: 'Phase 2: colony', detail: 'Multi-ant foraging with shared pheromone fields; prototypes live in experimental/.', weight: 1 },
    ],
    satellites: [{ label: 'Code', kind: 'code', url: gh('ANTS_RL') }],
  },
  {
    id: 'cr3bp-manifold',
    repoName: 'cr3bp-manifoldtransfer',
    name: 'Manifold Transfers',
    category: 'dyn',
    status: 'Research code + LaTeX paper',
    tagline: 'Low-energy Earth–Moon transfers via invariant manifolds',
    description:
      'Computes low-energy Earth–Moon transfers by matching invariant manifolds of halo and Lyapunov orbit families in the CR3BP: Richardson third-order guesses, single-shooting differential correction with the STM, pseudo-arclength continuation, manifold tubes from monodromy eigenvectors, Poincaré-section matching and a ΔV budget, with an optional low-thrust leg.',
    stack: ['Python', 'Jupyter', 'CR3BP', 'STM', 'Continuation'],
    importance: 3,
    orbit: { a: 23, e: 0.04, i: 1, node: 150, argp: 0, M0: 170 },
    moons: [
      { name: 'Manifold matching', detail: 'Near-intersections of unstable and stable tubes on a y = 0 Poincaré section give the stitching ΔV.', weight: 3 },
      { name: 'Halo families', detail: 'Differential correction plus pseudo-arclength continuation.', weight: 2 },
      { name: 'Low-thrust leg', detail: 'Continuous tangential thrust from LEO to manifold insertion, targeted by shooting.', weight: 1 },
    ],
    satellites: [{ label: 'Code', kind: 'code', url: gh('cr3bp-manifoldtransfer') }],
  },
  {
    id: 'space-highway',
    repoName: 'space_highway',
    name: 'Space Highway',
    category: 'dyn',
    status: 'Research code',
    tagline: 'Mapping unstable invariant manifolds in the Earth–Moon system',
    description:
      'A phased pipeline for CR3BP halo orbits, their unstable manifolds and where those manifolds re-enter Earth’s atmosphere: validation, 3D halo correction, manifold generation, Poincaré sections at a real UTC epoch, and a re-entry globe.',
    stack: ['Python', 'NumPy', 'Plotly'],
    importance: 2,
    orbit: { a: 25.5, e: 0.05, i: 5, node: 250, argp: 30, M0: 20 },
    moons: [
      { name: 'Re-entry map', detail: 'Where unstable manifold trajectories meet the atmosphere, plotted on a globe.', weight: 2 },
      { name: 'Halo family', detail: '3D halo orbits and their family plot.', weight: 1 },
    ],
    satellites: [{ label: 'Code', kind: 'code', url: gh('space_highway') }],
  },

  // ----- Outer orbits: apps and tools ---------------------------------------
  {
    id: 'orbital-transfer',
    repoName: 'orbital-transfer-app',
    name: 'Orbital Transfer App',
    category: 'tools',
    status: 'App',
    tagline: 'Interplanetary trajectory design with real ephemerides',
    description:
      "Interactive astrodynamics app for designing interplanetary transfers. Solves Lambert's problem over real planetary ephemerides so departure windows for any two planets can be visualised and tuned.",
    stack: ['Python', 'poliastro', 'Astropy', 'Plotly', 'Streamlit'],
    importance: 2,
    orbit: { a: 29.5, e: 0.03, i: 2, node: 30, argp: 0, M0: 200 },
    moons: [
      { name: 'Lambert solver', detail: 'Transfer orbits between any two planets on real ephemerides.', weight: 2 },
      { name: 'Δv budget', detail: 'Patched-conic v∞ at departure and arrival from the Lambert velocities against the planets’ heliocentric velocities.', weight: 1 },
      { name: '3D mission view', detail: 'Interactive Plotly view of planetary orbits, departure and arrival points and the transfer arc.', weight: 1 },
    ],
    satellites: [{ label: 'Code', kind: 'code', url: gh('orbital-transfer-app') }],
  },
  {
    id: 'nanosat',
    repoName: 'nanosatellite_constellation',
    name: 'LEO Constellation',
    category: 'tools',
    status: 'App',
    tagline: 'SGP4 constellation simulator with collision avoidance',
    description:
      'Simulation-only constellation manager for an archived 10-object LEO fleet (ISS, HST, Landsat, Sentinel and others). SGP4 propagation in TEME, transformation to Earth-fixed coordinates, virtual orbital decay with Hohmann station-keeping and Tsiolkovsky propellant accounting, pairwise conjunction screening, and avoidance plans re-checked with an RK4 two-body propagator. A logistic risk score ranks events but never overrides the deterministic keep-out check.',
    stack: ['Python', 'SGP4', 'Astropy', 'NumPy', 'Streamlit'],
    importance: 2,
    orbit: { a: 32, e: 0.04, i: 6, node: 120, argp: 60, M0: 90 },
    moons: [
      { name: 'Conjunction screening', detail: 'Pairwise close-approach screening; avoidance plans re-propagated with RK4 and labelled CLEARED or INSUFFICIENT.', weight: 2 },
      { name: 'Station-keeping', detail: 'Virtual decay and Hohmann restoration burns with Tsiolkovsky fuel accounting.', weight: 1 },
      { name: 'Explainable risk score', detail: 'A logistic risk score with an inspectable primary driver prioritises events; it never replaces the keep-out check.', weight: 1 },
    ],
    satellites: [{ label: 'Code', kind: 'code', url: gh('nanosatellite_constellation') }],
  },
  {
    id: 'ground-tracker',
    repoName: 'Satellite_ground_tracker',
    name: 'Ground Tracker',
    category: 'tools',
    status: 'App · CI + Docker',
    tagline: 'Live TLE ground tracks and pass prediction',
    description:
      'Streamlit app that pulls live TLEs from CelesTrak, plots ground tracks on a 2D map and a 3D globe, and predicts when a satellite will be visible from a chosen location, with a sky-map of the next pass.',
    stack: ['Python', 'Streamlit', 'Folium', 'Plotly', 'Docker', 'pytest'],
    importance: 2,
    orbit: { a: 34.5, e: 0.05, i: 3, node: 330, argp: 100, M0: 300 },
    moons: [
      { name: 'Pass prediction', detail: 'Rise, peak and set times with max elevation for any observer.', weight: 2 },
      { name: 'Sky map', detail: 'Azimuth/elevation polar plot of the next pass.', weight: 1 },
      { name: 'Multi-satellite', detail: '2D map and 3D globe with several satellites at once; custom TLE input; time scrub.', weight: 1 },
    ],
    satellites: [{ label: 'Code', kind: 'code', url: gh('Satellite_ground_tracker') }],
  },
  {
    id: 'chess',
    repoName: 'CHESS_training',
    name: 'NNUE Chess Engine',
    category: 'ai',
    status: 'Engine + Pygame app',
    tagline: 'Alpha-beta search with an optional learned evaluator',
    description:
      'A resizable Pygame chess app with an iterative-deepening alpha-beta engine (Zobrist transposition table, MVV-LVA / killer / history ordering, quiescence search) and Stockfish modes. A small sparse TinyNNUE, trained in PyTorch by distilling Lichess or Stockfish evaluations, can replace the hand-written evaluator, and a ladder benchmark against Stockfish measures whether it actually adds strength.',
    stack: ['Python', 'PyTorch', 'Pygame', 'Stockfish', 'Lichess data'],
    importance: 2,
    orbit: { a: 37, e: 0.06, i: 21, node: 210, argp: 150, M0: 140 },
    moons: [
      { name: 'TinyNNUE evaluator', detail: 'Sparse piece-square network distilled from Lichess / Stockfish centipawn evaluations.', weight: 2 },
      { name: 'Alpha-beta search', detail: 'Iterative deepening, transposition table, MVV-LVA / killer / history ordering, quiescence.', weight: 1 },
      { name: 'Stockfish ladder', detail: 'W/D/L benchmark against Stockfish at three skill/depth rungs.', weight: 1 },
    ],
    satellites: [{ label: 'Code', kind: 'code', url: gh('CHESS_training') }],
  },
  {
    id: 'rubiks',
    repoName: 'rubiks',
    name: "Rubik's Vision Solver",
    category: 'ai',
    status: 'App · tested',
    tagline: 'Webcam scanning, solving and an AR move guide',
    description:
      "Point a webcam at each face of a cube and get told which layer to turn. Hands-free colour scanning, state validation, Kociemba two-phase solving, and an augmented-reality move guide drawn onto the live camera feed, plus a pattern catalogue.",
    stack: ['Python', 'OpenCV', 'Kociemba'],
    importance: 2,
    orbit: { a: 39.5, e: 0.05, i: 14, node: 90, argp: 300, M0: 260 },
    moons: [
      { name: 'AR move guide', detail: 'The next move is drawn onto the live camera image.', weight: 2 },
      { name: 'Hands-free scan', detail: 'Captures each face after three steady seconds; validates the cube state.', weight: 1 },
      { name: 'Pattern catalogue', detail: 'Go straight to named patterns such as Heart.', weight: 1 },
    ],
    satellites: [{ label: 'Code', kind: 'code', url: gh('rubiks') }],
  },
  {
    id: 'uvpm',
    repoName: 'uvpm-oscillating-plate',
    name: 'UVPM Plate',
    category: 'aero',
    status: 'Research code',
    tagline: 'Unsteady wake shedding via the vortex panel method',
    description:
      'Simulates the unsteady aerodynamics and wake shedding of a flat plate in small-amplitude heave and pitch with the Unsteady Vortex Panel Method (after Katz & Plotkin), resolving time-varying lift, drag, moment and vortex-wake structure.',
    stack: ['Python', 'NumPy', 'Matplotlib'],
    importance: 2,
    orbit: { a: 42, e: 0.07, i: 10, node: 170, argp: 220, M0: 40 },
    moons: [
      { name: 'Wake roll-up', detail: 'Free vortex wake shed under Kelvin’s circulation theorem and convected behind the plate.', weight: 2 },
      { name: 'Theodorsen check', detail: 'Unsteady lift compared against Theodorsen’s classical theory.', weight: 1 },
      { name: 'Unsteady loads', detail: 'Time-resolved C_L, C_D and C_M from the unsteady Bernoulli equation, with hysteresis loops.', weight: 1 },
    ],
    satellites: [{ label: 'Code', kind: 'code', url: gh('uvpm-oscillating-plate') }],
  },

  // ----- Dwarf planet: small side project ----------------------------------
  {
    id: 'ecg',
    repoName: 'health_ecg_streamlit_app',
    type: 'dwarf',
    name: 'Synthetic ECG Explorer',
    category: 'ai',
    status: 'Side project',
    tagline: 'Educational synthetic-ECG demo',
    description:
      'An educational, non-diagnostic Streamlit app that generates synthetic ECG waveforms and shows a classifier trained only on synthetic classes.',
    stack: ['Python', 'Streamlit'],
    importance: 1,
    orbit: { a: 46, e: 0.22, i: 30, node: 45, argp: 90, M0: 10 },
    moons: [],
    satellites: [{ label: 'Code', kind: 'code', url: gh('health_ecg_streamlit_app') }],
  },
];

export const planets = bodies;
