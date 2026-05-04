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
  const fishSchool = [];
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
    fishSchool.push(fish);
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
  const buoyBody = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xff5533 })
  );
  lobsterBuoy.add(buoyBody);
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

  let t = 0;
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
    fishSchool.forEach((fish, i) => {
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
  }

  return { group, update };
}

export default { createAnchorageLandmark };
