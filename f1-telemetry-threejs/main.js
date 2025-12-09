import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue
scene.fog = new THREE.Fog(0x87CEEB, 800, 3000);

// Camera - static position with orbit controls for user movement
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
camera.position.set(0, 400, 600);
camera.lookAt(0, 0, 0);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('container').appendChild(renderer.domElement);

// CSS2D Renderer for driver name labels
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
document.getElementById('container').appendChild(labelRenderer.domElement);

// Orbit Controls - allows user to freely move camera
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 10;
controls.maxDistance = 2000;
controls.maxPolarAngle = Math.PI / 2.1;
controls.target.set(0, 0, 0);

// Camera modes: 'orbit', 'follow', 'chase', 'cockpit', 'helicopter'
let cameraMode = 'follow';
const cameraOffset = new THREE.Vector3(0, 15, -40); // Behind and above the car
const cameraLookOffset = new THREE.Vector3(0, 5, 50); // Look ahead of car

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(200, 400, 200);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 4096;
directionalLight.shadow.mapSize.height = 4096;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 1500;
directionalLight.shadow.camera.left = -800;
directionalLight.shadow.camera.right = 800;
directionalLight.shadow.camera.top = 800;
directionalLight.shadow.camera.bottom = -800;
scene.add(directionalLight);

// Silverstone Circuit - Accurate Layout (2024 configuration)
// The circuit is approximately 5.891 km, run clockwise
// Start/Finish on Wellington Straight between Club and Abbey

// Track points with elevation (y) and banking angle
const silverstonePoints = [
    // Start/Finish Straight (between Club and Abbey) - slight downhill
    { x: 0, y: 2, z: 0, bank: 0 },
    { x: 80, y: 1.5, z: 5, bank: 0 },
    { x: 160, y: 1, z: 10, bank: 0 },
    { x: 240, y: 0.5, z: 12, bank: 0 },
    
    // Turn 1 - Abbey (fast right-hander, 160mph)
    { x: 310, y: 0, z: 8, bank: 3 },
    { x: 360, y: -0.5, z: -15, bank: 5 },
    { x: 390, y: -1, z: -50, bank: 4 },
    
    // Turn 2 - Farm (slight left)
    { x: 400, y: -1.5, z: -95, bank: -2 },
    { x: 395, y: -1, z: -130, bank: -3 },
    
    // Turn 3 - Village (right hairpin entry)
    { x: 375, y: -0.5, z: -165, bank: 4 },
    { x: 340, y: 0, z: -195, bank: 6 },
    { x: 300, y: 0.5, z: -210, bank: 5 },
    
    // Turn 4 - The Loop (tight left, apex)
    { x: 255, y: 1, z: -205, bank: -6 },
    { x: 220, y: 1.5, z: -185, bank: -5 },
    { x: 200, y: 2, z: -155, bank: -3 },
    
    // Turn 5 - Aintree (right)
    { x: 195, y: 2.5, z: -115, bank: 3 },
    { x: 205, y: 3, z: -75, bank: 2 },
    
    // Wellington Straight - uphill
    { x: 210, y: 3.5, z: -30, bank: 0 },
    { x: 200, y: 4, z: 20, bank: 0 },
    { x: 175, y: 4.5, z: 70, bank: 0 },
    
    // Turn 6 - Brooklands (left, heavy braking)
    { x: 140, y: 5, z: 120, bank: -5 },
    { x: 95, y: 4.5, z: 155, bank: -6 },
    
    // Turn 7 - Luffield (long right, 2nd gear)
    { x: 50, y: 4, z: 175, bank: 4 },
    { x: 5, y: 3.5, z: 180, bank: 5 },
    { x: -40, y: 3, z: 170, bank: 5 },
    { x: -75, y: 2.5, z: 145, bank: 4 },
    
    // Turn 8 - Woodcote (fast right, leads to old pits)
    { x: -95, y: 2, z: 100, bank: 3 },
    { x: -100, y: 1.5, z: 50, bank: 2 },
    
    // Turn 9 - Copse (very fast right, 180mph entry)
    { x: -90, y: 1, z: 0, bank: 4 },
    { x: -65, y: 0.5, z: -45, bank: 5 },
    { x: -25, y: 0, z: -80, bank: 5 },
    
    // Short straight to Maggotts
    { x: 30, y: -0.5, z: -105, bank: 0 },
    { x: 85, y: -1, z: -120, bank: 0 },
    
    // Turn 10 - Maggotts (fast left)
    { x: 140, y: -1.5, z: -125, bank: -5 },
    { x: 185, y: -2, z: -115, bank: -6 },
    
    // Turn 11 - Becketts (fast right)
    { x: 220, y: -2.5, z: -95, bank: 6 },
    { x: 245, y: -3, z: -65, bank: 5 },
    
    // Turn 12 - Chapel (fast left, downhill)
    { x: 255, y: -3.5, z: -30, bank: -4 },
    { x: 250, y: -4, z: 10, bank: -3 },
    
    // Hangar Straight (long, fast, slight curve right) - 200mph+
    { x: 235, y: -4.5, z: 60, bank: 0 },
    { x: 210, y: -5, z: 120, bank: 0 },
    { x: 175, y: -5.5, z: 180, bank: 0 },
    { x: 130, y: -6, z: 240, bank: 1 },
    { x: 80, y: -6.5, z: 300, bank: 1 },
    { x: 25, y: -7, z: 355, bank: 1 },
    
    // Turn 13 - Stowe (right, heavy braking from 200mph)
    { x: -30, y: -6.5, z: 395, bank: 5 },
    { x: -90, y: -6, z: 415, bank: 6 },
    { x: -150, y: -5.5, z: 410, bank: 5 },
    
    // Turn 14 - Vale (left)
    { x: -195, y: -5, z: 385, bank: -4 },
    { x: -225, y: -4.5, z: 345, bank: -3 },
    
    // Turn 15/16 - Club (right chicane complex)
    { x: -235, y: -4, z: 295, bank: 4 },
    { x: -225, y: -3.5, z: 245, bank: 5 },
    { x: -200, y: -3, z: 200, bank: 4 },
    { x: -165, y: -2.5, z: 160, bank: 3 },
    
    // Pit Straight approach - uphill back to start
    { x: -130, y: -2, z: 115, bank: 0 },
    { x: -100, y: -1, z: 70, bank: 0 },
    { x: -70, y: 0, z: 35, bank: 0 },
    { x: -35, y: 1, z: 15, bank: 0 },
];

// Banking data for track sections (radians)
function getBankingAtT(t) {
    const numPoints = silverstonePoints.length;
    const index = t * numPoints;
    const i = Math.floor(index) % numPoints;
    const nextI = (i + 1) % numPoints;
    const frac = index - Math.floor(index);
    
    const bank1 = silverstonePoints[i].bank || 0;
    const bank2 = silverstonePoints[nextI].bank || 0;
    
    return THREE.MathUtils.degToRad(bank1 + (bank2 - bank1) * frac);
}

// Get elevation at track position (returns raw elevation, offset applied in track creation)
function getElevationAtT(t) {
    const numPoints = silverstonePoints.length;
    const index = t * numPoints;
    const i = Math.floor(index) % numPoints;
    const nextI = (i + 1) % numPoints;
    const frac = index - Math.floor(index);
    
    const y1 = silverstonePoints[i].y || 0;
    const y2 = silverstonePoints[nextI].y || 0;
    
    // Apply same scaling and offset as track curve
    return ((y1 + (y2 - y1) * frac) * 2) + 15;
}

// Scale factor for the track
const trackScale = 2.0;
const elevationOffset = 15; // Offset to keep all track above ground (min y is -7, so 7*2=14, add 15 to be safe)

// Create smooth track curve with elevation
const trackVectors = silverstonePoints.map(p => 
    new THREE.Vector3(p.x * trackScale, ((p.y || 0) * 2) + elevationOffset, p.z * trackScale)
);
const trackCurve = new THREE.CatmullRomCurve3(trackVectors, true);

// Create track surface
const trackWidth = 25;
const trackSegments = 500;
const trackShape = new THREE.Shape();
trackShape.moveTo(-trackWidth / 2, 0);
trackShape.lineTo(trackWidth / 2, 0);

const trackPoints = trackCurve.getPoints(trackSegments);

// Create track geometry using TubeGeometry for smooth curves
const trackTubeGeometry = new THREE.TubeGeometry(trackCurve, trackSegments, trackWidth / 2, 8, true);

// Create track with elevation and banking
const trackGeometry = new THREE.BufferGeometry();
const trackVertices = [];
const trackUvs = [];
const trackIndices = [];

for (let i = 0; i <= trackSegments; i++) {
    const t = i / trackSegments;
    const point = trackCurve.getPoint(t);
    const tangent = trackCurve.getTangent(t);
    
    // Get banking angle for this position
    const bankingAngle = getBankingAtT(t) * Math.PI / 180; // Convert to radians
    
    // Calculate perpendicular direction
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(up, tangent).normalize();
    
    // Calculate banked positions - tilt the track surface
    const leftHeight = point.y + 0.5 + Math.sin(bankingAngle) * (trackWidth / 2);
    const rightHeight = point.y + 0.5 - Math.sin(bankingAngle) * (trackWidth / 2);
    
    // Left and right edge of track with elevation and banking
    const leftEdge = point.clone().add(right.clone().multiplyScalar(trackWidth / 2));
    const rightEdge = point.clone().add(right.clone().multiplyScalar(-trackWidth / 2));
    
    trackVertices.push(leftEdge.x, leftHeight, leftEdge.z);
    trackVertices.push(rightEdge.x, rightHeight, rightEdge.z);
    
    trackUvs.push(0, t * 20);
    trackUvs.push(1, t * 20);
    
    if (i < trackSegments) {
        const base = i * 2;
        trackIndices.push(base, base + 1, base + 2);
        trackIndices.push(base + 1, base + 3, base + 2);
    }
}

trackGeometry.setAttribute('position', new THREE.Float32BufferAttribute(trackVertices, 3));
trackGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(trackUvs, 2));
trackGeometry.setIndex(trackIndices);
trackGeometry.computeVertexNormals();

// Create realistic asphalt texture procedurally
const asphaltCanvas = document.createElement('canvas');
asphaltCanvas.width = 512;
asphaltCanvas.height = 512;
const asphaltCtx = asphaltCanvas.getContext('2d');

// Base dark gray
asphaltCtx.fillStyle = '#2a2a2a';
asphaltCtx.fillRect(0, 0, 512, 512);

// Add noise/aggregate texture
for (let i = 0; i < 8000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const brightness = Math.random() * 40 + 20;
    asphaltCtx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
    asphaltCtx.fillRect(x, y, Math.random() * 3 + 1, Math.random() * 3 + 1);
}

// Add subtle cracks
asphaltCtx.strokeStyle = '#1a1a1a';
asphaltCtx.lineWidth = 1;
for (let i = 0; i < 15; i++) {
    asphaltCtx.beginPath();
    asphaltCtx.moveTo(Math.random() * 512, Math.random() * 512);
    for (let j = 0; j < 5; j++) {
        asphaltCtx.lineTo(
            asphaltCtx.canvas.width * Math.random(),
            asphaltCtx.canvas.height * Math.random()
        );
    }
    asphaltCtx.stroke();
}

// Add rubber marks (darker patches)
for (let i = 0; i < 30; i++) {
    asphaltCtx.fillStyle = `rgba(15, 15, 15, ${Math.random() * 0.3 + 0.1})`;
    const x = Math.random() * 400 + 56; // Center of track
    const y = Math.random() * 512;
    asphaltCtx.beginPath();
    asphaltCtx.ellipse(x, y, Math.random() * 30 + 10, Math.random() * 60 + 20, 0, 0, Math.PI * 2);
    asphaltCtx.fill();
}

const asphaltTexture = new THREE.CanvasTexture(asphaltCanvas);
asphaltTexture.wrapS = THREE.RepeatWrapping;
asphaltTexture.wrapT = THREE.RepeatWrapping;
asphaltTexture.repeat.set(1, 50);

// Track material with asphalt texture
const trackMaterial = new THREE.MeshStandardMaterial({
    map: asphaltTexture,
    roughness: 0.85,
    metalness: 0.05,
    side: THREE.DoubleSide
});

const trackMesh = new THREE.Mesh(trackGeometry, trackMaterial);
trackMesh.receiveShadow = true;
scene.add(trackMesh);

// ==================== TRACK WHITE LINES ====================
function createTrackLine(offsetFromCenter, lineWidth) {
    const lineGeometry = new THREE.BufferGeometry();
    const lineVertices = [];
    
    for (let i = 0; i <= trackSegments; i++) {
        const t = i / trackSegments;
        const point = trackCurve.getPoint(t);
        const tangent = trackCurve.getTangent(t);
        const bankingAngle = getBankingAtT(t) * Math.PI / 180;
        
        const up = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(up, tangent).normalize();
        
        const innerOffset = offsetFromCenter - lineWidth / 2;
        const outerOffset = offsetFromCenter + lineWidth / 2;
        
        const innerEdge = point.clone().add(right.clone().multiplyScalar(innerOffset));
        const outerEdge = point.clone().add(right.clone().multiplyScalar(outerOffset));
        
        const innerHeight = point.y + 0.52 + Math.sin(bankingAngle) * innerOffset;
        const outerHeight = point.y + 0.52 + Math.sin(bankingAngle) * outerOffset;
        
        lineVertices.push(innerEdge.x, innerHeight, innerEdge.z);
        lineVertices.push(outerEdge.x, outerHeight, outerEdge.z);
    }
    
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(lineVertices, 3));
    lineGeometry.setIndex(trackIndices);
    lineGeometry.computeVertexNormals();
    
    const lineMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.5,
        side: THREE.DoubleSide
    });
    
    return new THREE.Mesh(lineGeometry, lineMaterial);
}

// Edge lines (white lines at track edges)
const leftEdgeLine = createTrackLine(trackWidth / 2 - 1.5, 0.8);
const rightEdgeLine = createTrackLine(-trackWidth / 2 + 1.5, 0.8);
scene.add(leftEdgeLine);
scene.add(rightEdgeLine);

// ==================== REALISTIC KERBS (Red/White Striped) ====================
function createStripedKerb(offset, isLeft) {
    const kerbGroup = new THREE.Group();
    const kerbWidth = 2.5;
    const stripeLength = 8;
    const numStripes = Math.floor(trackSegments / 4);
    
    for (let stripe = 0; stripe < numStripes; stripe++) {
        const startT = stripe / numStripes;
        const endT = (stripe + 0.5) / numStripes;
        
        const kerbGeometry = new THREE.BufferGeometry();
        const kerbVertices = [];
        const kerbIndices = [];
        
        const segmentsPerStripe = Math.floor(trackSegments / numStripes / 2);
        
        for (let i = 0; i <= segmentsPerStripe; i++) {
            const t = startT + (endT - startT) * (i / segmentsPerStripe);
            const point = trackCurve.getPoint(t);
            const tangent = trackCurve.getTangent(t);
            const bankingAngle = getBankingAtT(t) * Math.PI / 180;
            
            const up = new THREE.Vector3(0, 1, 0);
            const right = new THREE.Vector3().crossVectors(up, tangent).normalize();
            
            const innerEdge = point.clone().add(right.clone().multiplyScalar(offset));
            const outerEdge = point.clone().add(right.clone().multiplyScalar(offset + kerbWidth * (isLeft ? 1 : -1)));
            
            // Kerbs are raised
            const baseHeight = point.y + 0.6;
            const innerHeight = baseHeight + Math.sin(bankingAngle) * offset + 0.15;
            const outerHeight = baseHeight + Math.sin(bankingAngle) * (offset + kerbWidth * (isLeft ? 1 : -1));
            
            kerbVertices.push(innerEdge.x, innerHeight, innerEdge.z);
            kerbVertices.push(outerEdge.x, outerHeight, outerEdge.z);
            
            if (i < segmentsPerStripe) {
                const base = i * 2;
                kerbIndices.push(base, base + 1, base + 2);
                kerbIndices.push(base + 1, base + 3, base + 2);
            }
        }
        
        kerbGeometry.setAttribute('position', new THREE.Float32BufferAttribute(kerbVertices, 3));
        kerbGeometry.setIndex(kerbIndices);
        kerbGeometry.computeVertexNormals();
        
        // Alternate red and white
        const isRed = stripe % 2 === 0;
        const kerbMaterial = new THREE.MeshStandardMaterial({
            color: isRed ? 0xcc0000 : 0xffffff,
            roughness: 0.6,
            side: THREE.DoubleSide
        });
        
        const kerbMesh = new THREE.Mesh(kerbGeometry, kerbMaterial);
        kerbMesh.receiveShadow = true;
        kerbGroup.add(kerbMesh);
    }
    
    return kerbGroup;
}

// Add striped kerbs
const leftKerb = createStripedKerb(trackWidth / 2, true);
const rightKerb = createStripedKerb(-trackWidth / 2, false);
scene.add(leftKerb);
scene.add(rightKerb);

// ==================== RUMBLE STRIPS (Sausage Kerbs) at Key Corners ====================
function createRumbleStrip(t, side, length) {
    const rumbleGroup = new THREE.Group();
    const numBumps = 8;
    
    for (let i = 0; i < numBumps; i++) {
        const bumpT = t + (i / numBumps) * length;
        const point = trackCurve.getPoint(bumpT % 1);
        const tangent = trackCurve.getTangent(bumpT % 1);
        const up = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(up, tangent).normalize();
        
        // Yellow sausage kerb
        const bumpGeometry = new THREE.CapsuleGeometry(0.4, 3, 4, 8);
        const bumpMaterial = new THREE.MeshStandardMaterial({
            color: i % 2 === 0 ? 0xffcc00 : 0x000000,
            roughness: 0.7
        });
        const bump = new THREE.Mesh(bumpGeometry, bumpMaterial);
        
        const offset = right.clone().multiplyScalar(side * (trackWidth / 2 + 3.5));
        bump.position.set(point.x + offset.x, point.y + 0.8, point.z + offset.z);
        bump.rotation.z = Math.PI / 2;
        bump.rotation.y = Math.atan2(tangent.x, tangent.z);
        
        rumbleGroup.add(bump);
    }
    
    return rumbleGroup;
}

// Add rumble strips at chicanes and tight corners
const rumbleLocations = [
    { t: 0.11, side: -1, length: 0.02 },  // Village
    { t: 0.15, side: 1, length: 0.02 },   // The Loop
    { t: 0.27, side: -1, length: 0.015 }, // Brooklands
    { t: 0.85, side: 1, length: 0.02 }    // Club
];

rumbleLocations.forEach(loc => {
    scene.add(createRumbleStrip(loc.t, loc.side, loc.length));
});

// ==================== RUBBER MARBLES OFF-LINE ====================
function createRubberMarbles() {
    const marblesGroup = new THREE.Group();
    
    for (let i = 0; i < 500; i++) {
        const t = Math.random();
        const point = trackCurve.getPoint(t);
        const tangent = trackCurve.getTangent(t);
        const up = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(up, tangent).normalize();
        
        // Marbles accumulate off the racing line (near edges)
        const lateralOffset = (Math.random() > 0.5 ? 1 : -1) * (trackWidth / 2 - 4 - Math.random() * 3);
        
        const marbleGeometry = new THREE.SphereGeometry(0.1 + Math.random() * 0.15, 4, 4);
        const marbleMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 1
        });
        const marble = new THREE.Mesh(marbleGeometry, marbleMaterial);
        
        const offset = right.clone().multiplyScalar(lateralOffset);
        marble.position.set(point.x + offset.x, point.y + 0.55, point.z + offset.z);
        
        marblesGroup.add(marble);
    }
    
    return marblesGroup;
}

scene.add(createRubberMarbles());

// Racing line (subtle, ideal path through track) with elevation
const racingLineGeometry = new THREE.BufferGeometry();
const racingLineVertices = [];
for (let i = 0; i <= trackSegments; i++) {
    const t = i / trackSegments;
    const point = trackCurve.getPoint(t);
    racingLineVertices.push(point.x, point.y + 0.53, point.z);
}
racingLineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(racingLineVertices, 3));
const racingLineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.15 });
const racingLine = new THREE.Line(racingLineGeometry, racingLineMaterial);
scene.add(racingLine);

// ==================== REALISTIC TRACK ENVIRONMENT ====================

// Base terrain - realistic grass with procedural variation
const terrainGeometry = new THREE.PlaneGeometry(3000, 3000, 100, 100);

// Create custom grass shader for realistic appearance
const grassMaterial = new THREE.ShaderMaterial({
    uniforms: {
        lightDirection: { value: new THREE.Vector3(1, 1, 0.5).normalize() },
        time: { value: 0 }
    },
    vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
            vUv = uv;
            vNormal = normal;
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform vec3 lightDirection;
        uniform float time;
        
        // Noise functions for grass variation
        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        
        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                       mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
        }
        
        float fbm(vec2 p) {
            float value = 0.0;
            float amplitude = 0.5;
            for (int i = 0; i < 4; i++) {
                value += amplitude * noise(p);
                p *= 2.0;
                amplitude *= 0.5;
            }
            return value;
        }
        
        void main() {
            // Base grass colors - mix of different greens
            vec3 grassDark = vec3(0.12, 0.25, 0.08);
            vec3 grassMid = vec3(0.18, 0.35, 0.12);
            vec3 grassLight = vec3(0.25, 0.45, 0.15);
            vec3 grassDry = vec3(0.35, 0.38, 0.18);
            
            // Large scale variation (mowing patterns, different grass types)
            vec2 largeUv = vUv * 8.0;
            float largePat = fbm(largeUv);
            
            // Medium scale (clumps of grass)
            vec2 medUv = vUv * 40.0;
            float medPat = fbm(medUv);
            
            // Fine detail (individual blades)
            vec2 fineUv = vUv * 200.0;
            float finePat = noise(fineUv);
            
            // Mowing stripes pattern (typical of racing circuits)
            float stripes = sin(vUv.x * 100.0 + vUv.y * 50.0) * 0.5 + 0.5;
            stripes = smoothstep(0.4, 0.6, stripes);
            
            // Combine patterns
            float pattern = largePat * 0.4 + medPat * 0.35 + finePat * 0.25;
            
            // Mix grass colors based on pattern
            vec3 grassColor = mix(grassDark, grassMid, pattern);
            grassColor = mix(grassColor, grassLight, stripes * 0.3);
            
            // Add some dry patches
            float dryness = smoothstep(0.7, 0.9, fbm(vUv * 5.0 + 10.0));
            grassColor = mix(grassColor, grassDry, dryness * 0.4);
            
            // Simple lighting
            float diffuse = max(dot(vec3(0.0, 1.0, 0.0), lightDirection), 0.3);
            
            // Final color with ambient
            vec3 ambient = vec3(0.15, 0.18, 0.12);
            vec3 finalColor = grassColor * diffuse + ambient * 0.2;
            
            gl_FragColor = vec4(finalColor, 1.0);
        }
    `
});

const terrain = new THREE.Mesh(terrainGeometry, grassMaterial);
terrain.rotation.x = -Math.PI / 2;
terrain.position.y = -0.5;
terrain.receiveShadow = true;
scene.add(terrain);

// ==================== HARDCODED TRACK ENVIRONMENT ====================
// All positions are manually set based on the track layout:
// - Start/finish straight runs along x-axis from x=-35 to x=240 at z≈0-12
// - Track goes clockwise when viewed from above
// - Inside of track at start/finish is negative z direction

// ==================== PIT LANE SYSTEM ====================
// Pit lane runs parallel to the main straight, offset to the inside (negative z)
// Entry point: around t=0.92 (approaching start/finish)
// Exit point: around t=0.05 (after start/finish)

const pitLanePoints = [
    new THREE.Vector3(-130, 13, -30),   // Pit entry start (branches off from track)
    new THREE.Vector3(-90, 13, -45),    // Entry curve
    new THREE.Vector3(-50, 13, -55),    // Approaching pit lane
    new THREE.Vector3(0, 13, -60),      // Pit lane start
    new THREE.Vector3(60, 13, -60),     // Pit box area start
    new THREE.Vector3(120, 13, -60),    // Pit box area middle
    new THREE.Vector3(180, 13, -60),    // Pit box area end
    new THREE.Vector3(240, 13, -55),    // Pit lane end
    new THREE.Vector3(290, 13, -45),    // Exit curve
    new THREE.Vector3(330, 13, -25),    // Rejoining track
];

const pitLaneCurve = new THREE.CatmullRomCurve3(pitLanePoints, false);

// Pit box positions for each team (t value along pit lane where they stop)
const pitBoxPositions = [
    { team: 0, t: 0.38 },  // Ferrari - Karina
    { team: 1, t: 0.44 },  // Red Bull - Lewis
    { team: 2, t: 0.50 },  // Mercedes - Rolf
    { team: 3, t: 0.56 },  // McLaren - Richa
    { team: 4, t: 0.62 },  // Aston Martin - Dennis
    { team: 5, t: 0.68 },  // Alpine - Sujith
];

// Track t values for pit entry and exit
const PIT_ENTRY_T = 0.92;  // Where cars can enter pit lane
const PIT_EXIT_T = 0.06;   // Where cars rejoin the track

// Create pit lane surface
function createPitLaneSurface() {
    const pitGroup = new THREE.Group();
    
    // Create pit lane path as a tube-like surface
    const pitLaneShape = new THREE.Shape();
    const laneWidth = 12;
    pitLaneShape.moveTo(-laneWidth/2, 0);
    pitLaneShape.lineTo(laneWidth/2, 0);
    
    const pitLaneGeometry = new THREE.ExtrudeGeometry(pitLaneShape, {
        steps: 100,
        bevelEnabled: false,
        extrudePath: pitLaneCurve
    });
    
    const pitLaneMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        roughness: 0.85
    });
    
    const pitLaneMesh = new THREE.Mesh(pitLaneGeometry, pitLaneMaterial);
    pitLaneMesh.rotation.x = Math.PI / 2;
    pitGroup.add(pitLaneMesh);
    
    // Pit lane lines
    const linePoints = pitLaneCurve.getPoints(50);
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    
    // Speed limit line (dashed)
    const speedLimitGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
    const speedLimitMaterial = new THREE.LineDashedMaterial({
        color: 0xffff00,
        dashSize: 3,
        gapSize: 2
    });
    const speedLimitLine = new THREE.Line(speedLimitGeometry, speedLimitMaterial);
    speedLimitLine.computeLineDistances();
    speedLimitLine.position.y = 0.2;
    pitGroup.add(speedLimitLine);
    
    return pitGroup;
}

// === MODERN MAIN GRANDSTAND ===
function createMainGrandstand() {
    const grandstand = new THREE.Group();
    
    // Modern tiered structure with glass and steel
    const tiers = 5;
    const tierHeight = 6;
    const length = 280;
    const baseDepth = 25;
    
    // Main seating structure - curved modern design
    for (let i = 0; i < tiers; i++) {
        const depth = baseDepth - i * 3;
        const tierGeometry = new THREE.BoxGeometry(length, tierHeight, depth);
        const tierMaterial = new THREE.MeshStandardMaterial({
            color: i % 2 === 0 ? 0x1a1a3c : 0x2a2a5c,
            roughness: 0.7,
            metalness: 0.2
        });
        const tier = new THREE.Mesh(tierGeometry, tierMaterial);
        tier.position.y = i * tierHeight + tierHeight / 2;
        tier.position.z = i * 2;
        grandstand.add(tier);
        
        // Seat rows (colored blocks representing crowds)
        const crowdGeometry = new THREE.BoxGeometry(length - 4, 2, depth - 4);
        const crowdColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
        const crowdMaterial = new THREE.MeshStandardMaterial({
            color: crowdColors[i % crowdColors.length],
            roughness: 0.9
        });
        const crowd = new THREE.Mesh(crowdGeometry, crowdMaterial);
        crowd.position.y = i * tierHeight + tierHeight - 0.5;
        crowd.position.z = i * 2;
        grandstand.add(crowd);
    }
    
    // Modern cantilevered roof
    const roofGroup = new THREE.Group();
    
    // Main roof surface - dramatic overhang
    const roofGeometry = new THREE.BoxGeometry(length + 40, 1.5, 50);
    const roofMaterial = new THREE.MeshStandardMaterial({
        color: 0xeeeeee,
        metalness: 0.7,
        roughness: 0.3
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, tiers * tierHeight + 8, 10);
    roofGroup.add(roof);
    
    // Roof support beams (modern steel look)
    for (let i = 0; i < 10; i++) {
        const beamGeometry = new THREE.BoxGeometry(3, tiers * tierHeight + 8, 3);
        const beamMaterial = new THREE.MeshStandardMaterial({
            color: 0x555555,
            metalness: 0.8,
            roughness: 0.2
        });
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        beam.position.set(-130 + i * 30, (tiers * tierHeight + 8) / 2, baseDepth);
        grandstand.add(beam);
    }
    
    grandstand.add(roofGroup);
    
    // VIP boxes at top
    const vipGeometry = new THREE.BoxGeometry(length - 20, 8, 12);
    const vipMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.5,
        roughness: 0.4
    });
    const vip = new THREE.Mesh(vipGeometry, vipMaterial);
    vip.position.set(0, tiers * tierHeight + 4, tiers * 2 + 2);
    grandstand.add(vip);
    
    // Glass windows on VIP
    const glassGeometry = new THREE.PlaneGeometry(length - 30, 6);
    const glassMaterial = new THREE.MeshStandardMaterial({
        color: 0x88ccff,
        metalness: 0.9,
        roughness: 0.1,
        transparent: true,
        opacity: 0.7
    });
    const glass = new THREE.Mesh(glassGeometry, glassMaterial);
    glass.position.set(0, tiers * tierHeight + 4, tiers * 2 - 4);
    grandstand.add(glass);
    
    // Sponsor banners on front
    const bannerColors = [0xe10600, 0x1e41ff, 0x00d2be, 0xff8700, 0x006f62];
    for (let i = 0; i < 5; i++) {
        const bannerGeometry = new THREE.PlaneGeometry(40, 4);
        const bannerMaterial = new THREE.MeshStandardMaterial({
            color: bannerColors[i],
            emissive: bannerColors[i],
            emissiveIntensity: 0.2
        });
        const banner = new THREE.Mesh(bannerGeometry, bannerMaterial);
        banner.position.set(-100 + i * 50, 3, -1);
        grandstand.add(banner);
    }
    
    return grandstand;
}

const mainGrandstand = createMainGrandstand();
mainGrandstand.position.set(100, 0, 75); // Outside of start straight
mainGrandstand.rotation.y = 0;
scene.add(mainGrandstand);

// === MODERN PIT COMPLEX ===
function createPitComplex() {
    const pitComplex = new THREE.Group();
    
    // Main pit building - modern glass and steel design
    const mainBuildingGroup = new THREE.Group();
    
    // Base structure
    const baseGeometry = new THREE.BoxGeometry(320, 15, 40);
    const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.6,
        roughness: 0.4
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0, 7.5, 40);
    mainBuildingGroup.add(base);
    
    // Second floor - control tower
    const towerGeometry = new THREE.BoxGeometry(280, 10, 25);
    const tower = new THREE.Mesh(towerGeometry, baseMaterial);
    tower.position.set(0, 20, 35);
    mainBuildingGroup.add(tower);
    
    // Glass facade
    const glassGeometry = new THREE.PlaneGeometry(310, 12);
    const glassMaterial = new THREE.MeshStandardMaterial({
        color: 0x66aaff,
        metalness: 0.9,
        roughness: 0.05,
        transparent: true,
        opacity: 0.7
    });
    const glass = new THREE.Mesh(glassGeometry, glassMaterial);
    glass.position.set(0, 11, 19.9);
    mainBuildingGroup.add(glass);
    
    // Control tower glass
    const towerGlass = new THREE.Mesh(
        new THREE.PlaneGeometry(270, 8),
        glassMaterial
    );
    towerGlass.position.set(0, 20, 22.4);
    mainBuildingGroup.add(towerGlass);
    
    pitComplex.add(mainBuildingGroup);
    
    // Individual team garages with awnings
    const garageColors = [0xe10600, 0x1e41ff, 0x00d2be, 0xff8700, 0x006f62, 0x0090ff];
    const garageWidth = 45;
    const startX = -110;
    
    for (let i = 0; i < 6; i++) {
        const garageGroup = new THREE.Group();
        
        // Garage interior (dark)
        const garageGeometry = new THREE.BoxGeometry(garageWidth - 4, 10, 20);
        const garageMaterial = new THREE.MeshStandardMaterial({
            color: 0x0a0a0a,
            roughness: 0.9
        });
        const garage = new THREE.Mesh(garageGeometry, garageMaterial);
        garage.position.set(0, 5, 8);
        garageGroup.add(garage);
        
        // Team colored awning
        const awningGeometry = new THREE.BoxGeometry(garageWidth - 2, 1, 8);
        const awningMaterial = new THREE.MeshStandardMaterial({
            color: garageColors[i],
            roughness: 0.5
        });
        const awning = new THREE.Mesh(awningGeometry, awningMaterial);
        awning.position.set(0, 10.5, -2);
        garageGroup.add(awning);
        
        // Awning support
        const supportGeometry = new THREE.BoxGeometry(garageWidth - 2, 0.5, 10);
        const support = new THREE.Mesh(supportGeometry, awningMaterial);
        support.position.set(0, 10, 2);
        garageGroup.add(support);
        
        // Team number on garage
        const teamNumbers = [16, 1, 44, 4, 14, 10]; // Karina, Lewis, Rolf, Richa, Dennis, Sujith
        const numberCanvas = document.createElement('canvas');
        numberCanvas.width = 128;
        numberCanvas.height = 64;
        const ctx = numberCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(teamNumbers[i].toString(), 64, 32);
        
        const numberTexture = new THREE.CanvasTexture(numberCanvas);
        const numberGeometry = new THREE.PlaneGeometry(8, 4);
        const numberMaterial = new THREE.MeshBasicMaterial({
            map: numberTexture,
            transparent: true
        });
        const numberMesh = new THREE.Mesh(numberGeometry, numberMaterial);
        numberMesh.position.set(0, 8, -2.1);
        garageGroup.add(numberMesh);
        
        // Pit equipment (tire stacks, jacks)
        // Tire stack
        for (let t = 0; t < 4; t++) {
            const tireGeometry = new THREE.TorusGeometry(0.6, 0.25, 8, 16);
            const tireMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
            const tire = new THREE.Mesh(tireGeometry, tireMaterial);
            tire.position.set(-12 + (t % 2) * 3, 0.5 + Math.floor(t / 2) * 0.6, -3);
            tire.rotation.x = Math.PI / 2;
            garageGroup.add(tire);
        }
        
        // Fuel rig
        const fuelGeometry = new THREE.CylinderGeometry(0.4, 0.5, 3, 8);
        const fuelMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.6 });
        const fuel = new THREE.Mesh(fuelGeometry, fuelMaterial);
        fuel.position.set(12, 1.5, -3);
        garageGroup.add(fuel);
        
        garageGroup.position.set(startX + i * garageWidth, 0, 0);
        pitComplex.add(garageGroup);
    }
    
    // Pit lane surface
    const pitLaneGeometry = new THREE.PlaneGeometry(340, 16);
    const pitLaneMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.85
    });
    const pitLane = new THREE.Mesh(pitLaneGeometry, pitLaneMaterial);
    pitLane.rotation.x = -Math.PI / 2;
    pitLane.position.set(0, 0.15, -15);
    pitComplex.add(pitLane);
    
    // Pit box markings
    for (let i = 0; i < 6; i++) {
        // Box outline
        const boxGeometry = new THREE.PlaneGeometry(garageWidth - 8, 10);
        const boxMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3
        });
        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.rotation.x = -Math.PI / 2;
        box.position.set(startX + i * garageWidth, 0.2, -15);
        pitComplex.add(box);
        
        // Stop line
        const stopGeometry = new THREE.PlaneGeometry(garageWidth - 8, 0.5);
        const stopMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const stop = new THREE.Mesh(stopGeometry, stopMaterial);
        stop.rotation.x = -Math.PI / 2;
        stop.position.set(startX + i * garageWidth, 0.25, -10);
        pitComplex.add(stop);
    }
    
    // Pit wall with gantry
    const wallGeometry = new THREE.BoxGeometry(340, 1.5, 1);
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.6 });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(0, 0.75, -24);
    pitComplex.add(wall);
    
    // Pit gantry (overhead timing screens)
    const gantryGeometry = new THREE.BoxGeometry(340, 2, 3);
    const gantryMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const gantry = new THREE.Mesh(gantryGeometry, gantryMaterial);
    gantry.position.set(0, 8, -15);
    pitComplex.add(gantry);
    
    // Timing screens
    for (let i = 0; i < 8; i++) {
        const screenGeometry = new THREE.PlaneGeometry(30, 4);
        const screenMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x003300,
            emissiveIntensity: 0.5
        });
        const screen = new THREE.Mesh(screenGeometry, screenMaterial);
        screen.position.set(-140 + i * 40, 8, -13.4);
        pitComplex.add(screen);
    }
    
    return pitComplex;
}

const pitComplex = createPitComplex();
pitComplex.position.set(100, 0, -45);
pitComplex.rotation.y = 0;
scene.add(pitComplex);

// === PIT LANE ENTRY/EXIT CONNECTIONS ===
// Create visible pit lane connecting to track
function createPitLaneConnections() {
    const pitLaneGroup = new THREE.Group();
    
    // Draw the pit lane path as a visible road
    const laneWidth = 12;
    const points = pitLaneCurve.getPoints(100);
    
    // Create road surface along the curve
    for (let i = 0; i < points.length - 1; i++) {
        const current = points[i];
        const next = points[i + 1];
        const direction = new THREE.Vector3().subVectors(next, current).normalize();
        const length = current.distanceTo(next);
        
        // Road segment
        const segmentGeometry = new THREE.PlaneGeometry(laneWidth, length);
        const segmentMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.85
        });
        const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
        
        // Position at midpoint
        segment.position.set(
            (current.x + next.x) / 2,
            0.1,
            (current.z + next.z) / 2
        );
        segment.rotation.x = -Math.PI / 2;
        segment.rotation.z = -Math.atan2(direction.z, direction.x) + Math.PI / 2;
        pitLaneGroup.add(segment);
    }
    
    // Pit entry sign
    const entryPoint = pitLaneCurve.getPoint(0.05);
    const entrySign = createPitSign('PIT ENTRY', 0x00ff00);
    entrySign.position.set(entryPoint.x - 10, 5, entryPoint.z);
    pitLaneGroup.add(entrySign);
    
    // Pit exit sign
    const exitPoint = pitLaneCurve.getPoint(0.95);
    const exitSign = createPitSign('PIT EXIT', 0xff0000);
    exitSign.position.set(exitPoint.x + 10, 5, exitPoint.z);
    pitLaneGroup.add(exitSign);
    
    // Speed limit sign (80 km/h)
    const speedPoint = pitLaneCurve.getPoint(0.15);
    const speedSign = createPitSign('80', 0xffffff, 0xff0000);
    speedSign.position.set(speedPoint.x, 4, speedPoint.z - 8);
    pitLaneGroup.add(speedSign);
    
    return pitLaneGroup;
}

function createPitSign(text, color, bgColor = 0x222222) {
    const signGroup = new THREE.Group();
    
    // Sign board
    const boardGeometry = new THREE.BoxGeometry(8, 4, 0.5);
    const boardMaterial = new THREE.MeshStandardMaterial({ color: bgColor });
    const board = new THREE.Mesh(boardGeometry, boardMaterial);
    signGroup.add(board);
    
    // Pole
    const poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 5, 8);
    const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = -4.5;
    signGroup.add(pole);
    
    // Text (using canvas texture)
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = `#${bgColor.toString(16).padStart(6, '0')}`;
    ctx.fillRect(0, 0, 256, 128);
    ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    const textGeometry = new THREE.PlaneGeometry(7.5, 3.5);
    const textMaterial = new THREE.MeshBasicMaterial({ map: texture });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.z = 0.3;
    signGroup.add(textMesh);
    
    return signGroup;
}

scene.add(createPitLaneConnections());

// === START/FINISH GANTRY WITH LIGHTS ===
function createStartGantry() {
    const gantry = new THREE.Group();
    
    // Main beam across track
    const beamGeometry = new THREE.BoxGeometry(50, 3, 3);
    const beamMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7 });
    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.y = 14;
    gantry.add(beam);
    
    // Left support
    const poleGeometry = new THREE.CylinderGeometry(0.5, 0.6, 14, 8);
    const leftPole = new THREE.Mesh(poleGeometry, beamMaterial);
    leftPole.position.set(-25, 7, 0);
    gantry.add(leftPole);
    
    // Right support
    const rightPole = new THREE.Mesh(poleGeometry, beamMaterial);
    rightPole.position.set(25, 7, 0);
    gantry.add(rightPole);
    
    // Light panels (5 red lights)
    for (let i = 0; i < 5; i++) {
        const panelGeometry = new THREE.BoxGeometry(4, 5, 1);
        const panelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panel.position.set(-10 + i * 5, 14, -1.5);
        gantry.add(panel);
        
        // Red lights
        const lightGeometry = new THREE.CircleGeometry(0.7, 16);
        const lightMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.6
        });
        const light1 = new THREE.Mesh(lightGeometry, lightMaterial);
        light1.position.set(-10 + i * 5, 15.5, -2.1);
        gantry.add(light1);
        
        const light2 = new THREE.Mesh(lightGeometry, lightMaterial);
        light2.position.set(-10 + i * 5, 12.5, -2.1);
        gantry.add(light2);
    }
    
    return gantry;
}

const startGantry = createStartGantry();
startGantry.position.set(-10, 0, 5); // At start line
startGantry.rotation.y = 0;
scene.add(startGantry);

// === CHECKERED START/FINISH LINE ===
function createCheckerboard() {
    const group = new THREE.Group();
    const squareSize = 2;
    const numSquares = 12;
    
    for (let i = 0; i < numSquares; i++) {
        for (let j = 0; j < 2; j++) {
            const squareGeometry = new THREE.PlaneGeometry(squareSize, squareSize);
            const isBlack = (i + j) % 2 === 0;
            const squareMaterial = new THREE.MeshStandardMaterial({
                color: isBlack ? 0x000000 : 0xffffff,
                roughness: 0.5
            });
            const square = new THREE.Mesh(squareGeometry, squareMaterial);
            square.rotation.x = -Math.PI / 2;
            square.position.set(i * squareSize - 12, 0.52, j * squareSize + 3);
            group.add(square);
        }
    }
    return group;
}

const checkerboard = createCheckerboard();
checkerboard.position.set(-10, 0, 0);
scene.add(checkerboard);

// === SIMPLE GRAVEL TRAPS (just flat colored areas) ===
function createGravelTrap(x, z, width, length, rotation = 0) {
    const geometry = new THREE.PlaneGeometry(width, length);
    const material = new THREE.MeshStandardMaterial({ color: 0xc9b896, roughness: 1 });
    const gravel = new THREE.Mesh(geometry, material);
    gravel.rotation.x = -Math.PI / 2;
    gravel.rotation.z = rotation;
    gravel.position.set(x, 0.05, z);
    return gravel;
}

// Gravel at Abbey (turn 1)
scene.add(createGravelTrap(370, -30, 40, 60, -0.3));

// Gravel at Copse
scene.add(createGravelTrap(-60, -60, 50, 50, 0.5));

// Gravel at Stowe
scene.add(createGravelTrap(-120, 410, 50, 60, 0.2));

// === TIRE BARRIERS ===
function createTireBarrier(x, z, length, rotation = 0) {
    const barrier = new THREE.Group();
    const numStacks = Math.floor(length / 4);
    
    for (let i = 0; i < numStacks; i++) {
        for (let row = 0; row < 2; row++) {
            const tireGeometry = new THREE.TorusGeometry(1, 0.5, 8, 16);
            const tireMaterial = new THREE.MeshStandardMaterial({
                color: row === 0 ? 0xff0000 : 0x111111,
                roughness: 0.9
            });
            const tire = new THREE.Mesh(tireGeometry, tireMaterial);
            tire.position.set(i * 4 - length/2, 1 + row * 1.8, 0);
            tire.rotation.y = Math.PI / 2;
            barrier.add(tire);
        }
    }
    
    barrier.position.set(x, 0, z);
    barrier.rotation.y = rotation;
    return barrier;
}

// Tire barriers at key corners
scene.add(createTireBarrier(380, -45, 24, -0.5));  // Abbey
scene.add(createTireBarrier(-70, -75, 20, 0.8));   // Copse

// === MARSHAL POST ===
function createMarshalPost(x, z) {
    const post = new THREE.Group();
    
    const hutGeometry = new THREE.BoxGeometry(4, 5, 4);
    const hutMaterial = new THREE.MeshStandardMaterial({ color: 0xff8800, roughness: 0.7 });
    const hut = new THREE.Mesh(hutGeometry, hutMaterial);
    hut.position.y = 2.5;
    post.add(hut);
    
    const roofGeometry = new THREE.BoxGeometry(5, 0.5, 5);
    const roof = new THREE.Mesh(roofGeometry, hutMaterial);
    roof.position.y = 5.25;
    post.add(roof);
    
    post.position.set(x, 0, z);
    return post;
}

// Marshal posts around circuit
scene.add(createMarshalPost(350, 20));
scene.add(createMarshalPost(150, -230));
scene.add(createMarshalPost(-50, 0));
scene.add(createMarshalPost(50, 380));

// === SPONSOR BOARDS ===
function createSponsorBoard(x, z, rotation, color) {
    const board = new THREE.Group();
    
    const panelGeometry = new THREE.PlaneGeometry(25, 4);
    const panelMaterial = new THREE.MeshStandardMaterial({ 
        color: color, 
        roughness: 0.8,
        side: THREE.DoubleSide
    });
    const panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.position.y = 2.5;
    board.add(panel);
    
    // Posts
    const postGeometry = new THREE.BoxGeometry(0.5, 5, 0.5);
    const postMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const leftPost = new THREE.Mesh(postGeometry, postMaterial);
    leftPost.position.set(-12, 2.5, 0);
    board.add(leftPost);
    
    const rightPost = new THREE.Mesh(postGeometry, postMaterial);
    rightPost.position.set(12, 2.5, 0);
    board.add(rightPost);
    
    board.position.set(x, 0, z);
    board.rotation.y = rotation;
    return board;
}

// A few sponsor boards at braking zones
scene.add(createSponsorBoard(280, 25, 0, 0x006039));      // Rolex green before Abbey
scene.add(createSponsorBoard(-40, -100, 0.5, 0xffd700)); // Pirelli yellow at Copse
scene.add(createSponsorBoard(0, 380, 0, 0xff9900));      // AWS orange at Stowe

// F1 Car - Procedural model (always works, no external files needed)

// Team definitions with colors and performance characteristics
const teams = [
    { name: 'Ferrari', driver: 'Karina', number: 16, primary: 0xe10600, secondary: 0xffcc00, helmet: 0xff0000, pace: 1.02, consistency: 0.98 },
    { name: 'Red Bull', driver: 'Lewis', number: 1, primary: 0x1e41ff, secondary: 0xffd700, helmet: 0xff8c00, pace: 1.03, consistency: 0.99 },
    { name: 'Mercedes', driver: 'Rolf', number: 44, primary: 0x00d2be, secondary: 0x000000, helmet: 0xffff00, pace: 1.01, consistency: 0.97 },
    { name: 'McLaren', driver: 'Richa', number: 4, primary: 0xff8700, secondary: 0x0090ff, helmet: 0xff8700, pace: 1.00, consistency: 0.96 },
    { name: 'Aston Martin', driver: 'Dennis', number: 14, primary: 0x006f62, secondary: 0xcedc00, helmet: 0x0000ff, pace: 0.99, consistency: 0.98 },
    { name: 'Alpine', driver: 'Sujith', number: 10, primary: 0x0090ff, secondary: 0xff69b4, helmet: 0x0090ff, pace: 0.98, consistency: 0.95 }
];

// DRS zones on track (t positions where DRS is available)
const drsZones = [
    { start: 0.40, end: 0.48 },  // Hangar Straight
    { start: 0.62, end: 0.72 }   // Wellington Straight  
];

// Car groups and positions for each car
const cars = [];
let selectedCarIndex = 0;

// Create procedural F1 car with team colors
function createF1Car(teamIndex = 0) {
    const team = teams[teamIndex];
    const car = new THREE.Group();
    car.userData = { team: team, teamIndex: teamIndex };
    
    // Materials with team colors
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: team.primary,
        metalness: 0.8,
        roughness: 0.2
    });
    const accentMaterial = new THREE.MeshStandardMaterial({ 
        color: team.secondary,
        metalness: 0.7,
        roughness: 0.3
    });
    const carbonMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1a1a1a,
        metalness: 0.3,
        roughness: 0.4
    });
    const tireMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x111111,
        metalness: 0.1,
        roughness: 0.9
    });
    const wheelMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xcccccc,
        metalness: 0.9,
        roughness: 0.1
    });
    const helmetMaterial = new THREE.MeshStandardMaterial({ 
        color: team.helmet,
        metalness: 0.5,
        roughness: 0.3
    });
    
    // Main body (monocoque)
    const bodyShape = new THREE.Shape();
    bodyShape.moveTo(-6, 0);
    bodyShape.lineTo(-5, 1.2);
    bodyShape.lineTo(4, 1.2);
    bodyShape.lineTo(6, 0.5);
    bodyShape.lineTo(6, 0);
    bodyShape.lineTo(-6, 0);
    
    const bodyExtrudeSettings = { depth: 2.5, bevelEnabled: false };
    const bodyGeometry = new THREE.ExtrudeGeometry(bodyShape, bodyExtrudeSettings);
    bodyGeometry.center();
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = -Math.PI / 2;
    body.position.y = 0.8;
    body.castShadow = true;
    car.add(body);
    
    // Nose cone
    const noseGeometry = new THREE.ConeGeometry(0.8, 4, 8);
    noseGeometry.rotateZ(-Math.PI / 2);
    const nose = new THREE.Mesh(noseGeometry, bodyMaterial);
    nose.position.set(7, 0.6, 0);
    nose.castShadow = true;
    car.add(nose);
    
    // Cockpit
    const cockpitGeometry = new THREE.BoxGeometry(2.5, 1.2, 1.5);
    const cockpit = new THREE.Mesh(cockpitGeometry, carbonMaterial);
    cockpit.position.set(-1.5, 1.8, 0);
    cockpit.castShadow = true;
    car.add(cockpit);
    
    // Halo
    const haloGeometry = new THREE.TorusGeometry(0.9, 0.08, 8, 16, Math.PI);
    const halo = new THREE.Mesh(haloGeometry, carbonMaterial);
    halo.position.set(-0.5, 2.2, 0);
    halo.rotation.y = Math.PI / 2;
    halo.rotation.x = Math.PI;
    car.add(halo);
    
    // Helmet
    const helmetGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
    helmet.position.set(-1.5, 2, 0);
    helmet.castShadow = true;
    car.add(helmet);
    
    // Front wing
    const frontWingGeometry = new THREE.BoxGeometry(2, 0.15, 5);
    const frontWing = new THREE.Mesh(frontWingGeometry, carbonMaterial);
    frontWing.position.set(8, 0.3, 0);
    frontWing.castShadow = true;
    car.add(frontWing);
    
    // Front wing endplates with accent color
    const endplateGeometry = new THREE.BoxGeometry(1.5, 0.8, 0.1);
    const leftEndplate = new THREE.Mesh(endplateGeometry, accentMaterial);
    leftEndplate.position.set(8, 0.5, 2.5);
    car.add(leftEndplate);
    const rightEndplate = new THREE.Mesh(endplateGeometry, accentMaterial);
    rightEndplate.position.set(8, 0.5, -2.5);
    car.add(rightEndplate);
    
    // Rear wing main plane
    const rearWingGeometry = new THREE.BoxGeometry(0.8, 1.2, 4);
    const rearWing = new THREE.Mesh(rearWingGeometry, carbonMaterial);
    rearWing.position.set(-6.5, 2.5, 0);
    rearWing.castShadow = true;
    car.add(rearWing);
    
    // Rear wing DRS flap
    const drsGeometry = new THREE.BoxGeometry(0.3, 0.6, 4);
    const drs = new THREE.Mesh(drsGeometry, carbonMaterial);
    drs.position.set(-6.2, 3.2, 0);
    drs.rotation.z = -0.2;
    car.add(drs);
    
    // Rear wing endplates with accent color
    const rearEndplateGeometry = new THREE.BoxGeometry(1.5, 1.5, 0.1);
    const leftRearEndplate = new THREE.Mesh(rearEndplateGeometry, accentMaterial);
    leftRearEndplate.position.set(-6.5, 2.5, 2);
    car.add(leftRearEndplate);
    const rightRearEndplate = new THREE.Mesh(rearEndplateGeometry, accentMaterial);
    rightRearEndplate.position.set(-6.5, 2.5, -2);
    car.add(rightRearEndplate);
    
    // Side pods
    const sidepodGeometry = new THREE.BoxGeometry(4, 0.8, 1.2);
    const leftSidepod = new THREE.Mesh(sidepodGeometry, bodyMaterial);
    leftSidepod.position.set(0, 1.2, 1.8);
    leftSidepod.castShadow = true;
    car.add(leftSidepod);
    const rightSidepod = new THREE.Mesh(sidepodGeometry, bodyMaterial);
    rightSidepod.position.set(0, 1.2, -1.8);
    rightSidepod.castShadow = true;
    car.add(rightSidepod);
    
    // Engine cover / airbox
    const airboxGeometry = new THREE.BoxGeometry(3, 1.5, 1);
    const airbox = new THREE.Mesh(airboxGeometry, bodyMaterial);
    airbox.position.set(-3.5, 2, 0);
    airbox.castShadow = true;
    car.add(airbox);
    
    // Floor
    const floorGeometry = new THREE.BoxGeometry(14, 0.1, 4.5);
    const floor = new THREE.Mesh(floorGeometry, carbonMaterial);
    floor.position.set(0, 0.2, 0);
    car.add(floor);
    
    // Wheels
    function createWheel(x, z) {
        const wheelGroup = new THREE.Group();
        
        // Tire
        const tireGeometry = new THREE.CylinderGeometry(0.7, 0.7, 0.5, 24);
        tireGeometry.rotateX(Math.PI / 2);
        const tire = new THREE.Mesh(tireGeometry, tireMaterial);
        tire.castShadow = true;
        wheelGroup.add(tire);
        
        // Rim
        const rimGeometry = new THREE.CylinderGeometry(0.45, 0.45, 0.52, 16);
        rimGeometry.rotateX(Math.PI / 2);
        const rim = new THREE.Mesh(rimGeometry, wheelMaterial);
        wheelGroup.add(rim);
        
        // Center cap with team color
        const capGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.55, 8);
        capGeometry.rotateX(Math.PI / 2);
        const cap = new THREE.Mesh(capGeometry, bodyMaterial);
        wheelGroup.add(cap);
        
        wheelGroup.position.set(x, 0.7, z);
        return wheelGroup;
    }
    
    // Front wheels
    car.add(createWheel(5, 2.2));
    car.add(createWheel(5, -2.2));
    
    // Rear wheels
    car.add(createWheel(-4, 2.2));
    car.add(createWheel(-4, -2.2));
    
    // Scale the whole car
    car.scale.set(1.2, 1.2, 1.2);
    
    return car;
}

// Create driver name label
function createDriverLabel(team) {
    const labelDiv = document.createElement('div');
    labelDiv.className = 'driver-label';
    labelDiv.textContent = team.driver.substring(0, 3).toUpperCase();
    labelDiv.style.cssText = `
        color: white;
        font-family: 'Segoe UI', Arial, sans-serif;
        font-size: 12px;
        font-weight: 700;
        padding: 2px 6px;
        background: #${team.primary.toString(16).padStart(6, '0')};
        border-radius: 3px;
        text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
        white-space: nowrap;
    `;
    const label = new CSS2DObject(labelDiv);
    label.position.set(0, 8, 0);
    return label;
}

// Create all cars with staggered starting positions
for (let i = 0; i < teams.length; i++) {
    const carGroup = new THREE.Group();
    const car = createF1Car(i);
    carGroup.add(car);
    
    // Add driver name label
    const label = createDriverLabel(teams[i]);
    carGroup.add(label);
    carGroup.userData.label = label;
    
    carGroup.userData = {
        t: i * 0.03, // Staggered positions around track (closer together for racing)
        team: teams[i],
        position: i + 1, // Race position
        lastPosition: i + 1,
        totalDistance: 0, // Total distance for position calculation
        hasDRS: false,
        inSlipstream: false,
        baseSpeed: 0.00015 + (Math.random() * 0.00002), // Much slower base speed
        currentSpeedBoost: 0,
        label: label,
        finished: false, // Has car finished the race?
        finishPosition: null, // Final race position
        lateralOffset: 0, // Current lateral position on track (-1 to 1)
        targetLateralOffset: 0, // Target lateral position
        damage: 0, // 0-100, higher = more damage = slower
        lastCollisionTime: 0, // Prevent rapid collision spam
        isAvoiding: false, // Currently avoiding another car
        // Pit stop state
        inPitLane: false, // Currently in pit lane
        pitLaneT: 0, // Position along pit lane curve (0-1)
        isPitting: false, // Currently stopped for pit stop
        pitStopTime: 0, // Time remaining in pit stop (ms)
        pitStopDuration: 0, // Total pit stop duration
        wantsToPit: false, // Scheduled to pit
        hasPitted: false, // Has made a pit stop this stint
        pitCount: 0, // Number of pit stops made
        tireCompound: 'medium', // 'soft', 'medium', 'hard'
        telemetry: {
            speed: 0,
            rpm: 0,
            gear: 1,
            throttle: 0,
            brake: 0,
            gForceX: 0,
            gForceY: 0,
            lapTime: 0,
            bestLap: null,
            currentLap: 1,
            tireTemps: { fl: 85, fr: 85, rl: 85, rr: 85 },
            tireWear: 100, // Tire degradation
            fuelLoad: 100
        }
    };
    scene.add(carGroup);
    cars.push(carGroup);
}

console.log(`Created ${cars.length} F1 cars`);

// Get the currently selected car
function getSelectedCar() {
    return cars[selectedCarIndex];
}

// Switch to next car
function switchCar(direction = 1) {
    selectedCarIndex = (selectedCarIndex + direction + cars.length) % cars.length;
    const car = getSelectedCar();
    console.log(`Switched to: ${car.userData.team.name} - ${car.userData.team.driver} #${car.userData.team.number}`);
    updateDriverDisplay();
}

// Update driver display in UI
function updateDriverDisplay() {
    const car = getSelectedCar();
    const team = car.userData.team;
    
    const driverDisplay = document.getElementById('driver-name');
    if (driverDisplay) {
        driverDisplay.textContent = `${team.driver} #${team.number}`;
        driverDisplay.style.color = `#${team.primary.toString(16).padStart(6, '0')}`;
    }
    
    const teamDisplay = document.getElementById('team-name');
    if (teamDisplay) {
        teamDisplay.textContent = team.name;
        teamDisplay.style.color = `#${team.primary.toString(16).padStart(6, '0')}`;
    }
}

// Calculate race positions based on total distance
function updateRacePositions() {
    // Sort cars by total distance (lap count + track position)
    const sortedCars = [...cars].sort((a, b) => {
        const aDistance = a.userData.telemetry.currentLap + a.userData.t;
        const bDistance = b.userData.telemetry.currentLap + b.userData.t;
        return bDistance - aDistance;
    });
    
    // Assign positions
    sortedCars.forEach((car, index) => {
        car.userData.lastPosition = car.userData.position;
        car.userData.position = index + 1;
    });
    
    // Update race leader lap (capped at total laps)
    const leader = sortedCars[0];
    if (leader) {
        raceLeaderLap = Math.min(leader.userData.telemetry.currentLap, totalLaps);
    }
}

// Update leaderboard UI
function updateLeaderboard() {
    const leaderboardList = document.getElementById('leaderboard-list');
    const raceLapDisplay = document.getElementById('race-lap');
    
    if (!leaderboardList) return;
    
    // Update race lap
    if (raceLapDisplay) {
        raceLapDisplay.textContent = raceLeaderLap;
    }
    
    // Sort cars by position (finished cars first, then by finish position or race position)
    const sortedCars = [...cars].sort((a, b) => {
        // Finished cars come first, sorted by finish position
        if (a.userData.finished && b.userData.finished) {
            return a.userData.finishPosition - b.userData.finishPosition;
        }
        if (a.userData.finished) return -1;
        if (b.userData.finished) return 1;
        return a.userData.position - b.userData.position;
    });
    
    const leader = sortedCars[0];
    const leaderDistance = leader.userData.telemetry.currentLap + leader.userData.t;
    
    // Build leaderboard HTML
    let html = '';
    sortedCars.forEach((car, index) => {
        const carData = car.userData;
        const team = carData.team;
        const position = carData.finished ? carData.finishPosition : carData.position;
        const isSelected = cars.indexOf(car) === selectedCarIndex;
        const justOvertook = carData.lastPosition > carData.position;
        
        // Calculate gap to leader
        const carDistance = carData.telemetry.currentLap + carData.t;
        const gap = leaderDistance - carDistance;
        const gapSeconds = gap * 90; // Approximate lap time in seconds
        
        // Position class for podium colors
        const positionClass = position <= 3 ? `p${position}` : '';
        
        // Status indicator
        let statusIndicator = '';
        if (carData.finished) {
            statusIndicator = '<span class="finished-indicator">🏁 FINISHED</span>';
        } else if (carData.hasDRS && carData.inSlipstream) {
            statusIndicator = '<span class="drs-indicator">DRS + SLIPSTREAM</span>';
        } else if (carData.inSlipstream) {
            statusIndicator = '<span class="drs-indicator">SLIPSTREAM</span>';
        } else if (carData.hasDRS) {
            statusIndicator = '<span class="drs-indicator">DRS ZONE</span>';
        }
        
        // Damage indicator
        let damageIndicator = '';
        if (carData.damage > 0) {
            const damageLevel = carData.damage > 30 ? 'heavy' : (carData.damage > 10 ? 'medium' : 'light');
            damageIndicator = `<span class="damage-indicator ${damageLevel}">⚠ ${Math.round(carData.damage)}%</span>`;
        }
        
        const teamColor = `#${team.primary.toString(16).padStart(6, '0')}`;
        
        // Gap display
        let gapDisplay = '';
        if (carData.finished) {
            if (carData.finishPosition === 1) {
                gapDisplay = 'WINNER';
            } else {
                const leaderFinish = finishOrder[0];
                const thisFinish = finishOrder.find(f => f.team === team);
                if (leaderFinish && thisFinish) {
                    const gapMs = thisFinish.time - leaderFinish.time;
                    gapDisplay = `+${(gapMs / 1000).toFixed(1)}s`;
                }
            }
        } else {
            gapDisplay = position === 1 ? 'LEADER' : `+${gapSeconds.toFixed(1)}s`;
        }
        
        html += `
            <div class="leaderboard-entry ${isSelected ? 'selected' : ''} ${justOvertook ? 'overtaking' : ''} ${carData.finished ? 'finished' : ''} ${carData.damage > 30 ? 'damaged' : ''}" 
                 data-car-index="${cars.indexOf(car)}"
                 style="border-left-color: ${teamColor}">
                <span class="position ${positionClass}">${position}</span>
                <div class="team-color-bar" style="background: ${teamColor}"></div>
                <div class="driver-details">
                    <span class="driver-name-lb">${team.driver}</span>
                    <span class="team-name-lb">${team.name}</span>
                    ${statusIndicator}
                    ${damageIndicator}
                </div>
                <div class="gap-info">
                    <span class="gap-time ${position === 1 ? 'leader' : ''}">
                        ${gapDisplay}
                    </span>
                </div>
            </div>
        `;
    });
    
    leaderboardList.innerHTML = html;
    
    // Add click handlers to leaderboard entries
    document.querySelectorAll('.leaderboard-entry').forEach(entry => {
        entry.addEventListener('click', () => {
            const carIndex = parseInt(entry.dataset.carIndex);
            selectedCarIndex = carIndex;
            updateDriverDisplay();
        });
    });
}

// Corner markers with distance boards
const cornerNames = [
    { name: 'Abbey', t: 0.05, number: 1 },
    { name: 'Farm', t: 0.08, number: 2 },
    { name: 'Village', t: 0.11, number: 3 },
    { name: 'The Loop', t: 0.15, number: 4 },
    { name: 'Aintree', t: 0.19, number: 5 },
    { name: 'Brooklands', t: 0.27, number: 6 },
    { name: 'Luffield', t: 0.32, number: 7 },
    { name: 'Woodcote', t: 0.38, number: 8 },
    { name: 'Copse', t: 0.45, number: 9 },
    { name: 'Maggotts', t: 0.52, number: 10 },
    { name: 'Becketts', t: 0.56, number: 11 },
    { name: 'Chapel', t: 0.60, number: 12 },
    { name: 'Stowe', t: 0.75, number: 13 },
    { name: 'Vale', t: 0.80, number: 14 },
    { name: 'Club', t: 0.85, number: 15 }
];

// Create braking distance markers (100m, 50m boards)
function createDistanceMarker(t, side, distance) {
    const markerGroup = new THREE.Group();
    const point = trackCurve.getPoint(t);
    const tangent = trackCurve.getTangent(t);
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(up, tangent).normalize();
    
    // Board
    const boardGeometry = new THREE.BoxGeometry(0.5, 4, 3);
    const boardMaterial = new THREE.MeshStandardMaterial({
        color: distance === 100 ? 0xff0000 : (distance === 50 ? 0xffff00 : 0x00ff00),
        roughness: 0.5
    });
    const board = new THREE.Mesh(boardGeometry, boardMaterial);
    board.position.y = 2;
    board.castShadow = true;
    markerGroup.add(board);
    
    // Distance stripes
    const numStripes = distance / 50;
    for (let i = 0; i < numStripes; i++) {
        const stripeGeometry = new THREE.PlaneGeometry(2.8, 0.8);
        const stripeMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            side: THREE.DoubleSide
        });
        const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
        stripe.position.set(0.3, 1.2 + i * 1.2, 0);
        stripe.rotation.y = Math.PI / 2;
        markerGroup.add(stripe);
    }
    
    const offset = right.clone().multiplyScalar(side * (trackWidth/2 + 5));
    markerGroup.position.set(point.x + offset.x, point.y, point.z + offset.z);
    markerGroup.rotation.y = Math.atan2(tangent.x, tangent.z);
    
    return markerGroup;
}

// Add distance markers before each major braking zone
const brakingZones = [
    { t: 0.04, corner: 'Abbey' },
    { t: 0.10, corner: 'Village' },
    { t: 0.26, corner: 'Brooklands' },
    { t: 0.44, corner: 'Copse' },
    { t: 0.74, corner: 'Stowe' },
    { t: 0.84, corner: 'Club' }
];

brakingZones.forEach(zone => {
    // 100m board
    scene.add(createDistanceMarker(zone.t - 0.015, 1, 100));
    // 50m board  
    scene.add(createDistanceMarker(zone.t - 0.008, 1, 50));
});

// ==================== STARTING GRID BOXES ====================
function createStartingGrid() {
    const gridGroup = new THREE.Group();
    
    // Create 20 grid boxes (standard F1 grid)
    for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 2; col++) {
            const position = row * 2 + col + 1;
            
            // Calculate position along the track (behind the start line)
            const t = (row * 12 + col * 4 + 20) / (trackCurve.getLength());
            const tNorm = 1 - (t % 1);  // Go backwards from start
            const point = trackCurve.getPoint(tNorm);
            const tangent = trackCurve.getTangent(tNorm);
            const up = new THREE.Vector3(0, 1, 0);
            const right = new THREE.Vector3().crossVectors(up, tangent).normalize();
            
            // Offset left/right from center (staggered grid)
            const lateralOffset = (col === 0) ? -5 : 5;
            const offset = right.clone().multiplyScalar(lateralOffset);
            
            // Grid box outline
            const boxGroup = new THREE.Group();
            
            // White lines forming a box
            const lineWidth = 0.2;
            const boxLength = 4;
            const boxWidth = 3;
            
            // Front line
            const frontGeom = new THREE.PlaneGeometry(boxWidth, lineWidth);
            const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const front = new THREE.Mesh(frontGeom, lineMat);
            front.rotation.x = -Math.PI / 2;
            front.position.set(0, 0.32, -boxLength / 2);
            boxGroup.add(front);
            
            // Back line
            const back = new THREE.Mesh(frontGeom, lineMat);
            back.rotation.x = -Math.PI / 2;
            back.position.set(0, 0.32, boxLength / 2);
            boxGroup.add(back);
            
            // Left line
            const sideGeom = new THREE.PlaneGeometry(lineWidth, boxLength);
            const left = new THREE.Mesh(sideGeom, lineMat);
            left.rotation.x = -Math.PI / 2;
            left.position.set(-boxWidth / 2, 0.32, 0);
            boxGroup.add(left);
            
            // Right line
            const rightLine = new THREE.Mesh(sideGeom, lineMat);
            rightLine.rotation.x = -Math.PI / 2;
            rightLine.position.set(boxWidth / 2, 0.32, 0);
            boxGroup.add(rightLine);
            
            // Position number on the grid (painted on track)
            // Create position number using plane with procedural number
            const numCanvas = document.createElement('canvas');
            numCanvas.width = 64;
            numCanvas.height = 64;
            const numCtx = numCanvas.getContext('2d');
            numCtx.fillStyle = '#ffffff';
            numCtx.font = 'bold 48px Arial';
            numCtx.textAlign = 'center';
            numCtx.textBaseline = 'middle';
            numCtx.fillText(position.toString(), 32, 32);
            
            const numTexture = new THREE.CanvasTexture(numCanvas);
            const numGeom = new THREE.PlaneGeometry(2, 2);
            const numMat = new THREE.MeshBasicMaterial({ 
                map: numTexture, 
                transparent: true,
                opacity: 0.8
            });
            const numMesh = new THREE.Mesh(numGeom, numMat);
            numMesh.rotation.x = -Math.PI / 2;
            numMesh.position.set(0, 0.33, 1);
            boxGroup.add(numMesh);
            
            // Position and rotate the grid box
            boxGroup.position.set(
                point.x + offset.x,
                point.y,
                point.z + offset.z
            );
            boxGroup.rotation.y = Math.atan2(tangent.x, tangent.z);
            
            gridGroup.add(boxGroup);
        }
    }
    
    return gridGroup;
}

scene.add(createStartingGrid());

// ==================== PIT LANE ENTRY/EXIT MARKERS ====================
// Note: The main pit lane is part of the pitBuilding group
// These are just visual markers on the actual track surface

function createPitMarker(t, type) {
    const markerGroup = new THREE.Group();
    const point = trackCurve.getPoint(t);
    const tangent = trackCurve.getTangent(t);
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(up, tangent).normalize();
    
    // Create "PIT IN" or "PIT OUT" text on track edge
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = type === 'entry' ? '#ffcc00' : '#00ff00';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(type === 'entry' ? 'PIT IN →' : '← PIT OUT', 128, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    const geom = new THREE.PlaneGeometry(12, 3);
    const mat = new THREE.MeshBasicMaterial({ 
        map: texture, 
        transparent: true,
        opacity: 0.9
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.rotation.x = -Math.PI / 2;
    
    // Position on inner edge of track
    const offset = right.clone().multiplyScalar(-trackWidth / 2 - 2);
    mesh.position.set(
        point.x + offset.x,
        point.y + 0.35,
        point.z + offset.z
    );
    mesh.rotation.z = -Math.atan2(tangent.x, tangent.z);
    markerGroup.add(mesh);
    
    return markerGroup;
}

// Add pit entry/exit markers
scene.add(createPitMarker(0.94, 'entry'));
scene.add(createPitMarker(0.04, 'exit'));

// Telemetry state
const telemetry = {
    speed: 0,
    rpm: 0,
    gear: 1,
    throttle: 0,
    brake: 0,
    gForceX: 0,
    gForceY: 0,
    lapTime: 0,
    bestLap: null,
    currentLap: 1,
    tireTemps: { fl: 85, fr: 85, rl: 85, rr: 85 },
    drs: false,
    ersDeployment: 0,
    fuelRemaining: 100
};

// Simulation state
let carT = 0;
let isPaused = false;
let simulationSpeed = 0.0008;
let lastLapStart = 0;

// UI Elements
const speedDisplay = document.getElementById('speed-value');
const rpmDisplay = document.getElementById('rpm-value');
const gearDisplay = document.getElementById('gear-value');
const throttleBar = document.getElementById('throttle-bar');
const brakeBar = document.getElementById('brake-bar');
const throttleValue = document.getElementById('throttle-value');
const brakeValue = document.getElementById('brake-value');
const gforceLat = document.getElementById('gforce-lat');
const gforceLon = document.getElementById('gforce-lon');
const gforceDot = document.getElementById('gforce-dot');
const lapTimeDisplay = document.getElementById('lap-time');
const bestLapDisplay = document.getElementById('best-lap');
const lapNumber = document.getElementById('lap-number');
const tireFL = document.getElementById('tire-fl');
const tireFR = document.getElementById('tire-fr');
const tireRL = document.getElementById('tire-rl');
const tireRR = document.getElementById('tire-rr');

// Update telemetry display
function updateTelemetryDisplay(telemetry, carData) {
    if (!telemetry) {
        const selectedCar = getSelectedCar();
        telemetry = selectedCar.userData.telemetry;
        carData = selectedCar.userData;
    }
    
    if (speedDisplay) speedDisplay.textContent = Math.round(telemetry.speed);
    if (rpmDisplay) rpmDisplay.textContent = (telemetry.rpm / 1000).toFixed(1);
    if (gearDisplay) gearDisplay.textContent = telemetry.gear;
    
    if (throttleBar) throttleBar.style.height = telemetry.throttle + '%';
    if (brakeBar) brakeBar.style.height = telemetry.brake + '%';
    if (throttleValue) throttleValue.textContent = Math.round(telemetry.throttle);
    if (brakeValue) brakeValue.textContent = Math.round(telemetry.brake);
    
    // G-Force display
    if (gforceLat) gforceLat.textContent = telemetry.gForceX.toFixed(1);
    if (gforceLon) gforceLon.textContent = telemetry.gForceY.toFixed(1);
    if (gforceDot) {
        const dotX = 50 + (telemetry.gForceX * 10);
        const dotY = 50 - (telemetry.gForceY * 10);
        gforceDot.style.left = Math.max(0, Math.min(100, dotX)) + '%';
        gforceDot.style.top = Math.max(0, Math.min(100, dotY)) + '%';
    }
    
    const lapMinutes = Math.floor(telemetry.lapTime / 60);
    const lapSeconds = (telemetry.lapTime % 60).toFixed(3);
    if (lapTimeDisplay) lapTimeDisplay.textContent = `${lapMinutes}:${lapSeconds.padStart(6, '0')}`;
    if (lapNumber) lapNumber.textContent = telemetry.currentLap;
    
    if (telemetry.bestLap && bestLapDisplay) {
        const bestMinutes = Math.floor(telemetry.bestLap / 60);
        const bestSeconds = (telemetry.bestLap % 60).toFixed(3);
        bestLapDisplay.textContent = `${bestMinutes}:${bestSeconds.padStart(6, '0')}`;
    }
    
    // Update tire temps with colors
    const updateTireColor = (element, temp) => {
        if (!element) return;
        element.textContent = Math.round(temp);
        if (temp < 80) element.style.color = '#3498db';
        else if (temp < 100) element.style.color = '#2ecc71';
        else if (temp < 110) element.style.color = '#f39c12';
        else element.style.color = '#e74c3c';
    };
    
    updateTireColor(tireFL, telemetry.tireTemps.fl);
    updateTireColor(tireFR, telemetry.tireTemps.fr);
    updateTireColor(tireRL, telemetry.tireTemps.rl);
    updateTireColor(tireRR, telemetry.tireTemps.rr);
    
    // Update pit status display
    if (carData) {
        const pitStatus = document.getElementById('pit-status');
        const pitCount = document.getElementById('pit-count');
        const damagePct = document.getElementById('damage-pct');
        const tireCompound = document.getElementById('tire-compound');
        
        if (pitStatus) {
            if (carData.isPitting) {
                pitStatus.textContent = `PITTING ${(carData.pitStopTime / 1000).toFixed(1)}s`;
                pitStatus.className = 'pit-value pitting';
            } else if (carData.inPitLane) {
                pitStatus.textContent = 'IN PIT LANE';
                pitStatus.className = 'pit-value inpit';
            } else if (carData.wantsToPit) {
                pitStatus.textContent = 'BOX THIS LAP';
                pitStatus.className = 'pit-value inpit';
            } else {
                pitStatus.textContent = 'ON TRACK';
                pitStatus.className = 'pit-value';
            }
        }
        
        if (pitCount) pitCount.textContent = carData.pitCount || 0;
        if (damagePct) {
            damagePct.textContent = Math.round(carData.damage || 0) + '%';
            damagePct.style.color = carData.damage > 50 ? '#ff3333' : carData.damage > 20 ? '#ffaa00' : '#00ff88';
        }
        
        if (tireCompound) {
            const compound = carData.tireCompound || 'medium';
            tireCompound.textContent = compound.toUpperCase();
            tireCompound.className = 'tire-compound ' + compound;
        }
    }
}

// Simulate telemetry based on track position
function simulateTelemetry(t, dt) {
    // Get current and next point for corner detection
    const currentTangent = trackCurve.getTangent(t);
    const nextT = (t + 0.01) % 1;
    const nextTangent = trackCurve.getTangent(nextT);
    
    // Calculate turn intensity
    const turnAngle = currentTangent.angleTo(nextTangent);
    const isTurning = turnAngle > 0.02;
    
    // Speed simulation based on corner intensity
    const maxSpeed = 340;
    const minSpeed = 80;
    const targetSpeed = isTurning ? 
        Math.max(minSpeed, maxSpeed - turnAngle * 3000) : 
        maxSpeed;
    
    // Smooth speed transition
    telemetry.speed += (targetSpeed - telemetry.speed) * 0.05;
    
    // Throttle and brake
    if (targetSpeed > telemetry.speed + 10) {
        telemetry.throttle = Math.min(100, telemetry.throttle + 5);
        telemetry.brake = Math.max(0, telemetry.brake - 10);
    } else if (targetSpeed < telemetry.speed - 20) {
        telemetry.brake = Math.min(100, telemetry.brake + 10);
        telemetry.throttle = Math.max(0, telemetry.throttle - 5);
    } else {
        telemetry.throttle = 70;
        telemetry.brake = 0;
    }
    
    // Gear calculation
    telemetry.gear = Math.min(8, Math.max(1, Math.floor(telemetry.speed / 40) + 1));
    
    // RPM based on speed and gear
    const gearRatios = [0, 3.5, 2.8, 2.2, 1.8, 1.5, 1.3, 1.15, 1.0];
    telemetry.rpm = Math.min(15000, (telemetry.speed / gearRatios[telemetry.gear]) * 100 + 4000);
    
    // G-forces
    telemetry.gForceY = (telemetry.throttle - telemetry.brake) / 25; // Longitudinal
    telemetry.gForceX = turnAngle * telemetry.speed / 50; // Lateral
    
    // Lap timing
    telemetry.lapTime += dt / 1000;
    
    // Tire temperatures (vary slightly)
    Object.keys(telemetry.tireTemps).forEach(tire => {
        const baseTemp = 90;
        const variation = isTurning ? 5 : -2;
        telemetry.tireTemps[tire] += (baseTemp + variation - telemetry.tireTemps[tire]) * 0.01;
        telemetry.tireTemps[tire] += (Math.random() - 0.5) * 0.5;
    });
}

// Show checkered flag when leader finishes
function showCheckeredFlag() {
    const flagOverlay = document.createElement('div');
    flagOverlay.id = 'checkered-flag';
    flagOverlay.innerHTML = `
        <div class="flag-content">
            <div class="checkered-pattern"></div>
            <h2>🏁 FINAL LAP 🏁</h2>
            <p>Leader has crossed the finish line!</p>
        </div>
    `;
    flagOverlay.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        border: 4px solid #fff;
        border-radius: 12px;
        padding: 30px 50px;
        z-index: 10000;
        text-align: center;
        animation: flagPulse 0.5s ease-in-out;
    `;
    document.body.appendChild(flagOverlay);
    
    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes flagPulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1); }
            50% { transform: translate(-50%, -50%) scale(1.1); }
        }
        #checkered-flag h2 {
            color: #fff;
            font-size: 32px;
            margin: 10px 0;
            font-family: 'Titillium Web', sans-serif;
        }
        #checkered-flag p {
            color: #aaa;
            font-size: 16px;
            margin: 0;
        }
        .checkered-pattern {
            width: 100px;
            height: 60px;
            margin: 0 auto 15px;
            background: repeating-conic-gradient(#fff 0deg 90deg, #000 90deg 180deg) 0 0/20px 20px;
            border: 2px solid #333;
        }
    `;
    document.head.appendChild(style);
    
    // Remove after 4 seconds
    setTimeout(() => {
        flagOverlay.remove();
    }, 4000);
}

// Show final race results
function showRaceResults() {
    const resultsOverlay = document.createElement('div');
    resultsOverlay.id = 'race-results';
    
    let resultsHTML = `
        <div class="results-content">
            <h1>🏆 RACE COMPLETE 🏆</h1>
            <h2>Silverstone Grand Prix</h2>
            <div class="podium">
    `;
    
    // Top 3 podium
    finishOrder.slice(0, 3).forEach((result, idx) => {
        const medals = ['🥇', '🥈', '🥉'];
        const positions = ['1st', '2nd', '3rd'];
        resultsHTML += `
            <div class="podium-position p${idx + 1}">
                <span class="medal">${medals[idx]}</span>
                <span class="driver">${result.team.driver}</span>
                <span class="team">${result.team.name}</span>
                <span class="pos">${positions[idx]}</span>
            </div>
        `;
    });
    
    resultsHTML += `</div><div class="full-results"><h3>Full Classification</h3><table>`;
    
    // Full results
    finishOrder.forEach((result, idx) => {
        const timeStr = formatRaceTime(result.time);
        const gap = idx === 0 ? 'WINNER' : `+${formatGap(result.time - finishOrder[0].time)}`;
        resultsHTML += `
            <tr>
                <td class="pos">${idx + 1}</td>
                <td class="color" style="background: #${result.team.primary.toString(16).padStart(6, '0')}"></td>
                <td class="driver">${result.team.driver}</td>
                <td class="team">${result.team.name}</td>
                <td class="gap">${gap}</td>
            </tr>
        `;
    });
    
    resultsHTML += `</table></div>
        <button id="restart-race" onclick="restartRace()">🔄 New Race</button>
    </div>`;
    
    resultsOverlay.innerHTML = resultsHTML;
    resultsOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.5s ease;
    `;
    
    // Add results styling
    const style = document.createElement('style');
    style.id = 'results-styles';
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .results-content {
            text-align: center;
            color: #fff;
            font-family: 'Titillium Web', sans-serif;
            max-width: 600px;
        }
        .results-content h1 {
            font-size: 42px;
            margin: 0 0 5px;
            color: #ffd700;
        }
        .results-content h2 {
            font-size: 24px;
            margin: 0 0 30px;
            color: #888;
        }
        .podium {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-bottom: 30px;
        }
        .podium-position {
            background: linear-gradient(180deg, #333 0%, #1a1a1a 100%);
            border-radius: 10px;
            padding: 20px;
            min-width: 150px;
        }
        .podium-position.p1 { border: 3px solid #ffd700; }
        .podium-position.p2 { border: 3px solid #c0c0c0; }
        .podium-position.p3 { border: 3px solid #cd7f32; }
        .podium-position .medal { font-size: 40px; display: block; }
        .podium-position .driver { font-size: 18px; font-weight: bold; display: block; margin: 10px 0 5px; }
        .podium-position .team { font-size: 12px; color: #888; display: block; }
        .podium-position .pos { font-size: 14px; color: #666; display: block; margin-top: 10px; }
        .full-results { margin-top: 20px; }
        .full-results h3 { color: #888; margin-bottom: 15px; }
        .full-results table {
            width: 100%;
            border-collapse: collapse;
        }
        .full-results tr {
            border-bottom: 1px solid #333;
        }
        .full-results td {
            padding: 8px 10px;
            text-align: left;
        }
        .full-results .pos { width: 30px; color: #888; }
        .full-results .color { width: 5px; padding: 0; }
        .full-results .driver { font-weight: bold; }
        .full-results .team { color: #666; font-size: 12px; }
        .full-results .gap { text-align: right; color: #4a4; }
        #restart-race {
            margin-top: 30px;
            padding: 15px 40px;
            font-size: 18px;
            background: linear-gradient(180deg, #e10600 0%, #b00500 100%);
            border: none;
            border-radius: 8px;
            color: #fff;
            cursor: pointer;
            font-family: 'Titillium Web', sans-serif;
            font-weight: bold;
        }
        #restart-race:hover {
            background: linear-gradient(180deg, #ff1a1a 0%, #cc0000 100%);
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(resultsOverlay);
}

// Helper functions for time formatting
function formatRaceTime(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const millis = ms % 1000;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
}

function formatGap(ms) {
    const seconds = (ms / 1000).toFixed(3);
    return `${seconds}s`;
}

// Restart race
function restartRace() {
    // Remove results overlay
    const overlay = document.getElementById('race-results');
    if (overlay) overlay.remove();
    const styles = document.getElementById('results-styles');
    if (styles) styles.remove();
    
    // Reset race state
    raceFinished = false;
    finishOrder = [];
    sessionStartTime = Date.now();
    
    // Reset all cars
    cars.forEach((carGroup, i) => {
        carGroup.userData.t = i * 0.03;
        carGroup.userData.totalDistance = 0;
        carGroup.userData.position = i + 1;
        carGroup.userData.lastPosition = i + 1;
        carGroup.userData.finished = false;
        carGroup.userData.finishPosition = null;
        carGroup.userData.baseSpeed = 0.00015 + (Math.random() * 0.00002);
        carGroup.userData.damage = 0;
        carGroup.userData.lateralOffset = 0;
        carGroup.userData.targetLateralOffset = 0;
        carGroup.userData.lastCollisionTime = 0;
        
        // Reset pit stop state
        carGroup.userData.inPitLane = false;
        carGroup.userData.pitLaneT = 0;
        carGroup.userData.isPitting = false;
        carGroup.userData.pitStopTime = 0;
        carGroup.userData.pitStopDuration = 0;
        carGroup.userData.wantsToPit = false;
        carGroup.userData.hasPitted = false;
        carGroup.userData.pitCount = 0;
        carGroup.userData.tireCompound = 'medium';
        
        const telemetry = carGroup.userData.telemetry;
        telemetry.currentLap = 1;
        telemetry.lapTime = 0;
        telemetry.bestLap = null;
        telemetry.tireWear = 100;
        telemetry.fuelLoad = 100;
        telemetry.speed = 0;
        telemetry.gear = 1;
    });
    
    // Resume if paused
    isPaused = false;
}

// Show collision notification
function showCollisionNotification(driver1, driver2, severity) {
    const notification = document.createElement('div');
    notification.className = 'collision-notification';
    
    let severityText = 'CONTACT';
    let severityColor = '#ffaa00';
    if (severity > 2) {
        severityText = 'HEAVY COLLISION';
        severityColor = '#ff3333';
    } else if (severity > 1) {
        severityText = 'COLLISION';
        severityColor = '#ff6600';
    }
    
    notification.innerHTML = `
        <span class="collision-icon">💥</span>
        <span class="collision-text">${severityText}: ${driver1} & ${driver2}</span>
    `;
    notification.style.cssText = `
        position: fixed;
        top: 60px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.9);
        border: 2px solid ${severityColor};
        border-radius: 8px;
        padding: 10px 20px;
        color: ${severityColor};
        font-family: 'Titillium Web', sans-serif;
        font-weight: bold;
        font-size: 14px;
        z-index: 1000;
        animation: collisionPulse 0.3s ease-out;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    document.body.appendChild(notification);
    
    // Add animation style if not exists
    if (!document.getElementById('collision-styles')) {
        const style = document.createElement('style');
        style.id = 'collision-styles';
        style.textContent = `
            @keyframes collisionPulse {
                0% { transform: translateX(-50%) scale(1.2); opacity: 0; }
                100% { transform: translateX(-50%) scale(1); opacity: 1; }
            }
            .collision-icon { font-size: 20px; }
        `;
        document.head.appendChild(style);
    }
    
    // Remove after 2 seconds
    setTimeout(() => notification.remove(), 2000);
}

// Show pit notification
function showPitNotification(driver, message) {
    // Remove any existing pit notification
    const existing = document.querySelector('.pit-notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = 'pit-notification';
    
    notification.innerHTML = `
        <span class="pit-icon">🔧</span>
        <span class="pit-text">${driver}: ${message}</span>
    `;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.9);
        border: 2px solid #00aaff;
        border-radius: 8px;
        padding: 10px 20px;
        color: #00aaff;
        font-family: 'Titillium Web', sans-serif;
        font-weight: bold;
        font-size: 14px;
        z-index: 1000;
        animation: pitSlide 0.3s ease-out;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    document.body.appendChild(notification);
    
    // Add animation style if not exists
    if (!document.getElementById('pit-styles')) {
        const style = document.createElement('style');
        style.id = 'pit-styles';
        style.textContent = `
            @keyframes pitSlide {
                0% { transform: translateX(-50%) translateY(-20px); opacity: 0; }
                100% { transform: translateX(-50%) translateY(0); opacity: 1; }
            }
            .pit-icon { font-size: 20px; }
        `;
        document.head.appendChild(style);
    }
    
    // Remove after 2 seconds
    setTimeout(() => notification.remove(), 2000);
}

// Make restartRace available globally
window.restartRace = restartRace;

// Minimap
const minimapCanvas = document.getElementById('minimap-canvas');
const minimapCtx = minimapCanvas.getContext('2d');

function drawMinimap() {
    if (!minimapCanvas || !minimapCtx) return;
    
    minimapCtx.clearRect(0, 0, 200, 200);
    
    // Calculate bounds of track for proper scaling
    // Track x ranges from ~-235 to ~400 (scaled by trackScale=2 = -470 to 800)
    // Track z ranges from ~-210 to ~415 (scaled by trackScale=2 = -420 to 830)
    const minX = -500 * trackScale;
    const maxX = 450 * trackScale;
    const minZ = -250 * trackScale;
    const maxZ = 450 * trackScale;
    const rangeX = maxX - minX;
    const rangeZ = maxZ - minZ;
    const maxRange = Math.max(rangeX, rangeZ);
    
    // Draw track outline
    minimapCtx.strokeStyle = '#555';
    minimapCtx.lineWidth = 6;
    minimapCtx.beginPath();
    
    for (let i = 0; i <= 100; i++) {
        const t = i / 100;
        const point = trackCurve.getPoint(t);
        const x = ((point.x - minX) / maxRange) * 180 + 10;
        const y = ((-point.z - minZ) / maxRange) * 180 + 10;
        
        if (i === 0) minimapCtx.moveTo(x, y);
        else minimapCtx.lineTo(x, y);
    }
    minimapCtx.closePath();
    minimapCtx.stroke();
    
    // Draw all cars
    cars.forEach((car, index) => {
        const carData = car.userData;
        const team = carData.team;
        const carPoint = trackCurve.getPoint(carData.t);
        const carX = ((carPoint.x - minX) / maxRange) * 180 + 10;
        const carY = ((-carPoint.z - minZ) / maxRange) * 180 + 10;
        
        // Team color for the dot
        const color = '#' + team.primary.toString(16).padStart(6, '0');
        
        // Draw car dot - larger for selected car
        const isSelected = index === selectedCarIndex;
        minimapCtx.fillStyle = color;
        minimapCtx.beginPath();
        minimapCtx.arc(carX, carY, isSelected ? 6 : 4, 0, Math.PI * 2);
        minimapCtx.fill();
        
        // Add white border for selected car
        if (isSelected) {
            minimapCtx.strokeStyle = '#fff';
            minimapCtx.lineWidth = 2;
            minimapCtx.stroke();
        }
    });
}

// Pause button (legacy - kept for compatibility)
const toggleSimBtn = document.getElementById('toggle-sim');
if (toggleSimBtn) {
    toggleSimBtn.addEventListener('click', () => {
        isPaused = !isPaused;
        toggleSimBtn.textContent = isPaused ? 'Resume Simulation' : 'Pause Simulation';
    });
}

// Legacy camera toggle (kept for compatibility)
const toggleCameraBtn = document.getElementById('toggle-camera');
if (toggleCameraBtn) {
    toggleCameraBtn.addEventListener('click', () => {
        cycleCamera();
        toggleCameraBtn.textContent = `Camera: ${cameraMode.toUpperCase()}`;
    });
}

// Update camera based on mode
function updateCamera(carPosition, carTangent) {
    if (cameraMode === 'orbit') {
        // Orbit controls handle this
        return;
    }
    
    const carQuaternion = new THREE.Quaternion();
    const carMatrix = new THREE.Matrix4();
    const up = new THREE.Vector3(0, 1, 0);
    const lookDir = carTangent.clone();
    carMatrix.lookAt(new THREE.Vector3(), lookDir, up);
    carQuaternion.setFromRotationMatrix(carMatrix);
    
    let targetPosition = new THREE.Vector3();
    let lookAtPosition = new THREE.Vector3();
    
    switch (cameraMode) {
        case 'follow':
            // Behind and above the car
            const behindOffset = carTangent.clone().multiplyScalar(-50);
            targetPosition.copy(carPosition).add(behindOffset);
            targetPosition.y = carPosition.y + 20;
            lookAtPosition.copy(carPosition);
            lookAtPosition.y = carPosition.y + 5;
            break;
            
        case 'chase':
            // Lower, closer chase cam
            const chaseOffset = carTangent.clone().multiplyScalar(-25);
            targetPosition.copy(carPosition).add(chaseOffset);
            targetPosition.y = carPosition.y + 8;
            const lookAhead = carTangent.clone().multiplyScalar(30);
            lookAtPosition.copy(carPosition).add(lookAhead);
            lookAtPosition.y = carPosition.y + 3;
            break;
            
        case 'helicopter':
            // High above, looking down
            targetPosition.copy(carPosition);
            targetPosition.y = carPosition.y + 150;
            const helicopterOffset = carTangent.clone().multiplyScalar(-80);
            targetPosition.add(helicopterOffset);
            lookAtPosition.copy(carPosition);
            break;
            
        case 'cockpit':
            // Inside the car with gimbal-stabilized view
            const cockpitForward = carTangent.clone().multiplyScalar(2);
            targetPosition.copy(carPosition).add(cockpitForward);
            
            // Get the current track elevation
            const cockpitHeight = carPosition.y + 3;
            targetPosition.y = cockpitHeight;
            
            // Look ahead along the track
            const cockpitLook = carTangent.clone().multiplyScalar(50);
            lookAtPosition.copy(carPosition).add(cockpitLook);
            
            // Gimbal stabilization: keep horizon level regardless of track banking
            // Only follow the forward direction, not the roll
            const bankingAtCar = getBankingAtT(getSelectedCar().userData.t);
            
            // Smooth the horizon - lookAt Y stays at car level (gimbal effect)
            lookAtPosition.y = carPosition.y + 2;
            
            // Add slight head movement for realism
            const headBob = Math.sin(time * 0.01) * 0.1;
            targetPosition.y += headBob;
            break;
            
        case 'tv':
            // Fixed trackside camera that pans to follow car
            const trackT = Math.floor(carPosition.x / 100) * 0.1;
            const tvCamPos = trackCurve.getPoint((Math.floor(getSelectedCar().userData.t * 10) / 10) % 1);
            const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), carTangent).normalize();
            targetPosition.copy(tvCamPos).add(right.multiplyScalar(60));
            targetPosition.y = tvCamPos.y + 15;
            lookAtPosition.copy(carPosition);
            lookAtPosition.y = carPosition.y + 3;
            break;
    }
    
    // Smooth camera movement
    camera.position.lerp(targetPosition, 0.1);
    
    // Smooth look-at
    const currentLookAt = new THREE.Vector3();
    camera.getWorldDirection(currentLookAt);
    currentLookAt.multiplyScalar(100).add(camera.position);
    currentLookAt.lerp(lookAtPosition, 0.1);
    camera.lookAt(lookAtPosition);
}

// Animation loop
let lastTime = 0;
let raceLeaderLap = 1;

function animate(time) {
    requestAnimationFrame(animate);
    
    const dt = time - lastTime;
    lastTime = time;
    
    if (!isPaused) {
        // First pass: calculate positions, check for DRS/slipstream, and collision avoidance
        cars.forEach((carGroup, index) => {
            const carData = carGroup.userData;
            const team = carData.team;
            
            // Check if in DRS zone
            carData.hasDRS = drsZones.some(zone => 
                carData.t >= zone.start && carData.t <= zone.end
            );
            
            // Check for slipstream and nearby cars
            carData.inSlipstream = false;
            carData.isAvoiding = false;
            let avoidDirection = 0;
            
            cars.forEach((otherCar, otherIndex) => {
                if (index !== otherIndex && !otherCar.userData.finished) {
                    const gap = otherCar.userData.t - carData.t;
                    // Normalize gap for track wraparound
                    const normalizedGap = gap < -0.5 ? gap + 1 : (gap > 0.5 ? gap - 1 : gap);
                    
                    // Slipstream check (car ahead within range)
                    if (normalizedGap > 0 && normalizedGap < 0.015) {
                        carData.inSlipstream = true;
                    }
                    
                    // Collision avoidance - check if cars are too close
                    const lateralDiff = Math.abs(carData.lateralOffset - otherCar.userData.lateralOffset);
                    const longitudinalDist = Math.abs(normalizedGap);
                    
                    // If cars are very close (potential collision)
                    if (longitudinalDist < 0.008 && lateralDiff < 0.6) {
                        carData.isAvoiding = true;
                        
                        // Determine which way to avoid
                        if (carData.lateralOffset <= otherCar.userData.lateralOffset) {
                            avoidDirection = -1; // Go left
                        } else {
                            avoidDirection = 1; // Go right
                        }
                        
                        // Check for actual collision (very close)
                        if (longitudinalDist < 0.003 && lateralDiff < 0.3) {
                            const now = time;
                            // Prevent collision spam
                            if (now - carData.lastCollisionTime > 1000) {
                                carData.lastCollisionTime = now;
                                
                                // Apply damage to both cars
                                const collisionSeverity = (0.3 - lateralDiff) * 10; // 0-3 damage
                                carData.damage = Math.min(100, carData.damage + collisionSeverity + Math.random() * 5);
                                otherCar.userData.damage = Math.min(100, otherCar.userData.damage + collisionSeverity * 0.5 + Math.random() * 3);
                                
                                // Show collision notification
                                showCollisionNotification(carData.team.driver, otherCar.userData.team.driver, collisionSeverity);
                            }
                        }
                    }
                }
            });
            
            // Update lateral offset for avoidance
            if (carData.isAvoiding) {
                carData.targetLateralOffset = Math.max(-1, Math.min(1, carData.lateralOffset + avoidDirection * 0.5));
            } else {
                // Gradually return to racing line (center)
                carData.targetLateralOffset = carData.lateralOffset * 0.95;
            }
            
            // Smooth lateral movement
            carData.lateralOffset += (carData.targetLateralOffset - carData.lateralOffset) * 0.1;
        });
        
        // Second pass: update car positions with racing dynamics
        cars.forEach((carGroup, index) => {
            const carData = carGroup.userData;
            const telemetry = carData.telemetry;
            const team = carData.team;
            
            // ==================== PIT STOP LOGIC ====================
            
            // Check if car needs to pit (low tire wear or damage)
            if (!carData.wantsToPit && !carData.inPitLane && !carData.hasPitted) {
                // Auto-pit when tires are worn or significant damage
                if (telemetry.tireWear < 30 || carData.damage > 50) {
                    carData.wantsToPit = true;
                    showPitNotification(team.driver, 'BOX THIS LAP');
                }
                // Also pit around lap 25-30 for strategy (if haven't pitted)
                if (telemetry.currentLap >= 25 && telemetry.currentLap <= 30 && !carData.hasPitted && Math.random() < 0.01) {
                    carData.wantsToPit = true;
                    showPitNotification(team.driver, 'BOX THIS LAP');
                }
            }
            
            // Check if car should enter pit lane (near pit entry point)
            if (carData.wantsToPit && !carData.inPitLane && !carData.finished) {
                if (carData.t >= PIT_ENTRY_T && carData.t < PIT_ENTRY_T + 0.03) {
                    carData.inPitLane = true;
                    carData.pitLaneT = 0;
                    carData.wantsToPit = false;
                    showPitNotification(team.driver, 'IN PIT LANE');
                }
            }
            
            // Handle car in pit lane
            if (carData.inPitLane && !carData.finished) {
                // Get pit box position for this team
                const pitBox = pitBoxPositions.find(p => p.team === index);
                const pitBoxT = pitBox ? pitBox.t : 0.5;
                
                // Pit lane speed (much slower)
                const pitLaneSpeed = 0.00008 * speedMultiplier;
                
                if (carData.isPitting) {
                    // Car is stopped at pit box
                    carData.pitStopTime -= dt * speedMultiplier;
                    
                    if (carData.pitStopTime <= 0) {
                        // Pit stop complete
                        carData.isPitting = false;
                        carData.hasPitted = true;
                        carData.pitCount++;
                        
                        // Fresh tires and repairs
                        telemetry.tireWear = 100;
                        carData.damage = Math.max(0, carData.damage - 50); // Partial repair
                        
                        // Change tire compound
                        if (carData.tireCompound === 'medium') {
                            carData.tireCompound = 'hard';
                        } else {
                            carData.tireCompound = 'medium';
                        }
                        
                        showPitNotification(team.driver, `PIT COMPLETE - ${(carData.pitStopDuration / 1000).toFixed(1)}s`);
                    }
                } else {
                    // Moving through pit lane
                    carData.pitLaneT += pitLaneSpeed * (dt || 16);
                    
                    // Check if arrived at pit box
                    if (!carData.hasPitted && carData.pitLaneT >= pitBoxT && carData.pitLaneT < pitBoxT + 0.05) {
                        carData.isPitting = true;
                        carData.pitStopDuration = 2000 + Math.random() * 1500; // 2-3.5 second pit stop
                        carData.pitStopTime = carData.pitStopDuration;
                        showPitNotification(team.driver, 'STATIONARY');
                    }
                    
                    // Check if exiting pit lane
                    if (carData.pitLaneT >= 1) {
                        carData.inPitLane = false;
                        carData.pitLaneT = 0;
                        carData.t = PIT_EXIT_T; // Rejoin track
                        showPitNotification(team.driver, 'REJOINING TRACK');
                    }
                }
                
                // Position car on pit lane curve
                if (carData.inPitLane) {
                    const pitPos = pitLaneCurve.getPoint(carData.pitLaneT);
                    const pitTangent = pitLaneCurve.getTangent(carData.pitLaneT);
                    
                    carGroup.position.set(pitPos.x, pitPos.y + 0.5, pitPos.z);
                    carGroup.rotation.y = Math.atan2(pitTangent.x, pitTangent.z) - Math.PI / 2;
                    carGroup.rotation.z = 0; // No banking in pit lane
                }
                
                // Skip normal track movement while in pit lane
                return;
            }
            
            // ==================== NORMAL TRACK MOVEMENT ====================
            
            // Base speed with team performance characteristics - reduced variation for less overtaking
            let paceMultiplier = team.pace;
            
            // Reduced random variation - less chaotic overtaking
            paceMultiplier *= (0.995 + Math.random() * 0.01) * team.consistency;
            
            // Tire wear affects grip and speed (reduced effect)
            const tireEffect = 0.98 + (telemetry.tireWear / 100) * 0.02;
            paceMultiplier *= tireEffect;
            
            // Fuel effect (lighter = faster) - reduced
            const fuelEffect = 1.0 + ((100 - telemetry.fuelLoad) / 100) * 0.005;
            paceMultiplier *= fuelEffect;
            
            // Damage effect - damaged cars are slower (up to 15% slower at max damage)
            const damageEffect = 1.0 - (carData.damage / 100) * 0.15;
            paceMultiplier *= damageEffect;
            
            // Avoiding penalty - slightly slower when dodging
            if (carData.isAvoiding) {
                paceMultiplier *= 0.98;
            }
            
            // DRS boost - reduced for more realistic overtaking
            if (carData.hasDRS && carData.inSlipstream) {
                paceMultiplier *= 1.025; // 2.5% speed boost with DRS + slipstream
                carData.currentSpeedBoost = 0.025;
            } else if (carData.inSlipstream) {
                paceMultiplier *= 1.012; // 1.2% slipstream only
                carData.currentSpeedBoost = 0.012;
            } else if (carData.hasDRS) {
                paceMultiplier *= 1.005; // 0.5% DRS only
                carData.currentSpeedBoost = 0.005;
            } else {
                carData.currentSpeedBoost = 0;
            }
            
            // Move car along track (apply global simulation speed multiplier)
            const baseSpeed = carData.baseSpeed * paceMultiplier * speedMultiplier;
            
            // Only move if car hasn't finished the race
            if (!carData.finished) {
                carData.t += baseSpeed * (dt || 16);
                carData.totalDistance += baseSpeed * (dt || 16);
            }
            
            // Check for lap completion
            if (carData.t >= 1) {
                carData.t = carData.t % 1;
                
                // Record lap time
                if (telemetry.bestLap === null || telemetry.lapTime < telemetry.bestLap) {
                    telemetry.bestLap = telemetry.lapTime;
                }
                
                // Only increment lap if under total laps
                if (telemetry.currentLap < totalLaps) {
                    telemetry.currentLap++;
                    telemetry.lapTime = 0;
                    
                    // Tire and fuel degradation per lap
                    telemetry.tireWear = Math.max(0, telemetry.tireWear - (1 + Math.random() * 0.5));
                    telemetry.fuelLoad = Math.max(0, telemetry.fuelLoad - 2);
                } else if (!carData.finished) {
                    // Car has finished the race!
                    carData.finished = true;
                    carData.finishPosition = finishOrder.length + 1;
                    finishOrder.push({
                        team: carData.team,
                        position: carData.finishPosition,
                        time: Date.now() - sessionStartTime
                    });
                    
                    // Check if all cars have finished
                    if (finishOrder.length === cars.length) {
                        raceFinished = true;
                        showRaceResults();
                    } else if (finishOrder.length === 1) {
                        // First car finished - show checkered flag
                        showCheckeredFlag();
                    }
                }
            }
            
            // Get car position on track
            const carPosition = trackCurve.getPoint(carData.t);
            const carTangent = trackCurve.getTangent(carData.t);
            
            // Get banking at current position
            const currentBanking = getBankingAtT(carData.t);
            const bankingRad = currentBanking * Math.PI / 180;
            
            // Calculate lateral offset - use stored lateral offset for collision avoidance
            // lateralOffset is -1 to 1, multiply by track width portion
            const trackLateralOffset = carData.lateralOffset * 8; // Max 8 units left/right
            
            // Apply lateral offset
            const up = new THREE.Vector3(0, 1, 0);
            const right = new THREE.Vector3().crossVectors(up, carTangent).normalize();
            const offsetPosition = carPosition.clone().add(right.multiplyScalar(trackLateralOffset));
            
            // Update car position with elevation from track curve
            carGroup.position.set(offsetPosition.x, carPosition.y + 0.5, offsetPosition.z);
            
            // Rotate car to face direction of travel
            const angle = Math.atan2(carTangent.x, carTangent.z);
            carGroup.rotation.y = angle - Math.PI / 2;
            
            // Apply banking roll to the car
            carGroup.rotation.z = bankingRad;
            
            // Simulate telemetry for this car
            simulateCarTelemetry(carData.t, dt, telemetry, carTangent);
        });
        
        // Calculate race positions
        updateRacePositions();
        
        // Update leaderboard UI
        updateLeaderboard();
        
        // Get selected car for camera and UI
        const selectedCar = getSelectedCar();
        const selectedPosition = trackCurve.getPoint(selectedCar.userData.t);
        const selectedTangent = trackCurve.getTangent(selectedCar.userData.t);
        
        // Update camera based on mode (follows selected car)
        updateCamera(selectedPosition, selectedTangent);
        
        // Update displays with selected car's telemetry
        updateTelemetryDisplay(selectedCar.userData.telemetry, selectedCar.userData);
        updateDriverDisplayFull();
        drawMinimap();
        
        // Update driver name label visibility
        cars.forEach(car => {
            if (car.userData.label) {
                car.userData.label.visible = showDriverNames;
            }
        });
    }
    
    // Always update orbit controls when in orbit mode
    if (cameraMode === 'orbit') {
        controls.update();
    }
    
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

// Simulate telemetry for a specific car
function simulateCarTelemetry(t, dt, telemetry, carTangent) {
    const nextT = (t + 0.01) % 1;
    const nextTangent = trackCurve.getTangent(nextT);
    
    // Calculate turn intensity
    const turnAngle = carTangent.angleTo(nextTangent);
    const isTurning = turnAngle > 0.02;
    
    // Speed simulation based on corner intensity
    const maxSpeed = 340;
    const minSpeed = 80;
    const targetSpeed = isTurning ? 
        Math.max(minSpeed, maxSpeed - turnAngle * 3000) : 
        maxSpeed;
    
    // Smooth speed transition
    telemetry.speed += (targetSpeed - telemetry.speed) * 0.05;
    
    // Throttle and brake
    if (targetSpeed > telemetry.speed + 10) {
        telemetry.throttle = Math.min(100, telemetry.throttle + 5);
        telemetry.brake = Math.max(0, telemetry.brake - 10);
    } else if (targetSpeed < telemetry.speed - 20) {
        telemetry.brake = Math.min(100, telemetry.brake + 10);
        telemetry.throttle = Math.max(0, telemetry.throttle - 5);
    } else {
        telemetry.throttle = 70;
        telemetry.brake = 0;
    }
    
    // Gear calculation
    telemetry.gear = Math.min(8, Math.max(1, Math.floor(telemetry.speed / 40) + 1));
    
    // RPM based on speed and gear
    const gearRatios = [0, 3.5, 2.8, 2.2, 1.8, 1.5, 1.3, 1.15, 1.0];
    telemetry.rpm = Math.min(15000, (telemetry.speed / gearRatios[telemetry.gear]) * 100 + 4000);
    
    // G-forces
    telemetry.gForceY = (telemetry.throttle - telemetry.brake) / 25;
    telemetry.gForceX = turnAngle * telemetry.speed / 50;
    
    // Lap timing
    telemetry.lapTime += dt / 1000;
    
    // Tire temperatures
    Object.keys(telemetry.tireTemps).forEach(tire => {
        const baseTemp = 90;
        const variation = isTurning ? 5 : -2;
        telemetry.tireTemps[tire] += (baseTemp + variation - telemetry.tireTemps[tire]) * 0.01;
        telemetry.tireTemps[tire] += (Math.random() - 0.5) * 0.5;
    });
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

// Session clock
let sessionStartTime = Date.now();
let totalLaps = 50;
let speedMultiplier = 0.25; // Start at slower speed (0.25x)
let raceFinished = false;
let finishOrder = []; // Track order cars cross the finish line

function updateSessionClock() {
    if (isPaused) return;
    const elapsed = Date.now() - sessionStartTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    const clockDisplay = document.getElementById('session-clock');
    if (clockDisplay) {
        clockDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}
setInterval(updateSessionClock, 1000);

// Camera mode cycling
const cameraModes = ['follow', 'chase', 'helicopter', 'orbit', 'cockpit', 'tv'];

function setCameraMode(mode) {
    cameraMode = mode;
    controls.enabled = (cameraMode === 'orbit');
    
    // Update camera buttons
    document.querySelectorAll('.cam-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
}

function cycleCamera() {
    const currentIndex = cameraModes.indexOf(cameraMode);
    const nextIndex = (currentIndex + 1) % cameraModes.length;
    setCameraMode(cameraModes[nextIndex]);
}

// Speed control
function setSimulationSpeed(speed) {
    speedMultiplier = speed;
    
    // Update speed buttons
    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.classList.toggle('active', parseFloat(btn.dataset.speed) === speed);
    });
    
    // Update slider
    const slider = document.getElementById('speed-slider');
    if (slider) slider.value = speed;
}

// Playback controls
function togglePause() {
    isPaused = !isPaused;
    const btn = document.getElementById('btn-play-pause');
    const status = document.getElementById('race-status');
    if (btn) btn.textContent = isPaused ? '▶' : '⏸';
    if (status) {
        status.textContent = isPaused ? 'PAUSED' : 'RACING';
        status.classList.toggle('paused', isPaused);
    }
}

// View toggle functions
let showDriverNames = true;

function toggleElement(elementId, buttonId) {
    const element = document.getElementById(elementId);
    const button = document.getElementById(buttonId);
    if (element) {
        element.classList.toggle('hidden');
        if (button) button.classList.toggle('active');
    }
}

function toggleDriverNames() {
    showDriverNames = !showDriverNames;
    const button = document.getElementById('toggle-names');
    if (button) button.classList.toggle('active', showDriverNames);
}

// Enhanced driver display update
function updateDriverDisplayFull() {
    const car = getSelectedCar();
    const team = car.userData.team;
    const carData = car.userData;
    
    // Driver name in control bar
    const driverNameEl = document.getElementById('driver-name');
    if (driverNameEl) {
        driverNameEl.textContent = team.driver;
        driverNameEl.style.color = `#${team.primary.toString(16).padStart(6, '0')}`;
    }
    
    // Team name
    const teamNameEl = document.getElementById('team-name');
    if (teamNameEl) {
        teamNameEl.textContent = team.name;
    }
    
    // Position
    const positionEl = document.getElementById('driver-position');
    if (positionEl) {
        positionEl.textContent = `P${carData.position}`;
    }
    
    // Driver tag in telemetry
    const driverTag = document.getElementById('driver-tag');
    if (driverTag) {
        const shortName = team.driver.substring(0, 3).toUpperCase();
        driverTag.textContent = `${shortName} #${team.number}`;
        driverTag.style.background = `#${team.primary.toString(16).padStart(6, '0')}`;
    }
    
    // DRS status
    const drsStatus = document.getElementById('drs-status');
    if (drsStatus) {
        if (carData.hasDRS && carData.inSlipstream) {
            drsStatus.textContent = 'ACTIVE';
            drsStatus.className = 'tel-value drs-on';
        } else if (carData.hasDRS) {
            drsStatus.textContent = 'READY';
            drsStatus.className = 'tel-value drs-on';
        } else {
            drsStatus.textContent = 'OFF';
            drsStatus.className = 'tel-value drs-off';
        }
    }
    
    // Gap to leader
    const gapEl = document.getElementById('gap-leader');
    if (gapEl) {
        if (carData.position === 1) {
            gapEl.textContent = 'LEADER';
            gapEl.style.color = '#ffd700';
        } else {
            const leader = cars.find(c => c.userData.position === 1);
            if (leader) {
                const leaderDist = leader.userData.telemetry.currentLap + leader.userData.t;
                const carDist = carData.telemetry.currentLap + carData.t;
                const gap = (leaderDist - carDist) * 90;
                gapEl.textContent = `+${gap.toFixed(1)}s`;
                gapEl.style.color = '#ff6b00';
            }
        }
    }
    
    // Tire wear
    const wearBar = document.getElementById('tire-wear-bar');
    const wearPct = document.getElementById('tire-wear-pct');
    if (wearBar && wearPct) {
        const wear = carData.telemetry.tireWear;
        wearBar.style.width = `${wear}%`;
        wearPct.textContent = `${Math.round(wear)}%`;
    }
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowLeft':
        case '[':
            switchCar(-1);
            break;
        case 'ArrowRight':
        case ']':
            switchCar(1);
            break;
        case ' ':
            e.preventDefault();
            togglePause();
            break;
        case 'c':
        case 'C':
            cycleCamera();
            break;
        case '+':
        case '=':
            setSimulationSpeed(Math.min(5, speedMultiplier + 0.5));
            break;
        case '-':
        case '_':
            setSimulationSpeed(Math.max(0.1, speedMultiplier - 0.5));
            break;
        case 'h':
        case 'H':
            document.getElementById('shortcuts-help')?.classList.toggle('hidden');
            break;
        default:
            if (e.key >= '1' && e.key <= '6') {
                selectedCarIndex = parseInt(e.key) - 1;
                updateDriverDisplayFull();
            }
    }
});

// Setup UI event listeners
function setupUIListeners() {
    // Speed buttons
    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setSimulationSpeed(parseFloat(btn.dataset.speed));
        });
    });
    
    // Speed slider
    const speedSlider = document.getElementById('speed-slider');
    if (speedSlider) {
        speedSlider.addEventListener('input', (e) => {
            setSimulationSpeed(parseFloat(e.target.value));
        });
    }
    
    // Playback buttons
    document.getElementById('btn-play-pause')?.addEventListener('click', togglePause);
    document.getElementById('btn-restart')?.addEventListener('click', restartRace);
    document.getElementById('btn-step')?.addEventListener('click', () => {
        // Step forward one frame
        if (isPaused) {
            cars.forEach(car => {
                car.userData.t += 0.001;
            });
        }
    });
    
    // Camera buttons
    document.querySelectorAll('.cam-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setCameraMode(btn.dataset.mode);
        });
    });
    
    // Driver switching
    document.getElementById('prev-driver')?.addEventListener('click', () => switchCar(-1));
    document.getElementById('next-driver')?.addEventListener('click', () => switchCar(1));
    
    // View toggles
    document.getElementById('toggle-telemetry')?.addEventListener('click', () => {
        toggleElement('dashboard', 'toggle-telemetry');
    });
    document.getElementById('toggle-leaderboard')?.addEventListener('click', () => {
        toggleElement('leaderboard', 'toggle-leaderboard');
    });
    document.getElementById('toggle-minimap')?.addEventListener('click', () => {
        toggleElement('minimap', 'toggle-minimap');
    });
    document.getElementById('toggle-names')?.addEventListener('click', () => {
        toggleDriverNames();
    });
    
    // Set initial camera button state
    setCameraMode(cameraMode);
}

// Initialize UI
setupUIListeners();
updateDriverDisplayFull();

// Set initial speed to 0.25x
setSimulationSpeed(0.25);

// Start animation
animate(0);

console.log('F1 Race Control - Digital Twin initialized');
console.log('Keyboard shortcuts: Space=Pause, C=Camera, ←→=Driver, +/-=Speed, H=Help');
