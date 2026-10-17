/* ============================================================
   ANNIV — scene.js
   Scène Three.js : Boîte à bijoux 3D géométrique élégante
   avec ouverture charnière GSAP fluide sur 2 secondes
   ============================================================ */
(function () {
  'use strict';

  var THREE = window.THREE;
  var gsap  = window.gsap;

  if (!THREE || !gsap) {
    console.error('[scene.js] Three.js ou GSAP non disponible.');
    return;
  }

  /* ----------------------------------------------------------
     1. RENDERER
  ---------------------------------------------------------- */
  var canvas = document.getElementById('three-canvas');

  var renderer = new THREE.WebGLRenderer({
    canvas:    canvas,
    antialias: true,
    alpha:     true, // fond transparent pour conserver l'ambiance sombre/étoilée
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
  renderer.toneMapping       = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  if (THREE.SRGBColorSpace) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  /* ----------------------------------------------------------
     2. SCÈNE, CAMÉRA & ENVIRONNEMENT RÉFLÉCHISSANT
  ---------------------------------------------------------- */
  var scene = new THREE.Scene();

  // Création dynamique d'un Environment Map (ambiance boudoir / lumière dorée)
  // pour simuler des reflets réalistes dans le miroir physique
  function createMirrorEnvMap(glRenderer) {
    var pmremGenerator = new THREE.PMREMGenerator(glRenderer);
    pmremGenerator.compileEquirectangularShader();

    var c = document.createElement('canvas');
    c.width  = 1024;
    c.height = 512;
    var ctx = c.getContext('2d');

    // Dégradé de pièce chaleureuse et feutrée
    var grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0.00, '#362115'); // Plafond chaud
    grad.addColorStop(0.28, '#583620'); // Murs feutrés
    grad.addColorStop(0.48, '#e6c584'); // Ligne d'horizon lumineuse dorée
    grad.addColorStop(0.56, '#6b401f'); // Boiseries
    grad.addColorStop(0.78, '#26110a'); // Sol sombre velours
    grad.addColorStop(1.00, '#0c0503');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    // Sources de lumière réalistes (lustre et lampes d'ambiance)
    function addLightSource(x, y, r, color) {
      var rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0.0, color);
      rg.addColorStop(0.35, 'rgba(255, 248, 230, 0.85)');
      rg.addColorStop(1.0, 'rgba(255, 248, 230, 0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    addLightSource(512, 100, 150, 'rgba(255, 255, 255, 1.0)'); // Lustre central
    addLightSource(512, 110, 260, 'rgba(255, 235, 180, 0.6)');
    addLightSource(200, 180, 110, 'rgba(255, 240, 200, 0.85)'); // Applique gauche
    addLightSource(824, 180, 110, 'rgba(255, 240, 200, 0.85)'); // Applique droite
    addLightSource(512, 256, 180, 'rgba(240, 210, 140, 0.50)');

    var canvasTex = new THREE.CanvasTexture(c);
    canvasTex.mapping = THREE.EquirectangularReflectionMapping;

    var rt = pmremGenerator.fromEquirectangular(canvasTex);
    pmremGenerator.dispose();
    canvasTex.dispose();

    return rt.texture;
  }

  var mirrorEnvMap = createMirrorEnvMap(renderer);
  scene.environment = mirrorEnvMap; // enrichit la physicalité de toute la scène

  var camera = new THREE.PerspectiveCamera(
    42,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 2.5, 5.2);
  camera.lookAt(0, 0.45, 0);

  /* ----------------------------------------------------------
     3. ÉCLAIRAGE DOUX & OMBRES
  ---------------------------------------------------------- */
  // Lumière ambiante chaude et enveloppante
  var ambientLight = new THREE.AmbientLight(0xfff6ea, 0.65);
  scene.add(ambientLight);

  // Lumière directionnelle principale (haut-droite-avant) pour ombres nettes mais douces
  var dirLight = new THREE.DirectionalLight(0xfffaec, 2.4);
  dirLight.position.set(3.5, 7.5, 5.0);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width  = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near    = 0.5;
  dirLight.shadow.camera.far     = 25;
  dirLight.shadow.camera.left    = -4;
  dirLight.shadow.camera.right   =  4;
  dirLight.shadow.camera.top     =  4;
  dirLight.shadow.camera.bottom  = -4;
  dirLight.shadow.bias           = -0.0003;
  dirLight.shadow.normalBias     =  0.02;
  scene.add(dirLight);

  // Lumière de débouchage (fill) douce et légèrement fraîche
  var fillLight = new THREE.DirectionalLight(0xdbe6f7, 0.5);
  fillLight.position.set(-4.5, 3.2, -1.0);
  scene.add(fillLight);

  // Contre-jour chaud (rim light) pour détacher les contours dorés
  var rimLight = new THREE.PointLight(0xd4a853, 1.2, 12);
  rimLight.position.set(0, 1.6, -3.5);
  scene.add(rimLight);

  // Spotlight intérieur : braqué sur le bijou, s'allume lors de l'ouverture
  var spotInner = new THREE.SpotLight(0xfff5e6, 0.0, 8, Math.PI * 0.25, 0.5, 1.2);
  spotInner.position.set(0, 4.5, 0.4);
  spotInner.target.position.set(0, 0.55, 0);
  scene.add(spotInner);
  scene.add(spotInner.target);

  // Petite lueur scintillante au niveau du diamant
  var gemGlow = new THREE.PointLight(0xffffff, 0.0, 3, 2);
  gemGlow.position.set(0, 0.8, 0);
  scene.add(gemGlow);

  /* ----------------------------------------------------------
     4. MATÉRIAUX
  ---------------------------------------------------------- */
  // Extérieur boîte : beige/crème ivoire luxueux avec léger satiné
  var matBox = new THREE.MeshStandardMaterial({
    color:     0xf5efe6,
    roughness: 0.22,
    metalness: 0.02,
  });

  // Doublure velours bordeaux royal profond (intérieur)
  var matVelvet = new THREE.MeshStandardMaterial({
    color:     0x420c1d,
    roughness: 0.96,
    metalness: 0.0,
  });

  // Coussin intérieur velours
  var matCushion = new THREE.MeshStandardMaterial({
    color:     0x561127,
    roughness: 0.92,
    metalness: 0.0,
  });

  // Soie champagne / ivoire pour l'intérieur du couvercle
  var matSilkLid = new THREE.MeshStandardMaterial({
    color:     0xf8f4eb,
    roughness: 0.85,
    metalness: 0.05,
  });

  // Or poli haute joaillerie (charnières, fermoir, liserés, bague)
  var matGold = new THREE.MeshStandardMaterial({
    color:             0xd4a853,
    roughness:         0.20,
    metalness:         0.90,
    emissive:          0xd4a853,
    emissiveIntensity: 0.05,
  });

  // Diamant / Pierre précieuse (scintillant, facetté)
  var matDiamond = new THREE.MeshStandardMaterial({
    color:             0xffffff,
    roughness:         0.02,
    metalness:         0.10,
    emissive:          0xaad4ff,
    emissiveIntensity: 0.35,
  });

  // Miroir intérieur (MeshPhysicalMaterial ultra-réfléchissant avec envMap)
  var matMirror = new THREE.MeshPhysicalMaterial({
    color:              0xffffff,
    metalness:          1.0,
    roughness:          0.0,
    reflectivity:       1.0,
    clearcoat:          1.0,
    clearcoatRoughness: 0.0,
    envMap:             mirrorEnvMap,
    envMapIntensity:    2.0,
    side:               THREE.DoubleSide,
  });

  // Cadre photo intérieur (chargement de la texture locale 'photo.jpg')
  var textureLoader = new THREE.TextureLoader();
  var photoTexture  = textureLoader.load('photo.jpg?v=' + Date.now());
  if (THREE.SRGBColorSpace) {
    photoTexture.colorSpace = THREE.SRGBColorSpace;
  }
  var matPhoto = new THREE.MeshStandardMaterial({
    map:       photoTexture,
    roughness: 0.38,
    metalness: 0.04,
    side:      THREE.DoubleSide,
  });

  // Argent pur / Platine éclatant (pour le bracelet fin)
  var matSilver = new THREE.MeshStandardMaterial({
    color:             0xf2f6fa,
    roughness:         0.08,
    metalness:         0.96,
    emissive:          0xdde8f5,
    emissiveIntensity: 0.04,
    envMap:            mirrorEnvMap,
    envMapIntensity:   1.8,
  });

  // Cristal de joaillerie précieux translucide et scintillant (pour le pendentif du collier)
  var matCrystal = new THREE.MeshPhysicalMaterial({
    color:              0xffffff,
    transmission:       0.90,
    opacity:            1.0,
    transparent:        true,
    roughness:          0.03,
    metalness:          0.06,
    ior:                1.76,
    reflectivity:       1.0,
    envMap:             mirrorEnvMap,
    envMapIntensity:    2.4,
    emissive:           0xffe0f0,
    emissiveIntensity:  0.30,
  });

  /* ----------------------------------------------------------
     5. GROUPES HIÉRARCHIQUES
  ---------------------------------------------------------- */
  // Groupe racine pivotable pour l'interaction utilisateur (drag / orbite)
  var sceneGroup = new THREE.Group();
  scene.add(sceneGroup);

  // Sous-groupe boîte (pour les oscillations idle indépendantes)
  var boxGroup = new THREE.Group();
  sceneGroup.add(boxGroup);

  /* ----------------------------------------------------------
     6. GÉOMÉTRIE DE LA BOÎTE À BIJOUX
     Base rectangulaire proportionnée + couvercle articulé
  ---------------------------------------------------------- */
  var W     = 2.40;   // Largeur (axe X)
  var H     = 0.54;   // Hauteur de la base (axe Y)
  var D     = 1.65;   // Profondeur (axe Z)
  var LID_H = 0.22;   // Épaisseur du couvercle (axe Y)
  var TRIM  = 0.025;  // Épaisseur des liserés dorés

  /* --- Sol récepteur d'ombres douces --- */
  var shadowMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    new THREE.ShadowMaterial({ opacity: 0.35 })
  );
  shadowMesh.rotation.x    = -Math.PI / 2;
  shadowMesh.receiveShadow = true;
  boxGroup.add(shadowMesh);

  /* --- A) BASE DE LA BOÎTE --- */
  var baseMesh = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), matBox);
  baseMesh.position.set(0, H / 2, 0);
  baseMesh.castShadow    = true;
  baseMesh.receiveShadow = true;
  boxGroup.add(baseMesh);

  // Fond intérieur en velours bordeaux (visible quand ouverte)
  var velvetFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(W - 0.12, D - 0.12),
    matVelvet
  );
  velvetFloor.rotation.x = -Math.PI / 2;
  velvetFloor.position.set(0, H + 0.003, 0);
  velvetFloor.receiveShadow = true;
  boxGroup.add(velvetFloor);

  // Liseré doré décoratif tout autour d'un rectangle (base, couvercle, miroir, cadre photo)
  function createBorderFrame(parent, width, depth, barThick, barHeight, yPos, zCenter, xCenter) {
    zCenter = zCenter || 0;
    xCenter = xCenter || 0;
    var halfW = width / 2;
    var halfD = depth / 2;
    // Avant et arrière
    var fbGeom = new THREE.BoxGeometry(width, barHeight, barThick);
    var fMesh = new THREE.Mesh(fbGeom, matGold);
    fMesh.position.set(xCenter, yPos, zCenter + halfD - barThick / 2);
    fMesh.castShadow = true;
    parent.add(fMesh);

    var bMesh = new THREE.Mesh(fbGeom, matGold);
    bMesh.position.set(xCenter, yPos, zCenter - halfD + barThick / 2);
    bMesh.castShadow = true;
    parent.add(bMesh);

    // Gauche et droite
    var lrGeom = new THREE.BoxGeometry(barThick, barHeight, depth - barThick * 2);
    var lMesh = new THREE.Mesh(lrGeom, matGold);
    lMesh.position.set(xCenter - halfW + barThick / 2, yPos, zCenter);
    lMesh.castShadow = true;
    parent.add(lMesh);

    var rMesh = new THREE.Mesh(lrGeom, matGold);
    rMesh.position.set(xCenter + halfW - barThick / 2, yPos, zCenter);
    rMesh.castShadow = true;
    parent.add(rMesh);
  }

  // Liseré bordure supérieure de la base
  createBorderFrame(boxGroup, W + 0.02, D + 0.02, 0.035, TRIM, H - TRIM / 2);

  // Fermoir inférieur (avant de la base)
  var baseClasp = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.07, 0.03),
    matGold
  );
  baseClasp.position.set(0, H - 0.04, D / 2 + 0.015);
  baseClasp.castShadow = true;
  boxGroup.add(baseClasp);

  /* --- B) COUSSINS & 3 BIJOUX DISTINCTS DANS LA BASE --- */
  // 3 Piédestaux velours (Gauche, Centre, Droite)
  function createJewelPedestal(xPos) {
    var pedGroup = new THREE.Group();
    pedGroup.position.set(xPos, H + 0.016, 0);

    var pad = new THREE.Mesh(
      new THREE.CylinderGeometry(0.20, 0.22, 0.05, 32),
      matCushion
    );
    pad.castShadow    = true;
    pad.receiveShadow = true;
    pedGroup.add(pad);

    var rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.007, 8, 32),
      matGold
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, -0.022, 0);
    pedGroup.add(rim);

    boxGroup.add(pedGroup);
    return pedGroup;
  }

  createJewelPedestal(0);      // Centre (Bague)
  createJewelPedestal(-0.66);  // Gauche (Bracelet)
  createJewelPedestal(0.66);   // Droite (Collier)

  var interactiveHitboxes = [];

  // --- BIJOU 1 : LA BAGUE SOLITAIRE (Centre) ---
  var ringGroup = new THREE.Group();
  ringGroup.position.set(0, H + 0.065, 0);
  ringGroup.userData = { jewelId: 'bague' };
  boxGroup.add(ringGroup);

  var ringBand = new THREE.Mesh(
    new THREE.TorusGeometry(0.12, 0.024, 24, 48),
    matGold
  );
  ringBand.rotation.x = Math.PI / 2;
  ringBand.castShadow = true;
  ringGroup.add(ringBand);

  var ringSetting = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.025, 0.05, 8),
    matGold
  );
  ringSetting.position.set(0, 0, -0.125);
  ringSetting.rotation.x = Math.PI / 2;
  ringBand.add(ringSetting);

  var diamond = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.055, 0),
    matDiamond
  );
  diamond.position.set(0, 0, -0.16);
  diamond.rotation.y = Math.PI / 4;
  ringBand.add(diamond);

  var ringHitbox = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 12, 12),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  ringHitbox.userData = { jewelId: 'bague' };
  ringGroup.add(ringHitbox);
  interactiveHitboxes.push(ringHitbox);

  // --- BIJOU 2 : LE BRACELET FIN (Gauche) ---
  var braceletGroup = new THREE.Group();
  braceletGroup.position.set(-0.66, H + 0.065, 0);
  braceletGroup.userData = { jewelId: 'bracelet' };
  boxGroup.add(braceletGroup);

  var braceletBangle = new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.015, 24, 64),
    matSilver
  );
  braceletBangle.rotation.x = Math.PI * 0.38;
  braceletBangle.rotation.y = Math.PI * 0.12;
  braceletBangle.castShadow = true;
  braceletGroup.add(braceletBangle);

  // Accents or et diamant sur le jonc
  var bClasp = new THREE.Mesh(
    new THREE.TorusGeometry(0.022, 0.007, 8, 16),
    matGold
  );
  bClasp.position.set(0, 0.18, 0);
  braceletBangle.add(bClasp);

  var bGem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.028, 0),
    matDiamond
  );
  bGem.position.set(0, -0.18, 0);
  braceletBangle.add(bGem);

  var braceletHitbox = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 12, 12),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  braceletHitbox.userData = { jewelId: 'bracelet' };
  braceletGroup.add(braceletHitbox);
  interactiveHitboxes.push(braceletHitbox);

  // --- BIJOU 3 : LE COLLIER PRÉCIEUX (Droite) ---
  var necklaceGroup = new THREE.Group();
  necklaceGroup.position.set(0.66, H + 0.065, 0);
  necklaceGroup.userData = { jewelId: 'collier' };
  boxGroup.add(necklaceGroup);

  var chainCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.14,  0.04, -0.07),
    new THREE.Vector3(-0.10,  0.02,  0.03),
    new THREE.Vector3( 0.00,  0.01,  0.13),
    new THREE.Vector3( 0.10,  0.02,  0.03),
    new THREE.Vector3( 0.14,  0.04, -0.07),
    new THREE.Vector3( 0.00,  0.045,-0.11)
  ]);
  chainCurve.closed = true;
  var chainMesh = new THREE.Mesh(
    new THREE.TubeGeometry(chainCurve, 48, 0.009, 10, true),
    matGold
  );
  chainMesh.castShadow = true;
  necklaceGroup.add(chainMesh);

  var pendantGroup = new THREE.Group();
  pendantGroup.position.set(0.0, 0.01, 0.13);
  necklaceGroup.add(pendantGroup);

  var bail = new THREE.Mesh(
    new THREE.TorusGeometry(0.022, 0.005, 8, 16),
    matGold
  );
  bail.rotation.y = Math.PI / 2;
  pendantGroup.add(bail);

  var crystalPendant = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.055, 0),
    matCrystal
  );
  crystalPendant.position.set(0, -0.045, 0);
  crystalPendant.rotation.y = Math.PI / 4;
  crystalPendant.castShadow = true;
  pendantGroup.add(crystalPendant);

  var necklaceHitbox = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 12, 12),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  necklaceHitbox.userData = { jewelId: 'collier' };
  necklaceGroup.add(necklaceHitbox);
  interactiveHitboxes.push(necklaceHitbox);

  // Petites particules dorées magiques flottant au-dessus des bijoux
  var sparklesCount = 36;
  var sparklesGeom = new THREE.BufferGeometry();
  var sparklesPos  = new Float32Array(sparklesCount * 3);
  for (var i = 0; i < sparklesCount; i++) {
    sparklesPos[i * 3 + 0] = (Math.random() - 0.5) * 1.8;
    sparklesPos[i * 3 + 1] = H + Math.random() * 0.6;
    sparklesPos[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
  }
  sparklesGeom.setAttribute('position', new THREE.BufferAttribute(sparklesPos, 3));
  var sparklesMat = new THREE.PointsMaterial({
    color:       0xfff0aa,
    size:        0.045,
    transparent: true,
    opacity:     0.0,
    blending:    THREE.AdditiveBlending,
  });
  var sparkles = new THREE.Points(sparklesGeom, sparklesMat);
  boxGroup.add(sparkles);

  /* ----------------------------------------------------------
     7. COUVERCLE ET PIVOT CHARNIÈRE (ARRIÈRE)
     ----------------------------------------------------------
     L'axe de charnière est situé exactement sur l'arête arrière
     supérieure de la boîte :
       • Y = H  (hauteur de la boîte)
       • Z = -D/2 (arête arrière)
     Le mesh du couvercle est décalé de +D/2 en Z local,
     pour que son arête arrière coïncide avec le pivot (0,0,0 local).
     Ainsi, lidPivot.rotation.x s'ouvre comme une vraie charnière !
  ---------------------------------------------------------- */
  var lidPivot = new THREE.Group();
  lidPivot.position.set(0, H, -D / 2);
  boxGroup.add(lidPivot);

  // Corps principal du couvercle (beige ivoire élégant)
  var lidMesh = new THREE.Mesh(new THREE.BoxGeometry(W, LID_H, D), matBox);
  lidMesh.position.set(0, LID_H / 2, D / 2);
  lidMesh.castShadow    = true;
  lidMesh.receiveShadow = true;
  lidPivot.add(lidMesh);

  // Panneau intérieur en soie/velours clair (fond visible quand le couvercle est ouvert)
  var lidInterior = new THREE.Mesh(
    new THREE.PlaneGeometry(W - 0.14, D - 0.14),
    matSilkLid
  );
  // Face orientée vers l'intérieur de la boîte quand fermé
  lidInterior.rotation.x = Math.PI / 2;
  lidInterior.position.set(0, -0.0005, D / 2);
  lidPivot.add(lidInterior);

  /* --- DEUX ÉLÉMENTS GÉOMÉTRIQUES PLATS INTÉRIEURS DU COUVERCLE --- */
  var itemW       = 0.88;
  var itemH       = 1.18;
  var itemOffsetX = 0.52;
  var frameThick  = 0.024;
  var frameHeight = 0.005;
  var frameY      = -0.0035;

  // 1. LE MIROIR (à gauche) : MeshPhysicalMaterial, metalness 1, roughness 0, avec reflets envMap
  var mirrorPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(itemW, itemH),
    matMirror
  );
  mirrorPlane.rotation.x = Math.PI / 2;
  mirrorPlane.position.set(-itemOffsetX, -0.0025, D / 2);
  lidPivot.add(mirrorPlane);

  // Petit cadre doré mouluré autour du miroir
  createBorderFrame(
    lidPivot,
    itemW + frameThick * 2,
    itemH + frameThick * 2,
    frameThick,
    frameHeight,
    frameY,
    D / 2,
    -itemOffsetX
  );

  // 2. LE CADRE PHOTO (à droite) : Image locale 'photo.jpg' chargée via TextureLoader
  var photoPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(itemW, itemH),
    matPhoto
  );
  photoPlane.rotation.x = Math.PI / 2;
  photoPlane.position.set(itemOffsetX, -0.0025, D / 2);
  lidPivot.add(photoPlane);

  // Petit cadre doré mouluré autour de la photo
  createBorderFrame(
    lidPivot,
    itemW + frameThick * 2,
    itemH + frameThick * 2,
    frameThick,
    frameHeight,
    frameY,
    D / 2,
    itemOffsetX
  );

  // Liseré doré de jointure (autour du bas du couvercle)
  createBorderFrame(lidPivot, W + 0.02, D + 0.02, 0.035, TRIM, TRIM / 2, D / 2);

  // Décoration dorée délicate sur le dessus du couvercle (cadre fin embossé)
  createBorderFrame(lidPivot, W - 0.22, D - 0.22, 0.022, 0.006, LID_H + 0.003, D / 2);

  // Fermoir supérieur (avant du couvercle, s'aligne avec le fermoir de la base)
  var lidClasp = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.08, 0.035),
    matGold
  );
  lidClasp.position.set(0, 0.04, D + 0.015);
  lidClasp.castShadow = true;
  lidPivot.add(lidClasp);

  // Anneau / tirette de joaillier sur le fermoir
  var claspRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.042, 0.012, 12, 24),
    matGold
  );
  claspRing.position.set(0, 0.02, D + 0.032);
  claspRing.rotation.x = Math.PI / 2;
  lidPivot.add(claspRing);

  // Deux charnières dorées réalistes à l'arrière
  function makeHinge(xPos) {
    var hinge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.024, 0.14, 16),
      matGold
    );
    hinge.rotation.z = Math.PI / 2;
    hinge.position.set(xPos, 0, 0); // pile sur l'axe du pivot
    hinge.castShadow = true;
    lidPivot.add(hinge);
  }
  makeHinge(-W * 0.28);
  makeHinge( W * 0.28);

  /* ----------------------------------------------------------
     8. ANIMATION GSAP D'OUVERTURE DE LA BOÎTE (2 SECONDES)
     ----------------------------------------------------------
     Rotation fluide du couvercle autour de la charnière arrière,
     avec élévation du bijou et révélation lumineuse.
  ---------------------------------------------------------- */
  var isOpen = false;

  window.openBox = function () {
    if (isOpen) return;
    isOpen = true;

    // a) Recentrer en douceur la boîte face caméra
    gsap.to(boxGroup.rotation, {
      x: 0,
      y: 0,
      duration: 0.6,
      ease: 'power2.out',
    });

    // b) OUVERTURE DU COUVERCLE : Rotation charnière sur 2 secondes exactes
    // -132° (Math.PI * 0.73) : position naturelle d'un écrin ouvert
    gsap.to(lidPivot.rotation, {
      x: -Math.PI * 0.73,
      duration: 2.0,
      ease: 'power2.inOut',
    });

    // c) Éclairage intérieur qui s'allume au fur et à mesure que la lumière pénètre
    gsap.to(spotInner, {
      intensity: 2.6,
      duration: 1.8,
      delay: 0.4,
      ease: 'power1.inOut',
    });

    // d) Scintillement du diamant
    gemGlow.position.set(0, H + 0.35, 0);
    gsap.to(gemGlow, {
      intensity: 1.8,
      duration: 1.5,
      delay: 1.0,
      ease: 'sine.inOut',
    });

    // e) Les 3 bijoux s'élèvent délicatement en cascade au-dessus des coussins
    gsap.to(ringGroup.position, {
      y: H + 0.26,
      duration: 1.9,
      delay: 0.7,
      ease: 'back.out(1.4)',
    });

    gsap.to(braceletGroup.position, {
      y: H + 0.24,
      duration: 1.9,
      delay: 0.85,
      ease: 'back.out(1.4)',
    });

    gsap.to(necklaceGroup.position, {
      y: H + 0.24,
      duration: 1.9,
      delay: 1.0,
      ease: 'back.out(1.4)',
    });

    // f) Légère inclinaison de la bague pour faire danser les reflets
    gsap.to(ringBand.rotation, {
      z: Math.PI * 0.08,
      y: Math.PI * 0.12,
      duration: 2.2,
      delay: 0.7,
      ease: 'power2.out',
    });

    // g) Particules étincelantes révélées
    gsap.to(sparklesMat, {
      opacity: 0.85,
      duration: 1.6,
      delay: 0.8,
    });

    // h) Cadrage doux et surélévation de la boîte pour faire place à la modale en bas
    var isMobile = window.innerWidth < 600;
    var targetBoxY = isMobile ? 0.44 : 0.32;
    var targetCamY = isMobile ? 2.65 : 2.5;
    var targetCamZ = isMobile ? 5.10 : 4.8;
    var targetLookY= isMobile ? 0.90 : 0.82;

    gsap.to(boxGroup.position, {
      y: targetBoxY,
      duration: 2.2,
      delay: 0.3,
      ease: 'power2.out',
    });

    gsap.to(camera.position, {
      y: targetCamY,
      z: targetCamZ,
      duration: 2.2,
      delay: 0.3,
      ease: 'sine.inOut',
      onUpdate: function () {
        camera.lookAt(0, targetLookY, 0);
      }
    });

    // i) Afficher la carte finale romantique une fois la boîte ouverte
    setTimeout(function () {
      var finalCard = document.getElementById('final-card');
      if (finalCard) {
        finalCard.classList.remove('hidden');
        void finalCard.offsetWidth;
        finalCard.classList.add('visible');
      }
      // Autoriser les interactions tactiles / souris pour tourner la boîte
      canvas.style.pointerEvents = 'auto';
    }, 2400);
  };

  /* Possibilité de refermer la boîte pour revivre le moment */
  window.closeBox = function () {
    if (!isOpen) return;
    isOpen = false;

    var finalCard = document.getElementById('final-card');
    if (finalCard) {
      finalCard.classList.remove('visible');
      setTimeout(function () { finalCard.classList.add('hidden'); }, 400);
    }

    if (typeof window.closeJewelModal === 'function') {
      window.closeJewelModal();
    }

    gsap.to(lidPivot.rotation, {
      x: 0,
      duration: 1.4,
      ease: 'power2.inOut',
    });

    gsap.to(boxGroup.position, {
      y: 0,
      duration: 1.4,
      ease: 'power2.inOut',
    });

    gsap.to(spotInner, { intensity: 0, duration: 1.0 });
    gsap.to(gemGlow,   { intensity: 0, duration: 0.8 });
    gsap.to(sparklesMat, { opacity: 0, duration: 0.8 });

    gsap.to(ringGroup.position, {
      y: H + 0.065,
      duration: 1.2,
      ease: 'power2.inOut',
    });

    gsap.to(braceletGroup.position, {
      y: H + 0.065,
      duration: 1.2,
      ease: 'power2.inOut',
    });

    gsap.to(necklaceGroup.position, {
      y: H + 0.065,
      duration: 1.2,
      ease: 'power2.inOut',
    });

    gsap.to(ringBand.rotation, {
      z: 0,
      y: 0,
      duration: 1.2,
    });

    gsap.to(camera.position, {
      y: 2.5,
      z: 5.2,
      duration: 1.5,
      ease: 'sine.inOut',
      onUpdate: function () { camera.lookAt(0, 0.45, 0); }
    });
  };

  /* ----------------------------------------------------------
     9. RAYCASTER & INTERACTION 3D (SOURIS & TOUCH)
     - Permet à l'utilisateur de faire tourner la boîte en 3D
     - Détecte les clics sur les 3 bijoux (bague, bracelet, collier)
     - Ouvre la modale HTML descriptive sans bloquer la rotation 3D
  ---------------------------------------------------------- */
  var raycaster = new THREE.Raycaster();
  var mouse     = new THREE.Vector2();

  var isDragging            = false;
  var previousMousePosition = { x: 0, y: 0 };
  var pointerDownPos        = { x: 0, y: 0, time: 0 };
  var targetRotationY       = 0;
  var targetRotationX       = 0;

  function getClientCoords(e) {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if (e.changedTouches && e.changedTouches.length > 0) {
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  function updateMouseCoord(clientX, clientY) {
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;
  }

  function onPointerDown(e) {
    isDragging = true;
    var coords = getClientCoords(e);
    previousMousePosition = { x: coords.x, y: coords.y };
    pointerDownPos        = { x: coords.x, y: coords.y, time: Date.now() };
    updateMouseCoord(coords.x, coords.y);
  }

  function onPointerMove(e) {
    var coords = getClientCoords(e);
    updateMouseCoord(coords.x, coords.y);

    if (isDragging) {
      var deltaX = coords.x - previousMousePosition.x;
      var deltaY = coords.y - previousMousePosition.y;

      targetRotationY += deltaX * 0.008;
      targetRotationX = Math.max(-0.4, Math.min(0.5, targetRotationX + deltaY * 0.005));

      previousMousePosition = { x: coords.x, y: coords.y };
    }

    // Effet de survol (cursor: pointer) sur les bijoux quand la boîte est ouverte
    if (isOpen && !isDragging) {
      raycaster.setFromCamera(mouse, camera);
      var intersects = raycaster.intersectObjects(interactiveHitboxes, false);
      if (intersects.length > 0) {
        canvas.style.cursor = 'pointer';
      } else {
        canvas.style.cursor = 'grab';
      }
    }
  }

  function onPointerUp(e) {
    var coords = getClientCoords(e);
    var dist = Math.hypot(coords.x - pointerDownPos.x, coords.y - pointerDownPos.y);
    var duration = Date.now() - pointerDownPos.time;

    isDragging = false;
    canvas.style.cursor = 'grab';

    // Détection de clic franc (< 8px de drag, < 500ms)
    if (isOpen && dist < 8 && duration < 500) {
      updateMouseCoord(coords.x, coords.y);
      raycaster.setFromCamera(mouse, camera);
      var intersects = raycaster.intersectObjects(interactiveHitboxes, false);
      if (intersects.length > 0) {
        var hitObj = intersects[0].object;
        var jewelId = hitObj.userData.jewelId;
        if (jewelId && typeof window.showJewelModal === 'function') {
          window.showJewelModal(jewelId);

          // Petit effet de pulsation / rebond GSAP immédiat sur le bijou cliqué
          var targetGroup = jewelId === 'bague' ? ringGroup : (jewelId === 'bracelet' ? braceletGroup : necklaceGroup);
          if (targetGroup) {
            gsap.fromTo(targetGroup.scale,
              { x: 1.18, y: 1.18, z: 1.18 },
              { x: 1.0, y: 1.0, z: 1.0, duration: 0.55, ease: 'back.out(2.5)' }
            );
          }
        }
      } else {
        // Clic sur la scène 3D en dehors de tout bijou -> Ferme instantanément la modale
        if (typeof window.closeJewelModal === 'function') {
          window.closeJewelModal(true);
        }
      }
    }
  }

  canvas.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);

  canvas.addEventListener('touchstart', onPointerDown, { passive: true });
  window.addEventListener('touchmove', onPointerMove, { passive: true });
  window.addEventListener('touchend', onPointerUp);

  /* ----------------------------------------------------------
     10. RESPONSIVE
  ---------------------------------------------------------- */
  function onResize() {
    var width  = window.innerWidth;
    var height = window.innerHeight;
    camera.aspect = width / height;

    // Recul adapté pour écrans mobiles verticaux
    if (width < 600) {
      camera.fov = 52;
    } else {
      camera.fov = 42;
    }
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  window.addEventListener('resize', onResize);
  onResize();

  /* ----------------------------------------------------------
     11. BOUCLE D'ANIMATION CONTINUE (requestAnimationFrame)
  ---------------------------------------------------------- */
  var clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    var elapsed = clock.getElapsedTime();

    // Oscillation douce "respiration" quand la boîte est fermée
    if (!isOpen && !isDragging) {
      boxGroup.rotation.y = Math.sin(elapsed * 0.5) * 0.08;
      boxGroup.position.y = Math.sin(elapsed * 1.0) * 0.03;
    }

    // Amortissement fluide de la rotation interactive de la scène 3D
    sceneGroup.rotation.y += (targetRotationY - sceneGroup.rotation.y) * 0.08;
    sceneGroup.rotation.x += (targetRotationX - sceneGroup.rotation.x) * 0.08;

    // ----------------------------------------------------------
    // LÉVITATION & ROTATION CONTINUE DES 3 BIJOUX (QUAND OUVERT)
    // Flottement sinusoïdal vertical doux + rotation continue
    // ----------------------------------------------------------
    if (isOpen) {
      var t = elapsed * 2.0;

      // 1. La Bague (Or & Diamant) : lévitation verticale + rotation anneau et diamant
      if (ringBand && diamond) {
        ringBand.position.y = Math.sin(t) * 0.022;
        ringBand.rotation.z += 0.005;
        diamond.rotation.y  += 0.012;
      }

      // 2. Le Bracelet (Argent pur & Jonc) : lévitation verticale déphasée + rotation
      if (braceletBangle) {
        braceletBangle.position.y = Math.sin(t + 1.6) * 0.022;
        braceletBangle.rotation.z += 0.006;
      }

      // 3. Le Collier (Or & Cristal) : lévitation verticale déphasée + rotation du cristal et du pendant
      if (chainMesh && pendantGroup && crystalPendant) {
        var bobNecklace = Math.sin(t + 3.2) * 0.022;
        chainMesh.position.y      = bobNecklace;
        pendantGroup.position.y   = 0.01 + bobNecklace;
        pendantGroup.rotation.y   += 0.007;
        crystalPendant.rotation.y += 0.012;
      }
    }

    // Animation des particules scintillantes dorées
    if (isOpen && sparklesGeom) {
      var positions = sparklesGeom.attributes.position.array;
      for (var p = 0; p < sparklesCount; p++) {
        positions[p * 3 + 1] += 0.0018; // monte doucement
        if (positions[p * 3 + 1] > H + 1.2) {
          positions[p * 3 + 1] = H + 0.1;
        }
      }
      sparklesGeom.attributes.position.needsUpdate = true;
    }

    renderer.render(scene, camera);
  }

  animate();

})();
