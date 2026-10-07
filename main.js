import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

// ==========================================================
// PORPHYRA — INTERACTIVE CLOTH v11.5
//
// SOFT ALPHA FRAY SIDES
//
// Changes:
// - removes spiky strand fringe geometry
// - removes fake box thickness look
// - adds subtle woven side selvage
// - adds soft alpha-based fuzzy frayed edge strips
// - keeps cinematic lighting, silk shading, fold occlusion
// ==========================================================


// ==========================================================
// RUG
// ==========================================================


const RUG_WIDTH = 9.4;
const RUG_HEIGHT = 5.3;

const SEGMENTS_X = 64;
const SEGMENTS_Y = 36;

const COLS = SEGMENTS_X + 1;
const ROWS = SEGMENTS_Y + 1;


// ==========================================================
// SIDE EDGE DETAIL SETTINGS
// ==========================================================

// Narrow woven side band
const SELVAGE_WIDTH = 0.070;
const SELVAGE_COLOR = new THREE.Color(0x8c7669);
const SELVAGE_Z_LIFT = 0.0014;

// Soft fuzzy fray strip
const FRAY_STRIP_WIDTH = 0.175;
const FRAY_ATTACH_OUTSET = 0.004;
const FRAY_OUTER_DROOP = 0.010;
const FRAY_Z_SINK = 0.002;

const FRAY_COLOR = new THREE.Color(0xe8dbc7);

// small irregular movement so the fray edge is not perfectly straight
const FRAY_WAVE_AMPLITUDE = 0.012;
const FRAY_WAVE_FREQ = 0.12;


// ==========================================================
// TEXTURE SCALE
// ==========================================================

const REPEAT_Y = 1.6;
const REPEAT_X = REPEAT_Y * (RUG_WIDTH / RUG_HEIGHT);


// ==========================================================
// SILK MATERIAL
// ==========================================================

const COLOR_MASK_STRENGTH = 0.42;
const MAX_METALNESS = 0.14;
const MIN_SILK_ROUGHNESS = 0.40;
const MAX_SILK_ROUGHNESS = 0.72;

const SILK_ANISOTROPY = 0.68;
const SILK_ANISOTROPY_ROTATION = 0.0;

const SILK_SHEEN = 0.82;
const SILK_SHEEN_ROUGHNESS = 0.48;

const ENVIRONMENT_INTENSITY = 0.22;


// ==========================================================
// DYNAMIC FOLD OCCLUSION
// ==========================================================

const VALLEY_DARKEN_STRENGTH = 0.28;
const CREST_LIGHTEN_STRENGTH = 0.02;
const CURVATURE_START = 0.010;
const CURVATURE_END = 0.060;


// ==========================================================
// CLOTH PHYSICS
// ==========================================================

const TENSION = 0.26;
const RESTORE_FORCE = 0.035;
const DAMPING = 0.92;

const POINTER_FOLLOW_SPEED = 38;
const SPEED_SMOOTHING = 8;
const DIRECTION_UPDATE_THRESHOLD = 0.28;
const DIRECTION_FOLLOW_SPEED = 10;

const SPEED_DEADZONE = 0.12;
const SPEED_FULL_EFFECT = 5.0;

const MIN_BULGE = 0.045;
const MIN_RADIUS = 0.55;
const MIN_POINTER_STIFFNESS = 0.070;

const MAX_BULGE = 0.58;
const MAX_RADIUS = 0.92;
const MAX_POINTER_STIFFNESS = 0.17;

const SLOW_POINTER_DAMPING = 0.55;
const FAST_POINTER_DAMPING = 0.16;

const MIN_FOLD_AMPLITUDE = 0.007;
const MAX_FOLD_AMPLITUDE = 0.070;

const MIN_FOLD_LENGTH = 0.80;
const MAX_FOLD_LENGTH = 1.60;

const MIN_FOLD_WIDTH = 0.42;
const MAX_FOLD_WIDTH = 0.82;

const FOLD_FREQUENCY_1 = 7.0;
const FOLD_FREQUENCY_2 = 4.2;

const MIN_DRAG_AMOUNT = 0.002;
const MAX_DRAG_AMOUNT = 0.060;


// ==========================================================
// FIXED PHYSICS TIMESTEP
// ==========================================================

const FIXED_TIMESTEP = 1 / 120;
const MAX_SUBSTEPS = 5;
let physicsAccumulator = 0;


// ==========================================================
// SCENE
// ==========================================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);


// ==========================================================
// CAMERA
// ==========================================================

const camera = new THREE.PerspectiveCamera(
    32,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);


// ==========================================================
// RENDERER
// ==========================================================

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance'
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.76;

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = true;

document.body.appendChild(renderer.domElement);


// ==========================================================
// ENVIRONMENT
// ==========================================================

const pmrem = new THREE.PMREMGenerator(renderer);
const room = new RoomEnvironment();
const environment = pmrem.fromScene(room, 0.04);

scene.environment = environment.texture;

room.dispose();
pmrem.dispose();


// ==========================================================
// CINEMATIC LIGHTING
// ==========================================================

RectAreaLightUniformsLib.init();

const warmAreaKey = new THREE.RectAreaLight(0xffd7ad, 5.2, 6.5, 2.4);
warmAreaKey.position.set(-3.8, 3.2, 4.2);
warmAreaKey.lookAt(0, 0, 0);
scene.add(warmAreaKey);

const shadowKey = new THREE.SpotLight(0xffdfbd, 95, 20, Math.PI / 3.25, 0.72, 2);
shadowKey.position.set(-4.8, 3.8, 5.0);
shadowKey.target.position.set(0, 0, 0);
scene.add(shadowKey.target);

shadowKey.castShadow = true;
shadowKey.shadow.mapSize.width = 2048;
shadowKey.shadow.mapSize.height = 2048;
shadowKey.shadow.camera.near = 0.5;
shadowKey.shadow.camera.far = 20;
shadowKey.shadow.focus = 1;
shadowKey.shadow.bias = -0.00015;
shadowKey.shadow.normalBias = 0.018;
shadowKey.shadow.radius = 3;
scene.add(shadowKey);

const coolFill = new THREE.RectAreaLight(0xbecbff, 0.58, 4.5, 3.2);
coolFill.position.set(4.0, -2.8, 3.3);
coolFill.lookAt(0, 0, 0);
scene.add(coolFill);

const rimLight = new THREE.RectAreaLight(0xffc98c, 0.72, 4.5, 0.7);
rimLight.position.set(1.5, 4.5, 2.6);
rimLight.lookAt(0, 0, 0);
scene.add(rimLight);


// ==========================================================
// TEXTURES
// ==========================================================

const textureLoader = new THREE.TextureLoader();

async function loadTexture(path) {
    return await textureLoader.loadAsync(path);
}

function configureTexture(texture) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(REPEAT_X, REPEAT_Y);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
}


// ==========================================================
// HTML IMAGE LOADING
// ==========================================================

function loadHtmlImage(path) {
    return new Promise((resolve, reject) => {
        const image = new Image();

        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Could not load ${path}`));

        image.src = path;
    });
}


// ==========================================================
// COLOR HELPERS
// ==========================================================

function srgbByteToLinear(byteValue) {
    const value = byteValue / 255;
    if (value <= 0.04045) return value / 12.92;
    return Math.pow((value + 0.055) / 1.055, 2.4);
}

function linearToSrgbByte(value) {
    value = Math.max(0, Math.min(1, value));

    const srgb = value <= 0.0031308
        ? value * 12.92
        : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;

    return Math.round(Math.max(0, Math.min(1, srgb)) * 255);
}

function linearRamp(value, blackPosition, whitePosition) {
    return Math.max(0, Math.min(1, (value - blackPosition) / (whitePosition - blackPosition)));
}


// ==========================================================
// BUILD SILK MAPS
// ==========================================================

async function createV10SilkMaps() {
    const [baseImage, maskImage] = await Promise.all([
        loadHtmlImage('./textures/rug_basecolor.png'),
        loadHtmlImage('./textures/rug_mask.png')
    ]);

    const width = baseImage.naturalWidth || baseImage.width;
    const imageHeight = baseImage.naturalHeight || baseImage.height;

    if (!width || !imageHeight) {
        throw new Error('Base-color image has invalid dimensions.');
    }

    const baseCanvas = document.createElement('canvas');
    baseCanvas.width = width;
    baseCanvas.height = imageHeight;

    const baseContext = baseCanvas.getContext('2d', { willReadFrequently: true });
    if (!baseContext) throw new Error('Could not create base canvas.');

    baseContext.drawImage(baseImage, 0, 0, width, imageHeight);
    const baseData = baseContext.getImageData(0, 0, width, imageHeight);

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = imageHeight;

    const maskContext = maskCanvas.getContext('2d', { willReadFrequently: true });
    if (!maskContext) throw new Error('Could not create mask canvas.');

    maskContext.drawImage(maskImage, 0, 0, width, imageHeight);
    const maskData = maskContext.getImageData(0, 0, width, imageHeight);

    const colorCanvas = document.createElement('canvas');
    const metalCanvas = document.createElement('canvas');
    const roughCanvas = document.createElement('canvas');

    for (const canvas of [colorCanvas, metalCanvas, roughCanvas]) {
        canvas.width = width;
        canvas.height = imageHeight;
    }

    const colorContext = colorCanvas.getContext('2d');
    const metalContext = metalCanvas.getContext('2d');
    const roughContext = roughCanvas.getContext('2d');

    if (!colorContext || !metalContext || !roughContext) {
        throw new Error('Could not create output canvases.');
    }

    const colorOutput = colorContext.createImageData(width, imageHeight);
    const metalOutput = metalContext.createImageData(width, imageHeight);
    const roughOutput = roughContext.createImageData(width, imageHeight);

    const basePixels = baseData.data;
    const maskPixels = maskData.data;
    const colorPixels = colorOutput.data;
    const metalPixels = metalOutput.data;
    const roughPixels = roughOutput.data;

    for (let i = 0; i < basePixels.length; i += 4) {
        const maskR = maskPixels[i] / 255;
        const maskG = maskPixels[i + 1] / 255;
        const maskB = maskPixels[i + 2] / 255;

        const greenModulation = 1.0 + (maskG - 1.0) * COLOR_MASK_STRENGTH;

        let r = srgbByteToLinear(basePixels[i]);
        let g = srgbByteToLinear(basePixels[i + 1]);
        let b = srgbByteToLinear(basePixels[i + 2]);

        r *= 1.3 * greenModulation;
        g *= 1.3 * greenModulation;
        b *= 1.3 * greenModulation;

        colorPixels[i] = linearToSrgbByte(r);
        colorPixels[i + 1] = linearToSrgbByte(g);
        colorPixels[i + 2] = linearToSrgbByte(b);
        colorPixels[i + 3] = 255;

        const blenderMetal = linearRamp(maskR, 0.340, 0.578);
        const metalness = blenderMetal * MAX_METALNESS;
        const metalByte = Math.round(metalness * 255);

        metalPixels[i] = metalByte;
        metalPixels[i + 1] = metalByte;
        metalPixels[i + 2] = metalByte;
        metalPixels[i + 3] = 255;

        const blenderRoughness = linearRamp(maskB, 0.051, 0.763);
        const roughness = MIN_SILK_ROUGHNESS + (MAX_SILK_ROUGHNESS - MIN_SILK_ROUGHNESS) * blenderRoughness;
        const roughByte = Math.round(roughness * 255);

        roughPixels[i] = roughByte;
        roughPixels[i + 1] = roughByte;
        roughPixels[i + 2] = roughByte;
        roughPixels[i + 3] = 255;
    }

    colorContext.putImageData(colorOutput, 0, 0);
    metalContext.putImageData(metalOutput, 0, 0);
    roughContext.putImageData(roughOutput, 0, 0);

    const colorTexture = new THREE.CanvasTexture(colorCanvas);
    colorTexture.colorSpace = THREE.SRGBColorSpace;

    const metalnessTexture = new THREE.CanvasTexture(metalCanvas);
    metalnessTexture.colorSpace = THREE.NoColorSpace;

    const roughnessTexture = new THREE.CanvasTexture(roughCanvas);
    roughnessTexture.colorSpace = THREE.NoColorSpace;

    configureTexture(colorTexture);
    configureTexture(metalnessTexture);
    configureTexture(roughnessTexture);

    return { colorTexture, metalnessTexture, roughnessTexture };
}


// ==========================================================
// CLOTH STATE
// ==========================================================

let rug;
let geometry;
let positions;
let vertexColors;

let height;
let velocity;
let acceleration;

let restX;
let restY;
let restZ;


// ==========================================================
// SIDE DETAIL STATE
// ==========================================================

let leftSelvageMesh;
let rightSelvageMesh;
let leftSelvagePositions;
let rightSelvagePositions;
let leftSelvageGeometry;
let rightSelvageGeometry;

let leftFrayMesh;
let rightFrayMesh;
let leftFrayPositions;
let rightFrayPositions;
let leftFrayGeometry;
let rightFrayGeometry;

let leftFrayAlphaTexture;
let rightFrayAlphaTexture;


// ==========================================================
// HELPERS
// ==========================================================

function indexOf(x, y) {
    return y * COLS + x;
}

function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function smoothstep01(t) {
    t = clamp01(t);
    return t * t * (3 - 2 * t);
}

function pseudoRandom(seed) {
    const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
    return x - Math.floor(x);
}

function samplePosition(i) {
    const base = i * 3;
    return {
        x: geometry.attributes.position.array[base + 0],
        y: geometry.attributes.position.array[base + 1],
        z: geometry.attributes.position.array[base + 2]
    };
}


// ==========================================================
// RESTING CLOTH SHAPE
// ==========================================================

function restingHeight(x, y) {
    const wave1 = Math.sin(x * 1.15 + y * 0.40) * 0.025;
    const wave2 = Math.sin(x * 2.5 - y * 1.25) * 0.012;
    const wave3 = Math.sin(y * 3.4 + x * 0.7) * 0.006;
    return wave1 + wave2 + wave3;
}


// ==========================================================
// INITIALIZE CLOTH
// ==========================================================

function initializeClothPhysics() {
    positions = geometry.attributes.position;
    positions.setUsage(THREE.DynamicDrawUsage);

    const count = positions.count;

    height = new Float32Array(count);
    velocity = new Float32Array(count);
    acceleration = new Float32Array(count);

    restX = new Float32Array(count);
    restY = new Float32Array(count);
    restZ = new Float32Array(count);

    for (let i = 0; i < count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = restingHeight(x, y);

        restX[i] = x;
        restY[i] = y;
        restZ[i] = z;

        positions.setZ(i, z);
    }

    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    updateDynamicOcclusion();
}


// ==========================================================
// POINTER
// ==========================================================

const pointerNDC = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const interactionPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const intersection = new THREE.Vector3();

let pointerActive = false;

let targetPointerX = 0;
let targetPointerY = 0;

let smoothPointerX = 0;
let smoothPointerY = 0;

let previousSmoothPointerX = 0;
let previousSmoothPointerY = 0;

let smoothPointerSpeed = 0;

let motionDirX = 1;
let motionDirY = 0;

let hasSmoothPointer = false;
let interactionPresence = 0;
let visualSpeed01 = 0;


// ==========================================================
// POINTER MOVE
// ==========================================================

function onPointerMove(event) {
    const rect = renderer.domElement.getBoundingClientRect();

    pointerNDC.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointerNDC.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointerNDC, camera);
    const hit = raycaster.ray.intersectPlane(interactionPlane, intersection);

    if (!hit) {
        pointerActive = false;
        return;
    }

    const inside =
        Math.abs(intersection.x) <= RUG_WIDTH / 2 &&
        Math.abs(intersection.y) <= RUG_HEIGHT / 2;

    if (!inside) {
        pointerActive = false;
        return;
    }

    targetPointerX = intersection.x;
    targetPointerY = intersection.y;

    if (!hasSmoothPointer) {
        smoothPointerX = targetPointerX;
        smoothPointerY = targetPointerY;
        previousSmoothPointerX = smoothPointerX;
        previousSmoothPointerY = smoothPointerY;
        hasSmoothPointer = true;
    }

    pointerActive = true;
}

function onPointerLeave() {
    pointerActive = false;
    hasSmoothPointer = false;
    smoothPointerSpeed = 0;
}

renderer.domElement.addEventListener('pointermove', onPointerMove);
renderer.domElement.addEventListener('pointerleave', onPointerLeave);


// ==========================================================
// SMOOTH POINTER
// ==========================================================

function updateSmoothPointer(dt) {
    const presenceTarget = pointerActive ? 1 : 0;
    const presenceFollow = 1 - Math.exp(-10 * dt);

    interactionPresence += (presenceTarget - interactionPresence) * presenceFollow;

    if (!pointerActive) {
        smoothPointerSpeed *= Math.exp(-10 * dt);
        visualSpeed01 *= Math.exp(-7 * dt);
        return;
    }

    const follow = 1 - Math.exp(-POINTER_FOLLOW_SPEED * dt);

    smoothPointerX += (targetPointerX - smoothPointerX) * follow;
    smoothPointerY += (targetPointerY - smoothPointerY) * follow;

    const dx = smoothPointerX - previousSmoothPointerX;
    const dy = smoothPointerY - previousSmoothPointerY;

    const instantaneousVX = dx / Math.max(dt, 0.0001);
    const instantaneousVY = dy / Math.max(dt, 0.0001);

    const instantaneousSpeed = Math.sqrt(
        instantaneousVX * instantaneousVX +
        instantaneousVY * instantaneousVY
    );

    previousSmoothPointerX = smoothPointerX;
    previousSmoothPointerY = smoothPointerY;

    const speedFollow = 1 - Math.exp(-SPEED_SMOOTHING * dt);
    smoothPointerSpeed += (instantaneousSpeed - smoothPointerSpeed) * speedFollow;

    if (instantaneousSpeed > DIRECTION_UPDATE_THRESHOLD) {
        const targetDirX = instantaneousVX / instantaneousSpeed;
        const targetDirY = instantaneousVY / instantaneousSpeed;

        const directionFollow = 1 - Math.exp(-DIRECTION_FOLLOW_SPEED * dt);

        motionDirX += (targetDirX - motionDirX) * directionFollow;
        motionDirY += (targetDirY - motionDirY) * directionFollow;

        const directionLength = Math.sqrt(motionDirX * motionDirX + motionDirY * motionDirY);

        if (directionLength > 0.0001) {
            motionDirX /= directionLength;
            motionDirY /= directionLength;
        }
    }
}


// ==========================================================
// POINTER EFFECT
// ==========================================================

function getPointerEffect() {
    const normalizedSpeed =
        (smoothPointerSpeed - SPEED_DEADZONE) /
        (SPEED_FULL_EFFECT - SPEED_DEADZONE);

    let speed01 = smoothstep01(normalizedSpeed);
    speed01 = Math.pow(speed01, 1.35);

    visualSpeed01 = speed01;

    return {
        speed01,
        bulge: lerp(MIN_BULGE, MAX_BULGE, speed01),
        radius: lerp(MIN_RADIUS, MAX_RADIUS, speed01),
        stiffness: lerp(MIN_POINTER_STIFFNESS, MAX_POINTER_STIFFNESS, speed01),
        localDamping: lerp(SLOW_POINTER_DAMPING, FAST_POINTER_DAMPING, speed01)
    };
}


// ==========================================================
// CLOTH SIMULATION
// ==========================================================

function simulateCloth(dt) {
    updateSmoothPointer(dt);
    acceleration.fill(0);

    const step = dt * 60;

    for (let y = 1; y < ROWS - 1; y++) {
        for (let x = 1; x < COLS - 1; x++) {
            const i = indexOf(x, y);
            const left = indexOf(x - 1, y);
            const right = indexOf(x + 1, y);
            const down = indexOf(x, y - 1);
            const up = indexOf(x, y + 1);

            const neighborAverage = (height[left] + height[right] + height[down] + height[up]) * 0.25;

            acceleration[i] += (neighborAverage - height[i]) * TENSION;
            acceleration[i] += -height[i] * RESTORE_FORCE;
        }
    }

    if (pointerActive && hasSmoothPointer) {
        const effect = getPointerEffect();
        const radiusSquared = effect.radius * effect.radius;

        for (let y = 1; y < ROWS - 1; y++) {
            for (let x = 1; x < COLS - 1; x++) {
                const i = indexOf(x, y);

                const dx = restX[i] - smoothPointerX;
                const dy = restY[i] - smoothPointerY;
                const distanceSquared = dx * dx + dy * dy;

                if (distanceSquared < radiusSquared) {
                    const distance = Math.sqrt(distanceSquared);

                    let influence = 1 - distance / effect.radius;
                    influence = smoothstep01(influence);

                    const targetHeight = effect.bulge * influence;
                    const error = targetHeight - height[i];

                    acceleration[i] += error * effect.stiffness;
                    acceleration[i] -= velocity[i] * effect.localDamping * influence;
                }
            }
        }
    }

    const frameDamping = Math.pow(DAMPING, step);

    for (let y = 1; y < ROWS - 1; y++) {
        for (let x = 1; x < COLS - 1; x++) {
            const i = indexOf(x, y);

            velocity[i] += acceleration[i] * step;
            velocity[i] *= frameDamping;
            height[i] += velocity[i] * step;
        }
    }

    // pin perimeter
    for (let x = 0; x < COLS; x++) {
        const bottom = indexOf(x, 0);
        const top = indexOf(x, ROWS - 1);

        height[bottom] = 0;
        velocity[bottom] = 0;

        height[top] = 0;
        velocity[top] = 0;
    }

    for (let y = 0; y < ROWS; y++) {
        const left = indexOf(0, y);
        const right = indexOf(COLS - 1, y);

        height[left] = 0;
        velocity[left] = 0;

        height[right] = 0;
        velocity[right] = 0;
    }
}


// ==========================================================
// DYNAMIC FOLD OCCLUSION
// ==========================================================

function updateDynamicOcclusion() {
    if (!positions || !vertexColors || !restZ) return;

    const posArray = positions.array;
    const colorArray = vertexColors.array;

    const halfWidth = RUG_WIDTH / 2;
    const halfHeight = RUG_HEIGHT / 2;

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const i = indexOf(x, y);
            const baseIndex = i * 3;

            let brightness = 1.0;

            if (x > 0 && x < COLS - 1 && y > 0 && y < ROWS - 1) {
                const left = indexOf(x - 1, y);
                const right = indexOf(x + 1, y);
                const down = indexOf(x, y - 1);
                const up = indexOf(x, y + 1);

                const centerDisp = posArray[baseIndex + 2] - restZ[i];
                const leftDisp = posArray[left * 3 + 2] - restZ[left];
                const rightDisp = posArray[right * 3 + 2] - restZ[right];
                const downDisp = posArray[down * 3 + 2] - restZ[down];
                const upDisp = posArray[up * 3 + 2] - restZ[up];

                const neighborAverage = (leftDisp + rightDisp + downDisp + upDisp) * 0.25;
                const curvature = neighborAverage - centerDisp;

                const valley01 = smoothstep01((curvature - CURVATURE_START) / (CURVATURE_END - CURVATURE_START));
                const crest01 = smoothstep01((-curvature - CURVATURE_START) / (CURVATURE_END - CURVATURE_START));

                const rawBrightness =
                    1.0 -
                    valley01 * VALLEY_DARKEN_STRENGTH +
                    crest01 * CREST_LIGHTEN_STRENGTH;

                const edgeDistanceX = halfWidth - Math.abs(restX[i]);
                const edgeDistanceY = halfHeight - Math.abs(restY[i]);

                const edgeFade = smoothstep01(
                    Math.min(edgeDistanceX / 0.38, edgeDistanceY / 0.38)
                );

                brightness = lerp(1.0, rawBrightness, edgeFade);
            }

            brightness = THREE.MathUtils.clamp(brightness, 0.58, 1.03);

            colorArray[baseIndex] = brightness;
            colorArray[baseIndex + 1] = brightness;
            colorArray[baseIndex + 2] = brightness;
        }
    }

    vertexColors.needsUpdate = true;
}


// ==========================================================
// FRAY TEXTURE GENERATION
// ==========================================================

function buildFrayAlphaCanvas() {
    const width = 256;
    const height = 1024;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    // Texture layout:
    // right side = attached to rug
    // left side = broken fuzzy fibers

    for (let y = 0; y < height; y++) {
        const ny = y / (height - 1);

        const wave =
            Math.sin(ny * 20.0) * 6 +
            Math.sin(ny * 57.0 + 0.8) * 2.5;

        const noiseA = pseudoRandom(1000 + y * 0.173);
        const noiseB = pseudoRandom(2000 + y * 0.317);

        const solidStart = Math.floor(width * 0.68 + wave + (noiseA - 0.5) * 12);
        const fringeReach = Math.floor(width * (0.18 + noiseB * 0.18));
        const fringeStart = Math.max(0, solidStart - fringeReach);

        for (let x = 0; x < width; x++) {
            let alpha = 0;

            if (x >= solidStart) {
                const t = (x - solidStart) / Math.max(1, width - solidStart);
                alpha = lerp(210, 255, t);
            } else if (x >= fringeStart) {
                const t = (x - fringeStart) / Math.max(1, solidStart - fringeStart);

                const density =
                    0.18 +
                    t * 0.82;

                const grain = pseudoRandom(5000 + x * 0.91 + y * 0.13);
                const keep = grain < density;

                if (keep) {
                    const fade = Math.pow(t, 0.8);
                    alpha = 255 * fade * lerp(0.45, 1.0, pseudoRandom(8000 + x * 0.37 + y * 0.21));
                }
            }

            const i = (y * width + x) * 4;
            data[i + 0] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
            data[i + 3] = Math.round(alpha);
        }
    }

    ctx.putImageData(imageData, 0, 0);

    // Add long thread-like wisps
    ctx.strokeStyle = 'rgba(255,255,255,0.50)';
    ctx.lineCap = 'round';

    for (let i = 0; i < 240; i++) {
        const y = pseudoRandom(9000 + i) * height;
        const length = lerp(10, 38, pseudoRandom(9100 + i));
        const thickness = lerp(0.4, 1.3, pseudoRandom(9200 + i));

        const startX = lerp(width * 0.50, width * 0.76, pseudoRandom(9300 + i));
        const endX = Math.max(0, startX - length);

        const wiggle = (pseudoRandom(9400 + i) - 0.5) * 12;

        ctx.lineWidth = thickness;
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.quadraticCurveTo(
            lerp(endX, startX, 0.55),
            y + wiggle,
            endX,
            y + wiggle * 0.65
        );
        ctx.stroke();
    }

    // Small detached linty bits
    ctx.fillStyle = 'rgba(255,255,255,0.32)';
    for (let i = 0; i < 260; i++) {
        const x = pseudoRandom(10000 + i) * (width * 0.62);
        const y = pseudoRandom(11000 + i) * height;
        const r = lerp(0.4, 1.6, pseudoRandom(12000 + i));
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    return canvas;
}

function mirrorCanvas(sourceCanvas) {
    const canvas = document.createElement('canvas');
    canvas.width = sourceCanvas.width;
    canvas.height = sourceCanvas.height;

    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(sourceCanvas, 0, 0);

    return canvas;
}

function makeFrayAlphaTextures() {
    const leftCanvas = buildFrayAlphaCanvas();
    const rightCanvas = mirrorCanvas(leftCanvas);

    leftFrayAlphaTexture = new THREE.CanvasTexture(leftCanvas);
    rightFrayAlphaTexture = new THREE.CanvasTexture(rightCanvas);

    for (const tex of [leftFrayAlphaTexture, rightFrayAlphaTexture]) {
        tex.colorSpace = THREE.NoColorSpace;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = true;
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        tex.needsUpdate = true;
    }
}


// ==========================================================
// STRIP GEOMETRY HELPERS
// ==========================================================

function createStripGeometry(rowCount) {
    const vertexCount = rowCount * 2;
    const positionArray = new Float32Array(vertexCount * 3);
    const uvArray = new Float32Array(vertexCount * 2);
    const indices = [];

    for (let r = 0; r < rowCount; r++) {
        const t = rowCount <= 1 ? 0 : r / (rowCount - 1);
        const v0 = r * 2;
        const v1 = v0 + 1;

        // inner vertex
        uvArray[v0 * 2 + 0] = 1;
        uvArray[v0 * 2 + 1] = t;

        // outer vertex
        uvArray[v1 * 2 + 0] = 0;
        uvArray[v1 * 2 + 1] = t;
    }

    for (let r = 0; r < rowCount - 1; r++) {
        const a = r * 2;
        const b = a + 1;
        const c = a + 2;
        const d = a + 3;

        indices.push(a, b, c);
        indices.push(c, b, d);
    }

    const geom = new THREE.BufferGeometry();
    const pos = new THREE.BufferAttribute(positionArray, 3);
    pos.setUsage(THREE.DynamicDrawUsage);

    geom.setAttribute('position', pos);
    geom.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));
    geom.setIndex(indices);

    return { geometry: geom, positions: pos };
}


// ==========================================================
// CREATE SIDE EDGE DETAIL MESHES
// ==========================================================

function createSideEdgeDetails() {
    makeFrayAlphaTextures();

    // Selvage strips
    {
        const leftData = createStripGeometry(ROWS);
        leftSelvageGeometry = leftData.geometry;
        leftSelvagePositions = leftData.positions;

        const rightData = createStripGeometry(ROWS);
        rightSelvageGeometry = rightData.geometry;
        rightSelvagePositions = rightData.positions;

        const selvageMaterial = new THREE.MeshPhysicalMaterial({
            color: SELVAGE_COLOR,
            roughness: 0.90,
            metalness: 0.0,
            sheen: 0.12,
            sheenColor: new THREE.Color(0xa18878),
            sheenRoughness: 0.88,
            specularIntensity: 0.10,
            envMapIntensity: 0.05,
            side: THREE.DoubleSide
        });

        leftSelvageMesh = new THREE.Mesh(leftSelvageGeometry, selvageMaterial);
        rightSelvageMesh = new THREE.Mesh(rightSelvageGeometry, selvageMaterial.clone());

        leftSelvageMesh.receiveShadow = true;
        rightSelvageMesh.receiveShadow = true;

        leftSelvageMesh.castShadow = false;
        rightSelvageMesh.castShadow = false;

        leftSelvageMesh.frustumCulled = false;
        rightSelvageMesh.frustumCulled = false;

        leftSelvageMesh.renderOrder = 1;
        rightSelvageMesh.renderOrder = 1;

        scene.add(leftSelvageMesh);
        scene.add(rightSelvageMesh);
    }

    // Soft alpha fray strips
    {
        const leftData = createStripGeometry(ROWS);
        leftFrayGeometry = leftData.geometry;
        leftFrayPositions = leftData.positions;

        const rightData = createStripGeometry(ROWS);
        rightFrayGeometry = rightData.geometry;
        rightFrayPositions = rightData.positions;

        const leftFrayMaterial = new THREE.MeshPhysicalMaterial({
            color: FRAY_COLOR,
            alphaMap: leftFrayAlphaTexture,
            transparent: true,
            opacity: 1.0,
            alphaTest: 0.06,
            depthWrite: false,
            roughness: 0.98,
            metalness: 0.0,
            sheen: 0.10,
            sheenColor: new THREE.Color(0xf3ebe0),
            sheenRoughness: 0.96,
            specularIntensity: 0.05,
            envMapIntensity: 0.02,
            side: THREE.DoubleSide
        });

        const rightFrayMaterial = new THREE.MeshPhysicalMaterial({
            color: FRAY_COLOR,
            alphaMap: rightFrayAlphaTexture,
            transparent: true,
            opacity: 1.0,
            alphaTest: 0.06,
            depthWrite: false,
            roughness: 0.98,
            metalness: 0.0,
            sheen: 0.10,
            sheenColor: new THREE.Color(0xf3ebe0),
            sheenRoughness: 0.96,
            specularIntensity: 0.05,
            envMapIntensity: 0.02,
            side: THREE.DoubleSide
        });

        leftFrayMesh = new THREE.Mesh(leftFrayGeometry, leftFrayMaterial);
        rightFrayMesh = new THREE.Mesh(rightFrayGeometry, rightFrayMaterial);

        leftFrayMesh.castShadow = false;
        rightFrayMesh.castShadow = false;

        leftFrayMesh.receiveShadow = true;
        rightFrayMesh.receiveShadow = true;

        leftFrayMesh.frustumCulled = false;
        rightFrayMesh.frustumCulled = false;

        leftFrayMesh.renderOrder = 2;
        rightFrayMesh.renderOrder = 2;

        scene.add(leftFrayMesh);
        scene.add(rightFrayMesh);
    }

    updateSideEdgeDetails();
}


// ==========================================================
// UPDATE SIDE EDGE DETAIL GEOMETRY
// ==========================================================

function updateSideEdgeDetails() {
    if (
        !leftSelvageGeometry ||
        !rightSelvageGeometry ||
        !leftFrayGeometry ||
        !rightFrayGeometry
    ) {
        return;
    }

    const topArray = geometry.attributes.position.array;

    // ------------------------------------------------------
    // LEFT SIDE
    // ------------------------------------------------------
    for (let y = 0; y < ROWS; y++) {
        const edgeIndex = indexOf(0, y);
        const innerIndex = indexOf(1, y);

        const edgeBase = edgeIndex * 3;
        const innerBase = innerIndex * 3;

        const edgeX = topArray[edgeBase + 0];
        const edgeY = topArray[edgeBase + 1];
        const edgeZ = topArray[edgeBase + 2];

        const innerX = topArray[innerBase + 0];
        const innerY = topArray[innerBase + 1];
        const innerZ = topArray[innerBase + 2];

        let inwardX = innerX - edgeX;
        let inwardY = innerY - edgeY;
        let inwardLen = Math.sqrt(inwardX * inwardX + inwardY * inwardY);

        if (inwardLen < 0.0001) inwardLen = 1.0;
        inwardX /= inwardLen;
        inwardY /= inwardLen;

        const outwardX = -inwardX;
        const outwardY = -inwardY;

        const wave = Math.sin(y * FRAY_WAVE_FREQ + 0.8) * FRAY_WAVE_AMPLITUDE;

        // Selvage (subtle woven side band)
        {
            const dst = y * 6;

            const outerX = edgeX + inwardX * 0.004;
            const outerY = edgeY + inwardY * 0.004;
            const outerZ = edgeZ + SELVAGE_Z_LIFT;

            const innerBandX = edgeX + inwardX * SELVAGE_WIDTH;
            const innerBandY = edgeY + inwardY * SELVAGE_WIDTH;
            const innerBandZ = lerp(edgeZ, innerZ, 0.85) + SELVAGE_Z_LIFT;

            leftSelvagePositions.array[dst + 0] = outerX;
            leftSelvagePositions.array[dst + 1] = outerY;
            leftSelvagePositions.array[dst + 2] = outerZ;

            leftSelvagePositions.array[dst + 3] = innerBandX;
            leftSelvagePositions.array[dst + 4] = innerBandY;
            leftSelvagePositions.array[dst + 5] = innerBandZ;
        }

        // Fray strip
        {
            const dst = y * 6;

            const innerStripX = edgeX + outwardX * FRAY_ATTACH_OUTSET;
            const innerStripY = edgeY + outwardY * FRAY_ATTACH_OUTSET;
            const innerStripZ = edgeZ - FRAY_Z_SINK;

            const outerStripX =
                edgeX +
                outwardX * (FRAY_STRIP_WIDTH + wave * 0.45);

            const outerStripY =
                edgeY +
                outwardY * (FRAY_STRIP_WIDTH + wave * 0.45) +
                wave * 0.12;

            const outerStripZ =
                edgeZ -
                FRAY_Z_SINK -
                FRAY_OUTER_DROOP;

            leftFrayPositions.array[dst + 0] = innerStripX;
            leftFrayPositions.array[dst + 1] = innerStripY;
            leftFrayPositions.array[dst + 2] = innerStripZ;

            leftFrayPositions.array[dst + 3] = outerStripX;
            leftFrayPositions.array[dst + 4] = outerStripY;
            leftFrayPositions.array[dst + 5] = outerStripZ;
        }
    }

    // ------------------------------------------------------
    // RIGHT SIDE
    // ------------------------------------------------------
    for (let y = 0; y < ROWS; y++) {
        const edgeIndex = indexOf(COLS - 1, y);
        const innerIndex = indexOf(COLS - 2, y);

        const edgeBase = edgeIndex * 3;
        const innerBase = innerIndex * 3;

        const edgeX = topArray[edgeBase + 0];
        const edgeY = topArray[edgeBase + 1];
        const edgeZ = topArray[edgeBase + 2];

        const innerX = topArray[innerBase + 0];
        const innerY = topArray[innerBase + 1];
        const innerZ = topArray[innerBase + 2];

        let inwardX = innerX - edgeX;
        let inwardY = innerY - edgeY;
        let inwardLen = Math.sqrt(inwardX * inwardX + inwardY * inwardY);

        if (inwardLen < 0.0001) inwardLen = 1.0;
        inwardX /= inwardLen;
        inwardY /= inwardLen;

        const outwardX = -inwardX;
        const outwardY = -inwardY;

        const wave = Math.sin(y * FRAY_WAVE_FREQ + 1.7) * FRAY_WAVE_AMPLITUDE;

        // Selvage
        {
            const dst = y * 6;

            const outerX = edgeX + inwardX * 0.004;
            const outerY = edgeY + inwardY * 0.004;
            const outerZ = edgeZ + SELVAGE_Z_LIFT;

            const innerBandX = edgeX + inwardX * SELVAGE_WIDTH;
            const innerBandY = edgeY + inwardY * SELVAGE_WIDTH;
            const innerBandZ = lerp(edgeZ, innerZ, 0.85) + SELVAGE_Z_LIFT;

            rightSelvagePositions.array[dst + 0] = outerX;
            rightSelvagePositions.array[dst + 1] = outerY;
            rightSelvagePositions.array[dst + 2] = outerZ;

            rightSelvagePositions.array[dst + 3] = innerBandX;
            rightSelvagePositions.array[dst + 4] = innerBandY;
            rightSelvagePositions.array[dst + 5] = innerBandZ;
        }

        // Fray strip
        {
            const dst = y * 6;

            const innerStripX = edgeX + outwardX * FRAY_ATTACH_OUTSET;
            const innerStripY = edgeY + outwardY * FRAY_ATTACH_OUTSET;
            const innerStripZ = edgeZ - FRAY_Z_SINK;

            const outerStripX =
                edgeX +
                outwardX * (FRAY_STRIP_WIDTH + wave * 0.45);

            const outerStripY =
                edgeY +
                outwardY * (FRAY_STRIP_WIDTH + wave * 0.45) +
                wave * 0.12;

            const outerStripZ =
                edgeZ -
                FRAY_Z_SINK -
                FRAY_OUTER_DROOP;

            rightFrayPositions.array[dst + 0] = innerStripX;
            rightFrayPositions.array[dst + 1] = innerStripY;
            rightFrayPositions.array[dst + 2] = innerStripZ;

            rightFrayPositions.array[dst + 3] = outerStripX;
            rightFrayPositions.array[dst + 4] = outerStripY;
            rightFrayPositions.array[dst + 5] = outerStripZ;
        }
    }

    leftSelvagePositions.needsUpdate = true;
    rightSelvagePositions.needsUpdate = true;
    leftFrayPositions.needsUpdate = true;
    rightFrayPositions.needsUpdate = true;

    leftSelvageGeometry.computeVertexNormals();
    rightSelvageGeometry.computeVertexNormals();
    leftFrayGeometry.computeVertexNormals();
    rightFrayGeometry.computeVertexNormals();
}


// ==========================================================
// UPDATE CLOTH GEOMETRY
// ==========================================================

function updateGeometry() {
    const speed01 = visualSpeed01;

    const foldAmplitude = lerp(MIN_FOLD_AMPLITUDE, MAX_FOLD_AMPLITUDE, speed01) * interactionPresence;
    const foldLength = lerp(MIN_FOLD_LENGTH, MAX_FOLD_LENGTH, speed01);
    const foldWidth = lerp(MIN_FOLD_WIDTH, MAX_FOLD_WIDTH, speed01);
    const dragAmount = lerp(MIN_DRAG_AMOUNT, MAX_DRAG_AMOUNT, speed01) * interactionPresence;

    const halfWidth = RUG_WIDTH / 2;
    const halfHeight = RUG_HEIGHT / 2;

    for (let i = 0; i < positions.count; i++) {
        const baseX = restX[i];
        const baseY = restY[i];

        let finalX = baseX;
        let finalY = baseY;
        let foldZ = 0;

        const edgeDistanceX = halfWidth - Math.abs(baseX);
        const edgeDistanceY = halfHeight - Math.abs(baseY);

        // folds fade before the exact border
        const edgeFade = smoothstep01(
            Math.min(edgeDistanceX / 0.45, edgeDistanceY / 0.45)
        );

        if (interactionPresence > 0.001) {
            const dx = baseX - smoothPointerX;
            const dy = baseY - smoothPointerY;

            const along = dx * motionDirX + dy * motionDirY;
            const across = -dx * motionDirY + dy * motionDirX;

            const directionalLength =
                along < 0
                    ? foldLength * 1.25
                    : foldLength * 0.78;

            const envelope = Math.exp(-(
                (along * along) / (2 * directionalLength * directionalLength) +
                (across * across) / (2 * foldWidth * foldWidth)
            ));

            const fold1 = Math.sin(across * FOLD_FREQUENCY_1 + along * 0.75);
            const fold2 = Math.sin(across * FOLD_FREQUENCY_2 - along * 1.35 + 0.85);

            const combinedFold = fold1 * 0.68 + fold2 * 0.32;

            foldZ = combinedFold * foldAmplitude * envelope * edgeFade;

            const dragEnvelope = envelope * edgeFade;

            finalX += motionDirX * dragAmount * dragEnvelope;
            finalY += motionDirY * dragAmount * dragEnvelope;
        }

        positions.setXYZ(i, finalX, finalY, restZ[i] + height[i] + foldZ);
    }

    positions.needsUpdate = true;

    geometry.computeVertexNormals();
    updateDynamicOcclusion();
    updateSideEdgeDetails();
}


// ==========================================================
// CREATE RUG
// ==========================================================

async function createRug() {
    const [silkMaps, normalMap] = await Promise.all([
        createV10SilkMaps(),
        loadTexture('./textures/rug_normal.png')
    ]);

    normalMap.colorSpace = THREE.NoColorSpace;
    configureTexture(normalMap);

    geometry = new THREE.PlaneGeometry(
        RUG_WIDTH,
        RUG_HEIGHT,
        SEGMENTS_X,
        SEGMENTS_Y
    );

    const colorArray = new Float32Array(
        geometry.attributes.position.count * 3
    );

    colorArray.fill(1.0);

    vertexColors = new THREE.BufferAttribute(colorArray, 3);
    vertexColors.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('color', vertexColors);

    const material = new THREE.MeshPhysicalMaterial({
        map: silkMaps.colorTexture,

        metalness: 1.0,
        metalnessMap: silkMaps.metalnessTexture,

        roughness: 1.0,
        roughnessMap: silkMaps.roughnessTexture,

        normalMap: normalMap,
        normalScale: new THREE.Vector2(0.8, -0.8),

        anisotropy: SILK_ANISOTROPY,
        anisotropyRotation: SILK_ANISOTROPY_ROTATION,

        sheen: SILK_SHEEN,
        sheenColor: new THREE.Color(0xd1a987),
        sheenRoughness: SILK_SHEEN_ROUGHNESS,

        specularIntensity: 0.58,
        specularColor: new THREE.Color(0xffead2),

        clearcoat: 0,
        envMapIntensity: ENVIRONMENT_INTENSITY,

        vertexColors: true,
        side: THREE.DoubleSide
    });

    material.shadowSide = THREE.DoubleSide;

    rug = new THREE.Mesh(geometry, material);
    rug.castShadow = true;
    rug.receiveShadow = true;
    rug.frustumCulled = false;
    rug.renderOrder = 0;

    scene.add(rug);

    initializeClothPhysics();
    createSideEdgeDetails();

    window.rug = rug;
    window.rugMaterial = material;
    window.porphyraMaps = silkMaps;
    window.porphyraSideDetails = {
        leftSelvageMesh,
        rightSelvageMesh,
        leftFrayMesh,
        rightFrayMesh
    };
    window.porphyraLights = {
        warmAreaKey,
        shadowKey,
        coolFill,
        rimLight
    };

    console.log('PORPHYRA Cloth v11.5 — SOFT ALPHA FRAY SIDES LOADED');
}


// ==========================================================
// CAMERA FIT
// ==========================================================

function fitCamera() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    const fov = THREE.MathUtils.degToRad(camera.fov);

    const distanceForHeight =
        (RUG_HEIGHT / 2) / Math.tan(fov / 2);

    const distanceForWidth =
        (RUG_WIDTH / 2) /
        (Math.tan(fov / 2) * camera.aspect);

    const distance = Math.max(distanceForHeight, distanceForWidth);

    camera.position.set(0, 0, distance * 1.12);
    camera.lookAt(0, 0, 0);
}


// ==========================================================
// RESIZE
// ==========================================================

window.addEventListener('resize', () => {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    fitCamera();
});


// ==========================================================
// START
// ==========================================================

const loading = document.getElementById('loading');
const errorBox = document.getElementById('error');

try {
    fitCamera();
    await createRug();

    loading.classList.add('hidden');

    console.log('PORPHYRA Cloth v11.5 loaded');
}
catch (error) {
    console.error(error);

    loading.classList.add('hidden');
    errorBox.style.display = 'block';
    errorBox.textContent = error.message;
}


// ==========================================================
// ANIMATION
// ==========================================================

const clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
    const frameTime = Math.min(clock.getDelta(), 0.05);
    physicsAccumulator += frameTime;

    let substeps = 0;

    while (
        physicsAccumulator >= FIXED_TIMESTEP &&
        substeps < MAX_SUBSTEPS
    ) {
        simulateCloth(FIXED_TIMESTEP);
        physicsAccumulator -= FIXED_TIMESTEP;
        substeps++;
    }

    if (substeps === MAX_SUBSTEPS) {
        physicsAccumulator = 0;
    }

    if (rug) {
        updateGeometry();
    }

    renderer.render(scene, camera);
});
