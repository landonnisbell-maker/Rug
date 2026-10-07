import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

// ==========================================================
// PORPHYRA — INTERACTIVE CLOTH v12.0
// 3D SILK TASSEL BUNDLES
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
// 3D TASSEL SYSTEM
// ==========================================================

const TASSEL_BUNDLES_PER_END = 54;
const THREADS_PER_BUNDLE = 5;
const THREAD_SEGMENTS = 3;

const TASSEL_MIN_LENGTH = 0.24;
const TASSEL_MAX_LENGTH = 0.39;

const THREAD_MIN_RADIUS = 0.0055;
const THREAD_MAX_RADIUS = 0.0085;

const BUNDLE_HALF_WIDTH = 0.052;
const TASSEL_ROOT_OUTSET = 0.014;

const TASSEL_INFLUENCE_RADIUS = 1.30;

const TASSEL_MOUSE_TANGENT = 0.15;
const TASSEL_MOUSE_OUTWARD = 0.060;

const TASSEL_SPRING = 34.0;
const TASSEL_DAMPING = 8.5;

const TASSEL_DEPTH_CURVE = 0.030;
const TASSEL_MAX_DROOP = 0.055;


// ==========================================================
// WOVEN END BINDING
// ==========================================================

const BINDING_WIDTH = 0.105;
const BINDING_LIFT = 0.004;


// ==========================================================
// TEXTURE SCALE
// ==========================================================

const REPEAT_Y = 1.6;

const REPEAT_X =
    REPEAT_Y *
    (
        RUG_WIDTH /
        RUG_HEIGHT
    );


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

const scene =
    new THREE.Scene();


scene.background =
    new THREE.Color(
        0x000000
    );


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

        antialias:
            true,

        powerPreference:
            'high-performance'

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


renderer.shadowMap.enabled =
    true;


renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;


renderer.shadowMap.autoUpdate =
    true;


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
// CINEMATIC LIGHTING
// ==========================================================

RectAreaLightUniformsLib.init();


// ----------------------------------------------------------
// WARM AREA KEY
// ----------------------------------------------------------

const warmAreaKey =
    new THREE.RectAreaLight(

        0xffd7ad,

        5.2,

        6.5,

        2.4

    );


warmAreaKey.position.set(

    -3.8,

    3.2,

    4.2

);


warmAreaKey.lookAt(
    0,
    0,
    0
);


scene.add(
    warmAreaKey
);


// ----------------------------------------------------------
// SHADOW KEY
// ----------------------------------------------------------

const shadowKey =
    new THREE.SpotLight(

        0xffdfbd,

        95,

        20,

        Math.PI / 3.25,

        0.72,

        2

    );


shadowKey.position.set(

    -4.8,

    3.8,

    5.0

);


shadowKey.target.position.set(
    0,
    0,
    0
);


scene.add(
    shadowKey.target
);


shadowKey.castShadow =
    true;


shadowKey.shadow.mapSize.width =
    2048;


shadowKey.shadow.mapSize.height =
    2048;


shadowKey.shadow.camera.near =
    0.5;


shadowKey.shadow.camera.far =
    20;


shadowKey.shadow.focus =
    1;


shadowKey.shadow.bias =
    -0.00015;


shadowKey.shadow.normalBias =
    0.018;


shadowKey.shadow.radius =
    3;


scene.add(
    shadowKey
);


// ----------------------------------------------------------
// COOL FILL
// ----------------------------------------------------------

const coolFill =
    new THREE.RectAreaLight(

        0xbecbff,

        0.58,

        4.5,

        3.2

    );


coolFill.position.set(

    4.0,

    -2.8,

    3.3

);


coolFill.lookAt(
    0,
    0,
    0
);


scene.add(
    coolFill
);


// ----------------------------------------------------------
// WARM RIM
// ----------------------------------------------------------

const rimLight =
    new THREE.RectAreaLight(

        0xffc98c,

        0.72,

        4.5,

        0.7

    );


rimLight.position.set(

    1.5,

    4.5,

    2.6

);


rimLight.lookAt(
    0,
    0,
    0
);


scene.add(
    rimLight
);


// ==========================================================
// TEXTURES
// ==========================================================

const textureLoader =
    new THREE.TextureLoader();


async function loadTexture(
    path
) {

    return await textureLoader.loadAsync(
        path
    );

}


function configureTexture(
    texture
) {

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
// HTML IMAGE LOADING
// ==========================================================

function loadHtmlImage(
    path
) {

    return new Promise(

        (
            resolve,
            reject
        ) => {

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
// COLOR HELPERS
// ==========================================================

function srgbByteToLinear(
    byteValue
) {

    const value =
        byteValue /
        255;


    if (
        value <=
        0.04045
    ) {

        return (
            value /
            12.92
        );

    }


    return Math.pow(

        (
            value +
            0.055
        )

        /

        1.055,

        2.4

    );

}


function linearToSrgbByte(
    value
) {

    value =
        Math.max(

            0,

            Math.min(
                1,
                value
            )

        );


    const srgb =

        value <=
        0.0031308

            ?

            value *
            12.92

            :

            1.055 *
            Math.pow(
                value,
                1 / 2.4
            )
            -
            0.055;


    return Math.round(

        Math.max(

            0,

            Math.min(
                1,
                srgb
            )

        )

        *

        255

    );

}


function linearRamp(

    value,

    blackPosition,

    whitePosition

) {

    return Math.max(

        0,

        Math.min(

            1,

            (
                value -
                blackPosition
            )

            /

            (
                whitePosition -
                blackPosition
            )

        )

    );

}


// ==========================================================
// BUILD SILK MAPS
// ==========================================================

async function createV10SilkMaps() {

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


    const imageHeight =
        baseImage.naturalHeight ||
        baseImage.height;


    if (
        !width ||
        !imageHeight
    ) {

        throw new Error(
            'Base-color image has invalid dimensions.'
        );

    }


    const baseCanvas =
        document.createElement(
            'canvas'
        );


    baseCanvas.width =
        width;


    baseCanvas.height =
        imageHeight;


    const baseContext =
        baseCanvas.getContext(

            '2d',

            {
                willReadFrequently:
                    true
            }

        );


    if (
        !baseContext
    ) {

        throw new Error(
            'Could not create base canvas.'
        );

    }


    baseContext.drawImage(

        baseImage,

        0,
        0,

        width,
        imageHeight

    );


    const baseData =
        baseContext.getImageData(

            0,
            0,

            width,
            imageHeight

        );


    const maskCanvas =
        document.createElement(
            'canvas'
        );


    maskCanvas.width =
        width;


    maskCanvas.height =
        imageHeight;


    const maskContext =
        maskCanvas.getContext(

            '2d',

            {
                willReadFrequently:
                    true
            }

        );


    if (
        !maskContext
    ) {

        throw new Error(
            'Could not create mask canvas.'
        );

    }


    maskContext.drawImage(

        maskImage,

        0,
        0,

        width,
        imageHeight

    );


    const maskData =
        maskContext.getImageData(

            0,
            0,

            width,
            imageHeight

        );


    const colorCanvas =
        document.createElement(
            'canvas'
        );


    const metalCanvas =
        document.createElement(
            'canvas'
        );


    const roughCanvas =
        document.createElement(
            'canvas'
        );


    for (
        const canvas of [

            colorCanvas,

            metalCanvas,

            roughCanvas

        ]
    ) {

        canvas.width =
            width;


        canvas.height =
            imageHeight;

    }


    const colorContext =
        colorCanvas.getContext(
            '2d'
        );


    const metalContext =
        metalCanvas.getContext(
            '2d'
        );


    const roughContext =
        roughCanvas.getContext(
            '2d'
        );


    if (

        !colorContext ||
        !metalContext ||
        !roughContext

    ) {

        throw new Error(
            'Could not create output canvases.'
        );

    }


    const colorOutput =
        colorContext.createImageData(

            width,

            imageHeight

        );


    const metalOutput =
        metalContext.createImageData(

            width,

            imageHeight

        );


    const roughOutput =
        roughContext.createImageData(

            width,

            imageHeight

        );


    const basePixels =
        baseData.data;


    const maskPixels =
        maskData.data;


    const colorPixels =
        colorOutput.data;


    const metalPixels =
        metalOutput.data;


    const roughPixels =
        roughOutput.data;


    for (

        let i = 0;

        i < basePixels.length;

        i += 4

    ) {

        const maskR =
            maskPixels[i] /
            255;


        const maskG =
            maskPixels[
                i + 1
            ] /
            255;


        const maskB =
            maskPixels[
                i + 2
            ] /
            255;


        const greenModulation =

            1.0 +

            (
                maskG -
                1.0
            )

            *

            COLOR_MASK_STRENGTH;


        let r =
            srgbByteToLinear(
                basePixels[i]
            );


        let g =
            srgbByteToLinear(
                basePixels[
                    i + 1
                ]
            );


        let b =
            srgbByteToLinear(
                basePixels[
                    i + 2
                ]
            );


        r *=
            1.3 *
            greenModulation;


        g *=
            1.3 *
            greenModulation;


        b *=
            1.3 *
            greenModulation;


        colorPixels[i] =
            linearToSrgbByte(
                r
            );


        colorPixels[
            i + 1
        ] =
            linearToSrgbByte(
                g
            );


        colorPixels[
            i + 2
        ] =
            linearToSrgbByte(
                b
            );


        colorPixels[
            i + 3
        ] =
            255;


        const blenderMetal =
            linearRamp(

                maskR,

                0.340,

                0.578

            );


        const metalness =

            blenderMetal *

            MAX_METALNESS;


        const metalByte =
            Math.round(

                metalness *

                255

            );


        metalPixels[i] =
            metalByte;


        metalPixels[
            i + 1
        ] =
            metalByte;


        metalPixels[
            i + 2
        ] =
            metalByte;


        metalPixels[
            i + 3
        ] =
            255;


        const blenderRoughness =
            linearRamp(

                maskB,

                0.051,

                0.763

            );


        const roughness =

            MIN_SILK_ROUGHNESS +

            (
                MAX_SILK_ROUGHNESS -
                MIN_SILK_ROUGHNESS
            )

            *

            blenderRoughness;


        const roughByte =
            Math.round(

                roughness *

                255

            );


        roughPixels[i] =
            roughByte;


        roughPixels[
            i + 1
        ] =
            roughByte;


        roughPixels[
            i + 2
        ] =
            roughByte;


        roughPixels[
            i + 3
        ] =
            255;

    }


    colorContext.putImageData(

        colorOutput,

        0,
        0

    );


    metalContext.putImageData(

        metalOutput,

        0,
        0

    );


    roughContext.putImageData(

        roughOutput,

        0,
        0

    );


    const colorTexture =
        new THREE.CanvasTexture(
            colorCanvas
        );


    colorTexture.colorSpace =
        THREE.SRGBColorSpace;


    const metalnessTexture =
        new THREE.CanvasTexture(
            metalCanvas
        );


    metalnessTexture.colorSpace =
        THREE.NoColorSpace;


    const roughnessTexture =
        new THREE.CanvasTexture(
            roughCanvas
        );


    roughnessTexture.colorSpace =
        THREE.NoColorSpace;


    configureTexture(
        colorTexture
    );


    configureTexture(
        metalnessTexture
    );


    configureTexture(
        roughnessTexture
    );


    return {

        colorTexture,

        metalnessTexture,

        roughnessTexture

    };

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
// BINDING / TASSEL STATE
// ==========================================================

let endA_Binding;

let endB_Binding;

let tasselMesh;

let tasselBundles =
    [];


const THREAD_INSTANCE_COUNT =

    TASSEL_BUNDLES_PER_END *

    2 *

    THREADS_PER_BUNDLE *

    THREAD_SEGMENTS;


const Y_AXIS =
    new THREE.Vector3(
        0,
        1,
        0
    );


const tempMid =
    new THREE.Vector3();


const tempDir =
    new THREE.Vector3();


const tempQuat =
    new THREE.Quaternion();


const tempScale =
    new THREE.Vector3();


const tempMatrix =
    new THREE.Matrix4();


// ==========================================================
// HELPERS
// ==========================================================

function indexOf(
    x,
    y
) {

    return (

        y *
        COLS

        +

        x

    );

}


function clamp01(
    value
) {

    return Math.max(

        0,

        Math.min(
            1,
            value
        )

    );

}


function lerp(
    a,
    b,
    t
) {

    return (

        a +

        (
            b -
            a
        )

        *

        t

    );

}


function smoothstep01(
    t
) {

    t =
        clamp01(
            t
        );


    return (

        t *
        t *

        (
            3 -
            2 *
            t
        )

    );

}


function pseudoRandom(
    seed
) {

    const x =

        Math.sin(

            seed *
            127.1

            +

            311.7

        )

        *

        43758.5453123;


    return (

        x -

        Math.floor(
            x
        )

    );

}


function sampleGridIndex(
    i,
    count,
    maxIndex
) {

    if (
        count <=
        1
    ) {

        return Math.round(
            maxIndex *
            0.5
        );

    }


    return Math.round(

        (
            i /
            (
                count -
                1
            )
        )

        *

        maxIndex

    );

}


function normalize2(
    x,
    y,
    fallbackX = 1,
    fallbackY = 0
) {

    const len =
        Math.hypot(
            x,
            y
        );


    if (
        len <
        0.000001
    ) {

        return {

            x:
                fallbackX,

            y:
                fallbackY

        };

    }


    return {

        x:
            x /
            len,

        y:
            y /
            len

    };

}


function getVertex(
    index,
    target
) {

    const array =
        geometry
            .attributes
            .position
            .array;


    const offset =
        index *
        3;


    target.set(

        array[
            offset
        ],

        array[
            offset + 1
        ],

        array[
            offset + 2
        ]

    );


    return target;

}


// ==========================================================
// RESTING CLOTH SHAPE
// ==========================================================

function restingHeight(
    x,
    y
) {

    const wave1 =

        Math.sin(

            x *
            1.15

            +

            y *
            0.40

        )

        *

        0.025;


    const wave2 =

        Math.sin(

            x *
            2.5

            -

            y *
            1.25

        )

        *

        0.012;


    const wave3 =

        Math.sin(

            y *
            3.4

            +

            x *
            0.7

        )

        *

        0.006;


    return (

        wave1 +

        wave2 +

        wave3

    );

}


// ==========================================================
// INITIALIZE CLOTH
// ==========================================================

function initializeClothPhysics() {

    positions =
        geometry
            .attributes
            .position;


    positions.setUsage(
        THREE.DynamicDrawUsage
    );


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
            positions.getX(
                i
            );


        const y =
            positions.getY(
                i
            );


        const z =
            restingHeight(
                x,
                y
            );


        restX[i] =
            x;


        restY[i] =
            y;


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


    updateDynamicOcclusion();

}


// ==========================================================
// POINTER
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


let pointerOverRug =
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

function onPointerMove(
    event
) {

    const rect =

        renderer
            .domElement
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

        *

        2

        -

        1;


    pointerNDC.y =

        -(

            (
                event.clientY -
                rect.top
            )

            /

            rect.height

        )

        *

        2

        +

        1;


    raycaster.setFromCamera(

        pointerNDC,

        camera

    );


    const hit =

        raycaster
            .ray
            .intersectPlane(

                interactionPlane,

                intersection

            );


    if (
        !hit
    ) {

        pointerActive =
            false;


        pointerOverRug =
            false;


        return;

    }


    const tasselReach =

        BINDING_WIDTH +

        TASSEL_MAX_LENGTH +

        0.14;


    const insideInteractionRegion =

        Math.abs(
            intersection.x
        )

        <=

        RUG_WIDTH /
        2

        +

        0.05

        &&

        Math.abs(
            intersection.y
        )

        <=

        RUG_HEIGHT /
        2

        +

        tasselReach;


    if (
        !insideInteractionRegion
    ) {

        pointerActive =
            false;


        pointerOverRug =
            false;


        return;

    }


    pointerOverRug =

        Math.abs(
            intersection.x
        )

        <=

        RUG_WIDTH /
        2

        &&

        Math.abs(
            intersection.y
        )

        <=

        RUG_HEIGHT /
        2;


    targetPointerX =
        intersection.x;


    targetPointerY =
        intersection.y;


    if (
        !hasSmoothPointer
    ) {

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


function onPointerLeave() {

    pointerActive =
        false;


    pointerOverRug =
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

function updateSmoothPointer(
    dt
) {

    const presenceTarget =

        pointerActive

            ?

            1

            :

            0;


    const presenceFollow =

        1

        -

        Math.exp(
            -10 *
            dt
        );


    interactionPresence +=

        (
            presenceTarget -
            interactionPresence
        )

        *

        presenceFollow;


    if (
        !pointerActive
    ) {

        smoothPointerSpeed *=

            Math.exp(
                -10 *
                dt
            );


        visualSpeed01 *=

            Math.exp(
                -7 *
                dt
            );


        return;

    }


    const follow =

        1

        -

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

        1

        -

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

            1

            -

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
// POINTER EFFECT
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


    return {

        speed01,


        bulge:

            lerp(

                MIN_BULGE,

                MAX_BULGE,

                speed01

            ),


        radius:

            lerp(

                MIN_RADIUS,

                MAX_RADIUS,

                speed01

            ),


        stiffness:

            lerp(

                MIN_POINTER_STIFFNESS,

                MAX_POINTER_STIFFNESS,

                speed01

            ),


        localDamping:

            lerp(

                SLOW_POINTER_DAMPING,

                FAST_POINTER_DAMPING,

                speed01

            )

    };

}


// ==========================================================
// CLOTH SIMULATION
// ==========================================================

function simulateCloth(
    dt
) {

    updateSmoothPointer(
        dt
    );


    acceleration.fill(
        0
    );


    const step =
        dt *
        60;


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


    if (

        pointerOverRug &&

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

                    dx *
                    dx

                    +

                    dy *
                    dy;


                if (

                    distanceSquared <
                    radiusSquared

                ) {

                    const distance =

                        Math.sqrt(
                            distanceSquared
                        );


                    let influence =

                        1

                        -

                        distance /
                        effect.radius;


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
    // PIN PERIMETER
    // ------------------------------------------------------

    for (

        let x = 0;

        x < COLS;

        x++

    ) {

        const a =
            indexOf(
                x,
                0
            );


        const b =
            indexOf(
                x,
                ROWS - 1
            );


        height[a] =
            0;


        velocity[a] =
            0;


        height[b] =
            0;


        velocity[b] =
            0;

    }


    for (

        let y = 0;

        y < ROWS;

        y++

    ) {

        const a =
            indexOf(
                0,
                y
            );


        const b =
            indexOf(
                COLS - 1,
                y
            );


        height[a] =
            0;


        velocity[a] =
            0;


        height[b] =
            0;


        velocity[b] =
            0;

    }

}


// ==========================================================
// DYNAMIC FOLD OCCLUSION
// ==========================================================

function updateDynamicOcclusion() {

    if (

        !positions ||

        !vertexColors ||

        !restZ

    ) {

        return;

    }


    const posArray =
        positions.array;


    const colorArray =
        vertexColors.array;


    const halfWidth =
        RUG_WIDTH /
        2;


    const halfHeight =
        RUG_HEIGHT /
        2;


    for (

        let y = 0;

        y < ROWS;

        y++

    ) {

        for (

            let x = 0;

            x < COLS;

            x++

        ) {

            const i =
                indexOf(
                    x,
                    y
                );


            const baseIndex =
                i *
                3;


            let brightness =
                1.0;


            if (

                x > 0 &&

                x < COLS - 1 &&

                y > 0 &&

                y < ROWS - 1

            ) {

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


                const centerDisp =

                    posArray[
                        baseIndex + 2
                    ]

                    -

                    restZ[i];


                const leftDisp =

                    posArray[
                        left * 3 + 2
                    ]

                    -

                    restZ[left];


                const rightDisp =

                    posArray[
                        right * 3 + 2
                    ]

                    -

                    restZ[right];


                const downDisp =

                    posArray[
                        down * 3 + 2
                    ]

                    -

                    restZ[down];


                const upDisp =

                    posArray[
                        up * 3 + 2
                    ]

                    -

                    restZ[up];


                const neighborAverage =

                    (
                        leftDisp +

                        rightDisp +

                        downDisp +

                        upDisp
                    )

                    *

                    0.25;


                const curvature =

                    neighborAverage -

                    centerDisp;


                const valley01 =

                    smoothstep01(

                        (
                            curvature -
                            CURVATURE_START
                        )

                        /

                        (
                            CURVATURE_END -
                            CURVATURE_START
                        )

                    );


                const crest01 =

                    smoothstep01(

                        (
                            -curvature -
                            CURVATURE_START
                        )

                        /

                        (
                            CURVATURE_END -
                            CURVATURE_START
                        )

                    );


                const rawBrightness =

                    1.0

                    -

                    valley01 *
                    VALLEY_DARKEN_STRENGTH

                    +

                    crest01 *
                    CREST_LIGHTEN_STRENGTH;


                const edgeDistanceX =

                    halfWidth -

                    Math.abs(
                        restX[i]
                    );


                const edgeDistanceY =

                    halfHeight -

                    Math.abs(
                        restY[i]
                    );


                const edgeFade =

                    smoothstep01(

                        Math.min(

                            edgeDistanceX /
                            0.38,

                            edgeDistanceY /
                            0.38

                        )

                    );


                brightness =

                    lerp(

                        1.0,

                        rawBrightness,

                        edgeFade

                    );

            }


            brightness =

                THREE.MathUtils.clamp(

                    brightness,

                    0.58,

                    1.03

                );


            colorArray[
                baseIndex
            ] =
                brightness;


            colorArray[
                baseIndex + 1
            ] =
                brightness;


            colorArray[
                baseIndex + 2
            ] =
                brightness;

        }

    }


    vertexColors.needsUpdate =
        true;

}


// ==========================================================
// PROCEDURAL WOVEN BINDING TEXTURES
// ==========================================================

function createBindingTextures() {

    const width =
        256;


    const h =
        64;


    const colorCanvas =
        document.createElement(
            'canvas'
        );


    colorCanvas.width =
        width;


    colorCanvas.height =
        h;


    const bumpCanvas =
        document.createElement(
            'canvas'
        );


    bumpCanvas.width =
        width;


    bumpCanvas.height =
        h;


    const colorContext =
        colorCanvas.getContext(
            '2d'
        );


    const bumpContext =
        bumpCanvas.getContext(
            '2d'
        );


    colorContext.fillStyle =
        '#b4874a';


    colorContext.fillRect(
        0,
        0,
        width,
        h
    );


    bumpContext.fillStyle =
        '#808080';


    bumpContext.fillRect(
        0,
        0,
        width,
        h
    );


    // ------------------------------------------------------
    // DENSE WRAPPED THREADS
    // ------------------------------------------------------

    for (

        let x = 0;

        x < width;

        x += 8

    ) {

        colorContext.fillStyle =
            '#d1aa68';


        colorContext.fillRect(
            x,
            0,
            2,
            h
        );


        colorContext.fillStyle =
            '#8f6638';


        colorContext.fillRect(
            x + 3,
            0,
            2,
            h
        );


        bumpContext.fillStyle =
            '#d0d0d0';


        bumpContext.fillRect(
            x,
            0,
            2,
            h
        );


        bumpContext.fillStyle =
            '#555555';


        bumpContext.fillRect(
            x + 3,
            0,
            2,
            h
        );

    }


    // ------------------------------------------------------
    // CROSS-WEAVE
    // ------------------------------------------------------

    for (

        let y = 7;

        y < h;

        y += 9

    ) {

        colorContext.fillStyle =
            'rgba(255,235,180,0.20)';


        colorContext.fillRect(
            0,
            y,
            width,
            1
        );


        bumpContext.fillStyle =
            '#a5a5a5';


        bumpContext.fillRect(
            0,
            y,
            width,
            1
        );

    }


    const colorTexture =
        new THREE.CanvasTexture(
            colorCanvas
        );


    colorTexture.colorSpace =
        THREE.SRGBColorSpace;


    colorTexture.wrapS =
        THREE.RepeatWrapping;


    colorTexture.wrapT =
        THREE.ClampToEdgeWrapping;


    colorTexture.repeat.set(
        8,
        1
    );


    colorTexture.anisotropy =
        renderer.capabilities
            .getMaxAnisotropy();


    const bumpTexture =
        new THREE.CanvasTexture(
            bumpCanvas
        );


    bumpTexture.colorSpace =
        THREE.NoColorSpace;


    bumpTexture.wrapS =
        THREE.RepeatWrapping;


    bumpTexture.wrapT =
        THREE.ClampToEdgeWrapping;


    bumpTexture.repeat.set(
        8,
        1
    );


    bumpTexture.anisotropy =
        renderer.capabilities
            .getMaxAnisotropy();


    return {

        colorTexture,

        bumpTexture

    };

}


// ==========================================================
// BINDING STRIPS
// ==========================================================

function createBindingStrip(
    row,
    inwardRow
) {

    const positionArray =
        new Float32Array(

            COLS *
            2 *
            3

        );


    const uvArray =
        new Float32Array(

            COLS *
            2 *
            2

        );


    const indices =
        [];


    for (

        let x = 0;

        x < COLS;

        x++

    ) {

        const u =

            x /
            (
                COLS -
                1
            );


        const innerVertex =
            x *
            2;


        const outerVertex =
            innerVertex +
            1;


        uvArray[
            innerVertex *
            2
        ] =
            u;


        uvArray[
            innerVertex *
            2 +
            1
        ] =
            0;


        uvArray[
            outerVertex *
            2
        ] =
            u;


        uvArray[
            outerVertex *
            2 +
            1
        ] =
            1;

    }


    for (

        let x = 0;

        x < COLS - 1;

        x++

    ) {

        const a =
            x *
            2;


        const b =
            a +
            1;


        const c =
            a +
            2;


        const d =
            a +
            3;


        indices.push(

            a,
            b,
            c,

            c,
            b,
            d

        );

    }


    const stripGeometry =
        new THREE.BufferGeometry();


    const stripPositions =
        new THREE.BufferAttribute(

            positionArray,

            3

        );


    stripPositions.setUsage(
        THREE.DynamicDrawUsage
    );


    stripGeometry.setAttribute(

        'position',

        stripPositions

    );


    stripGeometry.setAttribute(

        'uv',

        new THREE.BufferAttribute(

            uvArray,

            2

        )

    );


    stripGeometry.setIndex(
        indices
    );


    const {

        colorTexture,

        bumpTexture

    } =
        createBindingTextures();


    const material =
        new THREE.MeshPhysicalMaterial({

            map:
                colorTexture,


            bumpMap:
                bumpTexture,


            bumpScale:
                0.028,


            color:
                0xffffff,


            roughness:
                0.55,


            metalness:
                0.02,


            sheen:
                0.72,


            sheenColor:
                new THREE.Color(
                    0xffdf9a
                ),


            sheenRoughness:
                0.48,


            specularIntensity:
                0.50,


            specularColor:
                new THREE.Color(
                    0xffe6af
                ),


            envMapIntensity:
                0.18,


            side:
                THREE.DoubleSide

        });


    const mesh =
        new THREE.Mesh(

            stripGeometry,

            material

        );


    mesh.castShadow =
        true;


    mesh.receiveShadow =
        true;


    mesh.frustumCulled =
        false;


    scene.add(
        mesh
    );


    return {

        row,

        inwardRow,

        geometry:
            stripGeometry,

        positions:
            stripPositions,

        mesh

    };

}


// ==========================================================
// GET LOCAL FRAME FOR RUG END
// ==========================================================

function getEndFrame(
    row,
    inwardRow,
    xIndex
) {

    const edgeIndex =
        indexOf(
            xIndex,
            row
        );


    const innerIndex =
        indexOf(
            xIndex,
            inwardRow
        );


    const edge =
        new THREE.Vector3();


    const inner =
        new THREE.Vector3();


    getVertex(
        edgeIndex,
        edge
    );


    getVertex(
        innerIndex,
        inner
    );


    const leftX =
        Math.max(
            0,
            xIndex - 1
        );


    const rightX =
        Math.min(
            COLS - 1,
            xIndex + 1
        );


    const left =
        new THREE.Vector3();


    const right =
        new THREE.Vector3();


    getVertex(

        indexOf(
            leftX,
            row
        ),

        left

    );


    getVertex(

        indexOf(
            rightX,
            row
        ),

        right

    );


    const tangent2 =
        normalize2(

            right.x -
            left.x,

            right.y -
            left.y,

            1,
            0

        );


    const inward2 =
        normalize2(

            inner.x -
            edge.x,

            inner.y -
            edge.y,

            0,

            row === 0

                ?

                -1

                :

                1

        );


    return {

        anchor:
            edge,


        tangentX:
            tangent2.x,


        tangentY:
            tangent2.y,


        outwardX:
            -inward2.x,


        outwardY:
            -inward2.y

    };

}


// ==========================================================
// UPDATE BINDING STRIP
// ==========================================================

function updateBindingStrip(
    strip
) {

    const out =
        strip
            .positions
            .array;


    for (

        let x = 0;

        x < COLS;

        x++

    ) {

        const frame =
            getEndFrame(

                strip.row,

                strip.inwardRow,

                x

            );


        const dst =
            x *
            6;


        // --------------------------------------------------
        // INNER EDGE
        // --------------------------------------------------

        out[
            dst
        ] =

            frame.anchor.x

            -

            frame.outwardX *
            0.006;


        out[
            dst + 1
        ] =

            frame.anchor.y

            -

            frame.outwardY *
            0.006;


        out[
            dst + 2
        ] =

            frame.anchor.z

            +

            BINDING_LIFT;


        // --------------------------------------------------
        // OUTER EDGE
        // --------------------------------------------------

        out[
            dst + 3
        ] =

            frame.anchor.x

            +

            frame.outwardX *
            BINDING_WIDTH;


        out[
            dst + 4
        ] =

            frame.anchor.y

            +

            frame.outwardY *
            BINDING_WIDTH;


        out[
            dst + 5
        ] =

            frame.anchor.z

            +

            BINDING_LIFT;

    }


    strip.positions.needsUpdate =
        true;


    strip.geometry.computeVertexNormals();

}


// ==========================================================
// BUILD 3D TASSEL BUNDLES
// ==========================================================

function buildTasselBundles() {

    tasselBundles =
        [];


    const endDefinitions = [

        {

            row:
                0,

            inwardRow:
                1,

            seedBase:
                10000

        },

        {

            row:
                ROWS - 1,

            inwardRow:
                ROWS - 2,

            seedBase:
                30000

        }

    ];


    for (
        const end of endDefinitions
    ) {

        for (

            let bundleIndex = 0;

            bundleIndex <
            TASSEL_BUNDLES_PER_END;

            bundleIndex++

        ) {

            const xIndex =
                sampleGridIndex(

                    bundleIndex,

                    TASSEL_BUNDLES_PER_END,

                    COLS - 1

                );


            const bundleSeed =

                end.seedBase

                +

                bundleIndex *
                97;


            const bundle = {

                row:
                    end.row,


                inwardRow:
                    end.inwardRow,


                xIndex,


                swayT:
                    0,


                swayO:
                    0,


                velT:
                    0,


                velO:
                    0,


                threads:
                    []

            };


            for (

                let threadIndex = 0;

                threadIndex <
                THREADS_PER_BUNDLE;

                threadIndex++

            ) {

                const seed =

                    bundleSeed

                    +

                    threadIndex *
                    17;


                const spacing =

                    THREADS_PER_BUNDLE <=
                    1

                        ?

                        0

                        :

                        (
                            threadIndex /
                            (
                                THREADS_PER_BUNDLE -
                                1
                            )

                            -

                            0.5
                        )

                        *

                        2;


                bundle.threads.push({

                    lateral:

                        spacing *
                        BUNDLE_HALF_WIDTH

                        +

                        (
                            pseudoRandom(
                                seed + 1
                            )

                            -

                            0.5
                        )

                        *

                        0.014,


                    length:

                        lerp(

                            TASSEL_MIN_LENGTH,

                            TASSEL_MAX_LENGTH,

                            pseudoRandom(
                                seed + 2
                            )

                        ),


                    radius:

                        lerp(

                            THREAD_MIN_RADIUS,

                            THREAD_MAX_RADIUS,

                            pseudoRandom(
                                seed + 3
                            )

                        ),


                    lean:

                        (
                            pseudoRandom(
                                seed + 4
                            )

                            -

                            0.5
                        )

                        *

                        0.090,


                    curve:

                        (
                            pseudoRandom(
                                seed + 5
                            )

                            -

                            0.5
                        )

                        *

                        0.070,


                    depth:

                        (
                            pseudoRandom(
                                seed + 6
                            )

                            -

                            0.5
                        )

                        *

                        TASSEL_DEPTH_CURVE,


                    droop:

                        lerp(

                            0.018,

                            TASSEL_MAX_DROOP,

                            pseudoRandom(
                                seed + 7
                            )

                        )

                });

            }


            tasselBundles.push(
                bundle
            );

        }

    }

}


// ==========================================================
// CREATE INSTANCED 3D THREADS
// ==========================================================

function createTasselMesh() {

    buildTasselBundles();


    const segmentGeometry =
        new THREE.CylinderGeometry(

            1,

            1,

            1,

            6,

            1,

            false

        );


    const material =
        new THREE.MeshPhysicalMaterial({

            color:
                0xcaa35b,


            roughness:
                0.46,


            metalness:
                0.03,


            sheen:
                0.88,


            sheenColor:
                new THREE.Color(
                    0xffe8ae
                ),


            sheenRoughness:
                0.38,


            specularIntensity:
                0.68,


            specularColor:
                new THREE.Color(
                    0xffe9b8
                ),


            envMapIntensity:
                0.30

        });


    tasselMesh =
        new THREE.InstancedMesh(

            segmentGeometry,

            material,

            THREAD_INSTANCE_COUNT

        );


    tasselMesh
        .instanceMatrix
        .setUsage(
            THREE.DynamicDrawUsage
        );


    tasselMesh.castShadow =
        true;


    tasselMesh.receiveShadow =
        true;


    tasselMesh.frustumCulled =
        false;


    scene.add(
        tasselMesh
    );


    updateTasselMesh();

}


// ==========================================================
// TASSEL SPRING PHYSICS
// ==========================================================

function updateTasselPhysics(
    dt
) {

    const safeDt =

        Math.min(
            dt,
            1 / 30
        );


    for (
        const bundle of tasselBundles
    ) {

        const frame =
            getEndFrame(

                bundle.row,

                bundle.inwardRow,

                bundle.xIndex

            );


        const dx =

            frame.anchor.x -
            smoothPointerX;


        const dy =

            frame.anchor.y -
            smoothPointerY;


        const distSq =

            dx *
            dx

            +

            dy *
            dy;


        const influence =

            pointerActive &&
            hasSmoothPointer

                ?

                Math.exp(

                    -distSq /

                    (
                        2 *

                        TASSEL_INFLUENCE_RADIUS *

                        TASSEL_INFLUENCE_RADIUS
                    )

                )

                *

                interactionPresence

                :

                0;


        const tangentMotion =

            motionDirX *
            frame.tangentX

            +

            motionDirY *
            frame.tangentY;


        const outwardMotion =

            motionDirX *
            frame.outwardX

            +

            motionDirY *
            frame.outwardY;


        const energy =

            influence

            *

            (
                0.18

                +

                0.82 *
                visualSpeed01
            );


        const targetT =

            tangentMotion

            *

            TASSEL_MOUSE_TANGENT

            *

            energy;


        const targetO =

            outwardMotion

            *

            TASSEL_MOUSE_OUTWARD

            *

            energy;


        const accelT =

            (
                targetT -
                bundle.swayT
            )

            *

            TASSEL_SPRING

            -

            bundle.velT *
            TASSEL_DAMPING;


        const accelO =

            (
                targetO -
                bundle.swayO
            )

            *

            TASSEL_SPRING

            -

            bundle.velO *
            TASSEL_DAMPING;


        bundle.velT +=

            accelT *
            safeDt;


        bundle.velO +=

            accelO *
            safeDt;


        bundle.swayT +=

            bundle.velT *
            safeDt;


        bundle.swayO +=

            bundle.velO *
            safeDt;

    }

}


// ==========================================================
// THREAD CONTROL POINT
// ==========================================================

function getThreadPoint(

    frame,

    thread,

    bundle,

    progress,

    target

) {

    const rootX =

        frame.anchor.x

        +

        frame.outwardX *
        (
            BINDING_WIDTH +
            TASSEL_ROOT_OUTSET
        )

        +

        frame.tangentX *
        thread.lateral;


    const rootY =

        frame.anchor.y

        +

        frame.outwardY *
        (
            BINDING_WIDTH +
            TASSEL_ROOT_OUTSET
        )

        +

        frame.tangentY *
        thread.lateral;


    const rootZ =

        frame.anchor.z

        +

        0.004;


    const ease =

        progress *
        progress *

        (
            3 -
            2 *
            progress
        );


    const arc =

        Math.sin(

            progress *
            Math.PI

        );


    const tangentOffset =

        thread.lean *
        progress

        +

        thread.curve *
        arc

        +

        bundle.swayT *
        Math.pow(
            progress,
            1.45
        );


    const outwardDistance =

        thread.length *
        progress

        +

        bundle.swayO *
        Math.pow(
            progress,
            1.30
        );


    const zOffset =

        -thread.droop *
        Math.pow(
            progress,
            1.6
        )

        +

        thread.depth *
        arc

        +

        Math.abs(
            bundle.swayT
        )

        *

        0.035 *
        arc;


    target.set(

        rootX

        +

        frame.outwardX *
        outwardDistance

        +

        frame.tangentX *
        tangentOffset,


        rootY

        +

        frame.outwardY *
        outwardDistance

        +

        frame.tangentY *
        tangentOffset,


        rootZ

        +

        zOffset *
        ease

    );


    return target;

}


// ==========================================================
// SET ONE CYLINDER INSTANCE BETWEEN TWO POINTS
// ==========================================================

function setCylinderInstance(

    index,

    start,

    end,

    radius

) {

    tempDir.subVectors(
        end,
        start
    );


    const length =
        tempDir.length();


    if (
        length <
        0.000001
    ) {

        tempMatrix.identity();


        tasselMesh.setMatrixAt(

            index,

            tempMatrix

        );


        return;

    }


    tempDir.normalize();


    tempMid
        .addVectors(
            start,
            end
        )
        .multiplyScalar(
            0.5
        );


    tempQuat.setFromUnitVectors(

        Y_AXIS,

        tempDir

    );


    tempScale.set(

        radius,

        length,

        radius

    );


    tempMatrix.compose(

        tempMid,

        tempQuat,

        tempScale

    );


    tasselMesh.setMatrixAt(

        index,

        tempMatrix

    );

}


// ==========================================================
// UPDATE 3D TASSEL THREADS
// ==========================================================

function updateTasselMesh() {

    if (
        !tasselMesh
    ) {

        return;

    }


    let instanceIndex =
        0;


    const p0 =
        new THREE.Vector3();


    const p1 =
        new THREE.Vector3();


    const p2 =
        new THREE.Vector3();


    const p3 =
        new THREE.Vector3();


    for (
        const bundle of tasselBundles
    ) {

        const frame =
            getEndFrame(

                bundle.row,

                bundle.inwardRow,

                bundle.xIndex

            );


        for (
            const thread of bundle.threads
        ) {

            getThreadPoint(

                frame,

                thread,

                bundle,

                0.00,

                p0

            );


            getThreadPoint(

                frame,

                thread,

                bundle,

                0.34,

                p1

            );


            getThreadPoint(

                frame,

                thread,

                bundle,

                0.67,

                p2

            );


            getThreadPoint(

                frame,

                thread,

                bundle,

                1.00,

                p3

            );


            setCylinderInstance(

                instanceIndex++,

                p0,

                p1,

                thread.radius *
                1.05

            );


            setCylinderInstance(

                instanceIndex++,

                p1,

                p2,

                thread.radius

            );


            setCylinderInstance(

                instanceIndex++,

                p2,

                p3,

                thread.radius *
                0.88

            );

        }

    }


    tasselMesh
        .instanceMatrix
        .needsUpdate =
        true;

}


// ==========================================================
// UPDATE CLOTH GEOMETRY
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
        RUG_WIDTH /
        2;


    const halfHeight =
        RUG_HEIGHT /
        2;


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

                    ?

                    foldLength *
                    1.25

                    :

                    foldLength *
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

                fold1 *
                0.68

                +

                fold2 *
                0.32;


            foldZ =

                combinedFold

                *

                foldAmplitude

                *

                envelope

                *

                edgeFade;


            const dragEnvelope =

                envelope *
                edgeFade;


            finalX +=

                motionDirX

                *

                dragAmount

                *

                dragEnvelope;


            finalY +=

                motionDirY

                *

                dragAmount

                *

                dragEnvelope;

        }


        positions.setXYZ(

            i,

            finalX,

            finalY,

            restZ[i]

            +

            height[i]

            +

            foldZ

        );

    }


    positions.needsUpdate =
        true;


    geometry.computeVertexNormals();


    updateDynamicOcclusion();


    updateBindingStrip(
        endA_Binding
    );


    updateBindingStrip(
        endB_Binding
    );

}


// ==========================================================
// CREATE RUG
// ==========================================================

async function createRug() {

    const [
        silkMaps,
        normalMap
    ] =
        await Promise.all([

            createV10SilkMaps(),

            loadTexture(
                './textures/rug_normal.png'
            )

        ]);


    normalMap.colorSpace =
        THREE.NoColorSpace;


    configureTexture(
        normalMap
    );


    geometry =
        new THREE.PlaneGeometry(

            RUG_WIDTH,

            RUG_HEIGHT,

            SEGMENTS_X,

            SEGMENTS_Y

        );


    const colorArray =
        new Float32Array(

            geometry
                .attributes
                .position
                .count

            *

            3

        );


    colorArray.fill(
        1.0
    );


    vertexColors =
        new THREE.BufferAttribute(

            colorArray,

            3

        );


    vertexColors.setUsage(
        THREE.DynamicDrawUsage
    );


    geometry.setAttribute(

        'color',

        vertexColors

    );


    const material =
        new THREE.MeshPhysicalMaterial({

            map:
                silkMaps.colorTexture,


            metalness:
                1.0,


            metalnessMap:
                silkMaps.metalnessTexture,


            roughness:
                1.0,


            roughnessMap:
                silkMaps.roughnessTexture,


            normalMap:
                normalMap,


            normalScale:
                new THREE.Vector2(
                    0.8,
                    -0.8
                ),


            anisotropy:
                SILK_ANISOTROPY,


            anisotropyRotation:
                SILK_ANISOTROPY_ROTATION,


            sheen:
                SILK_SHEEN,


            sheenColor:
                new THREE.Color(
                    0xd1a987
                ),


            sheenRoughness:
                SILK_SHEEN_ROUGHNESS,


            specularIntensity:
                0.58,


            specularColor:
                new THREE.Color(
                    0xffead2
                ),


            clearcoat:
                0,


            envMapIntensity:
                ENVIRONMENT_INTENSITY,


            vertexColors:
                true,


            side:
                THREE.DoubleSide

        });


    material.shadowSide =
        THREE.DoubleSide;


    rug =
        new THREE.Mesh(

            geometry,

            material

        );


    rug.castShadow =
        true;


    rug.receiveShadow =
        true;


    rug.frustumCulled =
        false;


    scene.add(
        rug
    );


    initializeClothPhysics();


    // ------------------------------------------------------
    // TWO DECORATIVE TASSEL ENDS
    // ------------------------------------------------------

    endA_Binding =
        createBindingStrip(
            0,
            1
        );


    endB_Binding =
        createBindingStrip(
            ROWS - 1,
            ROWS - 2
        );


    createTasselMesh();


    updateGeometry();


    updateTasselMesh();


    window.rug =
        rug;


    window.rugMaterial =
        material;


    window.porphyraMaps =
        silkMaps;


    window.porphyraTassels = {

        mesh:
            tasselMesh,

        bundles:
            tasselBundles,

        endA_Binding,

        endB_Binding

    };


    window.porphyraLights = {

        warmAreaKey,

        shadowKey,

        coolFill,

        rimLight

    };


    console.log(
        'PORPHYRA Cloth v12.0 — 3D SILK TASSEL BUNDLES LOADED'
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


    // Include tassels in camera framing.
    const displayHeight =

        RUG_HEIGHT

        +

        2 *

        (
            BINDING_WIDTH

            +

            TASSEL_MAX_LENGTH

            +

            0.12
        );


    const displayWidth =
        RUG_WIDTH;


    const distanceForHeight =

        (
            displayHeight /
            2
        )

        /

        Math.tan(
            fov /
            2
        );


    const distanceForWidth =

        (
            displayWidth /
            2
        )

        /

        (
            Math.tan(
                fov /
                2
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

        distance *
        1.08

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
        'PORPHYRA Cloth v12.0 loaded'
    );

}
catch (
    error
) {

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


        if (
            rug
        ) {

            // Main cloth first.
            updateGeometry();


            // Then tassel spring physics.
            updateTasselPhysics(
                frameTime
            );


            // Then rebuild visible thread positions.
            updateTasselMesh();

        }


        renderer.render(

            scene,

            camera

        );

    }

);
