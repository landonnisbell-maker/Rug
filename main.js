import * as THREE from 'three';

import {
    RoomEnvironment
} from 'three/addons/environments/RoomEnvironment.js';


// ==========================================================
// PORPHYRA
// INTERACTIVE CLOTH — VERSION 8.5
//
// EXACT BLENDKIT COLORRAMP RECONSTRUCTION
//
// Preserves:
// - Smooth cloth physics
// - Ripple simulation
// - Directional folds
// - Lateral fabric bunching
// - Responsive mouse interaction
//
// Exact Blender material:
//
// GREEN mask
// -> multiplied into Base Color
//
// RED mask
// -> Metallic ColorRamp
//    black @ 0.340
//    white @ 0.578
//
// BLUE mask
// -> Roughness ColorRamp
//    black @ 0.051
//    white @ 0.763
//
// Normal:
// Strength = 0.800
// Y inverted
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
// TEXTURE SCALE
// ==========================================================

const REPEAT_Y = 1.6;

const REPEAT_X =
    REPEAT_Y *
    (RUG_WIDTH / RUG_HEIGHT);


// ==========================================================
// MAIN CLOTH PHYSICS
// ==========================================================

const TENSION = 0.26;

const RESTORE_FORCE = 0.035;

const DAMPING = 0.92;


// ==========================================================
// POINTER TRACKING
// ==========================================================

const POINTER_FOLLOW_SPEED = 38;

const SPEED_SMOOTHING = 8;

const DIRECTION_UPDATE_THRESHOLD = 0.28;

const DIRECTION_FOLLOW_SPEED = 10;


// ==========================================================
// SPEED RESPONSE
// ==========================================================

const SPEED_DEADZONE = 0.12;

const SPEED_FULL_EFFECT = 5.0;


// ==========================================================
// SLOW-MOUSE RESPONSE
// ==========================================================

const MIN_BULGE = 0.045;

const MIN_RADIUS = 0.55;

const MIN_POINTER_STIFFNESS = 0.070;


// ==========================================================
// FAST-MOUSE RESPONSE
// ==========================================================

const MAX_BULGE = 0.58;

const MAX_RADIUS = 0.92;

const MAX_POINTER_STIFFNESS = 0.17;


// ==========================================================
// LOCAL DAMPING
// ==========================================================

const SLOW_POINTER_DAMPING = 0.55;

const FAST_POINTER_DAMPING = 0.16;


// ==========================================================
// CLOTH FOLDS
// ==========================================================

const MIN_FOLD_AMPLITUDE = 0.007;

const MAX_FOLD_AMPLITUDE = 0.070;

const MIN_FOLD_LENGTH = 0.80;

const MAX_FOLD_LENGTH = 1.60;

const MIN_FOLD_WIDTH = 0.42;

const MAX_FOLD_WIDTH = 0.82;

const FOLD_FREQUENCY_1 = 7.0;

const FOLD_FREQUENCY_2 = 4.2;


// ==========================================================
// LATERAL FABRIC DRAG
// ==========================================================

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

const scene =
    new THREE.Scene();

scene.background =
    new THREE.Color(0x000000);


// ==========================================================
// CAMERA
// ==========================================================

const camera =
    new THREE.PerspectiveCamera(
        32,
        window.innerWidth /
        window.innerHeight,
        0.1,
        100
    );


// ==========================================================
// RENDERER
// ==========================================================

const renderer =
    new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance'
    });

renderer.setPixelRatio(
    Math.min(
        window.devicePixelRatio,
        2
    )
);

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.outputColorSpace =
    THREE.SRGBColorSpace;

renderer.toneMapping =
    THREE.ACESFilmicToneMapping;

renderer.toneMappingExposure =
    0.76;

document.body.appendChild(
    renderer.domElement
);


// ==========================================================
// ENVIRONMENT
// ==========================================================

const pmrem =
    new THREE.PMREMGenerator(
        renderer
    );

const room =
    new RoomEnvironment();

const environment =
    pmrem.fromScene(
        room,
        0.04
    );

scene.environment =
    environment.texture;

room.dispose();

pmrem.dispose();


// ==========================================================
// LIGHTING
// ==========================================================

const keyLight =
    new THREE.DirectionalLight(
        0xffdfbd,
        3.0
    );

keyLight.position.set(
    -5,
    4,
    6
);

scene.add(
    keyLight
);


const fillLight =
    new THREE.DirectionalLight(
        0xcbd8ff,
        0.5
    );

fillLight.position.set(
    5,
    -3,
    4
);

scene.add(
    fillLight
);


// ==========================================================
// THREE.JS TEXTURE LOADING
// ==========================================================

const textureLoader =
    new THREE.TextureLoader();


async function loadTexture(path) {

    return await textureLoader.loadAsync(
        path
    );

}


function configureTexture(texture) {

    texture.wrapS =
        THREE.RepeatWrapping;

    texture.wrapT =
        THREE.RepeatWrapping;

    texture.repeat.set(
        REPEAT_X,
        REPEAT_Y
    );

    texture.anisotropy =
        renderer.capabilities
            .getMaxAnisotropy();

    texture.minFilter =
        THREE.LinearMipmapLinearFilter;

    texture.magFilter =
        THREE.LinearFilter;

    texture.generateMipmaps =
        true;

    texture.needsUpdate =
        true;

}


// ==========================================================
// CLOTH DATA
// ==========================================================

let rug;

let geometry;

let positions;

let height;

let velocity;

let acceleration;

let restX;

let restY;

let restZ;


// ==========================================================
// HELPERS
// ==========================================================

function indexOf(x, y) {

    return (
        y * COLS +
        x
    );

}


function clamp01(value) {

    return Math.max(
        0,
        Math.min(
            1,
            value
        )
    );

}


function lerp(a, b, t) {

    return (
        a +
        (b - a) * t
    );

}


function smoothstep01(t) {

    t =
        clamp01(t);

    return (
        t *
        t *
        (
            3 -
            2 * t
        )
    );

}


// ==========================================================
// BLENDER LINEAR COLORRAMP
// ==========================================================
//
// Blender ColorRamp interpolation is set to LINEAR.
//
// blackPosition:
// input where result becomes 0
//
// whitePosition:
// input where result becomes 1
//
// ==========================================================

function linearRamp(
    value,
    blackPosition,
    whitePosition
) {

    return clamp01(
        (
            value -
            blackPosition
        )
        /
        (
            whitePosition -
            blackPosition
        )
    );

}


// ==========================================================
// SAFE HTML IMAGE LOADING
// ==========================================================

function loadHtmlImage(path) {

    return new Promise(
        (resolve, reject) => {

            const image =
                new Image();


            image.onload =
                () => {

                    resolve(
                        image
                    );

                };


            image.onerror =
                () => {

                    reject(
                        new Error(
                            `Could not load ${path}`
                        )
                    );

                };


            image.src =
                path;

        }
    );

}


// ==========================================================
// COLOR-SPACE HELPERS
// ==========================================================

function srgbByteToLinear(byteValue) {

    const value =
        byteValue / 255;


    if (
        value <= 0.04045
    ) {

        return (
            value / 12.92
        );

    }


    return Math.pow(
        (
            value + 0.055
        )
        /
        1.055,
        2.4
    );

}


function linearToSrgbByte(value) {

    value =
        clamp01(value);


    let srgb;


    if (
        value <= 0.0031308
    ) {

        srgb =
            value * 12.92;

    }
    else {

        srgb =
            1.055 *
            Math.pow(
                value,
                1 / 2.4
            )
            -
            0.055;

    }


    return Math.round(
        clamp01(srgb) *
        255
    );

}


// ==========================================================
// BUILD BLENDKIT MATERIAL MAPS — V8.5
// ==========================================================
//
// BASE COLOR:
//
// Base image
// -> linear color
// -> Value × 1.300
// -> multiply GREEN mask
//
//
// METALLIC:
//
// RED channel
//
// 0.340 = black
// 0.578 = white
//
//
// ROUGHNESS:
//
// BLUE channel
//
// 0.051 = black
// 0.763 = white
//
// ==========================================================

async function createBlendKitMapsFromFiles() {

    const [
        baseImage,
        maskImage
    ] =
        await Promise.all([

            loadHtmlImage(
                './textures/rug_basecolor.png'
            ),

            loadHtmlImage(
                './textures/rug_mask.png'
            )

        ]);


    const width =
        baseImage.naturalWidth ||
        baseImage.width;


    const height =
        baseImage.naturalHeight ||
        baseImage.height;


    if (
        !width ||
        !height
    ) {

        throw new Error(
            'Base-color image has invalid dimensions.'
        );

    }


    // ======================================================
    // BASE IMAGE CANVAS
    // ======================================================

    const baseCanvas =
        document.createElement(
            'canvas'
        );


    baseCanvas.width =
        width;


    baseCanvas.height =
        height;


    const baseContext =
        baseCanvas.getContext(
            '2d',
            {
                willReadFrequently:
                    true
            }
        );


    if (!baseContext) {

        throw new Error(
            'Could not create base-color canvas.'
        );

    }


    baseContext.drawImage(
        baseImage,
        0,
        0,
        width,
        height
    );


    const baseImageData =
        baseContext.getImageData(
            0,
            0,
            width,
            height
        );


    // ======================================================
    // MASK CANVAS
    // ======================================================

    const maskCanvas =
        document.createElement(
            'canvas'
        );


    maskCanvas.width =
        width;


    maskCanvas.height =
        height;


    const maskContext =
        maskCanvas.getContext(
            '2d',
            {
                willReadFrequently:
                    true
            }
        );


    if (!maskContext) {

        throw new Error(
            'Could not create mask canvas.'
        );

    }


    maskContext.drawImage(
        maskImage,
        0,
        0,
        width,
        height
    );


    const maskImageData =
        maskContext.getImageData(
            0,
            0,
            width,
            height
        );


    // ======================================================
    // OUTPUT CANVASES
    // ======================================================

    const colorCanvas =
        document.createElement(
            'canvas'
        );


    colorCanvas.width =
        width;


    colorCanvas.height =
        height;


    const metallicCanvas =
        document.createElement(
            'canvas'
        );


    metallicCanvas.width =
        width;


    metallicCanvas.height =
        height;


    const roughnessCanvas =
        document.createElement(
            'canvas'
        );


    roughnessCanvas.width =
        width;


    roughnessCanvas.height =
        height;


    const colorContext =
        colorCanvas.getContext(
            '2d'
        );


    const metallicContext =
        metallicCanvas.getContext(
            '2d'
        );


    const roughnessContext =
        roughnessCanvas.getContext(
            '2d'
        );


    if (
        !colorContext ||
        !metallicContext ||
        !roughnessContext
    ) {

        throw new Error(
            'Could not create BlendKit output canvases.'
        );

    }


    const colorOutput =
        colorContext.createImageData(
            width,
            height
        );


    const metallicOutput =
        metallicContext.createImageData(
            width,
            height
        );


    const roughnessOutput =
        roughnessContext.createImageData(
            width,
            height
        );


    const basePixels =
        baseImageData.data;


    const maskPixels =
        maskImageData.data;


    const colorPixels =
        colorOutput.data;


    const metallicPixels =
        metallicOutput.data;


    const roughnessPixels =
        roughnessOutput.data;


    // ======================================================
    // PROCESS PIXELS
    // ======================================================

    for (
        let i = 0;
        i < basePixels.length;
        i += 4
    ) {

        // --------------------------------------------------
        // PACKED MASK
        // --------------------------------------------------

        const maskR =
            maskPixels[i] /
            255;


        const maskG =
            maskPixels[i + 1] /
            255;


        const maskB =
            maskPixels[i + 2] /
            255;


        // --------------------------------------------------
        // BASE COLOR
        // --------------------------------------------------

        let r =
            srgbByteToLinear(
                basePixels[i]
            );


        let g =
            srgbByteToLinear(
                basePixels[i + 1]
            );


        let b =
            srgbByteToLinear(
                basePixels[i + 2]
            );


        // Blender Hue/Saturation/Value node:
        //
        // Value = 1.300

        r *=
            1.3;


        g *=
            1.3;


        b *=
            1.3;


        // Blender Multiply node:
        //
        // Base Color × GREEN channel

        r *=
            maskG;


        g *=
            maskG;


        b *=
            maskG;


        colorPixels[i] =
            linearToSrgbByte(
                r
            );


        colorPixels[i + 1] =
            linearToSrgbByte(
                g
            );


        colorPixels[i + 2] =
            linearToSrgbByte(
                b
            );


        colorPixels[i + 3] =
            255;


        // --------------------------------------------------
        // EXACT BLENDER METALLIC RAMP
        //
        // RED channel
        //
        // BLACK @ 0.340
        // WHITE @ 0.578
        // LINEAR
        // --------------------------------------------------

        const metallic =
            linearRamp(
                maskR,
                0.340,
                0.578
            );


        const metallicByte =
            Math.round(
                metallic *
                255
            );


        metallicPixels[i] =
            metallicByte;


        metallicPixels[i + 1] =
            metallicByte;


        metallicPixels[i + 2] =
            metallicByte;


        metallicPixels[i + 3] =
            255;


        // --------------------------------------------------
        // EXACT BLENDER ROUGHNESS RAMP
        //
        // BLUE channel
        //
        // BLACK @ 0.051
        // WHITE @ 0.763
        // LINEAR
        // --------------------------------------------------

        const roughness =
            linearRamp(
                maskB,
                0.051,
                0.763
            );


        const roughnessByte =
            Math.round(
                roughness *
                255
            );


        roughnessPixels[i] =
            roughnessByte;


        roughnessPixels[i + 1] =
            roughnessByte;


        roughnessPixels[i + 2] =
            roughnessByte;


        roughnessPixels[i + 3] =
            255;

    }


    // ======================================================
    // WRITE GENERATED IMAGES
    // ======================================================

    colorContext.putImageData(
        colorOutput,
        0,
        0
    );


    metallicContext.putImageData(
        metallicOutput,
        0,
        0
    );


    roughnessContext.putImageData(
        roughnessOutput,
        0,
        0
    );


    // ======================================================
    // CREATE THREE.JS TEXTURES
    // ======================================================

    const colorTexture =
        new THREE.CanvasTexture(
            colorCanvas
        );


    colorTexture.colorSpace =
        THREE.SRGBColorSpace;


    const metallicTexture =
        new THREE.CanvasTexture(
            metallicCanvas
        );


    metallicTexture.colorSpace =
        THREE.NoColorSpace;


    const roughnessTexture =
        new THREE.CanvasTexture(
            roughnessCanvas
        );


    roughnessTexture.colorSpace =
        THREE.NoColorSpace;


    configureTexture(
        colorTexture
    );


    configureTexture(
        metallicTexture
    );


    configureTexture(
        roughnessTexture
    );


    return {

        colorTexture,

        metallicTexture,

        roughnessTexture

    };

}


// ==========================================================
// RESTING CLOTH SHAPE
// ==========================================================

function restingHeight(x, y) {

    const wave1 =
        Math.sin(
            x * 1.15 +
            y * 0.40
        ) * 0.025;


    const wave2 =
        Math.sin(
            x * 2.5 -
            y * 1.25
        ) * 0.012;


    const wave3 =
        Math.sin(
            y * 3.4 +
            x * 0.7
        ) * 0.006;


    return (
        wave1 +
        wave2 +
        wave3
    );

}


// ==========================================================
// INITIALIZE CLOTH PHYSICS
// ==========================================================

function initializeClothPhysics() {

    positions =
        geometry.attributes.position;


    const count =
        positions.count;


    height =
        new Float32Array(
            count
        );


    velocity =
        new Float32Array(
            count
        );


    acceleration =
        new Float32Array(
            count
        );


    restX =
        new Float32Array(
            count
        );


    restY =
        new Float32Array(
            count
        );


    restZ =
        new Float32Array(
            count
        );


    for (
        let i = 0;
        i < count;
        i++
    ) {

        const x =
            positions.getX(i);


        const y =
            positions.getY(i);


        restX[i] =
            x;


        restY[i] =
            y;


        const z =
            restingHeight(
                x,
                y
            );


        restZ[i] =
            z;


        positions.setZ(
            i,
            z
        );

    }


    positions.needsUpdate =
        true;


    geometry.computeVertexNormals();

}


// ==========================================================
// POINTER SYSTEM
// ==========================================================

const pointerNDC =
    new THREE.Vector2();


const raycaster =
    new THREE.Raycaster();


const interactionPlane =
    new THREE.Plane(
        new THREE.Vector3(
            0,
            0,
            1
        ),
        0
    );


const intersection =
    new THREE.Vector3();


let pointerActive =
    false;


let targetPointerX =
    0;


let targetPointerY =
    0;


let smoothPointerX =
    0;


let smoothPointerY =
    0;


let previousSmoothPointerX =
    0;


let previousSmoothPointerY =
    0;


let smoothPointerSpeed =
    0;


let motionDirX =
    1;


let motionDirY =
    0;


let hasSmoothPointer =
    false;


let interactionPresence =
    0;


let visualSpeed01 =
    0;


// ==========================================================
// POINTER MOVE
// ==========================================================

function onPointerMove(event) {

    const rect =
        renderer.domElement
            .getBoundingClientRect();


    pointerNDC.x =
        (
            (
                event.clientX -
                rect.left
            )
            /
            rect.width
        )
        * 2
        - 1;


    pointerNDC.y =
        -(
            (
                event.clientY -
                rect.top
            )
            /
            rect.height
        )
        * 2
        + 1;


    raycaster.setFromCamera(
        pointerNDC,
        camera
    );


    const hit =
        raycaster.ray.intersectPlane(
            interactionPlane,
            intersection
        );


    if (!hit) {

        pointerActive =
            false;

        return;

    }


    const inside =
        Math.abs(
            intersection.x
        )
        <=
        RUG_WIDTH / 2

        &&

        Math.abs(
            intersection.y
        )
        <=
        RUG_HEIGHT / 2;


    if (!inside) {

        pointerActive =
            false;

        return;

    }


    targetPointerX =
        intersection.x;


    targetPointerY =
        intersection.y;


    if (!hasSmoothPointer) {

        smoothPointerX =
            targetPointerX;


        smoothPointerY =
            targetPointerY;


        previousSmoothPointerX =
            smoothPointerX;


        previousSmoothPointerY =
            smoothPointerY;


        hasSmoothPointer =
            true;

    }


    pointerActive =
        true;

}


// ==========================================================
// POINTER LEAVE
// ==========================================================

function onPointerLeave() {

    pointerActive =
        false;


    hasSmoothPointer =
        false;


    smoothPointerSpeed =
        0;

}


renderer.domElement.addEventListener(
    'pointermove',
    onPointerMove
);


renderer.domElement.addEventListener(
    'pointerleave',
    onPointerLeave
);


// ==========================================================
// SMOOTH POINTER
// ==========================================================

function updateSmoothPointer(dt) {

    const presenceTarget =
        pointerActive
            ? 1
            : 0;


    const presenceFollow =
        1 -
        Math.exp(
            -10 * dt
        );


    interactionPresence +=
        (
            presenceTarget -
            interactionPresence
        )
        *
        presenceFollow;


    if (!pointerActive) {

        smoothPointerSpeed *=
            Math.exp(
                -10 * dt
            );


        visualSpeed01 *=
            Math.exp(
                -7 * dt
            );


        return;

    }


    const follow =
        1 -
        Math.exp(
            -POINTER_FOLLOW_SPEED *
            dt
        );


    smoothPointerX +=
        (
            targetPointerX -
            smoothPointerX
        )
        *
        follow;


    smoothPointerY +=
        (
            targetPointerY -
            smoothPointerY
        )
        *
        follow;


    const dx =
        smoothPointerX -
        previousSmoothPointerX;


    const dy =
        smoothPointerY -
        previousSmoothPointerY;


    const instantaneousVX =
        dx /
        Math.max(
            dt,
            0.0001
        );


    const instantaneousVY =
        dy /
        Math.max(
            dt,
            0.0001
        );


    const instantaneousSpeed =
        Math.sqrt(
            instantaneousVX *
            instantaneousVX
            +
            instantaneousVY *
            instantaneousVY
        );


    previousSmoothPointerX =
        smoothPointerX;


    previousSmoothPointerY =
        smoothPointerY;


    const speedFollow =
        1 -
        Math.exp(
            -SPEED_SMOOTHING *
            dt
        );


    smoothPointerSpeed +=
        (
            instantaneousSpeed -
            smoothPointerSpeed
        )
        *
        speedFollow;


    if (
        instantaneousSpeed >
        DIRECTION_UPDATE_THRESHOLD
    ) {

        const targetDirX =
            instantaneousVX /
            instantaneousSpeed;


        const targetDirY =
            instantaneousVY /
            instantaneousSpeed;


        const directionFollow =
            1 -
            Math.exp(
                -DIRECTION_FOLLOW_SPEED *
                dt
            );


        motionDirX +=
            (
                targetDirX -
                motionDirX
            )
            *
            directionFollow;


        motionDirY +=
            (
                targetDirY -
                motionDirY
            )
            *
            directionFollow;


        const directionLength =
            Math.sqrt(
                motionDirX *
                motionDirX
                +
                motionDirY *
                motionDirY
            );


        if (
            directionLength >
            0.0001
        ) {

            motionDirX /=
                directionLength;


            motionDirY /=
                directionLength;

        }

    }

}


// ==========================================================
// SPEED → INTERACTION
// ==========================================================

function getPointerEffect() {

    const normalizedSpeed =
        (
            smoothPointerSpeed -
            SPEED_DEADZONE
        )
        /
        (
            SPEED_FULL_EFFECT -
            SPEED_DEADZONE
        );


    let speed01 =
        smoothstep01(
            normalizedSpeed
        );


    speed01 =
        Math.pow(
            speed01,
            1.35
        );


    visualSpeed01 =
        speed01;


    const bulge =
        lerp(
            MIN_BULGE,
            MAX_BULGE,
            speed01
        );


    const radius =
        lerp(
            MIN_RADIUS,
            MAX_RADIUS,
            speed01
        );


    const stiffness =
        lerp(
            MIN_POINTER_STIFFNESS,
            MAX_POINTER_STIFFNESS,
            speed01
        );


    const localDamping =
        lerp(
            SLOW_POINTER_DAMPING,
            FAST_POINTER_DAMPING,
            speed01
        );


    return {

        speed01,

        bulge,

        radius,

        stiffness,

        localDamping

    };

}


// ==========================================================
// CLOTH PHYSICS
// ==========================================================

function simulateCloth(dt) {

    updateSmoothPointer(
        dt
    );


    acceleration.fill(
        0
    );


    const step =
        dt * 60;


    // ------------------------------------------------------
    // RIPPLE SPRINGS
    // ------------------------------------------------------

    for (
        let y = 1;
        y < ROWS - 1;
        y++
    ) {

        for (
            let x = 1;
            x < COLS - 1;
            x++
        ) {

            const i =
                indexOf(
                    x,
                    y
                );


            const left =
                indexOf(
                    x - 1,
                    y
                );


            const right =
                indexOf(
                    x + 1,
                    y
                );


            const down =
                indexOf(
                    x,
                    y - 1
                );


            const up =
                indexOf(
                    x,
                    y + 1
                );


            const neighborAverage =
                (
                    height[left] +
                    height[right] +
                    height[down] +
                    height[up]
                )
                *
                0.25;


            acceleration[i] +=
                (
                    neighborAverage -
                    height[i]
                )
                *
                TENSION;


            acceleration[i] +=
                -height[i] *
                RESTORE_FORCE;

        }

    }


    // ------------------------------------------------------
    // POINTER FORCE
    // ------------------------------------------------------

    if (
        pointerActive &&
        hasSmoothPointer
    ) {

        const effect =
            getPointerEffect();


        const radiusSquared =
            effect.radius *
            effect.radius;


        for (
            let y = 1;
            y < ROWS - 1;
            y++
        ) {

            for (
                let x = 1;
                x < COLS - 1;
                x++
            ) {

                const i =
                    indexOf(
                        x,
                        y
                    );


                const dx =
                    restX[i] -
                    smoothPointerX;


                const dy =
                    restY[i] -
                    smoothPointerY;


                const distanceSquared =
                    dx * dx +
                    dy * dy;


                if (
                    distanceSquared <
                    radiusSquared
                ) {

                    const distance =
                        Math.sqrt(
                            distanceSquared
                        );


                    let influence =
                        1 -
                        (
                            distance /
                            effect.radius
                        );


                    influence =
                        smoothstep01(
                            influence
                        );


                    const targetHeight =
                        effect.bulge *
                        influence;


                    const error =
                        targetHeight -
                        height[i];


                    acceleration[i] +=
                        error *
                        effect.stiffness;


                    acceleration[i] -=
                        velocity[i] *
                        effect.localDamping *
                        influence;

                }

            }

        }

    }


    // ------------------------------------------------------
    // INTEGRATE
    // ------------------------------------------------------

    const frameDamping =
        Math.pow(
            DAMPING,
            step
        );


    for (
        let y = 1;
        y < ROWS - 1;
        y++
    ) {

        for (
            let x = 1;
            x < COLS - 1;
            x++
        ) {

            const i =
                indexOf(
                    x,
                    y
                );


            velocity[i] +=
                acceleration[i] *
                step;


            velocity[i] *=
                frameDamping;


            height[i] +=
                velocity[i] *
                step;

        }

    }


    // ------------------------------------------------------
    // PIN EDGES
    // ------------------------------------------------------

    for (
        let x = 0;
        x < COLS;
        x++
    ) {

        const bottom =
            indexOf(
                x,
                0
            );


        const top =
            indexOf(
                x,
                ROWS - 1
            );


        height[bottom] =
            0;


        velocity[bottom] =
            0;


        height[top] =
            0;


        velocity[top] =
            0;

    }


    for (
        let y = 0;
        y < ROWS;
        y++
    ) {

        const left =
            indexOf(
                0,
                y
            );


        const right =
            indexOf(
                COLS - 1,
                y
            );


        height[left] =
            0;


        velocity[left] =
            0;


        height[right] =
            0;


        velocity[right] =
            0;

    }

}


// ==========================================================
// UPDATE VISUAL CLOTH
// ==========================================================

function updateGeometry() {

    const speed01 =
        visualSpeed01;


    const foldAmplitude =
        lerp(
            MIN_FOLD_AMPLITUDE,
            MAX_FOLD_AMPLITUDE,
            speed01
        )
        *
        interactionPresence;


    const foldLength =
        lerp(
            MIN_FOLD_LENGTH,
            MAX_FOLD_LENGTH,
            speed01
        );


    const foldWidth =
        lerp(
            MIN_FOLD_WIDTH,
            MAX_FOLD_WIDTH,
            speed01
        );


    const dragAmount =
        lerp(
            MIN_DRAG_AMOUNT,
            MAX_DRAG_AMOUNT,
            speed01
        )
        *
        interactionPresence;


    const halfWidth =
        RUG_WIDTH / 2;


    const halfHeight =
        RUG_HEIGHT / 2;


    for (
        let i = 0;
        i < positions.count;
        i++
    ) {

        const baseX =
            restX[i];


        const baseY =
            restY[i];


        let finalX =
            baseX;


        let finalY =
            baseY;


        let foldZ =
            0;


        const edgeDistanceX =
            halfWidth -
            Math.abs(
                baseX
            );


        const edgeDistanceY =
            halfHeight -
            Math.abs(
                baseY
            );


        const edgeFade =
            smoothstep01(
                Math.min(
                    edgeDistanceX /
                    0.45,

                    edgeDistanceY /
                    0.45
                )
            );


        if (
            interactionPresence >
            0.001
        ) {

            const dx =
                baseX -
                smoothPointerX;


            const dy =
                baseY -
                smoothPointerY;


            const along =
                dx *
                motionDirX
                +
                dy *
                motionDirY;


            const across =
                -dx *
                motionDirY
                +
                dy *
                motionDirX;


            const directionalLength =
                along < 0

                    ? foldLength *
                    1.25

                    : foldLength *
                    0.78;


            const envelope =
                Math.exp(
                    -(
                        (
                            along *
                            along
                        )
                        /
                        (
                            2 *
                            directionalLength *
                            directionalLength
                        )

                        +

                        (
                            across *
                            across
                        )
                        /
                        (
                            2 *
                            foldWidth *
                            foldWidth
                        )
                    )
                );


            const fold1 =
                Math.sin(
                    across *
                    FOLD_FREQUENCY_1

                    +

                    along *
                    0.75
                );


            const fold2 =
                Math.sin(
                    across *
                    FOLD_FREQUENCY_2

                    -

                    along *
                    1.35

                    +

                    0.85
                );


            const combinedFold =
                (
                    fold1 *
                    0.68

                    +

                    fold2 *
                    0.32
                );


            foldZ =
                combinedFold *
                foldAmplitude *
                envelope *
                edgeFade;


            const dragEnvelope =
                envelope *
                edgeFade;


            finalX +=
                motionDirX *
                dragAmount *
                dragEnvelope;


            finalY +=
                motionDirY *
                dragAmount *
                dragEnvelope;

        }


        positions.setXYZ(
            i,

            finalX,

            finalY,

            restZ[i] +
            height[i] +
            foldZ
        );

    }


    positions.needsUpdate =
        true;


    geometry.computeVertexNormals();

}


// ==========================================================
// CREATE RUG — V8.5
// ==========================================================

async function createRug() {

    const [
        maps,
        normalTexture
    ] =
        await Promise.all([

            createBlendKitMapsFromFiles(),

            loadTexture(
                './textures/rug_normal.png'
            )

        ]);


    // ------------------------------------------------------
    // NORMAL MAP
    // ------------------------------------------------------

    normalTexture.colorSpace =
        THREE.NoColorSpace;


    configureTexture(
        normalTexture
    );


    // ------------------------------------------------------
    // GEOMETRY
    // ------------------------------------------------------

    geometry =
        new THREE.PlaneGeometry(
            RUG_WIDTH,
            RUG_HEIGHT,
            SEGMENTS_X,
            SEGMENTS_Y
        );


    // ------------------------------------------------------
    // MATERIAL
    // ------------------------------------------------------

    const material =
        new THREE.MeshPhysicalMaterial({

            // Processed Blender-style color.
            map:
                maps.colorTexture,


            // Metallic texture already contains the exact
            // ColorRamp result.
            metalness:
                1.0,


            metalnessMap:
                maps.metallicTexture,


            // Roughness texture already contains the exact
            // ColorRamp result.
            roughness:
                1.0,


            roughnessMap:
                maps.roughnessTexture,


            // Original normal texture.
            normalMap:
                normalTexture,


            // Blender Normal Map node:
            // Strength = 0.800
            //
            // Y inverted to match the node graph.
            normalScale:
                new THREE.Vector2(
                    0.8,
                    -0.8
                ),


            // Save silk enhancements for checklist #2.
            sheen:
                0,


            clearcoat:
                0,


            envMapIntensity:
                0.75,


            side:
                THREE.DoubleSide

        });


    // ------------------------------------------------------
    // CREATE RUG
    // ------------------------------------------------------

    rug =
        new THREE.Mesh(
            geometry,
            material
        );


    scene.add(
        rug
    );


    // Preserve working cloth simulation.
    initializeClothPhysics();


    // Debug access if needed later.
    window.rug =
        rug;


    window.rugMaterial =
        material;


    window.porphyraMaps =
        maps;


    console.log(
        'PORPHYRA v8.5 — EXACT BLENDKIT RAMPS LOADED'
    );

}


// ==========================================================
// CAMERA FIT
// ==========================================================

function fitCamera() {

    camera.aspect =
        window.innerWidth /
        window.innerHeight;


    camera.updateProjectionMatrix();


    const fov =
        THREE.MathUtils.degToRad(
            camera.fov
        );


    const distanceForHeight =
        (RUG_HEIGHT / 2)
        /
        Math.tan(
            fov / 2
        );


    const distanceForWidth =
        (RUG_WIDTH / 2)
        /
        (
            Math.tan(
                fov / 2
            )
            *
            camera.aspect
        );


    const distance =
        Math.max(
            distanceForHeight,
            distanceForWidth
        );


    camera.position.set(
        0,
        0,
        distance * 1.12
    );


    camera.lookAt(
        0,
        0,
        0
    );

}


// ==========================================================
// RESIZE
// ==========================================================

window.addEventListener(
    'resize',
    () => {

        renderer.setPixelRatio(
            Math.min(
                window.devicePixelRatio,
                2
            )
        );


        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );


        fitCamera();

    }
);


// ==========================================================
// START
// ==========================================================

const loading =
    document.getElementById(
        'loading'
    );


const errorBox =
    document.getElementById(
        'error'
    );


try {

    fitCamera();


    await createRug();


    loading.classList.add(
        'hidden'
    );


    console.log(
        'PORPHYRA Cloth v8.5 loaded'
    );

}
catch (error) {

    console.error(
        error
    );


    loading.classList.add(
        'hidden'
    );


    errorBox.style.display =
        'block';


    errorBox.textContent =
        error.message;

}


// ==========================================================
// ANIMATION
// ==========================================================

const clock =
    new THREE.Clock();


renderer.setAnimationLoop(
    () => {

        const frameTime =
            Math.min(
                clock.getDelta(),
                0.05
            );


        physicsAccumulator +=
            frameTime;


        let substeps =
            0;


        while (
            physicsAccumulator >=
                FIXED_TIMESTEP

            &&

            substeps <
                MAX_SUBSTEPS
        ) {

            simulateCloth(
                FIXED_TIMESTEP
            );


            physicsAccumulator -=
                FIXED_TIMESTEP;


            substeps++;

        }


        if (
            substeps ===
            MAX_SUBSTEPS
        ) {

            physicsAccumulator =
                0;

        }


        if (rug) {

            updateGeometry();

        }


        renderer.render(
            scene,
            camera
        );

    }
);
