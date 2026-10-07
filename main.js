import * as THREE from 'three';

import {
    RoomEnvironment
} from 'three/addons/environments/RoomEnvironment.js';

import {
    RectAreaLightUniformsLib
} from 'three/addons/lights/RectAreaLightUniformsLib.js';


// ==========================================================
// PORPHYRA — INTERACTIVE CLOTH v14.0
// PRE-BAKED PRODUCTION MATERIAL
//
// PERFORMANCE CHANGE:
//
// v13.2 generated the finished material in the visitor's
// browser:
//
// rug_basecolor.png
// + rug_mask.png
// + millions of JavaScript pixel operations
// + several CanvasTexture creations.
//
// v14.0 moves all of that work offline.
//
// Runtime now loads only:
//
// 1. porphyra_color.png
//
// 2. porphyra_material.png
//      G = roughness
//      B = metalness
//
// 3. rug_normal.png
//
// This preserves the v13.2 appearance while eliminating
// all runtime texture baking.
// ==========================================================


// ==========================================================
// RUG
// ==========================================================

const RUG_WIDTH =
    9.4;


const RUG_HEIGHT =
    5.3;


const SEGMENTS_X =
    64;


const SEGMENTS_Y =
    36;


const COLS =
    SEGMENTS_X +
    1;


const ROWS =
    SEGMENTS_Y +
    1;


// ==========================================================
// PRE-BAKED TEXTURE FILES — v14
// ==========================================================

const COLOR_TEXTURE_PATH =
    './textures/porphyra_color.png?v=140';


const MATERIAL_TEXTURE_PATH =
    './textures/porphyra_material.png?v=140';


const NORMAL_TEXTURE_PATH =
    './textures/rug_normal.png?v=140';


// ==========================================================
// EDGE BREAKOUT
// ==========================================================

const EDGE_FADE_X =
    0.42;


const EDGE_FADE_Y =
    0.22;


const TOP_BOTTOM_OVERSHOOT =
    0.030;


// ==========================================================
// CAMERA PADDING
// ==========================================================

const CAMERA_PADDING_X =
    1.04;


const CAMERA_PADDING_Y =
    1.10;


// ==========================================================
// INTEGRATED BORDER
// ==========================================================

const BORDER_WIDTH =
    0.17;


const BORDER_FEATHER =
    0.018;


const BORDER_INNER_LINE_WIDTH =
    0.022;


const BORDER_COLOR =
    new THREE.Color(
        0x271329
    );


const BORDER_INNER_LINE_COLOR =
    new THREE.Color(
        0x593044
    );


const BORDER_OUTER_EDGE_COLOR =
    new THREE.Color(
        0x100812
    );


// ==========================================================
// STATIC EDGE PROFILE
// ==========================================================

const EDGE_RIDGE_HEIGHT =
    0.022;


const EDGE_RIDGE_CENTER =
    0.072;


const EDGE_RIDGE_SIGMA =
    0.050;


const EDGE_LIP_DROP =
    0.0045;


const EDGE_LIP_SIGMA =
    0.026;


const EDGE_IRREGULARITY =
    0.010;


const EDGE_IRREGULARITY_FADE =
    0.20;


// ==========================================================
// TEXTURE SCALE
// ==========================================================

const REPEAT_Y =
    1.6;


const REPEAT_X =

    REPEAT_Y

    *

    (
        RUG_WIDTH /
        RUG_HEIGHT
    );


// ==========================================================
// SILK MATERIAL
// ==========================================================

const SILK_ANISOTROPY =
    0.68;


const SILK_ANISOTROPY_ROTATION =
    0.0;


const SILK_SHEEN =
    0.82;


const SILK_SHEEN_ROUGHNESS =
    0.48;


const ENVIRONMENT_INTENSITY =
    0.22;


// ==========================================================
// DYNAMIC FOLD OCCLUSION
// ==========================================================

const VALLEY_DARKEN_STRENGTH =
    0.28;


const CREST_LIGHTEN_STRENGTH =
    0.02;


const CURVATURE_START =
    0.010;


const CURVATURE_END =
    0.060;


// ==========================================================
// CLOTH PHYSICS
// ==========================================================

const TENSION =
    0.26;


const RESTORE_FORCE =
    0.035;


const DAMPING =
    0.92;


const POINTER_FOLLOW_SPEED =
    38;


const SPEED_SMOOTHING =
    8;


const DIRECTION_UPDATE_THRESHOLD =
    0.28;


const DIRECTION_FOLLOW_SPEED =
    10;


const SPEED_DEADZONE =
    0.12;


const SPEED_FULL_EFFECT =
    5.0;


const MIN_BULGE =
    0.045;


const MIN_RADIUS =
    0.55;


const MIN_POINTER_STIFFNESS =
    0.070;


const MAX_BULGE =
    0.58;


const MAX_RADIUS =
    0.92;


const MAX_POINTER_STIFFNESS =
    0.17;


const SLOW_POINTER_DAMPING =
    0.55;


const FAST_POINTER_DAMPING =
    0.16;


const MIN_FOLD_AMPLITUDE =
    0.007;


const MAX_FOLD_AMPLITUDE =
    0.070;


const MIN_FOLD_LENGTH =
    0.80;


const MAX_FOLD_LENGTH =
    1.60;


const MIN_FOLD_WIDTH =
    0.42;


const MAX_FOLD_WIDTH =
    0.82;


const FOLD_FREQUENCY_1 =
    7.0;


const FOLD_FREQUENCY_2 =
    4.2;


const MIN_DRAG_AMOUNT =
    0.002;


const MAX_DRAG_AMOUNT =
    0.060;


// ==========================================================
// FIXED PHYSICS TIMESTEP
// ==========================================================

const FIXED_TIMESTEP =
    1 / 120;


const MAX_SUBSTEPS =
    5;


let physicsAccumulator =
    0;


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

        Math.PI /
        3.25,

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


// ----------------------------------------------------------
// LOW GRAZING EDGE LIGHT
// ----------------------------------------------------------

const edgeGraze =
    new THREE.RectAreaLight(

        0xffc58a,

        2.2,

        7.0,

        0.85

    );


edgeGraze.position.set(

    -5.6,

    -1.6,

    0.72

);


edgeGraze.lookAt(

    0.6,

    0.15,

    0.0

);


scene.add(
    edgeGraze
);


// ----------------------------------------------------------
// SUBTLE OPPOSITE EDGE SEPARATION
// ----------------------------------------------------------

const edgeGrazeFill =
    new THREE.RectAreaLight(

        0xb9c8ff,

        0.22,

        5.5,

        0.9

    );


edgeGrazeFill.position.set(

    5.2,

    2.2,

    0.75

);


edgeGrazeFill.lookAt(

    -0.5,

    -0.15,

    0.0

);


scene.add(
    edgeGrazeFill
);


// ==========================================================
// TEXTURE LOADING
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


// ----------------------------------------------------------
// SHARED TEXTURE CONFIGURATION
// ----------------------------------------------------------

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
// LOAD PRE-BAKED MATERIAL — v14
// ==========================================================

async function loadPorphyraMaterialMaps() {

    const [

        colorTexture,

        materialTexture,

        normalTexture

    ] =
        await Promise.all([

            loadTexture(
                COLOR_TEXTURE_PATH
            ),

            loadTexture(
                MATERIAL_TEXTURE_PATH
            ),

            loadTexture(
                NORMAL_TEXTURE_PATH
            )

        ]);


    // ------------------------------------------------------
    // COLOR MAP
    // ------------------------------------------------------

    colorTexture.colorSpace =
        THREE.SRGBColorSpace;


    configureTexture(
        colorTexture
    );


    // ------------------------------------------------------
    // PACKED MATERIAL MAP
    //
    // GREEN = roughness
    // BLUE  = metalness
    // ------------------------------------------------------

    materialTexture.colorSpace =
        THREE.NoColorSpace;


    configureTexture(
        materialTexture
    );


    // ------------------------------------------------------
    // NORMAL MAP
    // ------------------------------------------------------

    normalTexture.colorSpace =
        THREE.NoColorSpace;


    configureTexture(
        normalTexture
    );


    return {

        colorTexture,

        materialTexture,

        normalTexture

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

        a

        +

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
        t

        *

        (
            3 -
            2 * t
        )

    );

}


function gaussian(
    value,
    center,
    sigma
) {

    const d =

        (
            value -
            center
        )

        /

        sigma;


    return Math.exp(

        -(d * d)

    );

}


function edgeDistanceForPoint(
    x,
    y
) {

    const dx =

        RUG_WIDTH *
        0.5

        -

        Math.abs(
            x
        );


    const dy =

        RUG_HEIGHT *
        0.5

        -

        Math.abs(
            y
        );


    return Math.max(

        0,

        Math.min(

            dx,

            dy

        )

    );

}


// ==========================================================
// STATIC EDGE PROFILE
// ==========================================================

function edgeProfileHeight(
    x,
    y
) {

    const d =
        edgeDistanceForPoint(
            x,
            y
        );


    const ridge =

        gaussian(

            d,

            EDGE_RIDGE_CENTER,

            EDGE_RIDGE_SIGMA

        )

        *

        EDGE_RIDGE_HEIGHT;


    const outerLip =

        gaussian(

            d,

            0.0,

            EDGE_LIP_SIGMA

        )

        *

        EDGE_LIP_DROP;


    return (

        ridge

        -

        outerLip

    );

}


// ==========================================================
// SUBTLE PERIMETER IRREGULARITY
// ==========================================================

function edgeIrregularity(
    x,
    y
) {

    const halfWidth =

        RUG_WIDTH *
        0.5;


    const halfHeight =

        RUG_HEIGHT *
        0.5;


    const dx =

        halfWidth

        -

        Math.abs(
            x
        );


    const dy =

        halfHeight

        -

        Math.abs(
            y
        );


    const d =
        Math.min(

            dx,

            dy

        );


    const fade =

        1.0

        -

        smoothstep01(

            d /
            EDGE_IRREGULARITY_FADE

        );


    let offsetX =
        0;


    let offsetY =
        0;


    // ------------------------------------------------------
    // LEFT / RIGHT EDGE
    // ------------------------------------------------------

    if (
        dx <
        dy
    ) {

        const along =
            y;


        const wave =

            Math.sin(

                along *
                2.85

                +

                0.6

            )

            *

            0.58

            +

            Math.sin(

                along *
                6.9

                +

                1.7

            )

            *

            0.29

            +

            Math.sin(

                along *
                12.3

                +

                0.2

            )

            *

            0.13;


        offsetX =

            Math.sign(
                x || 1
            )

            *

            EDGE_IRREGULARITY

            *

            wave

            *

            fade;

    }


    // ------------------------------------------------------
    // TOP / BOTTOM EDGE
    // ------------------------------------------------------

    else {

        const along =
            x;


        const wave =

            Math.sin(

                along *
                2.35

                +

                1.2

            )

            *

            0.55

            +

            Math.sin(

                along *
                5.8

                +

                0.3

            )

            *

            0.30

            +

            Math.sin(

                along *
                10.7

                +

                2.1

            )

            *

            0.15;


        offsetY =

            Math.sign(
                y || 1
            )

            *

            EDGE_IRREGULARITY

            *

            wave

            *

            fade;

    }


    return {

        x:
            offsetX,

        y:
            offsetY

    };

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

        wave1

        +

        wave2

        +

        wave3

        +

        edgeProfileHeight(
            x,
            y
        )

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


        const irregular =
            edgeIrregularity(
                x,
                y
            );


        positions.setXYZ(

            i,

            x +
            irregular.x,

            y +
            irregular.y,

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

        raycaster.ray
            .intersectPlane(

                interactionPlane,

                intersection

            );


    if (
        !hit
    ) {

        pointerActive =
            false;


        return;

    }


    const inside =

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


    if (
        !inside
    ) {

        pointerActive =
            false;


        return;

    }


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

        dx

        /

        Math.max(

            dt,

            0.0001

        );


    const instantaneousVY =

        dy

        /

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


    // ------------------------------------------------------
    // SPRINGS
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
                    height[left]

                    +

                    height[right]

                    +

                    height[down]

                    +

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

                -height[i]

                *

                RESTORE_FORCE;

        }

    }


    // ------------------------------------------------------
    // POINTER FORCE
    // ------------------------------------------------------

    if (

        pointerActive

        &&

        hasSmoothPointer

    ) {

        const effect =
            getPointerEffect();


        const radiusSquared =

            effect.radius

            *

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

                    restX[i]

                    -

                    smoothPointerX;


                const dy =

                    restY[i]

                    -

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

                        effect.bulge

                        *

                        influence;


                    const error =

                        targetHeight

                        -

                        height[i];


                    acceleration[i] +=

                        error

                        *

                        effect.stiffness;


                    acceleration[i] -=

                        velocity[i]

                        *

                        effect.localDamping

                        *

                        influence;

                }

            }

        }

    }


    // ------------------------------------------------------
    // INTEGRATION
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

                acceleration[i]

                *

                step;


            velocity[i] *=
                frameDamping;


            height[i] +=

                velocity[i]

                *

                step;

        }

    }


    // ------------------------------------------------------
    // PIN PERIMETER HEIGHT
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
// DYNAMIC FOLD OCCLUSION
// ==========================================================

function updateDynamicOcclusion() {

    if (

        !positions

        ||

        !vertexColors

        ||

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

                x > 0

                &&

                x < COLS - 1

                &&

                y > 0

                &&

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
                        leftDisp

                        +

                        rightDisp

                        +

                        downDisp

                        +

                        upDisp
                    )

                    *

                    0.25;


                const curvature =

                    neighborAverage

                    -

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

                    halfWidth

                    -

                    Math.abs(
                        restX[i]
                    );


                const edgeDistanceY =

                    halfHeight

                    -

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
// INTEGRATED BORDER SHADER
// ==========================================================

function installIntegratedBorder(
    material
) {

    material.onBeforeCompile =
        shader => {

            shader.uniforms.uRugHalfSize = {

                value:
                    new THREE.Vector2(

                        RUG_WIDTH *
                        0.5,

                        RUG_HEIGHT *
                        0.5

                    )

            };


            shader.uniforms.uBorderWidth = {

                value:
                    BORDER_WIDTH

            };


            shader.uniforms.uBorderFeather = {

                value:
                    BORDER_FEATHER

            };


            shader.uniforms.uBorderInnerLineWidth = {

                value:
                    BORDER_INNER_LINE_WIDTH

            };


            shader.uniforms.uBorderColor = {

                value:
                    BORDER_COLOR.clone()

            };


            shader.uniforms.uBorderInnerLineColor = {

                value:
                    BORDER_INNER_LINE_COLOR.clone()

            };


            shader.uniforms.uBorderOuterEdgeColor = {

                value:
                    BORDER_OUTER_EDGE_COLOR.clone()

            };


            // --------------------------------------------------
            // LOCAL XY
            // --------------------------------------------------

            shader.vertexShader =

                shader.vertexShader.replace(

                    '#include <common>',

                    `#include <common>
                    varying vec2 vPorphyraLocalXY;`

                );


            shader.vertexShader =

                shader.vertexShader.replace(

                    '#include <begin_vertex>',

                    `#include <begin_vertex>
                    vPorphyraLocalXY = position.xy;`

                );


            shader.fragmentShader =

                shader.fragmentShader.replace(

                    '#include <common>',

                    `#include <common>
                    varying vec2 vPorphyraLocalXY;
                    uniform vec2 uRugHalfSize;
                    uniform float uBorderWidth;
                    uniform float uBorderFeather;
                    uniform float uBorderInnerLineWidth;
                    uniform vec3 uBorderColor;
                    uniform vec3 uBorderInnerLineColor;
                    uniform vec3 uBorderOuterEdgeColor;`

                );


            // --------------------------------------------------
            // BORDER
            // --------------------------------------------------

            shader.fragmentShader =

                shader.fragmentShader.replace(

                    '#include <map_fragment>',

                    `#include <map_fragment>

                    float porphyraDx =
                        uRugHalfSize.x -
                        abs(vPorphyraLocalXY.x);

                    float porphyraDy =
                        uRugHalfSize.y -
                        abs(vPorphyraLocalXY.y);

                    float porphyraEdgeDistance =
                        min(
                            porphyraDx,
                            porphyraDy
                        );

                    float porphyraBorderMask =
                        1.0 -
                        smoothstep(
                            uBorderWidth -
                            uBorderFeather,
                            uBorderWidth +
                            uBorderFeather,
                            porphyraEdgeDistance
                        );

                    float porphyraOuterMask =
                        1.0 -
                        smoothstep(
                            0.010,
                            0.050,
                            porphyraEdgeDistance
                        );

                    float porphyraInnerLine =
                        1.0 -
                        smoothstep(
                            0.0,
                            uBorderInnerLineWidth,
                            abs(
                                porphyraEdgeDistance -
                                uBorderWidth
                            )
                        );

                    diffuseColor.rgb =
                        mix(
                            diffuseColor.rgb,
                            uBorderColor,
                            porphyraBorderMask *
                            0.97
                        );

                    diffuseColor.rgb =
                        mix(
                            diffuseColor.rgb,
                            uBorderOuterEdgeColor,
                            porphyraOuterMask *
                            0.52
                        );

                    diffuseColor.rgb =
                        mix(
                            diffuseColor.rgb,
                            uBorderInnerLineColor,
                            porphyraInnerLine *
                            0.58
                        );`

                );


            material.userData
                .porphyraBorderShader =
                shader;

        };


    material.customProgramCacheKey =
        () =>
            'porphyra-v14-prebaked';

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


        const irregular =
            edgeIrregularity(

                baseX,

                baseY

            );


        let finalX =

            baseX

            +

            irregular.x;


        let finalY =

            baseY

            +

            irregular.y;


        let foldZ =
            0;


        const edgeDistanceX =

            halfWidth

            -

            Math.abs(
                baseX
            );


        const edgeDistanceY =

            halfHeight

            -

            Math.abs(
                baseY
            );


        const edgeFadeX =

            smoothstep01(

                edgeDistanceX /
                EDGE_FADE_X

            );


        const edgeFadeY =

            smoothstep01(

                edgeDistanceY /
                EDGE_FADE_Y

            );


        const edgeFade =

            Math.min(

                edgeFadeX,

                edgeFadeY

            );


        if (

            interactionPresence >
            0.001

        ) {

            const dx =

                baseX

                -

                smoothPointerX;


            const dy =

                baseY

                -

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

                envelope

                *

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


            // --------------------------------------------------
            // TOP/BOTTOM SILHOUETTE BREAKOUT
            // --------------------------------------------------

            const topBottomInfluence =

                envelope

                *

                edgeFadeX

                *

                (
                    1.0 -
                    edgeFadeY
                );


            finalY +=

                Math.sign(
                    baseY
                )

                *

                TOP_BOTTOM_OVERSHOOT

                *

                topBottomInfluence

                *

                interactionPresence;

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

}


// ==========================================================
// CREATE RUG
// ==========================================================

async function createRug() {

    // ------------------------------------------------------
    // v14:
    // ONLY THREE FINISHED TEXTURES ARE LOADED.
    //
    // No ImageData.
    // No CanvasTexture generation.
    // No pixel loops.
    // No runtime recoloring.
    // ------------------------------------------------------

    const maps =
        await loadPorphyraMaterialMaps();


    geometry =
        new THREE.PlaneGeometry(

            RUG_WIDTH,

            RUG_HEIGHT,

            SEGMENTS_X,

            SEGMENTS_Y

        );


    // ------------------------------------------------------
    // DYNAMIC VERTEX COLORS
    // ------------------------------------------------------

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


    // ------------------------------------------------------
    // PHYSICAL SILK MATERIAL
    // ------------------------------------------------------

    const material =
        new THREE.MeshPhysicalMaterial({

            // ------------------------------------------------
            // PRE-BAKED PURPLE / GOLD COLOR
            // ------------------------------------------------

            map:
                maps.colorTexture,


            // ------------------------------------------------
            // PACKED MATERIAL MAP
            //
            // Three.js automatically reads:
            //
            // metalness = BLUE channel
            //
            // roughness = GREEN channel
            // ------------------------------------------------

            metalness:
                1.0,


            metalnessMap:
                maps.materialTexture,


            roughness:
                1.0,


            roughnessMap:
                maps.materialTexture,


            // ------------------------------------------------
            // MICRO WEAVE
            // ------------------------------------------------

            normalMap:
                maps.normalTexture,


            normalScale:
                new THREE.Vector2(

                    0.8,

                    -0.8

                ),


            // ------------------------------------------------
            // ANISOTROPIC SILK
            // ------------------------------------------------

            anisotropy:
                SILK_ANISOTROPY,


            anisotropyRotation:
                SILK_ANISOTROPY_ROTATION,


            // ------------------------------------------------
            // SILK SHEEN
            // ------------------------------------------------

            sheen:
                SILK_SHEEN,


            sheenColor:
                new THREE.Color(
                    0xd3ae78
                ),


            sheenRoughness:
                SILK_SHEEN_ROUGHNESS,


            // ------------------------------------------------
            // SPECULAR RESPONSE
            // ------------------------------------------------

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


    installIntegratedBorder(
        material
    );


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


    // ======================================================
    // DEBUG ACCESS
    // ======================================================

    window.rug =
        rug;


    window.rugMaterial =
        material;


    window.porphyraMaps = {

        colorTexture:
            maps.colorTexture,

        materialTexture:
            maps.materialTexture,

        normalTexture:
            maps.normalTexture

    };


    window.porphyraLights = {

        warmAreaKey,

        shadowKey,

        coolFill,

        rimLight,

        edgeGraze,

        edgeGrazeFill

    };


    window.porphyraEdge = {

        borderWidth:
            BORDER_WIDTH,

        ridgeHeight:
            EDGE_RIDGE_HEIGHT,

        ridgeCenter:
            EDGE_RIDGE_CENTER,

        irregularity:
            EDGE_IRREGULARITY,

        edgeFadeX:
            EDGE_FADE_X,

        edgeFadeY:
            EDGE_FADE_Y,

        topBottomOvershoot:
            TOP_BOTTOM_OVERSHOOT

    };


    console.log(
        'PORPHYRA Cloth v14.0 — PRE-BAKED PRODUCTION MATERIAL LOADED'
    );

}


// ==========================================================
// CAMERA FIT
// ==========================================================

function fitCamera() {

    camera.aspect =

        window.innerWidth

        /

        window.innerHeight;


    camera.updateProjectionMatrix();


    const fov =

        THREE.MathUtils.degToRad(
            camera.fov
        );


    const paddedWidth =

        RUG_WIDTH

        *

        CAMERA_PADDING_X;


    const paddedHeight =

        RUG_HEIGHT

        *

        CAMERA_PADDING_Y;


    const distanceForHeight =

        (
            paddedHeight /
            2
        )

        /

        Math.tan(
            fov /
            2
        );


    const distanceForWidth =

        (
            paddedWidth /
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
        1.02

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
        'PORPHYRA Cloth v14.0 loaded'
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

            updateGeometry();

        }


        renderer.render(

            scene,

            camera

        );

    }

);
