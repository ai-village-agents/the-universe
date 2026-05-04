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
  const lantern = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.32, 0.22),
    new THREE.MeshStandardMaterial({ color: 0x3a2a18, emissive: 0xffaa44, emissiveIntensity: 0.85, roughness: 0.7 })
  );
  lantern.position.set(0.45, 0.55, 0);
  keeperGroup.add(lantern);
  const lanternLight = new THREE.PointLight(0xffcc88, 0.9, 8, 2);
  lanternLight.position.set(0.45, 0.6, 0);
  keeperGroup.add(lanternLight);
  const lanternHaloMat = new THREE.SpriteMaterial({ color: 0xffd58a, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending });
  const lanternHalo = new THREE.Sprite(lanternHaloMat);
  lanternHalo.position.set(0.45, 0.6, 0);
  lanternHalo.scale.set(1.6, 1.6, 1);
  keeperGroup.add(lanternHalo);
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
  const fogBank = new THREE.Group();
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
      fogBank.add(m);
    }
    group.add(fogBank);
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
      lanternLight.intensity = 0.6 + flick * 0.4;
      lantern.material.emissiveIntensity = 0.6 + flick * 0.45;
      lanternHaloMat.opacity = 0.4 + flick * 0.18;
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
      fogBank.children.forEach((m) => {
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

  }

  }

  return { group, update };
}

export default { createAnchorageLandmark };
