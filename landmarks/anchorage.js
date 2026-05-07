// The Anchorage landmark — Claude Opus 4.7
// Exports createAnchorageLandmark(THREE, world) -> { group, update(dt), meta }
// Represents The Anchorage as a floating harbor with lighthouse, sea plane,
// substrate-color column beam, a tiny moored sailboat, and a kraken silhouette
// drifting deep below.

const SUBSTRATE_COLORS = [
  0xc94d3a, // fc-1 surface  (red — cheap)
  0xc89740, // fc-2 shallow  (amber)
  0x4d8c5a, // fc-3 mid      (green)
  0x3a6db0, // fc-4 deep     (blue)
  0x6a3a8c  // fc-5 abyss    (purple — expensive)
];

export function createAnchorageLandmark(THREE, opts) {
  // main.js passes ({ world }) but standalone harness passes (world) directly
  const world = opts && opts.world ? opts.world : opts || {};
  const group = new THREE.Group();
  // NOTE: main.js sets group.position from world.position after this returns
  group.userData = {
    isWorld: true,
    name: world.name || 'The Anchorage',
    url: world.url || 'https://ai-village-agents.github.io/the-anchorage/harbor.html',
    blurb: 'A floating harbor with 280+ ambient features — marks travel through 5 substrate depths.'
  };

  // --- Sea plane ---------------------------------------------------------
  const sea = new THREE.Mesh(
    new THREE.CircleGeometry(28, 64),
    new THREE.MeshStandardMaterial({
      color: 0x12283f,
      roughness: 0.4,
      metalness: 0.2,
      transparent: true,
      opacity: 0.85
    })
  );
  sea.rotation.x = -Math.PI / 2;
  group.add(sea);

  // --- Foam ring at edge -------------------------------------------------
  const foam = new THREE.Mesh(
    new THREE.RingGeometry(27.4, 28.0, 64),
    new THREE.MeshBasicMaterial({
      color: 0xeaf2ff,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    })
  );
  foam.rotation.x = -Math.PI / 2;
  foam.position.y = 0.02;
  group.add(foam);

  // --- Lighthouse on small island ---------------------------------------
  const island = new THREE.Mesh(
    new THREE.CylinderGeometry(3.6, 4.4, 1.2, 18),
    new THREE.MeshStandardMaterial({ color: 0x2c3a2c, roughness: 0.9 })
  );
  island.position.set(-6, 0.6, -4);
  group.add(island);

  const towerGroup = new THREE.Group();
  towerGroup.position.copy(island.position);
  towerGroup.position.y += 1.2;
  group.add(towerGroup);

  for (let i = 0; i < 3; i++) {
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95 - i * 0.05, 1.0 - i * 0.05, 1.4, 16),
      new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0xe8e6df : 0xc94d3a,
        roughness: 0.6
      })
    );
    band.position.y = 0.7 + i * 1.4;
    towerGroup.add(band);
  }
  const lantern = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.7, 0.7, 12),
    new THREE.MeshStandardMaterial({
      color: 0xffe7a0,
      emissive: 0xffd166,
      emissiveIntensity: 0.9
    })
  );
  lantern.position.y = 5.1;
  towerGroup.add(lantern);
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(0.9, 0.7, 12),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7 })
  );
  roof.position.y = 5.8;
  towerGroup.add(roof);

  // rotating beam
  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(2.2, 22, 24, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xffe7a0,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  beam.rotation.z = Math.PI / 2;
  beam.position.set(11, 0, 0);
  const beamPivot = new THREE.Group();
  beamPivot.position.set(island.position.x, island.position.y + 1.2 + 5.1, island.position.z);
  beamPivot.add(beam);
  group.add(beamPivot);

  // --- Substrate-color column beam -------------------------------------
  const columnGroup = new THREE.Group();
  const columnHeights = [4, 8, 12, 16, 20];
  const slabRadius = 1.6;
  for (let i = 0; i < 5; i++) {
    const slab = new THREE.Mesh(
      new THREE.CylinderGeometry(slabRadius, slabRadius, 4, 24, 1, true),
      new THREE.MeshBasicMaterial({
        color: SUBSTRATE_COLORS[i],
        transparent: true,
        opacity: 0.32,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );
    slab.position.y = columnHeights[i];
    slab.userData.shimmerPhase = Math.random() * Math.PI * 2;
    columnGroup.add(slab);
  }
  group.add(columnGroup);

  // --- Tiny moored sailboat ---------------------------------------------
  const boat = new THREE.Group();
  const hull = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.5, 0.9),
    new THREE.MeshStandardMaterial({ color: 0x6e3b1f, roughness: 0.7 })
  );
  hull.position.y = 0.25;
  boat.add(hull);
  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 2.2, 8),
    new THREE.MeshStandardMaterial({ color: 0x2a1e10 })
  );
  mast.position.y = 1.35;
  boat.add(mast);
  const sailShape = new THREE.Shape();
  sailShape.moveTo(0, 0);
  sailShape.lineTo(0, 1.9);
  sailShape.lineTo(1.0, 0);
  sailShape.lineTo(0, 0);
  const sail = new THREE.Mesh(
    new THREE.ShapeGeometry(sailShape),
    new THREE.MeshStandardMaterial({
      color: 0xf4eedb,
      side: THREE.DoubleSide,
      roughness: 0.8
    })
  );
  sail.position.set(0.05, 0.5, 0);
  boat.add(sail);
  boat.position.set(8, 0.25, 4);
  group.add(boat);

  // --- Kraken silhouette deep below ------------------------------------
  const kraken = new THREE.Mesh(
    new THREE.SphereGeometry(8, 24, 12),
    new THREE.MeshBasicMaterial({
      color: 0x1a1422,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    })
  );
  kraken.scale.set(1.2, 0.32, 1.0);
  kraken.position.set(0, -7, 0);
  group.add(kraken);

  // --- Kraken tentacles (4 curved arms reaching upward) -----------------
  const tentacles = [];
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + 0.3;
    const px = Math.cos(angle) * 9.5;
    const pz = Math.sin(angle) * 9.5;
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(px, -7, pz),
      new THREE.Vector3(px * 1.1, -4, pz * 1.1),
      new THREE.Vector3(px * 1.05, -1.2, pz * 1.05),
      new THREE.Vector3(px * 0.9, 0.4, pz * 0.9)
    ]);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(path, 16, 0.45, 8, false),
      new THREE.MeshStandardMaterial({
        color: 0x2a1830,
        roughness: 0.85,
        transparent: true,
        opacity: 0.65,
        depthWrite: false
      })
    );
    tube.userData.basePhase = i * 0.7;
    tube.userData.baseAngle = angle;
    tentacles.push(tube);
    group.add(tube);
  }

  // --- Two kites tethered to lighthouse island --------------------------
  const kiteGroup = new THREE.Group();
  const kiteColors = [0xc94d3a, 0x3a6db0]; // red, blue — echoing harbor.html
  const kites = [];
  kiteColors.forEach((col, idx) => {
    const kite = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 1.0),
      new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide, transparent: true, opacity: 0.92 })
    );
    kite.userData.phase = idx * Math.PI;
    kite.userData.baseX = -6 + (idx === 0 ? -3 : 3);
    kite.position.set(kite.userData.baseX, 11, -4);
    kites.push(kite);
    kiteGroup.add(kite);

    // tether line — thin cylinder from island lantern to kite
    const tether = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 8, 4),
      new THREE.MeshBasicMaterial({ color: 0x99aabb, transparent: true, opacity: 0.5 })
    );
    tether.position.set(kite.userData.baseX * 0.55 - 3, 7, -4);
    tether.userData.kite = kite;
    kiteGroup.add(tether);
  });
  group.add(kiteGroup);

  // --- Hot air balloon drifting overhead --------------------------------
  const balloonGroup = new THREE.Group();
  const balloon = new THREE.Mesh(
    new THREE.SphereGeometry(1.4, 18, 14),
    new THREE.MeshStandardMaterial({ color: 0xeac24a, roughness: 0.7, emissive: 0x664422, emissiveIntensity: 0.2 })
  );
  balloon.scale.set(1.0, 1.15, 1.0);
  balloonGroup.add(balloon);
  // basket
  const basket = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.45, 0.7),
    new THREE.MeshStandardMaterial({ color: 0x6a4520, roughness: 0.9 })
  );
  basket.position.y = -1.95;
  balloonGroup.add(basket);
  // ropes
  for (let i = 0; i < 4; i++) {
    const rope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.85, 4),
      new THREE.MeshBasicMaterial({ color: 0x553311 })
    );
    const a = (i / 4) * Math.PI * 2;
    rope.position.set(Math.cos(a) * 0.3, -1.35, Math.sin(a) * 0.3);
    balloonGroup.add(rope);
  }
  balloonGroup.position.set(12, 14, -8);
  group.add(balloonGroup);

  // --- Distant rainbow arc (background) ---------------------------------
  const rainbowGroup = new THREE.Group();
  const rainbowColors = [0xc94d3a, 0xe79b3f, 0xebd64f, 0x66bb55, 0x4d8cc7, 0x9c5cb5];
  rainbowColors.forEach((col, i) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(22 + i * 0.6, 0.25, 8, 36, Math.PI),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.32, side: THREE.DoubleSide })
    );
    ring.rotation.x = Math.PI / 2;
    rainbowGroup.add(ring);
  });
  rainbowGroup.position.set(-22, 0, -22);
  rainbowGroup.rotation.y = Math.PI * 0.25;
  group.add(rainbowGroup);

  // --- Orca breach: arc up from the sea periodically -----------------
  const orca = new THREE.Mesh(
    new THREE.SphereGeometry(0.7, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0x111118, emissive: 0x223344, roughness: 0.7 })
  );
  orca.scale.set(1.6, 0.55, 0.9);
  orca.position.set(-18, -0.5, -16);
  group.add(orca);
  const orcaSpray = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xeaf2ff, transparent: true, opacity: 0 })
  );
  orcaSpray.position.copy(orca.position);
  group.add(orcaSpray);

  // --- Albatross gliding in slow circle overhead --------------------
  const albatrossShape = new THREE.Shape();
  albatrossShape.moveTo(0, 0);
  albatrossShape.lineTo(-1.2, 0.15);
  albatrossShape.lineTo(-0.4, -0.05);
  albatrossShape.lineTo(0, -0.18);
  albatrossShape.lineTo(0.4, -0.05);
  albatrossShape.lineTo(1.2, 0.15);
  albatrossShape.lineTo(0, 0);
  const albatross = new THREE.Mesh(
    new THREE.ShapeGeometry(albatrossShape),
    new THREE.MeshBasicMaterial({ color: 0xeeeef2, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
  );
  albatross.scale.set(0.85, 0.85, 1);
  group.add(albatross);

  // --- Sea otter floating on back near sailboat --------------------
  const otter = new THREE.Group();
  const otterBody = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0x6a4a30, roughness: 0.85 })
  );
  otterBody.scale.set(1.4, 0.5, 0.7);
  otter.add(otterBody);
  const otterBelly = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0xc9a878, roughness: 0.9 })
  );
  otterBelly.scale.set(1.2, 0.3, 0.6);
  otterBelly.position.y = 0.08;
  otter.add(otterBelly);
  otter.position.set(10.5, 0.2, 4.5);
  group.add(otter);

  // --- Distant ship on horizon for lightning flash ----------------
  const distantShip = new THREE.Group();
  const shipHull = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.4, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.8 })
  );
  distantShip.add(shipHull);
  const shipMast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6),
    new THREE.MeshStandardMaterial({ color: 0x222233 })
  );
  shipMast.position.y = 0.9;
  distantShip.add(shipMast);
  distantShip.position.set(22, 0.3, 18);
  group.add(distantShip);

  // Lightning flash sphere (additive)
  const lightning = new THREE.Mesh(
    new THREE.SphereGeometry(2.4, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0xddeeff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending })
  );
  lightning.position.set(22, 6, 18);
  group.add(lightning);

  // --- Aurora ribbon overhead -------------------------------------
  const auroraGroup = new THREE.Group();
  const auroraColors = [0x66ffaa, 0x88ccff, 0xaa88ff, 0xff88dd];
  for (let a = 0; a < 4; a++) {
    const auroraGeom = new THREE.PlaneGeometry(40, 6, 32, 1);
    const positions = auroraGeom.attributes.position;
    for (let p = 0; p < positions.count; p++) {
      const px = positions.getX(p);
      positions.setY(p, positions.getY(p) + Math.sin(px * 0.18 + a) * 1.2);
    }
    auroraGeom.computeVertexNormals();
    const auroraMat = new THREE.MeshBasicMaterial({
      color: auroraColors[a],
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const auroraMesh = new THREE.Mesh(auroraGeom, auroraMat);
    auroraMesh.position.set(0, 22 + a * 1.5, -18);
    auroraMesh.rotation.x = -0.15;
    auroraMesh.userData.basePhase = a * 0.7;
    auroraGroup.add(auroraMesh);
  }
  group.add(auroraGroup);

  // --- Kelp forest swaying near the seafloor -----------------------
  const kelpGroup = new THREE.Group();
  const kelpPositions = [
    [-12, -2, 8], [-9, -2, 11], [-13.5, -2, 6.5], [-10.5, -2, 5],
    [-7, -2, 12], [-14, -2, 9], [-11, -2, 14]
  ];
  const kelpStrands = [];
  kelpPositions.forEach((pos, i) => {
    const strand = new THREE.Group();
    const segs = 4;
    let prevY = 0;
    for (let s = 0; s < segs; s++) {
      const seg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.10, 0.14, 1.5, 6),
        new THREE.MeshStandardMaterial({
          color: 0x2a6f3a,
          emissive: 0x0a3a18,
          emissiveIntensity: 0.3,
          roughness: 0.6,
          transparent: true,
          opacity: 0.85
        })
      );
      seg.position.y = prevY + 0.75;
      seg.userData.segIdx = s;
      seg.userData.strandPhase = i * 0.8;
      prevY += 1.5;
      strand.add(seg);
    }
    // tiny glowing tip
    const tip = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0x88ffaa, transparent: true, opacity: 0.7 })
    );
    tip.position.y = prevY + 0.1;
    strand.add(tip);
    strand.position.set(pos[0], pos[1], pos[2]);
    kelpGroup.add(strand);
    kelpStrands.push(strand);
  });
  group.add(kelpGroup);

  // --- Aurora reflection on sea (faint horizontal band) ------------
  const auroraReflection = new THREE.Mesh(
    new THREE.RingGeometry(8, 18, 32, 1, 0, Math.PI),
    new THREE.MeshBasicMaterial({ color: 0x66ffcc, transparent: true, opacity: 0.10, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
  );
  auroraReflection.rotation.x = -Math.PI / 2;
  auroraReflection.position.set(0, 0.05, -4);
  group.add(auroraReflection);

  // --- World label sprite floating above scene --------------------------
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 160;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 44px Georgia, serif';
    ctx.fillStyle = '#cfe7ff';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,30,0.8)';
    ctx.shadowBlur = 8;
    ctx.fillText('The Anchorage', 256, 60);
    ctx.font = 'italic 22px Georgia, serif';
    ctx.fillStyle = '#88aacc';
    ctx.fillText('Claude Opus 4.7', 256, 95);
    ctx.font = '16px Georgia, serif';
    ctx.fillStyle = '#6a8db0';
    ctx.fillText('5 substrate depths · $0.01 → $1B+', 256, 125);
    const tex = new THREE.CanvasTexture(canvas);
    const lblMat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const label = new THREE.Sprite(lblMat);
    label.position.set(0, 26, 0);
    label.scale.set(22, 6.875, 1);
    group.add(label);
  }

  // --- Lights -----------------------------------------------------------
  const lanternLight = new THREE.PointLight(0xffd166, 1.2, 28, 1.2);
  lanternLight.position.set(island.position.x, island.position.y + 1.2 + 5.1, island.position.z);
  group.add(lanternLight);


  // === v5 atmospheric additions ===
  // --- Whale spout (distant whale exhales every ~18s) -----------------
  const whaleBackMat = new THREE.MeshStandardMaterial({ color: 0x223a4a, roughness: 0.9 });
  const whaleBack = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 8), whaleBackMat);
  whaleBack.scale.set(2.4, 0.45, 1.0);
  whaleBack.position.set(20, 0.05, -16);
  group.add(whaleBack);
  const whaleSpoutMat = new THREE.MeshBasicMaterial({
    color: 0xddeaf2, transparent: true, opacity: 0, blending: THREE.AdditiveBlending
  });
  const whaleSpout = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.5, 4.2, 12, 1, true), whaleSpoutMat);
  whaleSpout.position.set(20, 2.6, -16);
  group.add(whaleSpout);
  const whaleSpoutCloud = new THREE.Mesh(
    new THREE.SphereGeometry(1.0, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0xeef4f8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending })
  );
  whaleSpoutCloud.position.set(20, 5.0, -16);
  group.add(whaleSpoutCloud);

  // --- Sea turtle gliding alongside the sailboat -------------------------
  const turtle = new THREE.Group();
  const turtleShell = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 14, 10),
    new THREE.MeshStandardMaterial({ color: 0x4a6a3c, roughness: 0.85 })
  );
  turtleShell.scale.set(1.0, 0.4, 1.2);
  turtle.add(turtleShell);
  const turtleHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0x6a7a4a, roughness: 0.9 })
  );
  turtleHead.position.set(0, 0.05, 0.62);
  turtle.add(turtleHead);
  // Four flippers
  const flipperMat = new THREE.MeshStandardMaterial({ color: 0x556a40, roughness: 0.9 });
  const flippers = [];
  for (let i = 0; i < 4; i++) {
    const fl = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.08, 0.18), flipperMat);
    const sx = i < 2 ? 1 : -1;
    const sz = i % 2 === 0 ? 0.3 : -0.3;
    fl.position.set(0.55 * sx, 0, sz);
    fl.userData.basePhase = i * 0.5;
    flippers.push(fl);
    turtle.add(fl);
  }
  turtle.position.y = -0.2;
  group.add(turtle);

  // --- Sunset gradient on horizon (large faded hemisphere) -------------
  const sunsetGeo = new THREE.SphereGeometry(60, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.45);
  const sunsetMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      varying float vY;
      varying vec3 vPos;
      void main() {
        vPos = position;
        vY = position.y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying float vY;
      varying vec3 vPos;
      uniform float uTime;
      void main() {
        float h = clamp(vY / 60.0, 0.0, 1.0);
        // Pink-orange near horizon, deep purple-blue up high
        vec3 horizon = vec3(1.0, 0.55, 0.45);
        vec3 mid = vec3(0.85, 0.45, 0.65);
        vec3 sky = vec3(0.18, 0.20, 0.42);
        vec3 c = mix(horizon, mid, smoothstep(0.0, 0.4, h));
        c = mix(c, sky, smoothstep(0.4, 1.0, h));
        // Faint sun glow at azimuth angle
        float angle = atan(vPos.z, vPos.x);
        float sunFalloff = exp(-pow((angle + 2.4), 2.0) * 6.0) * exp(-pow(h - 0.05, 2.0) * 30.0);
        c += vec3(1.0, 0.7, 0.5) * sunFalloff * 0.6;
        // Atmospheric pulse
        float pulse = 0.92 + 0.08 * sin(uTime * 0.3);
        gl_FragColor = vec4(c * pulse, 0.42);
      }
    `,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false
  });
  const sunset = new THREE.Mesh(sunsetGeo, sunsetMat);
  sunset.position.y = -2;
  group.add(sunset);

  // --- Lighthouse keeper's cottage (small box w/ warm window) -----------
  const cottage = new THREE.Group();
  const cottageBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 1.4, 1.4),
    new THREE.MeshStandardMaterial({ color: 0xc9b48a, roughness: 0.85 })
  );
  cottageBody.position.y = 0.7;
  cottage.add(cottageBody);
  const cottageRoof = new THREE.Mesh(
    new THREE.ConeGeometry(1.25, 0.8, 4),
    new THREE.MeshStandardMaterial({ color: 0x4a2a1a, roughness: 0.9 })
  );
  cottageRoof.rotation.y = Math.PI / 4;
  cottageRoof.position.y = 1.8;
  cottage.add(cottageRoof);
  const cottageWindow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.35, 0.35),
    new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.95 })
  );
  cottageWindow.position.set(0.81, 0.85, 0.0);
  cottageWindow.rotation.y = Math.PI / 2;
  cottage.add(cottageWindow);
  const cottageDoor = new THREE.Mesh(
    new THREE.PlaneGeometry(0.32, 0.6),
    new THREE.MeshBasicMaterial({ color: 0x3a2218 })
  );
  cottageDoor.position.set(0, 0.4, 0.71);
  cottage.add(cottageDoor);
  // Small chimney with subtle smoke
  const chimney = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.5, 0.22),
    new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.9 })
  );
  chimney.position.set(-0.4, 1.85, -0.2);
  cottage.add(chimney);
  const smokeMat = new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.4 });
  const smokeParticles = [];
  for (let i = 0; i < 6; i++) {
    const sp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 4), smokeMat.clone());
    sp.position.set(-0.4, 2.1 + i * 0.18, -0.2);
    sp.userData = { basePhase: i * 0.4, baseY: 2.1 + i * 0.18 };
    smokeParticles.push(sp);
    cottage.add(sp);
  }
  cottage.position.set(-3.2, 1.2, -2.5);
  cottage.rotation.y = -0.4;
  group.add(cottage);

  // --- Bioluminescent plankton bloom (particles that pulse) -------------
  const planktonCount = 220;
  const planktonGeo = new THREE.BufferGeometry();
  const planktonPos = new Float32Array(planktonCount * 3);
  const planktonPhase = new Float32Array(planktonCount);
  for (let i = 0; i < planktonCount; i++) {
    const r = 6 + Math.random() * 18;
    const a = Math.random() * Math.PI * 2;
    planktonPos[i * 3 + 0] = Math.cos(a) * r;
    planktonPos[i * 3 + 1] = 0.05 + Math.random() * 0.15;
    planktonPos[i * 3 + 2] = Math.sin(a) * r;
    planktonPhase[i] = Math.random() * Math.PI * 2;
  }
  planktonGeo.setAttribute('position', new THREE.BufferAttribute(planktonPos, 3));
  planktonGeo.setAttribute('phase', new THREE.BufferAttribute(planktonPhase, 1));
  const planktonMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      attribute float phase;
      varying float vGlow;
      uniform float uTime;
      void main() {
        float pulse = 0.5 + 0.5 * sin(uTime * 1.3 + phase * 2.0);
        vGlow = pulse;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = (1.5 + pulse * 3.0) * (300.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying float vGlow;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        if (d > 0.5) discard;
        float a = (1.0 - d * 2.0) * vGlow;
        gl_FragColor = vec4(0.55, 1.0, 0.85, a * 0.85);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const plankton = new THREE.Points(planktonGeo, planktonMat);
  group.add(plankton);

  // --- Fireworks burst over distant ship (rare celebration) -------------
  const fwCount = 60;
  const fwGeo = new THREE.BufferGeometry();
  const fwPos = new Float32Array(fwCount * 3);
  const fwVel = new Float32Array(fwCount * 3);
  const fwColor = new Float32Array(fwCount * 3);
  for (let i = 0; i < fwCount; i++) {
    // Random radial direction
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const speed = 1.5 + Math.random() * 2.5;
    fwVel[i * 3 + 0] = Math.sin(phi) * Math.cos(theta) * speed;
    fwVel[i * 3 + 1] = Math.cos(phi) * speed;
    fwVel[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed;
    // Orange/red/gold mix
    const cMode = Math.random();
    if (cMode < 0.4) { fwColor[i*3]=1.0; fwColor[i*3+1]=0.5; fwColor[i*3+2]=0.2; }
    else if (cMode < 0.7) { fwColor[i*3]=1.0; fwColor[i*3+1]=0.85; fwColor[i*3+2]=0.4; }
    else { fwColor[i*3]=0.6; fwColor[i*3+1]=0.9; fwColor[i*3+2]=1.0; }
    fwPos[i * 3 + 0] = 22; fwPos[i * 3 + 1] = 7; fwPos[i * 3 + 2] = 18;
  }
  fwGeo.setAttribute('position', new THREE.BufferAttribute(fwPos, 3));
  fwGeo.setAttribute('color', new THREE.BufferAttribute(fwColor, 3));
  const fwMat = new THREE.PointsMaterial({
    size: 0.32, vertexColors: true, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const fireworks = new THREE.Points(fwGeo, fwMat);
  fireworks.userData = { vel: fwVel, basePos: { x: 22, y: 7, z: 18 } };
  group.add(fireworks);

  // --- Tide pool minizone with starfish silhouettes ---------------------
  const tidePool = new THREE.Group();
  const poolWater = new THREE.Mesh(
    new THREE.CircleGeometry(1.4, 24),
    new THREE.MeshBasicMaterial({ color: 0x88ccdd, transparent: true, opacity: 0.55 })
  );
  poolWater.rotation.x = -Math.PI / 2;
  poolWater.position.y = 0.04;
  tidePool.add(poolWater);
  const poolRim = new THREE.Mesh(
    new THREE.RingGeometry(1.35, 1.6, 24),
    new THREE.MeshBasicMaterial({ color: 0x665544, side: THREE.DoubleSide })
  );
  poolRim.rotation.x = -Math.PI / 2;
  poolRim.position.y = 0.05;
  tidePool.add(poolRim);
  // 3 starfish (5-pointed shape)
  const starShape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? 0.18 : 0.07;
    if (i === 0) starShape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  starShape.closePath();
  const starGeo = new THREE.ShapeGeometry(starShape);
  for (let i = 0; i < 3; i++) {
    const sf = new THREE.Mesh(starGeo, new THREE.MeshBasicMaterial({ color: 0xff8855 }));
    sf.rotation.x = -Math.PI / 2;
    sf.rotation.z = i * 1.7;
    sf.position.set(Math.cos(i * 2.1) * 0.6, 0.045, Math.sin(i * 2.1) * 0.6);
    tidePool.add(sf);
  }
  tidePool.position.set(-9, 1.2, -1.5);
  group.add(tidePool);

  // --- Compass rose etched on sea (decorative) --------------------------
  const compassGroup = new THREE.Group();
  const compassRing = new THREE.Mesh(
    new THREE.RingGeometry(2.0, 2.15, 32),
    new THREE.MeshBasicMaterial({ color: 0xaaccdd, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
  );
  compassRing.rotation.x = -Math.PI / 2;
  compassGroup.add(compassRing);
  // 4 cardinal arrows
  for (let i = 0; i < 4; i++) {
    const arm = new THREE.Mesh(
      new THREE.PlaneGeometry(0.18, 1.6),
      new THREE.MeshBasicMaterial({ color: 0xddeeff, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
    );
    arm.rotation.x = -Math.PI / 2;
    arm.rotation.z = i * Math.PI / 2;
    arm.position.y = 0.03;
    compassGroup.add(arm);
  }
  compassGroup.position.set(8, 0.06, 8);
  group.add(compassGroup);


  // === v6 deep-sea & celestial additions ===
  // --- School of fish (15 small fish darting in formation) ---------------
  const simpleFishSchool = [];
  const fishGeo = new THREE.ConeGeometry(0.18, 0.55, 6);
  fishGeo.rotateZ(-Math.PI / 2);
  for (let i = 0; i < 15; i++) {
    const fish = new THREE.Mesh(fishGeo, new THREE.MeshStandardMaterial({
      color: 0xc0c8d0, metalness: 0.6, roughness: 0.3, emissive: 0x445566, emissiveIntensity: 0.2
    }));
    fish.userData = {
      offset: i / 15 * Math.PI * 2,
      yBase: -0.2 + (i % 3) * 0.15,
      radius: 7 + (i % 5) * 0.6,
      speed: 0.5 + (i % 4) * 0.05
    };
    simpleFishSchool.push(fish);
    group.add(fish);
  }

  // --- Sunken treasure chest at seafloor with glowing gold aura ---------
  const chestGroup = new THREE.Group();
  const chestBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.45, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x6a3a1a, roughness: 0.95 })
  );
  chestBase.position.y = 0.225;
  chestGroup.add(chestBase);
  const chestLid = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 0.2, 0.62),
    new THREE.MeshStandardMaterial({ color: 0x8a4a25, roughness: 0.9 })
  );
  chestLid.position.set(0, 0.55, -0.05);
  chestLid.rotation.x = -0.4;
  chestGroup.add(chestLid);
  const chestBands = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 0.08, 0.65),
    new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7, roughness: 0.5 })
  );
  chestBands.position.y = 0.225;
  chestGroup.add(chestBands);
  // Gold spilling from the open chest
  const goldMat = new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.95 });
  for (let i = 0; i < 8; i++) {
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 12), goldMat.clone());
    coin.position.set(
      (Math.random() - 0.5) * 0.7,
      0.5 + Math.random() * 0.15,
      0.05 + Math.random() * 0.15
    );
    coin.rotation.x = Math.random() * 0.6;
    chestGroup.add(coin);
  }
  // Chest aura
  const chestAura = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 16, 12),
    new THREE.MeshBasicMaterial({
      color: 0xffaa44, transparent: true, opacity: 0.18,
      blending: THREE.AdditiveBlending, depthWrite: false
    })
  );
  chestAura.position.y = 0.3;
  chestGroup.add(chestAura);
  chestGroup.position.set(14, -1.4, -10);
  chestGroup.rotation.y = -0.5;
  group.add(chestGroup);

  // --- Anchor constellation overhead (5 named stars in anchor shape) ----
  const constGroup = new THREE.Group();
  // Anchor shape star positions (rough)
  const anchorStars = [
    { x: 0, y: 4.0, name: 'top' },       // ring top
    { x: 0, y: 2.5, name: 'shaft' },     // shaft mid
    { x: 0, y: 1.0, name: 'crown' },     // crown
    { x: -2.5, y: 0.6, name: 'left' },   // left fluke
    { x: 2.5, y: 0.6, name: 'right' }    // right fluke
  ];
  const starMat = new THREE.MeshBasicMaterial({
    color: 0xffeeaa, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending
  });
  const constStars = [];
  anchorStars.forEach((s) => {
    const star = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), starMat.clone());
    star.position.set(s.x * 1.6, s.y * 1.4 + 18, -22);
    star.userData = { phase: Math.random() * Math.PI * 2 };
    constStars.push(star);
    constGroup.add(star);
  });
  // Connect lines: top→shaft→crown, crown→left, crown→right
  const linePairs = [[0,1], [1,2], [2,3], [2,4]];
  linePairs.forEach(([a,b]) => {
    const sa = anchorStars[a], sb = anchorStars[b];
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(sa.x*1.6, sa.y*1.4 + 18, -22),
      new THREE.Vector3(sb.x*1.6, sb.y*1.4 + 18, -22)
    ]);
    const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({
      color: 0xaaaadd, transparent: true, opacity: 0.4
    }));
    constGroup.add(line);
  });
  group.add(constGroup);

  // --- Giant squid silhouette deep below (drifts slowly across) ---------
  const squidGroup = new THREE.Group();
  const squidBody = new THREE.Mesh(
    new THREE.SphereGeometry(1.4, 14, 10),
    new THREE.MeshStandardMaterial({
      color: 0x441a3a, roughness: 0.95, transparent: true, opacity: 0.7
    })
  );
  squidBody.scale.set(0.7, 1.6, 0.7);
  squidGroup.add(squidBody);
  // Squid eye (red glow)
  const squidEye = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xff3344 })
  );
  squidEye.position.set(0.45, 0.3, 0.55);
  squidGroup.add(squidEye);
  // 8 tentacles (TubeGeometry curves)
  const squidTentacles = [];
  for (let t = 0; t < 8; t++) {
    const angle = (t / 8) * Math.PI * 2;
    const cx = Math.cos(angle) * 0.4;
    const cz = Math.sin(angle) * 0.4;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(cx, -1.5, cz),
      new THREE.Vector3(cx * 1.5, -2.5, cz * 1.5),
      new THREE.Vector3(cx * 2.2, -3.6, cz * 2.2),
      new THREE.Vector3(cx * 2.6, -4.6, cz * 2.6)
    ]);
    const tubeGeo = new THREE.TubeGeometry(curve, 12, 0.12, 6, false);
    const tube = new THREE.Mesh(tubeGeo, new THREE.MeshStandardMaterial({
      color: 0x331a35, roughness: 0.95, transparent: true, opacity: 0.65
    }));
    tube.userData = { angle, basePhase: t * 0.4 };
    squidTentacles.push(tube);
    squidGroup.add(tube);
  }
  squidGroup.position.set(0, -3.5, 0);
  group.add(squidGroup);

  // --- Bell buoy bobbing in shallow water (red channel marker) ---------
  const buoyGroup = new THREE.Group();
  const buoyBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.6, 1.2, 12),
    new THREE.MeshStandardMaterial({ color: 0xc94d3a, roughness: 0.7, metalness: 0.3 })
  );
  buoyBody.position.y = 0.6;
  buoyGroup.add(buoyBody);
  const buoyTop = new THREE.Mesh(
    new THREE.ConeGeometry(0.45, 0.55, 12),
    new THREE.MeshStandardMaterial({ color: 0xa33e2c, roughness: 0.7 })
  );
  buoyTop.position.y = 1.45;
  buoyGroup.add(buoyTop);
  // Bell cage (4 vertical struts and bell)
  const cageMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.4 });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 6), cageMat);
    strut.position.set(Math.cos(a) * 0.3, 2.05, Math.sin(a) * 0.3);
    buoyGroup.add(strut);
  }
  const bell = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 0.4, 8),
    new THREE.MeshStandardMaterial({ color: 0xddaa33, metalness: 0.9, roughness: 0.3 })
  );
  bell.position.y = 2.1;
  buoyGroup.add(bell);
  // Light on top (small green)
  const buoyLight = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0x33ff66 })
  );
  buoyLight.position.y = 2.45;
  buoyGroup.add(buoyLight);
  buoyGroup.position.set(7, 0, -6);
  group.add(buoyGroup);

  // --- Coral reef cluster on seafloor (5 colorful corals) ----------------
  const coralColors = [0xff6688, 0x66ddff, 0xffaa44, 0xaa88ff, 0xff4466];
  const corals = [];
  for (let i = 0; i < 5; i++) {
    const coral = new THREE.Group();
    // Branching coral as 3 cylinders at angles
    for (let b = 0; b < 4; b++) {
      const branch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.12, 0.7 + Math.random() * 0.4, 6),
        new THREE.MeshStandardMaterial({
          color: coralColors[i], roughness: 0.85,
          emissive: coralColors[i], emissiveIntensity: 0.25
        })
      );
      branch.position.y = 0.4;
      branch.rotation.z = (Math.random() - 0.5) * 0.6;
      branch.rotation.x = (Math.random() - 0.5) * 0.6;
      branch.position.x = (Math.random() - 0.5) * 0.3;
      coral.add(branch);
    }
    // Tip glow
    const tip = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 8, 6),
      new THREE.MeshBasicMaterial({ color: coralColors[i], transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending })
    );
    tip.position.y = 0.85;
    coral.add(tip);
    const cAngle = (i / 5) * Math.PI * 2 + 0.3;
    coral.position.set(Math.cos(cAngle) * 12, -1.5, Math.sin(cAngle) * 12);
    coral.userData = { glowPhase: i * 0.7 };
    corals.push(coral);
    group.add(coral);
  }


  // === v7 maritime expansion ===

  // 7.1 Sandy seabed disk + ripple marks
  const seabed = new THREE.Mesh(
    new THREE.CircleGeometry(24, 64),
    new THREE.MeshBasicMaterial({ color: 0x9a8866, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
  );
  seabed.rotation.x = -Math.PI / 2;
  seabed.position.y = -4.0;
  group.add(seabed);
  const sandRipples = [];
  for (let i = 0; i < 18; i++) {
    const r = 1.0 + Math.random() * 1.6;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.05 + Math.random() * 0.05, 4, 24),
      new THREE.MeshBasicMaterial({ color: 0x7a6a4d, transparent: true, opacity: 0.45 })
    );
    const a = Math.random() * Math.PI * 2;
    const rad = 4 + Math.random() * 18;
    ring.position.set(Math.cos(a) * rad, -3.95, Math.sin(a) * rad);
    ring.rotation.x = -Math.PI / 2;
    ring.rotation.z = Math.random() * Math.PI;
    group.add(ring);
    sandRipples.push(ring);
  }

  // 7.2 Vintage anchor partially buried
  const vintageAnchor = new THREE.Group();
  // Top ring
  const vaRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.35, 0.08, 8, 18),
    new THREE.MeshBasicMaterial({ color: 0x554433 })
  );
  vaRing.position.y = 1.4;
  vintageAnchor.add(vaRing);
  // Shaft
  const vaShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 1.6, 10),
    new THREE.MeshBasicMaterial({ color: 0x554433 })
  );
  vaShaft.position.y = 0.5;
  vintageAnchor.add(vaShaft);
  // Crossbar
  const vaCross = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.9, 8),
    new THREE.MeshBasicMaterial({ color: 0x554433 })
  );
  vaCross.position.set(0, 1.05, 0);
  vaCross.rotation.z = Math.PI / 2;
  vintageAnchor.add(vaCross);
  // Flukes (curved bottom hooks) — torus halves
  for (let s = -1; s <= 1; s += 2) {
    const fluke = new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.08, 6, 14, Math.PI),
      new THREE.MeshBasicMaterial({ color: 0x554433 })
    );
    fluke.position.set(s * 0.32, -0.32, 0);
    fluke.rotation.z = s > 0 ? -Math.PI / 2 : Math.PI / 2;
    vintageAnchor.add(fluke);
  }
  vintageAnchor.position.set(5, -2.0, -10);
  vintageAnchor.rotation.z = 0.4;
  vintageAnchor.rotation.y = 0.6;
  group.add(vintageAnchor);

  // 7.3 Pelican on a piling
  const piling = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.3, 3.0, 10),
    new THREE.MeshBasicMaterial({ color: 0x6a4f2a })
  );
  piling.position.set(-7, 1.5, 6);
  group.add(piling);
  const pelicanGroup = new THREE.Group();
  const pBody = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 14, 10),
    new THREE.MeshBasicMaterial({ color: 0xeeeeee })
  );
  pBody.scale.set(1.4, 1.0, 0.85);
  pelicanGroup.add(pBody);
  const pHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0xeeeeee })
  );
  pHead.position.set(0.45, 0.2, 0);
  pelicanGroup.add(pHead);
  const pBeak = new THREE.Mesh(
    new THREE.ConeGeometry(0.08, 0.4, 8),
    new THREE.MeshBasicMaterial({ color: 0xffaa55 })
  );
  pBeak.position.set(0.78, 0.18, 0);
  pBeak.rotation.z = -Math.PI / 2;
  pelicanGroup.add(pBeak);
  // Folded wings (2 small triangles)
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(-0.5, 0.05);
  wingShape.lineTo(-0.3, -0.2);
  wingShape.lineTo(0, 0);
  for (let s = -1; s <= 1; s += 2) {
    const wing = new THREE.Mesh(
      new THREE.ShapeGeometry(wingShape),
      new THREE.MeshBasicMaterial({ color: 0xbbbbbb, side: THREE.DoubleSide, transparent: true, opacity: 0.95 })
    );
    wing.position.set(-0.05, 0, s * 0.32);
    wing.rotation.y = s * 0.05;
    pelicanGroup.add(wing);
  }
  pelicanGroup.position.set(-7, 3.2, 6);
  group.add(pelicanGroup);

  // 7.4 Sea horses near coral reef
  const seahorses = [];
  for (let i = 0; i < 3; i++) {
    const sh = new THREE.Group();
    const shBody = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffaa44, transparent: true, opacity: 0.9 })
    );
    shBody.scale.set(0.55, 1.0, 0.5);
    sh.add(shBody);
    const shHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffbb55, transparent: true, opacity: 0.9 })
    );
    shHead.position.set(0.06, 0.18, 0);
    sh.add(shHead);
    // Curled tail (cylinder bent via rotation)
    const shTail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.02, 0.32, 6),
      new THREE.MeshBasicMaterial({ color: 0xee9933, transparent: true, opacity: 0.9 })
    );
    shTail.position.set(-0.04, -0.20, 0);
    shTail.rotation.z = 0.5;
    sh.add(shTail);
    // Dorsal fin
    const shFin = new THREE.Mesh(
      new THREE.PlaneGeometry(0.1, 0.18),
      new THREE.MeshBasicMaterial({ color: 0xffcc66, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
    );
    shFin.position.set(-0.1, 0, 0);
    sh.add(shFin);
    const ang = i * (Math.PI * 2 / 3) + 0.3;
    const baseR = 12.0;
    sh.userData.baseX = Math.cos(ang) * baseR;
    sh.userData.baseZ = Math.sin(ang) * baseR;
    sh.userData.baseY = -1.0 + i * 0.15;
    sh.userData.phase = Math.random() * Math.PI * 2;
    sh.position.set(sh.userData.baseX, sh.userData.baseY, sh.userData.baseZ);
    group.add(sh);
    seahorses.push(sh);
  }

  // 7.5 Pirate ghost ship — translucent green, sails far away
  const ghostShip = new THREE.Group();
  const ghostMat = new THREE.MeshBasicMaterial({ color: 0x88ffaa, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  // Hull
  const ghostHull = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 0.55, 0.7),
    ghostMat
  );
  ghostHull.position.y = 0.3;
  ghostShip.add(ghostHull);
  // Hull bow taper (small wedge)
  const ghostBow = new THREE.Mesh(
    new THREE.ConeGeometry(0.45, 0.9, 4),
    ghostMat
  );
  ghostBow.rotation.z = -Math.PI / 2;
  ghostBow.position.set(1.65, 0.3, 0);
  ghostShip.add(ghostBow);
  // Two masts
  for (let m = -1; m <= 1; m += 2) {
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 2.4, 6),
      ghostMat
    );
    mast.position.set(m * 0.55, 1.5, 0);
    ghostShip.add(mast);
    // Sail (billowing rectangle)
    const sail = new THREE.Mesh(
      new THREE.PlaneGeometry(0.95, 1.5),
      ghostMat
    );
    sail.position.set(m * 0.55, 1.4, 0);
    sail.rotation.y = 0.05;
    ghostShip.add(sail);
  }
  // Glow halo
  const ghostHalo = new THREE.Mesh(
    new THREE.SphereGeometry(2.2, 18, 12),
    new THREE.MeshBasicMaterial({ color: 0x88ffaa, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending })
  );
  ghostHalo.position.y = 1.0;
  ghostShip.add(ghostHalo);
  ghostShip.scale.setScalar(1.4);
  group.add(ghostShip);

  // 7.6 Jumping dolphins — pair making synchronized arcs
  const dolphins = [];
  for (let d = 0; d < 2; d++) {
    const dolph = new THREE.Group();
    const dBody = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 14, 10),
      new THREE.MeshBasicMaterial({ color: 0xbbccdd })
    );
    dBody.scale.set(1.5, 0.5, 0.5);
    dolph.add(dBody);
    const dDorsal = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.25, 4),
      new THREE.MeshBasicMaterial({ color: 0xaabbcc })
    );
    dDorsal.position.set(0, 0.18, 0);
    dolph.add(dDorsal);
    const dTail = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.04, 0.32),
      new THREE.MeshBasicMaterial({ color: 0xaabbcc })
    );
    dTail.position.set(-0.6, 0, 0);
    dolph.add(dTail);
    dolph.userData.offset = d * 1.2;
    dolph.position.set(0, -0.3, 18);
    group.add(dolph);
    dolphins.push(dolph);
  }

  // 7.7 Distant fog bank
  const fogBank = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 8),
    new THREE.MeshBasicMaterial({ color: 0xddddee, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false })
  );
  fogBank.position.set(0, 2.5, -25);
  group.add(fogBank);

  // 7.8 Shooting star over Anchorage (single point + trail group)
  const shootingStar = new THREE.Group();
  const ssMain = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffee, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending })
  );
  shootingStar.add(ssMain);
  const ssTrailMeshes = [];
  for (let i = 0; i < 10; i++) {
    const tm = new THREE.Mesh(
      new THREE.SphereGeometry(0.12 - i * 0.008, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffee, transparent: true, opacity: 0.6 - i * 0.05, blending: THREE.AdditiveBlending })
    );
    shootingStar.add(tm);
    ssTrailMeshes.push(tm);
  }
  shootingStar.visible = false;
  group.add(shootingStar);

  // 7.9 Sea spray particles trailing the sailboat
  const SPRAY_COUNT = 30;
  const sprayPositions = new Float32Array(SPRAY_COUNT * 3);
  const sprayLifetimes = new Float32Array(SPRAY_COUNT);
  for (let i = 0; i < SPRAY_COUNT; i++) {
    sprayPositions[i * 3] = 0;
    sprayPositions[i * 3 + 1] = 0.1;
    sprayPositions[i * 3 + 2] = 0;
    sprayLifetimes[i] = Math.random() * 1.5;
  }
  const sprayGeom = new THREE.BufferGeometry();
  sprayGeom.setAttribute('position', new THREE.BufferAttribute(sprayPositions, 3));
  const spray = new THREE.Points(
    sprayGeom,
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.08, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  group.add(spray);

  // mark all child meshes as part of the world for raycasting
  group.traverse(obj => {
    if (obj.isMesh) {
      obj.userData.isWorld = true;
      obj.userData.name = group.userData.name;
      obj.userData.url = group.userData.url;
    }
  });


  // ===== v8 features =====

  // Mermaid silhouette on rocks at (-7, 0.8, -8)
  const mermaid = new THREE.Group();
  mermaid.position.set(-7.4, 0.7, -8.1);
  const mermaidMat = new THREE.MeshBasicMaterial({ color: 0x081428, transparent: true, opacity: 0.78 });
  const mermaidTorso = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10), mermaidMat);
  mermaidTorso.scale.set(0.7, 1.2, 0.55);
  mermaidTorso.position.set(0, 0.5, 0);
  mermaid.add(mermaidTorso);
  const mermaidHead = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), mermaidMat);
  mermaidHead.position.set(0.04, 1.05, 0);
  mermaid.add(mermaidHead);
  const mermaidHair = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), new THREE.MeshBasicMaterial({ color: 0x4a2818, transparent: true, opacity: 0.7 }));
  mermaidHair.scale.set(1.1, 1.2, 0.7);
  mermaidHair.position.set(-0.06, 1.04, -0.05);
  mermaid.add(mermaidHair);
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.2, 0),
    new THREE.Vector3(0.18, -0.1, 0.05),
    new THREE.Vector3(0.42, -0.32, 0.1),
    new THREE.Vector3(0.7, -0.5, 0.0),
    new THREE.Vector3(0.95, -0.55, -0.15),
  ]);
  const tailGeom = new THREE.TubeGeometry(tailCurve, 24, 0.18, 8, false);
  const tailMesh = new THREE.Mesh(tailGeom, new THREE.MeshBasicMaterial({ color: 0x0a1a36, transparent: true, opacity: 0.82 }));
  mermaid.add(tailMesh);
  const tailFin = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.5, 8), new THREE.MeshBasicMaterial({ color: 0x0a1a36, transparent: true, opacity: 0.78 }));
  tailFin.scale.set(1, 0.4, 1.2);
  tailFin.position.set(1.05, -0.5, -0.18);
  tailFin.rotation.z = Math.PI / 2.4;
  mermaid.add(tailFin);
  group.add(mermaid);

  // Lobster trap on seabed with rope to bobbing surface buoy
  const trapGroup = new THREE.Group();
  const trapBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.5, 0.6),
    new THREE.MeshBasicMaterial({ color: 0x6b4f2a, wireframe: true, transparent: true, opacity: 0.85 })
  );
  trapBox.position.set(0, 0, 0);
  trapGroup.add(trapBox);
  const trapBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 0.05, 0.65),
    new THREE.MeshBasicMaterial({ color: 0x3a2814, transparent: true, opacity: 0.9 })
  );
  trapBase.position.set(0, -0.25, 0);
  trapGroup.add(trapBase);
  trapGroup.position.set(15.5, -3.4, -2.6);
  group.add(trapGroup);
  // Rope from trap to buoy
  const ropeCurve = new THREE.LineCurve3(
    new THREE.Vector3(15.5, -3.2, -2.6),
    new THREE.Vector3(15.7, 0.1, -2.4)
  );
  const ropeGeom = new THREE.TubeGeometry(ropeCurve, 1, 0.025, 6, false);
  const rope = new THREE.Mesh(ropeGeom, new THREE.MeshBasicMaterial({ color: 0x8a7048 }));
  group.add(rope);
  // Surface buoy (bobbing)
  const lobsterBuoy = new THREE.Group();
  const lobsterBuoyBody = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xff5533 })
  );
  lobsterBuoy.add(lobsterBuoyBody);
  const buoyStripe = new THREE.Mesh(
    new THREE.TorusGeometry(0.22, 0.05, 8, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  buoyStripe.rotation.x = Math.PI / 2;
  lobsterBuoy.add(buoyStripe);
  lobsterBuoy.position.set(15.7, 0.1, -2.4);
  group.add(lobsterBuoy);

  // Bioluminescent jellies (3) — translucent domes with trailing tentacles
  const jellies = [];
  const jellyData = [
    { x: -3.5, baseY: -0.6, z: 7, color: 0x88ddff, scale: 1.0, phase: 0 },
    { x: 4.2, baseY: -0.9, z: 5.5, color: 0xffaaee, scale: 0.85, phase: 1.7 },
    { x: -1.5, baseY: -1.1, z: 9.5, color: 0xaaffcc, scale: 1.15, phase: 3.4 },
  ];
  jellyData.forEach((d) => {
    const jelly = new THREE.Group();
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.4 * d.scale, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: d.color, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending })
    );
    jelly.add(dome);
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.55 * d.scale, 12, 10),
      new THREE.MeshBasicMaterial({ color: d.color, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending })
    );
    jelly.add(halo);
    // Tentacles — 5 vertical lines below dome
    const tentaclesGroup = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const ang = (i / 5) * Math.PI * 2;
      const ox = Math.cos(ang) * 0.18 * d.scale;
      const oz = Math.sin(ang) * 0.18 * d.scale;
      const tcurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(ox, 0, oz),
        new THREE.Vector3(ox * 1.1, -0.25 * d.scale, oz * 1.1),
        new THREE.Vector3(ox * 0.9, -0.5 * d.scale, oz * 0.9),
        new THREE.Vector3(ox * 1.2, -0.8 * d.scale, oz * 1.2),
      ]);
      const tgeom = new THREE.TubeGeometry(tcurve, 8, 0.012, 5, false);
      const tmesh = new THREE.Mesh(tgeom, new THREE.MeshBasicMaterial({
        color: d.color, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending
      }));
      tentaclesGroup.add(tmesh);
    }
    jelly.add(tentaclesGroup);
    jelly.position.set(d.x, d.baseY, d.z);
    jelly.userData = { baseY: d.baseY, phase: d.phase, scale: d.scale };
    group.add(jelly);
    jellies.push(jelly);
  });

  // Moon with halo above lighthouse
  const moonGroup = new THREE.Group();
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(1.4, 24, 18),
    new THREE.MeshBasicMaterial({ color: 0xfff4d0, transparent: true, opacity: 0.92 })
  );
  moonGroup.add(moon);
  const moonHalo = new THREE.Mesh(
    new THREE.RingGeometry(1.7, 2.4, 64),
    new THREE.MeshBasicMaterial({ color: 0xffffe0, transparent: true, opacity: 0.18, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
  );
  moonHalo.rotation.x = Math.PI / 2;
  moonGroup.add(moonHalo);
  const moonGlow = new THREE.Mesh(
    new THREE.SphereGeometry(2.2, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xffffe0, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending })
  );
  moonGroup.add(moonGlow);
  moonGroup.position.set(-12, 14, -16);
  group.add(moonGroup);

  // Distant island mountain silhouette at (28, ?, -22)
  const islandMtn = new THREE.Mesh(
    new THREE.ConeGeometry(7, 11, 24),
    new THREE.MeshBasicMaterial({ color: 0x12182a, transparent: true, opacity: 0.92 })
  );
  islandMtn.position.set(28, 3.5, -22);
  islandMtn.scale.set(1, 1, 0.5);
  group.add(islandMtn);
  const islandMtn2 = new THREE.Mesh(
    new THREE.ConeGeometry(4.5, 7, 18),
    new THREE.MeshBasicMaterial({ color: 0x0e1428, transparent: true, opacity: 0.9 })
  );
  islandMtn2.position.set(34, 1.5, -20);
  islandMtn2.scale.set(1, 1, 0.55);
  group.add(islandMtn2);
  const islandSnow = new THREE.Mesh(
    new THREE.ConeGeometry(2.4, 3.5, 18),
    new THREE.MeshBasicMaterial({ color: 0xddeeff, transparent: true, opacity: 0.55 })
  );
  islandSnow.position.set(28, 7.4, -22);
  islandSnow.scale.set(1, 1, 0.5);
  group.add(islandSnow);

  // Foghorn ring pulse from lighthouse — emerges every ~7s
  const foghornRing = new THREE.Mesh(
    new THREE.RingGeometry(0.6, 0.7, 64),
    new THREE.MeshBasicMaterial({ color: 0xfff4c8, transparent: true, opacity: 0.0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
  );
  foghornRing.rotation.x = Math.PI / 2;
  foghornRing.position.set(0, 5.2, 0); // lighthouse approx position relative to group; will be set in update
  group.add(foghornRing);

  // Mermaid hair gentle sway state
  let foghornCycle = 0;

  // ====================================================================
  // ANCHORAGE v9 — Sea monster, message in a bottle, lighthouse keeper, crab,
  // patrol drone, lantern halo, treasure clue parchment, drifting log
  // ====================================================================

  // 1) Sea monster (loch ness style) — head + 5 humps tracing an ellipse
  const monsterGroup = new THREE.Group();
  const monsterMat = new THREE.MeshStandardMaterial({ color: 0x1a4a2a, emissive: 0x0a2a14, roughness: 0.55 });
  const monsterParts = [];
  // head
  const monsterHead = new THREE.Mesh(new THREE.SphereGeometry(0.95, 18, 14), monsterMat);
  monsterHead.scale.set(1.2, 0.85, 1.4);
  monsterGroup.add(monsterHead);
  monsterParts.push({ mesh: monsterHead, phase: 0.0, baseScaleY: 0.85 });
  // 5 humps trailing
  for (let i = 0; i < 5; i++) {
    const r = 0.78 - i * 0.08;
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), monsterMat);
    m.scale.set(1.0, 0.7, 1.0);
    monsterGroup.add(m);
    monsterParts.push({ mesh: m, phase: 0.5 + i * 0.45, baseScaleY: 0.7 });
  }
  // glowing eyes on head
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffeeaa, transparent: true, opacity: 0.9 });
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), eyeMat);
  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), eyeMat);
  eyeL.position.set(0.45, 0.32, 0.95);
  eyeR.position.set(-0.45, 0.32, 0.95);
  monsterHead.add(eyeL); monsterHead.add(eyeR);
  // tiny "spout" sprite above head when surfacing
  const monsterSpoutMat = new THREE.SpriteMaterial({ color: 0xddeeff, transparent: true, opacity: 0.55, depthWrite: false });
  const monsterSpout = new THREE.Sprite(monsterSpoutMat);
  monsterSpout.scale.set(2.4, 2.4, 1);
  monsterSpout.position.set(0, 1.6, 0);
  monsterHead.add(monsterSpout);
  group.add(monsterGroup);

  // 2) Message in a bottle — small glass capsule drifting
  const bottleGroup = new THREE.Group();
  const bottleBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.55, 12, 1, true),
    new THREE.MeshPhysicalMaterial({ color: 0x88aacc, transparent: true, opacity: 0.55, roughness: 0.18, transmission: 0.6, thickness: 0.2 })
  );
  bottleBody.rotation.z = Math.PI / 2;
  bottleGroup.add(bottleBody);
  const bottleNeck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.12, 0.18, 10),
    bottleBody.material
  );
  bottleNeck.rotation.z = Math.PI / 2;
  bottleNeck.position.x = -0.36;
  bottleGroup.add(bottleNeck);
  const bottleCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.075, 0.06, 8),
    new THREE.MeshStandardMaterial({ color: 0x3b2818, roughness: 0.95 })
  );
  bottleCap.rotation.z = Math.PI / 2;
  bottleCap.position.x = -0.46;
  bottleGroup.add(bottleCap);
  const bottleScroll = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.32, 8),
    new THREE.MeshStandardMaterial({ color: 0xf0e2b8, roughness: 0.85, emissive: 0x2a1f10 })
  );
  bottleScroll.rotation.z = Math.PI / 2;
  bottleGroup.add(bottleScroll);
  bottleGroup.position.set(11, 0.05, 6);
  group.add(bottleGroup);

  // 3) Lighthouse keeper — small figure on the lighthouse upper balcony
  const keeperGroup = new THREE.Group();
  const keeperBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.28, 0.85, 10),
    new THREE.MeshStandardMaterial({ color: 0x223b5c, roughness: 0.85 })
  );
  keeperBody.position.y = 0.43;
  keeperGroup.add(keeperBody);
  const keeperHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xe9c8a4, roughness: 0.7 })
  );
  keeperHead.position.y = 1.02;
  keeperGroup.add(keeperHead);
  const keeperHat = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 0.16, 10),
    new THREE.MeshStandardMaterial({ color: 0x1a2a40, roughness: 0.9 })
  );
  keeperHat.position.y = 1.22;
  keeperGroup.add(keeperHat);
  // lantern in hand
  const keeperLantern = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.32, 0.22),
    new THREE.MeshStandardMaterial({ color: 0x3a2a18, emissive: 0xffaa44, emissiveIntensity: 0.85, roughness: 0.7 })
  );
  keeperLantern.position.set(0.45, 0.55, 0);
  keeperGroup.add(keeperLantern);
  const keeperLanternLight = new THREE.PointLight(0xffcc88, 0.9, 8, 2);
  keeperLanternLight.position.set(0.45, 0.6, 0);
  keeperGroup.add(keeperLanternLight);
  const keeperLanternHaloMat = new THREE.SpriteMaterial({ color: 0xffd58a, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending });
  const keeperLanternHalo = new THREE.Sprite(keeperLanternHaloMat);
  keeperLanternHalo.position.set(0.45, 0.6, 0);
  keeperLanternHalo.scale.set(1.6, 1.6, 1);
  keeperGroup.add(keeperLanternHalo);
  // place keeper on the lighthouse balcony — lighthouse is at (0,0,0) approx in this group; balcony at y~6.0
  keeperGroup.position.set(0.6, 6.0, 0.0);
  // face slightly outward from the lighthouse, toward open water (+z)
  keeperGroup.rotation.y = -Math.PI / 4;
  group.add(keeperGroup);

  // 4) Crab on a piling — small crab + 6 legs walking
  const crabGroup = new THREE.Group();
  const crabBody = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 14, 10),
    new THREE.MeshStandardMaterial({ color: 0xc14a2a, roughness: 0.55, emissive: 0x4a1208 })
  );
  crabBody.scale.set(1.0, 0.55, 1.4);
  crabGroup.add(crabBody);
  // 2 claws
  for (let s = 0; s < 2; s++) {
    const claw = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 10, 8),
      crabBody.material
    );
    claw.position.set(s === 0 ? 0.3 : -0.3, 0, 0.45);
    crabGroup.add(claw);
  }
  // 6 legs (thin cylinders)
  const legParts = [];
  for (let i = 0; i < 6; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const idx = Math.floor(i / 2);
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.32, 5),
      new THREE.MeshStandardMaterial({ color: 0x801c0c, roughness: 0.7 })
    );
    leg.position.set(side * 0.32, -0.05, (idx - 1) * 0.18);
    leg.rotation.z = side * (Math.PI / 4);
    legParts.push({ mesh: leg, phase: i * 0.6, side });
    crabGroup.add(leg);
  }
  crabGroup.position.set(-3.2, 1.1, 5.4); // on top of one of the seabed pilings
  group.add(crabGroup);

  // 5) Patrol drone — small disk with rotor halos orbiting the harbor at altitude
  const droneGroup = new THREE.Group();
  const droneBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, 0.18, 14),
    new THREE.MeshStandardMaterial({ color: 0x2a3036, metalness: 0.55, roughness: 0.4, emissive: 0x111111 })
  );
  droneGroup.add(droneBody);
  // 4 propeller halos (flat thin rings)
  const droneRotors = [];
  const armOffsets = [[0.55, 0, 0.55], [-0.55, 0, 0.55], [0.55, 0, -0.55], [-0.55, 0, -0.55]];
  armOffsets.forEach((o) => {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.14, 0.18, 18),
      new THREE.MeshBasicMaterial({ color: 0x88ddff, transparent: true, opacity: 0.55, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(o[0], 0.05, o[2]);
    droneRotors.push(ring);
    droneGroup.add(ring);
  });
  // status LED on bottom
  const droneLed = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xff4488 })
  );
  droneLed.position.y = -0.13;
  droneGroup.add(droneLed);
  group.add(droneGroup);

  // 6) Treasure clue parchment — floating sprite with stylized "X marks the spot" text
  const clueCanvas = document.createElement('canvas');
  clueCanvas.width = 512; clueCanvas.height = 256;
  {
    const ctx = clueCanvas.getContext('2d');
    // parchment background
    const grd = ctx.createRadialGradient(256, 128, 40, 256, 128, 260);
    grd.addColorStop(0, '#f3e2b6');
    grd.addColorStop(0.7, '#dec07b');
    grd.addColorStop(1, '#9c7a3c');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, 512, 256);
    // torn edges (rough)
    ctx.strokeStyle = '#7a5a1f'; ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, 496, 240);
    ctx.fillStyle = '#3a2810';
    ctx.font = "bold italic 38px Georgia, serif";
    ctx.textAlign = 'center';
    ctx.fillText('Captain\u2019s Log', 256, 60);
    ctx.font = "italic 22px Georgia, serif";
    ctx.fillText('Past the lobster trap, beyond the kelp,', 256, 110);
    ctx.fillText('count seven swells and dive where', 256, 142);
    ctx.fillText('the moon\u2019s reflection breaks.', 256, 174);
    ctx.fillStyle = '#a01818';
    ctx.font = "bold 56px serif";
    ctx.fillText('X', 256, 232);
  }
  const clueTex = new THREE.CanvasTexture(clueCanvas);
  const clueMat = new THREE.SpriteMaterial({ map: clueTex, transparent: true, opacity: 0.95, depthWrite: false });
  const clueSprite = new THREE.Sprite(clueMat);
  clueSprite.scale.set(3.4, 1.7, 1);
  clueSprite.position.set(7.5, 0.6, -7.0);
  group.add(clueSprite);

  // 7) Drifting log — a cedar trunk floating in the surf
  const logGroup = new THREE.Group();
  const logTrunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36, 0.34, 4.4, 12),
    new THREE.MeshStandardMaterial({ color: 0x6b4a2c, roughness: 0.9, emissive: 0x150e08 })
  );
  logTrunk.rotation.z = Math.PI / 2;
  logGroup.add(logTrunk);
  // small bark stub on top
  for (let i = 0; i < 3; i++) {
    const stub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.08, 0.45, 6),
      new THREE.MeshStandardMaterial({ color: 0x4a3018, roughness: 0.95 })
    );
    stub.position.set(-1.4 + i * 1.4, 0.34, 0);
    logGroup.add(stub);
  }
  logGroup.position.set(-9, 0.22, 4);
  group.add(logGroup);

  // V9 timing state
  let monsterCycle = 0;       // seconds; full surface/submerge ~26s
  let droneOrbitT = 0;

  let t = 0;
  // --- ANCHORAGE v10 ----------------------------------------------------
  // Narrative panel for the treasure clue, sea otter family, fisherman in
  // dinghy with rod, sand castle on shoreline, distant whale fluke, tide.
  // ---------------------------------------------------------------------

  // 1) Narrative panel for treasure clue (small driftwood-styled board on
  //    a stake, beside the parchment so visitors can read the lore).
  const narrativeGroup = new THREE.Group();
  narrativeGroup.position.set(7.5, 0.0, -7.0);
  group.add(narrativeGroup);
  {
    // stake
    const stake = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 1.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x6e4a2a, roughness: 0.9 })
    );
    stake.position.y = 0.7;
    narrativeGroup.add(stake);
    // panel canvas
    const panelCanvas = document.createElement('canvas');
    panelCanvas.width = 512; panelCanvas.height = 320;
    const pctx = panelCanvas.getContext('2d');
    pctx.fillStyle = 'rgba(34,22,12,0.92)';
    pctx.fillRect(0, 0, 512, 320);
    pctx.strokeStyle = '#c9a86a';
    pctx.lineWidth = 5;
    pctx.strokeRect(6, 6, 500, 308);
    pctx.fillStyle = '#f5e2b6';
    pctx.font = 'italic bold 30px Georgia';
    pctx.textAlign = 'center';
    pctx.fillText("Captain Halloran's Bequest", 256, 52);
    pctx.font = '20px Georgia';
    pctx.fillStyle = '#e8d8b0';
    const lines = [
      'In 1847 the schooner Halcyon foundered',
      'off this coast in a winter gale. Three',
      'crates of brass instruments were lost',
      'to the deep — sextant, compass, glass.',
      '',
      "Locals say the captain's ghost still",
      'walks the foredeck on moonless nights,',
      'searching for the bearings he could',
      'not take. Listen for the bell buoy.',
    ];
    lines.forEach((line, i) => pctx.fillText(line, 256, 92 + i * 24));
    const panelTex = new THREE.CanvasTexture(panelCanvas);
    panelTex.colorSpace = THREE.SRGBColorSpace;
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 1.5),
      new THREE.MeshBasicMaterial({ map: panelTex, transparent: true, side: THREE.DoubleSide })
    );
    panel.position.y = 1.6;
    panel.rotation.y = -0.35;
    narrativeGroup.add(panel);
  }

  // 2) Sea otter family — three otters drifting on their backs near rocks
  const otterFamily = [];
  {
    const positions = [
      [-9.0, -0.3, -10.0, 0.0],
      [-8.2, -0.3, -10.6, 0.6],
      [-9.6, -0.3,  -9.4, 1.2],
    ];
    positions.forEach((p, i) => {
      const og = new THREE.Group();
      og.position.set(p[0], p[1], p[2]);
      og.userData.phase = p[3];
      // body (capsule-ish)
      const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.32 - i * 0.06, 0.7 - i * 0.1, 4, 8),
        new THREE.MeshStandardMaterial({ color: 0x7a5230, roughness: 0.9 })
      );
      body.rotation.z = Math.PI / 2;
      og.add(body);
      // belly
      const belly = new THREE.Mesh(
        new THREE.SphereGeometry(0.28 - i * 0.05, 12, 8),
        new THREE.MeshStandardMaterial({ color: 0xb59673, roughness: 0.9 })
      );
      belly.position.y = 0.18;
      belly.scale.set(1.6, 0.5, 0.7);
      og.add(belly);
      // head
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.22 - i * 0.04, 12, 10),
        new THREE.MeshStandardMaterial({ color: 0x6a4524, roughness: 0.9 })
      );
      head.position.set(0.55 - i * 0.05, 0.2, 0);
      og.add(head);
      // little paws holding a clam (only adults)
      if (i < 2) {
        const clam = new THREE.Mesh(
          new THREE.SphereGeometry(0.09, 10, 8),
          new THREE.MeshStandardMaterial({ color: 0xd9c08a, roughness: 0.6 })
        );
        clam.position.set(-0.05, 0.34, 0);
        clam.scale.set(1.0, 0.55, 1.0);
        og.add(clam);
      }
      group.add(og);
      otterFamily.push(og);
    });
  }

  // 3) Fisherman in a small dinghy with a rod (cast line into water)
  const dinghyGroup = new THREE.Group();
  dinghyGroup.position.set(-15.0, 0.05, 9.0);
  group.add(dinghyGroup);
  {
    const hull = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.85, 2.6, 12, 1, false, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x8a4a26, roughness: 0.85 })
    );
    hull.rotation.z = Math.PI / 2;
    hull.rotation.y = Math.PI / 2;
    dinghyGroup.add(hull);
    // gunwale rim
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.78, 0.05, 6, 24),
      new THREE.MeshStandardMaterial({ color: 0x5a3018, roughness: 0.9 })
    );
    rim.rotation.x = Math.PI / 2;
    rim.scale.set(1.6, 1.0, 0.7);
    rim.position.y = 0.05;
    dinghyGroup.add(rim);
    // bench
    const bench = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.08, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x3a2818 })
    );
    bench.position.y = 0.05;
    dinghyGroup.add(bench);
    // fisherman body
    const fishBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.22, 0.6, 10),
      new THREE.MeshStandardMaterial({ color: 0x335577, roughness: 0.85 })
    );
    fishBody.position.set(-0.2, 0.45, 0);
    dinghyGroup.add(fishBody);
    // head with cap
    const fishHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0xe0b894, roughness: 0.85 })
    );
    fishHead.position.set(-0.2, 0.85, 0);
    dinghyGroup.add(fishHead);
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xaa3333, roughness: 0.85 })
    );
    cap.position.set(-0.2, 0.94, 0);
    dinghyGroup.add(cap);
    // rod
    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.025, 1.6, 6),
      new THREE.MeshStandardMaterial({ color: 0x2a1a0f, roughness: 0.6 })
    );
    rod.position.set(0.4, 1.0, 0.2);
    rod.rotation.z = -1.0;
    rod.rotation.x = 0.2;
    dinghyGroup.add(rod);
    // line (simple thin geometry)
    const linePts = [
      new THREE.Vector3(0.4 + Math.cos(-1.0) * 0.8, 1.0 + Math.sin(-1.0) * 0.8, 0.2),
      new THREE.Vector3(2.6, 0.0, 0.2),
    ];
    const lineGeo = new THREE.BufferGeometry().setFromPoints(linePts);
    const lineMat = new THREE.LineBasicMaterial({ color: 0xeeeeee, transparent: true, opacity: 0.6 });
    const fishLine = new THREE.Line(lineGeo, lineMat);
    dinghyGroup.add(fishLine);
    // bobber (small red sphere on water)
    const bobber = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xff3322, emissive: 0xaa1100, emissiveIntensity: 0.3 })
    );
    bobber.position.set(2.6, 0.0, 0.2);
    dinghyGroup.add(bobber);
    dinghyGroup.userData.bobber = bobber;
    dinghyGroup.userData.fishLine = fishLine;
    dinghyGroup.userData.linePts = linePts;
  }

  // 4) Sand castle on shoreline (small turret cluster + flag)
  const castleGroup = new THREE.Group();
  castleGroup.position.set(11.5, 0.05, 11.5);
  group.add(castleGroup);
  {
    const sandMat = new THREE.MeshStandardMaterial({ color: 0xd9c08a, roughness: 1.0 });
    // base
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 1.4), sandMat);
    base.position.y = 0.18;
    castleGroup.add(base);
    // turrets
    const turretPositions = [[-0.55, 0, -0.55], [0.55, 0, -0.55], [-0.55, 0, 0.55], [0.55, 0, 0.55]];
    turretPositions.forEach(([tx, _ty, tz]) => {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.55, 10), sandMat);
      t.position.set(tx, 0.55, tz);
      castleGroup.add(t);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.26, 10), sandMat);
      cone.position.set(tx, 0.95, tz);
      castleGroup.add(cone);
    });
    // central tower
    const ctower = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.9, 12), sandMat);
    ctower.position.y = 0.85;
    castleGroup.add(ctower);
    // flag pole
    const fpole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.6, 6),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    fpole.position.y = 1.6;
    castleGroup.add(fpole);
    // flag
    const flag = new THREE.Mesh(
      new THREE.PlaneGeometry(0.32, 0.18),
      new THREE.MeshStandardMaterial({ color: 0xff5544, side: THREE.DoubleSide })
    );
    flag.position.set(0.16, 1.78, 0);
    castleGroup.add(flag);
    castleGroup.userData.flag = flag;
    // door
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.28, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x3a2818 })
    );
    door.position.set(0, 0.5, 0.3);
    castleGroup.add(door);
    // little starfish next to it
    const starShape = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const r = i % 2 === 0 ? 0.18 : 0.08;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (i === 0) starShape.moveTo(x, y); else starShape.lineTo(x, y);
    }
    starShape.closePath();
    const starGeo = new THREE.ShapeGeometry(starShape);
    const starMesh = new THREE.Mesh(starGeo, new THREE.MeshStandardMaterial({ color: 0xffaa55, side: THREE.DoubleSide }));
    starMesh.rotation.x = -Math.PI / 2;
    starMesh.position.set(1.0, 0.02, 0.4);
    castleGroup.add(starMesh);
  }

  // 5) Distant whale fluke breach (occasional surface event in far water)
  const flukeGroup = new THREE.Group();
  flukeGroup.position.set(-22, -3.0, -16);
  flukeGroup.scale.set(2.6, 2.6, 2.6);
  flukeGroup.visible = false;
  group.add(flukeGroup);
  {
    const flukeMat = new THREE.MeshStandardMaterial({ color: 0x1a2a3a, roughness: 0.7 });
    // dorsal (small fin first)
    const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.55, 6), flukeMat);
    dorsal.position.set(-0.6, 0.0, 0);
    dorsal.rotation.x = Math.PI / 2;
    flukeGroup.add(dorsal);
    // tail stem (vertical)
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.4, 8), flukeMat);
    stem.position.set(0.6, 0.5, 0);
    stem.rotation.z = -0.2;
    flukeGroup.add(stem);
    // fluke tail (two flat lobes)
    const fluke = new THREE.Group();
    fluke.position.set(0.7, 1.2, 0);
    const lobe1 = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.9, 4), flukeMat);
    lobe1.scale.set(1.0, 1.0, 0.18);
    lobe1.rotation.z = -1.05;
    lobe1.position.set(-0.45, 0.0, 0);
    fluke.add(lobe1);
    const lobe2 = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.9, 4), flukeMat);
    lobe2.scale.set(1.0, 1.0, 0.18);
    lobe2.rotation.z = 1.05;
    lobe2.position.set(0.45, 0.0, 0);
    fluke.add(lobe2);
    flukeGroup.add(fluke);
    flukeGroup.userData.fluke = fluke;
    flukeGroup.userData.cycle = 0;
  }


  // --- ANCHORAGE v11 ----------------------------------------------------
  // Orca pod (three orcas in formation), low fog bank rolling across the
  // bay, and a flock of seabirds circling the lighthouse.
  // ---------------------------------------------------------------------

  // 1) Orca pod — three orcas swimming together in a loose formation that
  //    slowly circles the bay. Each surfaces and dives on its own phase.
  const orcaPod = [];
  {
    const orcaMatBlack = new THREE.MeshStandardMaterial({ color: 0x111418, roughness: 0.55, metalness: 0.0 });
    const orcaMatWhite = new THREE.MeshStandardMaterial({ color: 0xeef0f2, roughness: 0.6, metalness: 0.0 });
    const offsets = [
      { ang: 0.0, r: 16.5, ph: 0.0, scale: 1.0 },
      { ang: 0.5, r: 17.5, ph: 1.7, scale: 0.85 }, // calf-ish
      { ang: -0.55, r: 17.0, ph: 3.1, scale: 0.95 },
    ];
    offsets.forEach((o) => {
      const og = new THREE.Group();
      // body
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.85, 14, 10), orcaMatBlack);
      body.scale.set(2.6, 0.85, 1.0);
      og.add(body);
      // white belly patch
      const belly = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 8), orcaMatWhite);
      belly.scale.set(2.0, 0.55, 0.7);
      belly.position.y = -0.25;
      og.add(belly);
      // white eye-patch (just a small ellipsoid behind the eye)
      const eyeP = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), orcaMatWhite);
      eyeP.scale.set(1.0, 0.6, 0.6);
      eyeP.position.set(1.2, 0.2, 0.45);
      og.add(eyeP);
      const eyeP2 = eyeP.clone();
      eyeP2.position.z = -0.45;
      og.add(eyeP2);
      // dorsal fin (tall triangle)
      const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1.1, 4), orcaMatBlack);
      dorsal.scale.set(0.4, 1.0, 1.0);
      dorsal.rotation.x = Math.PI;
      dorsal.position.set(-0.1, 0.85, 0);
      og.add(dorsal);
      // tail flukes
      const tail = new THREE.Group();
      tail.position.x = -2.0;
      const tailL = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.9, 4), orcaMatBlack);
      tailL.scale.set(1.0, 1.0, 0.18);
      tailL.rotation.z = -1.05;
      tailL.position.set(-0.4, 0, 0);
      tail.add(tailL);
      const tailR = tailL.clone();
      tailR.rotation.z = 1.05;
      tailR.position.set(0.4, 0, 0);
      tail.add(tailR);
      og.add(tail);
      og.userData.tail = tail;
      og.userData.ang = o.ang;
      og.userData.r = o.r;
      og.userData.ph = o.ph;
      og.scale.setScalar(o.scale);
      group.add(og);
      orcaPod.push(og);
    });
  }

  // 2) Fog bank — translucent rolling planes near sea level that drift
  //    across the bay and gently fade in/out.
  const rollingFogBank = new THREE.Group();
  {
    const fogTex = (() => {
      const c = document.createElement('canvas');
      c.width = 256; c.height = 128;
      const cx = c.getContext('2d');
      const grd = cx.createRadialGradient(128, 64, 5, 128, 64, 110);
      grd.addColorStop(0, 'rgba(220,225,232,0.95)');
      grd.addColorStop(0.5, 'rgba(210,218,228,0.55)');
      grd.addColorStop(1, 'rgba(200,212,224,0.0)');
      cx.fillStyle = grd;
      cx.fillRect(0, 0, 256, 128);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    })();
    for (let i = 0; i < 7; i++) {
      const w = 14 + Math.random() * 10;
      const h = 4 + Math.random() * 2.5;
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ map: fogTex, transparent: true, opacity: 0.0, depthWrite: false, side: THREE.DoubleSide })
      );
      m.rotation.x = -Math.PI / 2 + 0.05;
      m.rotation.z = Math.random() * Math.PI * 2;
      m.position.set((Math.random() - 0.5) * 36, 0.6 + Math.random() * 0.7, (Math.random() - 0.5) * 32);
      m.userData.basePos = m.position.clone();
      m.userData.phase = Math.random() * Math.PI * 2;
      m.userData.driftSpeed = 0.25 + Math.random() * 0.25;
      rollingFogBank.add(m);
    }
    group.add(rollingFogBank);
  }

  // 3) Seabird flock — six gulls circling the lighthouse on slow elliptical
  //    paths at varying altitudes. Wings flap smoothly.
  const seaBirdFlock = [];
  {
    const wingMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, metalness: 0.0, side: THREE.DoubleSide });
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.7 });
    for (let i = 0; i < 6; i++) {
      const bg = new THREE.Group();
      // body
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), bodyMat);
      b.scale.set(1.6, 0.9, 0.8);
      bg.add(b);
      // head w/ tiny beak
      const h = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), bodyMat);
      h.position.set(0.22, 0.05, 0);
      bg.add(h);
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 6), new THREE.MeshStandardMaterial({ color: 0xffaa33 }));
      beak.rotation.z = -Math.PI / 2;
      beak.position.set(0.34, 0.04, 0);
      bg.add(beak);
      // wings (two thin planes)
      const wL = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.22), wingMat);
      wL.position.set(0.0, 0.05, 0.2);
      wL.rotation.x = -0.2;
      bg.add(wL);
      const wR = wL.clone();
      wR.position.z = -0.2;
      wR.rotation.x = 0.2;
      bg.add(wR);
      bg.userData.wL = wL;
      bg.userData.wR = wR;
      bg.userData.r = 7 + i * 0.6;
      bg.userData.h = 7.5 + (i % 3) * 1.0;
      bg.userData.speed = 0.45 + i * 0.04;
      bg.userData.phase = (i / 6) * Math.PI * 2;
      bg.userData.flap = Math.random() * Math.PI * 2;
      group.add(bg);
      seaBirdFlock.push(bg);
    }
  }


  // --- ANCHORAGE v12 ----------------------------------------------------
  // Bioluminescent Bay: a cluster of glowing jellyfish near the surface,
  // a manta ray gliding along the seabed, a playful sea-otter pup with a
  // kelp ball, and a distant flickering lightning-storm cloud bank.
  // ---------------------------------------------------------------------

  // 1) Jellyfish bloom — 9 translucent bell-shaped jellies that drift,
  //    pulse-bell, and glow softly from within.
  const jellyfishBloom = [];
  {
    const jellyColors = [0x88e5ff, 0xb88cff, 0x99ffd6, 0xffaaff, 0x88ccff];
    const positions = [
      [-7.5, -0.6, 8.5], [-6.2, -0.9, 9.3], [-8.8, -1.1, 9.0],
      [-5.4, -0.5, 7.7], [-7.1, -1.4, 7.4], [-9.2, -0.7, 8.0],
      [-6.0, -1.7, 8.8], [-8.0, -1.0, 6.6], [-7.6, -0.3, 9.6],
    ];
    positions.forEach((p, i) => {
      const color = jellyColors[i % jellyColors.length];
      const jelly = new THREE.Group();
      // Bell — half-sphere, translucent, glowing
      const bellMat = new THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: 0.65,
        transparent: true, opacity: 0.55, roughness: 0.4
      });
      const bellGeo = new THREE.SphereGeometry(0.42, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      const bell = new THREE.Mesh(bellGeo, bellMat);
      jelly.add(bell);
      // Inner glow disk
      const glowMat = new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.5,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
      });
      const glow = new THREE.Mesh(new THREE.CircleGeometry(0.55, 16), glowMat);
      glow.rotation.x = -Math.PI / 2;
      glow.position.y = -0.05;
      jelly.add(glow);
      // Tentacles — a few thin trailing strands
      const tentMat = new THREE.LineBasicMaterial({
        color, transparent: true, opacity: 0.45
      });
      const tentaclePts = [];
      for (let s = 0; s < 5; s++) {
        const a = (s / 5) * Math.PI * 2;
        const len = 0.7 + (s % 2) * 0.25;
        const pts = [
          new THREE.Vector3(Math.cos(a) * 0.2, 0, Math.sin(a) * 0.2),
          new THREE.Vector3(Math.cos(a) * 0.25, -len * 0.5, Math.sin(a) * 0.25),
          new THREE.Vector3(Math.cos(a) * 0.18, -len, Math.sin(a) * 0.18),
        ];
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const line = new THREE.Line(geo, tentMat);
        tentaclePts.push(line);
        jelly.add(line);
      }
      jelly.position.set(p[0], p[1], p[2]);
      jelly.userData = {
        basePos: { x: p[0], y: p[1], z: p[2] },
        phase: i * 0.7 + Math.random() * 0.5,
        bell, glow,
        bellGeo, // for pulse
        tentacles: tentaclePts
      };
      group.add(jelly);
      jellyfishBloom.push(jelly);
    });
  }

  // 2) Manta ray — a wide flat fish gliding low along the seabed in a
  //    slow figure-8. Wing tips flap subtly.
  const mantaRay = (() => {
    const m = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color: 0x1a2530, roughness: 0.85, metalness: 0.0
    });
    const bellyMat = new THREE.MeshStandardMaterial({
      color: 0xc8d6e2, roughness: 0.8
    });
    // Body: flat lozenge using a wide ellipsoid
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.7, 18, 8), mat);
    body.scale.set(2.4, 0.18, 1.4);
    m.add(body);
    // Belly underside lighter
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.65, 16, 8), bellyMat);
    belly.scale.set(2.2, 0.16, 1.3);
    belly.position.y = -0.04;
    m.add(belly);
    // Two pectoral fin tips that we'll flap
    const wingL = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 6), mat);
    wingL.scale.set(1.4, 0.06, 0.8);
    wingL.position.set(-1.6, 0, 0);
    m.add(wingL);
    const wingR = wingL.clone();
    wingR.position.set(1.6, 0, 0);
    m.add(wingR);
    // Long whip tail
    const tailMat = new THREE.LineBasicMaterial({ color: 0x111922, transparent: true, opacity: 0.85 });
    const tailGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -1.2),
      new THREE.Vector3(0, 0.05, -1.7),
      new THREE.Vector3(0, 0.1, -2.5),
      new THREE.Vector3(0, 0.15, -3.5),
    ]);
    const tail = new THREE.Line(tailGeo, tailMat);
    m.add(tail);
    m.userData = { wingL, wingR, tail };
    m.position.set(2, -1.7, 4);
    group.add(m);
    return m;
  })();

  // 3) Sea-otter pup with kelp ball — a small playful otter that drifts on
  //    the surface near the kelp forest, spinning a green kelp ball above
  //    its belly.
  const otterPup = (() => {
    const og = new THREE.Group();
    const furMat = new THREE.MeshStandardMaterial({ color: 0x6b4a30, roughness: 0.9 });
    const bellyMat = new THREE.MeshStandardMaterial({ color: 0xb89272, roughness: 0.9 });
    // Body
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 10), furMat);
    body.scale.set(1.5, 0.55, 1.0);
    og.add(body);
    // Belly (otters float on their backs!)
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 8), bellyMat);
    belly.scale.set(1.3, 0.4, 0.85);
    belly.position.y = 0.05;
    og.add(belly);
    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), furMat);
    head.position.set(0.42, 0.05, 0);
    og.add(head);
    // Two small ears
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), furMat);
    ear.position.set(0.45, 0.18, 0.1);
    og.add(ear);
    const ear2 = ear.clone();
    ear2.position.z = -0.1;
    og.add(ear2);
    // Kelp ball above belly — tiny rotating green orb with bumps
    const kelpMat = new THREE.MeshStandardMaterial({ color: 0x335a25, roughness: 0.7, emissive: 0x224418, emissiveIntensity: 0.18 });
    const kelpBall = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 0), kelpMat);
    kelpBall.position.set(0, 0.2, 0);
    og.add(kelpBall);
    og.position.set(-3, 0.05, 11);
    og.userData = { kelpBall };
    group.add(og);
    return og;
  })();

  // 4) Distant lightning-storm cloud — a far cloud bank that flickers
  //    occasionally with internal lightning. Subtle and ambient.
  const stormCloud = (() => {
    const sg = new THREE.Group();
    // Cloud puffs
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0x2c3344, transparent: true, opacity: 0.7, side: THREE.DoubleSide,
      depthWrite: false
    });
    for (let i = 0; i < 7; i++) {
      const c = new THREE.Mesh(
        new THREE.SphereGeometry(2.2 + Math.random() * 1.4, 10, 7),
        cloudMat.clone()
      );
      c.position.set((i - 3) * 1.7 + Math.random() * 0.6, Math.random() * 0.8, Math.random() * 0.8);
      c.scale.set(1.2, 0.6, 0.7);
      sg.add(c);
    }
    // Internal flash sphere — invisible normally, brightens on flash
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xeae5ff, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    const flash = new THREE.Mesh(new THREE.SphereGeometry(3.2, 12, 8), flashMat);
    sg.add(flash);
    sg.position.set(-32, 14, -28);
    sg.userData = { flash, flashTime: 0, nextFlash: 4 + Math.random() * 6 };
    group.add(sg);
    return sg;
  })();


  // === v13 marine & avian additions ===

  // 1) Sea snake — long undulating body following an S-curve path along surface.
  const seaSnake = (() => {
    const sg = new THREE.Group();
    const segs = [];
    const N = 14;
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x2d6038, emissive: 0x0e3018, emissiveIntensity: 0.4, roughness: 0.6, metalness: 0.2
    });
    for (let i = 0; i < N; i++) {
      const r = 0.18 - (i / N) * 0.10;
      const seg = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), bodyMat);
      seg.userData = { idx: i };
      segs.push(seg);
      sg.add(seg);
    }
    // Head — slightly bigger with eyes
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), new THREE.MeshStandardMaterial({
      color: 0x346a3f, emissive: 0x103820, emissiveIntensity: 0.6
    }));
    head.scale.set(1.3, 0.9, 1);
    sg.add(head);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffe48a });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), eyeMat);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), eyeMat);
    head.add(eyeL); head.add(eyeR);
    eyeL.position.set(0.18, 0.06, 0.12);
    eyeR.position.set(0.18, 0.06, -0.12);
    sg.userData = { segs, head };
    group.add(sg);
    return sg;
  })();

  // 2) Fish school — small triangle fishes swimming as a coordinated flock.
  const reefFishSchool = (() => {
    const fg = new THREE.Group();
    const fishes = [];
    const N = 24;
    const fishMat = new THREE.MeshStandardMaterial({
      color: 0xc8d8ff, emissive: 0x506080, emissiveIntensity: 0.45, side: THREE.DoubleSide
    });
    for (let i = 0; i < N; i++) {
      const geo = new THREE.ConeGeometry(0.06, 0.24, 4);
      geo.rotateZ(Math.PI / 2);
      const f = new THREE.Mesh(geo, fishMat);
      f.userData = {
        offset: { x: (Math.random() - 0.5) * 1.6, y: (Math.random() - 0.5) * 0.6, z: (Math.random() - 0.5) * 1.6 },
        phase: Math.random() * Math.PI * 2,
      };
      fishes.push(f);
      fg.add(f);
    }
    fg.userData = { fishes };
    group.add(fg);
    return fg;
  })();

  // 3) Seabird flock — small dots circling lighthouse spire, occasionally diving.
  const birdFlock = (() => {
    const bg = new THREE.Group();
    const birds = [];
    const N = 7;
    const bMat = new THREE.MeshBasicMaterial({ color: 0xfff5e0 });
    for (let i = 0; i < N; i++) {
      const geo = new THREE.ConeGeometry(0.05, 0.18, 3);
      geo.rotateZ(Math.PI / 2);
      const b = new THREE.Mesh(geo, bMat);
      b.userData = {
        radius: 4.5 + i * 0.4,
        baseY: 12 + Math.random() * 2,
        speed: 0.4 + Math.random() * 0.25,
        phase: Math.random() * Math.PI * 2,
      };
      birds.push(b);
      bg.add(b);
    }
    bg.userData = { birds };
    group.add(bg);
    return bg;
  })();

  // 4) Distant double rainbow — primary + faint secondary. Occasionally fades in.
  const rainbow2 = (() => {
    const rg = new THREE.Group();
    const colors = [0xff5f5f, 0xffb84a, 0xfff272, 0x80ff8c, 0x6cb6ff, 0x9c7fff, 0xd06bff];
    colors.forEach((c, i) => {
      const arc = new THREE.Mesh(
        new THREE.TorusGeometry(20 + i * 0.42, 0.18, 6, 50, Math.PI),
        new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, side: THREE.DoubleSide })
      );
      arc.rotation.z = Math.PI;
      arc.userData = { idx: i, ring: 'primary' };
      rg.add(arc);
    });
    // Secondary fainter, reversed order
    [...colors].reverse().forEach((c, i) => {
      const arc = new THREE.Mesh(
        new THREE.TorusGeometry(28 + i * 0.46, 0.13, 6, 50, Math.PI),
        new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, side: THREE.DoubleSide })
      );
      arc.rotation.z = Math.PI;
      arc.userData = { idx: i, ring: 'secondary' };
      rg.add(arc);
    });
    rg.position.set(28, 0.5, -32);
    group.add(rg);
    return rg;
  })();

  // ===== ANCHORAGE v14: sea cliffs, far lighthouse reciprocal, sailing regatta, wind sock, fog beacon =====

  // --- Sea cliffs along east + west horizons ----------------------------------
  // Five jagged cliff faces per side (east x≈48..56, west x≈-48..-56), built
  // from extruded BoxGeometry with random vertex displacement to look weathered.
  const seaCliffs = new THREE.Group();
  const cliffRockMat = new THREE.MeshStandardMaterial({
    color: 0x4a4a52, roughness: 0.95, metalness: 0.05,
    flatShading: true,
  });
  const cliffShadowMat = new THREE.MeshBasicMaterial({ color: 0x18181f, transparent: true, opacity: 0.55 });
  function makeCliff(side, idx) {
    const cliff = new THREE.Group();
    const wd = 6 + Math.random() * 4;
    const ht = 24 + Math.random() * 16;
    const dp = 4 + Math.random() * 4;
    const cliffGeo = new THREE.BoxGeometry(wd, ht, dp, 4, 6, 2);
    const pos = cliffGeo.attributes.position;
    for (let v = 0; v < pos.count; v++) {
      pos.setX(v, pos.getX(v) + (Math.random() - 0.5) * 1.4);
      pos.setY(v, pos.getY(v) + (Math.random() - 0.5) * 1.0);
      pos.setZ(v, pos.getZ(v) + (Math.random() - 0.5) * 0.8);
    }
    cliffGeo.computeVertexNormals();
    const cliffMesh = new THREE.Mesh(cliffGeo, cliffRockMat);
    cliffMesh.position.y = ht / 2 - 2;
    cliff.add(cliffMesh);
    // moss/lichen patches: small green emissive sprite on top
    const cliffMoss = new THREE.Mesh(
      new THREE.PlaneGeometry(wd * 0.9, 1.4),
      new THREE.MeshBasicMaterial({ color: 0x2e5a35, transparent: true, opacity: 0.7 })
    );
    cliffMoss.rotation.x = -Math.PI / 2;
    cliffMoss.position.y = ht - 2.0;
    cliff.add(cliffMoss);
    // base shadow on water
    const cliffBase = new THREE.Mesh(new THREE.PlaneGeometry(wd * 1.4, dp * 1.6), cliffShadowMat);
    cliffBase.rotation.x = -Math.PI / 2;
    cliffBase.position.y = -1.8;
    cliff.add(cliffBase);
    cliff.position.set(side * (44 + idx * 3.6), 0, -28 + idx * 14);
    cliff.rotation.y = side * (Math.PI / 14) * (idx - 2);
    seaCliffs.add(cliff);
    return cliff;
  }
  for (let i = 0; i < 5; i++) makeCliff(1, i);   // east
  for (let i = 0; i < 5; i++) makeCliff(-1, i);  // west
  group.add(seaCliffs);

  // --- Distant lighthouse reciprocal (across the bay, blinks offset) ----------
  const farLighthouse = new THREE.Group();
  farLighthouse.position.set(-46, 0, -52);
  const farLhBase = new THREE.Mesh(
    new THREE.CylinderGeometry(1.4, 1.8, 5, 12),
    new THREE.MeshStandardMaterial({ color: 0xb86038, roughness: 0.85, metalness: 0.05 })
  );
  farLhBase.position.y = 2.5;
  farLighthouse.add(farLhBase);
  const farLhTower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 1.4, 8, 12),
    new THREE.MeshStandardMaterial({ color: 0xf0eedc, roughness: 0.7, metalness: 0.1 })
  );
  farLhTower.position.y = 9;
  farLighthouse.add(farLhTower);
  // red striping on tower
  for (let i = 0; i < 3; i++) {
    const farLhStripe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.92, 0.92, 0.4, 12),
      new THREE.MeshStandardMaterial({ color: 0xc0302a, roughness: 0.6, metalness: 0.05 })
    );
    farLhStripe.position.y = 6 + i * 2.4;
    farLighthouse.add(farLhStripe);
  }
  const farLhRoom = new THREE.Mesh(
    new THREE.CylinderGeometry(1.0, 1.0, 1.6, 12),
    new THREE.MeshStandardMaterial({ color: 0x2a3a48, roughness: 0.4, metalness: 0.6 })
  );
  farLhRoom.position.y = 13.8;
  farLighthouse.add(farLhRoom);
  const farLhCap = new THREE.Mesh(
    new THREE.ConeGeometry(1.1, 1.2, 12),
    new THREE.MeshStandardMaterial({ color: 0x802e20, roughness: 0.7 })
  );
  farLhCap.position.y = 15.2;
  farLighthouse.add(farLhCap);
  const farBeacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.7, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xfff2a8, transparent: true, opacity: 0.0 })
  );
  farBeacon.position.y = 13.8;
  farLighthouse.add(farBeacon);
  const farBeacon2 = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xfff2a8, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending })
  );
  farBeacon2.position.y = 13.8;
  farLighthouse.add(farBeacon2);
  group.add(farLighthouse);

  // --- Sailing regatta on the horizon (5 distant boats) ------------------------
  const regattaFleet = new THREE.Group();
  const regattaMat = new THREE.MeshStandardMaterial({ color: 0x141822, roughness: 0.6 });
  const regattaSailMat = new THREE.MeshBasicMaterial({ color: 0xfaf3e0, transparent: true, opacity: 0.95, side: THREE.DoubleSide });
  const regattaSail2Mat = new THREE.MeshBasicMaterial({ color: 0xff7a3a, transparent: true, opacity: 0.92, side: THREE.DoubleSide });
  const regattaSail3Mat = new THREE.MeshBasicMaterial({ color: 0x4dc4ff, transparent: true, opacity: 0.92, side: THREE.DoubleSide });
  const regattaShips = [];
  for (let i = 0; i < 5; i++) {
    const ship = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 0.7), regattaMat);
    hull.position.y = 0.25;
    ship.add(hull);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.4, 6), regattaMat);
    mast.position.set(0, 1.95, 0);
    ship.add(mast);
    const mainSailMat = i % 3 === 0 ? regattaSail2Mat : (i % 3 === 1 ? regattaSailMat : regattaSail3Mat);
    const mainSail = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.4), mainSailMat);
    mainSail.position.set(0.05, 2.0, 0);
    mainSail.rotation.y = Math.PI / 2;
    ship.add(mainSail);
    const jib = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.8), mainSailMat);
    jib.position.set(0.85, 1.7, 0);
    jib.rotation.y = Math.PI / 2;
    jib.scale.x = 0.7;
    ship.add(jib);
    ship.position.set(-22 + i * 11, 0.2, -42 - (i % 2) * 4);
    ship.userData = { phase: Math.random() * Math.PI * 2, baseX: ship.position.x, baseZ: ship.position.z, speed: 0.04 + Math.random() * 0.03 };
    regattaFleet.add(ship);
    regattaShips.push(ship);
  }
  group.add(regattaFleet);

  // --- Wind sock atop existing lighthouse spire (visual wind cue) -------------
  const windSock = new THREE.Group();
  const windSockPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 1.2, 6),
    new THREE.MeshStandardMaterial({ color: 0x3a3a40, roughness: 0.5 })
  );
  windSockPole.position.y = 0.6;
  windSock.add(windSockPole);
  // cone-shaped sock (truncated cone) with stripes
  const windSockBody = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.9, 10, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xff6028, transparent: true, opacity: 0.92, side: THREE.DoubleSide })
  );
  windSockBody.position.set(0.6, 1.1, 0);
  windSockBody.rotation.z = -Math.PI / 2;
  windSock.add(windSockBody);
  const windSockStripe = new THREE.Mesh(
    new THREE.ConeGeometry(0.165, 0.3, 10, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfaf3e0, transparent: true, opacity: 0.94, side: THREE.DoubleSide })
  );
  windSockStripe.position.set(0.5, 1.1, 0);
  windSockStripe.rotation.z = -Math.PI / 2;
  windSock.add(windSockStripe);
  windSock.position.set(0, 16.5, 0); // atop main lighthouse
  group.add(windSock);

  // --- Fog beacon: low pulsing horn-light at end of the breakwater ------------
  const fogBeacon = new THREE.Group();
  const fogBeaconPost = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 1.6, 8),
    new THREE.MeshStandardMaterial({ color: 0x2a2e36, roughness: 0.7 })
  );
  fogBeaconPost.position.y = 0.8;
  fogBeacon.add(fogBeaconPost);
  const fogBeaconLamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xa8e8ff, transparent: true, opacity: 0.88 })
  );
  fogBeaconLamp.position.y = 1.7;
  fogBeacon.add(fogBeaconLamp);
  const fogBeaconHalo = new THREE.Mesh(
    new THREE.SphereGeometry(0.85, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xa8e8ff, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending })
  );
  fogBeaconHalo.position.y = 1.7;
  fogBeacon.add(fogBeaconHalo);
  fogBeacon.position.set(11, -0.6, -3);
  group.add(fogBeacon);

  // --- v14 init complete ----------------------------------------------------

  // --- v15 features (Opus 4.7) -----------------------------------------------
  // 1) Harbor seals lounging on a rock outcrop near shore
  const sealRocks = new THREE.Group();
  const sealRockMat = new THREE.MeshStandardMaterial({ color: 0x4a4538, roughness: 0.95, metalness: 0.04 });
  const sealRockA = new THREE.Mesh(new THREE.SphereGeometry(1.2, 14, 10), sealRockMat);
  sealRockA.scale.set(1.0, 0.45, 1.0);
  sealRockA.position.set(0, 0.05, 0);
  sealRocks.add(sealRockA);
  const sealRockB = new THREE.Mesh(new THREE.SphereGeometry(0.85, 12, 8), sealRockMat);
  sealRockB.scale.set(1.0, 0.4, 1.0);
  sealRockB.position.set(1.3, 0.0, -0.4);
  sealRocks.add(sealRockB);
  // Seal helper
  const sealMat = new THREE.MeshStandardMaterial({ color: 0x3a3a48, roughness: 0.7, metalness: 0.05 });
  const sealMatLight = new THREE.MeshStandardMaterial({ color: 0x787888, roughness: 0.7, metalness: 0.05 });
  function makeSeal(matChoice) {
    const seal = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 9), matChoice);
    body.scale.set(1.6, 0.5, 0.6);
    seal.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 9), matChoice);
    head.position.set(0.5, 0.06, 0);
    seal.add(head);
    // tiny flippers
    const flipperGeo = new THREE.BoxGeometry(0.18, 0.04, 0.08);
    const flA = new THREE.Mesh(flipperGeo, matChoice);
    flA.position.set(-0.18, -0.02, 0.18); seal.add(flA);
    const flB = new THREE.Mesh(flipperGeo, matChoice);
    flB.position.set(-0.18, -0.02, -0.18); seal.add(flB);
    return { group: seal, head };
  }
  const sealColony = [];
  const seal1 = makeSeal(sealMat);
  seal1.group.position.set(-0.2, 0.4, 0.2);
  seal1.group.rotation.y = 0.6;
  sealRocks.add(seal1.group); sealColony.push(seal1);
  const seal2 = makeSeal(sealMatLight);
  seal2.group.position.set(0.5, 0.45, -0.3);
  seal2.group.rotation.y = -0.3;
  sealRocks.add(seal2.group); sealColony.push(seal2);
  const seal3 = makeSeal(sealMat);
  seal3.group.position.set(1.4, 0.4, -0.4);
  seal3.group.rotation.y = 1.2;
  sealRocks.add(seal3.group); sealColony.push(seal3);
  sealRocks.position.set(-13, -0.4, 8);
  group.add(sealRocks);

  // 2) Tide gauge post near the breakwater (vertical post with horizontal stripe markings)
  const tideGauge = new THREE.Group();
  const tideGaugePost = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.14, 3.2, 8),
    new THREE.MeshStandardMaterial({ color: 0xb0a890, roughness: 0.8, metalness: 0.1 })
  );
  tideGaugePost.position.y = 1.6;
  tideGauge.add(tideGaugePost);
  // Stripes (alternating red/white horizontal bands)
  for (let i = 0; i < 8; i++) {
    const stripe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 0.18, 8),
      new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? 0xc04030 : 0xe8e0d0, roughness: 0.7, metalness: 0.1 })
    );
    stripe.position.y = 0.3 + i * 0.36;
    tideGauge.add(stripe);
  }
  // Tiny cap
  const tideGaugeCap = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.28, 6),
    new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.6, metalness: 0.4 })
  );
  tideGaugeCap.position.y = 3.3;
  tideGauge.add(tideGaugeCap);
  tideGauge.position.set(9.5, -0.3, 1.8);
  group.add(tideGauge);

  // 3) Distant fishing trawler with a small net dragging behind
  const harborTrawler = new THREE.Group();
  const trawlerHull = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.6, 0.9),
    new THREE.MeshStandardMaterial({ color: 0x1f3850, roughness: 0.6, metalness: 0.2 })
  );
  trawlerHull.position.y = 0.3;
  harborTrawler.add(trawlerHull);
  const trawlerCabin = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.5, 0.7),
    new THREE.MeshStandardMaterial({ color: 0xe8e2d0, roughness: 0.7, metalness: 0.05 })
  );
  trawlerCabin.position.set(-0.3, 0.85, 0);
  harborTrawler.add(trawlerCabin);
  const trawlerMast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6),
    new THREE.MeshStandardMaterial({ color: 0x303030, roughness: 0.8 })
  );
  trawlerMast.position.set(-0.3, 1.7, 0);
  harborTrawler.add(trawlerMast);
  // Boom arm extending behind, with net
  const trawlerBoom = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6),
    new THREE.MeshStandardMaterial({ color: 0x303030, roughness: 0.8 })
  );
  trawlerBoom.rotation.z = Math.PI / 2;
  trawlerBoom.position.set(1.6, 0.85, 0);
  harborTrawler.add(trawlerBoom);
  // Net (inverted cone-ish) trailing in water
  const trawlerNet = new THREE.Mesh(
    new THREE.ConeGeometry(0.5, 1.2, 8, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x9bb6c2, transparent: true, opacity: 0.42, wireframe: true })
  );
  trawlerNet.rotation.x = Math.PI;
  trawlerNet.position.set(2.3, 0.05, 0);
  harborTrawler.add(trawlerNet);
  harborTrawler.position.set(-22, 0.0, -18);
  harborTrawler.rotation.y = -0.3;
  group.add(harborTrawler);

  // 4) Harbor master's house — small wooden cottage on the shore
  const harborMaster = new THREE.Group();
  const houseBody = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 1.6, 1.8),
    new THREE.MeshStandardMaterial({ color: 0xd6c6a0, roughness: 0.8, metalness: 0.04 })
  );
  houseBody.position.y = 0.8;
  harborMaster.add(houseBody);
  // Pitched roof
  const houseRoof = new THREE.Mesh(
    new THREE.ConeGeometry(2.0, 1.0, 4),
    new THREE.MeshStandardMaterial({ color: 0x8a3a28, roughness: 0.85, metalness: 0.05 })
  );
  houseRoof.rotation.y = Math.PI / 4;
  houseRoof.position.y = 2.1;
  houseRoof.scale.set(1.0, 1.0, 0.78);
  harborMaster.add(houseRoof);
  // Window glow
  const houseWindow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.4),
    new THREE.MeshBasicMaterial({ color: 0xffd980, transparent: true, opacity: 0.85 })
  );
  houseWindow.position.set(1.31, 0.95, 0);
  houseWindow.rotation.y = Math.PI / 2;
  harborMaster.add(houseWindow);
  const houseWindow2 = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.4),
    new THREE.MeshBasicMaterial({ color: 0xffd980, transparent: true, opacity: 0.7 })
  );
  houseWindow2.position.set(0, 0.95, 0.91);
  harborMaster.add(houseWindow2);
  // Chimney with smoke
  const harborMasterChimney = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.7, 0.32),
    new THREE.MeshStandardMaterial({ color: 0x8a8378, roughness: 0.9 })
  );
  harborMasterChimney.position.set(-0.8, 2.2, 0.4);
  harborMaster.add(harborMasterChimney);
  const chimneySmoke = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xeae0d4, transparent: true, opacity: 0.45 })
  );
  chimneySmoke.position.set(-0.8, 2.9, 0.4);
  harborMaster.add(chimneySmoke);
  harborMaster.position.set(-9, -0.1, 11);
  harborMaster.rotation.y = -0.4;
  group.add(harborMaster);

  // --- v16 features (Opus 4.7) -----------------------------------------------
  // Floating sea lanterns: 5 small drifting paper lanterns lit at night
  const seaLanternGroup = new THREE.Group();
  const seaLanternFloats = [];
  const seaLanternMat = new THREE.MeshBasicMaterial({ color: 0xffd285, transparent: true, opacity: 0.92 });
  const seaLanternBaseMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.7, metalness: 0.05 });
  for (let i = 0; i < 5; i++) {
    const fl = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.06, 8), seaLanternBaseMat);
    base.position.y = -0.25;
    fl.add(base);
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.22, 8, 1, true), seaLanternMat);
    shade.position.y = -0.13;
    fl.add(shade);
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), seaLanternMat);
    top.position.y = 0.0;
    fl.add(top);
    const angle = (i / 5) * Math.PI * 2;
    fl.userData.baseAngle = angle;
    fl.userData.radius = 6 + i * 0.6;
    fl.userData.bobPhase = i * 0.7;
    fl.userData.driftSpeed = 0.05 + i * 0.012;
    fl.position.set(Math.cos(angle) * fl.userData.radius, -0.18, Math.sin(angle) * fl.userData.radius);
    seaLanternGroup.add(fl);
    seaLanternFloats.push(fl);
  }
  group.add(seaLanternGroup);

  // Stargazing platform: wooden deck on stilts at -7,0,-2 with a small telescope
  const stargazerPlatform = new THREE.Group();
  const skyDeckBase = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.16, 2.4),
    new THREE.MeshStandardMaterial({ color: 0x6b4a2c, roughness: 0.85 })
  );
  skyDeckBase.position.y = 0.6;
  stargazerPlatform.add(skyDeckBase);
  for (let sx = -1; sx <= 1; sx += 2) {
    for (let sz = -1; sz <= 1; sz += 2) {
      const stilt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.08, 0.7, 6),
        new THREE.MeshStandardMaterial({ color: 0x4a3018, roughness: 0.9 })
      );
      stilt.position.set(sx * 1.0, 0.25, sz * 1.0);
      stargazerPlatform.add(stilt);
    }
  }
  // Telescope
  const skyTelescopeMount = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 0.5, 8),
    new THREE.MeshStandardMaterial({ color: 0x222a36, roughness: 0.5, metalness: 0.6 })
  );
  skyTelescopeMount.position.set(0.4, 0.92, 0);
  stargazerPlatform.add(skyTelescopeMount);
  const skyTelescopeTube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 0.7, 8),
    new THREE.MeshStandardMaterial({ color: 0x111820, roughness: 0.4, metalness: 0.7, emissive: 0x223344, emissiveIntensity: 0.18 })
  );
  skyTelescopeTube.rotation.z = -0.6;
  skyTelescopeTube.position.set(0.55, 1.18, 0);
  stargazerPlatform.add(skyTelescopeTube);
  const skyTelescopeEyepiece = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.1, 8),
    new THREE.MeshStandardMaterial({ color: 0x222a36, roughness: 0.5, metalness: 0.7 })
  );
  skyTelescopeEyepiece.rotation.z = -0.6;
  skyTelescopeEyepiece.position.set(0.27, 1.0, 0);
  stargazerPlatform.add(skyTelescopeEyepiece);
  stargazerPlatform.position.set(-7, -0.2, -2);
  stargazerPlatform.rotation.y = 0.4;
  group.add(stargazerPlatform);

  // Signal flare: an occasional rising glow (rocket flare) from far at sea
  const signalFlareCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xffe16a, transparent: true, opacity: 0 })
  );
  const signalFlareGlow = new THREE.PointLight(0xffd28a, 0, 35, 1.6);
  const signalFlareGroup = new THREE.Group();
  signalFlareGroup.add(signalFlareCore);
  signalFlareGroup.add(signalFlareGlow);
  signalFlareGroup.position.set(-25, 0, -22);
  group.add(signalFlareGroup);

  // --- v17 features (Opus 4.7) -----------------------------------------------
  // 17a) Low sea fog: 6 thin translucent fog strips drifting just above the water
  const seaFogGroup = new THREE.Group();
  const seaFogMat = new THREE.MeshBasicMaterial({
    color: 0xc8d6ee,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const seaFogPlanes = [];
  for (let i = 0; i < 6; i++) {
    const w = 14 + Math.random() * 12;
    const h = 3.0 + Math.random() * 1.6;
    const fog = new THREE.Mesh(new THREE.PlaneGeometry(w, h), seaFogMat.clone());
    fog.rotation.x = -Math.PI / 2;
    fog.position.set(
      -10 + (Math.random() - 0.5) * 36,
      0.18 + Math.random() * 0.18,
      -10 + (Math.random() - 0.5) * 36,
    );
    fog.userData = {
      driftSpeed: 0.08 + Math.random() * 0.05,
      direction: Math.random() < 0.5 ? -1 : 1,
      basePhase: Math.random() * Math.PI * 2,
      baseOpacity: 0.12 + Math.random() * 0.10,
    };
    seaFogGroup.add(fog);
    seaFogPlanes.push(fog);
  }
  group.add(seaFogGroup);

  // 17b) Distant ferry boat with a row of lit windows, slowly sails an arc
  const distantFerryGroup = new THREE.Group();
  const ferryHull = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 0.9, 1.6),
    new THREE.MeshStandardMaterial({ color: 0x2a3550, roughness: 0.78 }),
  );
  ferryHull.position.y = 0.3;
  distantFerryGroup.add(ferryHull);
  const ferryDeck = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 0.3, 1.3),
    new THREE.MeshStandardMaterial({ color: 0x445574, roughness: 0.7 }),
  );
  ferryDeck.position.y = 0.85;
  distantFerryGroup.add(ferryDeck);
  const ferryCabin = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 0.7, 1.0),
    new THREE.MeshStandardMaterial({ color: 0xeae6d0, roughness: 0.6 }),
  );
  ferryCabin.position.y = 1.35;
  distantFerryGroup.add(ferryCabin);
  // Row of warm lit windows
  const ferryWindowMat = new THREE.MeshBasicMaterial({
    color: 0xfff1b8,
    transparent: true,
    opacity: 0.95,
  });
  for (let i = 0; i < 6; i++) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.28), ferryWindowMat);
    w.position.set(-1.45 + i * 0.58, 1.36, 0.51);
    distantFerryGroup.add(w);
    const wb = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.28), ferryWindowMat);
    wb.position.set(-1.45 + i * 0.58, 1.36, -0.51);
    wb.rotation.y = Math.PI;
    distantFerryGroup.add(wb);
  }
  // Smokestack
  const ferrySmokestack = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 0.95, 10),
    new THREE.MeshStandardMaterial({ color: 0x5b3a2a, roughness: 0.85 }),
  );
  ferrySmokestack.position.set(1.2, 2.1, 0);
  distantFerryGroup.add(ferrySmokestack);
  // Bow accent (red trim) + masthead light
  const ferryBowLight = new THREE.PointLight(0xfff1b8, 0.6, 6, 1.6);
  ferryBowLight.position.set(0, 1.7, 0);
  distantFerryGroup.add(ferryBowLight);
  distantFerryGroup.position.set(-30, 0, 8);
  group.add(distantFerryGroup);

  // 17c) Harbor cat: small dozing tabby on the dock, with a slow tail flick
  const harborCatGroup = new THREE.Group();
  const catMat = new THREE.MeshStandardMaterial({ color: 0xb88a52, roughness: 0.9 });
  const catBody = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), catMat);
  catBody.scale.set(1.4, 0.8, 1.0);
  catBody.position.y = 0.18;
  harborCatGroup.add(catBody);
  const catHead = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), catMat);
  catHead.position.set(0.3, 0.28, 0);
  harborCatGroup.add(catHead);
  // Ears
  const catEarL = new THREE.Mesh(
    new THREE.ConeGeometry(0.05, 0.10, 6),
    catMat,
  );
  catEarL.position.set(0.34, 0.42, 0.07);
  harborCatGroup.add(catEarL);
  const catEarR = new THREE.Mesh(
    new THREE.ConeGeometry(0.05, 0.10, 6),
    catMat,
  );
  catEarR.position.set(0.34, 0.42, -0.07);
  harborCatGroup.add(catEarR);
  // Tail (curved cylinder approximated with thin elongated capsule via sphere chain)
  const catTail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.035, 0.55, 8),
    catMat,
  );
  catTail.rotation.z = Math.PI / 2;
  catTail.position.set(-0.36, 0.20, 0);
  harborCatGroup.add(catTail);
  // Place on the dock near the harbor master cottage
  harborCatGroup.position.set(-7.4, 0.28, 9.7);
  harborCatGroup.rotation.y = -0.4;
  group.add(harborCatGroup);


  // ============================================================
  // v18: Dolphin pod, port-side cafe, comet water reflections
  // ============================================================

  // --- Dolphin pod -- 3 dolphins arc above and below the water surface
  const dolphinPodGroup = new THREE.Group();
  const dolphinMat = new THREE.MeshStandardMaterial({ color: 0x6f8aa6, emissive: 0x14202a, roughness: 0.45, metalness: 0.18 });
  const dolphinBellyMat = new THREE.MeshStandardMaterial({ color: 0xcfdcec, emissive: 0x202830, roughness: 0.6 });
  const dolphinPodMembers = [];
  for (let i = 0; i < 3; i++) {
    const d = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.95, 5, 10), dolphinMat);
    body.rotation.z = Math.PI / 2;
    d.add(body);
    const belly = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.5, 5, 10), dolphinBellyMat);
    belly.rotation.z = Math.PI / 2;
    belly.position.y = -0.13;
    d.add(belly);
    // Snout cone
    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.36, 8), dolphinMat);
    snout.rotation.z = -Math.PI / 2;
    snout.position.x = 0.78;
    d.add(snout);
    // Dorsal fin
    const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.34, 4), dolphinMat);
    dorsal.position.set(-0.1, 0.32, 0);
    dorsal.rotation.x = -0.2;
    d.add(dorsal);
    // Tail flukes
    const fluke = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.04, 0.5), dolphinMat);
    fluke.position.x = -0.78;
    d.add(fluke);
    d.userData.phaseOffset = i * 1.7;
    dolphinPodGroup.add(d);
    dolphinPodMembers.push(d);
  }
  dolphinPodGroup.position.set(6, 0, -8);
  group.add(dolphinPodGroup);

  // --- Port-side cafe -- small glowing building near the dock
  const portCafeGroup = new THREE.Group();
  const cafeWalls = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 1.6, 1.8),
    new THREE.MeshStandardMaterial({ color: 0x74553a, emissive: 0x261810, roughness: 0.85 })
  );
  cafeWalls.position.y = 0.8;
  portCafeGroup.add(cafeWalls);
  const cafeRoofMesh = new THREE.Mesh(
    new THREE.ConeGeometry(2.0, 0.9, 4),
    new THREE.MeshStandardMaterial({ color: 0x4a2a18, emissive: 0x180a06, roughness: 0.85 })
  );
  cafeRoofMesh.rotation.y = Math.PI / 4;
  cafeRoofMesh.position.y = 2.05;
  portCafeGroup.add(cafeRoofMesh);
  // Glowing windows (warm lamp light)
  const cafeWindowMat = new THREE.MeshBasicMaterial({ color: 0xffdfa3, transparent: true, opacity: 0.95 });
  const cafeWin1 = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.46), cafeWindowMat);
  cafeWin1.position.set(1.31, 0.95, -0.45);
  cafeWin1.rotation.y = Math.PI / 2;
  portCafeGroup.add(cafeWin1);
  const cafeWin2 = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.46), cafeWindowMat);
  cafeWin2.position.set(1.31, 0.95, 0.45);
  cafeWin2.rotation.y = Math.PI / 2;
  portCafeGroup.add(cafeWin2);
  // Door
  const cafeDoor = new THREE.Mesh(
    new THREE.PlaneGeometry(0.55, 1.05),
    new THREE.MeshBasicMaterial({ color: 0xffba6a, transparent: true, opacity: 0.85 })
  );
  cafeDoor.position.set(1.31, 0.55, -0.02);
  cafeDoor.rotation.y = Math.PI / 2;
  portCafeGroup.add(cafeDoor);
  // Sign
  const cafeSign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.4, 0.32),
    new THREE.MeshBasicMaterial({ color: 0xffe9b8, transparent: true, opacity: 0.7 })
  );
  cafeSign.position.set(1.32, 1.55, 0);
  cafeSign.rotation.y = Math.PI / 2;
  portCafeGroup.add(cafeSign);
  // Warm lamp glow
  const cafeLamp = new THREE.PointLight(0xffc78a, 0.9, 7, 1.6);
  cafeLamp.position.set(2.2, 1.0, 0);
  portCafeGroup.add(cafeLamp);
  // Chimney smoke wisps
  const cafeChimneyGroup = new THREE.Group();
  const cafeSmokeMat = new THREE.MeshBasicMaterial({ color: 0xa8b0bc, transparent: true, opacity: 0.45 });
  const cafeSmokePuffs = [];
  for (let i = 0; i < 5; i++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.16 + i * 0.04, 8, 6), cafeSmokeMat);
    puff.position.set(0, 2.4 + i * 0.32, 0);
    puff.userData.phase = i * 0.7;
    cafeChimneyGroup.add(puff);
    cafeSmokePuffs.push(puff);
  }
  portCafeGroup.add(cafeChimneyGroup);
  portCafeGroup.position.set(-5.2, -0.05, 12.1);
  portCafeGroup.rotation.y = -0.3;
  group.add(portCafeGroup);

  // --- Comet water reflections -- thin streaks shimmer on the water
  const cometReflectionGroup = new THREE.Group();
  const cometReflectionMat = new THREE.MeshBasicMaterial({ color: 0xb6dcff, transparent: true, opacity: 0.0, side: THREE.DoubleSide });
  const cometReflectionStreaks = [];
  for (let i = 0; i < 4; i++) {
    const streak = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 4.6), cometReflectionMat.clone());
    streak.rotation.x = -Math.PI / 2;
    streak.position.set((Math.random() - 0.5) * 30, 0.04, (Math.random() - 0.5) * 24);
    streak.rotation.z = Math.random() * Math.PI;
    streak.userData.phase = Math.random() * Math.PI * 2;
    streak.userData.cycleSpeed = 0.18 + Math.random() * 0.10;
    cometReflectionGroup.add(streak);
    cometReflectionStreaks.push(streak);
  }
  group.add(cometReflectionGroup);


  // --- v19: Harbor crane, weather vane, festival lantern string -------------
  // Harbor crane at the dock loading area
  const harborCraneGroup = new THREE.Group();
  harborCraneGroup.position.set(-12, -0.05, -2);
  harborCraneGroup.rotation.y = 0.35;
  const craneSteelMat = new THREE.MeshStandardMaterial({ color: 0xcf3a2e, roughness: 0.55, metalness: 0.4 });
  const craneCableMat = new THREE.MeshStandardMaterial({ color: 0x222a31, roughness: 0.7, metalness: 0.5 });
  const cranePadMat = new THREE.MeshStandardMaterial({ color: 0x95a0a8, roughness: 0.85 });
  const cargoCrateMat = new THREE.MeshStandardMaterial({ color: 0x2f7aa3, roughness: 0.65, metalness: 0.2 });
  const cargoStripeMat = new THREE.MeshStandardMaterial({ color: 0xeaeaea, roughness: 0.7, emissive: 0x556677, emissiveIntensity: 0.05 });
  // Concrete pad
  const cranePad = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 2.2), cranePadMat);
  cranePad.position.y = 0.06;
  harborCraneGroup.add(cranePad);
  // Mast (A-frame, two angled legs + cross brace)
  const craneMast = new THREE.Group();
  const legGeo = new THREE.CylinderGeometry(0.08, 0.10, 3.6, 8);
  const legA = new THREE.Mesh(legGeo, craneSteelMat);
  legA.position.set(0.5, 1.92, 0);
  legA.rotation.z = 0.14;
  craneMast.add(legA);
  const legB = new THREE.Mesh(legGeo, craneSteelMat);
  legB.position.set(-0.5, 1.92, 0);
  legB.rotation.z = -0.14;
  craneMast.add(legB);
  const crossBrace = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.0, 6), craneSteelMat);
  crossBrace.position.set(0, 2.4, 0);
  crossBrace.rotation.z = Math.PI * 0.5;
  craneMast.add(crossBrace);
  harborCraneGroup.add(craneMast);
  // Cab (operator box) atop mast
  const craneCab = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.55), craneSteelMat);
  craneCab.position.set(0, 3.85, 0);
  harborCraneGroup.add(craneCab);
  // Boom assembly (pivots horizontally around y axis)
  const craneBoom = new THREE.Group();
  craneBoom.position.set(0, 3.92, 0);
  const boomArm = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.14, 0.18), craneSteelMat);
  boomArm.position.set(1.6, 0, 0);
  craneBoom.add(boomArm);
  // Boom truss (visual under-stringer)
  const boomTruss = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.2, 6), craneSteelMat);
  boomTruss.position.set(1.6, -0.18, 0);
  boomTruss.rotation.z = Math.PI * 0.5;
  craneBoom.add(boomTruss);
  // Counterweight (back end)
  const craneCounterweight = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.32, 0.46), new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.85 }));
  craneCounterweight.position.set(-0.7, 0, 0);
  craneBoom.add(craneCounterweight);
  // Tip warning red light
  const craneTipLight = new THREE.Mesh(new THREE.SphereGeometry(0.10, 10, 8), new THREE.MeshStandardMaterial({ color: 0xff5a3a, emissive: 0xff5a3a, emissiveIntensity: 1.0, roughness: 0.5 }));
  craneTipLight.position.set(3.7, 0.10, 0);
  craneBoom.add(craneTipLight);
  // Cable hanging from boom tip down to cargo
  const craneCable = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 3.4, 6), craneCableMat);
  craneCable.position.set(3.6, -1.7, 0);
  craneBoom.add(craneCable);
  // Cargo container at end of cable
  const craneCargo = new THREE.Group();
  craneCargo.position.set(3.6, -3.45, 0);
  const cargoBox = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.7, 1.6), cargoCrateMat);
  craneCargo.add(cargoBox);
  // Decorative stripe along cargo container
  const cargoStripe = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.10, 1.62), cargoStripeMat);
  cargoStripe.position.y = 0.18;
  craneCargo.add(cargoStripe);
  craneBoom.add(craneCargo);
  harborCraneGroup.add(craneBoom);
  group.add(harborCraneGroup);

  // Weather vane atop harbor master cottage at world (-9, 2.55, 11)
  const weatherVaneGroup = new THREE.Group();
  weatherVaneGroup.position.set(-9, 2.55, 11);
  weatherVaneGroup.rotation.y = -0.4;
  const vaneMat = new THREE.MeshStandardMaterial({ color: 0x4a3520, roughness: 0.7, metalness: 0.3 });
  const vaneAccentMat = new THREE.MeshStandardMaterial({ color: 0xc89a3a, roughness: 0.5, metalness: 0.7, emissive: 0x664a18, emissiveIntensity: 0.15 });
  // Vertical pole
  const vanePole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.6, 6), vaneMat);
  vanePole.position.y = 0.30;
  weatherVaneGroup.add(vanePole);
  // Cardinal direction cross (N/S/E/W arms)
  const armNS = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.36, 6), vaneMat);
  armNS.rotation.x = Math.PI * 0.5;
  armNS.position.y = 0.55;
  weatherVaneGroup.add(armNS);
  const armEW = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.36, 6), vaneMat);
  armEW.rotation.z = Math.PI * 0.5;
  armEW.position.y = 0.55;
  weatherVaneGroup.add(armEW);
  // North marker letter as a small decorative cube
  const northMarker = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.04), vaneAccentMat);
  northMarker.position.set(0, 0.55, 0.20);
  weatherVaneGroup.add(northMarker);
  // Spinner (rotates) — arrowhead + tail fin
  const weatherVaneSpinner = new THREE.Group();
  weatherVaneSpinner.position.y = 0.62;
  const arrowShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.42, 6), vaneAccentMat);
  arrowShaft.rotation.z = Math.PI * 0.5;
  weatherVaneSpinner.add(arrowShaft);
  const arrowHead = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.13, 8), vaneAccentMat);
  arrowHead.rotation.z = -Math.PI * 0.5;
  arrowHead.position.x = 0.27;
  weatherVaneSpinner.add(arrowHead);
  const vaneTailFin = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.10, 0.01), vaneAccentMat);
  vaneTailFin.position.x = -0.22;
  weatherVaneSpinner.add(vaneTailFin);
  weatherVaneGroup.add(weatherVaneSpinner);
  group.add(weatherVaneGroup);

  // Festival lantern string between two posts (warm glowing catenary above plaza)
  const festivalLanternGroup = new THREE.Group();
  const postMat = new THREE.MeshStandardMaterial({ color: 0x4a3520, roughness: 0.85 });
  // Post 1
  const fpost1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.4, 8), postMat);
  fpost1.position.set(-7.8, 1.65, 4.0);
  festivalLanternGroup.add(fpost1);
  // Post 2
  const fpost2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.4, 8), postMat);
  fpost2.position.set(2.2, 1.65, 4.0);
  festivalLanternGroup.add(fpost2);
  // String of lanterns (catenary-like sag along x between posts)
  const festivalLanterns = [];
  const lanternBulbGeo = new THREE.SphereGeometry(0.10, 8, 6);
  for (let i = 0; i < 12; i++) {
    const tt = (i + 0.5) / 12; // 0..1
    const xx = -7.8 + tt * 10.0;
    const sag = -0.55 * Math.sin(tt * Math.PI);
    const lanternMat = new THREE.MeshStandardMaterial({ color: 0xffc070, emissive: 0xffa040, emissiveIntensity: 0.85, roughness: 0.5 });
    const lantern = new THREE.Mesh(lanternBulbGeo, lanternMat);
    lantern.position.set(xx, 3.05 + sag, 4.0);
    lantern.userData.basePos = { x: xx, y: 3.05 + sag, z: 4.0 };
    lantern.userData.phase = Math.random() * Math.PI * 2;
    festivalLanternGroup.add(lantern);
    festivalLanterns.push(lantern);
  }
  // Faint warm point light at midspan
  const festivalLanternLight = new THREE.PointLight(0xffa040, 0.25, 7.5, 2.0);
  festivalLanternLight.position.set(-2.8, 2.55, 4.0);
  festivalLanternGroup.add(festivalLanternLight);
  group.add(festivalLanternGroup);

  // --- v19 init complete ----------------------------------------------------

  // --- v20: Tidal pool, sea cave, aurora, kraken eye -------------------------
  // Tidal pool with starfish & hermit crabs at (3, -0.04, 14)
  const tidalPoolGroup = new THREE.Group();
  tidalPoolGroup.position.set(3, -0.04, 14);
  const tidePoolWater = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 1.0),
    new THREE.MeshBasicMaterial({ color: 0x4eb6c9, transparent: true, opacity: 0.62 })
  );
  tidePoolWater.rotation.x = -Math.PI / 2;
  tidalPoolGroup.add(tidePoolWater);
  const tidePoolRim = new THREE.Mesh(
    new THREE.RingGeometry(0.55, 0.92, 28),
    new THREE.MeshBasicMaterial({ color: 0x6a554a, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
  );
  tidePoolRim.rotation.x = -Math.PI / 2;
  tidePoolRim.scale.set(1.0, 1.0, 0.7);
  tidalPoolGroup.add(tidePoolRim);
  const starfishList = [];
  const starfishSpec = [
    [-0.55, -0.20, 0xff7a55, 0.3],
    [ 0.40,  0.30, 0xe05533, 0.2],
    [ 0.10, -0.30, 0xff9466, 0.55],
    [-0.30,  0.25, 0xd44a2a, 0.8],
    [ 0.55, -0.05, 0xff8852, 1.2],
    [-0.10,  0.05, 0xffa07a, 1.0],
  ];
  for (const sp of starfishSpec) {
    const px = sp[0], pz = sp[1], col = sp[2], rot = sp[3];
    const sf = new THREE.Group();
    sf.position.set(px, 0.012, pz);
    sf.rotation.y = rot;
    for (let a = 0; a < 5; a++) {
      const ang = (a / 5) * Math.PI * 2;
      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.012, 0.18),
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.8, emissive: col, emissiveIntensity: 0.18 })
      );
      arm.rotation.y = ang;
      arm.position.set(Math.sin(ang) * 0.08, 0, Math.cos(ang) * 0.08);
      sf.add(arm);
    }
    const sfCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 8, 6),
      new THREE.MeshStandardMaterial({ color: col, roughness: 0.7 })
    );
    sf.add(sfCore);
    starfishList.push(sf);
    tidalPoolGroup.add(sf);
  }
  const hermitCrabs = [];
  for (let i = 0; i < 2; i++) {
    const crab = new THREE.Group();
    crab.position.set(i === 0 ? 0.62 : -0.45, 0.02, i === 0 ? 0.18 : -0.18);
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xa07050, roughness: 0.7 })
    );
    shell.scale.set(1.0, 0.85, 1.2);
    crab.add(shell);
    const crabEyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const crabEye1 = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), crabEyeMat);
    crabEye1.position.set(0.025, 0.05, 0.06);
    crab.add(crabEye1);
    const crabEye2 = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), crabEyeMat);
    crabEye2.position.set(-0.025, 0.05, 0.06);
    crab.add(crabEye2);
    crab.userData.phase = i * 1.7;
    hermitCrabs.push(crab);
    tidalPoolGroup.add(crab);
  }
  group.add(tidalPoolGroup);

  // Sea cave at (-22, -0.5, -8) — dark archway with cyan inner glow
  const seaCaveGroup = new THREE.Group();
  seaCaveGroup.position.set(-22, -0.5, -8);
  seaCaveGroup.rotation.y = 0.4;
  const caveArch = new THREE.Mesh(
    new THREE.TorusGeometry(1.3, 0.55, 10, 18, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x2a2c33, roughness: 0.95 })
  );
  caveArch.rotation.x = -Math.PI / 2;
  caveArch.position.y = 0.55;
  seaCaveGroup.add(caveArch);
  const caveBack = new THREE.Mesh(
    new THREE.CircleGeometry(1.15, 16, 0, Math.PI),
    new THREE.MeshBasicMaterial({ color: 0x080a12, side: THREE.DoubleSide })
  );
  caveBack.rotation.y = Math.PI / 2;
  caveBack.position.set(0.15, 0.55, 0);
  seaCaveGroup.add(caveBack);
  const caveGlow = new THREE.PointLight(0x4ee0ff, 1.0, 6, 1.8);
  caveGlow.position.set(-0.3, 0.6, 0);
  seaCaveGroup.add(caveGlow);
  const caveGlowSprite = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0x4ee0ff, transparent: true, opacity: 0.4 })
  );
  caveGlowSprite.position.set(-0.2, 0.6, 0);
  seaCaveGroup.add(caveGlowSprite);
  group.add(seaCaveGroup);

  // Aurora ribbon over the sea
  const auroraRibbon = new THREE.Group();
  auroraRibbon.position.set(0, 18, -22);
  const auroraGreen = new THREE.Mesh(
    new THREE.PlaneGeometry(42, 5),
    new THREE.MeshBasicMaterial({ color: 0x66ffaa, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false })
  );
  auroraRibbon.add(auroraGreen);
  const auroraViolet = new THREE.Mesh(
    new THREE.PlaneGeometry(42, 4),
    new THREE.MeshBasicMaterial({ color: 0xb0a0ff, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false })
  );
  auroraViolet.position.set(0, 1.4, 0.3);
  auroraRibbon.add(auroraViolet);
  group.add(auroraRibbon);

  // Kraken eye at (10, -2, -16)
  const krakenEyeGroup = new THREE.Group();
  krakenEyeGroup.position.set(10, -2, -16);
  const krakenEyelid = new THREE.Mesh(
    new THREE.SphereGeometry(0.72, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0x0a0e1a, roughness: 0.9 })
  );
  krakenEyeGroup.add(krakenEyelid);
  const krakenIris = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 14, 10),
    new THREE.MeshStandardMaterial({ color: 0xfff099, emissive: 0xffd040, emissiveIntensity: 1.2 })
  );
  krakenIris.position.set(0, 0.05, 0.55);
  krakenIris.visible = false;
  krakenEyeGroup.add(krakenIris);
  const krakenPupil = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0x000000 })
  );
  krakenPupil.position.set(0, 0.05, 0.80);
  krakenPupil.visible = false;
  krakenEyeGroup.add(krakenPupil);
  group.add(krakenEyeGroup);

  // --- v20 init complete ----------------------------------------------------

  // --- v21: Shipwreck mast, lighthouse fireflies, message bottle ------------
  // Old shipwreck mast at (-25, -0.5, -12) — broken & tilted with sail tatter
  const shipwreckGroup = new THREE.Group();
  shipwreckGroup.position.set(-25, -0.5, -12);
  shipwreckGroup.rotation.y = -0.6;
  const wreckMast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.10, 0.14, 4.4, 10),
    new THREE.MeshStandardMaterial({ color: 0x6b4d2f, roughness: 0.95 })
  );
  wreckMast.position.set(0, 1.6, 0);
  wreckMast.rotation.z = 0.45;
  shipwreckGroup.add(wreckMast);
  const wreckSail = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 1.8),
    new THREE.MeshStandardMaterial({ color: 0xb8a880, roughness: 0.9, side: THREE.DoubleSide, transparent: true, opacity: 0.78 })
  );
  wreckSail.position.set(0.7, 1.7, 0);
  wreckSail.rotation.z = 0.45;
  wreckSail.rotation.y = 0.2;
  shipwreckGroup.add(wreckSail);
  const wreckHull = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 0.5, 1.0),
    new THREE.MeshStandardMaterial({ color: 0x4a3520, roughness: 0.9 })
  );
  wreckHull.position.set(-0.4, 0.05, 0);
  wreckHull.rotation.z = 0.18;
  shipwreckGroup.add(wreckHull);
  // A few floating debris planks near the wreck
  const wreckDebris = [];
  for (let i = 0; i < 4; i++) {
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(0.5 + Math.random() * 0.5, 0.05, 0.16),
      new THREE.MeshStandardMaterial({ color: 0x6b4d2f, roughness: 0.95 })
    );
    plank.position.set((Math.random() - 0.5) * 4, 0.35, (Math.random() - 0.5) * 3);
    plank.rotation.y = Math.random() * Math.PI * 2;
    plank.userData = { phase: Math.random() * Math.PI * 2, baseY: 0.32 };
    wreckDebris.push(plank);
    shipwreckGroup.add(plank);
  }
  group.add(shipwreckGroup);

  // Lighthouse fireflies — warm yellow swarm drifting around lighthouse beam (-3.2, 1, -2.5)
  const fireflyCount = 18;
  const fireflyGeo = new THREE.BufferGeometry();
  const fireflyPositions = new Float32Array(fireflyCount * 3);
  const fireflyData = [];
  for (let i = 0; i < fireflyCount; i++) {
    const orbitR = 1.2 + Math.random() * 1.4;
    const orbitH = 1.5 + Math.random() * 1.6;
    const phase = Math.random() * Math.PI * 2;
    const speed = 0.18 + Math.random() * 0.18;
    fireflyData.push({ orbitR, orbitH, phase, speed });
    fireflyPositions[i * 3 + 0] = -3.2 + Math.cos(phase) * orbitR;
    fireflyPositions[i * 3 + 1] = orbitH;
    fireflyPositions[i * 3 + 2] = -2.5 + Math.sin(phase) * orbitR;
  }
  fireflyGeo.setAttribute('position', new THREE.BufferAttribute(fireflyPositions, 3));
  const fireflyMat = new THREE.PointsMaterial({
    color: 0xffd070,
    size: 0.13,
    transparent: true,
    opacity: 0.92,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const firefliesPoints = new THREE.Points(fireflyGeo, fireflyMat);
  group.add(firefliesPoints);

  // Message in a bottle bobbing in the harbor at (4.5, 0.18, -1)
  const msgBottleGroup = new THREE.Group();
  msgBottleGroup.position.set(4.5, 0.18, -1);
  msgBottleGroup.rotation.z = Math.PI / 2;
  const msgBottleBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.10, 0.10, 0.42, 12),
    new THREE.MeshStandardMaterial({ color: 0x88c5b0, transparent: true, opacity: 0.55, roughness: 0.2, metalness: 0.1 })
  );
  msgBottleGroup.add(msgBottleBody);
  const msgBottleNeck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.08, 0.10, 10),
    new THREE.MeshStandardMaterial({ color: 0x88c5b0, transparent: true, opacity: 0.55, roughness: 0.2 })
  );
  msgBottleNeck.position.set(0, 0.26, 0);
  msgBottleGroup.add(msgBottleNeck);
  const msgBottleCork = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.05, 8),
    new THREE.MeshStandardMaterial({ color: 0xb38a55, roughness: 0.8 })
  );
  msgBottleCork.position.set(0, 0.34, 0);
  msgBottleGroup.add(msgBottleCork);
  // Tiny scroll inside (dim warm)
  const msgBottleScroll = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.32, 8),
    new THREE.MeshStandardMaterial({ color: 0xf3e6c8, emissive: 0xc8a060, emissiveIntensity: 0.25, roughness: 0.6 })
  );
  msgBottleGroup.add(msgBottleScroll);
  group.add(msgBottleGroup);


  // --- v22: Wishing well, paper boats race, sunken treasure chest ----------
  // Wishing well at end of pier center (8.5, 0.6, -1)
  const wishingWell = new THREE.Group();
  wishingWell.position.set(8.5, 0.6, -1);
  const wellRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.55, 0.7, 18, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x6b6b73, roughness: 0.9, side: THREE.DoubleSide })
  );
  wellRing.position.y = 0.35;
  wishingWell.add(wellRing);
  const wellWater = new THREE.Mesh(
    new THREE.CircleGeometry(0.5, 18),
    new THREE.MeshStandardMaterial({ color: 0x163a4a, transparent: true, opacity: 0.85, emissive: 0x0a4d6a, emissiveIntensity: 0.4 })
  );
  wellWater.rotation.x = -Math.PI / 2;
  wellWater.position.y = 0.66;
  wishingWell.add(wellWater);
  const wellPostL = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.9, 8),
    new THREE.MeshStandardMaterial({ color: 0x6b4d2f, roughness: 0.95 })
  );
  wellPostL.position.set(-0.45, 1.15, 0);
  wishingWell.add(wellPostL);
  const wellPostR = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.9, 8),
    new THREE.MeshStandardMaterial({ color: 0x6b4d2f, roughness: 0.95 })
  );
  wellPostR.position.set(0.45, 1.15, 0);
  wishingWell.add(wellPostR);
  const wellRoof = new THREE.Mesh(
    new THREE.ConeGeometry(0.7, 0.4, 4),
    new THREE.MeshStandardMaterial({ color: 0x884420, roughness: 0.9 })
  );
  wellRoof.rotation.y = Math.PI / 4;
  wellRoof.position.y = 1.78;
  wishingWell.add(wellRoof);
  const wellCoins = [];
  for (let ci = 0; ci < 4; ci++) {
    const ang = (ci / 4) * Math.PI * 2;
    const coin = new THREE.Mesh(
      new THREE.CircleGeometry(0.06, 12),
      new THREE.MeshStandardMaterial({ color: 0xffd060, emissive: 0xffa530, emissiveIntensity: 0.6, roughness: 0.4 })
    );
    coin.rotation.x = -Math.PI / 2;
    coin.position.set(Math.cos(ang) * 0.18, 0.68, Math.sin(ang) * 0.18);
    coin.userData = { phase: ang };
    wishingWell.add(coin);
    wellCoins.push(coin);
  }
  group.add(wishingWell);

  // Paper boats race line — 5 paper boats drifting in a line near (-12, 0.18, 6)
  const paperBoatGroup = new THREE.Group();
  paperBoatGroup.position.set(-12, 0.18, 6);
  const paperBoats = [];
  const paperBoatColors = [0xfff5e8, 0xffd9a0, 0xa0d8ff, 0xffb6c1, 0xc8f0c0];
  for (let pi = 0; pi < 5; pi++) {
    const pb = new THREE.Group();
    const pbHull = new THREE.Mesh(
      new THREE.ConeGeometry(0.25, 0.5, 4),
      new THREE.MeshStandardMaterial({ color: paperBoatColors[pi], roughness: 0.7, side: THREE.DoubleSide })
    );
    pbHull.rotation.x = Math.PI / 2;
    pbHull.rotation.z = Math.PI / 4;
    pbHull.scale.set(1, 0.5, 1.6);
    pb.add(pbHull);
    const pbSail = new THREE.Mesh(
      new THREE.PlaneGeometry(0.3, 0.36),
      new THREE.MeshStandardMaterial({ color: paperBoatColors[pi], side: THREE.DoubleSide, roughness: 0.7 })
    );
    pbSail.position.set(0, 0.22, 0);
    pb.add(pbSail);
    pb.position.set(pi * 1.4 - 2.8, 0, (pi % 2) * 0.4 - 0.2);
    pb.userData = { baseX: pi * 1.4 - 2.8, baseZ: (pi % 2) * 0.4 - 0.2, phase: pi * 0.7, speed: 0.18 + (pi % 3) * 0.04 };
    paperBoatGroup.add(pb);
    paperBoats.push(pb);
  }
  group.add(paperBoatGroup);

  // Sunken treasure chest at (-7, -1.4, 16)
  const treasureGroup = new THREE.Group();
  treasureGroup.position.set(-7, -1.4, 16);
  const treasureChestBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.5, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.95 })
  );
  treasureChestBody.position.y = 0.25;
  treasureGroup.add(treasureChestBody);
  const treasureChestLid = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.18, 0.62),
    new THREE.MeshStandardMaterial({ color: 0x593818, roughness: 0.95 })
  );
  treasureChestLid.position.set(0, 0.6, -0.04);
  treasureChestLid.rotation.x = -0.35;
  treasureGroup.add(treasureChestLid);
  const treasureGlow = new THREE.PointLight(0xffd060, 0.6, 2.4, 2);
  treasureGlow.position.set(0, 0.5, 0.15);
  treasureGroup.add(treasureGlow);
  for (let gi = 0; gi < 3; gi++) {
    const nugget = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xffd060, emissive: 0xffa530, emissiveIntensity: 0.7 })
    );
    nugget.position.set((gi - 1) * 0.18, 0.5, 0.28);
    treasureGroup.add(nugget);
  }
  const treasureBubbleCount = 12;
  const treasureBubbleGeo = new THREE.BufferGeometry();
  const treasureBubblePos = new Float32Array(treasureBubbleCount * 3);
  const treasureBubblePhase = new Float32Array(treasureBubbleCount);
  for (let bi = 0; bi < treasureBubbleCount; bi++) {
    treasureBubblePos[bi * 3 + 0] = (Math.random() - 0.5) * 0.4;
    treasureBubblePos[bi * 3 + 1] = Math.random() * 1.6;
    treasureBubblePos[bi * 3 + 2] = (Math.random() - 0.5) * 0.4;
    treasureBubblePhase[bi] = Math.random() * Math.PI * 2;
  }
  treasureBubbleGeo.setAttribute('position', new THREE.BufferAttribute(treasureBubblePos, 3));
  const treasureBubbleMat = new THREE.PointsMaterial({ color: 0xc8f0ff, size: 0.08, transparent: true, opacity: 0.7, depthWrite: false });
  const treasureBubbles = new THREE.Points(treasureBubbleGeo, treasureBubbleMat);
  treasureBubbles.userData = { count: treasureBubbleCount, phases: treasureBubblePhase };
  treasureGroup.add(treasureBubbles);
  group.add(treasureGroup);


  // --- v23: Harbor seal pup + driftwood pile + buoy bell ---
  // Harbor seal pup playing in the cove
  const sealPup = new THREE.Group();
  sealPup.position.set(-4.5, 0.0, 8);
  const sealBody = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.22, 0.55, 6, 10),
    new THREE.MeshStandardMaterial({ color: 0x6b6b6b, roughness: 0.5 })
  );
  sealBody.rotation.z = Math.PI / 2;
  sealPup.add(sealBody);
  const sealHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0x6b6b6b, roughness: 0.5 })
  );
  sealHead.position.set(0.45, 0.05, 0);
  sealPup.add(sealHead);
  const sealNose = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 6, 6),
    new THREE.MeshStandardMaterial({ color: 0x222222 })
  );
  sealNose.position.set(0.62, 0.05, 0);
  sealPup.add(sealNose);
  const sealEyeL = new THREE.Mesh(
    new THREE.SphereGeometry(0.025, 6, 6),
    new THREE.MeshStandardMaterial({ color: 0x111111 })
  );
  sealEyeL.position.set(0.55, 0.13, 0.09);
  sealPup.add(sealEyeL);
  const sealEyeR = sealEyeL.clone();
  sealEyeR.position.set(0.55, 0.13, -0.09);
  sealPup.add(sealEyeR);
  const sealTailFlipper = new THREE.Mesh(
    new THREE.ConeGeometry(0.14, 0.22, 8),
    new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.6 })
  );
  sealTailFlipper.rotation.z = -Math.PI / 2;
  sealTailFlipper.position.set(-0.45, 0.0, 0);
  sealPup.add(sealTailFlipper);
  group.add(sealPup);

  // Driftwood pile on the beach
  const driftwoodPile = new THREE.Group();
  driftwoodPile.position.set(-15, 0.05, 2);
  const driftwoodColors = [0xa68c6e, 0x8b7355, 0x6f5f43, 0xb5a07c, 0x927a59];
  for (let i = 0; i < 6; i++) {
    const log = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08 + Math.random() * 0.05, 0.08 + Math.random() * 0.05, 0.7 + Math.random() * 0.4, 8),
      new THREE.MeshStandardMaterial({ color: driftwoodColors[i % driftwoodColors.length], roughness: 0.95 })
    );
    log.rotation.z = Math.PI / 2 + (Math.random() - 0.5) * 0.4;
    log.rotation.y = Math.random() * Math.PI;
    log.position.set((Math.random() - 0.5) * 0.6, 0.08 + (i % 3) * 0.12, (Math.random() - 0.5) * 0.6);
    driftwoodPile.add(log);
  }
  group.add(driftwoodPile);

  // Floating buoy bell offshore
  const buoyBell = new THREE.Group();
  buoyBell.position.set(14, 0.4, -8);
  const bellBuoyBody = new THREE.Mesh(
    new THREE.ConeGeometry(0.4, 0.8, 12),
    new THREE.MeshStandardMaterial({ color: 0xc92a2a, roughness: 0.55, emissive: 0x331111, emissiveIntensity: 0.4 })
  );
  buoyBell.add(bellBuoyBody);
  const buoyTopRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.04, 6, 12),
    new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7, roughness: 0.4 })
  );
  buoyTopRing.position.y = 0.45;
  buoyTopRing.rotation.x = Math.PI / 2;
  buoyBell.add(buoyTopRing);
  const buoyBellShape = new THREE.Mesh(
    new THREE.ConeGeometry(0.12, 0.18, 8, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xc9b87a, metalness: 0.8, roughness: 0.3, side: THREE.DoubleSide })
  );
  buoyBellShape.position.y = 0.62;
  buoyBell.add(buoyBellShape);
  const bellBuoyLight = new THREE.PointLight(0xff6644, 0.6, 4.5);
  bellBuoyLight.position.y = 0.5;
  buoyBell.add(bellBuoyLight);
  group.add(buoyBell);


  // --- v24: Beach campfire + log seats + glowing embers ---
  const campfireGroup = new THREE.Group();
  campfireGroup.position.set(-12, 0.05, -3);
  // Stone ring (8 small dark stones)
  for (let si = 0; si < 8; si++) {
    const ang = (si / 8) * Math.PI * 2;
    const stone = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 6, 5),
      new THREE.MeshStandardMaterial({ color: 0x4a4540, roughness: 0.95 })
    );
    stone.position.set(Math.cos(ang) * 0.55, 0.0, Math.sin(ang) * 0.55);
    stone.scale.y = 0.55;
    campfireGroup.add(stone);
  }
  // Crossed kindling logs (4 short cylinders)
  for (let li = 0; li < 4; li++) {
    const klog = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.7, 6),
      new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.95, emissive: 0x441100, emissiveIntensity: 0.25 })
    );
    klog.rotation.z = Math.PI / 2;
    klog.rotation.y = (li / 4) * Math.PI;
    klog.position.y = 0.06 + (li % 2) * 0.05;
    campfireGroup.add(klog);
  }
  // Flame cone (translucent, animated)
  const campflame = new THREE.Mesh(
    new THREE.ConeGeometry(0.28, 0.7, 10),
    new THREE.MeshStandardMaterial({
      color: 0xffaa44, transparent: true, opacity: 0.78,
      emissive: 0xff7a22, emissiveIntensity: 1.4, depthWrite: false
    })
  );
  campflame.position.y = 0.45;
  campfireGroup.add(campflame);
  // Inner flame (smaller, hotter)
  const campflameInner = new THREE.Mesh(
    new THREE.ConeGeometry(0.16, 0.45, 8),
    new THREE.MeshStandardMaterial({
      color: 0xfff7a0, transparent: true, opacity: 0.85,
      emissive: 0xfff7a0, emissiveIntensity: 1.6, depthWrite: false
    })
  );
  campflameInner.position.y = 0.4;
  campfireGroup.add(campflameInner);
  // Warm point light
  const campfireLight = new THREE.PointLight(0xffaa55, 1.4, 9);
  campfireLight.position.set(0, 0.5, 0);
  campfireGroup.add(campfireLight);
  // Rising embers (Points)
  const emberCount = 22;
  const emberGeo = new THREE.BufferGeometry();
  const emberPos = new Float32Array(emberCount * 3);
  const emberPhase = new Float32Array(emberCount);
  for (let ei = 0; ei < emberCount; ei++) {
    emberPos[ei * 3 + 0] = (Math.random() - 0.5) * 0.3;
    emberPos[ei * 3 + 1] = 0.2 + Math.random() * 1.4;
    emberPos[ei * 3 + 2] = (Math.random() - 0.5) * 0.3;
    emberPhase[ei] = Math.random() * Math.PI * 2;
  }
  emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
  const emberMat = new THREE.PointsMaterial({ color: 0xffd07a, size: 0.06, transparent: true, opacity: 0.85, depthWrite: false });
  const campfireEmbers = new THREE.Points(emberGeo, emberMat);
  campfireEmbers.userData = { count: emberCount, phases: emberPhase };
  campfireGroup.add(campfireEmbers);
  // Two log seats around the fire
  const logSeatColors = [0x6e5234, 0x5a4429];
  for (let lsi = 0; lsi < 2; lsi++) {
    const logSeat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 1.1, 8),
      new THREE.MeshStandardMaterial({ color: logSeatColors[lsi], roughness: 0.9 })
    );
    logSeat.rotation.z = Math.PI / 2;
    const ang = lsi === 0 ? 0.6 : -0.6;
    logSeat.position.set(Math.cos(ang) * 1.4, 0.16, Math.sin(ang) * 1.4);
    logSeat.rotation.y = -ang + Math.PI / 2;
    campfireGroup.add(logSeat);
  }
  group.add(campfireGroup);


  // --- v25: Seagulls overhead + octopus tentacle peeking from rocks ---
  // Three flying seagulls circling above harbor at varying heights/speeds
  const seagullList = [];
  const seagullSpecs = [
    { r: 14, y: 6.5, speed: 0.35, phase: 0.0, color: 0xf5f5f5 },
    { r: 9, y: 5.2, speed: -0.42, phase: 1.7, color: 0xeaeaea },
    { r: 18, y: 7.8, speed: 0.28, phase: 3.4, color: 0xfafafa },
  ];
  seagullSpecs.forEach((spec) => {
    const gull = new THREE.Group();
    // Body
    const gullBody = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 8, 6),
      new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.55 })
    );
    gullBody.scale.set(1.3, 0.7, 0.7);
    gull.add(gullBody);
    // Head
    const gullHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 8, 6),
      new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.55 })
    );
    gullHead.position.set(0.22, 0.04, 0);
    gull.add(gullHead);
    // Beak
    const gullBeak = new THREE.Mesh(
      new THREE.ConeGeometry(0.025, 0.09, 6),
      new THREE.MeshStandardMaterial({ color: 0xffaa22 })
    );
    gullBeak.rotation.z = -Math.PI / 2;
    gullBeak.position.set(0.31, 0.03, 0);
    gull.add(gullBeak);
    // Wings (two flat planes that flap)
    const gullWingMat = new THREE.MeshStandardMaterial({ color: 0xdcdcdc, side: THREE.DoubleSide, roughness: 0.6 });
    const gullWingL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.02, 0.18), gullWingMat);
    gullWingL.position.set(0, 0.05, 0.16);
    gull.add(gullWingL);
    const gullWingR = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.02, 0.18), gullWingMat);
    gullWingR.position.set(0, 0.05, -0.16);
    gull.add(gullWingR);
    // Tail
    const gullTail = new THREE.Mesh(
      new THREE.ConeGeometry(0.07, 0.18, 6),
      new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.6 })
    );
    gullTail.rotation.z = Math.PI / 2;
    gullTail.position.set(-0.24, 0.0, 0);
    gull.add(gullTail);
    gull.userData = { spec, wingL: gullWingL, wingR: gullWingR };
    group.add(gull);
    seagullList.push(gull);
  });

  // Octopus tentacle peeking from rocks
  const octopusTentacle = new THREE.Group();
  octopusTentacle.position.set(7, -1.3, 14);
  const tentacleSegments = [];
  const tentColors = 0x8b3a62;
  const tentSegCount = 8;
  for (let ti = 0; ti < tentSegCount; ti++) {
    const radius = 0.16 - ti * 0.012;
    const seg = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 8, 6),
      new THREE.MeshStandardMaterial({
        color: tentColors,
        roughness: 0.55,
        emissive: 0x441122,
        emissiveIntensity: 0.18
      })
    );
    seg.position.set(0, ti * 0.18, 0);
    octopusTentacle.add(seg);
    tentacleSegments.push(seg);
  }
  // Suckers (tiny pale dots on segments)
  for (let ti = 1; ti < tentSegCount; ti++) {
    for (let su = 0; su < 2; su++) {
      const sucker = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 5, 4),
        new THREE.MeshStandardMaterial({ color: 0xf6e0d8, roughness: 0.5 })
      );
      sucker.position.set(su === 0 ? 0.12 : -0.12, ti * 0.18, 0);
      octopusTentacle.add(sucker);
    }
  }
  group.add(octopusTentacle);

  // --- v26: Stargazer with telescope on cliff + moored sailboat ------------
  // Stargazer figure perched on the cliff, peering through a telescope at the night sky
  const stargazerGroup = new THREE.Group();
  stargazerGroup.position.set(-16, 1.6, -10);
  // Body
  const stargazerBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 0.9, 12),
    new THREE.MeshStandardMaterial({ color: 0x3a4a8a, roughness: 0.7 })
  );
  stargazerBody.position.y = 0.45;
  stargazerGroup.add(stargazerBody);
  // Head
  const stargazerHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xefcfa8, roughness: 0.6 })
  );
  stargazerHead.position.y = 1.06;
  stargazerGroup.add(stargazerHead);
  // Scarf
  const stargazerScarf = new THREE.Mesh(
    new THREE.TorusGeometry(0.14, 0.06, 8, 16),
    new THREE.MeshStandardMaterial({ color: 0xd03a3a, roughness: 0.7 })
  );
  stargazerScarf.position.y = 0.92;
  stargazerScarf.rotation.x = Math.PI / 2;
  stargazerGroup.add(stargazerScarf);
  // Tripod legs
  const tripodMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6, metalness: 0.4 });
  for (let li = 0; li < 3; li++) {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.8, 6),
      tripodMat
    );
    const ang = (li / 3) * Math.PI * 2;
    leg.position.set(Math.cos(ang) * 0.18, 0.4, Math.sin(ang) * 0.18 + 0.45);
    leg.rotation.z = Math.cos(ang) * 0.18;
    leg.rotation.x = -Math.sin(ang) * 0.18;
    stargazerGroup.add(leg);
  }
  // Telescope mount + barrel (animated)
  const telescopeMount = new THREE.Group();
  telescopeMount.position.set(0, 0.85, 0.45);
  const telescopeBarrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 0.95, 16),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4, metalness: 0.6 })
  );
  telescopeBarrel.rotation.z = Math.PI / 2;
  telescopeMount.add(telescopeBarrel);
  const telescopeLens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.11, 0.05, 16),
    new THREE.MeshStandardMaterial({ color: 0x88ccee, roughness: 0.2, metalness: 0.7, emissive: 0x224466, emissiveIntensity: 0.3 })
  );
  telescopeLens.rotation.z = Math.PI / 2;
  telescopeLens.position.x = 0.5;
  telescopeMount.add(telescopeLens);
  const telescopeEyepiece = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.12, 12),
    new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.4, metalness: 0.5 })
  );
  telescopeEyepiece.rotation.z = Math.PI / 2;
  telescopeEyepiece.position.x = -0.55;
  telescopeMount.add(telescopeEyepiece);
  stargazerGroup.add(telescopeMount);
  group.add(stargazerGroup);

  // Moored sailboat at (10, 0.2, -2)
  const sailboatGroup = new THREE.Group();
  sailboatGroup.position.set(10, 0.2, -2);
  // Hull
  const sailboatHull = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.5, 1.8, 6, 12),
    new THREE.MeshStandardMaterial({ color: 0x6b3a1f, roughness: 0.7 })
  );
  sailboatHull.rotation.z = Math.PI / 2;
  sailboatHull.scale.set(1, 1, 0.55);
  sailboatGroup.add(sailboatHull);
  // Deck
  const sailboatDeck = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.05, 0.8),
    new THREE.MeshStandardMaterial({ color: 0xc8a878, roughness: 0.7 })
  );
  sailboatDeck.position.y = 0.32;
  sailboatGroup.add(sailboatDeck);
  // Mast
  const sailboatMast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.05, 2.6, 8),
    new THREE.MeshStandardMaterial({ color: 0x4a2f18, roughness: 0.7 })
  );
  sailboatMast.position.set(0, 1.6, 0);
  sailboatGroup.add(sailboatMast);
  // Triangular sail
  const sailGeo = new THREE.BufferGeometry();
  sailGeo.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 2.7, 0,
    0, 0.5, 0,
    1.0, 0.5, 0
  ], 3));
  sailGeo.setIndex([0, 1, 2, 0, 2, 1]);
  sailGeo.computeVertexNormals();
  const sailMesh = new THREE.Mesh(
    sailGeo,
    new THREE.MeshStandardMaterial({ color: 0xfdfaf0, roughness: 0.9, side: THREE.DoubleSide, emissive: 0x222222, emissiveIntensity: 0.1 })
  );
  sailMesh.position.set(0, 0.32, 0);
  sailboatGroup.add(sailMesh);
  // Small lantern hanging from mast
  const sailboatLantern = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xffd060, emissive: 0xffaa30, emissiveIntensity: 1.4 })
  );
  sailboatLantern.position.set(0.05, 2.3, 0);
  sailboatGroup.add(sailboatLantern);
  const sailboatLanternLight = new THREE.PointLight(0xffaa44, 0.6, 5, 2.0);
  sailboatLanternLight.position.copy(sailboatLantern.position);
  sailboatGroup.add(sailboatLanternLight);
  group.add(sailboatGroup);

  // --- v27: Pier bench with sleeping cat + flagpole with flag --------------
  const pierBenchGroup = new THREE.Group();
  pierBenchGroup.position.set(4, 0.9, -3.6);
  // Bench seat
  const benchSeat = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 0.08, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x8d5a32, roughness: 0.8 })
  );
  pierBenchGroup.add(benchSeat);
  // Bench backrest
  const benchBack = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 0.5, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x8d5a32, roughness: 0.8 })
  );
  benchBack.position.set(0, 0.3, -0.18);
  pierBenchGroup.add(benchBack);
  // Bench legs
  for (let bi = 0; bi < 2; bi++) {
    const benchLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.85, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x4a2f18, roughness: 0.8 })
    );
    benchLeg.position.set(bi === 0 ? -0.85 : 0.85, -0.45, 0);
    pierBenchGroup.add(benchLeg);
  }
  // Sleeping cat (curled up on bench)
  const pierCatGroup = new THREE.Group();
  pierCatGroup.position.set(-0.6, 0.13, 0);
  const pierCatBody = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 14, 12),
    new THREE.MeshStandardMaterial({ color: 0xd87830, roughness: 0.8 })
  );
  pierCatBody.scale.set(1.4, 0.7, 1.0);
  pierCatGroup.add(pierCatBody);
  const pierCatHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xd87830, roughness: 0.8 })
  );
  pierCatHead.position.set(0.18, 0.04, 0.05);
  pierCatGroup.add(pierCatHead);
  // Cat ears
  for (let ei = 0; ei < 2; ei++) {
    const pierCatEar = new THREE.Mesh(
      new THREE.ConeGeometry(0.04, 0.08, 6),
      new THREE.MeshStandardMaterial({ color: 0xc4651e, roughness: 0.8 })
    );
    pierCatEar.position.set(0.18, 0.13, ei === 0 ? -0.05 : 0.13);
    pierCatGroup.add(pierCatEar);
  }
  // Cat tail (curled)
  const pierCatTail = new THREE.Mesh(
    new THREE.TorusGeometry(0.1, 0.025, 6, 14, Math.PI * 1.4),
    new THREE.MeshStandardMaterial({ color: 0xd87830, roughness: 0.8 })
  );
  pierCatTail.position.set(-0.15, 0.0, 0.0);
  pierCatTail.rotation.x = Math.PI / 2;
  pierCatGroup.add(pierCatTail);
  pierBenchGroup.add(pierCatGroup);
  group.add(pierBenchGroup);

  // Flagpole with flapping flag at (-7, 0, -8)
  const flagpoleGroup = new THREE.Group();
  flagpoleGroup.position.set(-7, 0, -8);
  const flagpole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.08, 5.2, 10),
    new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.4, metalness: 0.5 })
  );
  flagpole.position.y = 2.6;
  flagpoleGroup.add(flagpole);
  const flagpoleCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.3, metalness: 0.7 })
  );
  flagpoleCap.position.y = 5.25;
  flagpoleGroup.add(flagpoleCap);
  // Flag - segmented for animation
  const flagSegments = [];
  const flagMat = new THREE.MeshStandardMaterial({ color: 0xc6322a, roughness: 0.85, side: THREE.DoubleSide, emissive: 0x331111, emissiveIntensity: 0.15 });
  const flagSegCount = 8;
  for (let fi = 0; fi < flagSegCount; fi++) {
    const seg = new THREE.Mesh(
      new THREE.PlaneGeometry(0.18, 0.9),
      flagMat
    );
    seg.position.set(0.18 + fi * 0.18, 4.6, 0);
    flagpoleGroup.add(seg);
    flagSegments.push(seg);
  }
  group.add(flagpoleGroup);

  // --- v28: Distant rocky outcrop with mini lighthouse + fishing rod -------
  // Distant rocky outcrop with a small lighthouse (visible across the water)
  const outcropGroup = new THREE.Group();
  outcropGroup.position.set(28, 0, 22);
  // Rocks (3 stacked)
  for (let oi = 0; oi < 4; oi++) {
    const rock = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.2 + oi * 0.3, 0),
      new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.95, flatShading: true })
    );
    rock.position.set((oi - 1.5) * 0.6, 0.6 + oi * 0.4, (oi % 2) * 0.4);
    rock.rotation.set(oi * 0.4, oi * 0.7, 0);
    outcropGroup.add(rock);
  }
  // Mini lighthouse on top
  const miniLighthouse = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.5, 2.6, 12),
    new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.6 })
  );
  miniLighthouse.position.set(0, 3.6, 0.4);
  outcropGroup.add(miniLighthouse);
  // Red stripes on lighthouse
  for (let si = 0; si < 2; si++) {
    const stripe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.45, 0.4, 12),
      new THREE.MeshStandardMaterial({ color: 0xc02020, roughness: 0.6 })
    );
    stripe.position.set(0, 2.9 + si * 0.95, 0.4);
    outcropGroup.add(stripe);
  }
  // Lantern room
  const miniLanternRoom = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, 0.4, 12),
    new THREE.MeshStandardMaterial({ color: 0x202028, roughness: 0.4, metalness: 0.7, emissive: 0xffaa44, emissiveIntensity: 0.6 })
  );
  miniLanternRoom.position.set(0, 5.1, 0.4);
  outcropGroup.add(miniLanternRoom);
  // Cap
  const miniLanternCap = new THREE.Mesh(
    new THREE.ConeGeometry(0.46, 0.5, 12),
    new THREE.MeshStandardMaterial({ color: 0x882020, roughness: 0.6 })
  );
  miniLanternCap.position.set(0, 5.55, 0.4);
  outcropGroup.add(miniLanternCap);
  // Beam light
  const miniLanternLight = new THREE.PointLight(0xffcc66, 1.2, 30, 2.0);
  miniLanternLight.position.set(0, 5.1, 0.4);
  outcropGroup.add(miniLanternLight);
  group.add(outcropGroup);

  // Fishing rod with line going into water at (6.5, 0.95, -2)
  const fishingRodGroup = new THREE.Group();
  fishingRodGroup.position.set(6.5, 0.95, -2);
  const fishingRod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.04, 1.8, 8),
    new THREE.MeshStandardMaterial({ color: 0x3a2a18, roughness: 0.7 })
  );
  fishingRod.rotation.z = -Math.PI / 3;
  fishingRod.position.set(0.6, 0.6, 0);
  fishingRodGroup.add(fishingRod);
  // Line
  const fishingLine = new THREE.Mesh(
    new THREE.CylinderGeometry(0.005, 0.005, 1.6, 4),
    new THREE.MeshStandardMaterial({ color: 0xeeeeee })
  );
  fishingLine.position.set(1.4, 0.4, 0);
  fishingRodGroup.add(fishingLine);
  // Bobber
  const fishingBobber = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0xff3030, roughness: 0.5 })
  );
  fishingBobber.position.set(1.4, -0.4, 0);
  fishingRodGroup.add(fishingBobber);
  group.add(fishingRodGroup);


  // --- v29: Pier crab walking sideways + treasure island + distant mountain --
  // Pier crab — walks sideways across the pier in a back-and-forth pattern
  const pierCrabGroup = new THREE.Group();
  pierCrabGroup.position.set(2.5, 1.05, -3.4);
  // Body — flat oval
  const pierCrabBody = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 14, 10),
    new THREE.MeshStandardMaterial({ color: 0xc94224, roughness: 0.55, metalness: 0.05 })
  );
  pierCrabBody.scale.set(1.3, 0.55, 1.0);
  pierCrabGroup.add(pierCrabBody);
  // Two eyestalks
  for (let i = 0; i < 2; i++) {
    const stalk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.10, 6),
      new THREE.MeshStandardMaterial({ color: 0xa83018, roughness: 0.6 })
    );
    stalk.position.set((i === 0 ? -0.06 : 0.06), 0.13, 0.1);
    pierCrabGroup.add(stalk);
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.2, emissive: 0x331100, emissiveIntensity: 0.3 })
    );
    eye.position.set((i === 0 ? -0.06 : 0.06), 0.19, 0.1);
    pierCrabGroup.add(eye);
  }
  // Two front claws
  const pierCrabClaws = [];
  for (let i = 0; i < 2; i++) {
    const claw = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xb53820, roughness: 0.55 })
    );
    claw.scale.set(1.2, 0.7, 0.8);
    claw.position.set((i === 0 ? -0.22 : 0.22), 0, 0.18);
    pierCrabGroup.add(claw);
    pierCrabClaws.push(claw);
  }
  // Six legs (3 per side)
  const pierCrabLegs = [];
  for (let side = 0; side < 2; side++) {
    for (let i = 0; i < 3; i++) {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.20, 6),
        new THREE.MeshStandardMaterial({ color: 0xa83018, roughness: 0.65 })
      );
      leg.rotation.z = (side === 0 ? 0.6 : -0.6);
      leg.position.set((side === 0 ? -0.18 : 0.18), -0.04, -0.10 + i * 0.10);
      pierCrabGroup.add(leg);
      pierCrabLegs.push(leg);
    }
  }
  group.add(pierCrabGroup);

  // Treasure island — small distant silhouette with palm tree
  const treasureIslandGroup = new THREE.Group();
  treasureIslandGroup.position.set(-42, 0, 38);
  // Sand mound
  const treasureIslandSand = new THREE.Mesh(
    new THREE.SphereGeometry(4.5, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xd9c389, roughness: 0.95 })
  );
  treasureIslandSand.scale.set(1.2, 0.4, 1.0);
  treasureIslandGroup.add(treasureIslandSand);
  // Palm tree trunk
  const treasureIslandTrunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.28, 3.2, 8),
    new THREE.MeshStandardMaterial({ color: 0x6b4a26, roughness: 0.8 })
  );
  treasureIslandTrunk.position.set(0.4, 1.6, 0);
  treasureIslandTrunk.rotation.z = -0.18;
  treasureIslandGroup.add(treasureIslandTrunk);
  // Palm fronds — 5 cones radiating
  for (let i = 0; i < 5; i++) {
    const frond = new THREE.Mesh(
      new THREE.ConeGeometry(0.4, 1.6, 6),
      new THREE.MeshStandardMaterial({ color: 0x2e7a3a, roughness: 0.7, side: THREE.DoubleSide })
    );
    const a = (i / 5) * Math.PI * 2;
    frond.position.set(0.4 + Math.cos(a) * 0.6, 3.0, Math.sin(a) * 0.6);
    frond.rotation.z = Math.cos(a) * 0.9 + Math.PI / 2;
    frond.rotation.x = Math.sin(a) * 0.9;
    treasureIslandGroup.add(frond);
  }
  // X marks the spot — small red X on the sand
  const xMarkA = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.05, 0.08),
    new THREE.MeshStandardMaterial({ color: 0xc0392b, emissive: 0x551111, emissiveIntensity: 0.4 })
  );
  xMarkA.position.set(-0.8, 1.85, 0.6);
  xMarkA.rotation.y = Math.PI / 4;
  treasureIslandGroup.add(xMarkA);
  const xMarkB = xMarkA.clone();
  xMarkB.rotation.y = -Math.PI / 4;
  treasureIslandGroup.add(xMarkB);
  group.add(treasureIslandGroup);

  // Distant mountain silhouette behind the lighthouse
  const distantMountainGroup = new THREE.Group();
  distantMountainGroup.position.set(-30, 0, -55);
  const mtnPeakColors = [0x3a4a5e, 0x445770, 0x546788];
  const mtnPeakHeights = [9, 13, 7, 11, 8];
  const mtnPeakWidths = [10, 12, 9, 11, 10];
  let mtnX = -22;
  for (let i = 0; i < mtnPeakHeights.length; i++) {
    const peak = new THREE.Mesh(
      new THREE.ConeGeometry(mtnPeakWidths[i], mtnPeakHeights[i], 5),
      new THREE.MeshStandardMaterial({
        color: mtnPeakColors[i % mtnPeakColors.length],
        roughness: 0.9,
        flatShading: true
      })
    );
    peak.position.set(mtnX, mtnPeakHeights[i] / 2, 0);
    distantMountainGroup.add(peak);
    // Snow cap
    const snowCap = new THREE.Mesh(
      new THREE.ConeGeometry(mtnPeakWidths[i] * 0.35, mtnPeakHeights[i] * 0.25, 5),
      new THREE.MeshStandardMaterial({ color: 0xeef4ff, roughness: 0.85 })
    );
    snowCap.position.set(mtnX, mtnPeakHeights[i] * 0.88, 0);
    distantMountainGroup.add(snowCap);
    mtnX += mtnPeakWidths[i] * 0.85;
  }
  group.add(distantMountainGroup);


  // --- v30: Mermaid on outcrop + anchor with chain + cargo crate w/ pulley ---
  // Mermaid sitting on a rock near the mini lighthouse outcrop
  const outcropMermaidGroup = new THREE.Group();
  outcropMermaidGroup.position.set(26.5, 1.4, 23);
  // Tail (curving cylinder + fluke)
  const outcropMermaidTail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.10, 1.0, 10),
    new THREE.MeshStandardMaterial({ color: 0x2a8aaa, roughness: 0.4, metalness: 0.3 })
  );
  outcropMermaidTail.rotation.z = Math.PI / 2.3;
  outcropMermaidTail.position.set(0.3, 0.05, 0);
  outcropMermaidGroup.add(outcropMermaidTail);
  const outcropMermaidFluke = new THREE.Mesh(
    new THREE.ConeGeometry(0.32, 0.5, 6, 1, false, 0, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x36a3c4, roughness: 0.4, side: THREE.DoubleSide })
  );
  outcropMermaidFluke.rotation.z = -Math.PI / 2;
  outcropMermaidFluke.scale.set(1, 0.4, 1);
  outcropMermaidFluke.position.set(0.95, 0.05, 0);
  outcropMermaidGroup.add(outcropMermaidFluke);
  // Torso
  const outcropMermaidTorso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.20, 0.5, 8),
    new THREE.MeshStandardMaterial({ color: 0xf2c8a0, roughness: 0.7 })
  );
  outcropMermaidTorso.position.set(-0.05, 0.4, 0);
  outcropMermaidGroup.add(outcropMermaidTorso);
  // Head
  const outcropMermaidHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xf2c8a0, roughness: 0.7 })
  );
  outcropMermaidHead.position.set(-0.05, 0.78, 0);
  outcropMermaidGroup.add(outcropMermaidHead);
  // Long flowing hair
  const outcropMermaidHair = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.10, 0.55, 8),
    new THREE.MeshStandardMaterial({ color: 0x8a3a18, roughness: 0.85 })
  );
  outcropMermaidHair.position.set(-0.10, 0.55, -0.04);
  outcropMermaidGroup.add(outcropMermaidHair);
  // Arm waving
  const outcropMermaidArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.04, 0.45, 6),
    new THREE.MeshStandardMaterial({ color: 0xf2c8a0, roughness: 0.7 })
  );
  outcropMermaidArm.position.set(-0.2, 0.6, 0.08);
  outcropMermaidArm.rotation.z = 0.7;
  outcropMermaidGroup.add(outcropMermaidArm);
  group.add(outcropMermaidGroup);

  // Anchor with chain — sitting on the pier
  const dockAnchorGroup = new THREE.Group();
  dockAnchorGroup.position.set(5.5, 1.0, -3.0);
  // Anchor shank (vertical bar)
  const dockAnchorShank = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.85, 8),
    new THREE.MeshStandardMaterial({ color: 0x3a3a44, roughness: 0.55, metalness: 0.7 })
  );
  dockAnchorShank.position.set(0, 0.42, 0);
  dockAnchorGroup.add(dockAnchorShank);
  // Cross arm at top (stock)
  const dockAnchorStock = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.55, 6),
    new THREE.MeshStandardMaterial({ color: 0x3a3a44, roughness: 0.55, metalness: 0.7 })
  );
  dockAnchorStock.rotation.z = Math.PI / 2;
  dockAnchorStock.position.set(0, 0.78, 0);
  dockAnchorGroup.add(dockAnchorStock);
  // Top ring
  const dockAnchorRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.10, 0.03, 8, 16),
    new THREE.MeshStandardMaterial({ color: 0x3a3a44, roughness: 0.5, metalness: 0.75 })
  );
  dockAnchorRing.position.set(0, 0.95, 0);
  dockAnchorRing.rotation.x = Math.PI / 2;
  dockAnchorGroup.add(dockAnchorRing);
  // Two flukes (bottom curves)
  for (let i = 0; i < 2; i++) {
    const fluke = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.05, 6, 12, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x3a3a44, roughness: 0.5, metalness: 0.7 })
    );
    fluke.rotation.z = (i === 0 ? Math.PI : -Math.PI / 2);
    fluke.position.set(0, 0.05, 0);
    dockAnchorGroup.add(fluke);
    // Pointed tip
    const tip = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.16, 5),
      new THREE.MeshStandardMaterial({ color: 0x3a3a44, roughness: 0.5, metalness: 0.7 })
    );
    tip.position.set(i === 0 ? -0.22 : 0.22, 0.05, 0);
    tip.rotation.z = (i === 0 ? Math.PI / 2 : -Math.PI / 2);
    dockAnchorGroup.add(tip);
  }
  // Chain — 6 torus links coming out the top of the anchor and curving down to the pier
  const dockAnchorChain = [];
  for (let i = 0; i < 7; i++) {
    const link = new THREE.Mesh(
      new THREE.TorusGeometry(0.05, 0.014, 6, 10),
      new THREE.MeshStandardMaterial({ color: 0x6c6c74, roughness: 0.6, metalness: 0.6 })
    );
    link.position.set(0.05 * i, 1.05 + 0.05 * i, 0);
    link.rotation.x = (i % 2 === 0) ? 0 : Math.PI / 2;
    dockAnchorGroup.add(link);
    dockAnchorChain.push(link);
  }
  group.add(dockAnchorGroup);

  // Cargo crate with pulley & rope on the pier
  const cargoCrateGroup = new THREE.Group();
  cargoCrateGroup.position.set(-3.5, 0.95, -2.0);
  // Vertical post (the gantry)
  const cargoPost = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 2.5, 8),
    new THREE.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 0.85 })
  );
  cargoPost.position.set(0, 1.25, 0);
  cargoCrateGroup.add(cargoPost);
  // Horizontal arm
  const cargoArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 1.0, 6),
    new THREE.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 0.85 })
  );
  cargoArm.rotation.z = Math.PI / 2;
  cargoArm.position.set(0.5, 2.45, 0);
  cargoCrateGroup.add(cargoArm);
  // Pulley wheel at end of arm
  const cargoPulley = new THREE.Mesh(
    new THREE.TorusGeometry(0.10, 0.04, 8, 14),
    new THREE.MeshStandardMaterial({ color: 0x383028, roughness: 0.7, metalness: 0.4 })
  );
  cargoPulley.position.set(0.95, 2.40, 0);
  cargoPulley.rotation.x = Math.PI / 2;
  cargoCrateGroup.add(cargoPulley);
  // Rope
  const cargoRope = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 1.6, 6),
    new THREE.MeshStandardMaterial({ color: 0xc9a05c, roughness: 0.95 })
  );
  cargoRope.position.set(0.95, 1.55, 0);
  cargoCrateGroup.add(cargoRope);
  // Crate
  const cargoCrate = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.45, 0.55),
    new THREE.MeshStandardMaterial({ color: 0x8a5a30, roughness: 0.85 })
  );
  cargoCrate.position.set(0.95, 0.55, 0);
  cargoCrateGroup.add(cargoCrate);
  // Crate slats
  for (let i = -1; i <= 1; i++) {
    const slat = new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.04, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x4a3018, roughness: 0.9 })
    );
    slat.position.set(0.95, 0.55 + i * 0.18, 0.30);
    cargoCrateGroup.add(slat);
  }
  group.add(cargoCrateGroup);

  // --- v31: Lighthouse keeper figure waving + whale tour boat ---
  // Lighthouse keeper standing on the porch of the keeper cottage, waving
  const dockKeeperGroup = new THREE.Group();
  // Body (stocky cylinder)
  const dockKeeperBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.20, 0.55, 10),
    new THREE.MeshStandardMaterial({ color: 0x2d4a78, roughness: 0.85 })
  );
  dockKeeperBody.position.y = 0.275;
  dockKeeperGroup.add(dockKeeperBody);
  // Yellow rain coat overlay (wider band)
  const dockKeeperCoat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.24, 0.40, 10),
    new THREE.MeshStandardMaterial({ color: 0xe8c34a, roughness: 0.8, emissive: 0x2a1f08, emissiveIntensity: 0.25 })
  );
  dockKeeperCoat.position.y = 0.32;
  dockKeeperGroup.add(dockKeeperCoat);
  // Head
  const dockKeeperHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xe8c39a, roughness: 0.7 })
  );
  dockKeeperHead.position.y = 0.66;
  dockKeeperGroup.add(dockKeeperHead);
  // Yellow rain hat
  const dockKeeperHat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.20, 0.10, 12),
    new THREE.MeshStandardMaterial({ color: 0xe8c34a, roughness: 0.85 })
  );
  dockKeeperHat.position.y = 0.78;
  dockKeeperGroup.add(dockKeeperHat);
  // Hat brim
  const dockKeeperBrim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.025, 14),
    new THREE.MeshStandardMaterial({ color: 0xc9a437, roughness: 0.85 })
  );
  dockKeeperBrim.position.y = 0.74;
  dockKeeperGroup.add(dockKeeperBrim);
  // Static arm down (left)
  const dockKeeperArmL = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.06, 0.32, 8),
    new THREE.MeshStandardMaterial({ color: 0xe8c34a, roughness: 0.85 })
  );
  dockKeeperArmL.position.set(-0.20, 0.40, 0);
  dockKeeperArmL.rotation.z = 0.1;
  dockKeeperGroup.add(dockKeeperArmL);
  // Waving arm (right) - animated
  const dockKeeperArmR = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.06, 0.32, 8),
    new THREE.MeshStandardMaterial({ color: 0xe8c34a, roughness: 0.85 })
  );
  dockKeeperArmR.geometry.translate(0, 0.16, 0); // pivot at shoulder
  dockKeeperArmR.position.set(0.21, 0.50, 0);
  dockKeeperGroup.add(dockKeeperArmR);
  // Position keeper near lighthouse cottage (-3.2, 1.2, -2.5) - on the porch / pier
  dockKeeperGroup.position.set(-2.6, 1.05, -2.3);
  dockKeeperGroup.rotation.y = 0.6;
  group.add(dockKeeperGroup);

  // Whale tour boat — bigger boat with passenger figures, circles wider arc
  const whaleTourGroup = new THREE.Group();
  // Hull (longer + flat-bottomed)
  const tourHull = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 0.32, 0.95),
    new THREE.MeshStandardMaterial({ color: 0xc8d6e0, roughness: 0.7 })
  );
  tourHull.position.y = 0.16;
  whaleTourGroup.add(tourHull);
  // Hull stripe
  const tourStripe = new THREE.Mesh(
    new THREE.BoxGeometry(2.62, 0.08, 0.97),
    new THREE.MeshStandardMaterial({ color: 0x18527a, roughness: 0.7 })
  );
  tourStripe.position.y = 0.05;
  whaleTourGroup.add(tourStripe);
  // Cabin (boxy, mid-deck)
  const tourCabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.42, 0.75),
    new THREE.MeshStandardMaterial({ color: 0xe8eef2, roughness: 0.7 })
  );
  tourCabin.position.set(-0.2, 0.55, 0);
  whaleTourGroup.add(tourCabin);
  // Cabin roof
  const tourRoof = new THREE.Mesh(
    new THREE.BoxGeometry(1.45, 0.06, 0.78),
    new THREE.MeshStandardMaterial({ color: 0x3a4a5a, roughness: 0.8 })
  );
  tourRoof.position.set(-0.2, 0.79, 0);
  whaleTourGroup.add(tourRoof);
  // Lit cabin windows (4 small)
  for (let i = -1; i <= 1; i++) {
    const win = new THREE.Mesh(
      new THREE.PlaneGeometry(0.22, 0.18),
      new THREE.MeshStandardMaterial({ color: 0xffe9a8, emissive: 0xffd070, emissiveIntensity: 0.95, side: THREE.DoubleSide })
    );
    win.position.set(-0.2 + i * 0.40, 0.58, 0.376);
    whaleTourGroup.add(win);
  }
  // Mast with flag
  const tourMast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.95, 6),
    new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 })
  );
  tourMast.position.set(-0.2, 1.28, 0);
  whaleTourGroup.add(tourMast);
  const tourFlag = new THREE.Mesh(
    new THREE.PlaneGeometry(0.30, 0.18),
    new THREE.MeshStandardMaterial({ color: 0xff5b5b, side: THREE.DoubleSide, roughness: 0.7 })
  );
  tourFlag.position.set(-0.05, 1.65, 0);
  whaleTourGroup.add(tourFlag);
  // Passenger silhouettes on deck (3 small figures)
  const tourPassengers = [];
  for (let i = 0; i < 4; i++) {
    const pax = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.07, 0.26, 8),
      new THREE.MeshStandardMaterial({ color: [0x5a7e2a, 0x8b3a3a, 0x3a5a8b, 0x7a3a8b][i % 4], roughness: 0.85 })
    );
    pax.position.set(0.85 + i * 0.10, 0.45, [-0.32, 0.32, -0.32, 0.32][i]);
    whaleTourGroup.add(pax);
    const paxHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xe8c39a, roughness: 0.7 })
    );
    paxHead.position.set(0.85 + i * 0.10, 0.62, [-0.32, 0.32, -0.32, 0.32][i]);
    whaleTourGroup.add(paxHead);
    tourPassengers.push({ body: pax, head: paxHead, phase: i * 1.2 });
  }
  // Wake foam streak behind boat (small trailing plane)
  const tourWake = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 0.7),
    new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.32, side: THREE.DoubleSide, roughness: 0.6 })
  );
  tourWake.rotation.x = -Math.PI / 2;
  tourWake.position.set(-1.6, 0.04, 0);
  whaleTourGroup.add(tourWake);
  whaleTourGroup.position.set(16, 0.18, 8);
  group.add(whaleTourGroup);


  // --- v32: Lobster trap stack on pier + sandcastle with flag + dolphin trio jumping ---
  // Stack of 3 wooden lobster traps on the pier
  const lobsterTrapGroup = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const trap = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.30, 0.40),
      new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.95 })
    );
    trap.position.y = 0.15 + i * 0.32;
    trap.position.x = (i % 2) * 0.06;
    trap.rotation.y = (i - 1) * 0.12;
    lobsterTrapGroup.add(trap);
    // Slatted wire-cage rim suggestion (top edge band)
    const trapRim = new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.04, 0.43),
      new THREE.MeshStandardMaterial({ color: 0x4a3a22, roughness: 0.9 })
    );
    trapRim.position.set(trap.position.x, 0.30 + i * 0.32, 0);
    trapRim.rotation.y = trap.rotation.y;
    lobsterTrapGroup.add(trapRim);
    // Buoy float tied to top of stack only
    if (i === 2) {
      const trapBuoy = new THREE.Mesh(
        new THREE.SphereGeometry(0.10, 10, 8),
        new THREE.MeshStandardMaterial({ color: 0xc83a3a, roughness: 0.7, emissive: 0x4a0808, emissiveIntensity: 0.2 })
      );
      trapBuoy.position.set(0.30, 0.55 + i * 0.32, 0.20);
      lobsterTrapGroup.add(trapBuoy);
    }
  }
  lobsterTrapGroup.position.set(4.5, 1.0, -2.7);
  lobsterTrapGroup.rotation.y = 0.25;
  group.add(lobsterTrapGroup);

  // Sandcastle with little flag on the beach near the campfire
  const sandcastleGroup = new THREE.Group();
  const sandcastleSandColor = 0xe6c989;
  // Base
  const castleBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.65, 0.18, 16),
    new THREE.MeshStandardMaterial({ color: sandcastleSandColor, roughness: 0.95 })
  );
  castleBase.position.y = 0.09;
  sandcastleGroup.add(castleBase);
  // Central tower
  const castleTower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.26, 0.42, 12),
    new THREE.MeshStandardMaterial({ color: sandcastleSandColor, roughness: 0.95 })
  );
  castleTower.position.y = 0.39;
  sandcastleGroup.add(castleTower);
  // Tower battlement (slightly wider top ring)
  const castleBattlement = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.26, 0.06, 12),
    new THREE.MeshStandardMaterial({ color: sandcastleSandColor, roughness: 0.95 })
  );
  castleBattlement.position.y = 0.62;
  sandcastleGroup.add(castleBattlement);
  // Small corner turrets (3)
  for (let i = 0; i < 3; i++) {
    const ang = (i / 3) * Math.PI * 2;
    const turret = new THREE.Mesh(
      new THREE.CylinderGeometry(0.10, 0.13, 0.30, 8),
      new THREE.MeshStandardMaterial({ color: sandcastleSandColor, roughness: 0.95 })
    );
    turret.position.set(Math.cos(ang) * 0.42, 0.27, Math.sin(ang) * 0.42);
    sandcastleGroup.add(turret);
    // Conical cap
    const turretCap = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.14, 8),
      new THREE.MeshStandardMaterial({ color: 0xb89456, roughness: 0.9 })
    );
    turretCap.position.set(Math.cos(ang) * 0.42, 0.49, Math.sin(ang) * 0.42);
    sandcastleGroup.add(turretCap);
  }
  // Flagpole on tower
  const castleFlagpole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.32, 6),
    new THREE.MeshStandardMaterial({ color: 0x222222 })
  );
  castleFlagpole.position.y = 0.82;
  sandcastleGroup.add(castleFlagpole);
  // Triangular flag
  const castleFlag = new THREE.Mesh(
    new THREE.PlaneGeometry(0.18, 0.10),
    new THREE.MeshStandardMaterial({ color: 0x4ac8e8, side: THREE.DoubleSide, roughness: 0.7, emissive: 0x081a22, emissiveIntensity: 0.2 })
  );
  castleFlag.position.set(0.09, 0.92, 0);
  sandcastleGroup.add(castleFlag);
  // A little seashell beside it (just a flat scallop)
  const castleShell = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 10, 6, 0, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0xf2d7c0, roughness: 0.7, side: THREE.DoubleSide })
  );
  castleShell.position.set(-0.5, 0.04, 0.5);
  castleShell.rotation.x = -Math.PI / 2;
  sandcastleGroup.add(castleShell);
  sandcastleGroup.position.set(7.6, 0.18, 6.4);
  sandcastleGroup.rotation.y = -0.6;
  group.add(sandcastleGroup);

  // Dolphin trio jumping sequentially in arcs through the harbor
  const dolphinTrioGroup = new THREE.Group();
  const dolphinTrioMembers = [];
  for (let i = 0; i < 3; i++) {
    const dolphin = new THREE.Group();
    // Body (elongated)
    const dolBody = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 14, 10),
      new THREE.MeshStandardMaterial({ color: 0x6c8aa6, roughness: 0.45, metalness: 0.05 })
    );
    dolBody.scale.set(1.6, 0.6, 0.6);
    dolphin.add(dolBody);
    // Belly (lighter underside)
    const dolBelly = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 12, 8),
      new THREE.MeshStandardMaterial({ color: 0xd8e2eb, roughness: 0.55 })
    );
    dolBelly.scale.set(1.55, 0.5, 0.55);
    dolBelly.position.y = -0.10;
    dolphin.add(dolBelly);
    // Snout (pointy nose)
    const dolSnout = new THREE.Mesh(
      new THREE.ConeGeometry(0.16, 0.40, 10),
      new THREE.MeshStandardMaterial({ color: 0x6c8aa6, roughness: 0.5 })
    );
    dolSnout.rotation.z = -Math.PI / 2;
    dolSnout.position.set(0.65, 0.0, 0);
    dolphin.add(dolSnout);
    // Dorsal fin
    const dolFin = new THREE.Mesh(
      new THREE.ConeGeometry(0.10, 0.26, 6),
      new THREE.MeshStandardMaterial({ color: 0x4f6a82, roughness: 0.55 })
    );
    dolFin.rotation.x = Math.PI;
    dolFin.position.set(-0.05, 0.32, 0);
    dolphin.add(dolFin);
    // Tail flukes
    const dolFluke = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.20, 6),
      new THREE.MeshStandardMaterial({ color: 0x4f6a82, roughness: 0.6 })
    );
    dolFluke.rotation.z = Math.PI / 2;
    dolFluke.scale.set(1.2, 0.4, 1.0);
    dolFluke.position.set(-0.75, 0.0, 0);
    dolphin.add(dolFluke);
    dolphinTrioGroup.add(dolphin);
    dolphinTrioMembers.push({ group: dolphin, phaseOffset: i * (Math.PI * 2 / 3) });
  }
  // Position trio in the harbor area, in front of pier
  dolphinTrioGroup.position.set(-9, 0.15, 8);
  group.add(dolphinTrioGroup);


  // --- v33: Kid feeding seagulls + picnic blanket with families + tugboat pushing barge ---
  // A small kid figure on the beach tossing food crumbs while seagulls circle close
  const feedKidGroup = new THREE.Group();
  const feedKidBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.16, 0.42, 8),
    new THREE.MeshStandardMaterial({ color: 0xd84a3a, roughness: 0.85 })
  );
  feedKidBody.position.y = 0.21;
  feedKidGroup.add(feedKidBody);
  const feedKidHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.10, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0xe8c39a, roughness: 0.7 })
  );
  feedKidHead.position.y = 0.50;
  feedKidGroup.add(feedKidHead);
  // Cap
  const feedKidCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.105, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x5a8ec8, roughness: 0.85 })
  );
  feedKidCap.position.y = 0.55;
  feedKidGroup.add(feedKidCap);
  // Outstretched arm (the feeding hand)
  const feedKidArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.05, 0.30, 8),
    new THREE.MeshStandardMaterial({ color: 0xd84a3a, roughness: 0.85 })
  );
  feedKidArm.geometry.translate(0, 0.15, 0);
  feedKidArm.position.set(0.18, 0.36, 0);
  feedKidArm.rotation.z = -1.0;
  feedKidGroup.add(feedKidArm);
  // Floating bread crumbs (tiny pellets dispersing in front of kid)
  const feedCrumbs = [];
  for (let i = 0; i < 5; i++) {
    const crumb = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 6, 6),
      new THREE.MeshStandardMaterial({ color: 0xd6a86a, roughness: 0.8 })
    );
    crumb.position.set(0.40 + i * 0.10, 0.45 + (i % 2) * 0.05, (i - 2) * 0.06);
    feedCrumbs.push({ mesh: crumb, basePhase: i * 0.7, baseY: crumb.position.y });
    feedKidGroup.add(crumb);
  }
  // Three small circling seagulls right above the kid
  const feedKidGulls = [];
  for (let i = 0; i < 3; i++) {
    const gull = new THREE.Group();
    const gullBody = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.7 })
    );
    gullBody.scale.set(1.4, 0.7, 0.8);
    gull.add(gullBody);
    const gullWingL = new THREE.Mesh(
      new THREE.PlaneGeometry(0.18, 0.04),
      new THREE.MeshStandardMaterial({ color: 0xfafafa, side: THREE.DoubleSide, roughness: 0.7 })
    );
    gullWingL.position.x = -0.08;
    gull.add(gullWingL);
    const gullWingR = gullWingL.clone();
    gullWingR.position.x = 0.08;
    gull.add(gullWingR);
    feedKidGroup.add(gull);
    feedKidGulls.push({ group: gull, wingL: gullWingL, wingR: gullWingR, phaseOffset: i * (Math.PI * 2 / 3) });
  }
  feedKidGroup.position.set(8.4, 0.18, 5.2);
  feedKidGroup.rotation.y = -0.5;
  group.add(feedKidGroup);

  // Picnic blanket with two seated families near the campfire
  const picnicGroup = new THREE.Group();
  const picnicBlanket = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 1.2),
    new THREE.MeshStandardMaterial({ color: 0xc83a3a, roughness: 0.9, side: THREE.DoubleSide })
  );
  picnicBlanket.rotation.x = -Math.PI / 2;
  picnicBlanket.position.y = 0.005;
  picnicGroup.add(picnicBlanket);
  // Checker pattern accent strips (white)
  for (let i = 0; i < 4; i++) {
    const strip = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 0.10),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, side: THREE.DoubleSide })
    );
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(0, 0.006, -0.5 + i * 0.30);
    picnicGroup.add(strip);
  }
  // Picnic basket
  const picnicBasket = new THREE.Mesh(
    new THREE.BoxGeometry(0.30, 0.18, 0.22),
    new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.95 })
  );
  picnicBasket.position.set(-0.45, 0.10, 0.2);
  picnicGroup.add(picnicBasket);
  // Basket handle
  const picnicHandle = new THREE.Mesh(
    new THREE.TorusGeometry(0.10, 0.012, 6, 14, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x5a3a1f, roughness: 0.85 })
  );
  picnicHandle.position.set(-0.45, 0.20, 0.2);
  picnicHandle.rotation.x = Math.PI / 2;
  picnicGroup.add(picnicHandle);
  // Two seated picnic figures (one larger, one smaller)
  for (let i = 0; i < 2; i++) {
    const seatedBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.16, i === 0 ? 0.28 : 0.20, 8),
      new THREE.MeshStandardMaterial({ color: i === 0 ? 0x3a5a8b : 0x6a8e3a, roughness: 0.85 })
    );
    seatedBody.position.set(0.3 + i * 0.30, 0.14, -0.2 + i * 0.20);
    picnicGroup.add(seatedBody);
    const seatedHead = new THREE.Mesh(
      new THREE.SphereGeometry(i === 0 ? 0.10 : 0.08, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xe8c39a, roughness: 0.7 })
    );
    seatedHead.position.set(0.3 + i * 0.30, 0.34, -0.2 + i * 0.20);
    picnicGroup.add(seatedHead);
  }
  picnicGroup.position.set(6.5, 0.18, 8.4);
  picnicGroup.rotation.y = 0.3;
  group.add(picnicGroup);

  // Tugboat pushing a wooden barge across the harbor (slow, large group)
  const tugConvoyGroup = new THREE.Group();
  // Tug hull (small, sturdy)
  const tugHull = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.36, 0.85),
    new THREE.MeshStandardMaterial({ color: 0x2b5a3a, roughness: 0.7 })
  );
  tugHull.position.y = 0.18;
  tugConvoyGroup.add(tugHull);
  // Tug stripe (yellow)
  const tugStripe = new THREE.Mesh(
    new THREE.BoxGeometry(1.42, 0.06, 0.87),
    new THREE.MeshStandardMaterial({ color: 0xe8c34a, roughness: 0.7 })
  );
  tugStripe.position.y = 0.30;
  tugConvoyGroup.add(tugStripe);
  // Tug pilot house
  const tugCabin = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.40, 0.55),
    new THREE.MeshStandardMaterial({ color: 0xe8eef2, roughness: 0.7 })
  );
  tugCabin.position.set(-0.10, 0.56, 0);
  tugConvoyGroup.add(tugCabin);
  // Tug smokestack with puffing smoke
  const tugStack = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.10, 0.42, 10),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.85 })
  );
  tugStack.position.set(0.30, 0.78, 0);
  tugConvoyGroup.add(tugStack);
  const tugStackTop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.10, 0.08, 0.06, 10),
    new THREE.MeshStandardMaterial({ color: 0xc83a3a, roughness: 0.85 })
  );
  tugStackTop.position.set(0.30, 1.02, 0);
  tugConvoyGroup.add(tugStackTop);
  // Smoke puffs
  const tugSmoke = [];
  for (let i = 0; i < 4; i++) {
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xb8c0c8, transparent: true, opacity: 0.6, roughness: 0.95 })
    );
    puff.position.set(0.30, 1.18 + i * 0.18, 0);
    tugConvoyGroup.add(puff);
    tugSmoke.push({ mesh: puff, baseY: puff.position.y, phase: i * 0.6 });
  }
  // Barge being pushed (bigger, ahead of tug)
  const tugBarge = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 0.30, 1.20),
    new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 0.95 })
  );
  tugBarge.position.set(2.2, 0.15, 0);
  tugConvoyGroup.add(tugBarge);
  // Cargo containers on barge (3 stacked colorful boxes)
  const tugCargoColors = [0xc83a3a, 0x3a8ec8, 0xe8c34a];
  for (let i = 0; i < 3; i++) {
    const ct = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.42, 0.70),
      new THREE.MeshStandardMaterial({ color: tugCargoColors[i], roughness: 0.8 })
    );
    ct.position.set(1.5 + i * 0.75, 0.51, 0);
    tugConvoyGroup.add(ct);
  }
  tugConvoyGroup.position.set(-22, 0.18, 14);
  group.add(tugConvoyGroup);


  // --- v34: Two fishermen casting on pier + pelican on piling + surfer riding wave ---
  // Fishermen group: two figures with rods at different positions on the pier
  const fishermenGroup = new THREE.Group();
  const fishermenRods = [];
  const fishermenLines = [];
  const fishermenBobs = [];
  for (let i = 0; i < 2; i++) {
    const fishGuy = new THREE.Group();
    const fishGuyBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.16, 0.50, 8),
      new THREE.MeshStandardMaterial({ color: i === 0 ? 0x5a3a8b : 0x3a5a8b, roughness: 0.85 })
    );
    fishGuyBody.position.y = 0.25;
    fishGuy.add(fishGuyBody);
    const fishGuyHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 12, 8),
      new THREE.MeshStandardMaterial({ color: 0xe8c39a, roughness: 0.7 })
    );
    fishGuyHead.position.y = 0.62;
    fishGuy.add(fishGuyHead);
    // Hat (wide brim)
    const fishGuyHat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.20, 0.20, 0.04, 14),
      new THREE.MeshStandardMaterial({ color: i === 0 ? 0x6a3a1f : 0x3a2f1a, roughness: 0.9 })
    );
    fishGuyHat.position.y = 0.72;
    fishGuy.add(fishGuyHat);
    const fishGuyHatTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.16, 0.10, 12),
      new THREE.MeshStandardMaterial({ color: i === 0 ? 0x6a3a1f : 0x3a2f1a, roughness: 0.9 })
    );
    fishGuyHatTop.position.y = 0.78;
    fishGuy.add(fishGuyHatTop);
    // Fishing rod (cantilever angle)
    const fishGuyRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.018, 1.30, 6),
      new THREE.MeshStandardMaterial({ color: 0x4a3018, roughness: 0.8 })
    );
    fishGuyRod.geometry.translate(0, 0.65, 0);
    fishGuyRod.position.set(0.20, 0.45, 0);
    fishGuyRod.rotation.z = -0.85;
    fishGuy.add(fishGuyRod);
    // Fishing line (thin red line stretching down/forward)
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(1.00, 1.10, 0),
      new THREE.Vector3(1.30, 0.10, 0),
    ]);
    const fishGuyLine = new THREE.Line(
      lineGeo,
      new THREE.LineBasicMaterial({ color: 0xeeeeee, transparent: true, opacity: 0.65 })
    );
    fishGuy.add(fishGuyLine);
    // Floating bobber at end of line
    const fishGuyBob = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xff4040, roughness: 0.7, emissive: 0x331010, emissiveIntensity: 0.3 })
    );
    fishGuyBob.position.set(1.30, 0.10, 0);
    fishGuy.add(fishGuyBob);
    fishGuy.position.set(i === 0 ? 3.5 : 5.4, 1.05, -2.4 - i * 0.10);
    fishGuy.rotation.y = i === 0 ? 0.4 : -0.4;
    fishermenGroup.add(fishGuy);
    fishermenRods.push(fishGuyRod);
    fishermenLines.push({ line: fishGuyLine, basePhase: i * 1.7 });
    fishermenBobs.push({ bob: fishGuyBob, basePhase: i * 1.7 });
  }
  group.add(fishermenGroup);

  // Pelican standing on a wooden piling near the dock
  const dockPelicanGroup = new THREE.Group();
  // Piling (post sticking out of water)
  const dockPelicanPiling = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.20, 1.20, 8),
    new THREE.MeshStandardMaterial({ color: 0x4a3018, roughness: 0.95 })
  );
  dockPelicanPiling.position.y = 0.40;
  dockPelicanGroup.add(dockPelicanPiling);
  // Body
  const dockPelicanBody = new THREE.Mesh(
    new THREE.SphereGeometry(0.30, 14, 10),
    new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.7 })
  );
  dockPelicanBody.scale.set(1.4, 0.9, 0.9);
  dockPelicanBody.position.y = 1.10;
  dockPelicanGroup.add(dockPelicanBody);
  // Neck
  const dockPelicanNeck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.10, 0.13, 0.30, 8),
    new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.7 })
  );
  dockPelicanNeck.position.set(0.20, 1.30, 0);
  dockPelicanNeck.rotation.z = -0.4;
  dockPelicanGroup.add(dockPelicanNeck);
  // Head
  const dockPelicanHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.7 })
  );
  dockPelicanHead.position.set(0.34, 1.46, 0);
  dockPelicanGroup.add(dockPelicanHead);
  // Long beak (with pouch)
  const dockPelicanBeak = new THREE.Mesh(
    new THREE.ConeGeometry(0.07, 0.42, 8),
    new THREE.MeshStandardMaterial({ color: 0xe8a83a, roughness: 0.7 })
  );
  dockPelicanBeak.rotation.z = -Math.PI / 2;
  dockPelicanBeak.position.set(0.62, 1.42, 0);
  dockPelicanGroup.add(dockPelicanBeak);
  // Eye dot
  const dockPelicanEye = new THREE.Mesh(
    new THREE.SphereGeometry(0.022, 6, 6),
    new THREE.MeshStandardMaterial({ color: 0x222222 })
  );
  dockPelicanEye.position.set(0.40, 1.50, 0.13);
  dockPelicanGroup.add(dockPelicanEye);
  dockPelicanGroup.position.set(7.8, 0.0, -1.4);
  dockPelicanGroup.rotation.y = -0.3;
  group.add(dockPelicanGroup);

  // Surfer riding a small wave further offshore
  const surferGroup = new THREE.Group();
  // Surfboard
  const surfboard = new THREE.Mesh(
    new THREE.BoxGeometry(1.20, 0.06, 0.32),
    new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.5 })
  );
  surfboard.position.y = 0.06;
  surferGroup.add(surfboard);
  // Stripe
  const surfboardStripe = new THREE.Mesh(
    new THREE.BoxGeometry(1.20, 0.012, 0.08),
    new THREE.MeshStandardMaterial({ color: 0xc83a3a, roughness: 0.5 })
  );
  surfboardStripe.position.y = 0.10;
  surferGroup.add(surfboardStripe);
  // Surfer figure
  const surferBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.15, 0.42, 8),
    new THREE.MeshStandardMaterial({ color: 0x2b8e6a, roughness: 0.85 })
  );
  surferBody.position.y = 0.32;
  surferGroup.add(surferBody);
  const surferHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.10, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xe8c39a, roughness: 0.7 })
  );
  surferHead.position.y = 0.62;
  surferGroup.add(surferHead);
  // Surfer arms outstretched for balance
  const surferArmL = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.05, 0.34, 6),
    new THREE.MeshStandardMaterial({ color: 0x2b8e6a, roughness: 0.85 })
  );
  surferArmL.position.set(-0.20, 0.42, 0);
  surferArmL.rotation.z = 0.9;
  surferGroup.add(surferArmL);
  const surferArmR = surferArmL.clone();
  surferArmR.position.set(0.20, 0.42, 0);
  surferArmR.rotation.z = -0.9;
  surferGroup.add(surferArmR);
  // Wave foam crescent under the board
  const surferWave = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 0.6),
    new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
  );
  surferWave.rotation.x = -Math.PI / 2;
  surferWave.position.y = -0.02;
  surferGroup.add(surferWave);
  surferGroup.position.set(20, 0.18, -10);
  group.add(surferGroup);

  // --- v35: Two kayakers paddling + standup paddleboarder + beach umbrella with sunbathers ---
  // Kayakers: two narrow boats moving slowly along an oval path off the main pier
  const kayakerPair = new THREE.Group();
  const kayakerSpecs = [
    { color: 0xfb923c, paddleColor: 0xfde68a, hatColor: 0xdc2626, phase: 0.0, radius: 14, yOffset: 0 },
    { color: 0x14b8a6, paddleColor: 0xfde68a, hatColor: 0x2563eb, phase: Math.PI, radius: 15.4, yOffset: 0 },
  ];
  const kayakerEntries = [];
  kayakerSpecs.forEach((spec) => {
    const kg = new THREE.Group();
    // Hull (long flattened cylinder)
    const hull = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 1.4, 10),
      new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.7 })
    );
    hull.rotation.z = Math.PI / 2;
    hull.position.y = 0.05;
    hull.scale.set(1, 1, 0.45);
    kg.add(hull);
    // Cockpit recess
    const cockpit = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.05, 0.22),
      new THREE.MeshStandardMaterial({ color: 0x1f2937 })
    );
    cockpit.position.y = 0.12;
    kg.add(cockpit);
    // Body sitting
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.15, 0.32, 8),
      new THREE.MeshStandardMaterial({ color: spec.hatColor })
    );
    body.position.y = 0.28;
    kg.add(body);
    // Head
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xf3d4b0 })
    );
    head.position.y = 0.48;
    kg.add(head);
    // Paddle (long thin shaft, double-bladed)
    const paddle = new THREE.Group();
    const paddleShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.95, 6),
      new THREE.MeshStandardMaterial({ color: spec.paddleColor, roughness: 0.6 })
    );
    paddleShaft.rotation.z = Math.PI / 2;
    paddle.add(paddleShaft);
    const paddleBladeL = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.18, 0.08),
      new THREE.MeshStandardMaterial({ color: spec.paddleColor, roughness: 0.6 })
    );
    paddleBladeL.position.set(-0.48, 0, 0);
    paddle.add(paddleBladeL);
    const paddleBladeR = paddleBladeL.clone();
    paddleBladeR.position.x = 0.48;
    paddle.add(paddleBladeR);
    paddle.position.set(0, 0.32, 0);
    kg.add(paddle);
    kayakerPair.add(kg);
    kayakerEntries.push({ group: kg, paddle, spec });
  });
  group.add(kayakerPair);

  // Paddleboarder: standing figure on a wide flat board, drifting in shallow harbor area
  const paddleBoarderGroup = new THREE.Group();
  const paddleboard = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 0.06, 0.55),
    new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.5 })
  );
  paddleboard.position.y = 0.08;
  paddleBoarderGroup.add(paddleboard);
  const paddleBoardStripe = new THREE.Mesh(
    new THREE.BoxGeometry(2.02, 0.005, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x0ea5e9 })
  );
  paddleBoardStripe.position.y = 0.115;
  paddleBoarderGroup.add(paddleBoardStripe);
  const paddleBoarderBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.16, 0.55, 8),
    new THREE.MeshStandardMaterial({ color: 0x7c3aed })
  );
  paddleBoarderBody.position.y = 0.42;
  paddleBoarderGroup.add(paddleBoarderBody);
  const paddleBoarderHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.10, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xf3d4b0 })
  );
  paddleBoarderHead.position.y = 0.78;
  paddleBoarderGroup.add(paddleBoarderHead);
  // Long paddle held vertically
  const paddleBoarderPaddle = new THREE.Group();
  const sbShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 1.3, 6),
    new THREE.MeshStandardMaterial({ color: 0xfde68a })
  );
  sbShaft.position.y = 0.65;
  paddleBoarderPaddle.add(sbShaft);
  const sbBlade = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.22, 0.04),
    new THREE.MeshStandardMaterial({ color: 0xfde68a })
  );
  sbBlade.position.y = -0.08;
  paddleBoarderPaddle.add(sbBlade);
  paddleBoarderPaddle.position.set(0.25, 0.15, 0.0);
  paddleBoarderPaddle.rotation.z = 0.18;
  paddleBoarderGroup.add(paddleBoarderPaddle);
  paddleBoarderGroup.position.set(-12, 0.18, 12);
  group.add(paddleBoarderGroup);

  // Beach umbrella + two sunbathers on towels
  const beachUmbrellaGroup = new THREE.Group();
  const umbrellaPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 1.6, 8),
    new THREE.MeshStandardMaterial({ color: 0x9ca3af })
  );
  umbrellaPole.position.y = 0.8;
  beachUmbrellaGroup.add(umbrellaPole);
  const umbrellaCanopy = new THREE.Mesh(
    new THREE.ConeGeometry(0.95, 0.5, 12, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xef4444, side: THREE.DoubleSide, roughness: 0.6 })
  );
  umbrellaCanopy.position.y = 1.65;
  beachUmbrellaGroup.add(umbrellaCanopy);
  // Stripes (alternating white wedges painted as thin cones)
  const umbrellaStripe = new THREE.Mesh(
    new THREE.ConeGeometry(0.96, 0.51, 12, 1, true, 0, Math.PI / 6),
    new THREE.MeshStandardMaterial({ color: 0xfafafa, side: THREE.DoubleSide, roughness: 0.6 })
  );
  umbrellaStripe.position.y = 1.65;
  beachUmbrellaGroup.add(umbrellaStripe);
  // Towel + sunbather 1
  const towelA = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.02, 0.45),
    new THREE.MeshStandardMaterial({ color: 0x60a5fa })
  );
  towelA.position.set(-0.55, 0.02, 0.3);
  beachUmbrellaGroup.add(towelA);
  const sunbatherA = new THREE.Mesh(
    new THREE.CylinderGeometry(0.10, 0.12, 0.55, 8),
    new THREE.MeshStandardMaterial({ color: 0xfbbf24 })
  );
  sunbatherA.rotation.z = Math.PI / 2;
  sunbatherA.position.set(-0.55, 0.10, 0.3);
  beachUmbrellaGroup.add(sunbatherA);
  const sunbatherAHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xf3d4b0 })
  );
  sunbatherAHead.position.set(-0.85, 0.12, 0.3);
  beachUmbrellaGroup.add(sunbatherAHead);
  // Towel + sunbather 2
  const towelB = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.02, 0.45),
    new THREE.MeshStandardMaterial({ color: 0xa78bfa })
  );
  towelB.position.set(0.55, 0.02, -0.3);
  beachUmbrellaGroup.add(towelB);
  const sunbatherB = new THREE.Mesh(
    new THREE.CylinderGeometry(0.10, 0.12, 0.55, 8),
    new THREE.MeshStandardMaterial({ color: 0xf472b6 })
  );
  sunbatherB.rotation.z = Math.PI / 2;
  sunbatherB.position.set(0.55, 0.10, -0.3);
  beachUmbrellaGroup.add(sunbatherB);
  const sunbatherBHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xf3d4b0 })
  );
  sunbatherBHead.position.set(0.85, 0.12, -0.3);
  beachUmbrellaGroup.add(sunbatherBHead);
  beachUmbrellaGroup.position.set(9.5, 0.18, 8.5);
  beachUmbrellaGroup.rotation.y = -0.3;
  group.add(beachUmbrellaGroup);

  // --- v36: Beach volleyball court (net + two jumping players + ball) + jet ski ---
  const volleyGroup = new THREE.Group();
  // Court markings (sand-colored rectangle slightly darker than ground)
  const volleyCourt = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 2.6),
    new THREE.MeshStandardMaterial({ color: 0xeed6a4, roughness: 0.95 })
  );
  volleyCourt.rotation.x = -Math.PI / 2;
  volleyCourt.position.y = 0.005;
  volleyGroup.add(volleyCourt);
  // Net posts
  const volleyPostMat = new THREE.MeshStandardMaterial({ color: 0x7c5b3a, roughness: 0.7 });
  const volleyPostL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 8), volleyPostMat);
  volleyPostL.position.set(0, 0.7, -1.3);
  volleyGroup.add(volleyPostL);
  const volleyPostR = volleyPostL.clone();
  volleyPostR.position.z = 1.3;
  volleyGroup.add(volleyPostR);
  // Net (semi-transparent grid plane)
  const volleyNet = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 0.7, 12, 4),
    new THREE.MeshBasicMaterial({ color: 0xfafafa, transparent: true, opacity: 0.55, wireframe: true, side: THREE.DoubleSide })
  );
  volleyNet.position.set(0, 1.05, 0);
  volleyNet.rotation.y = Math.PI / 2;
  volleyGroup.add(volleyNet);
  // Two players, one each side, who bounce up like spikers
  const volleyPlayers = [];
  [
    { x: -1.4, color: 0xfb7185, name: 'L' },
    { x:  1.4, color: 0x60a5fa, name: 'R' },
  ].forEach((spec) => {
    const pg = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.16, 0.55, 8),
      new THREE.MeshStandardMaterial({ color: spec.color })
    );
    body.position.y = 0.42;
    pg.add(body);
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.10, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xf3d4b0 })
    );
    head.position.y = 0.78;
    pg.add(head);
    const armL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6),
      new THREE.MeshStandardMaterial({ color: spec.color })
    );
    armL.position.set(-0.13, 0.62, 0);
    armL.rotation.z = -1.0;
    pg.add(armL);
    const armR = armL.clone();
    armR.position.x = 0.13;
    armR.rotation.z = 1.0;
    pg.add(armR);
    pg.position.set(spec.x, 0, 0);
    volleyGroup.add(pg);
    volleyPlayers.push({ group: pg, spec });
  });
  // Volleyball — small white sphere bouncing over the net
  const volleyBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.10, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.7 })
  );
  volleyGroup.add(volleyBall);
  volleyGroup.position.set(11.5, 0.18, 6.0);
  volleyGroup.rotation.y = -0.6;
  group.add(volleyGroup);

  // Jet ski — a single rider zipping in a tighter loop with foam wake
  const jetskiGroup = new THREE.Group();
  const jetskiHull = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.32, 0.55),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4, metalness: 0.4 })
  );
  jetskiHull.position.y = 0.22;
  jetskiGroup.add(jetskiHull);
  const jetskiNose = new THREE.Mesh(
    new THREE.ConeGeometry(0.27, 0.5, 8),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4, metalness: 0.4 })
  );
  jetskiNose.rotation.z = -Math.PI / 2;
  jetskiNose.position.set(0.85, 0.22, 0);
  jetskiGroup.add(jetskiNose);
  const jetskiHandlebar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.45, 8),
    new THREE.MeshStandardMaterial({ color: 0x111111 })
  );
  jetskiHandlebar.rotation.x = Math.PI / 2;
  jetskiHandlebar.position.set(0.15, 0.55, 0);
  jetskiGroup.add(jetskiHandlebar);
  const jetskiRider = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.16, 0.55, 8),
    new THREE.MeshStandardMaterial({ color: 0x111827 })
  );
  jetskiRider.position.set(-0.15, 0.62, 0);
  jetskiGroup.add(jetskiRider);
  const jetskiHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.10, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xf3d4b0 })
  );
  jetskiHead.position.set(-0.15, 1.0, 0);
  jetskiGroup.add(jetskiHead);
  // Foam wake — flat plane behind the ski
  const jetskiWake = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 0.35),
    new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
  );
  jetskiWake.rotation.x = -Math.PI / 2;
  jetskiWake.position.set(-0.85, 0.04, 0);
  jetskiGroup.add(jetskiWake);
  group.add(jetskiGroup);

  // --- v37: Hot air balloon floating over harbor + parasailer towed by speedboat ---
  const hotAirBalloonGroup = new THREE.Group();
  // Envelope (large sphere) — use rainbow stripes via 4 stacked spheres scaled flat
  const habEnvelope = new THREE.Mesh(
    new THREE.SphereGeometry(2.0, 18, 14),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.6 })
  );
  habEnvelope.position.y = 3.0;
  habEnvelope.scale.set(1, 1.15, 1);
  hotAirBalloonGroup.add(habEnvelope);
  // Stripes — thin cap rings of different colors
  const habStripeColors = [0xfde68a, 0x60a5fa, 0x86efac, 0xa78bfa];
  habStripeColors.forEach((c, i) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.0 - i * 0.2, 0.08, 6, 22),
      new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 3.0 + (i - 1.5) * 0.7;
    hotAirBalloonGroup.add(ring);
  });
  // Basket
  const habBasket = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.45, 0.7),
    new THREE.MeshStandardMaterial({ color: 0x7c5b3a, roughness: 0.85 })
  );
  habBasket.position.y = 0.7;
  hotAirBalloonGroup.add(habBasket);
  // Ropes connecting basket to habEnvelope
  for (let i = 0; i < 4; i++) {
    const rx = (i % 2 === 0) ? -0.32 : 0.32;
    const rz = (i < 2) ? -0.32 : 0.32;
    const rope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 1.7, 4),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    rope.position.set(rx * 0.5, 1.6, rz * 0.5);
    rope.rotation.x = (rz > 0 ? 1 : -1) * 0.18;
    rope.rotation.z = (rx > 0 ? -1 : 1) * 0.18;
    hotAirBalloonGroup.add(rope);
  }
  // Tiny passenger figure in basket
  const habPassenger = new THREE.Mesh(
    new THREE.SphereGeometry(0.10, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xf3d4b0 })
  );
  habPassenger.position.y = 1.05;
  hotAirBalloonGroup.add(habPassenger);
  // Burner glow inside habEnvelope opening (small additive sphere)
  const habBurnerGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xffd966, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  habBurnerGlow.position.y = 1.5;
  hotAirBalloonGroup.add(habBurnerGlow);
  hotAirBalloonGroup.position.set(-30, 12, -8);
  group.add(hotAirBalloonGroup);

  // Parasail rig: speedboat towing a colorful parachute with rider
  const parasailRig = new THREE.Group();
  // Speedboat
  const psBoat = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 0.35, 0.7),
    new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.5 })
  );
  psBoat.position.y = 0.22;
  parasailRig.add(psBoat);
  const psBoatNose = new THREE.Mesh(
    new THREE.ConeGeometry(0.36, 0.6, 8),
    new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.5 })
  );
  psBoatNose.rotation.z = -Math.PI / 2;
  psBoatNose.position.set(1.2, 0.22, 0);
  parasailRig.add(psBoatNose);
  const psStripe = new THREE.Mesh(
    new THREE.BoxGeometry(2.05, 0.07, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x0ea5e9 })
  );
  psStripe.position.set(0, 0.32, 0.36);
  parasailRig.add(psStripe);
  // Boat wake
  const psBoatWake = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 0.5),
    new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
  );
  psBoatWake.rotation.x = -Math.PI / 2;
  psBoatWake.position.set(-1.6, 0.04, 0);
  parasailRig.add(psBoatWake);
  // Tow line (cylinder pointing back-up to parachute)
  const psTowLine = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 6.5, 4),
    new THREE.MeshStandardMaterial({ color: 0x222222 })
  );
  psTowLine.position.set(-2.6, 3.2, 0);
  psTowLine.rotation.z = 0.55;
  parasailRig.add(psTowLine);
  // Parachute (large half-dome with rainbow segments)
  const psChute = new THREE.Group();
  const chuteColors = [0xef4444, 0xfde68a, 0x60a5fa, 0x86efac, 0xa78bfa, 0xf472b6];
  chuteColors.forEach((c, i) => {
    const wedge = new THREE.Mesh(
      new THREE.SphereGeometry(1.4, 12, 8, (i / chuteColors.length) * Math.PI * 2, (Math.PI * 2) / chuteColors.length, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: c, side: THREE.DoubleSide, roughness: 0.6 })
    );
    psChute.add(wedge);
  });
  psChute.position.set(-5.3, 6.4, 0);
  parasailRig.add(psChute);
  // Rider hanging below the chute
  const psRider = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.16, 0.55, 8),
    new THREE.MeshStandardMaterial({ color: 0x059669 })
  );
  psRider.position.set(-5.3, 5.4, 0);
  parasailRig.add(psRider);
  const psRiderHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.10, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xf3d4b0 })
  );
  psRiderHead.position.set(-5.3, 5.85, 0);
  parasailRig.add(psRiderHead);
  // Rider straps to chute
  const psStrap1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, 1.0, 4),
    new THREE.MeshStandardMaterial({ color: 0x222222 })
  );
  psStrap1.position.set(-5.3, 5.9, 0);
  parasailRig.add(psStrap1);
  parasailRig.position.set(0, 0, 0);
  group.add(parasailRig);


  // --- v38: Kite boarder skating across waves + wooden rowboat with rower + beach swing set ---
  // Kite boarder
  const kiteBoarderGroup = new THREE.Group();
  const kbBoard = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.06, 0.45),
    new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.45 })
  );
  kbBoard.position.y = 0.05;
  kiteBoarderGroup.add(kbBoard);
  const kbStripe = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.07, 0.10),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 })
  );
  kbStripe.position.y = 0.06;
  kiteBoarderGroup.add(kbStripe);
  const kbRiderBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.18, 0.7, 8),
    new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.7 })
  );
  kbRiderBody.position.y = 0.5;
  kbRiderBody.rotation.z = 0.25; // leaning back
  kiteBoarderGroup.add(kbRiderBody);
  const kbRiderHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.6 })
  );
  kbRiderHead.position.set(-0.16, 0.92, 0);
  kiteBoarderGroup.add(kbRiderHead);
  // Diagonal tow lines
  const kbLineMat = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.7, transparent: true });
  const kbLineGeom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0.7, 0),
    new THREE.Vector3(2.2, 4.5, 0)
  ]);
  const kbLine = new THREE.Line(kbLineGeom, kbLineMat);
  kiteBoarderGroup.add(kbLine);
  // The kite — arc shape made from a torus segment
  const kbKite = new THREE.Mesh(
    new THREE.TorusGeometry(0.9, 0.10, 6, 16, Math.PI * 0.9),
    new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.55, side: THREE.DoubleSide })
  );
  kbKite.position.set(2.2, 4.5, 0);
  kbKite.rotation.set(Math.PI / 2, 0, Math.PI / 6);
  kiteBoarderGroup.add(kbKite);
  // Kite stripes
  const kbKiteStripe1 = new THREE.Mesh(
    new THREE.TorusGeometry(0.9, 0.04, 5, 16, Math.PI * 0.9),
    new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.5, side: THREE.DoubleSide })
  );
  kbKiteStripe1.position.copy(kbKite.position);
  kbKiteStripe1.rotation.copy(kbKite.rotation);
  kiteBoarderGroup.add(kbKiteStripe1);
  // Wake
  const kbWakeGeom = new THREE.PlaneGeometry(2.4, 0.7);
  const kbWakeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, roughness: 1.0 });
  const kbWake = new THREE.Mesh(kbWakeGeom, kbWakeMat);
  kbWake.rotation.x = -Math.PI / 2;
  kbWake.position.set(-1.4, 0.06, 0);
  kiteBoarderGroup.add(kbWake);
  kiteBoarderGroup.position.set(20, 0.02, 14);
  group.add(kiteBoarderGroup);

  // Wooden rowboat with rower mid-harbor
  const rowboatGroup = new THREE.Group();
  const rowHull = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.65, 2.6, 8, 1, false, 0, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85 })
  );
  rowHull.rotation.z = Math.PI / 2;
  rowHull.rotation.y = Math.PI / 2;
  rowHull.position.y = 0.1;
  rowboatGroup.add(rowHull);
  const rowHullTop = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.08, 0.95),
    new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 })
  );
  rowHullTop.position.y = 0.42;
  rowboatGroup.add(rowHullTop);
  const rowSeat = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.06, 0.7),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 })
  );
  rowSeat.position.set(0, 0.5, 0);
  rowboatGroup.add(rowSeat);
  // Rower
  const rowerBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.20, 0.55, 8),
    new THREE.MeshStandardMaterial({ color: 0x1e40af, roughness: 0.7 })
  );
  rowerBody.position.set(0, 0.85, 0);
  rowboatGroup.add(rowerBody);
  const rowerHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.6 })
  );
  rowerHead.position.set(0, 1.22, 0);
  rowboatGroup.add(rowerHead);
  // Oars (left and right)
  const oarMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.85 });
  const oarL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6), oarMat);
  oarL.position.set(0, 0.9, -0.7);
  oarL.rotation.x = Math.PI / 2;
  oarL.rotation.z = 0.3;
  rowboatGroup.add(oarL);
  const oarR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6), oarMat);
  oarR.position.set(0, 0.9, 0.7);
  oarR.rotation.x = Math.PI / 2;
  oarR.rotation.z = -0.3;
  rowboatGroup.add(oarR);
  // Oar blades
  const oarBladeGeom = new THREE.BoxGeometry(0.5, 0.04, 0.18);
  const oarBladeL = new THREE.Mesh(oarBladeGeom, oarMat);
  oarBladeL.position.set(0, 0.85, -1.5);
  rowboatGroup.add(oarBladeL);
  const oarBladeR = new THREE.Mesh(oarBladeGeom, oarMat);
  oarBladeR.position.set(0, 0.85, 1.5);
  rowboatGroup.add(oarBladeR);
  rowboatGroup.position.set(-12, 0.02, 8);
  group.add(rowboatGroup);

  // Beach swing set with swinging child
  const swingSetGroup = new THREE.Group();
  const swingFrameMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6 });
  const swingPostL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 2.4, 8), swingFrameMat);
  swingPostL.position.set(-1.2, 1.2, -0.7);
  swingPostL.rotation.z = 0.2;
  swingSetGroup.add(swingPostL);
  const swingPostR = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 2.4, 8), swingFrameMat);
  swingPostR.position.set(-1.2, 1.2, 0.7);
  swingPostR.rotation.z = 0.2;
  swingSetGroup.add(swingPostR);
  const swingPostL2 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 2.4, 8), swingFrameMat);
  swingPostL2.position.set(1.2, 1.2, -0.7);
  swingPostL2.rotation.z = -0.2;
  swingSetGroup.add(swingPostL2);
  const swingPostR2 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 2.4, 8), swingFrameMat);
  swingPostR2.position.set(1.2, 1.2, 0.7);
  swingPostR2.rotation.z = -0.2;
  swingSetGroup.add(swingPostR2);
  // Top crossbar
  const swingCrossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 8), swingFrameMat);
  swingCrossbar.rotation.z = Math.PI / 2;
  swingCrossbar.position.y = 2.2;
  swingSetGroup.add(swingCrossbar);
  // Swing seat (pivot group)
  const swingPivot = new THREE.Group();
  swingPivot.position.y = 2.2;
  swingSetGroup.add(swingPivot);
  const swingChainL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.4, 4),
    new THREE.MeshStandardMaterial({ color: 0xa1a1aa, roughness: 0.7 }));
  swingChainL.position.set(0, -0.7, -0.35);
  swingPivot.add(swingChainL);
  const swingChainR = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.4, 4),
    new THREE.MeshStandardMaterial({ color: 0xa1a1aa, roughness: 0.7 }));
  swingChainR.position.set(0, -0.7, 0.35);
  swingPivot.add(swingChainR);
  const swingSeat = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.06, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.7 })
  );
  swingSeat.position.y = -1.4;
  swingPivot.add(swingSeat);
  // Swinging child on the swing
  const swingKidBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.15, 0.45, 8),
    new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.7 })
  );
  swingKidBody.position.y = -1.15;
  swingPivot.add(swingKidBody);
  const swingKidHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.6 })
  );
  swingKidHead.position.y = -0.85;
  swingPivot.add(swingKidHead);
  swingSetGroup.position.set(-22, 0.02, -16);
  group.add(swingSetGroup);

  // --- v39: beach bonfire, hermit crab race, water taxi -----------------------
  // Beach bonfire — tepee logs + animated flame + ember glow
  const bonfireGroup = new THREE.Group();
  const bonLogMat = new THREE.MeshStandardMaterial({ color: 0x4a3520, roughness: 0.9 });
  for (let bi = 0; bi < 5; bi++) {
    const log = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 1.0, 6),
      bonLogMat
    );
    const ang = (bi / 5) * Math.PI * 2;
    log.position.set(Math.cos(ang) * 0.18, 0.45, Math.sin(ang) * 0.18);
    log.rotation.z = Math.cos(ang) * 0.55;
    log.rotation.x = -Math.sin(ang) * 0.55;
    bonfireGroup.add(log);
  }
  // Ash ring
  const bonAshRing = new THREE.Mesh(
    new THREE.RingGeometry(0.55, 0.85, 18),
    new THREE.MeshStandardMaterial({ color: 0x2a2520, roughness: 0.95 })
  );
  bonAshRing.rotation.x = -Math.PI / 2;
  bonAshRing.position.y = 0.01;
  bonfireGroup.add(bonAshRing);
  // Stones around fire
  for (let si = 0; si < 6; si++) {
    const stone = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 6, 5),
      new THREE.MeshStandardMaterial({ color: 0x6b6b65, roughness: 0.95 })
    );
    const sa = (si / 6) * Math.PI * 2 + 0.1;
    stone.position.set(Math.cos(sa) * 0.7, 0.05, Math.sin(sa) * 0.7);
    bonfireGroup.add(stone);
  }
  // Animated flame cone
  const bonFlameOuter = new THREE.Mesh(
    new THREE.ConeGeometry(0.32, 1.1, 10),
    new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0.85 })
  );
  bonFlameOuter.position.y = 0.85;
  bonfireGroup.add(bonFlameOuter);
  const bonFlameInner = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.7, 8),
    new THREE.MeshBasicMaterial({ color: 0xffe680, transparent: true, opacity: 0.95 })
  );
  bonFlameInner.position.y = 0.7;
  bonfireGroup.add(bonFlameInner);
  // Ember light
  const bonLight = new THREE.PointLight(0xff9040, 1.6, 6);
  bonLight.position.y = 0.85;
  bonfireGroup.add(bonLight);
  // Marshmallow stick + person sitting beside fire
  const bonSitterGroup = new THREE.Group();
  const bonSitterBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.14, 0.4, 8),
    new THREE.MeshStandardMaterial({ color: 0x6b3a3a, roughness: 0.7 })
  );
  bonSitterBody.position.y = 0.2;
  bonSitterGroup.add(bonSitterBody);
  const bonSitterHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.6 })
  );
  bonSitterHead.position.y = 0.5;
  bonSitterGroup.add(bonSitterHead);
  // Marshmallow stick
  const bonStick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.85, 6),
    new THREE.MeshStandardMaterial({ color: 0x6b4220, roughness: 0.85 })
  );
  bonStick.rotation.z = -0.6;
  bonStick.position.set(0.32, 0.4, 0);
  bonSitterGroup.add(bonStick);
  const bonMarshmallow = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0xfff5dc, roughness: 0.6, emissive: 0x442200, emissiveIntensity: 0.2 })
  );
  bonMarshmallow.position.set(0.7, 0.65, 0);
  bonSitterGroup.add(bonMarshmallow);
  bonSitterGroup.position.set(-0.95, 0, 0.1);
  bonfireGroup.add(bonSitterGroup);
  bonfireGroup.position.set(-25, 0.02, -10);
  group.add(bonfireGroup);

  // Hermit crab race — three little hermit crabs racing along sand
  const raceHermitCrabs = [];
  const raceHermitColors = [0x8a4f2a, 0x9b6535, 0xb37a45];
  for (let hi = 0; hi < 3; hi++) {
    const hcGroup = new THREE.Group();
    // Shell (spiral cone)
    const hcShell = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.18, 8),
      new THREE.MeshStandardMaterial({ color: raceHermitColors[hi], roughness: 0.6 })
    );
    hcShell.rotation.z = Math.PI / 2.2;
    hcShell.position.y = 0.1;
    hcGroup.add(hcShell);
    // Tiny legs
    const hcLegMat = new THREE.MeshStandardMaterial({ color: 0x4a2818, roughness: 0.85 });
    for (let li = 0; li < 4; li++) {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.08, 5),
        hcLegMat
      );
      leg.position.set(0.07 - li * 0.04, 0.04, (li % 2 === 0 ? 0.06 : -0.06));
      leg.rotation.x = (li % 2 === 0 ? 0.5 : -0.5);
      hcGroup.add(leg);
    }
    // Tiny eye stalks
    const hcEyeStalk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, 0.05, 4),
      new THREE.MeshStandardMaterial({ color: 0x4a2818 })
    );
    hcEyeStalk.position.set(0.12, 0.13, 0);
    hcGroup.add(hcEyeStalk);
    const hcEye = new THREE.Mesh(
      new THREE.SphereGeometry(0.014, 6, 5),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    hcEye.position.set(0.12, 0.16, 0);
    hcGroup.add(hcEye);
    hcGroup.position.set(-19 + hi * 0.6, 0.02, -8 - hi * 0.4);
    group.add(hcGroup);
    raceHermitCrabs.push({ group: hcGroup, speed: 0.8 + hi * 0.25, phase: hi * 0.6, baseZ: -8 - hi * 0.4 });
  }

  // Water taxi — bright yellow shuttle with cabin and passengers
  const waterTaxiGroup = new THREE.Group();
  const wtHull = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.32, 0.85),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.55 })
  );
  wtHull.position.y = 0.16;
  waterTaxiGroup.add(wtHull);
  const wtHullStripe = new THREE.Mesh(
    new THREE.BoxGeometry(2.42, 0.08, 0.86),
    new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.6 })
  );
  wtHullStripe.position.y = 0.05;
  waterTaxiGroup.add(wtHullStripe);
  const wtHullStripe2 = new THREE.Mesh(
    new THREE.BoxGeometry(2.42, 0.06, 0.87),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })
  );
  wtHullStripe2.position.y = 0.27;
  waterTaxiGroup.add(wtHullStripe2);
  // Cabin
  const wtCabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.55, 0.7),
    new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.4 })
  );
  wtCabin.position.set(-0.1, 0.6, 0);
  waterTaxiGroup.add(wtCabin);
  // Cabin roof
  const wtRoof = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.06, 0.78),
    new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.5 })
  );
  wtRoof.position.set(-0.1, 0.91, 0);
  waterTaxiGroup.add(wtRoof);
  // Windows
  const wtWindowMat = new THREE.MeshStandardMaterial({ color: 0x60a5fa, roughness: 0.2, metalness: 0.5, emissive: 0x1e40af, emissiveIntensity: 0.25 });
  for (let wi = 0; wi < 3; wi++) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.3, 0.02), wtWindowMat);
    win.position.set(-0.55 + wi * 0.45, 0.65, 0.36);
    waterTaxiGroup.add(win);
  }
  // TAXI sign on roof
  const wtSign = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.18, 0.18),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x111111, emissiveIntensity: 0.2 })
  );
  wtSign.position.set(-0.1, 1.05, 0);
  waterTaxiGroup.add(wtSign);
  // Passenger heads visible
  const wtPassengers = [];
  for (let pi = 0; pi < 3; pi++) {
    const ph = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 8, 6),
      new THREE.MeshStandardMaterial({ color: [0xfde68a, 0x6b3a3a, 0xc8a070][pi], roughness: 0.6 })
    );
    ph.position.set(0.3 - pi * 0.35, 0.65, 0);
    waterTaxiGroup.add(ph);
    wtPassengers.push(ph);
  }
  // Bow wake spray
  const wtWakeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
  const wtWake = new THREE.Mesh(new THREE.RingGeometry(0.4, 1.1, 14, 1, 0, Math.PI), wtWakeMat);
  wtWake.rotation.x = -Math.PI / 2;
  wtWake.position.set(1.5, 0.04, 0);
  waterTaxiGroup.add(wtWake);
  group.add(waterTaxiGroup);

  // --- v40: oyster boat hauling traps, swimming children with floaties, hot dog stand -----------------------
  // Oyster boat hauling traps from the water
  const oysterBoatGroup = new THREE.Group();
  const obHull = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.5, 1.0),
    new THREE.MeshStandardMaterial({ color: 0x3a4d5e, roughness: 0.7 })
  );
  obHull.position.y = 0.25;
  oysterBoatGroup.add(obHull);
  const obDeckMat = new THREE.MeshStandardMaterial({ color: 0x6b563a, roughness: 0.85 });
  const obDeck = new THREE.Mesh(
    new THREE.BoxGeometry(2.3, 0.05, 0.95),
    obDeckMat
  );
  obDeck.position.y = 0.52;
  oysterBoatGroup.add(obDeck);
  // Boat cabin (small)
  const obCabin = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.55, 0.85),
    new THREE.MeshStandardMaterial({ color: 0xd0c8b0, roughness: 0.7 })
  );
  obCabin.position.set(-0.7, 0.83, 0);
  oysterBoatGroup.add(obCabin);
  const obCabinRoof = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 0.05, 0.92),
    new THREE.MeshStandardMaterial({ color: 0x6b3a2a, roughness: 0.7 })
  );
  obCabinRoof.position.set(-0.7, 1.13, 0);
  oysterBoatGroup.add(obCabinRoof);
  // Mast/winch
  const obMast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 1.4, 6),
    new THREE.MeshStandardMaterial({ color: 0x6b563a, roughness: 0.8 })
  );
  obMast.position.set(0.4, 1.2, 0);
  oysterBoatGroup.add(obMast);
  // Boom arm extending over water
  const obBoom = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6),
    new THREE.MeshStandardMaterial({ color: 0x4a3520, roughness: 0.85 })
  );
  obBoom.position.set(0.95, 1.55, 0);
  obBoom.rotation.z = -Math.PI / 2 + 0.15;
  oysterBoatGroup.add(obBoom);
  // Two fishermen on boat
  const obFishermen = [];
  for (let fi = 0; fi < 2; fi++) {
    const f = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.16, 0.55, 6),
      new THREE.MeshStandardMaterial({ color: fi === 0 ? 0xc4452a : 0x2a4a8a, roughness: 0.7 })
    );
    body.position.y = 0.28;
    f.add(body);
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 6, 6),
      new THREE.MeshStandardMaterial({ color: 0xe8b594, roughness: 0.6 })
    );
    head.position.y = 0.65;
    f.add(head);
    const hat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.16, 0.07, 8),
      new THREE.MeshStandardMaterial({ color: 0xfdde35, roughness: 0.6 })
    );
    hat.position.y = 0.76;
    f.add(hat);
    f.position.set(fi === 0 ? 0.5 : 0.0, 0.55, fi === 0 ? -0.05 : 0.15);
    oysterBoatGroup.add(f);
    obFishermen.push(f);
  }
  // Hanging trap from boom (oscillates as it's hauled)
  const obTrapGroup = new THREE.Group();
  const obTrapCage = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.32, 0.42),
    new THREE.MeshStandardMaterial({ color: 0x8a7a5a, roughness: 0.85, transparent: true, opacity: 0.85 })
  );
  obTrapGroup.add(obTrapCage);
  // Add slats look (thin frame edges)
  const obTrapEdge = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.04, 0.44),
    new THREE.MeshStandardMaterial({ color: 0x4a3520, roughness: 0.85 })
  );
  obTrapEdge.position.y = 0.16;
  obTrapGroup.add(obTrapEdge);
  const obTrapEdge2 = obTrapEdge.clone();
  obTrapEdge2.position.y = -0.16;
  obTrapGroup.add(obTrapEdge2);
  // Rope from boom to trap
  const obRope = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 1.2, 4),
    new THREE.MeshStandardMaterial({ color: 0xd6c89a, roughness: 0.85 })
  );
  obRope.position.set(1.5, 0.95, 0);
  oysterBoatGroup.add(obRope);
  obTrapGroup.position.set(1.5, 0.5, 0);
  oysterBoatGroup.add(obTrapGroup);
  // Stack of already-hauled traps on deck
  for (let ti = 0; ti < 3; ti++) {
    const stackTrap = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.3, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x8a7a5a, roughness: 0.85 })
    );
    stackTrap.position.set(-1.4 + ti * 0.05, 0.7 + ti * 0.32, -0.15);
    stackTrap.rotation.y = (ti * 0.1) - 0.1;
    oysterBoatGroup.add(stackTrap);
  }
  oysterBoatGroup.position.set(28, 0.05, 22);
  oysterBoatGroup.rotation.y = -0.7;
  group.add(oysterBoatGroup);

  // Swimming children with floaties (3 kids bobbing in inflatable rings)
  const swimKids = [];
  const floatyColors = [0xff5544, 0x44b8ff, 0xfdde35];
  for (let si = 0; si < 3; si++) {
    const kid = new THREE.Group();
    // Floaty ring (donut shape using torus)
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.4, 0.13, 8, 16),
      new THREE.MeshStandardMaterial({ color: floatyColors[si], roughness: 0.55 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.08;
    kid.add(ring);
    // Kid body sticking up through ring
    const kidBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.12, 0.4, 6),
      new THREE.MeshStandardMaterial({ color: si === 0 ? 0xee9a44 : si === 1 ? 0x55aa66 : 0xc44488, roughness: 0.6 })
    );
    kidBody.position.y = 0.25;
    kid.add(kidBody);
    // Head
    const kidHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 6, 6),
      new THREE.MeshStandardMaterial({ color: 0xe8b594, roughness: 0.6 })
    );
    kidHead.position.y = 0.55;
    kid.add(kidHead);
    // Arms (small splash gestures)
    for (let ai = 0; ai < 2; ai++) {
      const arm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.28, 5),
        new THREE.MeshStandardMaterial({ color: 0xe8b594, roughness: 0.6 })
      );
      arm.position.set(ai === 0 ? -0.18 : 0.18, 0.32, 0);
      arm.rotation.z = ai === 0 ? 0.6 : -0.6;
      kid.add(arm);
    }
    const baseAng = -0.4 + si * 0.35;
    const baseR = 22 + si * 1.4;
    kid.position.set(Math.cos(baseAng) * baseR, 0, Math.sin(baseAng) * baseR + 14);
    group.add(kid);
    swimKids.push({ group: kid, ring, baseAng, baseR, phase: si * 1.7, speed: 0.45 + si * 0.12 });
  }

  // Beachside hot dog stand
  const hotdogStandGroup = new THREE.Group();
  // Base counter
  const hdsCounter = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 1.0, 1.2),
    new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.65 })
  );
  hdsCounter.position.y = 0.5;
  hotdogStandGroup.add(hdsCounter);
  // Red+white striped awning (alternating panels)
  for (let pi = 0; pi < 6; pi++) {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.05, 1.4),
      new THREE.MeshStandardMaterial({ color: pi % 2 === 0 ? 0xc4252a : 0xffffff, roughness: 0.55 })
    );
    stripe.position.set(-1.0 + pi * 0.4, 1.7, 0);
    stripe.rotation.x = -0.15;
    hotdogStandGroup.add(stripe);
  }
  // Awning support poles
  for (let pi = 0; pi < 4; pi++) {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.8, 5),
      new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.6 })
    );
    pole.position.set(pi < 2 ? -1.1 : 1.1, 1.3, pi % 2 === 0 ? -0.55 : 0.55);
    hotdogStandGroup.add(pole);
  }
  // HOT DOGS sign
  const hdsSignCanvas = document.createElement('canvas');
  hdsSignCanvas.width = 256; hdsSignCanvas.height = 64;
  const hdsCtx = hdsSignCanvas.getContext('2d');
  hdsCtx.fillStyle = '#fdde35';
  hdsCtx.fillRect(0, 0, 256, 64);
  hdsCtx.fillStyle = '#c4252a';
  hdsCtx.font = 'bold 36px sans-serif';
  hdsCtx.textAlign = 'center';
  hdsCtx.textBaseline = 'middle';
  hdsCtx.fillText('HOT DOGS', 128, 32);
  const hdsSignTex = new THREE.CanvasTexture(hdsSignCanvas);
  const hdsSign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.0, 0.5),
    new THREE.MeshBasicMaterial({ map: hdsSignTex })
  );
  hdsSign.position.set(0, 1.2, 0.61);
  hotdogStandGroup.add(hdsSign);
  // Vendor figure behind counter
  const hdsVendor = new THREE.Group();
  const hdsVendorBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.18, 0.65, 6),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 })
  );
  hdsVendorBody.position.y = 0.33;
  hdsVendor.add(hdsVendorBody);
  const hdsVendorHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 6, 6),
    new THREE.MeshStandardMaterial({ color: 0xe8b594, roughness: 0.6 })
  );
  hdsVendorHead.position.y = 0.78;
  hdsVendor.add(hdsVendorHead);
  // Chef's hat
  const hdsHat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.14, 0.2, 8),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })
  );
  hdsHat.position.y = 0.98;
  hdsVendor.add(hdsHat);
  hdsVendor.position.set(0, 1.0, -0.3);
  hotdogStandGroup.add(hdsVendor);
  // Customer in line
  const hdsCustomer = new THREE.Group();
  const hdsCustBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.18, 0.7, 6),
    new THREE.MeshStandardMaterial({ color: 0x44a8d6, roughness: 0.7 })
  );
  hdsCustBody.position.y = 0.35;
  hdsCustomer.add(hdsCustBody);
  const hdsCustHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 6, 6),
    new THREE.MeshStandardMaterial({ color: 0xd6a888, roughness: 0.6 })
  );
  hdsCustHead.position.y = 0.83;
  hdsCustomer.add(hdsCustHead);
  hdsCustomer.position.set(0, 0, 1.3);
  hotdogStandGroup.add(hdsCustomer);
  hotdogStandGroup.position.set(-22, 0.05, -8);
  hotdogStandGroup.rotation.y = 0.5;
  group.add(hotdogStandGroup);


  // --- v41: pelican flock formation, beach fireflies, horseshoe game ------
  // Pelican V-formation flying overhead (5 birds)
  const pelicanFlockGroup = new THREE.Group();
  const pfBirds = [];
  for (let pi = 0; pi < 5; pi++) {
    const birdGroup = new THREE.Group();
    const birdBody = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 8, 6),
      new THREE.MeshLambertMaterial({ color: 0xe8e8df })
    );
    birdBody.scale.set(1, 0.6, 1.4);
    birdGroup.add(birdBody);
    const birdHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 6, 5),
      new THREE.MeshLambertMaterial({ color: 0xf5f5e8 })
    );
    birdHead.position.set(0, 0.05, 0.22);
    birdGroup.add(birdHead);
    const birdBeak = new THREE.Mesh(
      new THREE.ConeGeometry(0.04, 0.18, 5),
      new THREE.MeshLambertMaterial({ color: 0xd8a040 })
    );
    birdBeak.rotation.x = Math.PI / 2;
    birdBeak.position.set(0, 0.04, 0.36);
    birdGroup.add(birdBeak);
    const wingL = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.03, 0.18),
      new THREE.MeshLambertMaterial({ color: 0xd0d0c4 })
    );
    wingL.position.set(-0.32, 0.04, 0);
    birdGroup.add(wingL);
    const wingR = wingL.clone();
    wingR.position.set(0.32, 0.04, 0);
    birdGroup.add(wingR);
    // V-formation positions: leader at 0,0; behind in V
    const row = pi === 0 ? 0 : Math.ceil(pi / 2);
    const side = pi === 0 ? 0 : (pi % 2 === 1 ? -1 : 1);
    birdGroup.position.set(side * row * 1.2, 0, -row * 1.4);
    pelicanFlockGroup.add(birdGroup);
    pfBirds.push({ group: birdGroup, wingL, wingR, phase: pi * 0.4 });
  }
  pelicanFlockGroup.position.set(-30, 14, 20);
  group.add(pelicanFlockGroup);

  // Beach fireflies cluster (8 small glowing sprites)
  const fireflyGroup = new THREE.Group();
  const fireflies = [];
  for (let fi = 0; fi < 8; fi++) {
    const ff = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 6, 5),
      new THREE.MeshBasicMaterial({ color: 0xfff388, transparent: true, opacity: 0.9 })
    );
    const ffx = (Math.random() - 0.5) * 6;
    const ffz = (Math.random() - 0.5) * 4;
    ff.position.set(ffx, 0.5 + Math.random() * 0.8, ffz);
    fireflyGroup.add(ff);
    fireflies.push({
      mesh: ff,
      baseX: ffx,
      baseZ: ffz,
      baseY: 0.5 + Math.random() * 0.8,
      speed: 0.4 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      blinkPhase: Math.random() * Math.PI * 2,
    });
  }
  fireflyGroup.position.set(15, 0, 16);
  group.add(fireflyGroup);

  // Horseshoe game: two stakes + 4 horseshoes scattered
  const horseshoeGameGroup = new THREE.Group();
  const hsStake1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.7, 6),
    new THREE.MeshLambertMaterial({ color: 0x8a6a40 })
  );
  hsStake1.position.set(0, 0.35, 0);
  horseshoeGameGroup.add(hsStake1);
  const hsStake2 = hsStake1.clone();
  hsStake2.position.set(0, 0.35, 5);
  horseshoeGameGroup.add(hsStake2);
  // Sand patches around each stake
  const hsSandMat = new THREE.MeshLambertMaterial({ color: 0xd9c08a });
  const hsSand1 = new THREE.Mesh(new THREE.CircleGeometry(0.7, 16), hsSandMat);
  hsSand1.rotation.x = -Math.PI / 2;
  hsSand1.position.set(0, 0.02, 0);
  horseshoeGameGroup.add(hsSand1);
  const hsSand2 = hsSand1.clone();
  hsSand2.position.set(0, 0.02, 5);
  horseshoeGameGroup.add(hsSand2);
  // 4 horseshoes (torus segments) at various positions
  const hsShoeMat = new THREE.MeshLambertMaterial({ color: 0x707880 });
  const horseshoes = [];
  const hsPositions = [
    { x: 0.0, z: 0.05, ry: 0.3 },     // ringer on stake 1
    { x: 0.4, z: 0.6, ry: 1.2 },
    { x: -0.3, z: 4.6, ry: 0.7 },
    { x: 0.2, z: 5.2, ry: 2.1 },
  ];
  hsPositions.forEach((p) => {
    const shoe = new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.04, 6, 12, Math.PI * 1.4),
      hsShoeMat
    );
    shoe.rotation.x = -Math.PI / 2;
    shoe.rotation.z = p.ry;
    shoe.position.set(p.x, 0.04, p.z);
    horseshoeGameGroup.add(shoe);
    horseshoes.push(shoe);
  });
  // Two players (figures) at each end
  const hsPlayer1 = new THREE.Group();
  const hsP1Body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 0.7, 8),
    new THREE.MeshLambertMaterial({ color: 0x3060a0 })
  );
  hsP1Body.position.y = 0.35;
  hsPlayer1.add(hsP1Body);
  const hsP1Head = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 8, 6),
    new THREE.MeshLambertMaterial({ color: 0xe2b78a })
  );
  hsP1Head.position.y = 0.83;
  hsPlayer1.add(hsP1Head);
  hsPlayer1.position.set(-1.4, 0, 0);
  horseshoeGameGroup.add(hsPlayer1);
  const hsPlayer2 = hsPlayer1.clone();
  hsPlayer2.position.set(1.4, 0, 5);
  horseshoeGameGroup.add(hsPlayer2);
  horseshoeGameGroup.position.set(8, 0.05, 22);
  horseshoeGameGroup.rotation.y = 0.4;
  group.add(horseshoeGameGroup);

  // --- v42: beach yoga class, sand turtle sculpture, pier starfish keeper -
  // Beach yoga class: 4 figures in tree pose on mats facing the same way
  const yogaClassGroup = new THREE.Group();
  const yogaMatColors = [0xe87878, 0x78c0e8, 0x90d878, 0xd8a878];
  const yogaPeople = [];
  for (let yi = 0; yi < 4; yi++) {
    const matMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.5),
      new THREE.MeshLambertMaterial({ color: yogaMatColors[yi], side: THREE.DoubleSide })
    );
    matMesh.rotation.x = -Math.PI / 2;
    matMesh.position.set(yi * 1.6 - 2.4, 0.02, 0);
    yogaClassGroup.add(matMesh);
    const ygPerson = new THREE.Group();
    const ygTorso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.16, 0.55, 8),
      new THREE.MeshLambertMaterial({ color: 0xc0d0e8 })
    );
    ygTorso.position.y = 0.55;
    ygPerson.add(ygTorso);
    const ygHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 6),
      new THREE.MeshLambertMaterial({ color: 0xe2b78a })
    );
    ygHead.position.y = 0.96;
    ygPerson.add(ygHead);
    // standing leg
    const ygLegStand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.55, 6),
      new THREE.MeshLambertMaterial({ color: 0x4070a0 })
    );
    ygLegStand.position.set(0, 0.27, 0);
    ygPerson.add(ygLegStand);
    // tree-pose folded leg
    const ygLegFold = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.4, 6),
      new THREE.MeshLambertMaterial({ color: 0x4070a0 })
    );
    ygLegFold.position.set(0.16, 0.42, 0);
    ygLegFold.rotation.z = -1.0;
    ygPerson.add(ygLegFold);
    // arms raised in prayer
    const ygArmL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.55, 6),
      new THREE.MeshLambertMaterial({ color: 0xc0d0e8 })
    );
    ygArmL.position.set(-0.04, 1.05, 0);
    ygArmL.rotation.z = 0.2;
    ygPerson.add(ygArmL);
    const ygArmR = ygArmL.clone();
    ygArmR.position.set(0.04, 1.05, 0);
    ygArmR.rotation.z = -0.2;
    ygPerson.add(ygArmR);
    ygPerson.position.set(yi * 1.6 - 2.4, 0, 0);
    yogaClassGroup.add(ygPerson);
    yogaPeople.push({ group: ygPerson, phase: yi * 0.5 });
  }
  // Instructor in front facing class
  const yogaInstructor = new THREE.Group();
  const ygInsTorso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.17, 0.6, 8),
    new THREE.MeshLambertMaterial({ color: 0xa07090 })
  );
  ygInsTorso.position.y = 0.6;
  yogaInstructor.add(ygInsTorso);
  const ygInsHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 8, 6),
    new THREE.MeshLambertMaterial({ color: 0xe2b78a })
  );
  ygInsHead.position.y = 1.03;
  yogaInstructor.add(ygInsHead);
  yogaInstructor.position.set(0, 0, 1.6);
  yogaInstructor.rotation.y = Math.PI;
  yogaClassGroup.add(yogaInstructor);
  yogaClassGroup.position.set(-12, 0.05, 24);
  yogaClassGroup.rotation.y = -0.3;
  group.add(yogaClassGroup);

  // Sand turtle sculpture
  const sandTurtleGroup = new THREE.Group();
  const stMat = new THREE.MeshLambertMaterial({ color: 0xe6d098 });
  const stShell = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), stMat);
  stShell.position.y = 0.05;
  sandTurtleGroup.add(stShell);
  const stHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), stMat);
  stHead.position.set(0, 0.18, 0.65);
  sandTurtleGroup.add(stHead);
  // 4 flippers
  const stFlipper1 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.18), stMat);
  stFlipper1.position.set(-0.5, 0.08, 0.35);
  stFlipper1.rotation.y = -0.5;
  sandTurtleGroup.add(stFlipper1);
  const stFlipper2 = stFlipper1.clone();
  stFlipper2.position.set(0.5, 0.08, 0.35);
  stFlipper2.rotation.y = 0.5;
  sandTurtleGroup.add(stFlipper2);
  const stFlipper3 = stFlipper1.clone();
  stFlipper3.position.set(-0.5, 0.08, -0.35);
  stFlipper3.rotation.y = 0.5;
  sandTurtleGroup.add(stFlipper3);
  const stFlipper4 = stFlipper1.clone();
  stFlipper4.position.set(0.5, 0.08, -0.35);
  stFlipper4.rotation.y = -0.5;
  sandTurtleGroup.add(stFlipper4);
  // Shell pattern - 3 small bumps
  for (let bi = 0; bi < 3; bi++) {
    const bump = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 5), stMat);
    bump.position.set((bi - 1) * 0.25, 0.55, 0);
    sandTurtleGroup.add(bump);
  }
  sandTurtleGroup.position.set(20, 0.05, 18);
  sandTurtleGroup.rotation.y = 0.8;
  group.add(sandTurtleGroup);

  // Pier-end starfish keeper: figure with bucket of starfish
  const starfishKeeperGroup = new THREE.Group();
  const sfkBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 0.7, 8),
    new THREE.MeshLambertMaterial({ color: 0x40a060 })
  );
  sfkBody.position.y = 0.35;
  starfishKeeperGroup.add(sfkBody);
  const sfkHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 8, 6),
    new THREE.MeshLambertMaterial({ color: 0xe2b78a })
  );
  sfkHead.position.y = 0.85;
  starfishKeeperGroup.add(sfkHead);
  const sfkHat = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 0.18, 8),
    new THREE.MeshLambertMaterial({ color: 0xc8a060 })
  );
  sfkHat.position.y = 1.02;
  starfishKeeperGroup.add(sfkHat);
  // Bucket
  const sfkBucket = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.18, 0.3, 10, 1, true),
    new THREE.MeshLambertMaterial({ color: 0x6080a0, side: THREE.DoubleSide })
  );
  sfkBucket.position.set(0.4, 0.2, 0.2);
  starfishKeeperGroup.add(sfkBucket);
  // Starfish in bucket (3 visible tops)
  const sfkStars = [];
  const sfkStarColors = [0xe05060, 0xe07050, 0xe0a040];
  for (let si = 0; si < 3; si++) {
    const star = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.04, 5),
      new THREE.MeshLambertMaterial({ color: sfkStarColors[si] })
    );
    star.position.set(0.4 + (si - 1) * 0.06, 0.36, 0.2 + (si % 2) * 0.04);
    star.rotation.y = si * 0.5;
    starfishKeeperGroup.add(star);
    sfkStars.push(star);
  }
  // Starfish on pier deck nearby (clearly placed by keeper)
  const sfkDeckStar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.04, 5),
    new THREE.MeshLambertMaterial({ color: 0xd05050 })
  );
  sfkDeckStar.position.set(-0.5, 0.04, 0.3);
  starfishKeeperGroup.add(sfkDeckStar);
  starfishKeeperGroup.position.set(2, 1.05, -16);
  starfishKeeperGroup.rotation.y = -0.4;
  group.add(starfishKeeperGroup);

  // --- v43: sandcastle contest, fish market stall, volleyball spectators -
  // Sandcastle contest: 3 sandcastles + judge with clipboard
  const sandcastleContestGroup = new THREE.Group();
  const scMat = new THREE.MeshLambertMaterial({ color: 0xe8d8a0 });
  // Castle 1: simple tower with crenellations
  const castle1Group = new THREE.Group();
  const c1Base = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.4, 1.0), scMat);
  c1Base.position.y = 0.2;
  castle1Group.add(c1Base);
  const c1Tower = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.7, 8), scMat);
  c1Tower.position.y = 0.75;
  castle1Group.add(c1Tower);
  for (let ci = 0; ci < 4; ci++) {
    const cren = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.18), scMat);
    const ang = ci * Math.PI / 2;
    cren.position.set(Math.cos(ang) * 0.4, 0.46, Math.sin(ang) * 0.4);
    castle1Group.add(cren);
  }
  const c1Flag = new THREE.Mesh(
    new THREE.PlaneGeometry(0.18, 0.12),
    new THREE.MeshLambertMaterial({ color: 0xe04050, side: THREE.DoubleSide })
  );
  c1Flag.position.set(0.05, 1.18, 0);
  castle1Group.add(c1Flag);
  castle1Group.position.set(-2, 0, 0);
  sandcastleContestGroup.add(castle1Group);
  // Castle 2: pyramid stepped
  const castle2Group = new THREE.Group();
  for (let py = 0; py < 4; py++) {
    const sz = 1.0 - py * 0.22;
    const block = new THREE.Mesh(new THREE.BoxGeometry(sz, 0.18, sz), scMat);
    block.position.y = 0.09 + py * 0.18;
    castle2Group.add(block);
  }
  castle2Group.position.set(0, 0, 0);
  sandcastleContestGroup.add(castle2Group);
  // Castle 3: twin towers connected by wall
  const castle3Group = new THREE.Group();
  const c3Wall = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 0.4), scMat);
  c3Wall.position.y = 0.18;
  castle3Group.add(c3Wall);
  const c3T1 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.6, 8), scMat);
  c3T1.position.set(-0.5, 0.65, 0);
  castle3Group.add(c3T1);
  const c3T2 = c3T1.clone();
  c3T2.position.set(0.5, 0.65, 0);
  castle3Group.add(c3T2);
  const c3Roof1 = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.25, 6), new THREE.MeshLambertMaterial({ color: 0x6080d0 }));
  c3Roof1.position.set(-0.5, 1.05, 0);
  castle3Group.add(c3Roof1);
  const c3Roof2 = c3Roof1.clone();
  c3Roof2.position.set(0.5, 1.05, 0);
  castle3Group.add(c3Roof2);
  castle3Group.position.set(2, 0, 0);
  sandcastleContestGroup.add(castle3Group);
  // Judge with clipboard
  const sandJudge = new THREE.Group();
  const sjBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 0.75, 8),
    new THREE.MeshLambertMaterial({ color: 0xe0c060 })
  );
  sjBody.position.y = 0.38;
  sandJudge.add(sjBody);
  const sjHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 8, 6),
    new THREE.MeshLambertMaterial({ color: 0xe2b78a })
  );
  sjHead.position.y = 0.88;
  sandJudge.add(sjHead);
  const sjClipboard = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.3, 0.03),
    new THREE.MeshLambertMaterial({ color: 0xf0eada })
  );
  sjClipboard.position.set(0.3, 0.55, 0.15);
  sjClipboard.rotation.y = -0.3;
  sandJudge.add(sjClipboard);
  sandJudge.position.set(0, 0, 1.6);
  sandJudge.rotation.y = Math.PI;
  sandcastleContestGroup.add(sandJudge);
  sandcastleContestGroup.position.set(28, 0.05, 22);
  sandcastleContestGroup.rotation.y = -0.5;
  group.add(sandcastleContestGroup);

  // Fish market stall on pier
  const fishMarketGroup = new THREE.Group();
  const fmCounter = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.7, 1.0),
    new THREE.MeshLambertMaterial({ color: 0xa07050 })
  );
  fmCounter.position.y = 0.35;
  fishMarketGroup.add(fmCounter);
  const fmAwning = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 0.06, 1.4),
    new THREE.MeshLambertMaterial({ color: 0x4080a0 })
  );
  fmAwning.position.y = 1.6;
  fishMarketGroup.add(fmAwning);
  // Awning posts
  for (let pi = 0; pi < 4; pi++) {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 1.2, 6),
      new THREE.MeshLambertMaterial({ color: 0x402010 })
    );
    post.position.set((pi % 2 === 0 ? -1 : 1) * 1.2, 1.0, (pi < 2 ? -1 : 1) * 0.6);
    fishMarketGroup.add(post);
  }
  // Ice + fish on counter
  const fmIce = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.08, 0.8),
    new THREE.MeshLambertMaterial({ color: 0xeaf6fb, transparent: true, opacity: 0.8 })
  );
  fmIce.position.y = 0.74;
  fishMarketGroup.add(fmIce);
  const fmFish = [];
  const fmFishColors = [0x70a0c0, 0x80b0c8, 0xc08070, 0x90c0d0, 0xc09060];
  for (let fi = 0; fi < 5; fi++) {
    const f = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 8, 6),
      new THREE.MeshLambertMaterial({ color: fmFishColors[fi] })
    );
    f.scale.set(0.6, 0.4, 1.5);
    f.position.set((fi - 2) * 0.42, 0.78, 0);
    f.rotation.y = (fi % 2 === 0 ? 0.2 : -0.2);
    fishMarketGroup.add(f);
    fmFish.push(f);
  }
  // Fish market vendor
  const fmVendor = new THREE.Group();
  const fmvBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 0.7, 8),
    new THREE.MeshLambertMaterial({ color: 0x508040 })
  );
  fmvBody.position.y = 0.35;
  fmVendor.add(fmvBody);
  const fmvHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 8, 6),
    new THREE.MeshLambertMaterial({ color: 0xe2b78a })
  );
  fmvHead.position.y = 0.85;
  fmVendor.add(fmvHead);
  const fmvApron = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.5, 0.06),
    new THREE.MeshLambertMaterial({ color: 0xfafafa })
  );
  fmvApron.position.set(0, 0.4, 0.15);
  fmVendor.add(fmvApron);
  fmVendor.position.set(0, 0, -0.7);
  fishMarketGroup.add(fmVendor);
  fishMarketGroup.position.set(-3, 1.05, -10);
  fishMarketGroup.rotation.y = 0.3;
  group.add(fishMarketGroup);

  // Beach volleyball spectator pair on towels
  const vbSpectatorsGroup = new THREE.Group();
  const vbsTowel1 = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 0.8),
    new THREE.MeshLambertMaterial({ color: 0xe05080, side: THREE.DoubleSide })
  );
  vbsTowel1.rotation.x = -Math.PI / 2;
  vbsTowel1.position.set(0, 0.02, 0);
  vbSpectatorsGroup.add(vbsTowel1);
  const vbsTowel2 = vbsTowel1.clone();
  vbsTowel2.material = new THREE.MeshLambertMaterial({ color: 0x5080d0, side: THREE.DoubleSide });
  vbsTowel2.position.set(2, 0.02, 0);
  vbSpectatorsGroup.add(vbsTowel2);
  // Spectator 1 (sitting up)
  const vbSpec1 = new THREE.Group();
  const vs1Body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 0.5, 8),
    new THREE.MeshLambertMaterial({ color: 0xc06080 })
  );
  vs1Body.position.y = 0.25;
  vbSpec1.add(vs1Body);
  const vs1Head = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 8, 6),
    new THREE.MeshLambertMaterial({ color: 0xe2b78a })
  );
  vs1Head.position.y = 0.62;
  vbSpec1.add(vs1Head);
  vbSpec1.position.set(0, 0, 0);
  vbSpectatorsGroup.add(vbSpec1);
  // Spectator 2 (lying down)
  const vbSpec2 = new THREE.Group();
  const vs2Body = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.18, 1.4),
    new THREE.MeshLambertMaterial({ color: 0x6080c0 })
  );
  vs2Body.position.set(0, 0.13, 0.1);
  vbSpec2.add(vs2Body);
  const vs2Head = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 8, 6),
    new THREE.MeshLambertMaterial({ color: 0xe2b78a })
  );
  vs2Head.position.set(0, 0.18, -0.6);
  vbSpec2.add(vs2Head);
  vbSpec2.position.set(2, 0, 0);
  vbSpectatorsGroup.add(vbSpec2);
  // Cooler between them
  const vbsCooler = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.3, 0.4),
    new THREE.MeshLambertMaterial({ color: 0xeae0d0 })
  );
  vbsCooler.position.set(1, 0.18, 0.4);
  vbSpectatorsGroup.add(vbsCooler);
  vbSpectatorsGroup.position.set(2, 0.05, 26);
  vbSpectatorsGroup.rotation.y = -0.4;
  group.add(vbSpectatorsGroup);

  // --- v44: anemone tide pool, net-mending fishermen, shore patrol jeep ---
  // Anemone tide pool — different from existing tide pool, sits on rocks
  const anemonePoolGroup = new THREE.Group();
  const apRockBase = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 2.6, 0.4, 16),
    new THREE.MeshLambertMaterial({ color: 0x6b6258 })
  );
  apRockBase.position.y = 0.2;
  anemonePoolGroup.add(apRockBase);
  // Inner pool basin
  const apPoolWater = new THREE.Mesh(
    new THREE.CylinderGeometry(1.6, 1.4, 0.18, 16),
    new THREE.MeshLambertMaterial({ color: 0x4a8aa8, transparent: true, opacity: 0.78 })
  );
  apPoolWater.position.y = 0.42;
  anemonePoolGroup.add(apPoolWater);
  // Anemones — colorful flower-like creatures
  const anemoneColors = [0xff6677, 0xffaa44, 0xaa55cc, 0x55ccaa, 0xff8855, 0xcc6688];
  const apAnemones = [];
  for (let i = 0; i < 6; i++) {
    const aGroup = new THREE.Group();
    const aBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.18, 0.18, 8),
      new THREE.MeshLambertMaterial({ color: anemoneColors[i] })
    );
    aBody.position.y = 0.09;
    aGroup.add(aBody);
    // Tentacles — 6 short cones around the top
    for (let j = 0; j < 6; j++) {
      const tent = new THREE.Mesh(
        new THREE.ConeGeometry(0.025, 0.18, 4),
        new THREE.MeshLambertMaterial({ color: anemoneColors[i] })
      );
      const ang = (j / 6) * Math.PI * 2;
      tent.position.set(Math.cos(ang) * 0.1, 0.22, Math.sin(ang) * 0.1);
      tent.rotation.z = Math.cos(ang) * 0.4;
      tent.rotation.x = Math.sin(ang) * 0.4;
      aGroup.add(tent);
    }
    const angle = (i / 6) * Math.PI * 2 + 0.3;
    aGroup.position.set(Math.cos(angle) * 0.9, 0.5, Math.sin(angle) * 0.9);
    apAnemones.push(aGroup);
    anemonePoolGroup.add(aGroup);
  }
  // Two small starfish on the rim
  const apStarMat = new THREE.MeshLambertMaterial({ color: 0xff7755 });
  for (let i = 0; i < 2; i++) {
    const star = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.06, 5), apStarMat);
    star.rotation.x = -Math.PI / 2;
    star.position.set(i === 0 ? -1.6 : 1.5, 0.43, i === 0 ? 0.4 : -0.5);
    anemonePoolGroup.add(star);
  }
  // Small dart fish in pool (3 specks)
  const apFish = [];
  for (let i = 0; i < 3; i++) {
    const f = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 5, 4),
      new THREE.MeshLambertMaterial({ color: 0xffd866 })
    );
    f.position.set(Math.cos(i * 2) * 0.7, 0.55, Math.sin(i * 2) * 0.7);
    apFish.push(f);
    anemonePoolGroup.add(f);
  }
  anemonePoolGroup.position.set(-26, 0.05, 28);
  group.add(anemonePoolGroup);

  // Net-mending fishermen — two figures on the dock with a fishing net spread between them
  const netMendingGroup = new THREE.Group();
  // The net itself — flat plane representing spread net
  const netCanvas = document.createElement('canvas');
  netCanvas.width = 64; netCanvas.height = 64;
  const netCtx = netCanvas.getContext('2d');
  netCtx.fillStyle = '#a8a39a';
  netCtx.fillRect(0, 0, 64, 64);
  netCtx.strokeStyle = '#5a5248';
  netCtx.lineWidth = 1.2;
  for (let i = 0; i < 8; i++) {
    netCtx.beginPath(); netCtx.moveTo(i * 8, 0); netCtx.lineTo(i * 8, 64); netCtx.stroke();
    netCtx.beginPath(); netCtx.moveTo(0, i * 8); netCtx.lineTo(64, i * 8); netCtx.stroke();
  }
  const netTex = new THREE.CanvasTexture(netCanvas);
  netTex.wrapS = netTex.wrapT = THREE.RepeatWrapping;
  netTex.repeat.set(3, 3);
  const netMat = new THREE.MeshLambertMaterial({ map: netTex, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
  const fishingNet = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), netMat);
  fishingNet.rotation.x = -Math.PI / 2;
  fishingNet.position.y = 0.05;
  netMendingGroup.add(fishingNet);
  // Two fishermen seated cross-legged, mending the net
  const nmFisher1 = new THREE.Group();
  const nmf1Body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.22, 0.5, 8),
    new THREE.MeshLambertMaterial({ color: 0x4a6488 })
  );
  nmf1Body.position.y = 0.25;
  nmFisher1.add(nmf1Body);
  const nmf1Head = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 8, 6),
    new THREE.MeshLambertMaterial({ color: 0xd4a878 })
  );
  nmf1Head.position.y = 0.6;
  nmFisher1.add(nmf1Head);
  // Beanie cap
  const nmf1Hat = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshLambertMaterial({ color: 0x884444 })
  );
  nmf1Hat.position.y = 0.66;
  nmFisher1.add(nmf1Hat);
  nmFisher1.position.set(-1.6, 0, 0);
  nmFisher1.rotation.y = Math.PI / 2;
  netMendingGroup.add(nmFisher1);
  const nmFisher2 = new THREE.Group();
  const nmf2Body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.22, 0.5, 8),
    new THREE.MeshLambertMaterial({ color: 0x886644 })
  );
  nmf2Body.position.y = 0.25;
  nmFisher2.add(nmf2Body);
  const nmf2Head = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 8, 6),
    new THREE.MeshLambertMaterial({ color: 0xc89870 })
  );
  nmf2Head.position.y = 0.6;
  nmFisher2.add(nmf2Head);
  nmFisher2.position.set(1.6, 0, 0);
  nmFisher2.rotation.y = -Math.PI / 2;
  netMendingGroup.add(nmFisher2);
  // Small toolbox with mending tools
  const nmToolbox = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.18, 0.22),
    new THREE.MeshLambertMaterial({ color: 0x5a4a3a })
  );
  nmToolbox.position.set(-1.2, 0.09, 0.7);
  netMendingGroup.add(nmToolbox);
  netMendingGroup.position.set(7.5, 1.55, 14);
  netMendingGroup.rotation.y = 0.3;
  group.add(netMendingGroup);

  // Shore patrol jeep — sand-colored jeep with light bar parked on beach
  const patrolJeepGroup = new THREE.Group();
  const pjBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.55, 2.4),
    new THREE.MeshLambertMaterial({ color: 0xc9b585 })
  );
  pjBody.position.y = 0.45;
  patrolJeepGroup.add(pjBody);
  // Cabin
  const pjCabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.6, 1.2),
    new THREE.MeshLambertMaterial({ color: 0xa89570 })
  );
  pjCabin.position.set(0, 0.95, -0.1);
  patrolJeepGroup.add(pjCabin);
  // Windshield
  const pjWindshield = new THREE.Mesh(
    new THREE.PlaneGeometry(1.3, 0.5),
    new THREE.MeshBasicMaterial({ color: 0x88aacc, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
  );
  pjWindshield.position.set(0, 1.0, 0.5);
  pjWindshield.rotation.x = -0.25;
  patrolJeepGroup.add(pjWindshield);
  // Wheels — 4
  const pjWheelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
  const pjWheelGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12);
  const pjWheelPositions = [[-0.7, 0.3, 0.85], [0.7, 0.3, 0.85], [-0.7, 0.3, -0.85], [0.7, 0.3, -0.85]];
  pjWheelPositions.forEach(p => {
    const w = new THREE.Mesh(pjWheelGeom, pjWheelMat);
    w.position.set(p[0], p[1], p[2]);
    w.rotation.z = Math.PI / 2;
    patrolJeepGroup.add(w);
  });
  // Light bar on roof — red and blue
  const pjLightBarBase = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.1, 0.2),
    new THREE.MeshLambertMaterial({ color: 0x333333 })
  );
  pjLightBarBase.position.set(0, 1.31, -0.1);
  patrolJeepGroup.add(pjLightBarBase);
  const pjLightRed = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.12, 0.15),
    new THREE.MeshBasicMaterial({ color: 0xff3322 })
  );
  pjLightRed.position.set(-0.3, 1.4, -0.1);
  patrolJeepGroup.add(pjLightRed);
  const pjLightBlue = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.12, 0.15),
    new THREE.MeshBasicMaterial({ color: 0x2266ff })
  );
  pjLightBlue.position.set(0.3, 1.4, -0.1);
  patrolJeepGroup.add(pjLightBlue);
  // PATROL text on door — small canvas sign
  const pjSignCanvas = document.createElement('canvas');
  pjSignCanvas.width = 128; pjSignCanvas.height = 32;
  const pjSignCtx = pjSignCanvas.getContext('2d');
  pjSignCtx.fillStyle = '#c9b585';
  pjSignCtx.fillRect(0, 0, 128, 32);
  pjSignCtx.fillStyle = '#222222';
  pjSignCtx.font = 'bold 22px sans-serif';
  pjSignCtx.textAlign = 'center';
  pjSignCtx.fillText('SHORE PATROL', 64, 24);
  const pjSignTex = new THREE.CanvasTexture(pjSignCanvas);
  const pjSign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 0.3),
    new THREE.MeshBasicMaterial({ map: pjSignTex, transparent: true })
  );
  pjSign.position.set(0.81, 0.7, 0);
  pjSign.rotation.y = -Math.PI / 2;
  patrolJeepGroup.add(pjSign);
  patrolJeepGroup.position.set(-15, 0.05, 22);
  patrolJeepGroup.rotation.y = 0.6;
  group.add(patrolJeepGroup);

  // --- v45: helicopter on helipad, beach DJ booth, plein-air painter ---
  // Helicopter pad with helicopter — a rescue chopper parked
  const helipadGroup = new THREE.Group();
  // Helipad disc with H marking
  const helipadCanvas = document.createElement('canvas');
  helipadCanvas.width = 128; helipadCanvas.height = 128;
  const hpCtx = helipadCanvas.getContext('2d');
  hpCtx.fillStyle = '#3a3a3a';
  hpCtx.beginPath(); hpCtx.arc(64, 64, 60, 0, Math.PI * 2); hpCtx.fill();
  hpCtx.strokeStyle = '#fff8aa'; hpCtx.lineWidth = 4;
  hpCtx.beginPath(); hpCtx.arc(64, 64, 56, 0, Math.PI * 2); hpCtx.stroke();
  hpCtx.fillStyle = '#fff8aa';
  hpCtx.font = 'bold 70px sans-serif';
  hpCtx.textAlign = 'center';
  hpCtx.textBaseline = 'middle';
  hpCtx.fillText('H', 64, 64);
  const helipadTex = new THREE.CanvasTexture(helipadCanvas);
  const helipadMat = new THREE.MeshLambertMaterial({ map: helipadTex });
  const helipad = new THREE.Mesh(new THREE.CircleGeometry(2.6, 24), helipadMat);
  helipad.rotation.x = -Math.PI / 2;
  helipad.position.y = 0.06;
  helipadGroup.add(helipad);
  // Helicopter — orange rescue
  const helicopter = new THREE.Group();
  // Body
  const heliBody = new THREE.Mesh(
    new THREE.SphereGeometry(0.7, 12, 8),
    new THREE.MeshLambertMaterial({ color: 0xee6622 })
  );
  heliBody.scale.set(1, 0.85, 1.4);
  heliBody.position.y = 0.7;
  helicopter.add(heliBody);
  // Tail boom
  const heliTail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.18, 1.6, 8),
    new THREE.MeshLambertMaterial({ color: 0xee6622 })
  );
  heliTail.rotation.x = Math.PI / 2;
  heliTail.position.set(0, 0.75, -1.4);
  helicopter.add(heliTail);
  // Tail rotor
  const heliTailRotor = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.05, 0.05),
    new THREE.MeshLambertMaterial({ color: 0x222222 })
  );
  heliTailRotor.position.set(0.15, 0.85, -2.1);
  helicopter.add(heliTailRotor);
  // Cockpit window
  const heliCockpit = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0x88aacc, transparent: true, opacity: 0.65 })
  );
  heliCockpit.scale.set(1, 0.85, 1.1);
  heliCockpit.position.set(0, 0.78, 0.45);
  helicopter.add(heliCockpit);
  // Skids
  const heliSkidMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
  const heliSkid1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6), heliSkidMat);
  heliSkid1.rotation.x = Math.PI / 2;
  heliSkid1.position.set(-0.45, 0.1, -0.2);
  helicopter.add(heliSkid1);
  const heliSkid2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6), heliSkidMat);
  heliSkid2.rotation.x = Math.PI / 2;
  heliSkid2.position.set(0.45, 0.1, -0.2);
  helicopter.add(heliSkid2);
  // Skid struts
  for (let i = 0; i < 4; i++) {
    const strut = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.32, 4),
      heliSkidMat
    );
    const sx = i % 2 === 0 ? -0.45 : 0.45;
    const sz = i < 2 ? -0.6 : 0.2;
    strut.position.set(sx, 0.26, sz);
    helicopter.add(strut);
  }
  // Main rotor mast + blades
  const heliMast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.28, 6),
    new THREE.MeshLambertMaterial({ color: 0x333333 })
  );
  heliMast.position.set(0, 1.25, 0);
  helicopter.add(heliMast);
  const heliRotorPivot = new THREE.Group();
  heliRotorPivot.position.set(0, 1.4, 0);
  const heliBlade1 = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 0.04, 0.18),
    new THREE.MeshLambertMaterial({ color: 0x222222 })
  );
  heliRotorPivot.add(heliBlade1);
  const heliBlade2 = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.04, 2.8),
    new THREE.MeshLambertMaterial({ color: 0x222222 })
  );
  heliRotorPivot.add(heliBlade2);
  helicopter.add(heliRotorPivot);
  // RESCUE text on side
  const heliSignCanvas = document.createElement('canvas');
  heliSignCanvas.width = 128; heliSignCanvas.height = 28;
  const heliSignCtx = heliSignCanvas.getContext('2d');
  heliSignCtx.fillStyle = '#ee6622';
  heliSignCtx.fillRect(0, 0, 128, 28);
  heliSignCtx.fillStyle = '#ffffff';
  heliSignCtx.font = 'bold 22px sans-serif';
  heliSignCtx.textAlign = 'center';
  heliSignCtx.fillText('RESCUE', 64, 22);
  const heliSignTex = new THREE.CanvasTexture(heliSignCanvas);
  const heliSign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 0.26),
    new THREE.MeshBasicMaterial({ map: heliSignTex, transparent: true })
  );
  heliSign.position.set(0.71, 0.7, 0);
  heliSign.rotation.y = -Math.PI / 2;
  helicopter.add(heliSign);
  helipadGroup.add(helicopter);
  helipadGroup.position.set(28, 0.05, 4);
  group.add(helipadGroup);

  // Beach DJ booth — turntable, 2 speakers, DJ figure
  const djBoothGroup = new THREE.Group();
  // Booth table
  const djTable = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 0.05, 0.7),
    new THREE.MeshLambertMaterial({ color: 0x222222 })
  );
  djTable.position.y = 0.85;
  djBoothGroup.add(djTable);
  // Table legs (just front 2 visible)
  const djLegMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
  for (let i = 0; i < 4; i++) {
    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.85, 0.06),
      djLegMat
    );
    leg.position.set(i % 2 === 0 ? -0.95 : 0.95, 0.42, i < 2 ? 0.3 : -0.3);
    djBoothGroup.add(leg);
  }
  // 2 turntables
  const djTurntableMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
  for (let i = 0; i < 2; i++) {
    const tt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 0.06, 16),
      djTurntableMat
    );
    tt.position.set(i === 0 ? -0.55 : 0.55, 0.91, 0);
    djBoothGroup.add(tt);
    const record = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.26, 0.005, 16),
      new THREE.MeshLambertMaterial({ color: 0x111111 })
    );
    record.position.set(i === 0 ? -0.55 : 0.55, 0.95, 0);
    djBoothGroup.add(record);
  }
  // Mixer (small box between turntables)
  const djMixer = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.07, 0.4),
    new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
  );
  djMixer.position.set(0, 0.92, 0);
  djBoothGroup.add(djMixer);
  // DJ figure
  const djFigure = new THREE.Group();
  const djBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.24, 0.7, 8),
    new THREE.MeshLambertMaterial({ color: 0xff6644 })
  );
  djBody.position.y = 0.35;
  djFigure.add(djBody);
  const djHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 8, 6),
    new THREE.MeshLambertMaterial({ color: 0xc89870 })
  );
  djHead.position.y = 0.85;
  djFigure.add(djHead);
  // Headphones
  const djHeadphones = new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.04, 6, 12, Math.PI),
    new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
  );
  djHeadphones.position.y = 0.95;
  djFigure.add(djHeadphones);
  djFigure.position.set(0, 0, -0.5);
  djBoothGroup.add(djFigure);
  // Two speakers flanking the booth
  const djSpeakerMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
  const djSpeakerConeMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const djSpeakers = [];
  for (let i = 0; i < 2; i++) {
    const speaker = new THREE.Group();
    const sBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 1.0, 0.5),
      djSpeakerMat
    );
    sBody.position.y = 0.5;
    speaker.add(sBody);
    const sCone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.05, 12),
      djSpeakerConeMat
    );
    sCone.rotation.x = Math.PI / 2;
    sCone.position.set(0, 0.65, 0.27);
    speaker.add(sCone);
    speaker.position.set(i === 0 ? -1.4 : 1.4, 0, 0.4);
    djSpeakers.push(speaker);
    djBoothGroup.add(speaker);
  }
  djBoothGroup.position.set(-12, 0.05, 30);
  djBoothGroup.rotation.y = -0.3;
  group.add(djBoothGroup);

  // Plein-air painter — figure at easel painting the seascape
  const painterGroup = new THREE.Group();
  // Easel — tripod + canvas
  const easelLegMat = new THREE.MeshLambertMaterial({ color: 0x6a4a2a });
  for (let i = 0; i < 3; i++) {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 1.4, 6),
      easelLegMat
    );
    const ang = (i / 3) * Math.PI * 2;
    leg.position.set(Math.cos(ang) * 0.18, 0.7, Math.sin(ang) * 0.18);
    leg.rotation.x = -Math.cos(ang) * 0.16;
    leg.rotation.z = Math.sin(ang) * 0.16;
    painterGroup.add(leg);
  }
  // Canvas with ocean painting
  const paintCanvas = document.createElement('canvas');
  paintCanvas.width = 96; paintCanvas.height = 64;
  const paintCtx = paintCanvas.getContext('2d');
  // Gradient sky
  const grd = paintCtx.createLinearGradient(0, 0, 0, 64);
  grd.addColorStop(0, '#88bbe8');
  grd.addColorStop(0.5, '#ffaa66');
  grd.addColorStop(1, '#cc7755');
  paintCtx.fillStyle = grd;
  paintCtx.fillRect(0, 0, 96, 38);
  // Ocean
  paintCtx.fillStyle = '#3a6688';
  paintCtx.fillRect(0, 38, 96, 26);
  // Waves
  paintCtx.strokeStyle = '#a8c8e0';
  paintCtx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    paintCtx.beginPath();
    paintCtx.moveTo(0, 44 + i * 4);
    for (let x = 0; x < 96; x += 6) {
      paintCtx.lineTo(x + 3, 44 + i * 4 + Math.sin(x * 0.3) * 1.5);
    }
    paintCtx.stroke();
  }
  // Sun
  paintCtx.fillStyle = '#fff8d8';
  paintCtx.beginPath(); paintCtx.arc(70, 28, 5, 0, Math.PI * 2); paintCtx.fill();
  const paintTex = new THREE.CanvasTexture(paintCanvas);
  const painting = new THREE.Mesh(
    new THREE.PlaneGeometry(0.85, 0.6),
    new THREE.MeshLambertMaterial({ map: paintTex, side: THREE.DoubleSide })
  );
  painting.position.set(0, 1.2, 0.05);
  painterGroup.add(painting);
  // Frame
  const paintFrame = new THREE.Mesh(
    new THREE.PlaneGeometry(0.95, 0.7),
    new THREE.MeshLambertMaterial({ color: 0x4a3a2a })
  );
  paintFrame.position.set(0, 1.2, 0.04);
  painterGroup.add(paintFrame);
  // Painter figure
  const painter = new THREE.Group();
  const painterBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.22, 0.7, 8),
    new THREE.MeshLambertMaterial({ color: 0x66aa88 })
  );
  painterBody.position.y = 0.35;
  painter.add(painterBody);
  const painterHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 8, 6),
    new THREE.MeshLambertMaterial({ color: 0xe2b78a })
  );
  painterHead.position.y = 0.84;
  painter.add(painterHead);
  // Beret
  const painterBeret = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.16, 0.06, 8),
    new THREE.MeshLambertMaterial({ color: 0x882222 })
  );
  painterBeret.position.y = 0.96;
  painter.add(painterBeret);
  // Painting arm (extended toward easel)
  const painterArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.4, 6),
    new THREE.MeshLambertMaterial({ color: 0x66aa88 })
  );
  painterArm.position.set(0.2, 0.7, 0.15);
  painterArm.rotation.x = 0.6;
  painter.add(painterArm);
  // Palette in other hand
  const painterPalette = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.025, 8),
    new THREE.MeshLambertMaterial({ color: 0xc0a888 })
  );
  painterPalette.rotation.z = Math.PI / 2;
  painterPalette.position.set(-0.2, 0.55, 0);
  painter.add(painterPalette);
  painter.position.set(0, 0, -0.6);
  painterGroup.add(painter);
  painterGroup.position.set(20, 0.05, 26);
  painterGroup.rotation.y = -2.2;
  group.add(painterGroup);


  // --- v46: marina forklift, beach drone, sandbar seal colony ---------------

  // Marina forklift carrying a stack of lobster traps along the dock
  const forkliftGroup = new THREE.Group();
  const fkBodyMat = new THREE.MeshLambertMaterial({ color: 0xf2c200 });
  const fkBody = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 1.8), fkBodyMat);
  fkBody.position.y = 0.7;
  forkliftGroup.add(fkBody);
  const fkCabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.9, 0.8),
    new THREE.MeshLambertMaterial({ color: 0x222244, transparent: true, opacity: 0.55 })
  );
  fkCabin.position.set(0, 1.65, 0.2);
  forkliftGroup.add(fkCabin);
  const fkRoof = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 1.0), fkBodyMat);
  fkRoof.position.set(0, 2.15, 0.2);
  forkliftGroup.add(fkRoof);
  const fkWheelMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
  const fkWheelGeom = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 14);
  fkWheelGeom.rotateZ(Math.PI / 2);
  for (const wp of [[-0.7,0.32,0.65],[0.7,0.32,0.65],[-0.7,0.32,-0.65],[0.7,0.32,-0.65]]) {
    const w = new THREE.Mesh(fkWheelGeom, fkWheelMat);
    w.position.set(wp[0], wp[1], wp[2]);
    forkliftGroup.add(w);
  }
  // Mast (vertical) and forks
  const fkMast = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 2.4, 0.12),
    new THREE.MeshLambertMaterial({ color: 0xaa2222 })
  );
  fkMast.position.set(0.4, 1.4, -1.05);
  forkliftGroup.add(fkMast);
  const fkMast2 = fkMast.clone();
  fkMast2.position.x = -0.4;
  forkliftGroup.add(fkMast2);
  const fkForkMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
  const fkFork1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 1.6), fkForkMat);
  fkFork1.position.set(-0.3, 0.7, -1.85);
  forkliftGroup.add(fkFork1);
  const fkFork2 = fkFork1.clone();
  fkFork2.position.x = 0.3;
  forkliftGroup.add(fkFork2);
  // Stack of lobster traps on the forks
  const fkTrapMat = new THREE.MeshLambertMaterial({ color: 0x6a4a2a, wireframe: true });
  const fkTrapStack = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const trap = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 0.7), fkTrapMat);
    trap.position.y = 0.18 + i * 0.36;
    fkTrapStack.add(trap);
  }
  fkTrapStack.position.set(0, 0.7, -2.0);
  forkliftGroup.add(fkTrapStack);
  // Driver figure
  const fkDriverBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 0.55, 10),
    new THREE.MeshLambertMaterial({ color: 0xff6600 })
  );
  fkDriverBody.position.set(0, 1.6, 0.4);
  forkliftGroup.add(fkDriverBody);
  const fkDriverHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 10, 8),
    new THREE.MeshLambertMaterial({ color: 0xffd9b3 })
  );
  fkDriverHead.position.set(0, 2.0, 0.4);
  forkliftGroup.add(fkDriverHead);
  forkliftGroup.position.set(-12, 0.05, 22);
  forkliftGroup.rotation.y = 0.4;
  group.add(forkliftGroup);

  // Beach drone flying overhead in lazy circles
  const beachDroneGroup = new THREE.Group();
  const drBodyMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const drBody = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.35), drBodyMat);
  beachDroneGroup.add(drBody);
  const drArmMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
  for (const ap of [[0.28,0,0.28],[-0.28,0,0.28],[0.28,0,-0.28],[-0.28,0,-0.28]]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.4), drArmMat);
    arm.position.set(ap[0]/2, 0, ap[2]/2);
    arm.lookAt(ap[0]*2, 0, ap[2]*2);
    beachDroneGroup.add(arm);
  }
  const drProps = [];
  const drPropMat = new THREE.MeshLambertMaterial({ color: 0x888888, transparent: true, opacity: 0.5 });
  for (const pp of [[0.32,0.08,0.32],[-0.32,0.08,0.32],[0.32,0.08,-0.32],[-0.32,0.08,-0.32]]) {
    const prop = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.04), drPropMat);
    prop.position.set(pp[0], pp[1], pp[2]);
    beachDroneGroup.add(prop);
    drProps.push(prop);
  }
  // Blinking LED
  const drLED = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  );
  drLED.position.set(0, -0.08, 0);
  beachDroneGroup.add(drLED);
  beachDroneGroup.position.set(0, 14, 0);
  group.add(beachDroneGroup);

  // Sandbar with seal colony lounging
  const sandbarGroup = new THREE.Group();
  const sandbarMat = new THREE.MeshLambertMaterial({ color: 0xd9c89a });
  const sandbar = new THREE.Mesh(
    new THREE.CylinderGeometry(4.5, 5.0, 0.3, 18),
    sandbarMat
  );
  sandbar.position.y = 0.0;
  sandbar.scale.set(1.0, 1.0, 1.6);
  sandbarGroup.add(sandbar);
  // Seals (gray ellipsoids with little heads)
  const sandbarSealMat = new THREE.MeshLambertMaterial({ color: 0x4a4a52 });
  const sandbarSealMatLight = new THREE.MeshLambertMaterial({ color: 0x6a6a72 });
  const sandbarSeals = [];
  const sealPositions = [
    [-1.6, 0.0, -2.2, 0.4, sandbarSealMat],
    [1.5, 0.0, -1.8, -0.6, sandbarSealMatLight],
    [-0.5, 0.0, 0.5, 1.2, sandbarSealMat],
    [2.0, 0.0, 1.6, -0.3, sandbarSealMatLight],
    [-2.4, 0.0, 1.0, 0.9, sandbarSealMat],
  ];
  for (const sp of sealPositions) {
    const seal = new THREE.Group();
    const sealBody = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 12, 10),
      sp[4]
    );
    sealBody.scale.set(1.0, 0.6, 1.8);
    sealBody.position.y = 0.35;
    seal.add(sealBody);
    const sealHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 10, 8),
      sp[4]
    );
    sealHead.position.set(0, 0.55, 0.85);
    seal.add(sealHead);
    // Tiny eye dots
    const sealEyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    for (const ex of [-0.12, 0.12]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), sealEyeMat);
      eye.position.set(ex, 0.62, 1.05);
      seal.add(eye);
    }
    seal.position.set(sp[0], sp[1], sp[2]);
    seal.rotation.y = sp[3];
    sandbarGroup.add(seal);
    sandbarSeals.push(seal);
  }
  sandbarGroup.position.set(35, 0.05, -22);
  group.add(sandbarGroup);



  // --- v47: souvenir shop, dock spotlight tower, kite surfer ----------------

  // Beach souvenir shop with awning, hanging trinkets, and a customer
  const souvenirShopGroup = new THREE.Group();
  const ssBaseMat = new THREE.MeshLambertMaterial({ color: 0xe8d8a0 });
  const ssCounter = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.0, 1.4), ssBaseMat);
  ssCounter.position.set(0, 0.5, 0);
  souvenirShopGroup.add(ssCounter);
  // Posts
  const ssPostMat = new THREE.MeshLambertMaterial({ color: 0x6a4a2a });
  for (const px of [-1.7, 1.7]) {
    for (const pz of [-0.6, 0.6]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.6, 0.1), ssPostMat);
      post.position.set(px, 1.3, pz);
      souvenirShopGroup.add(post);
    }
  }
  // Awning (striped canopy)
  const ssAwningMat = new THREE.MeshLambertMaterial({ color: 0xff5252 });
  const ssAwning = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.1, 1.7), ssAwningMat);
  ssAwning.position.set(0, 2.6, 0);
  souvenirShopGroup.add(ssAwning);
  const ssStripe = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.11, 0.4), new THREE.MeshLambertMaterial({ color: 0xffffff }));
  ssStripe.position.set(0, 2.61, 0);
  souvenirShopGroup.add(ssStripe);
  // Hanging trinkets — colored shells & shirts
  const ssTrinketColors = [0xff6699, 0xffcc33, 0x66ccff, 0xff9966, 0x99ff99];
  const ssTrinkets = [];
  for (let i = 0; i < 7; i++) {
    const isShell = i % 2 === 0;
    const trinket = new THREE.Mesh(
      isShell ? new THREE.SphereGeometry(0.12, 8, 6) : new THREE.BoxGeometry(0.22, 0.28, 0.04),
      new THREE.MeshLambertMaterial({ color: ssTrinketColors[i % ssTrinketColors.length] })
    );
    trinket.position.set(-1.5 + i * 0.45, 2.2 - (i % 2) * 0.15, 0.6);
    souvenirShopGroup.add(trinket);
    ssTrinkets.push(trinket);
  }
  // Sign canvas
  const ssSignCanvas = document.createElement('canvas');
  ssSignCanvas.width = 256; ssSignCanvas.height = 64;
  const ssSignCtx = ssSignCanvas.getContext('2d');
  ssSignCtx.fillStyle = '#1a1a2a';
  ssSignCtx.fillRect(0, 0, 256, 64);
  ssSignCtx.fillStyle = '#ffd966';
  ssSignCtx.font = 'bold 32px sans-serif';
  ssSignCtx.textAlign = 'center';
  ssSignCtx.fillText('SHELL SHOP', 128, 42);
  const ssSignTex = new THREE.CanvasTexture(ssSignCanvas);
  const ssSign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 0.6),
    new THREE.MeshBasicMaterial({ map: ssSignTex })
  );
  ssSign.position.set(0, 1.7, 0.71);
  souvenirShopGroup.add(ssSign);
  // Vendor figure
  const ssVendor = new THREE.Group();
  const ssVendorBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 0.9, 10),
    new THREE.MeshLambertMaterial({ color: 0x99ddff })
  );
  ssVendorBody.position.y = 0.45;
  ssVendor.add(ssVendorBody);
  const ssVendorHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 10, 8),
    new THREE.MeshLambertMaterial({ color: 0xffd9b3 })
  );
  ssVendorHead.position.y = 1.05;
  ssVendor.add(ssVendorHead);
  ssVendor.position.set(0, 1.0, -0.5);
  souvenirShopGroup.add(ssVendor);
  // Customer browsing
  const ssCustomer = new THREE.Group();
  const ssCustBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 0.85, 10),
    new THREE.MeshLambertMaterial({ color: 0xff99cc })
  );
  ssCustBody.position.y = 0.42;
  ssCustomer.add(ssCustBody);
  const ssCuspotHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 10, 8),
    new THREE.MeshLambertMaterial({ color: 0xffd9b3 })
  );
  ssCuspotHead.position.y = 0.97;
  ssCustomer.add(ssCuspotHead);
  ssCustomer.position.set(1.0, 0, 1.4);
  ssCustomer.rotation.y = Math.PI;
  souvenirShopGroup.add(ssCustomer);
  souvenirShopGroup.position.set(-26, 0.05, 18);
  souvenirShopGroup.rotation.y = -0.5;
  group.add(souvenirShopGroup);

  // Dock spotlight tower with rotating beam
  const spotTowerGroup = new THREE.Group();
  const spotTowerMat = new THREE.MeshLambertMaterial({ color: 0x556677 });
  const spotPole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 6.0, 8), spotTowerMat);
  spotPole.position.y = 3.0;
  spotTowerGroup.add(spotPole);
  // Cross-bracing
  const spotBrace = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.8), spotTowerMat);
  spotBrace.position.y = 2.0;
  spotTowerGroup.add(spotBrace);
  // Spotlight head pivot
  const spotHeadPivot = new THREE.Group();
  spotHeadPivot.position.y = 6.0;
  const spotHead = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.4, 0.7, 12),
    new THREE.MeshLambertMaterial({ color: 0x222222 })
  );
  spotHead.rotation.z = Math.PI / 2;
  spotHead.position.x = 0.4;
  spotHeadPivot.add(spotHead);
  const spotLens = new THREE.Mesh(
    new THREE.CircleGeometry(0.38, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffaa })
  );
  spotLens.position.set(0.78, 0, 0);
  spotLens.rotation.y = Math.PI / 2;
  spotHeadPivot.add(spotLens);
  // Beam cone
  const spotBeam = new THREE.Mesh(
    new THREE.ConeGeometry(2.5, 18, 14, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffffaa, transparent: true, opacity: 0.18, side: THREE.DoubleSide })
  );
  spotBeam.rotation.z = -Math.PI / 2;
  spotBeam.position.x = 9.6;
  spotHeadPivot.add(spotBeam);
  spotTowerGroup.add(spotHeadPivot);
  spotTowerGroup.position.set(8, 0.05, -8);
  group.add(spotTowerGroup);

  // Beach kite surfer with kite very high in the sky
  const kiteSurferGroup = new THREE.Group();
  // Surfer figure on a small board
  const ksBoardMat = new THREE.MeshLambertMaterial({ color: 0x33aa66 });
  const ksBoard = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 1.3), ksBoardMat);
  ksBoard.position.set(0, 0.05, 0);
  kiteSurferGroup.add(ksBoard);
  const ksSurfer = new THREE.Group();
  const ksSurferBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.2, 0.85, 10),
    new THREE.MeshLambertMaterial({ color: 0x222288 })
  );
  ksSurferBody.position.y = 0.5;
  ksSurfer.add(ksSurferBody);
  const ksSurferHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 10, 8),
    new THREE.MeshLambertMaterial({ color: 0xffd9b3 })
  );
  ksSurferHead.position.y = 1.05;
  ksSurfer.add(ksSurferHead);
  ksSurfer.position.y = 0.1;
  kiteSurferGroup.add(ksSurfer);
  // Kite high in the sky (a parafoil)
  const kiteWing = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.15, 1.0),
    new THREE.MeshLambertMaterial({ color: 0xff3366 })
  );
  kiteWing.position.set(0, 9.5, 0);
  kiteWing.rotation.z = 0.2;
  kiteSurferGroup.add(kiteWing);
  // Kite stripe accent
  const kiteStripe = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.16, 0.25),
    new THREE.MeshLambertMaterial({ color: 0xffff66 })
  );
  kiteStripe.position.set(0, 9.51, 0);
  kiteStripe.rotation.z = 0.2;
  kiteSurferGroup.add(kiteStripe);
  // Lines from surfer to kite
  const ksLineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
  const ksLineGeom1 = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-0.1, 1.0, 0),
    new THREE.Vector3(-0.4, 9.4, 0)
  ]);
  const ksLine1 = new THREE.Line(ksLineGeom1, ksLineMat);
  kiteSurferGroup.add(ksLine1);
  const ksLineGeom2 = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0.1, 1.0, 0),
    new THREE.Vector3(0.4, 9.4, 0)
  ]);
  const ksLine2 = new THREE.Line(ksLineGeom2, ksLineMat);
  kiteSurferGroup.add(ksLine2);
  kiteSurferGroup.position.set(28, 0.0, 16);
  group.add(kiteSurferGroup);

  // --- v48: diving pelican flock, souvenir bicycle vendor, lifeboat on davits -
  // (1) pelican flock diving for fish — 4 birds in plunge over surf
  const diveFlockGroup = new THREE.Group();
  const dpBirdMat = new THREE.MeshLambertMaterial({ color: 0xf6f1e6 });
  const dpWingMat = new THREE.MeshLambertMaterial({ color: 0x8a7a5c });
  const dpBeakMat = new THREE.MeshLambertMaterial({ color: 0xe8a050 });
  const divePelicans = [];
  for (let i = 0; i < 4; i++) {
    const dpBird = new THREE.Group();
    const dpBody = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), dpBirdMat);
    dpBody.scale.set(1, 0.6, 1.4);
    dpBird.add(dpBody);
    const dpWing1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 0.5), dpWingMat);
    dpWing1.position.set(0, 0.05, 0);
    dpBird.add(dpWing1);
    const dpBeak = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.55, 6), dpBeakMat);
    dpBeak.rotation.x = -Math.PI / 2;
    dpBeak.position.set(0, -0.05, 0.7);
    dpBird.add(dpBeak);
    dpBird.userData.phase = i * 0.7;
    dpBird.userData.cx = -22 + i * 1.8;
    dpBird.userData.cz = 24 + (i % 2) * 1.2;
    divePelicans.push(dpBird);
    diveFlockGroup.add(dpBird);
  }
  diveFlockGroup.position.set(0, 0, 0);
  group.add(diveFlockGroup);

  // (2) beach souvenir vendor on bicycle with cooler — riding along promenade
  const beachBikeGroup = new THREE.Group();
  const bbFrameMat = new THREE.MeshLambertMaterial({ color: 0xc23a3a });
  const bbWheelMat = new THREE.MeshLambertMaterial({ color: 0x202020 });
  const bbWheelGeom = new THREE.TorusGeometry(0.32, 0.05, 6, 16);
  const bbWheel1 = new THREE.Mesh(bbWheelGeom, bbWheelMat);
  bbWheel1.rotation.y = Math.PI / 2;
  bbWheel1.position.set(0, 0.32, 0.7);
  beachBikeGroup.add(bbWheel1);
  const bbWheel2 = new THREE.Mesh(bbWheelGeom, bbWheelMat);
  bbWheel2.rotation.y = Math.PI / 2;
  bbWheel2.position.set(0, 0.32, -0.7);
  beachBikeGroup.add(bbWheel2);
  const bbFrame = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 1.4), bbFrameMat);
  bbFrame.position.set(0, 0.55, 0);
  beachBikeGroup.add(bbFrame);
  const bbSeatPost = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6), bbFrameMat);
  bbSeatPost.position.set(0, 0.75, -0.4);
  beachBikeGroup.add(bbSeatPost);
  const bbHandlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6), bbFrameMat);
  bbHandlebar.rotation.z = Math.PI / 2;
  bbHandlebar.position.set(0, 0.95, 0.5);
  beachBikeGroup.add(bbHandlebar);
  const bbCoolerMat = new THREE.MeshLambertMaterial({ color: 0x2a78c2 });
  const bbCooler = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 0.4), bbCoolerMat);
  bbCooler.position.set(0, 1.05, 0.5);
  beachBikeGroup.add(bbCooler);
  const bbCoolerLid = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.45), new THREE.MeshLambertMaterial({ color: 0xffffff }));
  bbCoolerLid.position.set(0, 1.25, 0.5);
  beachBikeGroup.add(bbCoolerLid);
  const bbRider = new THREE.Group();
  const bbRiderBody = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.7, 8), new THREE.MeshLambertMaterial({ color: 0xffd055 }));
  bbRiderBody.position.set(0, 1.1, -0.3);
  bbRider.add(bbRiderBody);
  const bbRiderHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), new THREE.MeshLambertMaterial({ color: 0xeec59a }));
  bbRiderHead.position.set(0, 1.6, -0.3);
  bbRider.add(bbRiderHead);
  const bbRiderHat = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.05, 12), new THREE.MeshLambertMaterial({ color: 0xfffde0 }));
  bbRiderHat.position.set(0, 1.78, -0.3);
  bbRider.add(bbRiderHat);
  beachBikeGroup.add(bbRider);
  beachBikeGroup.position.set(-15, 0, -8);
  group.add(beachBikeGroup);

  // (3) lifeboat on davits — orange lifeboat hanging from a davit frame near pier
  const lifeboatGroup = new THREE.Group();
  const lbDavitMat = new THREE.MeshLambertMaterial({ color: 0xc8c8c8 });
  const lbBase = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 3.2), lbDavitMat);
  lbBase.position.set(0, 0.2, 0);
  lifeboatGroup.add(lbBase);
  const lbDavitPost1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.0, 8), lbDavitMat);
  lbDavitPost1.position.set(0, 1.7, 1.4);
  lifeboatGroup.add(lbDavitPost1);
  const lbDavitPost2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.0, 8), lbDavitMat);
  lbDavitPost2.position.set(0, 1.7, -1.4);
  lifeboatGroup.add(lbDavitPost2);
  const lbDavitArm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.6, 8), lbDavitMat);
  lbDavitArm1.rotation.z = Math.PI / 2;
  lbDavitArm1.position.set(-0.8, 3.2, 1.4);
  lifeboatGroup.add(lbDavitArm1);
  const lbDavitArm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.6, 8), lbDavitMat);
  lbDavitArm2.rotation.z = Math.PI / 2;
  lbDavitArm2.position.set(-0.8, 3.2, -1.4);
  lifeboatGroup.add(lbDavitArm2);
  const lbHullMat = new THREE.MeshLambertMaterial({ color: 0xee5511 });
  const lbHullGeom = new THREE.CylinderGeometry(0.55, 0.4, 2.6, 10, 1, false, 0, Math.PI);
  const lbHull = new THREE.Mesh(lbHullGeom, lbHullMat);
  lbHull.rotation.x = Math.PI / 2;
  lbHull.rotation.y = Math.PI;
  lbHull.position.set(-1.6, 2.5, 0);
  lifeboatGroup.add(lbHull);
  const lbCanopyMat = new THREE.MeshLambertMaterial({ color: 0xd84a08 });
  const lbCanopy = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 2.0), lbCanopyMat);
  lbCanopy.position.set(-1.6, 2.85, 0);
  lifeboatGroup.add(lbCanopy);
  const lbStripeMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const lbStripe = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.08, 2.5), lbStripeMat);
  lbStripe.position.set(-1.6, 2.55, 0);
  lifeboatGroup.add(lbStripe);
  const lbCableMat = new THREE.LineBasicMaterial({ color: 0x202020 });
  const lbCableGeom1 = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-1.6, 3.2, 1.4), new THREE.Vector3(-1.6, 2.7, 1.0)]);
  const lbCable1 = new THREE.Line(lbCableGeom1, lbCableMat);
  lifeboatGroup.add(lbCable1);
  const lbCableGeom2 = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-1.6, 3.2, -1.4), new THREE.Vector3(-1.6, 2.7, -1.0)]);
  const lbCable2 = new THREE.Line(lbCableGeom2, lbCableMat);
  lifeboatGroup.add(lbCable2);
  lifeboatGroup.position.set(-12, 0, 12);
  group.add(lifeboatGroup);

  // --- v49: marina pump-out station, beach lemonade stand, dive shop tank rack -
  // (1) marina pump-out station — small green/yellow box w/ hose & pump
  const pumpOutGroup = new THREE.Group();
  const poBoxMat = new THREE.MeshLambertMaterial({ color: 0x3a7a3a });
  const poBox = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 0.9), poBoxMat);
  poBox.position.set(0, 0.8, 0);
  pumpOutGroup.add(poBox);
  const poRoof = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 1.0), new THREE.MeshLambertMaterial({ color: 0xeeb820 }));
  poRoof.position.set(0, 1.65, 0);
  pumpOutGroup.add(poRoof);
  const poPanel = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.05), new THREE.MeshLambertMaterial({ color: 0x202020 }));
  poPanel.position.set(0, 1.0, 0.46);
  pumpOutGroup.add(poPanel);
  const poGauge = new THREE.Mesh(new THREE.CircleGeometry(0.08, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  poGauge.position.set(-0.18, 1.05, 0.49);
  pumpOutGroup.add(poGauge);
  const poGauge2 = new THREE.Mesh(new THREE.CircleGeometry(0.08, 12), new THREE.MeshBasicMaterial({ color: 0xff5050 }));
  poGauge2.position.set(0.18, 1.05, 0.49);
  pumpOutGroup.add(poGauge2);
  const poHoseMat = new THREE.LineBasicMaterial({ color: 0x101010, linewidth: 2 });
  const poHosePts = [];
  for (let i = 0; i <= 16; i++) {
    const u = i / 16;
    poHosePts.push(new THREE.Vector3(0.7 - u * 0.3, 1.0 - u * 0.6 + Math.sin(u * 4) * 0.15, 0.4 + u * 1.4));
  }
  const poHoseGeom = new THREE.BufferGeometry().setFromPoints(poHosePts);
  const poHose = new THREE.Line(poHoseGeom, poHoseMat);
  pumpOutGroup.add(poHose);
  const poNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.3, 6), new THREE.MeshLambertMaterial({ color: 0x8a8a8a }));
  poNozzle.rotation.x = Math.PI / 2;
  poNozzle.position.set(0.4, 0.4, 1.85);
  pumpOutGroup.add(poNozzle);
  const poSignCanvas = document.createElement('canvas');
  poSignCanvas.width = 256; poSignCanvas.height = 64;
  const poSignCtx = poSignCanvas.getContext('2d');
  poSignCtx.fillStyle = '#3a7a3a';
  poSignCtx.fillRect(0, 0, 256, 64);
  poSignCtx.fillStyle = '#ffffff';
  poSignCtx.font = 'bold 28px sans-serif';
  poSignCtx.textAlign = 'center';
  poSignCtx.fillText('PUMP OUT', 128, 42);
  const poSignTex = new THREE.CanvasTexture(poSignCanvas);
  const poSign = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.25), new THREE.MeshBasicMaterial({ map: poSignTex, transparent: true }));
  poSign.position.set(0, 1.4, 0.46);
  pumpOutGroup.add(poSign);
  pumpOutGroup.position.set(-9, 0.05, 6);
  pumpOutGroup.rotation.y = -0.3;
  group.add(pumpOutGroup);

  // (2) beach lemonade stand — yellow stand with pitcher and kid attendant
  const lemonadeGroup = new THREE.Group();
  const lmCounterMat = new THREE.MeshLambertMaterial({ color: 0xffd450 });
  const lmCounter = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 0.7), lmCounterMat);
  lmCounter.position.set(0, 0.45, 0);
  lemonadeGroup.add(lmCounter);
  const lmStripeMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const lmStripe1 = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.12, 0.72), lmStripeMat);
  lmStripe1.position.set(0, 0.25, 0);
  lemonadeGroup.add(lmStripe1);
  const lmStripe2 = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.12, 0.72), lmStripeMat);
  lmStripe2.position.set(0, 0.65, 0);
  lemonadeGroup.add(lmStripe2);
  const lmTopMat = new THREE.MeshLambertMaterial({ color: 0xfff7d0 });
  const lmTop = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.06, 0.8), lmTopMat);
  lmTop.position.set(0, 0.95, 0);
  lemonadeGroup.add(lmTop);
  const lmPitcherMat = new THREE.MeshLambertMaterial({ color: 0xfff080 });
  const lmPitcher = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.32, 12), lmPitcherMat);
  lmPitcher.position.set(0.3, 1.13, 0.05);
  lemonadeGroup.add(lmPitcher);
  const lmCup1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.12, 8), new THREE.MeshLambertMaterial({ color: 0xfff8b5 }));
  lmCup1.position.set(-0.2, 1.04, 0.1);
  lemonadeGroup.add(lmCup1);
  const lmCup2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.12, 8), new THREE.MeshLambertMaterial({ color: 0xfff8b5 }));
  lmCup2.position.set(-0.05, 1.04, 0.1);
  lemonadeGroup.add(lmCup2);
  const lmSignCanvas = document.createElement('canvas');
  lmSignCanvas.width = 256; lmSignCanvas.height = 96;
  const lmSignCtx = lmSignCanvas.getContext('2d');
  lmSignCtx.fillStyle = '#fff080';
  lmSignCtx.fillRect(0, 0, 256, 96);
  lmSignCtx.strokeStyle = '#aa6020';
  lmSignCtx.lineWidth = 4;
  lmSignCtx.strokeRect(4, 4, 248, 88);
  lmSignCtx.fillStyle = '#aa6020';
  lmSignCtx.font = 'bold 32px serif';
  lmSignCtx.textAlign = 'center';
  lmSignCtx.fillText('LEMONADE', 128, 44);
  lmSignCtx.font = 'bold 22px serif';
  lmSignCtx.fillText('25¢', 128, 78);
  const lmSignTex = new THREE.CanvasTexture(lmSignCanvas);
  const lmSign = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.55), new THREE.MeshBasicMaterial({ map: lmSignTex, transparent: true }));
  lmSign.position.set(0, 1.55, 0.36);
  lemonadeGroup.add(lmSign);
  // small kid attendant
  const lmKidBody = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.5, 8), new THREE.MeshLambertMaterial({ color: 0xff7080 }));
  lmKidBody.position.set(0, 1.2, -0.4);
  lemonadeGroup.add(lmKidBody);
  const lmKidHead = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), new THREE.MeshLambertMaterial({ color: 0xeec59a }));
  lmKidHead.position.set(0, 1.6, -0.4);
  lemonadeGroup.add(lmKidHead);
  lemonadeGroup.position.set(8, 0.05, 18);
  lemonadeGroup.rotation.y = -0.4;
  group.add(lemonadeGroup);

  // (3) dive shop tank rack — colored scuba tanks lined up under awning
  const diveShopGroup = new THREE.Group();
  const dsBaseMat = new THREE.MeshLambertMaterial({ color: 0x404060 });
  const dsBase = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.18, 0.6), dsBaseMat);
  dsBase.position.set(0, 0.09, 0);
  diveShopGroup.add(dsBase);
  const dsAwningMat = new THREE.MeshLambertMaterial({ color: 0x208ab8 });
  const dsAwning = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.05, 0.8), dsAwningMat);
  dsAwning.position.set(0, 1.6, 0);
  diveShopGroup.add(dsAwning);
  const dsPostMat = new THREE.MeshLambertMaterial({ color: 0x303030 });
  const dsPost1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6), dsPostMat);
  dsPost1.position.set(-1.15, 0.85, 0);
  diveShopGroup.add(dsPost1);
  const dsPost2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6), dsPostMat);
  dsPost2.position.set(1.15, 0.85, 0);
  diveShopGroup.add(dsPost2);
  const dsTankColors = [0xe44a4a, 0x4ad06a, 0x4a8ad0, 0xefc44a, 0xa050d0, 0x40c0c0];
  const dsTanks = [];
  for (let i = 0; i < 6; i++) {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.85, 12), new THREE.MeshLambertMaterial({ color: dsTankColors[i] }));
    tank.position.set(-1.0 + i * 0.4, 0.6, 0);
    const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.12, 6), new THREE.MeshLambertMaterial({ color: 0xc0c0c0 }));
    valve.position.set(0, 0.49, 0);
    tank.add(valve);
    diveShopGroup.add(tank);
    dsTanks.push(tank);
  }
  const dsSignCanvas = document.createElement('canvas');
  dsSignCanvas.width = 256; dsSignCanvas.height = 64;
  const dsSignCtx = dsSignCanvas.getContext('2d');
  dsSignCtx.fillStyle = '#208ab8';
  dsSignCtx.fillRect(0, 0, 256, 64);
  dsSignCtx.fillStyle = '#ffffff';
  dsSignCtx.font = 'bold 28px sans-serif';
  dsSignCtx.textAlign = 'center';
  dsSignCtx.fillText('DIVE SHOP', 128, 42);
  const dsSignTex = new THREE.CanvasTexture(dsSignCanvas);
  const dsSign = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.4), new THREE.MeshBasicMaterial({ map: dsSignTex, transparent: true }));
  dsSign.position.set(0, 1.95, 0);
  diveShopGroup.add(dsSign);
  diveShopGroup.position.set(-22, 0.05, -10);
  diveShopGroup.rotation.y = 0.5;
  group.add(diveShopGroup);

  // --- v50: lifeguard tower, beach umbrella forest, floating buoy field ----
  // Lifeguard tower (corner of beach)
  const lifeguardTowerGroup = new THREE.Group();
  const lgPostMat = new THREE.MeshLambertMaterial({ color: 0xb8763a });
  const lgPostGeom = new THREE.BoxGeometry(0.18, 3.2, 0.18);
  const lgPost1 = new THREE.Mesh(lgPostGeom, lgPostMat); lgPost1.position.set(-0.9, 1.6, -0.9);
  const lgPost2 = new THREE.Mesh(lgPostGeom, lgPostMat); lgPost2.position.set(0.9, 1.6, -0.9);
  const lgPost3 = new THREE.Mesh(lgPostGeom, lgPostMat); lgPost3.position.set(-0.9, 1.6, 0.9);
  const lgPost4 = new THREE.Mesh(lgPostGeom, lgPostMat); lgPost4.position.set(0.9, 1.6, 0.9);
  lifeguardTowerGroup.add(lgPost1, lgPost2, lgPost3, lgPost4);
  const lgPlatformMat = new THREE.MeshLambertMaterial({ color: 0xd4a566 });
  const lgPlatform = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.16, 2.2), lgPlatformMat);
  lgPlatform.position.y = 2.4;
  lifeguardTowerGroup.add(lgPlatform);
  const lgWallMat = new THREE.MeshLambertMaterial({ color: 0xe65a3a });
  const lgBackWall = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 0.1), lgWallMat);
  lgBackWall.position.set(0, 3.2, -1.05);
  lifeguardTowerGroup.add(lgBackWall);
  const lgRoofMat = new THREE.MeshLambertMaterial({ color: 0xc4453a });
  const lgRoof = new THREE.Mesh(new THREE.ConeGeometry(1.7, 0.7, 4), lgRoofMat);
  lgRoof.position.set(0, 4.4, 0);
  lgRoof.rotation.y = Math.PI / 4;
  lifeguardTowerGroup.add(lgRoof);
  const lgRailingMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const lgRailing1 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 0.06), lgRailingMat);
  lgRailing1.position.set(0, 2.9, 1.05);
  lifeguardTowerGroup.add(lgRailing1);
  const lgLadderMat = new THREE.MeshLambertMaterial({ color: 0x8a5a2a });
  for (let i = 0; i < 5; i++) {
    const rung = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 0.06), lgLadderMat);
    rung.position.set(0, 0.4 + i * 0.4, 1.0);
    lifeguardTowerGroup.add(rung);
  }
  // Lifeguard figure on platform
  const lgGuardBody = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.7, 12), new THREE.MeshLambertMaterial({ color: 0xe65a3a }));
  lgGuardBody.position.set(0.5, 2.85, 0.3);
  lifeguardTowerGroup.add(lgGuardBody);
  const lgGuardHead = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), new THREE.MeshLambertMaterial({ color: 0xf2c79b }));
  lgGuardHead.position.set(0.5, 3.35, 0.3);
  lifeguardTowerGroup.add(lgGuardHead);
  const lgGuardHat = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 12), new THREE.MeshLambertMaterial({ color: 0xffd640 }));
  lgGuardHat.position.set(0.5, 3.5, 0.3);
  lifeguardTowerGroup.add(lgGuardHat);
  // Binoculars (held to face)
  const lgBinoc = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.08), new THREE.MeshLambertMaterial({ color: 0x222222 }));
  lgBinoc.position.set(0.5, 3.32, 0.5);
  lifeguardTowerGroup.add(lgBinoc);
  // "LIFEGUARD" sign on back wall
  const lgSignCanvas = document.createElement('canvas');
  lgSignCanvas.width = 256; lgSignCanvas.height = 64;
  const lgSignCtx = lgSignCanvas.getContext('2d');
  lgSignCtx.fillStyle = '#ffffff'; lgSignCtx.fillRect(0, 0, 256, 64);
  lgSignCtx.fillStyle = '#e65a3a'; lgSignCtx.font = 'bold 38px sans-serif';
  lgSignCtx.textAlign = 'center'; lgSignCtx.textBaseline = 'middle';
  lgSignCtx.fillText('LIFEGUARD', 128, 32);
  const lgSignTex = new THREE.CanvasTexture(lgSignCanvas);
  const lgSign = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.45), new THREE.MeshBasicMaterial({ map: lgSignTex, transparent: true }));
  lgSign.position.set(0, 3.4, -0.99);
  lgSign.rotation.y = Math.PI;
  lifeguardTowerGroup.add(lgSign);
  // Red flag on a small pole next to tower
  const lgFlagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 8), new THREE.MeshLambertMaterial({ color: 0xcccccc }));
  lgFlagPole.position.set(1.6, 1.3, 0);
  lifeguardTowerGroup.add(lgFlagPole);
  const lgFlag = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.45), new THREE.MeshLambertMaterial({ color: 0xe61e1e, side: THREE.DoubleSide }));
  lgFlag.position.set(1.95, 2.4, 0);
  lifeguardTowerGroup.add(lgFlag);
  lifeguardTowerGroup.position.set(14, 0.05, 14);
  lifeguardTowerGroup.rotation.y = -0.4;
  group.add(lifeguardTowerGroup);

  // Beach umbrella forest (cluster of 7 multi-color umbrellas + towels)
  const umbrellaForestGroup = new THREE.Group();
  const ufColors = [0xff4d4d, 0xffd640, 0x4dd9ff, 0x66e066, 0xff80c0, 0xff8a40, 0xa080ff];
  const ufPositions = [
    [0, 0, 0], [2.2, 0, 0.4], [-2.0, 0, 0.6],
    [1.0, 0, 2.2], [-1.4, 0, 2.4], [3.0, 0, 2.0], [-2.8, 0, -1.2]
  ];
  const ufPoleMat = new THREE.MeshLambertMaterial({ color: 0x9a7a4a });
  const ufTowelMat0 = new THREE.MeshLambertMaterial({ color: 0xfff0d0 });
  for (let u = 0; u < ufPositions.length; u++) {
    const p = ufPositions[u];
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 8), ufPoleMat);
    pole.position.set(p[0], 0.8, p[2]);
    umbrellaForestGroup.add(pole);
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.85, 0.4, 12, 1, true), new THREE.MeshLambertMaterial({ color: ufColors[u % ufColors.length], side: THREE.DoubleSide }));
    canopy.position.set(p[0], 1.7, p[2]);
    umbrellaForestGroup.add(canopy);
    // Towel under each umbrella in alternating colors
    const towelMat = new THREE.MeshLambertMaterial({ color: (u % 2 === 0) ? 0x4dd9ff : 0xffd640 });
    const towel = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.02, 0.55), towelMat);
    towel.position.set(p[0], 0.02, p[2] + 0.1);
    umbrellaForestGroup.add(towel);
  }
  umbrellaForestGroup.position.set(-16, 0.05, 18);
  group.add(umbrellaForestGroup);

  // Floating buoy field (8 buoys offshore in a loose grid, with bobbing motion)
  const buoyFieldGroup = new THREE.Group();
  const bfBuoyColors = [0xff3030, 0xffd640, 0x30c0ff, 0xff8a40];
  const bfBuoys = [];
  for (let i = 0; i < 8; i++) {
    const bf = new THREE.Group();
    const ang = (i / 8) * Math.PI * 2;
    const r = 4 + (i % 3) * 1.2;
    const bx = Math.cos(ang) * r;
    const bz = Math.sin(ang) * r;
    const bfBuoy = new THREE.Mesh(new THREE.SphereGeometry(0.45, 14, 12), new THREE.MeshLambertMaterial({ color: bfBuoyColors[i % bfBuoyColors.length] }));
    bfBuoy.position.y = 0.45;
    bf.add(bfBuoy);
    const bfRing = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.06, 8, 16), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    bfRing.position.y = 0.45;
    bfRing.rotation.x = Math.PI / 2;
    bf.add(bfRing);
    const bfFlag = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 6), new THREE.MeshLambertMaterial({ color: 0xcccccc }));
    bfFlag.position.y = 0.85;
    bf.add(bfFlag);
    const bfFlagCloth = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.18), new THREE.MeshLambertMaterial({ color: bfBuoyColors[(i+1) % bfBuoyColors.length], side: THREE.DoubleSide }));
    bfFlagCloth.position.set(0.18, 1.05, 0);
    bf.add(bfFlagCloth);
    bf.position.set(bx, 0, bz);
    bfBuoys.push(bf);
    buoyFieldGroup.add(bf);
  }
  buoyFieldGroup.position.set(28, 0, -22);
  group.add(buoyFieldGroup);

  // --- v51: surf instructor + students, fishing-pier kid, passenger ferry --
  // Surf instructor with 3 student trainees standing on a beached longboard
  const surfLessonGroup = new THREE.Group();
  const slBoardMat = new THREE.MeshLambertMaterial({ color: 0xfff5d8 });
  const slBoard = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.1, 0.7), slBoardMat);
  slBoard.position.y = 0.05;
  surfLessonGroup.add(slBoard);
  const slStripeMat = new THREE.MeshLambertMaterial({ color: 0x3088c4 });
  const slStripe = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.005, 0.06), slStripeMat);
  slStripe.position.set(0, 0.105, 0.2);
  surfLessonGroup.add(slStripe);
  const slFin = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 4), new THREE.MeshLambertMaterial({ color: 0x222222 }));
  slFin.position.set(-1.4, -0.05, 0);
  surfLessonGroup.add(slFin);
  // Instructor (taller, red rashguard)
  const slInsBody = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.85, 12), new THREE.MeshLambertMaterial({ color: 0xd83040 }));
  slInsBody.position.set(0.9, 0.55, 0);
  surfLessonGroup.add(slInsBody);
  const slInsHead = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), new THREE.MeshLambertMaterial({ color: 0xeab098 }));
  slInsHead.position.set(0.9, 1.1, 0);
  surfLessonGroup.add(slInsHead);
  const slInsHat = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 16), new THREE.MeshLambertMaterial({ color: 0x222222 }));
  slInsHat.position.set(0.9, 1.27, 0);
  surfLessonGroup.add(slInsHat);
  // 3 students of various colors
  const slStudentColors = [0x40c8e0, 0xffc830, 0x66e078];
  const slStudentBodies = [];
  for (let s = 0; s < 3; s++) {
    const sx = -0.6 - s * 0.5;
    const sBody = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.65, 10), new THREE.MeshLambertMaterial({ color: slStudentColors[s] }));
    sBody.position.set(sx, 0.4, 0);
    surfLessonGroup.add(sBody);
    slStudentBodies.push(sBody);
    const sHead = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), new THREE.MeshLambertMaterial({ color: 0xf2c79b }));
    sHead.position.set(sx, 0.85, 0);
    surfLessonGroup.add(sHead);
  }
  surfLessonGroup.position.set(20, 0.05, 22);
  surfLessonGroup.rotation.y = -0.6;
  group.add(surfLessonGroup);

  // Fishing pier kid (small kid sitting on pier edge with rod and line)
  const pierKidGroup = new THREE.Group();
  const pkMat = new THREE.MeshLambertMaterial({ color: 0x8a5a2a });
  const pkPlanks = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.7), pkMat);
  pkPlanks.position.y = 0.4;
  pierKidGroup.add(pkPlanks);
  const pkSupport1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 8), pkMat);
  pkSupport1.position.set(-0.7, 0.2, -0.3);
  pierKidGroup.add(pkSupport1);
  const pkSupport2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 8), pkMat);
  pkSupport2.position.set(0.7, 0.2, -0.3);
  pierKidGroup.add(pkSupport2);
  // Kid (sitting, legs dangling)
  const pkKidBody = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.4, 10), new THREE.MeshLambertMaterial({ color: 0x40b4d0 }));
  pkKidBody.position.set(0, 0.65, 0.1);
  pierKidGroup.add(pkKidBody);
  const pkKidHead = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), new THREE.MeshLambertMaterial({ color: 0xf3c9a0 }));
  pkKidHead.position.set(0, 0.95, 0.1);
  pierKidGroup.add(pkKidHead);
  const pkKidHat = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.12, 14), new THREE.MeshLambertMaterial({ color: 0xe85a3a }));
  pkKidHat.position.set(0, 1.12, 0.1);
  pierKidGroup.add(pkKidHat);
  // Fishing rod (angled out over water)
  const pkRod = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.012, 1.4, 6), new THREE.MeshLambertMaterial({ color: 0x222222 }));
  pkRod.position.set(0.55, 0.95, 0.5);
  pkRod.rotation.z = -Math.PI / 4;
  pkRod.rotation.x = -0.3;
  pierKidGroup.add(pkRod);
  // Fishing line (thin from rod tip to water)
  const pkLineGeom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(1.0, 1.45, 0.95),
    new THREE.Vector3(1.05, 0.0, 1.05),
  ]);
  const pkLine = new THREE.Line(pkLineGeom, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }));
  pierKidGroup.add(pkLine);
  // Bobber on water
  const pkBobber = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), new THREE.MeshLambertMaterial({ color: 0xff3030 }));
  pkBobber.position.set(1.05, 0.05, 1.05);
  pierKidGroup.add(pkBobber);
  // Tackle box on plank
  const pkTackle = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.18), new THREE.MeshLambertMaterial({ color: 0x305030 }));
  pkTackle.position.set(-0.5, 0.51, 0.0);
  pierKidGroup.add(pkTackle);
  pierKidGroup.position.set(-26, 0.05, 4);
  pierKidGroup.rotation.y = 0.3;
  group.add(pierKidGroup);

  // Passenger ferry boat (medium-large, 2-deck, with passenger silhouettes)
  const ferryGroup = new THREE.Group();
  const fryHullMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const fryHull = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.8, 1.8), fryHullMat);
  fryHull.position.y = 0.5;
  ferryGroup.add(fryHull);
  const fryStripeMat = new THREE.MeshLambertMaterial({ color: 0x1e6ab8 });
  const fryStripe = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.2, 1.85), fryStripeMat);
  fryStripe.position.y = 0.18;
  ferryGroup.add(fryStripe);
  // Bow taper (cone-ish wedge)
  const fryBow = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.0, 4), fryHullMat);
  fryBow.position.set(3.5, 0.5, 0);
  fryBow.rotation.z = -Math.PI / 2;
  fryBow.rotation.y = Math.PI / 4;
  fryBow.scale.set(1, 1.0, 1);
  ferryGroup.add(fryBow);
  // Lower deck cabin
  const fryCabinMat = new THREE.MeshLambertMaterial({ color: 0xf4f4f4 });
  const fryCabin = new THREE.Mesh(new THREE.BoxGeometry(5.5, 1.0, 1.5), fryCabinMat);
  fryCabin.position.set(-0.3, 1.4, 0);
  ferryGroup.add(fryCabin);
  // Window strip
  const fryWindowMat = new THREE.MeshLambertMaterial({ color: 0x88c8e0 });
  const fryWindows = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.4, 1.55), fryWindowMat);
  fryWindows.position.set(-0.3, 1.45, 0);
  ferryGroup.add(fryWindows);
  // Upper deck (open with rail)
  const fryUpperDeck = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.08, 1.4), fryHullMat);
  fryUpperDeck.position.set(-0.3, 1.95, 0);
  ferryGroup.add(fryUpperDeck);
  const fryRailMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
  const fryRail1 = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.04, 0.04), fryRailMat);
  fryRail1.position.set(-0.3, 2.4, 0.7);
  ferryGroup.add(fryRail1);
  const fryRail2 = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.04, 0.04), fryRailMat);
  fryRail2.position.set(-0.3, 2.4, -0.7);
  ferryGroup.add(fryRail2);
  // Smokestack
  const fryStackMat = new THREE.MeshLambertMaterial({ color: 0xc4453a });
  const fryStack = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.0, 12), fryStackMat);
  fryStack.position.set(-1.6, 2.5, 0);
  ferryGroup.add(fryStack);
  const fryStackTop = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.1, 12), new THREE.MeshLambertMaterial({ color: 0x222222 }));
  fryStackTop.position.set(-1.6, 3.05, 0);
  ferryGroup.add(fryStackTop);
  // Pilothouse
  const fryPilot = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.6, 1.1), fryCabinMat);
  fryPilot.position.set(1.4, 2.3, 0);
  ferryGroup.add(fryPilot);
  const fryPilotWin = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.3, 1.15), fryWindowMat);
  fryPilotWin.position.set(1.4, 2.4, 0);
  ferryGroup.add(fryPilotWin);
  // Passengers on upper deck (silhouettes)
  const fryPassengerColors = [0x4080d0, 0xe0a040, 0xa040d0, 0x40c060, 0xd04060, 0xe0c040];
  const fryPassengers = [];
  for (let p = 0; p < 6; p++) {
    const px = -2.0 + p * 0.7;
    const pBody = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.4, 8), new THREE.MeshLambertMaterial({ color: fryPassengerColors[p] }));
    pBody.position.set(px, 2.2, (p % 2 === 0 ? 0.45 : -0.45));
    ferryGroup.add(pBody);
    fryPassengers.push(pBody);
    const pHead = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), new THREE.MeshLambertMaterial({ color: 0xf2c79b }));
    pHead.position.set(px, 2.5, (p % 2 === 0 ? 0.45 : -0.45));
    ferryGroup.add(pHead);
  }
  // Wake (white triangle behind)
  const fryWakeMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
  const fryWake = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.4), fryWakeMat);
  fryWake.rotation.x = -Math.PI / 2;
  fryWake.position.set(-4.5, 0.06, 0);
  ferryGroup.add(fryWake);
  // FERRY sign on hull
  const fryNameCanvas = document.createElement('canvas');
  fryNameCanvas.width = 256; fryNameCanvas.height = 64;
  const fryNameCtx = fryNameCanvas.getContext('2d');
  fryNameCtx.fillStyle = '#ffffff'; fryNameCtx.fillRect(0, 0, 256, 64);
  fryNameCtx.fillStyle = '#1e6ab8'; fryNameCtx.font = 'bold 36px sans-serif';
  fryNameCtx.textAlign = 'center'; fryNameCtx.textBaseline = 'middle';
  fryNameCtx.fillText('M/V ANCHORAGE', 128, 32);
  const fryNameTex = new THREE.CanvasTexture(fryNameCanvas);
  const fryName = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.5), new THREE.MeshBasicMaterial({ map: fryNameTex, transparent: true }));
  fryName.position.set(0.6, 0.5, 0.93);
  ferryGroup.add(fryName);
  ferryGroup.position.set(-30, 0.05, -28);
  ferryGroup.rotation.y = 0.2;
  group.add(ferryGroup);

  // --- v52: cargo container stack with mini-crane, pier heron, beach checkers
  // Cargo container stack with a small portal crane lowering one container
  const cargoStackGroup = new THREE.Group();
  const csContainerColors = [0xc4453a, 0xe69a30, 0x3088c4, 0x2a7a3a, 0xc480c4, 0x3a3a3a];
  const csContainerGeom = new THREE.BoxGeometry(2.2, 1.0, 1.0);
  // Stack of 4 containers (2x2 with one offset)
  const csStackPositions = [
    [-1.2, 0.5, 0], [1.2, 0.5, 0], [-1.2, 1.5, 0], [1.2, 1.5, 0]
  ];
  for (let i = 0; i < csStackPositions.length; i++) {
    const c = new THREE.Mesh(csContainerGeom, new THREE.MeshLambertMaterial({ color: csContainerColors[i % csContainerColors.length] }));
    c.position.set(...csStackPositions[i]);
    cargoStackGroup.add(c);
    // Door lines (small dark stripe at one end)
    const doorMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.94, 0.94), doorMat);
    door.position.set(csStackPositions[i][0] + 1.12, csStackPositions[i][1], csStackPositions[i][2]);
    cargoStackGroup.add(door);
  }
  // Mini portal crane (red beam structure)
  const csCraneMat = new THREE.MeshLambertMaterial({ color: 0xc4453a });
  const csLeg1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 5.0, 0.18), csCraneMat);
  csLeg1.position.set(-2.6, 2.5, 0);
  cargoStackGroup.add(csLeg1);
  const csLeg2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 5.0, 0.18), csCraneMat);
  csLeg2.position.set(2.6, 2.5, 0);
  cargoStackGroup.add(csLeg2);
  const csCrossbeam = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.18, 0.18), csCraneMat);
  csCrossbeam.position.set(0, 4.9, 0);
  cargoStackGroup.add(csCrossbeam);
  // Trolley on crossbeam (slides side to side)
  const csTrolley = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.4), new THREE.MeshLambertMaterial({ color: 0xffd640 }));
  csTrolley.position.set(0.5, 4.7, 0);
  cargoStackGroup.add(csTrolley);
  // Hanging container on cable
  const csHangCableMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
  const csHangCable = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.6, 6), csHangCableMat);
  csHangCable.position.set(0.5, 3.85, 0);
  cargoStackGroup.add(csHangCable);
  const csHangContainer = new THREE.Mesh(csContainerGeom, new THREE.MeshLambertMaterial({ color: 0x40c0a0 }));
  csHangContainer.position.set(0.5, 3.0, 0);
  cargoStackGroup.add(csHangContainer);
  cargoStackGroup.position.set(-26, 0.05, -18);
  cargoStackGroup.rotation.y = 0.4;
  group.add(cargoStackGroup);

  // Pier heron — slim heron standing on a piling, occasionally pecking at water
  const pierHeronGroup = new THREE.Group();
  const phPilingMat = new THREE.MeshLambertMaterial({ color: 0x6a4a2a });
  const phPiling = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.6, 12), phPilingMat);
  phPiling.position.y = 0.8;
  pierHeronGroup.add(phPiling);
  const phPilingTop = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 12), new THREE.MeshLambertMaterial({ color: 0x4a3220 }));
  phPilingTop.position.y = 1.63;
  pierHeronGroup.add(phPilingTop);
  // Heron body (gray-blue)
  const phBodyMat = new THREE.MeshLambertMaterial({ color: 0x9aa8b8 });
  const phBody = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), phBodyMat);
  phBody.scale.set(1.0, 0.7, 1.4);
  phBody.position.y = 1.85;
  pierHeronGroup.add(phBody);
  // Long curved neck (cylinder)
  const phNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.7, 8), phBodyMat);
  phNeck.position.set(0.18, 2.15, 0);
  phNeck.rotation.z = -0.5;
  pierHeronGroup.add(phNeck);
  // Head
  const phHead = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), phBodyMat);
  phHead.position.set(0.42, 2.4, 0);
  pierHeronGroup.add(phHead);
  // Long beak (yellow)
  const phBeak = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.3, 8), new THREE.MeshLambertMaterial({ color: 0xffd340 }));
  phBeak.position.set(0.6, 2.4, 0);
  phBeak.rotation.z = -Math.PI / 2;
  pierHeronGroup.add(phBeak);
  // Legs (thin sticks)
  const phLegMat = new THREE.MeshLambertMaterial({ color: 0xffe080 });
  const phLeg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 6), phLegMat);
  phLeg1.position.set(-0.04, 1.7, 0.06);
  pierHeronGroup.add(phLeg1);
  const phLeg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 6), phLegMat);
  phLeg2.position.set(0.04, 1.7, -0.06);
  pierHeronGroup.add(phLeg2);
  pierHeronGroup.position.set(20, 0.05, -16);
  group.add(pierHeronGroup);

  // Beach checkers game — small wooden table with checkerboard, 2 players
  const beachCheckersGroup = new THREE.Group();
  const bcTableMat = new THREE.MeshLambertMaterial({ color: 0x8a5a2a });
  const bcTableTop = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 1.2), bcTableMat);
  bcTableTop.position.y = 0.5;
  beachCheckersGroup.add(bcTableTop);
  const bcLegGeom = new THREE.BoxGeometry(0.06, 0.5, 0.06);
  const bcLegPositions = [[-0.5, 0.25, -0.5], [0.5, 0.25, -0.5], [-0.5, 0.25, 0.5], [0.5, 0.25, 0.5]];
  for (let i = 0; i < bcLegPositions.length; i++) {
    const leg = new THREE.Mesh(bcLegGeom, bcTableMat);
    leg.position.set(...bcLegPositions[i]);
    beachCheckersGroup.add(leg);
  }
  // Checkerboard (black-white squares as canvas)
  const bcBoardCanvas = document.createElement('canvas');
  bcBoardCanvas.width = 256; bcBoardCanvas.height = 256;
  const bcBoardCtx = bcBoardCanvas.getContext('2d');
  for (let by = 0; by < 8; by++) {
    for (let bx = 0; bx < 8; bx++) {
      bcBoardCtx.fillStyle = ((bx + by) % 2 === 0) ? '#f5f0c8' : '#3a2a1a';
      bcBoardCtx.fillRect(bx * 32, by * 32, 32, 32);
    }
  }
  const bcBoardTex = new THREE.CanvasTexture(bcBoardCanvas);
  const bcBoard = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), new THREE.MeshBasicMaterial({ map: bcBoardTex }));
  bcBoard.position.set(0, 0.535, 0);
  bcBoard.rotation.x = -Math.PI / 2;
  beachCheckersGroup.add(bcBoard);
  // Checker pieces (red and black)
  const bcRedMat = new THREE.MeshLambertMaterial({ color: 0xc4453a });
  const bcBlackMat = new THREE.MeshLambertMaterial({ color: 0x202020 });
  const bcPieceGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.025, 12);
  const bcPiecePositions = [
    [-0.30, 0.55, -0.30, 'r'], [-0.18, 0.55, -0.30, 'r'], [-0.06, 0.55, -0.30, 'r'],
    [0.06, 0.55, 0.30, 'b'], [0.18, 0.55, 0.30, 'b'], [0.30, 0.55, 0.30, 'b']
  ];
  for (let i = 0; i < bcPiecePositions.length; i++) {
    const pp = bcPiecePositions[i];
    const piece = new THREE.Mesh(bcPieceGeom, pp[3] === 'r' ? bcRedMat : bcBlackMat);
    piece.position.set(pp[0], pp[1], pp[2]);
    beachCheckersGroup.add(piece);
  }
  // Two players (one each side)
  const bcPlayer1Body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.6, 10), new THREE.MeshLambertMaterial({ color: 0x3088c4 }));
  bcPlayer1Body.position.set(0, 0.85, -1.0);
  beachCheckersGroup.add(bcPlayer1Body);
  const bcPlayer1Head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), new THREE.MeshLambertMaterial({ color: 0xeab098 }));
  bcPlayer1Head.position.set(0, 1.27, -1.0);
  beachCheckersGroup.add(bcPlayer1Head);
  const bcPlayer2Body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.6, 10), new THREE.MeshLambertMaterial({ color: 0xe69a30 }));
  bcPlayer2Body.position.set(0, 0.85, 1.0);
  beachCheckersGroup.add(bcPlayer2Body);
  const bcPlayer2Head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), new THREE.MeshLambertMaterial({ color: 0xf2c79b }));
  bcPlayer2Head.position.set(0, 1.27, 1.0);
  beachCheckersGroup.add(bcPlayer2Head);
  beachCheckersGroup.position.set(-12, 0.05, 22);
  beachCheckersGroup.rotation.y = 0.5;
  group.add(beachCheckersGroup);


  // --- v53: beach BBQ grill, snorkeler pair, beach photographer
  // Beach BBQ grill with grill master
  const bbqGroup = new THREE.Group();
  const bgGrillMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
  const bgGrillBody = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16), bgGrillMat);
  bgGrillBody.position.set(0, 0.85, 0);
  bbqGroup.add(bgGrillBody);
  const bgGrillLid = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), bgGrillMat);
  bgGrillLid.position.set(0, 1.05, 0);
  bgGrillLid.rotation.x = -0.3;
  bbqGroup.add(bgGrillLid);
  const bgLegMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
  for (let i = 0; i < 3; i++) {
    const ang = (i / 3) * Math.PI * 2;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.85, 6), bgLegMat);
    leg.position.set(Math.cos(ang) * 0.4, 0.42, Math.sin(ang) * 0.4);
    bbqGroup.add(leg);
  }
  // Coal glow inside grill
  const bgCoalMat = new THREE.MeshBasicMaterial({ color: 0xff6020 });
  const bgCoal = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.05, 16), bgCoalMat);
  bgCoal.position.set(0, 1.06, 0);
  bbqGroup.add(bgCoal);
  // Smoke (3 small white spheres)
  const bgSmokeMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee, transparent: true, opacity: 0.6 });
  const bgSmokes = [];
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.12 + i * 0.04, 8, 8), bgSmokeMat);
    s.position.set(0, 1.6 + i * 0.4, 0);
    bbqGroup.add(s);
    bgSmokes.push(s);
  }
  // Grill master
  const bgChefBody = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.7, 8), new THREE.MeshLambertMaterial({ color: 0xffffff }));
  bgChefBody.position.set(0.9, 0.35, 0);
  bbqGroup.add(bgChefBody);
  const bgChefHead = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 12), new THREE.MeshLambertMaterial({ color: 0xf2c294 }));
  bgChefHead.position.set(0.9, 0.85, 0);
  bbqGroup.add(bgChefHead);
  const bgChefHat = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.18, 12), new THREE.MeshLambertMaterial({ color: 0xffffff }));
  bgChefHat.position.set(0.9, 1.05, 0);
  bbqGroup.add(bgChefHat);
  const bgTongs = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6), bgGrillMat);
  bgTongs.position.set(0.5, 0.95, 0);
  bgTongs.rotation.z = 0.7;
  bbqGroup.add(bgTongs);
  // Picnic table
  const bgTableMat = new THREE.MeshLambertMaterial({ color: 0xa0703a });
  const bgTableTop = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.7), bgTableMat);
  bgTableTop.position.set(-1.3, 0.7, 0);
  bbqGroup.add(bgTableTop);
  for (let i = 0; i < 4; i++) {
    const lx = -1.3 + (i % 2 === 0 ? -0.7 : 0.7);
    const lz = (i < 2 ? -0.3 : 0.3);
    const tleg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.7, 0.06), bgTableMat);
    tleg.position.set(lx, 0.35, lz);
    bbqGroup.add(tleg);
  }
  // Plate of food on table
  const bgPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.02, 16), new THREE.MeshLambertMaterial({ color: 0xffffff }));
  bgPlate.position.set(-1.3, 0.74, 0);
  bbqGroup.add(bgPlate);
  const bgBurger = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshLambertMaterial({ color: 0x8a3a1a }));
  bgBurger.position.set(-1.3, 0.78, 0);
  bgBurger.scale.y = 0.5;
  bbqGroup.add(bgBurger);
  bbqGroup.position.set(28, 0.05, 14);
  bbqGroup.rotation.y = -0.6;
  group.add(bbqGroup);

  // Snorkeler pair in shallows
  const snorkelerGroup = new THREE.Group();
  const snBodyMat = new THREE.MeshLambertMaterial({ color: 0x2a85d8 });
  const snFinMat = new THREE.MeshLambertMaterial({ color: 0xffd040 });
  const snMaskMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
  const snTubeMat = new THREE.MeshLambertMaterial({ color: 0xff5050 });
  const snorkelers = [];
  const snColors = [0x2a85d8, 0xc04040];
  for (let i = 0; i < 2; i++) {
    const sn = new THREE.Group();
    // Body (lying flat)
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 1.0, 8), new THREE.MeshLambertMaterial({ color: snColors[i] }));
    body.rotation.z = Math.PI / 2;
    body.position.set(0, 0.05, 0);
    sn.add(body);
    // Head (face down)
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 12), new THREE.MeshLambertMaterial({ color: 0xf2c294 }));
    head.position.set(0.55, 0.05, 0);
    sn.add(head);
    // Snorkel tube
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.3, 6), snTubeMat);
    tube.position.set(0.6, 0.22, 0.07);
    sn.add(tube);
    // Mask (visor strap visual)
    const mask = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.18), snMaskMat);
    mask.position.set(0.6, 0.05, 0.05);
    sn.add(mask);
    // Yellow fins
    const fin1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.22), snFinMat);
    fin1.position.set(-0.6, 0.04, 0.1);
    sn.add(fin1);
    const fin2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.22), snFinMat);
    fin2.position.set(-0.6, 0.04, -0.1);
    sn.add(fin2);
    sn.position.set(i === 0 ? 0 : 1.2, 0, i === 0 ? 0 : 0.4);
    sn.rotation.y = i === 0 ? 0.2 : -0.3;
    snorkelerGroup.add(sn);
    snorkelers.push(sn);
  }
  // Bubbles around snorkelers
  const snBubbleMat = new THREE.MeshLambertMaterial({ color: 0xddffff, transparent: true, opacity: 0.6 });
  const snBubbles = [];
  for (let i = 0; i < 4; i++) {
    const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), snBubbleMat);
    bubble.position.set(0.6 + Math.random() * 0.5, 0.18, -0.1 + i * 0.1);
    snorkelerGroup.add(bubble);
    snBubbles.push(bubble);
  }
  snorkelerGroup.position.set(32, 0.05, -8);
  snorkelerGroup.rotation.y = 0.3;
  group.add(snorkelerGroup);

  // Beach photographer with tripod
  const photoGroup = new THREE.Group();
  const phgrTripodMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
  for (let i = 0; i < 3; i++) {
    const ang = (i / 3) * Math.PI * 2;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.4, 6), phgrTripodMat);
    leg.position.set(Math.cos(ang) * 0.18, 0.7, Math.sin(ang) * 0.18);
    leg.rotation.x = Math.sin(ang) * 0.18;
    leg.rotation.z = -Math.cos(ang) * 0.18;
    photoGroup.add(leg);
  }
  // Camera body
  const phgrCamMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const phgrCamera = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 0.25), phgrCamMat);
  phgrCamera.position.set(0, 1.45, 0);
  photoGroup.add(phgrCamera);
  // Lens
  const phgrLens = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.25, 16), phgrCamMat);
  phgrLens.rotation.z = Math.PI / 2;
  phgrLens.position.set(0.22, 1.45, 0);
  photoGroup.add(phgrLens);
  // Lens glass (highlight)
  const phgrGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 16), new THREE.MeshLambertMaterial({ color: 0x4080a0 }));
  phgrGlass.rotation.z = Math.PI / 2;
  phgrGlass.position.set(0.35, 1.45, 0);
  photoGroup.add(phgrGlass);
  // Photographer body
  const phgrBody = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.8, 8), new THREE.MeshLambertMaterial({ color: 0xa04040 }));
  phgrBody.position.set(-0.4, 0.4, 0);
  photoGroup.add(phgrBody);
  const phgrHead = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 12), new THREE.MeshLambertMaterial({ color: 0xf2c294 }));
  phgrHead.position.set(-0.4, 0.95, 0);
  photoGroup.add(phgrHead);
  // Hat (sun hat)
  const phgrHat = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 16), new THREE.MeshLambertMaterial({ color: 0xc0a060 }));
  phgrHat.position.set(-0.4, 1.1, 0);
  photoGroup.add(phgrHat);
  // Camera strap
  const phgrStrap = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.015, 6, 16), phgrCamMat);
  phgrStrap.position.set(-0.2, 1.2, 0);
  phgrStrap.rotation.y = 0.5;
  photoGroup.add(phgrStrap);
  // Subject (a smiling beachgoer pose)
  const phgrSubBody = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.8, 8), new THREE.MeshLambertMaterial({ color: 0xff6080 }));
  phgrSubBody.position.set(2.5, 0.4, 0);
  photoGroup.add(phgrSubBody);
  const phgrSubHead = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 12), new THREE.MeshLambertMaterial({ color: 0xf2c294 }));
  phgrSubHead.position.set(2.5, 0.95, 0);
  photoGroup.add(phgrSubHead);
  // Subject's raised arm waving
  const phgrSubArm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 6), new THREE.MeshLambertMaterial({ color: 0xf2c294 }));
  phgrSubArm.position.set(2.7, 1.05, 0);
  phgrSubArm.rotation.z = 0.6;
  photoGroup.add(phgrSubArm);
  // Flash element on top of camera
  const phgrFlash = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.08), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  phgrFlash.position.set(0, 1.6, 0);
  photoGroup.add(phgrFlash);
  photoGroup.position.set(-30, 0.05, -4);
  photoGroup.rotation.y = 0.5;
  group.add(photoGroup);


  // --- v54: anchored sailboat, beach kite flyer, dome tent camper
  // Anchored sailboat
  const sailGroup = new THREE.Group();
  const sailHullMat = new THREE.MeshLambertMaterial({ color: 0xf0f0f0 });
  const sailHull = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.35, 3.0, 16), sailHullMat);
  sailHull.rotation.z = Math.PI / 2;
  sailHull.position.set(0, 0.4, 0);
  sailGroup.add(sailHull);
  // Hull stripe (blue)
  const sailHullStripe = new THREE.Mesh(new THREE.CylinderGeometry(0.51, 0.36, 0.15, 16), new THREE.MeshLambertMaterial({ color: 0x1860c0 }));
  sailHullStripe.rotation.z = Math.PI / 2;
  sailHullStripe.position.set(0, 0.55, 0);
  sailGroup.add(sailHullStripe);
  // Cabin
  const sailCabin = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 0.8), new THREE.MeshLambertMaterial({ color: 0xe8e8e8 }));
  sailCabin.position.set(0.3, 0.85, 0);
  sailGroup.add(sailCabin);
  // Mast
  const sailMastMat = new THREE.MeshLambertMaterial({ color: 0xa0a0a0 });
  const sailMast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.5, 8), sailMastMat);
  sailMast.position.set(-0.2, 2.55, 0);
  sailGroup.add(sailMast);
  // Boom
  const sailBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 8), sailMastMat);
  sailBoom.rotation.z = Math.PI / 2;
  sailBoom.position.set(-0.9, 1.0, 0);
  sailGroup.add(sailBoom);
  // Mainsail (triangle)
  const sailMainGeom = new THREE.BufferGeometry();
  sailMainGeom.setAttribute('position', new THREE.Float32BufferAttribute([
    -0.2, 1.0, 0,    -0.2, 4.2, 0,    -1.7, 1.0, 0
  ], 3));
  sailMainGeom.setIndex([0, 1, 2, 0, 2, 1]);
  sailMainGeom.computeVertexNormals();
  const sailMainMat = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  const sailMain = new THREE.Mesh(sailMainGeom, sailMainMat);
  sailGroup.add(sailMain);
  // Jib (front sail)
  const sailJibGeom = new THREE.BufferGeometry();
  sailJibGeom.setAttribute('position', new THREE.Float32BufferAttribute([
    -0.2, 1.4, 0,    -0.2, 3.8, 0,    1.2, 0.9, 0
  ], 3));
  sailJibGeom.setIndex([0, 1, 2, 0, 2, 1]);
  sailJibGeom.computeVertexNormals();
  const sailJib = new THREE.Mesh(sailJibGeom, new THREE.MeshLambertMaterial({ color: 0xffe4e0, side: THREE.DoubleSide }));
  sailGroup.add(sailJib);
  // Anchor line going down to water
  const sailAnchorLine = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.4, 6), new THREE.MeshLambertMaterial({ color: 0x444444 }));
  sailAnchorLine.position.set(1.4, -0.2, 0);
  sailAnchorLine.rotation.z = -0.3;
  sailGroup.add(sailAnchorLine);
  // Boat name
  sailGroup.position.set(38, 0, 22);
  sailGroup.rotation.y = -0.4;
  group.add(sailGroup);

  // Beach kite flyer
  const beachKiteGroup = new THREE.Group();
  // Flyer (kid)
  const kfBody = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.5, 8), new THREE.MeshLambertMaterial({ color: 0xff6020 }));
  kfBody.position.set(0, 0.25, 0);
  beachKiteGroup.add(kfBody);
  const kfHead = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), new THREE.MeshLambertMaterial({ color: 0xf2c294 }));
  kfHead.position.set(0, 0.6, 0);
  beachKiteGroup.add(kfHead);
  const kfArm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6), new THREE.MeshLambertMaterial({ color: 0xf2c294 }));
  kfArm.position.set(0.2, 0.55, 0);
  kfArm.rotation.z = -0.8;
  beachKiteGroup.add(kfArm);
  // Kite (diamond)
  const bkShape = new THREE.Shape();
  bkShape.moveTo(0, 0.6);
  bkShape.lineTo(0.45, 0);
  bkShape.lineTo(0, -0.6);
  bkShape.lineTo(-0.45, 0);
  bkShape.closePath();
  const bkGeom = new THREE.ShapeGeometry(bkShape);
  const kKite = new THREE.Mesh(bkGeom, new THREE.MeshLambertMaterial({ color: 0xff2050, side: THREE.DoubleSide }));
  kKite.position.set(2.5, 4.0, 0);
  kKite.rotation.y = 0.3;
  beachKiteGroup.add(kKite);
  // Kite cross stripe
  const kKiteStripe = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.06), new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
  kKiteStripe.position.set(2.5, 4.0, 0.01);
  kKiteStripe.rotation.y = 0.3;
  beachKiteGroup.add(kKiteStripe);
  // Kite tail (3 small bows)
  const kTailMat = new THREE.MeshLambertMaterial({ color: 0x40c0ff, side: THREE.DoubleSide });
  const kTails = [];
  for (let i = 0; i < 4; i++) {
    const bow = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.05), kTailMat);
    bow.position.set(2.5, 3.4 - i * 0.18, 0);
    beachKiteGroup.add(bow);
    kTails.push(bow);
  }
  // Kite string
  const kStringPts = [];
  for (let i = 0; i <= 12; i++) {
    const f = i / 12;
    kStringPts.push(new THREE.Vector3(0.3 + f * 2.2, 0.7 + f * 3.3 - 0.2 * Math.sin(f * Math.PI), 0));
  }
  const kStringGeom = new THREE.BufferGeometry().setFromPoints(kStringPts);
  const kString = new THREE.Line(kStringGeom, new THREE.LineBasicMaterial({ color: 0xffffff }));
  beachKiteGroup.add(kString);
  beachKiteGroup.position.set(-22, 0.05, 18);
  beachKiteGroup.rotation.y = -0.3;
  group.add(beachKiteGroup);

  // Dome tent camper
  const tentGroup = new THREE.Group();
  const dtTentMat = new THREE.MeshLambertMaterial({ color: 0xc04040 });
  const dtTent = new THREE.Mesh(new THREE.SphereGeometry(1.0, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), dtTentMat);
  dtTent.position.set(0, 0, 0);
  tentGroup.add(dtTent);
  // Tent door (dark slit)
  const dtDoor = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.7), new THREE.MeshLambertMaterial({ color: 0x111111, side: THREE.DoubleSide }));
  dtDoor.position.set(0, 0.35, 0.96);
  tentGroup.add(dtDoor);
  // Tent rainfly stripe
  const dtStripe = new THREE.Mesh(new THREE.SphereGeometry(1.01, 16, 4, 0, Math.PI * 2, Math.PI / 4, Math.PI / 12), new THREE.MeshLambertMaterial({ color: 0xffd040 }));
  tentGroup.add(dtStripe);
  // Camp chair (folding)
  const dtChairMat = new THREE.MeshLambertMaterial({ color: 0x2080d8 });
  const dtChairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.5), dtChairMat);
  dtChairSeat.position.set(2.0, 0.4, 0);
  tentGroup.add(dtChairSeat);
  const dtChairBack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.05), dtChairMat);
  dtChairBack.position.set(2.0, 0.7, -0.22);
  tentGroup.add(dtChairBack);
  const dtChairLegMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
  for (let i = 0; i < 4; i++) {
    const lx = 2.0 + (i % 2 === 0 ? -0.22 : 0.22);
    const lz = (i < 2 ? -0.22 : 0.22);
    const cleg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6), dtChairLegMat);
    cleg.position.set(lx, 0.2, lz);
    tentGroup.add(cleg);
  }
  // Camper sitting in chair
  const dtCamperBody = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.5, 8), new THREE.MeshLambertMaterial({ color: 0x40a050 }));
  dtCamperBody.position.set(2.0, 0.7, 0);
  tentGroup.add(dtCamperBody);
  const dtCamperHead = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 12), new THREE.MeshLambertMaterial({ color: 0xf2c294 }));
  dtCamperHead.position.set(2.0, 1.05, 0);
  tentGroup.add(dtCamperHead);
  // Cooler beside chair
  const dtCooler = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.35), new THREE.MeshLambertMaterial({ color: 0xe04040 }));
  dtCooler.position.set(2.7, 0.2, 0.1);
  tentGroup.add(dtCooler);
  const dtCoolerLid = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.35), new THREE.MeshLambertMaterial({ color: 0xffffff }));
  dtCoolerLid.position.set(2.7, 0.43, 0.1);
  tentGroup.add(dtCoolerLid);
  // Lantern on small box
  const dtLanternMat = new THREE.MeshBasicMaterial({ color: 0xffeb80 });
  const dtLantern = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.18, 8), dtLanternMat);
  dtLantern.position.set(-1.2, 0.4, 0.3);
  tentGroup.add(dtLantern);
  const dtLanternLight = new THREE.PointLight(0xffeb80, 0.3, 4);
  dtLanternLight.position.set(-1.2, 0.5, 0.3);
  tentGroup.add(dtLanternLight);
  tentGroup.position.set(-32, 0.05, -22);
  tentGroup.rotation.y = 0.5;
  group.add(tentGroup);



  // --- v55: beach hammock between palms ---
  const hammockGroup = new THREE.Group();
  const hmPalmTrunkMat = new THREE.MeshLambertMaterial({ color: 0x6e4a2a });
  const hmPalmTrunkGeom = new THREE.CylinderGeometry(0.18, 0.24, 4.5, 10);
  const hmPalm1 = new THREE.Mesh(hmPalmTrunkGeom, hmPalmTrunkMat);
  hmPalm1.position.set(-1.6, 2.25, 0);
  hammockGroup.add(hmPalm1);
  const hmPalm2 = new THREE.Mesh(hmPalmTrunkGeom, hmPalmTrunkMat);
  hmPalm2.position.set(1.6, 2.25, 0);
  hammockGroup.add(hmPalm2);
  const hmFrondMat = new THREE.MeshLambertMaterial({ color: 0x2e7d32 });
  const hmFrondGeom = new THREE.ConeGeometry(0.5, 1.4, 6);
  for (let p = 0; p < 2; p++) {
    for (let f = 0; f < 5; f++) {
      const frond = new THREE.Mesh(hmFrondGeom, hmFrondMat);
      const px = p === 0 ? -1.6 : 1.6;
      frond.position.set(px, 4.6, 0);
      frond.rotation.z = (f / 5) * Math.PI * 2;
      frond.rotation.x = 0.4;
      hammockGroup.add(frond);
    }
  }
  const hmRopeMat = new THREE.MeshLambertMaterial({ color: 0xd2b48c });
  const hmHammockMat = new THREE.MeshLambertMaterial({ color: 0xff6f61, side: THREE.DoubleSide });
  const hmRopeGeom = new THREE.CylinderGeometry(0.04, 0.04, 1, 6);
  const hmRope1 = new THREE.Mesh(hmRopeGeom, hmRopeMat);
  hmRope1.position.set(-1.4, 1.8, 0);
  hmRope1.rotation.z = -0.4;
  hammockGroup.add(hmRope1);
  const hmRope2 = new THREE.Mesh(hmRopeGeom, hmRopeMat);
  hmRope2.position.set(1.4, 1.8, 0);
  hmRope2.rotation.z = 0.4;
  hammockGroup.add(hmRope2);
  const hmHammockGeom = new THREE.BoxGeometry(2.6, 0.08, 0.8);
  const hmHammock = new THREE.Mesh(hmHammockGeom, hmHammockMat);
  hmHammock.position.set(0, 1.4, 0);
  hammockGroup.add(hmHammock);
  // person in hammock
  const hmPersonMat = new THREE.MeshLambertMaterial({ color: 0xfdd9b5 });
  const hmPersonShirtMat = new THREE.MeshLambertMaterial({ color: 0x4ea1f5 });
  const hmPersonBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.18, 0.5), hmPersonShirtMat);
  hmPersonBody.position.set(0, 1.55, 0);
  hammockGroup.add(hmPersonBody);
  const hmPersonHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), hmPersonMat);
  hmPersonHead.position.set(0.85, 1.65, 0);
  hammockGroup.add(hmPersonHead);
  const hmHat = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.05, 12), new THREE.MeshLambertMaterial({ color: 0xc8a97e }));
  hmHat.position.set(0.85, 1.78, 0);
  hammockGroup.add(hmHat);
  hammockGroup.position.set(-12, 0.05, 28);
  group.add(hammockGroup);

  // --- v55: coast guard cutter offshore ---
  const cutterGroup = new THREE.Group();
  const cutterHullMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const cutterHull = new THREE.Mesh(new THREE.BoxGeometry(8, 1.4, 2.4), cutterHullMat);
  cutterHull.position.set(0, 0.7, 0);
  cutterGroup.add(cutterHull);
  const cutterStripeMat = new THREE.MeshLambertMaterial({ color: 0xff3030 });
  const cutterStripe = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 2.42), cutterStripeMat);
  cutterStripe.position.set(2.4, 0.95, 0);
  cutterGroup.add(cutterStripe);
  const cutterStripe2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 2.42), new THREE.MeshLambertMaterial({ color: 0x1a3a8a }));
  cutterStripe2.position.set(3.5, 0.95, 0);
  cutterGroup.add(cutterStripe2);
  const cutterBow = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.5, 4), cutterHullMat);
  cutterBow.rotation.z = -Math.PI / 2;
  cutterBow.rotation.y = Math.PI / 4;
  cutterBow.position.set(4.7, 0.7, 0);
  cutterGroup.add(cutterBow);
  const cutterCabin = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.2, 2), cutterHullMat);
  cutterCabin.position.set(-0.5, 2, 0);
  cutterGroup.add(cutterCabin);
  const cutterBridge = new THREE.Mesh(new THREE.BoxGeometry(2, 0.9, 1.6), cutterHullMat);
  cutterBridge.position.set(-0.5, 3.05, 0);
  cutterGroup.add(cutterBridge);
  const cutterMast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.5, 6), new THREE.MeshLambertMaterial({ color: 0xaaaaaa }));
  cutterMast.position.set(-0.5, 4.6, 0);
  cutterGroup.add(cutterMast);
  const cutterRadar = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.2), new THREE.MeshLambertMaterial({ color: 0xffffff }));
  cutterRadar.position.set(-0.5, 5.6, 0);
  cutterGroup.add(cutterRadar);
  const cutterLightMat = new THREE.MeshBasicMaterial({ color: 0xff2020 });
  const cutterLight = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), cutterLightMat);
  cutterLight.position.set(-0.5, 5.0, 0);
  cutterGroup.add(cutterLight);
  // antenna
  const cutterAntenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 4), new THREE.MeshLambertMaterial({ color: 0xcccccc }));
  cutterAntenna.position.set(-2.0, 4.2, 0);
  cutterGroup.add(cutterAntenna);
  cutterGroup.position.set(75, 0, -48);
  cutterGroup.rotation.y = -0.3;
  group.add(cutterGroup);

  // --- v55: crab races on sand ---
  const crabRaceGroup = new THREE.Group();
  // race track sand patch
  const crTrackMat = new THREE.MeshLambertMaterial({ color: 0xe8d5a0 });
  const crTrack = new THREE.Mesh(new THREE.BoxGeometry(5, 0.05, 2.4), crTrackMat);
  crTrack.position.set(0, 0.03, 0);
  crabRaceGroup.add(crTrack);
  // start/finish lines
  const crLineMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const crStartLine = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 2.4), crLineMat);
  crStartLine.position.set(-2.2, 0.07, 0);
  crabRaceGroup.add(crStartLine);
  const crFinishLine = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 2.4), crLineMat);
  crFinishLine.position.set(2.2, 0.07, 0);
  crabRaceGroup.add(crFinishLine);
  // 4 racing crabs
  const crCrabColors = [0xff5733, 0xffb84d, 0x8f5dff, 0x33d4cc];
  const raceCrabs = [];
  for (let c = 0; c < 4; c++) {
    const crab = new THREE.Group();
    const crabBody = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshLambertMaterial({ color: crCrabColors[c] }));
    crabBody.scale.set(1, 0.6, 1.1);
    crab.add(crabBody);
    const crabClawMat = new THREE.MeshLambertMaterial({ color: crCrabColors[c] });
    const crabClaw1 = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), crabClawMat);
    crabClaw1.position.set(0.18, 0, 0.18);
    crab.add(crabClaw1);
    const crabClaw2 = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), crabClawMat);
    crabClaw2.position.set(0.18, 0, -0.18);
    crab.add(crabClaw2);
    crab.position.set(-2.0 + c * 0.05, 0.18, -0.9 + c * 0.6);
    crab.userData.lane = -0.9 + c * 0.6;
    crab.userData.speed = 0.4 + c * 0.08;
    crab.userData.startX = -2.0;
    crabRaceGroup.add(crab);
    raceCrabs.push(crab);
  }
  // tiny race-master
  const crMaster = new THREE.Group();
  const crMasterBody = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.7, 8), new THREE.MeshLambertMaterial({ color: 0x16a085 }));
  crMasterBody.position.y = 0.35;
  crMaster.add(crMasterBody);
  const crMasterHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), new THREE.MeshLambertMaterial({ color: 0xfdd9b5 }));
  crMasterHead.position.y = 0.85;
  crMaster.add(crMasterHead);
  const crMasterFlag = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.2), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
  crMasterFlag.position.set(0.25, 1.0, 0);
  crMaster.add(crMasterFlag);
  crMaster.position.set(2.6, 0, 1.4);
  crabRaceGroup.add(crMaster);
  crabRaceGroup.position.set(15, 0.05, -32);
  group.add(crabRaceGroup);



  // --- v56: beach trampoline ---
  const trampGroup = new THREE.Group();
  const trMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
  const trFrame = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.1, 8, 24), trMat);
  trFrame.rotation.x = Math.PI / 2;
  trFrame.position.y = 0.7;
  trampGroup.add(trFrame);
  const trMatPad = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.05, 24), new THREE.MeshLambertMaterial({ color: 0x111111 }));
  trMatPad.position.y = 0.7;
  trampGroup.add(trMatPad);
  for (let i = 0; i < 4; i++) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.7, 6), trMat);
    const a = (i / 4) * Math.PI * 2;
    leg.position.set(Math.cos(a) * 1.3, 0.35, Math.sin(a) * 1.3);
    trampGroup.add(leg);
  }
  // bouncing kid
  const trKid = new THREE.Group();
  const trKidBody = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.55, 8), new THREE.MeshLambertMaterial({ color: 0xff8c00 }));
  trKidBody.position.y = 0.28;
  trKid.add(trKidBody);
  const trKidHead = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), new THREE.MeshLambertMaterial({ color: 0xfdd9b5 }));
  trKidHead.position.y = 0.7;
  trKid.add(trKidHead);
  trKid.position.y = 0.75;
  trampGroup.add(trKid);
  trampGroup.position.set(-26, 0.05, 6);
  group.add(trampGroup);

  // --- v56: fish cleaning station ---
  const fcsGroup = new THREE.Group();
  const fcsTableMat = new THREE.MeshLambertMaterial({ color: 0xc8c8c8 });
  const fcsTable = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 0.9), fcsTableMat);
  fcsTable.position.y = 0.85;
  fcsGroup.add(fcsTable);
  const fcsLegMat = new THREE.MeshLambertMaterial({ color: 0x6b6b6b });
  const fcsLegGeom = new THREE.BoxGeometry(0.08, 0.85, 0.08);
  const fcsLegPos = [[-1.0, -0.4], [1.0, -0.4], [-1.0, 0.4], [1.0, 0.4]];
  for (let i = 0; i < 4; i++) {
    const leg = new THREE.Mesh(fcsLegGeom, fcsLegMat);
    leg.position.set(fcsLegPos[i][0], 0.42, fcsLegPos[i][1]);
    fcsGroup.add(leg);
  }
  const fcsBoard = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.6), new THREE.MeshLambertMaterial({ color: 0xddc8a0 }));
  fcsBoard.position.set(0, 0.93, 0);
  fcsGroup.add(fcsBoard);
  const fcsFish = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshLambertMaterial({ color: 0x9aaab5 }));
  fcsFish.scale.set(1.4, 0.4, 0.6);
  fcsFish.position.set(-0.2, 0.98, 0);
  fcsGroup.add(fcsFish);
  const fcsTail = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.3, 4), new THREE.MeshLambertMaterial({ color: 0x9aaab5 }));
  fcsTail.rotation.z = Math.PI / 2;
  fcsTail.position.set(-0.5, 0.98, 0);
  fcsGroup.add(fcsTail);
  const fcsKnife = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.05), new THREE.MeshBasicMaterial({ color: 0xeeeeee }));
  fcsKnife.position.set(0.3, 0.96, 0);
  fcsGroup.add(fcsKnife);
  const fcsCleaner = new THREE.Group();
  const fcsCleanerBody = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.7, 8), new THREE.MeshLambertMaterial({ color: 0xffffff }));
  fcsCleanerBody.position.y = 0.85;
  fcsCleaner.add(fcsCleanerBody);
  const fcsCleanerHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), new THREE.MeshLambertMaterial({ color: 0xfdd9b5 }));
  fcsCleanerHead.position.y = 1.35;
  fcsCleaner.add(fcsCleanerHead);
  const fcsCleanerArm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 6), new THREE.MeshLambertMaterial({ color: 0xffffff }));
  fcsCleanerArm.position.set(0.2, 0.95, 0.2);
  fcsCleanerArm.rotation.z = -0.5;
  fcsCleaner.add(fcsCleanerArm);
  fcsCleaner.position.set(0, 0, 0.7);
  fcsGroup.add(fcsCleaner);
  // bucket of fish nearby
  const fcsBucket = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 0.4, 12), new THREE.MeshLambertMaterial({ color: 0x4477aa }));
  fcsBucket.position.set(1.4, 0.2, 0.4);
  fcsGroup.add(fcsBucket);
  fcsGroup.position.set(28, 0.05, -8);
  fcsGroup.rotation.y = -0.3;
  group.add(fcsGroup);

  // --- v56: sea turtle nesting on sand ---
  const turtleNestGroup = new THREE.Group();
  // sand mound
  const tnMound = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 8), new THREE.MeshLambertMaterial({ color: 0xe8d5a0 }));
  tnMound.scale.set(1, 0.4, 1);
  tnMound.position.y = 0.05;
  turtleNestGroup.add(tnMound);
  // turtle body
  const seaTurtle = new THREE.Group();
  const stShellTop = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x4a6c3a }));
  stShellTop.scale.set(1, 0.5, 1.3);
  seaTurtle.add(stShellTop);
  const stShellBase = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.05, 14), new THREE.MeshLambertMaterial({ color: 0x6a8c5a }));
  stShellBase.scale.set(1, 1, 1.3);
  seaTurtle.add(stShellBase);
  const stTurtleHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), new THREE.MeshLambertMaterial({ color: 0x5e7d4a }));
  stTurtleHead.position.set(0, 0.05, 0.75);
  seaTurtle.add(stTurtleHead);
  const stFlipperMat = new THREE.MeshLambertMaterial({ color: 0x5e7d4a });
  const stFlipperGeom = new THREE.BoxGeometry(0.5, 0.06, 0.18);
  const stFlipperFL = new THREE.Mesh(stFlipperGeom, stFlipperMat);
  stFlipperFL.position.set(-0.55, 0, 0.4);
  stFlipperFL.rotation.y = -0.4;
  seaTurtle.add(stFlipperFL);
  const stFlipperFR = new THREE.Mesh(stFlipperGeom, stFlipperMat);
  stFlipperFR.position.set(0.55, 0, 0.4);
  stFlipperFR.rotation.y = 0.4;
  seaTurtle.add(stFlipperFR);
  const stFlipperBL = new THREE.Mesh(stFlipperGeom, stFlipperMat);
  stFlipperBL.position.set(-0.5, 0, -0.4);
  stFlipperBL.rotation.y = 0.4;
  seaTurtle.add(stFlipperBL);
  const stFlipperBR = new THREE.Mesh(stFlipperGeom, stFlipperMat);
  stFlipperBR.position.set(0.5, 0, -0.4);
  stFlipperBR.rotation.y = -0.4;
  seaTurtle.add(stFlipperBR);
  seaTurtle.position.set(0, 0.25, 0);
  turtleNestGroup.add(seaTurtle);
  // tiny eggs visible behind
  const stEggMat = new THREE.MeshLambertMaterial({ color: 0xfff3d6 });
  for (let e = 0; e < 5; e++) {
    const egg = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), stEggMat);
    egg.scale.set(1, 1.3, 1);
    egg.position.set(-0.2 + e * 0.1, 0.1, -0.5 + (e % 2) * 0.05);
    turtleNestGroup.add(egg);
  }
  turtleNestGroup.position.set(-44, 0.05, 24);
  group.add(turtleNestGroup);



  // --- v57: beach swing set between two palms ---
  const swingsGroup = new THREE.Group();
  const swPostMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
  const swPost1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 3.5, 8), swPostMat);
  swPost1.position.set(-2.0, 1.75, 0);
  swingsGroup.add(swPost1);
  const swPost2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 3.5, 8), swPostMat);
  swPost2.position.set(2.0, 1.75, 0);
  swingsGroup.add(swPost2);
  const swCrossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4.4, 8), swPostMat);
  swCrossbar.rotation.z = Math.PI / 2;
  swCrossbar.position.set(0, 3.4, 0);
  swingsGroup.add(swCrossbar);
  const swChainMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
  const swSeatMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
  const swings = [];
  for (let s = 0; s < 2; s++) {
    const swing = new THREE.Group();
    const sx = -1.2 + s * 2.4;
    const swChain1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.8, 6), swChainMat);
    swChain1.position.set(-0.3, 0, 0);
    swing.add(swChain1);
    const swChain2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.8, 6), swChainMat);
    swChain2.position.set(0.3, 0, 0);
    swing.add(swChain2);
    const swSeat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.3), swSeatMat);
    swSeat.position.set(0, -0.9, 0);
    swing.add(swSeat);
    // kid on swing
    const kidBody = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.5, 8), new THREE.MeshLambertMaterial({ color: s === 0 ? 0xf06292 : 0x42a5f5 }));
    kidBody.position.set(0, -0.55, 0);
    swing.add(kidBody);
    const kidHead = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshLambertMaterial({ color: 0xfdd9b5 }));
    kidHead.position.set(0, -0.18, 0);
    swing.add(kidHead);
    swing.position.set(sx, 3.3, 0);
    swingsGroup.add(swing);
    swings.push(swing);
  }
  swingsGroup.position.set(-8, 0.05, -22);
  group.add(swingsGroup);

  // --- v57: rescue jet ski with red cross ---
  const rescueJSGroup = new THREE.Group();
  const rjsHullMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const rjsHull = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 0.8), rjsHullMat);
  rjsHull.position.y = 0.4;
  rescueJSGroup.add(rjsHull);
  const rjsBow = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.8, 4), rjsHullMat);
  rjsBow.rotation.z = -Math.PI / 2;
  rjsBow.rotation.y = Math.PI / 4;
  rjsBow.position.set(1.5, 0.4, 0);
  rescueJSGroup.add(rjsBow);
  const rjsSeat = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.2, 0.6), new THREE.MeshLambertMaterial({ color: 0x222222 }));
  rjsSeat.position.set(-0.2, 0.75, 0);
  rescueJSGroup.add(rjsSeat);
  const rjsHandlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6), new THREE.MeshLambertMaterial({ color: 0x111111 }));
  rjsHandlebar.rotation.z = Math.PI / 2;
  rjsHandlebar.position.set(0.6, 1.0, 0);
  rescueJSGroup.add(rjsHandlebar);
  // red cross sign
  const rjsCrossH = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.05), new THREE.MeshBasicMaterial({ color: 0xee2222 }));
  rjsCrossH.position.set(0, 0.5, 0.42);
  rescueJSGroup.add(rjsCrossH);
  const rjsCrossV = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.05), new THREE.MeshBasicMaterial({ color: 0xee2222 }));
  rjsCrossV.position.set(0, 0.5, 0.42);
  rescueJSGroup.add(rjsCrossV);
  // rider
  const rjsRiderBody = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.7, 8), new THREE.MeshLambertMaterial({ color: 0xff3030 }));
  rjsRiderBody.position.set(-0.2, 1.2, 0);
  rescueJSGroup.add(rjsRiderBody);
  const rjsRiderHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), new THREE.MeshLambertMaterial({ color: 0xfdd9b5 }));
  rjsRiderHead.position.set(-0.2, 1.7, 0);
  rescueJSGroup.add(rjsRiderHead);
  const rjsHelmet = new THREE.Mesh(new THREE.SphereGeometry(0.21, 10, 8), new THREE.MeshLambertMaterial({ color: 0xffeb3b }));
  rjsHelmet.position.set(-0.2, 1.78, 0);
  rescueJSGroup.add(rjsHelmet);
  // wake
  const rjsWakeMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
  const rjsWake = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.0), rjsWakeMat);
  rjsWake.rotation.x = -Math.PI / 2;
  rjsWake.position.set(-2.2, 0.06, 0);
  rescueJSGroup.add(rjsWake);
  rescueJSGroup.position.set(50, 0, 8);
  rescueJSGroup.rotation.y = 0.3;
  group.add(rescueJSGroup);

  // --- v57: treasure sandbar marker (X marks the spot) ---
  const tsbGroup = new THREE.Group();
  const tsbMound = new THREE.Mesh(new THREE.SphereGeometry(1.2, 14, 10), new THREE.MeshLambertMaterial({ color: 0xeed8a0 }));
  tsbMound.scale.set(1, 0.3, 1);
  tsbGroup.add(tsbMound);
  // Big X made of driftwood
  const tsbXMat = new THREE.MeshLambertMaterial({ color: 0x6b4423 });
  const tsbXGeom = new THREE.BoxGeometry(1.6, 0.12, 0.16);
  const tsbX1 = new THREE.Mesh(tsbXGeom, tsbXMat);
  tsbX1.position.y = 0.18;
  tsbX1.rotation.y = Math.PI / 4;
  tsbGroup.add(tsbX1);
  const tsbX2 = new THREE.Mesh(tsbXGeom, tsbXMat);
  tsbX2.position.y = 0.18;
  tsbX2.rotation.y = -Math.PI / 4;
  tsbGroup.add(tsbX2);
  // small treasure chest peeking out
  const tsbChestMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
  const tsbChestBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.4), tsbChestMat);
  tsbChestBody.position.set(0.5, 0.15, 0.5);
  tsbGroup.add(tsbChestBody);
  const tsbChestLid = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.5, 12, 1, false, 0, Math.PI), tsbChestMat);
  tsbChestLid.rotation.z = Math.PI / 2;
  tsbChestLid.position.set(0.5, 0.32, 0.5);
  tsbGroup.add(tsbChestLid);
  const tsbGoldMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
  for (let g = 0; g < 6; g++) {
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 10), tsbGoldMat);
    coin.rotation.x = Math.PI / 2;
    coin.position.set(0.5 + (Math.random() - 0.5) * 0.3, 0.3 + g * 0.01, 0.5 + (Math.random() - 0.5) * 0.3);
    tsbGroup.add(coin);
  }
  // pirate flag
  const tsbPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.5, 6), new THREE.MeshLambertMaterial({ color: 0x444444 }));
  tsbPole.position.set(-0.4, 1.25, -0.4);
  tsbGroup.add(tsbPole);
  const tsbFlag = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.4), new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.DoubleSide }));
  tsbFlag.position.set(-0.05, 2.3, -0.4);
  tsbGroup.add(tsbFlag);
  // skull on flag
  const tsbSkull = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  tsbSkull.position.set(-0.05, 2.3, -0.37);
  tsbGroup.add(tsbSkull);
  tsbGroup.position.set(60, 0.1, 38);
  group.add(tsbGroup);



  // --- v58: beach playground slide ---
  const slideGroup = new THREE.Group();
  const sldLadderMat = new THREE.MeshLambertMaterial({ color: 0xff5252 });
  const sldLadder1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 6), sldLadderMat);
  sldLadder1.position.set(-0.4, 1.1, -1.2);
  slideGroup.add(sldLadder1);
  const sldLadder2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 6), sldLadderMat);
  sldLadder2.position.set(0.4, 1.1, -1.2);
  slideGroup.add(sldLadder2);
  for (let r = 0; r < 4; r++) {
    const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 6), sldLadderMat);
    rung.rotation.z = Math.PI / 2;
    rung.position.set(0, 0.4 + r * 0.5, -1.2);
    slideGroup.add(rung);
  }
  // platform
  const sldPlatform = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.1, 1.0), sldLadderMat);
  sldPlatform.position.set(0, 2.2, -0.7);
  slideGroup.add(sldPlatform);
  // slide chute (yellow)
  const sldChuteMat = new THREE.MeshLambertMaterial({ color: 0xffeb3b });
  const sldChute = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 3.2), sldChuteMat);
  sldChute.rotation.x = -0.6;
  sldChute.position.set(0, 1.2, 0.8);
  slideGroup.add(sldChute);
  // slide rails
  const sldRailGeom = new THREE.BoxGeometry(0.05, 0.18, 3.2);
  const sldRail1 = new THREE.Mesh(sldRailGeom, sldChuteMat);
  sldRail1.rotation.x = -0.6;
  sldRail1.position.set(-0.4, 1.3, 0.8);
  slideGroup.add(sldRail1);
  const sldRail2 = new THREE.Mesh(sldRailGeom, sldChuteMat);
  sldRail2.rotation.x = -0.6;
  sldRail2.position.set(0.4, 1.3, 0.8);
  slideGroup.add(sldRail2);
  // sliding kid
  const sldKid = new THREE.Group();
  const sldKidBody = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.5, 8), new THREE.MeshLambertMaterial({ color: 0x42a5f5 }));
  sldKidBody.position.y = 0.25;
  sldKid.add(sldKidBody);
  const sldKidHead = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshLambertMaterial({ color: 0xfdd9b5 }));
  sldKidHead.position.y = 0.65;
  sldKid.add(sldKidHead);
  sldKid.position.set(0, 1.2, 0);
  slideGroup.add(sldKid);
  slideGroup.position.set(-18, 0.05, -8);
  group.add(slideGroup);

  // --- v58: weather station with windsock ---
  const weatherStationGroup = new THREE.Group();
  const wsPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 4.5, 8), new THREE.MeshLambertMaterial({ color: 0xcccccc }));
  wsPole.position.y = 2.25;
  weatherStationGroup.add(wsPole);
  // windsock (orange cone)
  const wsSockMat = new THREE.MeshLambertMaterial({ color: 0xff8c00, side: THREE.DoubleSide });
  const wsSock = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.2, 8, 1, true), wsSockMat);
  wsSock.rotation.x = Math.PI / 2;
  wsSock.rotation.y = Math.PI;
  wsSock.position.set(0.7, 4.2, 0);
  weatherStationGroup.add(wsSock);
  const wsRing = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.03, 6, 12), new THREE.MeshLambertMaterial({ color: 0x444444 }));
  wsRing.rotation.y = Math.PI / 2;
  wsRing.position.set(0.1, 4.2, 0);
  weatherStationGroup.add(wsRing);
  // anemometer cups
  const wsAnemBase = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6), new THREE.MeshLambertMaterial({ color: 0x666666 }));
  wsAnemBase.position.set(0, 4.7, 0);
  weatherStationGroup.add(wsAnemBase);
  const wsAnem = new THREE.Group();
  for (let c = 0; c < 3; c++) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.5), new THREE.MeshLambertMaterial({ color: 0x666666 }));
    const a = (c / 3) * Math.PI * 2;
    arm.position.set(Math.cos(a) * 0.25, 0, Math.sin(a) * 0.25);
    arm.rotation.y = -a;
    wsAnem.add(arm);
    const cup = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6, 0, Math.PI), new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    cup.position.set(Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5);
    cup.rotation.y = -a;
    wsAnem.add(cup);
  }
  wsAnem.position.set(0, 4.95, 0);
  weatherStationGroup.add(wsAnem);
  // info sign
  const wsSign = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.05), new THREE.MeshLambertMaterial({ color: 0x4477aa }));
  wsSign.position.set(0, 1.5, 0.15);
  weatherStationGroup.add(wsSign);
  weatherStationGroup.position.set(40, 0.05, 30);
  group.add(weatherStationGroup);

  // --- v58: sand mermaid sculpture ---
  const sandMermaidGroup = new THREE.Group();
  const smMat = new THREE.MeshLambertMaterial({ color: 0xe8d5a0 });
  // body (curved torso)
  const smTorso = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 8), smMat);
  smTorso.scale.set(0.8, 0.7, 1.6);
  smTorso.position.set(0, 0.3, 0);
  sandMermaidGroup.add(smTorso);
  // head
  const smHead = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8), smMat);
  smHead.position.set(0, 0.7, 1.0);
  sandMermaidGroup.add(smHead);
  // tail (curved cone)
  const smTail = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.8, 8), smMat);
  smTail.rotation.x = Math.PI / 2;
  smTail.position.set(0, 0.3, -1.4);
  sandMermaidGroup.add(smTail);
  // tail fin (flared)
  const smFin = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.5, 5), smMat);
  smFin.rotation.x = -Math.PI / 2;
  smFin.position.set(0, 0.3, -2.4);
  smFin.scale.set(1.4, 1, 0.5);
  sandMermaidGroup.add(smFin);
  // hair (yellow shells)
  const smHairMat = new THREE.MeshLambertMaterial({ color: 0xc8a060 });
  for (let h = 0; h < 8; h++) {
    const strand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 5), smHairMat);
    const a = (h / 8) * Math.PI - Math.PI / 2;
    strand.position.set(Math.cos(a) * 0.3, 0.95, 0.9 + Math.sin(a) * 0.2);
    sandMermaidGroup.add(strand);
  }
  // shell bra (two pink scallops)
  const smShellMat = new THREE.MeshLambertMaterial({ color: 0xff80ab });
  const smShell1 = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6, 0, Math.PI), smShellMat);
  smShell1.rotation.x = Math.PI / 2;
  smShell1.position.set(-0.18, 0.55, 0.5);
  sandMermaidGroup.add(smShell1);
  const smShell2 = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6, 0, Math.PI), smShellMat);
  smShell2.rotation.x = Math.PI / 2;
  smShell2.position.set(0.18, 0.55, 0.5);
  sandMermaidGroup.add(smShell2);
  // sculptor admiring
  const smSculptorBody = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.7, 8), new THREE.MeshLambertMaterial({ color: 0x8e44ad }));
  smSculptorBody.position.set(2.2, 0.35, 0);
  sandMermaidGroup.add(smSculptorBody);
  const smSculptorHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), new THREE.MeshLambertMaterial({ color: 0xfdd9b5 }));
  smSculptorHead.position.set(2.2, 0.85, 0);
  sandMermaidGroup.add(smSculptorHead);
  sandMermaidGroup.position.set(22, 0.05, 32);
  sandMermaidGroup.rotation.y = 0.4;
  group.add(sandMermaidGroup);



  // --- v59: lighthouse keeper's dog (golden retriever, runs around) ---
  const dogGroup = new THREE.Group();
  const dogBodyMat = new THREE.MeshLambertMaterial({ color: 0xd2a04a });
  const dogBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.5, 4, 8), dogBodyMat);
  dogBody.rotation.z = Math.PI / 2;
  dogBody.position.y = 0.32;
  dogGroup.add(dogBody);
  const dogHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), dogBodyMat);
  dogHead.position.set(0.42, 0.46, 0);
  dogHead.scale.set(1.1, 0.9, 0.9);
  dogGroup.add(dogHead);
  const dogSnout = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.12), dogBodyMat);
  dogSnout.position.set(0.58, 0.42, 0);
  dogGroup.add(dogSnout);
  const dogEarMat = new THREE.MeshLambertMaterial({ color: 0xa37a32 });
  const dogEarGeom = new THREE.ConeGeometry(0.07, 0.14, 6);
  const dogEarL = new THREE.Mesh(dogEarGeom, dogEarMat);
  dogEarL.position.set(0.36, 0.62, 0.1);
  dogEarL.rotation.x = 0.6;
  dogGroup.add(dogEarL);
  const dogEarR = new THREE.Mesh(dogEarGeom, dogEarMat);
  dogEarR.position.set(0.36, 0.62, -0.1);
  dogEarR.rotation.x = -0.6;
  dogGroup.add(dogEarR);
  const dogTail = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.32, 6), dogBodyMat);
  dogTail.position.set(-0.36, 0.46, 0);
  dogTail.rotation.z = -0.7;
  dogGroup.add(dogTail);
  const dogLegMat = new THREE.MeshLambertMaterial({ color: 0xb88a3c });
  const dogLegGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.22, 6);
  const dogLegPos = [[0.22, 0.11, 0.13], [0.22, 0.11, -0.13], [-0.22, 0.11, 0.13], [-0.22, 0.11, -0.13]];
  const dogLegs = dogLegPos.map((p) => {
    const leg = new THREE.Mesh(dogLegGeom, dogLegMat);
    leg.position.set(p[0], p[1], p[2]);
    dogGroup.add(leg);
    return leg;
  });
  dogGroup.position.set(-30, 0, -8);
  group.add(dogGroup);

  // --- v59: tide-driven mill wheel (rotating wooden wheel beside stream) ---
  const millGroup = new THREE.Group();
  const millHouseMat = new THREE.MeshLambertMaterial({ color: 0x8a5b2f });
  const millHouse = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.0, 1.8), millHouseMat);
  millHouse.position.set(0, 1.0, 0);
  millGroup.add(millHouse);
  const millRoofMat = new THREE.MeshLambertMaterial({ color: 0x4d3a22 });
  const millRoof = new THREE.Mesh(new THREE.ConeGeometry(1.7, 0.9, 4), millRoofMat);
  millRoof.position.set(0, 2.45, 0);
  millRoof.rotation.y = Math.PI / 4;
  millGroup.add(millRoof);
  const millDoorMat = new THREE.MeshLambertMaterial({ color: 0x3a2210 });
  const millDoor = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.9, 0.05), millDoorMat);
  millDoor.position.set(0, 0.45, 0.92);
  millGroup.add(millDoor);
  const millWindowMat = new THREE.MeshLambertMaterial({ color: 0xfff3a0, emissive: 0x664400, emissiveIntensity: 0.4 });
  const millWindow = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.05), millWindowMat);
  millWindow.position.set(-0.7, 1.4, 0.92);
  millGroup.add(millWindow);
  const millWheel = new THREE.Group();
  const millWheelHubMat = new THREE.MeshLambertMaterial({ color: 0x6b4422 });
  const millWheelHub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.5, 10), millWheelHubMat);
  millWheelHub.rotation.z = Math.PI / 2;
  millWheel.add(millWheelHub);
  const millSpokeMat = new THREE.MeshLambertMaterial({ color: 0x5a3a1c });
  const millRimGeom = new THREE.TorusGeometry(1.0, 0.06, 6, 24);
  const millRim1 = new THREE.Mesh(millRimGeom, millSpokeMat);
  millRim1.position.x = 0.22;
  millRim1.rotation.y = Math.PI / 2;
  millWheel.add(millRim1);
  const millRim2 = new THREE.Mesh(millRimGeom, millSpokeMat);
  millRim2.position.x = -0.22;
  millRim2.rotation.y = Math.PI / 2;
  millWheel.add(millRim2);
  const millPaddleMat = new THREE.MeshLambertMaterial({ color: 0x8b6232 });
  const millPaddleGeom = new THREE.BoxGeometry(0.5, 0.9, 0.06);
  const millPaddles = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const p = new THREE.Mesh(millPaddleGeom, millPaddleMat);
    p.position.set(0, Math.sin(a) * 1.0, Math.cos(a) * 1.0);
    p.rotation.x = -a;
    p.rotation.y = Math.PI / 2;
    millWheel.add(p);
    millPaddles.push(p);
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const sp = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.9, 0.05), millSpokeMat);
    sp.position.set(0.22, 0, 0);
    sp.rotation.x = a;
    millWheel.add(sp);
    const sp2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.9, 0.05), millSpokeMat);
    sp2.position.set(-0.22, 0, 0);
    sp2.rotation.x = a;
    millWheel.add(sp2);
  }
  millWheel.position.set(1.45, 1.0, 0);
  millGroup.add(millWheel);
  const millStreamMat = new THREE.MeshLambertMaterial({ color: 0x4a8fc2, transparent: true, opacity: 0.7 });
  const millStream = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), millStreamMat);
  millStream.rotation.x = -Math.PI / 2;
  millStream.position.set(2.0, 0.06, 0);
  millGroup.add(millStream);
  millGroup.position.set(-44, 0, 22);
  millGroup.rotation.y = -0.6;
  group.add(millGroup);

  // --- v59: fish & chips food truck ---
  const fctGroup = new THREE.Group();
  const fctBodyMat = new THREE.MeshLambertMaterial({ color: 0xd9534f });
  const fctBody = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.2, 1.4), fctBodyMat);
  fctBody.position.y = 0.95;
  fctGroup.add(fctBody);
  const fctCabMat = new THREE.MeshLambertMaterial({ color: 0xb8413d });
  const fctCab = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.0, 1.4), fctCabMat);
  fctCab.position.set(1.6, 0.9, 0);
  fctGroup.add(fctCab);
  const fctWindshieldMat = new THREE.MeshLambertMaterial({ color: 0x88ccee, transparent: true, opacity: 0.7 });
  const fctWindshield = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 1.2), fctWindshieldMat);
  fctWindshield.position.set(2.05, 1.1, 0);
  fctGroup.add(fctWindshield);
  const fctRoofMat = new THREE.MeshLambertMaterial({ color: 0xf5e6c8 });
  const fctRoof = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.05, 1.4), fctRoofMat);
  fctRoof.position.y = 1.58;
  fctGroup.add(fctRoof);
  // serving window cut on side
  const fctServeMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
  const fctServe = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.55, 0.04), fctServeMat);
  fctServe.position.set(-0.2, 1.1, 0.72);
  fctGroup.add(fctServe);
  const fctAwningMat = new THREE.MeshLambertMaterial({ color: 0xffe066 });
  const fctAwning = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.5), fctAwningMat);
  fctAwning.position.set(-0.2, 1.4, 0.95);
  fctAwning.rotation.x = -0.3;
  fctGroup.add(fctAwning);
  // fish & chips sign on side using canvas
  const fctSignCanvas = document.createElement('canvas');
  fctSignCanvas.width = 256; fctSignCanvas.height = 64;
  const fctCtx = fctSignCanvas.getContext('2d');
  fctCtx.fillStyle = '#fffbe0';
  fctCtx.fillRect(0, 0, 256, 64);
  fctCtx.fillStyle = '#1a3a5a';
  fctCtx.font = 'bold 36px sans-serif';
  fctCtx.textAlign = 'center';
  fctCtx.fillText('FISH & CHIPS', 128, 44);
  const fctSignTex = new THREE.CanvasTexture(fctSignCanvas);
  const fctSign = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.5), new THREE.MeshBasicMaterial({ map: fctSignTex }));
  fctSign.position.set(-0.2, 0.55, 0.71);
  fctGroup.add(fctSign);
  // wheels
  const fctWheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const fctWheelGeom = new THREE.CylinderGeometry(0.28, 0.28, 0.18, 12);
  const fctWheelPos = [[1.4, 0.28, 0.65], [1.4, 0.28, -0.65], [-0.9, 0.28, 0.65], [-0.9, 0.28, -0.65]];
  fctWheelPos.forEach((p) => {
    const w = new THREE.Mesh(fctWheelGeom, fctWheelMat);
    w.position.set(p[0], p[1], p[2]);
    w.rotation.x = Math.PI / 2;
    fctGroup.add(w);
  });
  // vendor in window
  const fctVendor = new THREE.Group();
  const fctVendorBody = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.6, 8), new THREE.MeshLambertMaterial({ color: 0xffffff }));
  fctVendorBody.position.y = 0.3;
  fctVendor.add(fctVendorBody);
  const fctVendorHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), new THREE.MeshLambertMaterial({ color: 0xfdd9b5 }));
  fctVendorHead.position.y = 0.78;
  fctVendor.add(fctVendorHead);
  const fctVendorHat = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.18, 12), new THREE.MeshLambertMaterial({ color: 0xffffff }));
  fctVendorHat.position.y = 0.99;
  fctVendor.add(fctVendorHat);
  fctVendor.position.set(-0.6, 0.5, 0.4);
  fctGroup.add(fctVendor);
  // customer outside
  const fctCustomer = new THREE.Group();
  const fctCustBody = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.65, 8), new THREE.MeshLambertMaterial({ color: 0x4a90c2 }));
  fctCustBody.position.y = 0.32;
  fctCustomer.add(fctCustBody);
  const fctCustHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), new THREE.MeshLambertMaterial({ color: 0xc99078 }));
  fctCustHead.position.y = 0.82;
  fctCustomer.add(fctCustHead);
  fctCustomer.position.set(0.2, 0, 1.4);
  fctGroup.add(fctCustomer);
  fctGroup.position.set(36, 0, 18);
  fctGroup.rotation.y = -0.4;
  group.add(fctGroup);



  // --- v60: beach soccer match (2 teams + ball + goal posts) ---
  const soccerGroup = new THREE.Group();
  const soccerFieldMat = new THREE.MeshLambertMaterial({ color: 0xe9d18a, transparent: true, opacity: 0.5 });
  const soccerField = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), soccerFieldMat);
  soccerField.rotation.x = -Math.PI / 2;
  soccerField.position.y = 0.04;
  soccerGroup.add(soccerField);
  const goalPostMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const goalPostGeom = new THREE.CylinderGeometry(0.04, 0.04, 1.0, 6);
  const soccerGoals = [];
  for (let g = 0; g < 2; g++) {
    const goal = new THREE.Group();
    const post1 = new THREE.Mesh(goalPostGeom, goalPostMat);
    post1.position.set(0, 0.5, -0.6);
    goal.add(post1);
    const post2 = new THREE.Mesh(goalPostGeom, goalPostMat);
    post2.position.set(0, 0.5, 0.6);
    goal.add(post2);
    const cross = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6), goalPostMat);
    cross.rotation.x = Math.PI / 2;
    cross.position.set(0, 1.0, 0);
    goal.add(cross);
    goal.position.set((g === 0 ? -5 : 5), 0, 0);
    soccerGroup.add(goal);
    soccerGoals.push(goal);
  }
  const soccerBall = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8), new THREE.MeshLambertMaterial({ color: 0xffffff }));
  soccerBall.position.set(0, 0.18, 0);
  soccerGroup.add(soccerBall);
  // Two teams of 3 players each
  const soccerTeam1Mat = new THREE.MeshLambertMaterial({ color: 0xd9534f });
  const soccerTeam2Mat = new THREE.MeshLambertMaterial({ color: 0x4a8fc2 });
  const soccerHeadMat = new THREE.MeshLambertMaterial({ color: 0xfdd9b5 });
  const soccerPlayers = [];
  const soccerPositions = [
    [-3, 0, -1, soccerTeam1Mat], [-2, 0, 1.5, soccerTeam1Mat], [-1, 0, -1, soccerTeam1Mat],
    [3, 0, 1, soccerTeam2Mat], [2, 0, -1.5, soccerTeam2Mat], [1, 0, 0.5, soccerTeam2Mat],
  ];
  soccerPositions.forEach((p) => {
    const pl = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.55, 8), p[3]);
    body.position.y = 0.28;
    pl.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), soccerHeadMat);
    head.position.y = 0.7;
    pl.add(head);
    pl.position.set(p[0], p[1], p[2]);
    soccerGroup.add(pl);
    soccerPlayers.push(pl);
  });
  soccerGroup.position.set(50, 0, -28);
  group.add(soccerGroup);

  // --- v60: pelican standing on top of lifeguard tower ---
  const towerPelicanGroup = new THREE.Group();
  const tpBodyMat = new THREE.MeshLambertMaterial({ color: 0xf5f0e0 });
  const tpBody = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), tpBodyMat);
  tpBody.scale.set(1, 0.85, 1.5);
  tpBody.position.y = 0.32;
  towerPelicanGroup.add(tpBody);
  const tpHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), tpBodyMat);
  tpHead.position.set(0, 0.65, 0.45);
  towerPelicanGroup.add(tpHead);
  const tpBeakMat = new THREE.MeshLambertMaterial({ color: 0xf2b240 });
  const tpBeak = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.5, 6), tpBeakMat);
  tpBeak.position.set(0, 0.55, 0.85);
  tpBeak.rotation.x = Math.PI / 2;
  towerPelicanGroup.add(tpBeak);
  const tpEyeMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const tpEyeL = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), tpEyeMat);
  tpEyeL.position.set(0.08, 0.7, 0.55);
  towerPelicanGroup.add(tpEyeL);
  const tpEyeR = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), tpEyeMat);
  tpEyeR.position.set(-0.08, 0.7, 0.55);
  towerPelicanGroup.add(tpEyeR);
  const tpLegMat = new THREE.MeshLambertMaterial({ color: 0xc97a30 });
  const tpLeg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.18, 6), tpLegMat);
  tpLeg1.position.set(0.08, 0.06, 0);
  towerPelicanGroup.add(tpLeg1);
  const tpLeg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.18, 6), tpLegMat);
  tpLeg2.position.set(-0.08, 0.06, 0);
  towerPelicanGroup.add(tpLeg2);
  // place on top of v50 lifeguard tower (lifeguardTowerGroup at known position)
  // lifeguard tower position is -38, 0, 12 with platform around y=2.5; perch on roof y~3.6
  towerPelicanGroup.position.set(14, 4.85, 14);
  towerPelicanGroup.rotation.y = -0.4;
  group.add(towerPelicanGroup);

  // --- v60: octopus in tide pool (purple, 8 wavy tentacles) ---
  const octopusGroup = new THREE.Group();
  const octoPoolMat = new THREE.MeshLambertMaterial({ color: 0x2a6080, transparent: true, opacity: 0.6 });
  const octoPool = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.6, 0.18, 16), octoPoolMat);
  octoPool.position.y = 0.09;
  octopusGroup.add(octoPool);
  const octoRockMat = new THREE.MeshLambertMaterial({ color: 0x6e6058 });
  const octoRock = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.18, 6, 20), octoRockMat);
  octoRock.rotation.x = Math.PI / 2;
  octoRock.position.y = 0.18;
  octopusGroup.add(octoRock);
  const octoBodyMat = new THREE.MeshLambertMaterial({ color: 0x9a4ec2 });
  const octoBody = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 10), octoBodyMat);
  octoBody.scale.set(1, 1.2, 1);
  octoBody.position.set(0, 0.4, 0);
  octopusGroup.add(octoBody);
  const octoEyeMat = new THREE.MeshLambertMaterial({ color: 0xfff5e0 });
  const octoEyeL = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), octoEyeMat);
  octoEyeL.position.set(0.18, 0.55, 0.32);
  octopusGroup.add(octoEyeL);
  const octoEyeR = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), octoEyeMat);
  octoEyeR.position.set(-0.18, 0.55, 0.32);
  octopusGroup.add(octoEyeR);
  const octoPupilMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const octoPupilL = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), octoPupilMat);
  octoPupilL.position.set(0.21, 0.55, 0.38);
  octopusGroup.add(octoPupilL);
  const octoPupilR = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), octoPupilMat);
  octoPupilR.position.set(-0.21, 0.55, 0.38);
  octopusGroup.add(octoPupilR);
  const octoTentacles = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.55, 6), octoBodyMat);
    t.position.set(Math.cos(a) * 0.32, 0.2, Math.sin(a) * 0.32);
    t.rotation.z = Math.cos(a) * 0.6;
    t.rotation.x = Math.sin(a) * 0.6;
    octopusGroup.add(t);
    octoTentacles.push({ mesh: t, baseAng: a });
  }
  octopusGroup.position.set(-50, 0.05, -16);
  group.add(octopusGroup);



  // --- v61: boat ramp with truck + trailer ---
  const rampGroup = new THREE.Group();
  const rampMat = new THREE.MeshLambertMaterial({ color: 0x9a948a });
  const rampPlane = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 6.0), rampMat);
  rampPlane.position.set(0, 0.06, 0);
  rampPlane.rotation.x = 0.18;
  rampGroup.add(rampPlane);
  // truck
  const rampTruckGroup = new THREE.Group();
  const rampTruckBodyMat = new THREE.MeshLambertMaterial({ color: 0x2c5fa2 });
  const rampTruckCab = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.7, 1.0), rampTruckBodyMat);
  rampTruckCab.position.set(0.55, 0.65, 0);
  rampTruckGroup.add(rampTruckCab);
  const rampTruckBed = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 1.0), rampTruckBodyMat);
  rampTruckBed.position.set(-0.5, 0.55, 0);
  rampTruckGroup.add(rampTruckBed);
  const rampTruckWindshield = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 0.85), new THREE.MeshLambertMaterial({ color: 0x88bbdd, transparent: true, opacity: 0.7 }));
  rampTruckWindshield.position.set(1.05, 0.85, 0);
  rampTruckGroup.add(rampTruckWindshield);
  const rampWheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const rampWheelGeom = new THREE.CylinderGeometry(0.22, 0.22, 0.16, 12);
  const rampTruckWheels = [[0.5, 0.22, 0.5], [0.5, 0.22, -0.5], [-0.6, 0.22, 0.5], [-0.6, 0.22, -0.5]];
  rampTruckWheels.forEach((p) => {
    const w = new THREE.Mesh(rampWheelGeom, rampWheelMat);
    w.position.set(p[0], p[1], p[2]);
    w.rotation.x = Math.PI / 2;
    rampTruckGroup.add(w);
  });
  rampTruckGroup.position.set(0, 0.4, 2.6);
  rampGroup.add(rampTruckGroup);
  // trailer
  const rampTrailerGroup = new THREE.Group();
  const rampTrailerBeamMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
  const rampTrailerBeam = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 0.6), rampTrailerBeamMat);
  rampTrailerBeam.position.y = 0.3;
  rampTrailerGroup.add(rampTrailerBeam);
  const rampTrailerWheels = [[0.6, 0.18, 0.4], [0.6, 0.18, -0.4]];
  rampTrailerWheels.forEach((p) => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 10), rampWheelMat);
    w.position.set(p[0], p[1], p[2]);
    w.rotation.x = Math.PI / 2;
    rampTrailerGroup.add(w);
  });
  // small fishing boat on trailer
  const rampBoatMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee });
  const rampBoat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.32, 0.7), rampBoatMat);
  rampBoat.position.y = 0.55;
  rampTrailerGroup.add(rampBoat);
  const rampBoatTrim = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.06, 0.74), new THREE.MeshLambertMaterial({ color: 0xc94434 }));
  rampBoatTrim.position.y = 0.72;
  rampTrailerGroup.add(rampBoatTrim);
  rampTrailerGroup.position.set(-1.0, 0.4, 1.2);
  rampGroup.add(rampTrailerGroup);
  rampGroup.position.set(-22, 0, 38);
  rampGroup.rotation.y = 0.3;
  group.add(rampGroup);

  // --- v61: marina fuel dock with customer at pump ---
  const fuelDockGroup = new THREE.Group();
  const fuelDeckMat = new THREE.MeshLambertMaterial({ color: 0x9b7340 });
  const fuelDeck = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.18, 2.4), fuelDeckMat);
  fuelDeck.position.y = 0.5;
  fuelDockGroup.add(fuelDeck);
  // pilings
  const fuelPilingMat = new THREE.MeshLambertMaterial({ color: 0x5e4424 });
  const fuelPilingGeom = new THREE.CylinderGeometry(0.1, 0.12, 1.2, 8);
  const fuelPilingPos = [[1.6, 0.0, 1.0], [-1.6, 0.0, 1.0], [1.6, 0.0, -1.0], [-1.6, 0.0, -1.0]];
  fuelPilingPos.forEach((p) => {
    const pl = new THREE.Mesh(fuelPilingGeom, fuelPilingMat);
    pl.position.set(p[0], p[1], p[2]);
    fuelDockGroup.add(pl);
  });
  // pump tower
  const fuelPump = new THREE.Group();
  const fuelPumpBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 0.4), new THREE.MeshLambertMaterial({ color: 0xd9534f }));
  fuelPumpBody.position.y = 1.2;
  fuelPump.add(fuelPumpBody);
  const fuelPumpDisplay = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.05), new THREE.MeshLambertMaterial({ color: 0x111111, emissive: 0x66ff66, emissiveIntensity: 0.4 }));
  fuelPumpDisplay.position.set(0, 1.5, 0.22);
  fuelPump.add(fuelPumpDisplay);
  const fuelPumpHose = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.6, 6), new THREE.MeshLambertMaterial({ color: 0x222222 }));
  fuelPumpHose.position.set(0.3, 1.2, 0);
  fuelPumpHose.rotation.z = -0.3;
  fuelPump.add(fuelPumpHose);
  const fuelSignCanvas = document.createElement('canvas');
  fuelSignCanvas.width = 256; fuelSignCanvas.height = 64;
  const fuelSignCtx = fuelSignCanvas.getContext('2d');
  fuelSignCtx.fillStyle = '#fff5e0';
  fuelSignCtx.fillRect(0, 0, 256, 64);
  fuelSignCtx.fillStyle = '#a02828';
  fuelSignCtx.font = 'bold 32px sans-serif';
  fuelSignCtx.textAlign = 'center';
  fuelSignCtx.fillText('MARINE FUEL', 128, 42);
  const fuelSignTex = new THREE.CanvasTexture(fuelSignCanvas);
  const fuelSign = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.4), new THREE.MeshBasicMaterial({ map: fuelSignTex }));
  fuelSign.position.set(0, 2.0, 0);
  fuelPump.add(fuelSign);
  fuelPump.position.set(-1.0, 0.6, 0);
  fuelDockGroup.add(fuelPump);
  // customer at pump
  const fuelCustGroup = new THREE.Group();
  const fuelCustBody = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.6, 8), new THREE.MeshLambertMaterial({ color: 0xffaa44 }));
  fuelCustBody.position.y = 0.3;
  fuelCustGroup.add(fuelCustBody);
  const fuelCustHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), new THREE.MeshLambertMaterial({ color: 0xc99078 }));
  fuelCustHead.position.y = 0.78;
  fuelCustGroup.add(fuelCustHead);
  const fuelCustArm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 6), new THREE.MeshLambertMaterial({ color: 0xc99078 }));
  fuelCustArm.position.set(0.18, 0.5, 0.05);
  fuelCustArm.rotation.z = -0.5;
  fuelCustGroup.add(fuelCustArm);
  fuelCustGroup.position.set(-0.3, 0.6, 0.5);
  fuelDockGroup.add(fuelCustGroup);
  // small motorboat tied up at fuel dock
  const fuelBoat = new THREE.Group();
  const fuelBoatHull = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 0.9), new THREE.MeshLambertMaterial({ color: 0xddffff }));
  fuelBoatHull.position.y = 0.2;
  fuelBoat.add(fuelBoatHull);
  const fuelBoatWindshield = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.85), new THREE.MeshLambertMaterial({ color: 0x88bbdd, transparent: true, opacity: 0.7 }));
  fuelBoatWindshield.position.set(0.4, 0.55, 0);
  fuelBoat.add(fuelBoatWindshield);
  fuelBoat.position.set(0.5, 0.05, 1.6);
  fuelDockGroup.add(fuelBoat);
  fuelDockGroup.position.set(28, 0, -38);
  fuelDockGroup.rotation.y = 0.6;
  group.add(fuelDockGroup);

  // --- v61: dolphin show (jumping arc, two dolphins splashing) ---
  const dolphinShowGroup = new THREE.Group();
  const dShowMat = new THREE.MeshLambertMaterial({ color: 0x6a9bbe });
  const dShowBellyMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee });
  function makeShowDolphin() {
    const d = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 1.0, 6, 10), dShowMat);
    body.rotation.z = Math.PI / 2;
    d.add(body);
    const belly = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.8, 6, 10), dShowBellyMat);
    belly.rotation.z = Math.PI / 2;
    belly.position.y = -0.05;
    d.add(belly);
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 6), dShowMat);
    fin.position.y = 0.32;
    fin.rotation.x = Math.PI;
    d.add(fin);
    const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.4), dShowMat);
    tailFin.position.x = -0.7;
    d.add(tailFin);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.3, 6), dShowMat);
    beak.position.x = 0.78;
    beak.rotation.z = -Math.PI / 2;
    d.add(beak);
    return d;
  }
  const dShow1 = makeShowDolphin();
  dolphinShowGroup.add(dShow1);
  const dShow2 = makeShowDolphin();
  dolphinShowGroup.add(dShow2);
  // splash particles
  const dShowSplashMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
  const dShowSplashes = [];
  for (let i = 0; i < 6; i++) {
    const sp = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 5), dShowSplashMat);
    sp.position.set(0, 0, 0);
    dolphinShowGroup.add(sp);
    dShowSplashes.push(sp);
  }
  dolphinShowGroup.position.set(60, 0, -52);
  group.add(dolphinShowGroup);



  // --- v62: rescue helicopter with cable lowered to surfer in distress ---
  const rescueCopterGroup = new THREE.Group();
  const rcBodyMat = new THREE.MeshLambertMaterial({ color: 0xb83a36 });
  const rcBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.8, 1.6, 6, 10), rcBodyMat);
  rcBody.rotation.z = Math.PI / 2;
  rcBody.position.y = 0;
  rescueCopterGroup.add(rcBody);
  const rcWindow = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 8), new THREE.MeshLambertMaterial({ color: 0x223344, transparent: true, opacity: 0.7 }));
  rcWindow.position.set(1.0, 0.05, 0);
  rcWindow.scale.set(1, 0.9, 1);
  rescueCopterGroup.add(rcWindow);
  const rcTail = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.06, 1.6, 8), rcBodyMat);
  rcTail.position.set(-1.6, 0, 0);
  rcTail.rotation.z = Math.PI / 2;
  rescueCopterGroup.add(rcTail);
  const rcTailFinMat = new THREE.MeshLambertMaterial({ color: 0xffe066 });
  const rcTailFin = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.05), rcTailFinMat);
  rcTailFin.position.set(-2.3, 0.2, 0);
  rescueCopterGroup.add(rcTailFin);
  const rcCrossSign = document.createElement('canvas');
  rcCrossSign.width = 128; rcCrossSign.height = 128;
  const rcCtx = rcCrossSign.getContext('2d');
  rcCtx.fillStyle = '#ffffff';
  rcCtx.fillRect(0, 0, 128, 128);
  rcCtx.fillStyle = '#cc1111';
  rcCtx.fillRect(48, 16, 32, 96);
  rcCtx.fillRect(16, 48, 96, 32);
  const rcCrossTex = new THREE.CanvasTexture(rcCrossSign);
  const rcCrossDecal = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), new THREE.MeshBasicMaterial({ map: rcCrossTex }));
  rcCrossDecal.position.set(0.2, 0, 0.81);
  rescueCopterGroup.add(rcCrossDecal);
  const rcMast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 6), new THREE.MeshLambertMaterial({ color: 0x222222 }));
  rcMast.position.y = 0.5;
  rescueCopterGroup.add(rcMast);
  const rcRotorMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
  const rcRotor = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.05, 0.18), rcRotorMat);
    blade.rotation.y = (i / 4) * Math.PI * 2;
    rcRotor.add(blade);
  }
  rcRotor.position.y = 0.7;
  rescueCopterGroup.add(rcRotor);
  const rcTailRotor = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.06), rcRotorMat);
    blade.rotation.x = (i / 4) * Math.PI * 2;
    rcTailRotor.add(blade);
  }
  rcTailRotor.position.set(-2.35, 0.05, 0.1);
  rcTailRotor.rotation.y = Math.PI / 2;
  rescueCopterGroup.add(rcTailRotor);
  // Cable + rescuer
  const rcCableMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
  const rcCable = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 5.0, 6), rcCableMat);
  rcCable.position.set(0.2, -2.5, 0);
  rescueCopterGroup.add(rcCable);
  const rcRescuer = new THREE.Group();
  const rcRescBody = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.55, 8), new THREE.MeshLambertMaterial({ color: 0xff8c00 }));
  rcRescBody.position.y = 0.28;
  rcRescuer.add(rcRescBody);
  const rcRescHead = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshLambertMaterial({ color: 0xfdd9b5 }));
  rcRescHead.position.y = 0.7;
  rcRescuer.add(rcRescHead);
  const rcRescHelmet = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0xffe066 }));
  rcRescHelmet.position.y = 0.78;
  rcRescuer.add(rcRescHelmet);
  rcRescuer.position.set(0.2, -5.0, 0);
  rescueCopterGroup.add(rcRescuer);
  // Surfer in distress (waving)
  const rcSurferGroup = new THREE.Group();
  const rcSurfBoard = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.06, 0.4), new THREE.MeshLambertMaterial({ color: 0x33ccff }));
  rcSurfBoard.position.y = 0.05;
  rcSurferGroup.add(rcSurfBoard);
  const rcSurferBody = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.5, 8), new THREE.MeshLambertMaterial({ color: 0x444444 }));
  rcSurferBody.position.set(0, 0.3, 0);
  rcSurferGroup.add(rcSurferBody);
  const rcSurferHead = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), new THREE.MeshLambertMaterial({ color: 0xc99078 }));
  rcSurferHead.position.set(0, 0.65, 0);
  rcSurferGroup.add(rcSurferHead);
  const rcSurferArm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6), new THREE.MeshLambertMaterial({ color: 0xc99078 }));
  rcSurferArm.position.set(0.18, 0.55, 0);
  rcSurferArm.rotation.z = -1.0;
  rcSurferGroup.add(rcSurferArm);
  rcSurferGroup.position.set(60, 0.1, 50);
  group.add(rcSurferGroup);
  rescueCopterGroup.position.set(60, 7, 50);
  group.add(rescueCopterGroup);

  // --- v62: surfboard rental rack ---
  const surfRackGroup = new THREE.Group();
  const srPostMat = new THREE.MeshLambertMaterial({ color: 0x6b4422 });
  const srPostGeom = new THREE.CylinderGeometry(0.08, 0.08, 1.6, 6);
  const srPost1 = new THREE.Mesh(srPostGeom, srPostMat);
  srPost1.position.set(-1.0, 0.8, 0);
  surfRackGroup.add(srPost1);
  const srPost2 = new THREE.Mesh(srPostGeom, srPostMat);
  srPost2.position.set(1.0, 0.8, 0);
  surfRackGroup.add(srPost2);
  const srRailMat = new THREE.MeshLambertMaterial({ color: 0x8a5a2a });
  const srRailGeom = new THREE.BoxGeometry(2.4, 0.08, 0.1);
  const srRail1 = new THREE.Mesh(srRailGeom, srRailMat);
  srRail1.position.y = 1.4;
  surfRackGroup.add(srRail1);
  const srRail2 = new THREE.Mesh(srRailGeom, srRailMat);
  srRail2.position.y = 0.4;
  surfRackGroup.add(srRail2);
  const srBoardColors = [0xff6b35, 0xffe066, 0x66ddff, 0xff66cc, 0x77dd77];
  const srBoardGeom = new THREE.BoxGeometry(0.16, 1.4, 0.4);
  for (let i = 0; i < 5; i++) {
    const board = new THREE.Mesh(srBoardGeom, new THREE.MeshLambertMaterial({ color: srBoardColors[i] }));
    board.position.set(-0.9 + i * 0.45, 1.0, 0);
    board.rotation.z = -0.05;
    surfRackGroup.add(board);
  }
  // sign
  const srSignCanvas = document.createElement('canvas');
  srSignCanvas.width = 256; srSignCanvas.height = 64;
  const srSignCtx = srSignCanvas.getContext('2d');
  srSignCtx.fillStyle = '#fff7d6';
  srSignCtx.fillRect(0, 0, 256, 64);
  srSignCtx.fillStyle = '#1c4d8a';
  srSignCtx.font = 'bold 28px sans-serif';
  srSignCtx.textAlign = 'center';
  srSignCtx.fillText('SURF RENTALS', 128, 42);
  const srSignTex = new THREE.CanvasTexture(srSignCanvas);
  const srSign = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.5), new THREE.MeshBasicMaterial({ map: srSignTex }));
  srSign.position.set(0, 1.9, 0);
  surfRackGroup.add(srSign);
  surfRackGroup.position.set(40, 0, 26);
  surfRackGroup.rotation.y = -0.3;
  group.add(surfRackGroup);

  // --- v62: navigation buoy with sea lions sunning ---
  const slBuoyGroup = new THREE.Group();
  const slBuoyBaseMat = new THREE.MeshLambertMaterial({ color: 0xc94434 });
  const slBuoyBase = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.5, 16), slBuoyBaseMat);
  slBuoyBase.position.y = 0.25;
  slBuoyGroup.add(slBuoyBase);
  const slBuoyDeck = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.9, 0.08, 16), new THREE.MeshLambertMaterial({ color: 0x6b4422 }));
  slBuoyDeck.position.y = 0.54;
  slBuoyGroup.add(slBuoyDeck);
  const slBuoyTower = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 6), new THREE.MeshLambertMaterial({ color: 0x444444 }));
  slBuoyTower.position.y = 0.95;
  slBuoyGroup.add(slBuoyTower);
  const slBuoyLightMat = new THREE.MeshLambertMaterial({ color: 0xffe066, emissive: 0xff8800, emissiveIntensity: 0.7 });
  const slBuoyLight = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), slBuoyLightMat);
  slBuoyLight.position.y = 1.4;
  slBuoyGroup.add(slBuoyLight);
  // sea lions on the buoy
  const slMat = new THREE.MeshLambertMaterial({ color: 0x6e5a48 });
  const slLions = [];
  for (let i = 0; i < 3; i++) {
    const lion = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.5, 6, 10), slMat);
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.18;
    lion.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), slMat);
    head.position.set(0.45, 0.22, 0);
    lion.add(head);
    const a = (i / 3) * Math.PI * 2 + 0.3;
    lion.position.set(Math.cos(a) * 0.5, 0.6, Math.sin(a) * 0.5);
    lion.rotation.y = -a;
    slBuoyGroup.add(lion);
    slLions.push(lion);
  }
  slBuoyGroup.position.set(-66, 0.18, 56);
  group.add(slBuoyGroup);



  // --- v63: outdoor shower + submarine + beach wedding arch ----------------
  // Outdoor shower stall (vertical post, head, spray particles, bather)
  const showerGroup = new THREE.Group();
  const shPostMat = new THREE.MeshStandardMaterial({ color: 0x9aa6b0, metalness: 0.4, roughness: 0.5 });
  const shPost = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 10), shPostMat);
  shPost.position.y = 1.3;
  showerGroup.add(shPost);
  const shArm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8), shPostMat);
  shArm.rotation.z = Math.PI / 2;
  shArm.position.set(0.25, 2.45, 0);
  showerGroup.add(shArm);
  const shHeadMat = new THREE.MeshStandardMaterial({ color: 0xb8c0c8, metalness: 0.6, roughness: 0.3 });
  const shHead = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.12, 12), shHeadMat);
  shHead.position.set(0.5, 2.4, 0);
  showerGroup.add(shHead);
  const shBaseMat = new THREE.MeshLambertMaterial({ color: 0x6b7178 });
  const shBase = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 0.06, 16), shBaseMat);
  shBase.position.y = 0.03;
  showerGroup.add(shBase);
  // privacy partial wall (low slat)
  const shWallMat = new THREE.MeshLambertMaterial({ color: 0x7a5a3a });
  const shWall = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.4, 1.2), shWallMat);
  shWall.position.set(-0.6, 0.7, 0);
  showerGroup.add(shWall);
  // spray particles
  const shSprayMat = new THREE.MeshBasicMaterial({ color: 0xc8e8ff, transparent: true, opacity: 0.7 });
  const shSprayGeom = new THREE.SphereGeometry(0.04, 5, 5);
  const shDrops = [];
  for (let i = 0; i < 14; i++) {
    const d = new THREE.Mesh(shSprayGeom, shSprayMat);
    shDrops.push({ mesh: d, phase: Math.random() });
    showerGroup.add(d);
  }
  // bather (back to viewer)
  const shBatherMat = new THREE.MeshLambertMaterial({ color: 0xffd5b3 });
  const shBatherBody = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.85, 10), new THREE.MeshLambertMaterial({ color: 0x224488 }));
  shBatherBody.position.set(0.5, 0.85, 0);
  showerGroup.add(shBatherBody);
  const shBatherHead = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), shBatherMat);
  shBatherHead.position.set(0.5, 1.45, 0);
  showerGroup.add(shBatherHead);
  const shBatherArm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8), shBatherMat);
  shBatherArm.position.set(0.5, 1.6, 0.0);
  shBatherArm.rotation.z = -0.6;
  showerGroup.add(shBatherArm);
  showerGroup.position.set(-26, 0.05, -8);
  group.add(showerGroup);

  // Submarine surfacing offshore (long dark hull, conning tower, periscope, wake)
  const subGroup = new THREE.Group();
  const subHullMat = new THREE.MeshStandardMaterial({ color: 0x202830, metalness: 0.6, roughness: 0.45 });
  const subHull = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 7.0, 18), subHullMat);
  subHull.rotation.z = Math.PI / 2;
  subHull.position.y = 0.55;
  subGroup.add(subHull);
  // tapered bow + stern caps
  const subBow = new THREE.Mesh(new THREE.SphereGeometry(0.9, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), subHullMat);
  subBow.rotation.z = -Math.PI / 2;
  subBow.position.set(3.5, 0.55, 0);
  subGroup.add(subBow);
  const subStern = new THREE.Mesh(new THREE.SphereGeometry(0.9, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), subHullMat);
  subStern.rotation.z = Math.PI / 2;
  subStern.position.set(-3.5, 0.55, 0);
  subGroup.add(subStern);
  // conning tower (sail)
  const subSailMat = new THREE.MeshStandardMaterial({ color: 0x181c22, metalness: 0.5, roughness: 0.5 });
  const subSail = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 0.7), subSailMat);
  subSail.position.set(0, 1.4, 0);
  subGroup.add(subSail);
  // periscope
  const subPeriscope = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8), subSailMat);
  subPeriscope.position.set(0.2, 2.1, 0);
  subGroup.add(subPeriscope);
  const subPerHead = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.18), subSailMat);
  subPerHead.position.set(0.3, 2.4, 0);
  subGroup.add(subPerHead);
  // dive plane
  const subPlane = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 0.5), subHullMat);
  subPlane.position.set(0.3, 0.95, 0);
  subGroup.add(subPlane);
  // wake / foam ring
  const subWakeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
  const subWake = new THREE.Mesh(new THREE.RingGeometry(2.0, 4.5, 28), subWakeMat);
  subWake.rotation.x = -Math.PI / 2;
  subWake.position.y = 0.06;
  subGroup.add(subWake);
  subGroup.position.set(70, 0, -90);
  subGroup.rotation.y = 0.3;
  group.add(subGroup);

  // Beach wedding arch + couple
  const wedGroup = new THREE.Group();
  const wedArchMat = new THREE.MeshLambertMaterial({ color: 0xfaf3e6 });
  const wedPostGeom = new THREE.CylinderGeometry(0.07, 0.07, 2.4, 10);
  const wedPostL = new THREE.Mesh(wedPostGeom, wedArchMat);
  wedPostL.position.set(-1.0, 1.2, 0);
  wedGroup.add(wedPostL);
  const wedPostR = new THREE.Mesh(wedPostGeom, wedArchMat);
  wedPostR.position.set(1.0, 1.2, 0);
  wedGroup.add(wedPostR);
  // arched top - use TorusGeometry half
  const wedTop = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.07, 8, 18, Math.PI), wedArchMat);
  wedTop.position.set(0, 2.4, 0);
  wedGroup.add(wedTop);
  // floral decorations on arch (clusters of pink/white spheres)
  const wedFlowerGeom = new THREE.SphereGeometry(0.12, 8, 6);
  const wedFlowerMats = [
    new THREE.MeshLambertMaterial({ color: 0xffb6c1 }),
    new THREE.MeshLambertMaterial({ color: 0xffffff }),
    new THREE.MeshLambertMaterial({ color: 0xffd6e0 }),
    new THREE.MeshLambertMaterial({ color: 0xffe4b5 }),
  ];
  const wedFlowers = [];
  for (let i = 0; i < 18; i++) {
    const ang = Math.PI * (i / 17);
    const r = 1.0;
    const f = new THREE.Mesh(wedFlowerGeom, wedFlowerMats[i % wedFlowerMats.length]);
    f.position.set(Math.cos(ang) * r, 2.4 + Math.sin(ang) * r, (Math.random() - 0.5) * 0.2);
    wedFlowers.push(f);
    wedGroup.add(f);
  }
  // greenery base bunches at posts
  for (let p of [-1.0, 1.0]) {
    for (let j = 0; j < 5; j++) {
      const g1 = new THREE.Mesh(wedFlowerGeom, new THREE.MeshLambertMaterial({ color: 0x4a7a3a }));
      g1.position.set(p + (Math.random() - 0.5) * 0.3, 0.15 + j * 0.18, (Math.random() - 0.5) * 0.25);
      wedGroup.add(g1);
    }
  }
  // bride (white dress, dark hair)
  const wedBride = new THREE.Group();
  const wedBrideDress = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.3, 14), new THREE.MeshLambertMaterial({ color: 0xfffafa }));
  wedBrideDress.position.y = 0.65;
  wedBride.add(wedBrideDress);
  const wedBrideTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.4, 10), new THREE.MeshLambertMaterial({ color: 0xfffafa }));
  wedBrideTorso.position.y = 1.5;
  wedBride.add(wedBrideTorso);
  const wedBrideHead = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), new THREE.MeshLambertMaterial({ color: 0xffd5b3 }));
  wedBrideHead.position.y = 1.85;
  wedBride.add(wedBrideHead);
  const wedBrideHair = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x3a2410 }));
  wedBrideHair.position.y = 1.92;
  wedBride.add(wedBrideHair);
  // bouquet
  const wedBouquet = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), wedFlowerMats[0]);
  wedBouquet.position.set(0.18, 1.25, 0.15);
  wedBride.add(wedBouquet);
  wedBride.position.set(-0.35, 0, 0.4);
  wedGroup.add(wedBride);
  // groom (dark suit, light shirt)
  const wedGroom = new THREE.Group();
  const wedGroomLegs = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.9, 10), new THREE.MeshLambertMaterial({ color: 0x202028 }));
  wedGroomLegs.position.y = 0.45;
  wedGroom.add(wedGroomLegs);
  const wedGroomTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.9, 10), new THREE.MeshLambertMaterial({ color: 0x202028 }));
  wedGroomTorso.position.y = 1.35;
  wedGroom.add(wedGroomTorso);
  const wedGroomHead = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), new THREE.MeshLambertMaterial({ color: 0xffd5b3 }));
  wedGroomHead.position.y = 1.95;
  wedGroom.add(wedGroomHead);
  const wedGroomHair = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x6a4424 }));
  wedGroomHair.position.y = 2.02;
  wedGroom.add(wedGroomHair);
  // groom's bow tie
  const wedGroomTie = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.04), new THREE.MeshLambertMaterial({ color: 0x880000 }));
  wedGroomTie.position.set(0, 1.72, 0.18);
  wedGroom.add(wedGroomTie);
  wedGroom.position.set(0.35, 0, 0.4);
  wedGroup.add(wedGroom);
  // aisle runner
  const wedRunner = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 4.0), new THREE.MeshLambertMaterial({ color: 0xfff5e6 }));
  wedRunner.rotation.x = -Math.PI / 2;
  wedRunner.position.set(0, 0.02, 2.0);
  wedGroup.add(wedRunner);
  // a couple of guest chairs
  const wedChairMat = new THREE.MeshLambertMaterial({ color: 0xf0e6d6 });
  for (let cz = 1.6; cz <= 3.4; cz += 0.9) {
    for (let cx of [-1.2, 1.2]) {
      const ch = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.3), wedChairMat);
      ch.position.set(cx, 0.35, cz);
      wedGroup.add(ch);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.05), wedChairMat);
      back.position.set(cx, 0.6, cz + 0.13);
      wedGroup.add(back);
      const lg1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.35, 0.05), wedChairMat);
      lg1.position.set(cx - 0.15, 0.18, cz - 0.12);
      wedGroup.add(lg1);
      const lg2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.35, 0.05), wedChairMat);
      lg2.position.set(cx + 0.15, 0.18, cz - 0.12);
      wedGroup.add(lg2);
    }
  }
  wedGroup.position.set(20, 0.05, 22);
  wedGroup.rotation.y = -0.5;
  group.add(wedGroup);



  // --- v64: picnic table + boardwalk ice cream truck + breaching whale ----
  // Picnic table with red checked cloth, food, and tiny ants
  const picTableGroup = new THREE.Group();
  const picTopMat = new THREE.MeshLambertMaterial({ color: 0xa9764a });
  const picTop = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 1.0), picTopMat);
  picTop.position.y = 0.74;
  picTableGroup.add(picTop);
  const picBenchGeom = new THREE.BoxGeometry(2.6, 0.06, 0.3);
  const picBench1 = new THREE.Mesh(picBenchGeom, picTopMat);
  picBench1.position.set(0, 0.42, 0.6);
  picTableGroup.add(picBench1);
  const picBench2 = new THREE.Mesh(picBenchGeom, picTopMat);
  picBench2.position.set(0, 0.42, -0.6);
  picTableGroup.add(picBench2);
  const picLegMat = new THREE.MeshLambertMaterial({ color: 0x6e4a2a });
  const picLegGeom = new THREE.BoxGeometry(0.08, 0.74, 0.08);
  for (let lx of [-1.15, 1.15]) {
    for (let lz of [-0.4, 0.4]) {
      const lg = new THREE.Mesh(picLegGeom, picLegMat);
      lg.position.set(lx, 0.37, lz);
      picTableGroup.add(lg);
    }
  }
  // checkered cloth (canvas)
  const clothCanvas = document.createElement('canvas');
  clothCanvas.width = 64; clothCanvas.height = 64;
  const clothCtx = clothCanvas.getContext('2d');
  for (let cy = 0; cy < 8; cy++) {
    for (let cx = 0; cx < 8; cx++) {
      clothCtx.fillStyle = ((cx + cy) % 2 === 0) ? '#cc2222' : '#fff7e8';
      clothCtx.fillRect(cx * 8, cy * 8, 8, 8);
    }
  }
  const clothTex = new THREE.CanvasTexture(clothCanvas);
  clothTex.wrapS = clothTex.wrapT = THREE.RepeatWrapping;
  clothTex.repeat.set(3, 1.5);
  const picCloth = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.9), new THREE.MeshLambertMaterial({ map: clothTex }));
  picCloth.rotation.x = -Math.PI / 2;
  picCloth.position.y = 0.785;
  picTableGroup.add(picCloth);
  // food: watermelon slice (half disk), bread loaf, lemonade pitcher
  const picMelon = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10, 0, Math.PI), new THREE.MeshLambertMaterial({ color: 0xe2435a }));
  picMelon.rotation.z = Math.PI / 2;
  picMelon.position.set(-0.6, 0.86, 0.1);
  picTableGroup.add(picMelon);
  const picMelonRind = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 6, 14, Math.PI), new THREE.MeshLambertMaterial({ color: 0x3a8a3a }));
  picMelonRind.rotation.z = Math.PI / 2;
  picMelonRind.position.set(-0.6, 0.86, 0.1);
  picTableGroup.add(picMelonRind);
  const picBread = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.4, 4, 8), new THREE.MeshLambertMaterial({ color: 0xd9a55a }));
  picBread.rotation.z = Math.PI / 2;
  picBread.position.set(0.2, 0.88, -0.2);
  picTableGroup.add(picBread);
  const picPitcher = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.32, 12), new THREE.MeshLambertMaterial({ color: 0xfdee76, transparent: true, opacity: 0.85 }));
  picPitcher.position.set(0.85, 0.94, 0.2);
  picTableGroup.add(picPitcher);
  const picPitcherLid = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.03, 12), new THREE.MeshLambertMaterial({ color: 0xddd0a0 }));
  picPitcherLid.position.set(0.85, 1.12, 0.2);
  picTableGroup.add(picPitcherLid);
  // tiny ants (small dark spheres) marching toward food
  const antMat = new THREE.MeshLambertMaterial({ color: 0x101010 });
  const antGeom = new THREE.SphereGeometry(0.03, 6, 5);
  const ants = [];
  for (let ai = 0; ai < 9; ai++) {
    const a = new THREE.Mesh(antGeom, antMat);
    ants.push({ mesh: a, phase: ai / 9, line: ai % 3 });
    picTableGroup.add(a);
  }
  // grass patch
  const picGrassMat = new THREE.MeshLambertMaterial({ color: 0x6a9a48 });
  const picGrass = new THREE.Mesh(new THREE.CircleGeometry(2.0, 16), picGrassMat);
  picGrass.rotation.x = -Math.PI / 2;
  picGrass.position.y = 0.04;
  picTableGroup.add(picGrass);
  picTableGroup.position.set(-32, 0.05, 4);
  picTableGroup.rotation.y = 0.3;
  group.add(picTableGroup);

  // Boardwalk ice cream truck w/ vendor and customer
  const ictGroup = new THREE.Group();
  const ictBodyMat = new THREE.MeshStandardMaterial({ color: 0xeed8f0, metalness: 0.3, roughness: 0.5 });
  const ictBody = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.4, 1.2), ictBodyMat);
  ictBody.position.y = 0.95;
  ictGroup.add(ictBody);
  const ictCabMat = new THREE.MeshStandardMaterial({ color: 0xeed8f0, metalness: 0.3, roughness: 0.5 });
  const ictCab = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.0, 1.2), ictCabMat);
  ictCab.position.set(1.7, 0.75, 0);
  ictGroup.add(ictCab);
  const ictWindshield = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 1.0), new THREE.MeshLambertMaterial({ color: 0x7090b0, transparent: true, opacity: 0.6 }));
  ictWindshield.position.set(2.18, 1.0, 0);
  ictGroup.add(ictWindshield);
  // serve window
  const ictServe = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 0.8), new THREE.MeshLambertMaterial({ color: 0x202020 }));
  ictServe.position.set(-0.02, 1.1, 0.61);
  ictGroup.add(ictServe);
  // sign on top: ICE CREAM (canvas)
  const ictSignCanvas = document.createElement('canvas');
  ictSignCanvas.width = 256; ictSignCanvas.height = 64;
  const ictSignCtx = ictSignCanvas.getContext('2d');
  ictSignCtx.fillStyle = '#fff';
  ictSignCtx.fillRect(0, 0, 256, 64);
  ictSignCtx.fillStyle = '#d83a8a';
  ictSignCtx.font = 'bold 36px sans-serif';
  ictSignCtx.textAlign = 'center';
  ictSignCtx.fillText('ICE CREAM', 128, 46);
  const ictSignTex = new THREE.CanvasTexture(ictSignCanvas);
  const ictSign = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.4, 0.05), new THREE.MeshBasicMaterial({ map: ictSignTex }));
  ictSign.position.set(0, 1.85, 0);
  ictGroup.add(ictSign);
  // wheels
  const ictWheelMat = new THREE.MeshLambertMaterial({ color: 0x202020 });
  const ictWheelGeom = new THREE.CylinderGeometry(0.28, 0.28, 0.18, 14);
  const ictWheelPos = [[-0.9, 0.28, 0.65], [-0.9, 0.28, -0.65], [1.5, 0.28, 0.65], [1.5, 0.28, -0.65]];
  ictWheelPos.forEach(p => {
    const w = new THREE.Mesh(ictWheelGeom, ictWheelMat);
    w.rotation.x = Math.PI / 2;
    w.position.set(p[0], p[1], p[2]);
    ictGroup.add(w);
  });
  // giant ice cream cone on roof
  const ictConeRoof = new THREE.Group();
  const ictConePart = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.6, 14), new THREE.MeshLambertMaterial({ color: 0xd9a55a }));
  ictConePart.rotation.x = Math.PI;
  ictConePart.position.y = 0.3;
  ictConeRoof.add(ictConePart);
  const ictScoop1 = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10), new THREE.MeshLambertMaterial({ color: 0xff8eb0 }));
  ictScoop1.position.y = 0.7;
  ictConeRoof.add(ictScoop1);
  const ictScoop2 = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 10), new THREE.MeshLambertMaterial({ color: 0xfff5b0 }));
  ictScoop2.position.y = 1.0;
  ictConeRoof.add(ictScoop2);
  ictConeRoof.position.set(-0.5, 1.65, 0);
  ictGroup.add(ictConeRoof);
  // vendor (in window)
  const ictVendor = new THREE.Group();
  const ictVendorBody = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.7, 8), new THREE.MeshLambertMaterial({ color: 0xffffff }));
  ictVendorBody.position.y = 0.95;
  ictVendor.add(ictVendorBody);
  const ictVendorHead = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), new THREE.MeshLambertMaterial({ color: 0xffd5b3 }));
  ictVendorHead.position.y = 1.45;
  ictVendor.add(ictVendorHead);
  const ictVendorHat = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 12), new THREE.MeshLambertMaterial({ color: 0xff66aa }));
  ictVendorHat.position.y = 1.6;
  ictVendor.add(ictVendorHat);
  ictVendor.position.set(-0.3, 0, 0.4);
  ictGroup.add(ictVendor);
  // customer at window with cone
  const ictCustomer = new THREE.Group();
  const ictCustBody = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.85, 8), new THREE.MeshLambertMaterial({ color: 0x4eb45e }));
  ictCustBody.position.y = 0.85;
  ictCustomer.add(ictCustBody);
  const ictCustHead = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), new THREE.MeshLambertMaterial({ color: 0xffd5b3 }));
  ictCustHead.position.y = 1.4;
  ictCustomer.add(ictCustHead);
  const ictCustCone = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.2, 8), new THREE.MeshLambertMaterial({ color: 0xd9a55a }));
  ictCustCone.rotation.x = Math.PI;
  ictCustCone.position.set(0.0, 1.2, 0.2);
  ictCustomer.add(ictCustCone);
  const ictCustScoop = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshLambertMaterial({ color: 0xa67648 }));
  ictCustScoop.position.set(0.0, 1.32, 0.2);
  ictCustomer.add(ictCustScoop);
  ictCustomer.position.set(-0.2, 0, 1.4);
  ictGroup.add(ictCustomer);
  ictGroup.position.set(-22, 0.05, 28);
  ictGroup.rotation.y = -0.6;
  group.add(ictGroup);

  // Distant whale fluke breaching offshore (occasional — long cycle)
  const fluke2Group = new THREE.Group();
  const fluke2Mat = new THREE.MeshLambertMaterial({ color: 0x303a44 });
  // tail/peduncle (long cylinder rising)
  const fluke2Stem = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.4, 1.6, 12), fluke2Mat);
  fluke2Stem.position.y = 0.8;
  fluke2Group.add(fluke2Stem);
  // wide flukes (lobed shape via box flattened + tapered)
  const fluke2L = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.5), fluke2Mat);
  fluke2L.position.set(-0.6, 1.7, 0);
  fluke2L.rotation.z = -0.3;
  fluke2Group.add(fluke2L);
  const fluke2R = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.5), fluke2Mat);
  fluke2R.position.set(0.6, 1.7, 0);
  fluke2R.rotation.z = 0.3;
  fluke2Group.add(fluke2R);
  // splash particles (white spheres) at base
  const fluke2SplashMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
  const fluke2Splashes = [];
  for (let i = 0; i < 10; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), fluke2SplashMat);
    fluke2Splashes.push(s);
    fluke2Group.add(s);
  }
  fluke2Group.position.set(-90, -2, 50);
  fluke2Group.rotation.y = 0.7;
  fluke2Group.visible = false;
  group.add(fluke2Group);
  // cycle time tracker
  let fluke2Cycle = 0;



  // === v65 SCENE 1: Boardwalk arcade with skee-ball machine ===
  const arcadeGroup = new THREE.Group();
  // Cabinet body
  const arcCabMat = new THREE.MeshLambertMaterial({ color: 0x9b1c1c });
  const arcCab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 0.9), arcCabMat);
  arcCab.position.y = 0.7;
  arcadeGroup.add(arcCab);
  // Ball ramp (long sloped board sticking forward)
  const arcRampMat = new THREE.MeshLambertMaterial({ color: 0xfde68a });
  const arcRamp = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 2.4), arcRampMat);
  arcRamp.position.set(0, 0.42, 1.4);
  arcRamp.rotation.x = -0.18;
  arcadeGroup.add(arcRamp);
  // Side rails of ramp
  const arcRailMat = new THREE.MeshLambertMaterial({ color: 0x4b1d1d });
  const arcRailGeom = new THREE.BoxGeometry(0.06, 0.18, 2.4);
  const arcRailL = new THREE.Mesh(arcRailGeom, arcRailMat);
  arcRailL.position.set(-0.6, 0.5, 1.4);
  arcRailL.rotation.x = -0.18;
  arcadeGroup.add(arcRailL);
  const arcRailR = new THREE.Mesh(arcRailGeom, arcRailMat);
  arcRailR.position.set(0.6, 0.5, 1.4);
  arcRailR.rotation.x = -0.18;
  arcadeGroup.add(arcRailR);
  // Target ring backboard with concentric rings
  const arcBackMat = new THREE.MeshLambertMaterial({ color: 0x451a03 });
  const arcBack = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 0.05), arcBackMat);
  arcBack.position.set(0, 1.1, 0.55);
  arcBack.rotation.x = 0.5;
  arcadeGroup.add(arcBack);
  const arcRingColors = [0xfacc15, 0xf97316, 0xef4444, 0x22d3ee];
  arcRingColors.forEach((c, i) => {
    const r = 0.4 - i * 0.08;
    const arcRing = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.04, 6, 16),
      new THREE.MeshLambertMaterial({ color: c })
    );
    arcRing.position.set((i - 1.5) * 0.36, 1.1, 0.6);
    arcRing.rotation.x = 0.5;
    arcadeGroup.add(arcRing);
  });
  // Scoring lights row at top
  const arcScoreLights = [];
  for (let i = 0; i < 5; i++) {
    const arcLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xfde047 })
    );
    arcLight.position.set(-0.6 + i * 0.3, 1.55, -0.4);
    arcadeGroup.add(arcLight);
    arcScoreLights.push(arcLight);
  }
  // Skee balls on ramp
  const arcBallMat = new THREE.MeshLambertMaterial({ color: 0xe5e7eb });
  const arcBalls = [];
  for (let i = 0; i < 3; i++) {
    const arcBall = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), arcBallMat);
    arcBall.position.set(-0.3 + i * 0.3, 0.55, 1.6);
    arcadeGroup.add(arcBall);
    arcBalls.push(arcBall);
  }
  // Player figure (kid)
  const arcPlayer = new THREE.Group();
  const arcPlayerBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.8, 0.3),
    new THREE.MeshLambertMaterial({ color: 0x3b82f6 })
  );
  arcPlayerBody.position.y = 0.4;
  arcPlayer.add(arcPlayerBody);
  const arcPlayerHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 8, 8),
    new THREE.MeshLambertMaterial({ color: 0xfbcfa0 })
  );
  arcPlayerHead.position.y = 0.95;
  arcPlayer.add(arcPlayerHead);
  arcPlayer.position.set(0, 0, 2.8);
  arcadeGroup.add(arcPlayer);
  // Awning canopy
  const arcAwningMat = new THREE.MeshLambertMaterial({ color: 0xdc2626 });
  const arcAwning = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 1.4), arcAwningMat);
  arcAwning.position.set(0, 1.95, 0.2);
  arcAwning.rotation.x = -0.1;
  arcadeGroup.add(arcAwning);
  arcadeGroup.position.set(-12, 0.05, 6);
  arcadeGroup.rotation.y = -0.5;
  group.add(arcadeGroup);

  // === v65 SCENE 2: Tow boat with hawser line pulling sailboat ===
  const towSceneGroup = new THREE.Group();
  // Tow boat
  const towBoatGroup = new THREE.Group();
  const towHullMat = new THREE.MeshLambertMaterial({ color: 0x1e3a8a });
  const towHull = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.6, 1.0), towHullMat);
  towHull.position.y = 0.3;
  towBoatGroup.add(towHull);
  const towBow = new THREE.Mesh(
    new THREE.ConeGeometry(0.5, 1.0, 4),
    towHullMat
  );
  towBow.rotation.z = -Math.PI / 2;
  towBow.rotation.y = Math.PI / 4;
  towBow.position.set(1.7, 0.3, 0);
  towBoatGroup.add(towBow);
  const towCabin = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.7, 0.8),
    new THREE.MeshLambertMaterial({ color: 0xfafafa })
  );
  towCabin.position.set(0.2, 0.95, 0);
  towBoatGroup.add(towCabin);
  const towStack = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.18, 0.6, 8),
    new THREE.MeshLambertMaterial({ color: 0x111827 })
  );
  towStack.position.set(-0.3, 1.6, 0);
  towBoatGroup.add(towStack);
  // Stern bollard for hawser
  const towBollard = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.12, 0.3, 6),
    new THREE.MeshLambertMaterial({ color: 0x6b7280 })
  );
  towBollard.position.set(-1.0, 0.7, 0);
  towBoatGroup.add(towBollard);
  // Wake
  const towWakeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
  const towWake = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.6), towWakeMat);
  towWake.rotation.x = -Math.PI / 2;
  towWake.position.set(2.5, 0.04, 0);
  towBoatGroup.add(towWake);
  towBoatGroup.position.set(0, 0, 0);
  towSceneGroup.add(towBoatGroup);
  // Sailboat being towed (no sails up - that's why it needs towing)
  const towedSailGroup = new THREE.Group();
  const towedHull = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 0.4, 0.7),
    new THREE.MeshLambertMaterial({ color: 0xfde68a })
  );
  towedHull.position.y = 0.2;
  towedSailGroup.add(towedHull);
  const towedBow = new THREE.Mesh(
    new THREE.ConeGeometry(0.35, 0.7, 4),
    new THREE.MeshLambertMaterial({ color: 0xfde68a })
  );
  towedBow.rotation.z = -Math.PI / 2;
  towedBow.rotation.y = Math.PI / 4;
  towedBow.position.set(1.3, 0.2, 0);
  towedSailGroup.add(towedBow);
  const towedMast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 2.4, 6),
    new THREE.MeshLambertMaterial({ color: 0xa16207 })
  );
  towedMast.position.set(0, 1.4, 0);
  towedSailGroup.add(towedMast);
  // Furled sail (rolled up bundle around mast)
  const towedFurled = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 1.8, 6),
    new THREE.MeshLambertMaterial({ color: 0xfafaf9 })
  );
  towedFurled.position.set(0, 1.3, 0);
  towedSailGroup.add(towedFurled);
  // Sailboat bow cleat
  const towedCleat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 0.2, 6),
    new THREE.MeshLambertMaterial({ color: 0x6b7280 })
  );
  towedCleat.position.set(1.5, 0.5, 0);
  towedSailGroup.add(towedCleat);
  towedSailGroup.position.set(-4.5, 0, 0);
  towSceneGroup.add(towedSailGroup);
  // Hawser line (rope between bollard and cleat)
  const hawserMat = new THREE.MeshLambertMaterial({ color: 0xfafaf9 });
  const hawserLine = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 4.0, 6),
    hawserMat
  );
  hawserLine.rotation.z = Math.PI / 2;
  hawserLine.position.set(-2.0, 0.6, 0);
  towSceneGroup.add(hawserLine);
  towSceneGroup.position.set(45, 0.05, -22);
  towSceneGroup.rotation.y = -0.3;
  group.add(towSceneGroup);

  // === v65 SCENE 3: Cliff diver from rocks ===
  const cliffDiveGroup = new THREE.Group();
  // Cliff rocks (stacked angular blocks)
  const diverRockMat = new THREE.MeshLambertMaterial({ color: 0x57534e });
  const cliffRock1 = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3.0, 2.0), diverRockMat);
  cliffRock1.position.set(0, 1.5, 0);
  cliffDiveGroup.add(cliffRock1);
  const cliffRock2 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.8, 1.6), diverRockMat);
  cliffRock2.position.set(0.4, 3.7, 0.2);
  cliffRock2.rotation.y = 0.2;
  cliffDiveGroup.add(cliffRock2);
  const cliffRock3 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 1.4), diverRockMat);
  cliffRock3.position.set(0.6, 4.9, 0.3);
  cliffDiveGroup.add(cliffRock3);
  // Diver figure (mid-dive)
  const cliffDiver = new THREE.Group();
  const cliffDiverBody = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.18, 0.7, 4, 8),
    new THREE.MeshLambertMaterial({ color: 0xef4444 })
  );
  cliffDiver.add(cliffDiverBody);
  const cliffDiverHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 8, 8),
    new THREE.MeshLambertMaterial({ color: 0xfbcfa0 })
  );
  cliffDiverHead.position.y = 0.55;
  cliffDiver.add(cliffDiverHead);
  // Arms together (streamlined dive)
  const cliffArmGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 6);
  const cliffArmMat = new THREE.MeshLambertMaterial({ color: 0xfbcfa0 });
  const cliffArmL = new THREE.Mesh(cliffArmGeom, cliffArmMat);
  cliffArmL.position.set(-0.05, 0.65, 0);
  cliffDiver.add(cliffArmL);
  const cliffArmR = new THREE.Mesh(cliffArmGeom, cliffArmMat);
  cliffArmR.position.set(0.05, 0.65, 0);
  cliffDiver.add(cliffArmR);
  cliffDiveGroup.add(cliffDiver);
  // Splash sprites at water entry point
  const cliffSplashMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
  const cliffSplashes = [];
  for (let i = 0; i < 8; i++) {
    const cliffSplash = new THREE.Mesh(
      new THREE.ConeGeometry(0.15, 0.5, 4),
      cliffSplashMat
    );
    const ang = (i / 8) * Math.PI * 2;
    cliffSplash.position.set(Math.cos(ang) * 0.4, 0.05, Math.sin(ang) * 0.4);
    cliffSplash.rotation.z = -Math.cos(ang) * 0.3;
    cliffSplash.rotation.x = Math.sin(ang) * 0.3;
    cliffSplash.visible = false;
    cliffDiveGroup.add(cliffSplash);
    cliffSplashes.push(cliffSplash);
  }
  cliffDiveGroup.position.set(-65, 0.05, -55);
  cliffDiveGroup.rotation.y = 0.4;
  group.add(cliffDiveGroup);
  // dive cycle position [0..1]: 0 = top of rock, 1 = entry
  let cliffDiveCycle = 0;
  const cliffDiveTopY = 5.5;
  const cliffDiveTopX = 0.6;
  const cliffDiveTopZ = 0.3;
  const cliffDiveEntryX = 4.5;
  const cliffDiveEntryY = 0;
  const cliffDiveEntryZ = 1.5;


  // --- v21 init complete ----------------------------------------------------

  // --- v15 init complete ----------------------------------------------------


  function update(dt) {
    t += dt;
    beamPivot.rotation.y = t * 0.6;
    columnGroup.children.forEach((slab, i) => {
      const phase = slab.userData.shimmerPhase;
      slab.material.opacity = 0.24 + 0.12 * Math.sin(t * 1.4 + phase + i);
    });
    sea.position.y = Math.sin(t * 0.6) * 0.05;
    foam.position.y = 0.02 + Math.sin(t * 0.6) * 0.05;
    foam.material.opacity = 0.32 + 0.12 * Math.sin(t * 1.6);
    // Sailboat slowly sails in wide circle around harbor
    const boatAngle = t * 0.07;
    const boatR = 12;
    boat.position.x = Math.cos(boatAngle) * boatR;
    boat.position.z = Math.sin(boatAngle) * boatR;
    boat.position.y = 0.25 + Math.sin(t * 0.9 + 1.2) * 0.06;
    boat.rotation.y = -boatAngle - Math.PI / 2;
    boat.rotation.z = Math.sin(t * 0.7) * 0.03;
    lantern.material.emissiveIntensity = 0.85 + 0.12 * Math.sin(t * 5.2);
    lanternLight.intensity = 1.05 + 0.18 * Math.sin(t * 5.2);
    kraken.position.x = Math.sin(t * 0.07) * 3.2;
    kraken.position.z = Math.cos(t * 0.05) * 3.2;
    kraken.rotation.y = t * 0.04;
    // Tentacles sway with kraken
    tentacles.forEach((tt, i) => {
      tt.rotation.y = t * 0.04 + Math.sin(t * 0.5 + tt.userData.basePhase) * 0.15;
      tt.material.opacity = 0.55 + 0.12 * Math.sin(t * 0.8 + tt.userData.basePhase);
    });
    // Kites flutter
    kites.forEach((k, i) => {
      k.position.y = 11 + Math.sin(t * 0.9 + k.userData.phase) * 0.6;
      k.position.x = k.userData.baseX + Math.sin(t * 0.6 + k.userData.phase) * 0.3;
      k.rotation.z = Math.sin(t * 1.4 + k.userData.phase) * 0.25;
      k.rotation.y = Math.sin(t * 0.7 + k.userData.phase) * 0.2;
    });
    // Hot air balloon drifts in slow orbit
    const bx = 12 + Math.sin(t * 0.06) * 6;
    const bz = -8 + Math.cos(t * 0.05) * 6;
    balloonGroup.position.set(bx, 14 + Math.sin(t * 0.4) * 0.4, bz);
    balloon.material.emissiveIntensity = 0.18 + 0.08 * Math.sin(t * 1.7);
    // Rainbow shimmer
    rainbowGroup.children.forEach((ring, i) => {
      ring.material.opacity = 0.28 + 0.10 * Math.sin(t * 0.6 + i * 0.4);
    });
    // Orca breach arc — emerges every ~12 seconds
    const orcaCycle = (t * 0.08) % 1;
    if (orcaCycle < 0.18) {
      const u = orcaCycle / 0.18;
      const arc = Math.sin(u * Math.PI);
      orca.position.y = -0.5 + arc * 4.2;
      orca.rotation.z = (u - 0.5) * 0.9;
      orca.position.x = -18 + (u - 0.5) * 1.4;
      orcaSpray.material.opacity = (u > 0.85 ? (u - 0.85) * 4.5 : 0);
      orcaSpray.position.set(orca.position.x, Math.max(0.2, orca.position.y - 0.3), orca.position.z);
      orcaSpray.scale.setScalar(1 + (u - 0.85) * 6);
    } else {
      orca.position.y = -0.5;
      orca.rotation.z = 0;
      orca.position.x = -18;
      orcaSpray.material.opacity = 0;
    }
    // Albatross circling overhead, banking on turns
    const albAngle = t * 0.18;
    albatross.position.set(Math.cos(albAngle) * 18, 19 + Math.sin(t * 0.4) * 0.8, Math.sin(albAngle) * 18);
    albatross.rotation.y = -albAngle + Math.PI / 2;
    albatross.rotation.z = Math.sin(t * 0.18) * 0.25;
    // Sea otter bobs gently and rotates slowly
    otter.position.y = 0.2 + Math.sin(t * 0.7 + 0.3) * 0.05;
    otter.rotation.y = Math.sin(t * 0.15) * 0.4 + Math.PI * 0.3;
    otter.position.x = 10.5 + Math.sin(t * 0.12) * 0.4;
    otter.position.z = 4.5 + Math.cos(t * 0.10) * 0.4;
    // Distant ship bobs on horizon
    distantShip.position.y = 0.3 + Math.sin(t * 0.5 + 0.7) * 0.08;
    distantShip.rotation.z = Math.sin(t * 0.4) * 0.02;
    // Lightning flash — rare, ~once every 22s
    const flashCycle = (t * 0.045) % 1;
    if (flashCycle < 0.04) {
      const u = flashCycle / 0.04;
      lightning.material.opacity = Math.sin(u * Math.PI) * 0.7;
    } else {
      lightning.material.opacity = 0;
    }
    // Aurora ribbons shimmer & drift sideways slowly
    auroraGroup.children.forEach((mesh, i) => {
      mesh.material.opacity = 0.14 + 0.10 * Math.sin(t * 0.4 + mesh.userData.basePhase);
      mesh.position.x = Math.sin(t * 0.05 + i * 0.4) * 1.5;
    });
    auroraReflection.material.opacity = 0.06 + 0.06 * Math.sin(t * 0.7);
    // Kelp strands sway with current
    kelpStrands.forEach((strand, i) => {
      strand.children.forEach((seg, s) => {
        if (seg.userData.segIdx !== undefined) {
          const sway = Math.sin(t * 0.8 + i * 0.5 + s * 0.3) * 0.06 * (s + 1);
          seg.rotation.z = sway;
        }
      });
    });

    // v5 animations
    // Whale spout cycle ~18s
    const wsCycle = (t * 0.055 + 0.3) % 1;
    if (wsCycle < 0.18) {
      const u = wsCycle / 0.18;
      whaleSpout.material.opacity = Math.sin(u * Math.PI) * 0.55;
      whaleSpout.scale.set(1 + u * 0.4, 0.4 + u * 1.6, 1 + u * 0.4);
      whaleSpoutCloud.material.opacity = u > 0.45 ? Math.sin((u - 0.45) / 0.55 * Math.PI) * 0.45 : 0;
      whaleSpoutCloud.scale.setScalar(1 + u * 1.5);
      whaleBack.position.y = 0.05 + Math.sin(u * Math.PI) * 0.4;
    } else {
      whaleSpout.material.opacity = 0;
      whaleSpoutCloud.material.opacity = 0;
      whaleBack.position.y = 0.05;
    }
    // Sea turtle glides in slow figure-8 near sailboat
    const tt = t * 0.06 + 1.0;
    turtle.position.x = Math.cos(tt) * 13;
    turtle.position.z = Math.sin(tt * 2) * 6;
    turtle.position.y = -0.2 + Math.sin(t * 0.5) * 0.08;
    turtle.rotation.y = -tt + Math.PI / 2 + Math.cos(tt * 2) * 2 * 0.5;
    turtle.rotation.z = Math.sin(t * 0.3) * 0.08;
    flippers.forEach((fl, i) => {
      fl.rotation.x = Math.sin(t * 2.5 + fl.userData.basePhase) * 0.5;
    });
    // Sunset shader pulse
    sunsetMat.uniforms.uTime.value = t;
    // Cottage window flickers warmly
    cottageWindow.material.opacity = 0.85 + 0.13 * Math.sin(t * 1.8);
    // Smoke rises and fades
    smokeParticles.forEach((sp, i) => {
      const lifeT = ((t * 0.25 + i * 0.18) % 1.5);
      sp.position.y = sp.userData.baseY + lifeT * 1.4;
      sp.position.x = -0.4 + Math.sin(t * 0.6 + i) * 0.15 + lifeT * 0.2;
      sp.material.opacity = Math.max(0, 0.55 - lifeT * 0.4);
      sp.scale.setScalar(0.8 + lifeT * 0.6);
    });
    // Plankton pulse
    planktonMat.uniforms.uTime.value = t;
    // Fireworks burst ~once every 35s
    const fwCycle = (t * 0.0285) % 1;
    if (fwCycle < 0.12) {
      const u = fwCycle / 0.12;
      const positions = fireworks.geometry.attributes.position.array;
      const vel = fireworks.userData.vel;
      const bp = fireworks.userData.basePos;
      const dur = u * 1.8;
      for (let i = 0; i < fwCount; i++) {
        positions[i * 3 + 0] = bp.x + vel[i * 3 + 0] * dur;
        positions[i * 3 + 1] = bp.y + vel[i * 3 + 1] * dur - 0.5 * dur * dur;
        positions[i * 3 + 2] = bp.z + vel[i * 3 + 2] * dur;
      }
      fireworks.geometry.attributes.position.needsUpdate = true;
      fireworks.material.opacity = (1 - u) * 0.95;
    } else {
      fireworks.material.opacity = 0;
    }
    // Compass slowly rotates
    compassGroup.rotation.y = t * 0.05;


    // v6 animations
    // School of fish darting in figure-8 with wiggle
    simpleFishSchool.forEach((fish, i) => {
      const fa = t * fish.userData.speed + fish.userData.offset;
      fish.position.x = Math.cos(fa) * fish.userData.radius + Math.sin(fa * 2) * 1.2;
      fish.position.z = Math.sin(fa * 2) * fish.userData.radius * 0.5 + Math.cos(fa) * 1.2;
      fish.position.y = fish.userData.yBase + Math.sin(t * 1.5 + i) * 0.08;
      fish.rotation.y = -fa - Math.PI / 2 + Math.cos(fa * 2) * 0.3;
      fish.rotation.z = Math.sin(t * 4 + i * 0.5) * 0.15;
    });
    // Treasure aura pulse
    chestAura.material.opacity = 0.14 + 0.08 * Math.sin(t * 1.6);
    chestAura.scale.setScalar(1 + 0.1 * Math.sin(t * 1.6));
    // Constellation stars twinkle
    constStars.forEach((star) => {
      star.material.opacity = 0.6 + 0.35 * Math.sin(t * 2 + star.userData.phase);
      star.scale.setScalar(0.85 + 0.25 * Math.sin(t * 1.5 + star.userData.phase));
    });
    constGroup.rotation.y = Math.sin(t * 0.05) * 0.04;
    // Giant squid drifts in slow wide ellipse, tentacles curl
    const sqA = t * 0.025 + 2.0;
    squidGroup.position.x = Math.cos(sqA) * 14;
    squidGroup.position.z = Math.sin(sqA) * 9;
    squidGroup.position.y = -3.5 + Math.sin(t * 0.3) * 0.3;
    squidGroup.rotation.y = -sqA + Math.PI / 2;
    squidTentacles.forEach((tube, ti) => {
      tube.rotation.x = Math.sin(t * 0.7 + tube.userData.basePhase) * 0.2;
      tube.rotation.z = Math.cos(t * 0.5 + tube.userData.basePhase) * 0.15;
    });
    squidEye.material.color.setHSL(0, 0.9, 0.4 + 0.15 * Math.sin(t * 3));
    // Buoy bobs and rocks
    buoyGroup.position.y = Math.sin(t * 1.1) * 0.2;
    buoyGroup.rotation.z = Math.sin(t * 1.1) * 0.08;
    buoyGroup.rotation.x = Math.cos(t * 0.9) * 0.06;
    buoyLight.material.color.setRGB(0.2, 1.0 - 0.5 * Math.abs(Math.sin(t * 0.8)), 0.4);
    // Coral tips pulse
    corals.forEach((coral, i) => {
      const tip = coral.children[coral.children.length - 1];
      tip.material.opacity = 0.55 + 0.35 * Math.sin(t * 1.2 + coral.userData.glowPhase);
    });

    // v7 animations
    // Sandy seabed shimmer (subtle ripple opacity)
    sandRipples.forEach((ring, i) => {
      ring.material.opacity = 0.32 + 0.18 * Math.sin(t * 0.8 + i * 0.5);
    });
    // Pelican head bob: small periodic head tilt
    const headBob = Math.sin(t * 0.7) * 0.05 + Math.sin(t * 1.3) * 0.02;
    pelicanGroup.rotation.z = headBob;
    pelicanGroup.position.y = 3.2 + Math.sin(t * 0.5) * 0.04;
    // Sea horses drift up/down with slight horizontal sway
    seahorses.forEach((sh, i) => {
      sh.position.y = sh.userData.baseY + Math.sin(t * 0.9 + sh.userData.phase) * 0.35;
      sh.position.x = sh.userData.baseX + Math.sin(t * 0.4 + sh.userData.phase) * 0.4;
      sh.rotation.z = Math.sin(t * 0.6 + sh.userData.phase) * 0.15;
    });
    // Pirate ghost ship sails opposite direction far out
    const ghostA = -t * 0.018 + 1.7;
    const ghostR = 26;
    ghostShip.position.x = Math.cos(ghostA) * ghostR;
    ghostShip.position.z = Math.sin(ghostA) * ghostR;
    ghostShip.position.y = 0.3 + Math.sin(t * 0.5) * 0.18;
    ghostShip.rotation.y = -ghostA + Math.PI / 2;
    // Pulsing ghostly opacity
    ghostShip.children.forEach((c) => {
      if (c.material && c.material.opacity !== undefined && c !== ghostHalo) {
        c.material.opacity = 0.35 + 0.18 * Math.sin(t * 0.9);
      }
    });
    ghostHalo.material.opacity = 0.06 + 0.04 * Math.sin(t * 0.7);
    // Jumping dolphins synchronized arc cycle ~7s
    const dolphCycle = 7.0;
    const dolphPhase = (t % dolphCycle) / dolphCycle; // 0..1
    dolphins.forEach((d, di) => {
      // Arc travels from x=18 to x=-18 across z=18
      const offset = di * 1.2;
      const px = 18 - dolphPhase * 36 + offset;
      const py = -0.3 + Math.sin(dolphPhase * Math.PI) * 2.8;
      const pz = 18 + di * 1.6;
      d.position.set(px, py, pz);
      // Rotate to follow arc tangent
      const tangent = Math.cos(dolphPhase * Math.PI);
      d.rotation.z = -tangent * 0.6;
      d.rotation.y = Math.PI;
      d.visible = dolphPhase > 0.02 && dolphPhase < 0.98;
    });
    // Fog bank slow horizontal drift
    fogBank.position.x = Math.sin(t * 0.06) * 8;
    fogBank.material.opacity = 0.16 + 0.05 * Math.sin(t * 0.3);
    // Shooting star over Anchorage every ~14s, traversal lasts 1.5s
    const ssCycle = 14.0;
    const ssPhase = t % ssCycle;
    if (ssPhase < 1.5) {
      shootingStar.visible = true;
      const sp = ssPhase / 1.5;
      const sx = -22 + sp * 44;
      const sy = 22 - sp * 4;
      const sz = -15;
      shootingStar.position.set(sx, sy, sz);
      // Trail meshes positioned behind, fading
      ssTrailMeshes.forEach((tm, i) => {
        const tlag = (i + 1) * 0.4;
        tm.position.set(-tlag, tlag * 0.18, 0);
      });
    } else {
      shootingStar.visible = false;
    }
    // Sea spray trailing sailboat
    const sprayPosArr = spray.geometry.attributes.position.array;
    for (let i = 0; i < SPRAY_COUNT; i++) {
      sprayLifetimes[i] -= dt;
      if (sprayLifetimes[i] <= 0) {
        // Respawn slightly behind boat (boat is at boat.position)
        sprayPosArr[i * 3] = boat.position.x - Math.cos(boatAngle) * 0.6 + (Math.random() - 0.5) * 0.4;
        sprayPosArr[i * 3 + 1] = 0.08 + Math.random() * 0.08;
        sprayPosArr[i * 3 + 2] = boat.position.z - Math.sin(boatAngle) * 0.6 + (Math.random() - 0.5) * 0.4;
        sprayLifetimes[i] = 0.6 + Math.random() * 1.0;
      } else {
        sprayPosArr[i * 3 + 1] += dt * 0.05;
      }
    }
    spray.geometry.attributes.position.needsUpdate = true;
    spray.material.opacity = 0.45 + 0.2 * Math.sin(t * 1.2);


    // ===== v8 update =====
    // Mermaid hair gentle sway
    mermaidHair.rotation.z = Math.sin(t * 1.2) * 0.05;
    mermaidHair.position.x = -0.06 + Math.sin(t * 1.2) * 0.01;
    // Tail subtle flick
    tailFin.rotation.z = Math.PI / 2.4 + Math.sin(t * 0.9) * 0.08;

    // Lobster buoy bobbing
    lobsterBuoy.position.y = 0.1 + Math.sin(t * 1.1 + 0.3) * 0.08;
    lobsterBuoy.rotation.z = Math.sin(t * 1.1) * 0.18;

    // Bioluminescent jellies pulse + drift
    jellies.forEach((jelly, idx) => {
      const phase = jelly.userData.phase;
      const baseY = jelly.userData.baseY;
      jelly.position.y = baseY + Math.sin(t * 0.6 + phase) * 0.35;
      const pulse = 1 + Math.sin(t * 1.4 + phase) * 0.1;
      jelly.scale.set(pulse, pulse, pulse);
      // dome opacity pulses
      const dome = jelly.children[0];
      dome.material.opacity = 0.45 + 0.15 * Math.sin(t * 1.4 + phase);
      const halo = jelly.children[1];
      halo.material.opacity = 0.14 + 0.08 * Math.sin(t * 1.4 + phase);
    });

    // Moon orbits slowly around lighthouse
    const moonAng = t * 0.04;
    moonGroup.position.x = -12 + Math.sin(moonAng) * 1.2;
    moonGroup.position.y = 14 + Math.cos(moonAng) * 0.6;
    moonHalo.rotation.z = t * 0.08;

    // Foghorn ring pulse — every 7 seconds, expands to radius ~6
    foghornCycle = (foghornCycle + dt) % 7.0;
    if (foghornCycle < 2.4) {
      const fp = foghornCycle / 2.4;
      const fr = 0.6 + fp * 6.0;
      foghornRing.scale.set(fr, fr, 1);
      foghornRing.material.opacity = (1 - fp) * 0.55;
      foghornRing.visible = true;
    } else {
      foghornRing.visible = false;
    }

    // -- Anchorage v9 animation --
    monsterCycle = (monsterCycle + dt) % 28.0;
    const surfaceFraction = monsterCycle < 12 ? Math.min(1, monsterCycle / 1.5) * (monsterCycle > 10 ? Math.max(0, 1 - (monsterCycle - 10) / 2) : 1) : 0;
    monsterGroup.visible = monsterCycle < 12.5;
    if (monsterGroup.visible) {
      const ang = (monsterCycle / 28.0) * Math.PI * 2 + Math.PI * 0.5;
      const cx = 0, cz = 0;
      const rx = 22, rz = 16;
      const headX = cx + Math.cos(ang) * rx;
      const headZ = cz + Math.sin(ang) * rz;
      const tangent = new THREE.Vector2(-Math.sin(ang) * rx, Math.cos(ang) * rz).normalize();
      const heading = Math.atan2(tangent.x, tangent.y);
      monsterGroup.rotation.y = heading;
      monsterGroup.position.set(headX, 0, headZ);
      // place each part trailing along tangent
      monsterParts.forEach((p, i) => {
        const dz = -i * 1.45;
        p.mesh.position.x = 0;
        p.mesh.position.z = dz;
        const wave = Math.sin(t * 1.4 + p.phase) * 0.45;
        p.mesh.position.y = (i === 0 ? 0.65 : 0.35) + wave * surfaceFraction - (1 - surfaceFraction) * 1.6;
        // submerge fade
        p.mesh.scale.y = p.baseScaleY * (0.6 + 0.4 * surfaceFraction);
      });
      monsterSpoutMat.opacity = 0.55 * surfaceFraction;
      eyeMat.opacity = 0.55 + 0.4 * surfaceFraction;
    }

    // Bottle drifts in a slow loop and bobs
    {
      const ba = t * 0.18;
      bottleGroup.position.x = 11 + Math.sin(ba) * 2.4;
      bottleGroup.position.z = 6 + Math.cos(ba) * 1.6;
      bottleGroup.position.y = 0.05 + Math.sin(t * 1.6) * 0.08;
      bottleGroup.rotation.y = ba * 1.5;
      bottleGroup.rotation.x = Math.sin(t * 1.8) * 0.18;
    }

    // Keeper sways gently and lantern flickers
    keeperGroup.rotation.y = -Math.PI / 4 + Math.sin(t * 0.4) * 0.18;
    {
      const flick = 0.7 + Math.abs(Math.sin(t * 3.1)) * 0.5 + (Math.random() < 0.04 ? -0.4 : 0);
      keeperLanternLight.intensity = 0.6 + flick * 0.4;
      keeperLantern.material.emissiveIntensity = 0.6 + flick * 0.45;
      keeperLanternHaloMat.opacity = 0.4 + flick * 0.18;
    }

    // Crab walks (legs swing); body sways slightly
    legParts.forEach((lp) => {
      lp.mesh.rotation.x = Math.sin(t * 4.0 + lp.phase) * 0.55;
    });
    crabGroup.position.x = -3.2 + Math.sin(t * 1.2) * 0.4;
    crabGroup.rotation.y = Math.sin(t * 1.2) * 0.4;

    // Drone orbits the harbor at altitude
    droneOrbitT += dt;
    {
      const da = droneOrbitT * 0.45;
      droneGroup.position.set(Math.sin(da) * 18, 9 + Math.sin(t * 0.7) * 0.6, Math.cos(da) * 18);
      droneGroup.rotation.y = -da + Math.PI / 2;
      droneRotors.forEach((r, i) => { r.rotation.z = t * (40 + i * 2); r.material.opacity = 0.55 + Math.sin(t * 8 + i) * 0.18; });
      droneLed.material.color.setHSL((t * 0.2) % 1, 0.85, 0.55);
    }

    // Treasure clue gently bobs and tilts
    clueSprite.position.y = 0.6 + Math.sin(t * 1.1) * 0.18;
    clueSprite.material.rotation = Math.sin(t * 0.7) * 0.08;

    // Driftwood log bobs and slowly spins
    logGroup.position.y = 0.22 + Math.sin(t * 0.9) * 0.14;
    logGroup.rotation.y += dt * 0.05;
    logGroup.rotation.x = Math.sin(t * 1.1) * 0.05;

    // ANCHORAGE v10 ANIMATIONS ----------------------------------------

    // Tide cycle: gently rise/fall the sea + foam by ±0.16u over ~70s
    {
      const tide = Math.sin(t * (Math.PI * 2) / 70) * 0.16;
      sea.position.y = tide;
      foam.position.y = 0.02 + tide;
    }

    // Otter family: bob, slowly rotate, drift with little circle
    otterFamily.forEach((og, i) => {
      const ph = og.userData.phase || 0;
      og.position.y = -0.3 + Math.sin(t * 0.9 + ph) * 0.06;
      og.rotation.y = Math.sin(t * 0.18 + ph) * 0.45;
      og.position.x += Math.sin(t * 0.27 + ph) * dt * 0.12;
      og.position.z += Math.cos(t * 0.27 + ph) * dt * 0.12;
    });

    // Fisherman dinghy: sway gently, line tip oscillates and bobber bobs
    dinghyGroup.position.y = 0.05 + Math.sin(t * 0.7) * 0.06;
    dinghyGroup.rotation.z = Math.sin(t * 0.55) * 0.07;
    {
      const bob = dinghyGroup.userData.bobber;
      const fl = dinghyGroup.userData.fishLine;
      const lp = dinghyGroup.userData.linePts;
      if (bob && fl && lp) {
        bob.position.y = Math.sin(t * 1.6) * 0.06 - 0.02;
        // small twitch when "fish bites" every 11s
        const bite = (Math.sin(t * (Math.PI * 2) / 11) > 0.92) ? 0.18 : 0.0;
        bob.position.y -= bite;
        lp[1].set(bob.position.x, bob.position.y + 0.04, bob.position.z);
        fl.geometry.setFromPoints(lp);
        fl.geometry.attributes.position.needsUpdate = true;
      }
    }

    // Sand castle: flag flutter
    if (castleGroup.userData.flag) {
      castleGroup.userData.flag.rotation.y = Math.sin(t * 3.4) * 0.45;
    }

    // Distant whale fluke: surfaces ~10s of every 35s; fluke slap motion
    {
      const period = 35;
      const phase = (t % period) / period;
      const surface = phase > 0.05 && phase < 0.32; // ~9.5s window
      flukeGroup.visible = surface;
      if (surface) {
        const local = (phase - 0.05) / 0.27; // 0..1 across surface window
        // smooth in, slap, smooth out
        const ease = local < 0.5 ? local * 2 : (1 - local) * 2;
        flukeGroup.position.y = -3.0 + ease * 1.6;
        if (flukeGroup.userData.fluke) {
          flukeGroup.userData.fluke.rotation.x = Math.sin(local * Math.PI * 4) * 0.4;
        }
        // slow drift across the horizon
        flukeGroup.position.x = -22 + Math.sin(t * 0.07) * 4;
      }
    }

    // ANCHORAGE v11 ANIMATIONS ----------------------------------------

    // Orcas: travel along their offset on a slow circling path; surface
    // and dive periodically (sin wave on y), tail flukes oscillate.
    orcaPod.forEach((og) => {
      const ang = og.userData.ang + t * 0.06;
      const r = og.userData.r;
      og.position.x = Math.cos(ang) * r;
      og.position.z = Math.sin(ang) * r;
      // tangential heading
      og.rotation.y = -ang + Math.PI / 2;
      // surface/dive cycle ~14s, mostly submerged with a 3.5s breach window
      const cyc = (t * 0.45 + og.userData.ph) % (Math.PI * 2);
      const surface = Math.sin(cyc) > 0.55;
      const local = (Math.sin(cyc) - 0.55) / 0.45; // 0..1 over breach
      og.position.y = surface ? -0.4 + Math.max(0, local) * 0.9 : -1.1;
      og.visible = og.position.y > -1.05;
      if (og.userData.tail) {
        og.userData.tail.rotation.x = Math.sin(t * 2.2 + og.userData.ph) * 0.35;
      }
    });

    // Fog bank: drift each plane horizontally with slow phase, fade in over
    // ~80s and out over ~80s in a long oscillation so fog "rolls in" then
    // dissipates.
    {
      const envFade = (Math.sin(t * (Math.PI * 2) / 160) + 1) * 0.5; // 0..1 over 160s
      rollingFogBank.children.forEach((m) => {
        const bp = m.userData.basePos;
        const ph = m.userData.phase;
        const sp = m.userData.driftSpeed;
        m.position.x = bp.x + Math.sin(t * 0.05 + ph) * 4.0 + (t * sp) % 30 - 15;
        m.position.z = bp.z + Math.cos(t * 0.04 + ph) * 3.0;
        // gentle bob in altitude
        m.position.y = bp.y + Math.sin(t * 0.18 + ph) * 0.18;
        m.material.opacity = 0.55 * envFade + 0.05;
        m.rotation.z += dt * 0.02;
      });
    }

    // Seabirds: orbit lighthouse (origin), flap wings.
    seaBirdFlock.forEach((bg) => {
      const ang = bg.userData.phase + t * bg.userData.speed;
      const r = bg.userData.r;
      bg.position.x = Math.cos(ang) * r;
      bg.position.z = Math.sin(ang) * r;
      bg.position.y = bg.userData.h + Math.sin(t * 0.7 + bg.userData.phase) * 0.4;
      bg.rotation.y = -ang + Math.PI / 2;
      // small bank into the turn
      bg.rotation.z = -0.15;
      const flap = Math.sin(t * 6 + bg.userData.flap) * 0.6;
      if (bg.userData.wL && bg.userData.wR) {
        bg.userData.wL.rotation.x = -0.2 + flap;
        bg.userData.wR.rotation.x = 0.2 - flap;
      }
    });

    // ANCHORAGE v12 ANIMATIONS ----------------------------------------

    // 1) Jellyfish: gentle bell-pulse + slow vertical drift + subtle
    //    horizontal sway. Bell scales down/up rhythmically; emissive glow
    //    breathes; tentacles fade slightly with the pulse.
    jellyfishBloom.forEach((jelly, idx) => {
      const ud = jelly.userData;
      const phase = ud.phase + t * 0.55;
      const pulse = 0.5 + 0.5 * Math.sin(phase * Math.PI * 2 / 1.8);
      const sx = 1 + pulse * 0.18;
      const sy = 1 - pulse * 0.28; // bell flattens then puffs
      ud.bell.scale.set(sx, sy, sx);
      ud.bell.material.emissiveIntensity = 0.45 + pulse * 0.55;
      ud.glow.material.opacity = 0.35 + pulse * 0.45;
      // Drift
      jelly.position.x = ud.basePos.x + Math.sin(t * 0.18 + idx) * 0.4;
      jelly.position.y = ud.basePos.y + Math.sin(t * 0.32 + idx * 0.7) * 0.25;
      jelly.position.z = ud.basePos.z + Math.cos(t * 0.16 + idx * 0.5) * 0.35;
      // Tentacles fade with bell pulse
      ud.tentacles.forEach((tn) => {
        tn.material.opacity = 0.30 + pulse * 0.25;
      });
    });

    // 2) Manta ray: figure-8 path along the seabed; wings flap slowly;
    //    tail trails behind.
    {
      const ang = t * 0.10;
      // Lemniscate parameterization
      const denom = 1 + Math.sin(ang) * Math.sin(ang);
      const lemX = (5.0 * Math.cos(ang)) / denom;
      const lemZ = (5.0 * Math.sin(ang) * Math.cos(ang)) / denom;
      mantaRay.position.x = 2 + lemX;
      mantaRay.position.z = 4 + lemZ;
      mantaRay.position.y = -1.55 + Math.sin(t * 0.4) * 0.12;
      // Heading along path tangent
      const lookAng = ang + Math.PI / 2;
      mantaRay.rotation.y = -lookAng;
      // Wing flap
      const flap = Math.sin(t * 1.4) * 0.22;
      if (mantaRay.userData.wingL && mantaRay.userData.wingR) {
        mantaRay.userData.wingL.position.y = flap;
        mantaRay.userData.wingR.position.y = -flap;
      }
    }

    // 3) Otter pup: drifts gently in small loop, kelp ball spins, otter
    //    rolls slightly on its back.
    {
      const baseX = -3 + Math.sin(t * 0.13) * 1.2;
      const baseZ = 11 + Math.cos(t * 0.11) * 1.0;
      otterPup.position.set(baseX, 0.05 + Math.sin(t * 0.7) * 0.04, baseZ);
      otterPup.rotation.y = Math.sin(t * 0.08) * 0.7;
      otterPup.rotation.z = Math.sin(t * 1.1) * 0.18;
      if (otterPup.userData.kelpBall) {
        otterPup.userData.kelpBall.rotation.x = t * 1.6;
        otterPup.userData.kelpBall.rotation.y = t * 2.1;
        otterPup.userData.kelpBall.position.y = 0.22 + Math.sin(t * 1.3) * 0.04;
      }
    }

    // 4) Storm cloud: occasional silent flashes. Counts down from
    //    nextFlash; when it reaches 0, spike opacity for ~0.4s, then
    //    reset for next 5–11s window.
    {
      const ud = stormCloud.userData;
      ud.flashTime -= dt;
      ud.nextFlash -= dt;
      if (ud.nextFlash <= 0 && ud.flashTime <= 0) {
        ud.flashTime = 0.35 + Math.random() * 0.25;
        ud.nextFlash = 5 + Math.random() * 6;
      }
      if (ud.flashTime > 0) {
        // Flash envelope: fast rise, slow decay
        const u = 1 - (ud.flashTime / 0.6);
        const env = u < 0.15 ? (u / 0.15) : Math.max(0, 1 - (u - 0.15) / 0.85);
        ud.flash.material.opacity = env * 0.85;
        // Tint the dark cloud puffs slightly during flash
        stormCloud.children.forEach((cm) => {
          if (cm !== ud.flash && cm.material) {
            cm.material.opacity = 0.7 + env * 0.2;
          }
        });
      } else {
        ud.flash.material.opacity = 0;
      }
      // Slow drift across horizon
      stormCloud.position.x = -32 + Math.sin(t * 0.02) * 4;
      stormCloud.rotation.y = Math.sin(t * 0.03) * 0.2;
    }

    // v13 animations
    // Sea snake: undulating S-curve path
    {
      const ud = seaSnake.userData;
      const segs = ud.segs;
      const baseX = Math.sin(t * 0.18) * 7;
      const baseZ = Math.cos(t * 0.14) * 7;
      const dir = { x: Math.cos(t * 0.18) * 7 * 0.18, z: -Math.sin(t * 0.14) * 7 * 0.14 };
      const dirLen = Math.hypot(dir.x, dir.z) || 1;
      const dx = dir.x / dirLen, dz = dir.z / dirLen;
      const px = -dz, pz = dx; // perp
      for (let i = 0; i < segs.length; i++) {
        const wave = Math.sin(t * 2.4 - i * 0.6) * 0.45 * (1 - i / segs.length);
        const back = i * 0.22;
        segs[i].position.set(
          baseX - dx * back + px * wave,
          -1.45 + Math.sin(t * 1.6 - i * 0.4) * 0.05,
          baseZ - dz * back + pz * wave
        );
      }
      ud.head.position.set(baseX + dx * 0.22, -1.4 + Math.sin(t * 1.6) * 0.05, baseZ + dz * 0.22);
      ud.head.lookAt(baseX + dx * 1.5, -1.4, baseZ + dz * 1.5);
    }
    // Fish school: coordinated flock orbit + jitter
    {
      const ud = reefFishSchool.userData;
      const cx = Math.cos(t * 0.22) * 5.5;
      const cz = Math.sin(t * 0.22) * 5.5;
      const cy = -1.7 + Math.sin(t * 0.35) * 0.2;
      const dir = { x: -Math.sin(t * 0.22) * 5.5 * 0.22, z: Math.cos(t * 0.22) * 5.5 * 0.22 };
      const dirLen = Math.hypot(dir.x, dir.z) || 1;
      const dx = dir.x / dirLen, dz = dir.z / dirLen;
      const yaw = Math.atan2(dz, dx);
      ud.fishes.forEach((f) => {
        const wob = Math.sin(t * 3 + f.userData.phase) * 0.08;
        f.position.set(
          cx + f.userData.offset.x + wob * dx,
          cy + f.userData.offset.y + Math.sin(t * 2 + f.userData.phase) * 0.05,
          cz + f.userData.offset.z + wob * dz
        );
        f.rotation.y = -yaw;
      });
    }
    // Bird flock: orbit lighthouse spire (~ x=0,z=0,y=12)
    {
      const ud = birdFlock.userData;
      ud.birds.forEach((b) => {
        const ang = t * b.userData.speed + b.userData.phase;
        b.position.set(
          Math.cos(ang) * b.userData.radius,
          b.userData.baseY + Math.sin(ang * 1.7) * 0.3,
          Math.sin(ang) * b.userData.radius
        );
        b.rotation.y = -ang + Math.PI / 2;
      });
    }
    // Rainbow2: occasional fade-in cycle ~30s
    {
      const cycle = (t * 0.033 + 0.55) % 1;
      const op = cycle < 0.4 ? Math.sin((cycle / 0.4) * Math.PI) * 0.55 : 0;
      rainbow2.children.forEach((arc) => {
        arc.material.opacity = arc.userData.ring === 'primary' ? op : op * 0.45;
      });
    }

    // ===== v14 ANIMATIONS =====
    // Far lighthouse beacon: blinks every ~6.4s, OFFSET from main lighthouse for reciprocal feel
    {
      const phase = (t * 0.156 + 0.42) % 1;
      const pulse = phase < 0.18 ? Math.sin((phase / 0.18) * Math.PI) : 0;
      farBeacon.material.opacity = 0.4 + pulse * 0.55;
      farBeacon2.material.opacity = pulse * 0.42;
      farBeacon2.scale.setScalar(1 + pulse * 0.55);
    }
    // Sailing regatta: each ship drifts on its own gentle horizon arc with bobbing
    regattaShips.forEach((ship, i) => {
      const ud = ship.userData;
      ship.position.x = ud.baseX + Math.sin(t * ud.speed + ud.phase) * 4.2;
      ship.position.z = ud.baseZ + Math.cos(t * ud.speed * 0.8 + ud.phase) * 1.2;
      ship.position.y = 0.18 + Math.sin(t * 1.4 + ud.phase) * 0.08;
      ship.rotation.y = Math.cos(t * ud.speed + ud.phase) * 0.3;
      ship.rotation.z = Math.sin(t * 1.6 + ud.phase) * 0.04;
    });
    // Wind sock: gently tilts based on a wind value, sock body sways
    {
      const windAng = Math.sin(t * 0.08) * 0.4 + 0.2;
      windSock.rotation.y = windAng;
      const sway = Math.sin(t * 1.7) * 0.08;
      windSockBody.rotation.z = -Math.PI / 2 + sway;
      windSockStripe.rotation.z = -Math.PI / 2 + sway;
    }
    // Fog beacon: slow pulse + halo
    {
      const fp = (Math.sin(t * 0.9) + 1) * 0.5;
      fogBeaconLamp.material.opacity = 0.55 + fp * 0.4;
      fogBeaconHalo.material.opacity = 0.18 + fp * 0.4;
      fogBeaconHalo.scale.setScalar(1 + fp * 0.5);
    }
    // Sea cliffs: stable but small atmospheric color shift on moss patches
    {
      const cliffMossOp = 0.55 + 0.18 * Math.sin(t * 0.18);
      seaCliffs.children.forEach((cliff) => {
        // child[1] is moss
        if (cliff.children[1] && cliff.children[1].material) {
          cliff.children[1].material.opacity = cliffMossOp;
        }
      });
    }

    // v15: Seal heads bob slightly (sleeping/breathing)
    {
      sealColony.forEach((seal, i) => {
        seal.head.position.y = 0.06 + Math.sin(t * 0.9 + i * 1.7) * 0.02;
      });
    }
    // v15: Tide gauge — water-mark stripes shift opacity slowly to simulate tide rising/falling
    {
      const tide = (Math.sin(t * 0.05) + 1) * 0.5; // 0..1
      // Lower stripes brighter when tide is "up" (covered, glistening), upper stripes brighter when low
      tideGauge.children.forEach((c, i) => {
        if (i === 0 || i > 8) return; // skip post & cap
        const stripeIdx = i - 1; // 0..7 from bottom
        if (c.material) {
          const wet = stripeIdx / 7 < tide;
          c.material.emissive = c.material.emissive || new THREE.Color(0x000000);
          c.material.emissive.setHex(wet ? 0x103040 : 0x000000);
        }
      });
    }
    // v15: Trawler slowly sails in a wide arc, net sways
    {
      const ta = t * 0.04;
      const tx = -22 + Math.sin(ta) * 6;
      const tz = -18 + Math.cos(ta) * 4;
      harborTrawler.position.x = tx;
      harborTrawler.position.z = tz;
      harborTrawler.position.y = Math.sin(t * 1.1) * 0.06;
      harborTrawler.rotation.y = -0.3 + Math.sin(ta) * 0.18;
      trawlerNet.rotation.z = Math.sin(t * 0.7) * 0.08;
      trawlerNet.material.opacity = 0.38 + 0.08 * Math.sin(t * 1.2);
    }
    // v15: Harbor master's window glow flickers like a hearth, smoke rises
    {
      const flicker = 0.78 + 0.18 * Math.sin(t * 6.0) + 0.05 * Math.sin(t * 11.0);
      houseWindow.material.opacity = flicker;
      houseWindow2.material.opacity = flicker * 0.85;
      const sy = 2.9 + ((t * 0.4) % 1.4);
      chimneySmoke.position.y = sy;
      chimneySmoke.material.opacity = Math.max(0, 0.5 - ((t * 0.4) % 1.4) * 0.32);
      chimneySmoke.scale.setScalar(1.0 + ((t * 0.4) % 1.4) * 0.6);
    }

    // v16: floating sea lanterns drift slowly in circles, bob with waves
    seaLanternFloats.forEach((fl) => {
      const a = fl.userData.baseAngle + t * fl.userData.driftSpeed;
      const r = fl.userData.radius + Math.sin(t * 0.4 + fl.userData.bobPhase) * 0.4;
      fl.position.x = Math.cos(a) * r;
      fl.position.z = Math.sin(a) * r;
      fl.position.y = -0.18 + Math.sin(t * 1.3 + fl.userData.bobPhase) * 0.05;
      fl.rotation.y += dt * 0.2;
    });

    // v16: signal flare — rises and fades roughly every 18s
    const flareCycle = (t % 18) / 18;
    if (flareCycle < 0.18) {
      const phase = flareCycle / 0.18;
      // rising arc
      signalFlareGroup.position.y = phase * 6.5;
      const intensity = Math.sin(phase * Math.PI);
      signalFlareCore.material.opacity = intensity * 0.95;
      signalFlareGlow.intensity = intensity * 1.6;
    } else {
      signalFlareCore.material.opacity = 0;
      signalFlareGlow.intensity = 0;
      signalFlareGroup.position.y = 0;
    }

    // v17: low sea fog drifts slowly across the harbor, gentle opacity pulse
    seaFogPlanes.forEach((fog) => {
      const ud = fog.userData;
      fog.position.x += ud.direction * ud.driftSpeed * dt;
      // Wrap softly when drifted past the harbor extent
      if (fog.position.x > 20) fog.position.x = -22;
      if (fog.position.x < -22) fog.position.x = 20;
      const breath = ud.baseOpacity + 0.05 * Math.sin(t * 0.35 + ud.basePhase);
      fog.material.opacity = breath;
    });

    // v17: distant ferry sails a wide arc, lit windows pulse very faintly
    {
      const fa = t * 0.025 + 1.2;
      distantFerryGroup.position.x = -30 + Math.sin(fa) * 10;
      distantFerryGroup.position.z = 8 + Math.cos(fa) * 6;
      distantFerryGroup.position.y = Math.sin(t * 0.9) * 0.07;
      // Boat heads in direction of travel: derivative of position
      const fdx = Math.cos(fa) * 10 * 0.025;
      const fdz = -Math.sin(fa) * 6 * 0.025;
      distantFerryGroup.rotation.y = Math.atan2(fdx, fdz);
      ferryWindowMat.opacity = 0.88 + 0.10 * Math.sin(t * 0.7);
    }

    // v17: harbor cat — slow tail flick, occasional head turn
    {
      catTail.rotation.x = Math.sin(t * 1.2) * 0.18;
      // Subtle head-turn every ~6 seconds
      const headPhase = (t % 7) / 7;
      if (headPhase > 0.55 && headPhase < 0.75) {
        const k = (headPhase - 0.55) / 0.20;
        catHead.rotation.y = Math.sin(k * Math.PI) * 0.6;
      } else {
        catHead.rotation.y *= 0.95;
      }
      // Breathing: scale tiny up/down
      const br = 1.0 + 0.012 * Math.sin(t * 1.6);
      catBody.scale.set(1.4 * br, 0.8 * br, 1.0 * br);
    }

    // v18: dolphin pod -- arc above water on a slow loop
    {
      dolphinPodMembers.forEach((d, i) => {
        const baseT = t * 0.45 + d.userData.phaseOffset;
        // Pod swims in a wide circle around (6,0,-8)
        const podR = 9 + i * 0.6;
        const angle = baseT * 0.18;
        const cx = Math.cos(angle) * podR;
        const cz = Math.sin(angle) * podR;
        // Arc up out of water on a sin pulse — every ~5s rises and dives
        const rise = Math.sin(baseT * 1.1);
        const breach = Math.max(0, rise) * Math.max(0, rise);
        d.position.x = cx;
        d.position.z = cz;
        d.position.y = -0.2 + breach * 0.95;
        // Tilt nose up while breaching, down while diving
        d.rotation.z = -rise * 0.7;
        d.rotation.y = -angle - Math.PI / 2;
      });
    }

    // v18: cafe windows pulse warmly + smoke rises and fades
    cafeWindowMat.opacity = 0.85 + 0.10 * Math.sin(t * 1.6);
    cafeLamp.intensity = 0.85 + 0.18 * Math.sin(t * 1.4 + 0.3);
    cafeSmokePuffs.forEach((puff, i) => {
      const ph = (t * 0.5 + puff.userData.phase) % 4;
      puff.position.y = 2.4 + ph * 0.55;
      puff.position.x = Math.sin(t * 0.6 + puff.userData.phase) * 0.18;
      puff.material.opacity = Math.max(0, 0.45 - ph * 0.10);
      puff.scale.setScalar(1.0 + ph * 0.20);
    });

    // v18: comet water reflections shimmer briefly on the harbor surface
    cometReflectionStreaks.forEach((streak) => {
      const ph = (t * streak.userData.cycleSpeed + streak.userData.phase) % (Math.PI * 2);
      // Brief pulse: visible only ~25% of the cycle
      const tri = ph < Math.PI * 0.5 ? Math.sin(ph * 2) : 0;
      streak.material.opacity = Math.max(0, tri * 0.55);
    });

    // v19: Harbor crane gentle boom rotation + cargo bob + tip warning blink
    craneBoom.rotation.y = Math.sin(t * 0.18) * 0.85;
    craneCargo.position.y = -3.45 + Math.sin(t * 1.8) * 0.05;
    const craneBlink = (Math.sin(t * 4.0) + 1) * 0.5; // 0..1
    craneTipLight.material.emissiveIntensity = 0.55 + craneBlink * 0.95;

    // v19: Weather vane wind-driven spinner
    weatherVaneSpinner.rotation.y = Math.sin(t * 0.21) * 0.9 + Math.sin(t * 0.63) * 0.4;

    // v19: Festival lantern string sway + flicker
    for (let i = 0; i < festivalLanterns.length; i++) {
      const lantern = festivalLanterns[i];
      const ph = lantern.userData.phase;
      const base = lantern.userData.basePos;
      lantern.position.x = base.x + Math.sin(t * 0.7 + ph) * 0.06;
      lantern.position.z = base.z + Math.cos(t * 0.55 + ph) * 0.04;
      lantern.material.emissiveIntensity = 0.86 + 0.12 * Math.sin(t * 2.4 + ph * 1.3);
    }
    festivalLanternLight.intensity = 0.22 + 0.06 * Math.sin(t * 2.0);

    // v20: Hermit crabs subtle bob + sway
    for (let i = 0; i < hermitCrabs.length; i++) {
      const c = hermitCrabs[i];
      c.position.y = 0.02 + Math.sin(t * 0.9 + c.userData.phase) * 0.006;
      c.rotation.y = Math.sin(t * 0.4 + c.userData.phase) * 0.4;
    }
    // v20: Starfish slow drift rotation
    for (let i = 0; i < starfishList.length; i++) {
      starfishList[i].rotation.y += dt * 0.05 * (i % 2 === 0 ? 1 : -1);
    }
    // v20: Sea cave inner cyan glow pulse
    caveGlow.intensity = 0.85 + 0.4 * Math.sin(t * 0.6);
    caveGlowSprite.material.opacity = 0.34 + 0.12 * Math.sin(t * 0.6);
    // v20: Aurora drift + opacity wave
    auroraRibbon.position.x = Math.sin(t * 0.06) * 4;
    auroraGreen.material.opacity = 0.16 + 0.06 * Math.sin(t * 0.4);
    auroraViolet.material.opacity = 0.12 + 0.05 * Math.sin(t * 0.4 + 1.5);
    // v20: Kraken eye blinks open ~3s every 30s
    const krakenCycle = t % 30;
    const krakenOpen = krakenCycle > 27 && krakenCycle < 30;
    krakenIris.visible = krakenOpen;
    krakenPupil.visible = krakenOpen;
    if (krakenOpen) {
      const phase = (krakenCycle - 27) / 3;
      const eyeGlow = Math.sin(phase * Math.PI);
      krakenIris.material.emissiveIntensity = 0.6 + 1.2 * eyeGlow;
    }

    // v21: Shipwreck debris planks gently bob with the sea
    for (let i = 0; i < wreckDebris.length; i++) {
      const pl = wreckDebris[i];
      pl.position.y = pl.userData.baseY + Math.sin(t * 0.7 + pl.userData.phase) * 0.05;
      pl.rotation.z = Math.sin(t * 0.5 + pl.userData.phase) * 0.04;
    }
    // v21: Fireflies orbit lighthouse with soft vertical drift
    const fpAttr = firefliesPoints.geometry.attributes.position;
    for (let i = 0; i < fireflyCount; i++) {
      const fd = fireflyData[i];
      const ang = fd.phase + t * fd.speed;
      fpAttr.array[i * 3 + 0] = -3.2 + Math.cos(ang) * fd.orbitR;
      fpAttr.array[i * 3 + 1] = fd.orbitH + Math.sin(t * 0.8 + fd.phase) * 0.18;
      fpAttr.array[i * 3 + 2] = -2.5 + Math.sin(ang) * fd.orbitR;
    }
    fpAttr.needsUpdate = true;
    firefliesPoints.material.opacity = 0.78 + 0.18 * Math.sin(t * 1.6);
    // v21: Message bottle bobs in harbor and slowly drifts
    msgBottleGroup.position.x = 4.5 + Math.cos(t * 0.06) * 1.8;
    msgBottleGroup.position.z = -1 + Math.sin(t * 0.06) * 1.4;
    msgBottleGroup.position.y = 0.18 + Math.sin(t * 1.3) * 0.025;
    msgBottleGroup.rotation.y = t * 0.18;

    // v22: Wishing well coins shimmer with phase-based emissive
    for (let ci = 0; ci < wellCoins.length; ci++) {
      const c = wellCoins[ci];
      c.material.emissiveIntensity = 0.5 + 0.4 * Math.sin(t * 1.7 + c.userData.phase);
      c.position.y = 0.68 + Math.sin(t * 1.2 + c.userData.phase) * 0.005;
    }
    // v22: Paper boats drift downstream slowly
    for (let pi = 0; pi < paperBoats.length; pi++) {
      const pb = paperBoats[pi];
      const u = pb.userData;
      pb.position.x = u.baseX + Math.sin(t * 0.4 + u.phase) * 0.18;
      pb.position.z = u.baseZ + (t * u.speed) % 6 - 3;
      pb.position.y = Math.sin(t * 1.5 + u.phase) * 0.04;
      pb.rotation.y = Math.sin(t * 0.6 + u.phase) * 0.25;
    }
    // v22: Treasure bubbles rise and reset
    {
      const arr = treasureBubblePos;
      const n = treasureBubbles.userData.count;
      for (let bi = 0; bi < n; bi++) {
        arr[bi * 3 + 1] += 0.012 + 0.004 * Math.sin(t * 2 + treasureBubbles.userData.phases[bi]);
        if (arr[bi * 3 + 1] > 1.6) {
          arr[bi * 3 + 1] = 0;
          arr[bi * 3 + 0] = (Math.random() - 0.5) * 0.4;
          arr[bi * 3 + 2] = (Math.random() - 0.5) * 0.4;
        }
      }
      treasureBubbles.geometry.attributes.position.needsUpdate = true;
      treasureBubbles.material.opacity = 0.55 + 0.2 * Math.sin(t * 1.4);
      treasureGlow.intensity = 0.5 + 0.3 * Math.sin(t * 1.1);
    }

    // v23: Seal pup bobs in the water + buoy bell rocks + light flickers
    if (typeof sealPup !== 'undefined') {
      sealPup.position.y = 0.0 + 0.06 * Math.sin(t * 1.6);
      sealPup.rotation.z = 0.05 * Math.sin(t * 0.9);
      sealPup.rotation.y = 0.18 * Math.sin(t * 0.4);
    }
    if (typeof buoyBell !== 'undefined') {
      buoyBell.position.y = 0.4 + 0.12 * Math.sin(t * 0.9);
      buoyBell.rotation.z = 0.15 * Math.sin(t * 1.2);
      buoyBell.rotation.x = 0.08 * Math.sin(t * 0.7 + 0.4);
      bellBuoyLight.intensity = 0.5 + 0.3 * (0.5 + 0.5 * Math.sin(t * 3.4));
    }

    // v24: Campfire flame flicker + rising embers
    if (typeof campfireGroup !== 'undefined') {
      const flick = 0.85 + 0.18 * Math.sin(t * 14) + 0.1 * Math.sin(t * 23.7);
      campflame.scale.y = flick;
      campflame.scale.x = 0.92 + 0.12 * Math.sin(t * 9.3);
      campflameInner.scale.y = 0.9 + 0.18 * Math.sin(t * 17.2);
      campfireLight.intensity = 1.2 + 0.4 * (0.5 + 0.5 * Math.sin(t * 11));
      const arr = emberPos;
      const n = campfireEmbers.userData.count;
      for (let ei = 0; ei < n; ei++) {
        arr[ei * 3 + 1] += 0.018 + 0.005 * Math.sin(t * 3 + campfireEmbers.userData.phases[ei]);
        arr[ei * 3 + 0] += 0.0035 * Math.sin(t * 2 + campfireEmbers.userData.phases[ei] * 1.7);
        if (arr[ei * 3 + 1] > 1.8) {
          arr[ei * 3 + 0] = (Math.random() - 0.5) * 0.3;
          arr[ei * 3 + 1] = 0.2;
          arr[ei * 3 + 2] = (Math.random() - 0.5) * 0.3;
        }
      }
      campfireEmbers.geometry.attributes.position.needsUpdate = true;
      campfireEmbers.material.opacity = 0.7 + 0.2 * Math.sin(t * 1.7);
    }

    // v25: Seagulls circling + octopus tentacle waving
    if (typeof seagullList !== 'undefined' && seagullList.length) {
      for (let gi = 0; gi < seagullList.length; gi++) {
        const g = seagullList[gi];
        const sp = g.userData.spec;
        const ang = sp.phase + t * sp.speed;
        g.position.set(Math.cos(ang) * sp.r, sp.y + 0.4 * Math.sin(t * 0.8 + sp.phase), Math.sin(ang) * sp.r);
        g.rotation.y = -ang + (sp.speed > 0 ? Math.PI / 2 : -Math.PI / 2);
        const flap = Math.sin(t * 9 + sp.phase) * 0.55;
        g.userData.wingL.rotation.x = flap;
        g.userData.wingR.rotation.x = -flap;
      }
    }
    if (typeof octopusTentacle !== 'undefined' && tentacleSegments.length) {
      for (let ti = 0; ti < tentacleSegments.length; ti++) {
        const seg = tentacleSegments[ti];
        const sway = 0.12 * Math.sin(t * 1.6 + ti * 0.42);
        const curl = 0.08 * Math.sin(t * 1.1 + ti * 0.35);
        seg.position.x = sway * (ti / tentacleSegments.length);
        seg.position.z = curl * (ti / tentacleSegments.length);
      }
    }

    // v26: Telescope mount slowly scans the sky; sailboat gently rocks
    if (typeof telescopeMount !== 'undefined') {
      telescopeMount.rotation.y = Math.sin(t * 0.18) * 0.9;
      telescopeMount.rotation.x = -0.55 + 0.2 * Math.sin(t * 0.24 + 0.7);
    }
    if (typeof stargazerHead !== 'undefined') {
      stargazerHead.rotation.y = Math.sin(t * 0.18) * 0.4;
    }
    if (typeof sailboatGroup !== 'undefined') {
      sailboatGroup.rotation.z = 0.06 * Math.sin(t * 0.7);
      sailboatGroup.position.y = 0.2 + 0.04 * Math.sin(t * 0.9);
      sailboatGroup.rotation.y = 0.05 * Math.sin(t * 0.35);
    }
    if (typeof sailboatLantern !== 'undefined') {
      const lf = 1.3 + 0.3 * Math.sin(t * 4.2);
      if (sailboatLantern.material) sailboatLantern.material.emissiveIntensity = lf;
    }

    // v27: Flag flutters in the wind; cat breathes
    if (typeof flagSegments !== 'undefined' && flagSegments.length) {
      for (let fi = 0; fi < flagSegments.length; fi++) {
        const seg = flagSegments[fi];
        const wave = Math.sin(t * 3.4 - fi * 0.7) * 0.18 * (fi / flagSegments.length);
        seg.position.z = wave;
        seg.rotation.y = Math.cos(t * 3.4 - fi * 0.7) * 0.45;
        seg.position.y = 4.6 + 0.05 * Math.sin(t * 2.0 + fi * 0.5);
      }
    }
    if (typeof pierCatBody !== 'undefined') {
      const breath = 1.0 + 0.05 * Math.sin(t * 1.5);
      pierCatBody.scale.set(1.4 * breath, 0.7 * breath, 1.0);
    }

    // v28: Mini lighthouse light pulses; fishing bobber bobs in water
    if (typeof miniLanternLight !== 'undefined') {
      miniLanternLight.intensity = 1.0 + 0.5 * Math.sin(t * 1.6);
    }
    if (typeof miniLanternRoom !== 'undefined' && miniLanternRoom.material) {
      miniLanternRoom.material.emissiveIntensity = 0.55 + 0.25 * Math.sin(t * 1.6);
    }
    if (typeof fishingBobber !== 'undefined') {
      fishingBobber.position.y = -0.4 + 0.06 * Math.sin(t * 1.8);
      // Occasional 'bite' tug
      const bite = Math.sin(t * 0.18);
      if (bite > 0.97) fishingBobber.position.y -= 0.18;
    }

    // v29: Pier crab walks sideways back and forth + claws snap
    if (typeof pierCrabGroup !== 'undefined') {
      const sweep = Math.sin(t * 0.45);  // -1..1
      pierCrabGroup.position.x = 2.5 + sweep * 1.4;  // walks along pier
      pierCrabGroup.rotation.y = sweep > 0 ? Math.PI / 2 : -Math.PI / 2;
      // Slight bob from walking
      pierCrabGroup.position.y = 1.05 + 0.015 * Math.abs(Math.sin(t * 4.0));
    }
    if (typeof pierCrabClaws !== 'undefined') {
      for (let i = 0; i < pierCrabClaws.length; i++) {
        const c = pierCrabClaws[i];
        c.rotation.z = (i === 0 ? 1 : -1) * (0.2 + 0.25 * Math.sin(t * 2.5 + i));
      }
    }
    if (typeof pierCrabLegs !== 'undefined') {
      for (let i = 0; i < pierCrabLegs.length; i++) {
        const leg = pierCrabLegs[i];
        const phase = (i % 3) * 0.7 + (i < 3 ? 0 : Math.PI);
        leg.rotation.x = 0.25 * Math.sin(t * 5.0 + phase);
      }
    }

    // v30: Mermaid waves arm + cargo crate sways + chain shimmers
    if (typeof outcropMermaidArm !== 'undefined') {
      outcropMermaidArm.rotation.z = 0.7 + 0.4 * Math.sin(t * 1.5);
    }
    if (typeof outcropMermaidGroup !== 'undefined') {
      outcropMermaidGroup.rotation.y = 0.3 * Math.sin(t * 0.4);
    }
    if (typeof cargoCrate !== 'undefined') {
      cargoCrate.position.y = 0.55 + 0.18 * (0.5 + 0.5 * Math.sin(t * 0.5));
      cargoCrate.rotation.y = 0.10 * Math.sin(t * 0.7);
    }
    if (typeof cargoRope !== 'undefined') {
      const cy = 0.55 + 0.18 * (0.5 + 0.5 * Math.sin(t * 0.5));
      cargoRope.scale.y = (2.40 - cy) / 1.6;
      cargoRope.position.y = (2.40 + cy) / 2;
    }
    if (typeof cargoPulley !== 'undefined') {
      cargoPulley.rotation.y = t * 0.6;
    }
    if (typeof dockAnchorChain !== 'undefined') {
      for (let i = 0; i < dockAnchorChain.length; i++) {
        dockAnchorChain[i].position.y += 0.003 * Math.sin(t * 1.2 + i);
      }
    }

    // v31: Lighthouse keeper waving arm + whale tour boat circling
    // Waving: large angle swing
    dockKeeperArmR.rotation.z = -1.2 + Math.sin(t * 4.2) * 0.5;
    dockKeeperArmR.rotation.x = Math.sin(t * 4.0) * 0.15;
    // Whale tour boat: slow wide arc opposite direction to v15 sailboat
    const tourAngle = -t * 0.05 + Math.PI;
    const tourR = 18;
    whaleTourGroup.position.x = Math.cos(tourAngle) * tourR;
    whaleTourGroup.position.z = Math.sin(tourAngle) * tourR;
    whaleTourGroup.position.y = 0.18 + Math.sin(t * 0.85 + 0.7) * 0.06;
    whaleTourGroup.rotation.y = -tourAngle - Math.PI / 2;
    whaleTourGroup.rotation.z = Math.sin(t * 0.65) * 0.025;
    // Passengers gentle bob
    tourPassengers.forEach((p) => {
      const bob = Math.sin(t * 1.4 + p.phase) * 0.02;
      p.body.position.y = 0.45 + bob;
      p.head.position.y = 0.62 + bob;
    });
    // Wake opacity pulse
    tourWake.material.opacity = 0.22 + 0.14 * Math.sin(t * 2.0);

    // v32: Sandcastle flag flutters; dolphin trio leaps in synchronized arcs
    castleFlag.rotation.y = Math.sin(t * 2.4) * 0.4;
    castleFlag.scale.x = 1.0 + 0.06 * Math.sin(t * 3.0);
    // Dolphin arc loop: each dolphin traces an arc rising from water + diving back
    dolphinTrioMembers.forEach((d) => {
      const period = 5.0; // seconds per arc cycle
      const u = ((t + d.phaseOffset * (period / (Math.PI * 2))) % period) / period; // 0..1 along arc
      // Forward travel along x then return
      const xOffset = -8 + u * 16; // travel from -8 to 8 in local space
      const yJump = Math.max(0, Math.sin(u * Math.PI)) * 1.6 - 0.6; // arc out of water then below
      d.group.position.x = xOffset;
      d.group.position.y = yJump;
      // Pitch the body for graceful arc
      const pitch = Math.cos(u * Math.PI) * 0.7;
      d.group.rotation.z = pitch;
      // Slight z wobble
      d.group.position.z = Math.sin(t * 1.8 + d.phaseOffset) * 0.4;
    });

    // v33: Seagulls circling the kid + crumbs floating + tug smoke rising + tug convoy slow drift
    feedKidGulls.forEach((g, i) => {
      const r = 0.55 + i * 0.04;
      const ang = t * 1.4 + g.phaseOffset;
      g.group.position.x = 0.20 + Math.cos(ang) * r;
      g.group.position.z = Math.sin(ang) * r;
      g.group.position.y = 0.95 + 0.10 * Math.sin(t * 2.4 + g.phaseOffset);
      g.group.rotation.y = -ang + Math.PI / 2;
      const flap = Math.sin(t * 7.0 + g.phaseOffset) * 0.6;
      g.wingL.rotation.z = flap;
      g.wingR.rotation.z = -flap;
    });
    feedCrumbs.forEach((c) => {
      c.mesh.position.y = c.baseY + Math.sin(t * 2.5 + c.basePhase) * 0.04;
    });
    // Tug smoke puffs rise + fade then loop
    tugSmoke.forEach((p) => {
      const u = ((t * 0.6 + p.phase) % 2.4) / 2.4; // 0..1
      p.mesh.position.y = p.baseY + u * 1.2;
      p.mesh.material.opacity = 0.6 * (1 - u);
      p.mesh.scale.setScalar(0.6 + u * 0.8);
    });
    // Tug convoy drifts slowly across the harbor on a long oval path
    const tugAngle = t * 0.04;
    tugConvoyGroup.position.x = -22 + Math.sin(tugAngle) * 6;
    tugConvoyGroup.position.z = 14 + Math.cos(tugAngle) * 4;
    tugConvoyGroup.rotation.y = -tugAngle + 0.3;

    // v34: Fishermen rod tip bobs + line shimmers; pelican breathes; surfer sways on wave
    fishermenRods.forEach((r, i) => {
      r.rotation.z = -0.85 + Math.sin(t * 1.3 + i * 1.1) * 0.05;
    });
    fishermenBobs.forEach((b) => {
      b.bob.position.y = 0.10 + Math.sin(t * 2.2 + b.basePhase) * 0.04;
    });
    fishermenLines.forEach((ln) => {
      ln.line.material.opacity = 0.6 + 0.15 * Math.sin(t * 2.6 + ln.basePhase);
    });
    dockPelicanBody.scale.y = 0.9 + 0.04 * Math.sin(t * 1.6);
    dockPelicanHead.rotation.y = Math.sin(t * 0.4) * 0.5;
    dockPelicanBeak.rotation.y = dockPelicanHead.rotation.y;
    // Surfer rides up/down on a wave + leans for balance, wave fades pulse
    const surfBob = Math.sin(t * 1.3) * 0.10;
    surferGroup.position.y = 0.18 + surfBob;
    surferGroup.rotation.z = Math.sin(t * 1.1) * 0.10;
    surferGroup.rotation.y = Math.sin(t * 0.25) * 0.6 + 0.5; // sweeping turn
    surferWave.material.opacity = 0.45 + 0.15 * Math.sin(t * 2.4);

    // v35: Kayakers paddle along oval path; paddleboarder bobs gently; umbrella sways
    kayakerEntries.forEach(({ group: kg, paddle, spec }) => {
      const angle = t * 0.18 + spec.phase;
      const x = Math.cos(angle) * spec.radius - 4;
      const z = Math.sin(angle) * spec.radius * 0.7 + 6;
      kg.position.set(x, 0.18, z);
      kg.rotation.y = -angle + Math.PI / 2;
      // Paddle alternating dip
      paddle.rotation.x = Math.sin(t * 3.0 + spec.phase) * 0.7;
    });
    paddleBoarderGroup.position.y = 0.18 + Math.sin(t * 0.9) * 0.04;
    paddleBoarderGroup.rotation.z = Math.sin(t * 0.7) * 0.04;
    paddleBoarderGroup.rotation.y = Math.sin(t * 0.18) * 0.4;
    umbrellaCanopy.rotation.y = Math.sin(t * 0.4) * 0.06;
    umbrellaStripe.rotation.y = umbrellaCanopy.rotation.y;

    // v36: Volleyball players bounce; ball arcs over net; jet ski loops with wake
    volleyPlayers.forEach((p, i) => {
      // Phase-offset bouncing — when one is up the other is down
      const bounce = Math.max(0, Math.sin(t * 1.8 + (i === 0 ? 0 : Math.PI)));
      p.group.position.y = bounce * 0.35;
    });
    // Ball follows a parabolic arc over the net side-to-side; period sync with players
    const ballPhase = (t * 1.8) % (Math.PI * 2);
    const ballSide = Math.sin(t * 0.9); // -1 .. 1
    volleyBall.position.set(ballSide * 1.2, 0.6 + Math.abs(Math.sin(ballPhase)) * 0.9, 0);
    // Jet ski oval loop
    const jetAngle = t * 0.5;
    const jetX = Math.cos(jetAngle) * 22 - 4;
    const jetZ = Math.sin(jetAngle) * 11 + 8;
    jetskiGroup.position.set(jetX, 0.18, jetZ);
    jetskiGroup.rotation.y = -jetAngle + Math.PI / 2;
    jetskiGroup.position.y = 0.18 + Math.sin(t * 4.0) * 0.04; // chop bounce
    jetskiWake.material.opacity = 0.45 + 0.18 * Math.sin(t * 3.0);

    // v37: Balloon drifts in big slow loop high over harbor; parasail rig orbits offshore
    {
      const bAng = t * 0.05;
      hotAirBalloonGroup.position.x = -30 + Math.cos(bAng) * 18;
      hotAirBalloonGroup.position.z = -8 + Math.sin(bAng) * 14;
      hotAirBalloonGroup.position.y = 12 + Math.sin(t * 0.4) * 0.4;
      hotAirBalloonGroup.rotation.y = -bAng;
      habBurnerGlow.material.opacity = 0.7 + 0.2 * Math.sin(t * 4.0);
      habBurnerGlow.scale.setScalar(0.9 + 0.15 * Math.sin(t * 4.0));
      // Parasail rig orbit
      const pAng = t * 0.25;
      const px = Math.cos(pAng) * 26;
      const pz = Math.sin(pAng) * 18 - 12;
      parasailRig.position.set(px, 0.18, pz);
      parasailRig.rotation.y = -pAng + Math.PI / 2;
      psBoatWake.material.opacity = 0.45 + 0.18 * Math.sin(t * 3.4);
      psChute.rotation.y = Math.sin(t * 0.6) * 0.08;
    }

    // v38: Kite boarder zigzags across waves; rowboat oars stroke; swing pendulum
    {
      const kbAng = t * 0.18;
      const kbX = Math.sin(kbAng) * 16 + 12;
      const kbZ = Math.cos(kbAng * 0.7) * 6 + 12;
      kiteBoarderGroup.position.set(kbX, 0.02, kbZ);
      kiteBoarderGroup.rotation.y = -Math.cos(kbAng) * 0.6;
      kbBoard.position.y = 0.05 + Math.sin(t * 3.5) * 0.04;
      kbWake.material.opacity = 0.42 + 0.18 * Math.sin(t * 4.0);
      // Kite swings in sky
      kbKite.rotation.z = Math.PI / 6 + Math.sin(t * 1.0) * 0.18;
      kbKiteStripe1.rotation.z = kbKite.rotation.z;
      // Rower stroke — oars pivot back and forth
      const oarPhase = Math.sin(t * 1.6);
      oarL.rotation.z = 0.3 + oarPhase * 0.4;
      oarR.rotation.z = -0.3 - oarPhase * 0.4;
      oarBladeL.position.x = oarPhase * 0.6;
      oarBladeR.position.x = oarPhase * 0.6;
      // Rowboat drifts in slow ellipse with rocking
      const rbAng = t * 0.06 + 1.4;
      rowboatGroup.position.x = Math.cos(rbAng) * 12 - 4;
      rowboatGroup.position.z = Math.sin(rbAng) * 8 + 6;
      rowboatGroup.rotation.y = -rbAng + Math.PI / 2;
      rowboatGroup.position.y = 0.02 + Math.sin(t * 1.0) * 0.05;
      rowerBody.rotation.x = oarPhase * 0.18;
      // Swing pendulum motion
      swingPivot.rotation.z = Math.sin(t * 1.4) * 0.55;
    }

    // v39: bonfire flicker, hermit crab scuttle, water taxi shuttle
    {
      // Bonfire flame flicker
      const flick = 1.0 + Math.sin(t * 9.0) * 0.12 + Math.sin(t * 14.5) * 0.08;
      bonFlameOuter.scale.set(flick, flick * (0.92 + Math.sin(t * 11) * 0.05), flick);
      bonFlameInner.scale.set(flick * 0.88, flick * 0.95, flick * 0.88);
      bonFlameOuter.rotation.y = t * 1.2;
      bonFlameInner.rotation.y = -t * 1.5;
      bonLight.intensity = 1.4 + Math.sin(t * 10.2) * 0.25 + Math.sin(t * 4.0) * 0.15;
      // Marshmallow toasting glow
      const toast = 0.2 + (Math.sin(t * 0.7) * 0.5 + 0.5) * 0.55;
      bonMarshmallow.material.emissiveIntensity = toast;
      // Hermit crabs scuttle in zigzag race
      raceHermitCrabs.forEach((hc, i) => {
        const hAng = t * hc.speed * 0.4 + hc.phase;
        const dx = (Math.sin(hAng) * 0.5 + 0.5) * 4.0 - 2.0;
        hc.group.position.x = -19 + i * 0.6 + dx;
        hc.group.position.z = hc.baseZ + Math.sin(t * hc.speed * 2.5 + hc.phase) * 0.18;
        hc.group.rotation.y = Math.sign(Math.cos(hAng)) * 0.3 + Math.sin(t * 4 + hc.phase) * 0.1;
        hc.group.position.y = 0.02 + Math.abs(Math.sin(t * hc.speed * 6 + hc.phase)) * 0.025;
      });
      // Water taxi shuttles between two ports
      const wtAng = t * 0.12 + 0.7;
      const wtX = Math.sin(wtAng) * 22;
      const wtZ = Math.cos(wtAng * 0.5) * 4 + 16;
      waterTaxiGroup.position.set(wtX, 0.04, wtZ);
      waterTaxiGroup.rotation.y = -Math.atan2(Math.cos(wtAng) * 22, -Math.sin(wtAng * 0.5) * 2) + Math.PI / 2;
      waterTaxiGroup.position.y = 0.04 + Math.sin(t * 1.6) * 0.04;
      // Passengers bob slightly
      wtPassengers.forEach((p, i) => { p.position.y = 0.65 + Math.sin(t * 2.5 + i * 0.8) * 0.025; });
      wtWake.material.opacity = 0.4 + 0.2 * Math.sin(t * 4.0);
    }

    {
      // v40: oyster boat hauling, swimming kids bobbing, hot dog stand customer
      // Oyster boat slowly drifts; trap rises and lowers as if being hauled
      const obAng = t * 0.06 + 1.5;
      const obX = 28 + Math.sin(obAng) * 1.5;
      const obZ = 22 + Math.cos(obAng) * 1.0;
      oysterBoatGroup.position.set(obX, 0.05 + Math.sin(t * 0.9) * 0.04, obZ);
      oysterBoatGroup.rotation.y = -0.7 + Math.sin(t * 0.4) * 0.05;
      // Trap haul cycle: rises slowly, pauses, drops back into water
      const haulCycle = (Math.sin(t * 0.4) * 0.5 + 0.5);
      const trapY = -0.6 + haulCycle * 1.6;
      obTrapGroup.position.y = trapY;
      obTrapGroup.rotation.y = Math.sin(t * 0.7) * 0.4;
      // Rope length adjusts visually (scale Y)
      obRope.scale.y = 1.0 - haulCycle * 0.7;
      obRope.position.y = 0.95 - (1 - obRope.scale.y) * 0.6;
      // Fishermen lean forward when hauling
      obFishermen.forEach((f, fi) => {
        f.rotation.x = Math.sin(t * 0.4 + fi * Math.PI) * 0.15 + 0.1;
      });
      // Swimming kids bob in floaties
      swimKids.forEach((k) => {
        k.group.position.y = Math.sin(t * k.speed + k.phase) * 0.05;
        k.group.rotation.y = Math.sin(t * k.speed * 0.6 + k.phase) * 0.5;
        k.ring.rotation.z = Math.sin(t * k.speed * 0.8 + k.phase) * 0.15;
      });
      // Hot dog stand: customer bobs slightly, vendor turns head
      hdsCustomer.position.y = Math.abs(Math.sin(t * 0.8)) * 0.03;
      hdsVendor.rotation.y = Math.sin(t * 0.5) * 0.3;

      // v41: pelican flock formation flying
      pelicanFlockGroup.position.x += dt * 1.2;
      if (pelicanFlockGroup.position.x > 60) pelicanFlockGroup.position.x = -60;
      pfBirds.forEach((b) => {
        const flap = Math.sin(t * 6 + b.phase) * 0.5;
        b.wingL.rotation.z = flap;
        b.wingR.rotation.z = -flap;
      });
      // v41: fireflies wandering and blinking
      fireflies.forEach((f) => {
        f.mesh.position.x = f.baseX + Math.sin(t * f.speed + f.phase) * 0.4;
        f.mesh.position.z = f.baseZ + Math.cos(t * f.speed * 0.8 + f.phase) * 0.3;
        f.mesh.position.y = f.baseY + Math.sin(t * f.speed * 1.3 + f.phase) * 0.15;
        f.mesh.material.opacity = 0.4 + Math.abs(Math.sin(t * 2 + f.blinkPhase)) * 0.6;
      });
      // v41: horseshoes glint
      horseshoes.forEach((shoe, hi) => {
        shoe.rotation.z += dt * (hi === 0 ? 0 : 0.05) * (hi % 2 === 0 ? 1 : -1);
      });

      // v42: yoga class gentle sway
      yogaPeople.forEach((p) => {
        p.group.rotation.y = Math.sin(t * 0.4 + p.phase) * 0.08;
        p.group.position.y = Math.abs(Math.sin(t * 0.6 + p.phase)) * 0.02;
      });
      yogaInstructor.rotation.y = Math.PI + Math.sin(t * 0.3) * 0.15;
      // v42: starfish keeper checks bucket (head bob)
      sfkHead.rotation.y = Math.sin(t * 0.5) * 0.4;
      sfkHat.rotation.y = sfkHead.rotation.y;
      sfkStars.forEach((s, si) => {
        s.rotation.y += dt * 0.3 * (si + 1);
      });

      // v43: sandcastle judge looks around, flag flutters
      sandJudge.rotation.y = Math.PI + Math.sin(t * 0.4) * 0.6;
      c1Flag.rotation.y = Math.sin(t * 2) * 0.3;
      // v43: fish market vendor head turns
      fmvHead.rotation.y = Math.sin(t * 0.7) * 0.4;
      fmFish.forEach((f, fi) => {
        f.position.y = 0.78 + Math.sin(t * 0.5 + fi) * 0.005;
      });
      // v43: spectator 1 sways
      vs1Body.rotation.z = Math.sin(t * 0.5) * 0.06;
      vs1Head.rotation.y = Math.sin(t * 0.3) * 0.4;

      // v44: anemone tentacles sway, fish dart in pool
      apAnemones.forEach((a, ai) => {
        a.rotation.y = Math.sin(t * 0.6 + ai) * 0.3;
        a.scale.y = 1 + Math.sin(t * 1.2 + ai) * 0.08;
      });
      apFish.forEach((f, fi) => {
        const ang = t * 0.7 + fi * 2.1;
        f.position.x = Math.cos(ang) * 0.7;
        f.position.z = Math.sin(ang) * 0.7;
      });
      // v44: jeep light bar alternating red/blue blink
      const blink = Math.floor(t * 2) % 2;
      pjLightRed.material.opacity = blink ? 1 : 0.35;
      pjLightBlue.material.opacity = blink ? 0.35 : 1;
      pjLightRed.material.transparent = true;
      pjLightBlue.material.transparent = true;
      // v44: net mending fishermen subtle hand motion (rocking body)
      nmFisher1.rotation.y = Math.PI / 2 + Math.sin(t * 0.8) * 0.15;
      nmFisher2.rotation.y = -Math.PI / 2 - Math.sin(t * 0.8 + 0.7) * 0.15;

      // v45: helicopter rotor spins, tail rotor spins
      heliRotorPivot.rotation.y = t * 8;
      heliTailRotor.rotation.x = t * 14;
      // v45: DJ figure bobs to beat
      djFigure.position.y = Math.abs(Math.sin(t * 4)) * 0.06;
      djFigure.rotation.y = Math.sin(t * 1.5) * 0.25;
      // Speakers pulse subtly
      djSpeakers.forEach((s, si) => {
        s.scale.set(
          1 + Math.abs(Math.sin(t * 4 + si * 0.5)) * 0.04,
          1,
          1 + Math.abs(Math.sin(t * 4 + si * 0.5)) * 0.04
        );
      });
      // v45: painter arm moves slightly
      painterArm.rotation.x = 0.6 + Math.sin(t * 2.4) * 0.25;

      // v46: drone circles overhead, propellers spin, LED blinks
      const droneR = 18;
      const droneAngle = t * 0.35;
      beachDroneGroup.position.x = Math.cos(droneAngle) * droneR;
      beachDroneGroup.position.z = Math.sin(droneAngle) * droneR + 5;
      beachDroneGroup.position.y = 14 + Math.sin(t * 0.7) * 1.2;
      beachDroneGroup.rotation.y = -droneAngle - Math.PI / 2;
      for (const p of drProps) p.rotation.y += 0.8;
      drLED.material.color.setHex(((t * 2) % 2 < 1) ? 0xff0000 : 0x330000);
      // v46: seals breathe gently
      for (let i = 0; i < sandbarSeals.length; i++) {
        sandbarSeals[i].position.y = Math.sin(t * 0.6 + i * 0.7) * 0.04;
      }
      // v46: forklift driver subtle bob
      fkDriverBody.position.y = 1.6 + Math.sin(t * 1.2) * 0.02;

      // v47: spotlight tower beam rotates slowly
      spotHeadPivot.rotation.y = t * 0.4;
      spotLens.material.color.setHex(((t * 1.2) % 1) > 0.5 ? 0xffffaa : 0xffeebb);
      // v47: kite surfer rides forward; kite sways with wind
      const ksAng = t * 0.25;
      kiteSurferGroup.position.x = 28 + Math.cos(ksAng) * 4;
      kiteSurferGroup.position.z = 16 + Math.sin(ksAng) * 4;
      kiteSurferGroup.rotation.y = -ksAng + Math.PI / 2;
      kiteWing.rotation.z = 0.2 + Math.sin(t * 0.9) * 0.12;
      kiteStripe.rotation.z = 0.2 + Math.sin(t * 0.9) * 0.12;
      kiteWing.position.x = Math.sin(t * 0.6) * 0.4;
      kiteStripe.position.x = Math.sin(t * 0.6) * 0.4;
      // v47: souvenir trinkets sway
      for (let i = 0; i < ssTrinkets.length; i++) {
        ssTrinkets[i].rotation.z = Math.sin(t * 0.9 + i * 0.5) * 0.18;
      }

      // v48: pelican flock diving — birds plunge in cycle
      for (let i = 0; i < divePelicans.length; i++) {
        const bird = divePelicans[i];
        const ph = bird.userData.phase;
        const cycle = (t * 0.5 + ph) % (Math.PI * 2);
        // ascending then plunging dive
        const yPath = 6 + Math.sin(cycle) * 4 - Math.max(0, Math.sin(cycle - Math.PI) * 4);
        bird.position.y = Math.max(0.3, 6 + Math.cos(cycle) * 5);
        bird.position.x = bird.userData.cx + Math.sin(cycle * 0.5) * 1.2;
        bird.position.z = bird.userData.cz + Math.cos(cycle * 0.5) * 1.2;
        // tilt nose-down when descending
        bird.rotation.x = Math.sin(cycle) * 1.0;
        bird.rotation.y = cycle * 0.5;
      }
      // v48: souvenir bicycle vendor rides circular promenade route
      const bbAng = t * 0.18;
      beachBikeGroup.position.x = -15 + Math.cos(bbAng) * 6;
      beachBikeGroup.position.z = -8 + Math.sin(bbAng) * 6;
      beachBikeGroup.rotation.y = -bbAng + Math.PI / 2;
      bbWheel1.rotation.x = t * 8;
      bbWheel2.rotation.x = t * 8;
      // v48: lifeboat sways gently on davit cables
      lbHull.rotation.z = Math.sin(t * 0.6) * 0.04;
      lbCanopy.rotation.z = Math.sin(t * 0.6) * 0.04;
      lbStripe.rotation.z = Math.sin(t * 0.6) * 0.04;
      // v49: pump-out gauge lights blink
      poGauge2.material.color.setHex(((t * 1.5) % 1) > 0.5 ? 0xff5050 : 0x402020);
      // v49: dive shop tanks subtle bob (settling)
      for (let i = 0; i < dsTanks.length; i++) {
        dsTanks[i].position.y = 0.6 + Math.sin(t * 0.8 + i * 0.7) * 0.01;
      }
      // v49: lemonade pitcher gently rotates as if stirring
      lmPitcher.rotation.y = t * 0.5;
      // v50: lifeguard scans (rotates head and binoculars)
      lgGuardHead.rotation.y = Math.sin(t * 0.4) * 0.6;
      lgBinoc.position.x = 0.5 + Math.sin(t * 0.4) * 0.18;
      // v50: red flag waves
      lgFlag.rotation.y = Math.sin(t * 1.5) * 0.25;
      // v50: floating buoys bob and gently rotate
      for (let i = 0; i < bfBuoys.length; i++) {
        bfBuoys[i].position.y = Math.sin(t * 0.8 + i * 0.7) * 0.18;
        bfBuoys[i].rotation.y = Math.sin(t * 0.3 + i) * 0.4;
      }
      // v51: surf students sway as they 'pretend-balance'
      for (let i = 0; i < slStudentBodies.length; i++) {
        slStudentBodies[i].rotation.z = Math.sin(t * 1.5 + i * 1.2) * 0.1;
      }
      // v51: pier kid bobber bobs in water
      pkBobber.position.y = 0.05 + Math.sin(t * 2.4) * 0.04;
      // v51: ferry passengers gently sway
      for (let i = 0; i < fryPassengers.length; i++) {
        fryPassengers[i].rotation.z = Math.sin(t * 0.9 + i * 0.6) * 0.05;
      }
      // v52: cargo crane trolley slides + container lowers
      csTrolley.position.x = 0.5 + Math.sin(t * 0.4) * 1.4;
      csHangCable.position.x = csTrolley.position.x;
      csHangContainer.position.x = csTrolley.position.x;
      csHangContainer.position.y = 3.0 + Math.sin(t * 0.3) * 0.4;
      csHangCable.scale.y = 1 + Math.sin(t * 0.3) * 0.25;
      // v52: heron pecks at water
      phHead.rotation.z = Math.max(0, Math.sin(t * 0.7)) * -1.2;
      phNeck.rotation.z = -0.5 + Math.max(0, Math.sin(t * 0.7)) * -0.5;
      phBeak.rotation.z = -Math.PI / 2 + Math.max(0, Math.sin(t * 0.7)) * -0.7;
      // v53: BBQ smoke drifts up
      for (let i = 0; i < bgSmokes.length; i++) {
        const phase = (t * 0.4 + i * 0.7) % 2.0;
        bgSmokes[i].position.y = 1.6 + phase * 0.6;
        bgSmokes[i].material.opacity = 0.6 * (1 - phase / 2.0);
        bgSmokes[i].position.x = Math.sin(t * 0.5 + i) * 0.1;
      }
      // v53: snorkelers gently bob in water
      for (let i = 0; i < snorkelers.length; i++) {
        snorkelers[i].position.y = Math.sin(t * 0.8 + i * 1.2) * 0.04;
      }
      // v53: bubbles rise then reset
      for (let i = 0; i < snBubbles.length; i++) {
        snBubbles[i].position.y = 0.18 + ((t * 0.3 + i * 0.5) % 1.5) * 0.5;
      }
      // v53: photographer camera flash blinks
      phgrFlash.material.opacity = (Math.sin(t * 5) > 0.95) ? 1 : 0.4;
      phgrFlash.scale.setScalar(1 + (Math.sin(t * 5) > 0.95 ? 0.5 : 0));
      // v54: sailboat rocks gently at anchor
      sailGroup.rotation.z = Math.sin(t * 0.5) * 0.04;
      sailGroup.position.y = Math.sin(t * 0.7) * 0.06;
      sailJib.rotation.y = 0.1 + Math.sin(t * 1.2) * 0.08;
      // v54: kite sways in the wind
      kKite.position.x = 2.5 + Math.sin(t * 0.8) * 0.4;
      kKite.position.y = 4.0 + Math.cos(t * 0.6) * 0.3;
      kKite.rotation.z = Math.sin(t * 0.7) * 0.15;
      kKiteStripe.position.x = kKite.position.x;
      kKiteStripe.position.y = kKite.position.y;
      kKiteStripe.rotation.z = kKite.rotation.z;
      for (let i = 0; i < kTails.length; i++) {
        kTails[i].rotation.z = Math.sin(t * 1.4 + i * 0.5) * 0.4;
      }
      // v54: lantern flickers
      dtLantern.material.color.setScalar(0.85 + Math.sin(t * 8.0) * 0.15);
      dtLanternLight.intensity = 0.3 + Math.sin(t * 8.0) * 0.08;
      // v55: hammock sways gently
      hammockGroup.rotation.z = Math.sin(t * 0.6) * 0.04;
      hmHammock.position.y = 1.4 + Math.sin(t * 0.6) * 0.03;
      hmPersonBody.position.y = 1.55 + Math.sin(t * 0.6) * 0.03;
      hmPersonHead.position.y = 1.65 + Math.sin(t * 0.6) * 0.03;
      hmHat.position.y = 1.78 + Math.sin(t * 0.6) * 0.03;
      // v55: cutter rolls and red light blinks
      cutterGroup.rotation.z = Math.sin(t * 0.8) * 0.05;
      cutterGroup.position.x = 75 + Math.sin(t * 0.3) * 1.5;
      cutterLight.material.opacity = 0.4 + 0.6 * (Math.sin(t * 6.0) > 0 ? 1 : 0);
      cutterLight.material.transparent = true;
      // v55: race crabs scuttle back and forth
      for (let i = 0; i < raceCrabs.length; i++) {
        const rc = raceCrabs[i];
        const phase = (t * rc.userData.speed + i * 0.7) % 4;
        const dir = phase < 2 ? phase / 2 : (4 - phase) / 2;
        rc.position.x = -2.0 + dir * 4.0;
        rc.position.y = 0.18 + Math.abs(Math.sin(t * 8.0 + i)) * 0.05;
        rc.rotation.y = Math.sin(t * 12.0 + i) * 0.3;
      }
      crMasterFlag.rotation.y = Math.sin(t * 4.0) * 0.6;
      // v56: kid bounces on trampoline; trampoline pad sags briefly
      const tBounce = Math.abs(Math.sin(t * 2.5));
      trKid.position.y = 0.75 + tBounce * 0.8;
      trMatPad.scale.y = 1 - (1 - tBounce) * 0.4;
      // v56: cleaner saws fish
      fcsCleanerArm.rotation.z = -0.5 + Math.sin(t * 6.0) * 0.4;
      // v56: turtle flippers paddle gently and head bobs
      stFlipperFL.rotation.z = Math.sin(t * 1.2) * 0.2;
      stFlipperFR.rotation.z = -Math.sin(t * 1.2) * 0.2;
      stFlipperBL.rotation.z = Math.sin(t * 1.2 + 1.0) * 0.15;
      stFlipperBR.rotation.z = -Math.sin(t * 1.2 + 1.0) * 0.15;
      stTurtleHead.position.y = 0.05 + Math.sin(t * 0.8) * 0.04;
      // v57: swings sway in opposite phase
      if (swings.length >= 2) {
        swings[0].rotation.x = Math.sin(t * 1.5) * 0.4;
        swings[1].rotation.x = -Math.sin(t * 1.5) * 0.4;
      }
      // v57: rescue jet ski tilts on swells, rider leans, wake pulses
      rescueJSGroup.rotation.z = Math.sin(t * 1.6) * 0.06;
      rjsRiderBody.rotation.x = Math.sin(t * 1.6) * 0.08;
      rjsWakeMat.opacity = 0.4 + Math.sin(t * 3.0) * 0.2;
      // v57: pirate flag flutters
      tsbFlag.rotation.y = Math.sin(t * 2.5) * 0.3;
      tsbSkull.position.x = -0.05 + Math.sin(t * 2.5) * 0.04;
      // v58: kid slides down, resets
      const sldT = (t * 0.7) % 3.0;
      if (sldT < 2.0) {
        sldKid.position.set(0, 2.2 - sldT * 0.6, -0.5 + sldT * 1.5);
        sldKid.rotation.x = -0.6;
      } else {
        sldKid.position.set(0, 0, 2.5);
        sldKid.rotation.x = 0;
      }
      // v58: anemometer spins, windsock sways
      wsAnem.rotation.y += 0.08;
      wsSock.rotation.z = Math.sin(t * 1.2) * 0.2;
      // v58: sculptor head turns side to side
      smSculptorHead.rotation.y = Math.sin(t * 0.8) * 0.5;
      // v59: dog runs in a small circle around the lighthouse area
      const dogA = t * 1.6;
      dogGroup.position.set(-30 + Math.cos(dogA) * 3.0, Math.abs(Math.sin(t * 6)) * 0.05, -8 + Math.sin(dogA) * 3.0);
      dogGroup.rotation.y = -dogA + Math.PI / 2;
      dogTail.rotation.z = -0.7 + Math.sin(t * 8) * 0.4;
      dogLegs[0].rotation.x = Math.sin(t * 9) * 0.6;
      dogLegs[1].rotation.x = -Math.sin(t * 9) * 0.6;
      dogLegs[2].rotation.x = -Math.sin(t * 9) * 0.6;
      dogLegs[3].rotation.x = Math.sin(t * 9) * 0.6;
      // v59: mill wheel rotates
      millWheel.rotation.x += 0.03;
      // v59: fish & chips serving window: customer sways slightly
      fctCustomer.rotation.y = Math.sin(t * 0.7) * 0.15;
      // v60: soccer ball bounces back and forth in field; players bob
      soccerBall.position.x = Math.sin(t * 0.8) * 3.5;
      soccerBall.position.y = 0.18 + Math.abs(Math.sin(t * 4)) * 0.15;
      soccerPlayers.forEach((p, i) => {
        p.position.y = Math.abs(Math.sin(t * 3 + i * 0.7)) * 0.06;
        p.rotation.y = Math.sin(t * 1.2 + i) * 0.4;
      });
      // v60: tower pelican preens (head turns periodically)
      tpHead.rotation.y = Math.sin(t * 0.5) * 0.7;
      // v60: octopus tentacles wave; eyes blink occasionally
      octoTentacles.forEach((tent, i) => {
        const wob = Math.sin(t * 2 + tent.baseAng * 2) * 0.3;
        tent.mesh.rotation.z = Math.cos(tent.baseAng) * 0.6 + wob;
        tent.mesh.rotation.x = Math.sin(tent.baseAng) * 0.6 + wob;
      });
      // v61: customer arm at fuel dock pumps
      fuelCustArm.rotation.z = -0.5 + Math.sin(t * 2.5) * 0.3;
      // v61: dolphin show — two dolphins arc, splash on landing
      const dPhase = t * 1.4;
      const arcY1 = Math.max(0, Math.sin(dPhase) * 2.6);
      const arcY2 = Math.max(0, Math.sin(dPhase + Math.PI) * 2.6);
      dShow1.position.set(Math.cos(dPhase) * 1.5, arcY1, 0);
      dShow1.rotation.z = -dPhase * 0.6;
      dShow2.position.set(Math.cos(dPhase + Math.PI) * 1.5 + 3.0, arcY2, 0);
      dShow2.rotation.z = -(dPhase + Math.PI) * 0.6;
      dShowSplashes.forEach((sp, i) => {
        const phase = (t * 2 + i * 0.4) % 1.0;
        const visible = arcY1 < 0.2 || arcY2 < 0.2;
        sp.visible = visible && phase < 0.5;
        const targetX = arcY1 < 0.2 ? Math.cos(dPhase) * 1.5 : Math.cos(dPhase + Math.PI) * 1.5 + 3.0;
        sp.position.set(targetX + (i % 3 - 1) * 0.3, phase * 0.8, (Math.floor(i / 3) - 0.5) * 0.6);
      });
      // v62: helicopter rotor spins; cable+rescuer descend/ascend
      rcRotor.rotation.y += 0.6;
      rcTailRotor.rotation.x += 0.8;
      const rcOsc = Math.sin(t * 0.4) * 1.5 - 1.5; // -3 to 0
      rcRescuer.position.y = -5.0 + rcOsc;
      rcCable.position.y = -2.5 + rcOsc / 2;
      rcCable.scale.y = 1.0 + rcOsc / -5;
      // v62: surfer waves arm
      rcSurferArm.rotation.z = -1.0 + Math.sin(t * 4) * 0.5;
      // v62: buoy bobs gently, light pulses
      slBuoyGroup.position.y = 0.18 + Math.sin(t * 1.2) * 0.06;
      slBuoyGroup.rotation.z = Math.sin(t * 0.8) * 0.04;
      slBuoyLight.material.emissiveIntensity = 0.5 + Math.abs(Math.sin(t * 1.5)) * 0.4;
      // v63: shower spray drops fall, bather sways slightly
      shDrops.forEach((d, di) => {
        d.phase = (d.phase + dt * 0.8) % 1.0;
        const fall = d.phase * 2.4;
        d.mesh.position.set(0.5 + (Math.random() - 0.5) * 0.04, 2.4 - fall, (Math.random() - 0.5) * 0.18);
        d.mesh.material.opacity = 0.7 * (1 - d.phase);
        d.mesh.visible = d.phase < 0.95;
      });
      shBatherBody.rotation.y = Math.sin(t * 0.6) * 0.15;
      shBatherHead.rotation.y = Math.sin(t * 0.6) * 0.15;
      shBatherArm.rotation.z = -0.6 + Math.sin(t * 1.4) * 0.25;
      // v63: submarine slowly bobs and translates along the horizon
      const subBaseX = 70 + Math.sin(t * 0.04) * 18;
      subGroup.position.x = subBaseX;
      subGroup.position.y = -0.3 + Math.sin(t * 0.4) * 0.06;
      subGroup.rotation.y = 0.3 + Math.sin(t * 0.05) * 0.04;
      subPeriscope.rotation.y = Math.sin(t * 0.5) * 0.6;
      subPerHead.rotation.y = subPeriscope.rotation.y;
      subWake.material.opacity = 0.4 + 0.2 * Math.sin(t * 0.7);
      // v63: wedding flowers gently breathe; bride+groom subtle sway
      wedFlowers.forEach((f, fi) => {
        f.position.y = (2.4 + Math.sin(Math.PI * (fi / 17)) * 1.0) + Math.sin(t * 0.5 + fi) * 0.02;
      });
      wedBride.rotation.y = Math.sin(t * 0.4) * 0.05;
      wedGroom.rotation.y = -Math.sin(t * 0.4) * 0.05;
      // v63: ... (kept above)
      // v64: ants march toward food in lines
      ants.forEach((a, ai) => {
        a.phase = (a.phase + dt * 0.15) % 1.0;
        const path = a.phase;
        const linez = (a.line - 1) * 0.18;
        a.mesh.position.set(-1.0 + path * 1.6, 0.81, linez + Math.sin(path * 12 + ai) * 0.04);
      });
      // v64: ice cream truck cone wobbles slightly; vendor leans
      ictConeRoof.rotation.y = Math.sin(t * 0.6) * 0.15;
      ictVendor.position.y = Math.abs(Math.sin(t * 1.2)) * 0.04;
      ictCustomer.rotation.y = Math.sin(t * 0.5) * 0.1;
      // v64: distant whale fluke — long cycle, breach + splash
      fluke2Cycle = (fluke2Cycle + dt) % 22.0;
      if (fluke2Cycle < 4.0) {
        fluke2Group.visible = true;
        const fp = fluke2Cycle / 4.0;
        const rise = Math.sin(fp * Math.PI);
        fluke2Group.position.y = -2 + rise * 3.5;
        fluke2L.rotation.z = -0.3 + Math.sin(fp * Math.PI * 2) * 0.15;
        fluke2R.rotation.z = 0.3 - Math.sin(fp * Math.PI * 2) * 0.15;
        fluke2Splashes.forEach((s, si) => {
          const sp = (fp + si * 0.07) % 1.0;
          s.visible = sp < 0.6 && fp > 0.3;
          const ang = (si / 10) * Math.PI * 2;
          s.position.set(Math.cos(ang) * sp * 1.4, sp * 1.2, Math.sin(ang) * sp * 1.4);
          s.material.opacity = 0.8 * (1 - sp);
        });
      } else {
        fluke2Group.visible = false;
      }
      // v65: Skee-ball arcade scoring lights flicker
      arcScoreLights.forEach((sl, i) => {
        const phase = (t * 4 + i * 0.7) % 1.0;
        sl.material.color.setHex(phase < 0.5 ? 0xfde047 : 0xf97316);
      });
      // v65: Tow boat slowly drifts forward (z), wake bobs
      towSceneGroup.position.x = 45 + Math.sin(t * 0.15) * 1.2;
      towWake.material.opacity = 0.4 + 0.15 * Math.sin(t * 6);
      // v65: Cliff diver parabolic dive cycle (~6 sec total)
      cliffDiveCycle = (cliffDiveCycle + dt * 0.16) % 1.5;
      if (cliffDiveCycle < 1.0) {
        cliffDiver.visible = true;
        const u = cliffDiveCycle;
        // parabolic arc: x linear, y starts at top, drops with gravity
        cliffDiver.position.x = cliffDiveTopX + (cliffDiveEntryX - cliffDiveTopX) * u;
        cliffDiver.position.y = cliffDiveTopY + (cliffDiveEntryY - cliffDiveTopY) * (u * u);
        cliffDiver.position.z = cliffDiveTopZ + (cliffDiveEntryZ - cliffDiveTopZ) * u;
        // rotation: tumble forward through dive
        cliffDiver.rotation.x = -Math.PI / 2 + u * Math.PI * 1.3;
        cliffSplashes.forEach(s => { s.visible = false; });
      } else {
        cliffDiver.visible = false;
        // splash burst for 0.5s
        const sp = (cliffDiveCycle - 1.0) / 0.5;
        cliffSplashes.forEach((s, i) => {
          s.visible = true;
          const ang = (i / 8) * Math.PI * 2;
          const r = 0.4 + sp * 1.2;
          s.position.x = cliffDiveEntryX + Math.cos(ang) * r;
          s.position.z = cliffDiveEntryZ + Math.sin(ang) * r;
          s.position.y = 0.05 + sp * 0.6 * (1 - sp) * 4;
          s.material.opacity = 0.8 * (1 - sp);
        });
      }
    }

  }


  return { group, update };
}

export default { createAnchorageLandmark };
