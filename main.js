import * as THREE from 'three';

import {
    RoomEnvironment
} from './vendor/environments/RoomEnvironment.js?v=180';

import {
    RectAreaLightUniformsLib
} from './vendor/lights/RectAreaLightUniformsLib.js?v=180';


// ==========================================================
// PORPHYRA — INTERACTIVE CLOTH v14.3
// RELIABILITY BUILD
//
// Adds:
//
// - fully self-hosted Three.js
// - waits for valid iframe dimensions
// - ResizeObserver support
// - texture timeout + automatic retries
// - optional texture fallbacks
// - shader pre-compilation
// - verified first frame
// - WebGL context-loss handling
// - automatic recovery reload
// - BFCache / Wix navigation recovery
//
// Keeps the v14.2 appearance and physics.
// ==========================================================


// ==========================================================
// VERSION
// ==========================================================

const BUILD_VERSION =
    '14.3';


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
// TEXTURES
// ==========================================================

const COLOR_TEXTURE_PATH =
    './textures/porphyra_color.png?v=143';


const MATERIAL_TEXTURE_PATH =
    './textures/porphyra_material.png?v=143';


const NORMAL_TEXTURE_PATH =
    './textures/rug_normal.png?v=143';


// ==========================================================
// RELIABILITY SETTINGS
// ==========================================================

const MIN_VIEWPORT_SIZE =
    32;


const VIEWPORT_WAIT_TIMEOUT =
    10000;


const TEXTURE_TIMEOUT =
    10000;


const TEXTURE_RETRIES =
    3;


const FIRST_FRAME_ATTEMPTS =
    4;


const MAX_RECOVERY_RELOADS =
    2;


const CONTEXT_RESTORE_TIMEOUT =
    3500;


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
// CAMERA
// ==========================================================

const CAMERA_PADDING_X =
    1.04;


const CAMERA_PADDING_Y =
    1.10;


// ==========================================================
// BORDER
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
// GENERAL STATE
// ==========================================================

const canvas =
    document.getElementById(
        'rugCanvas'
    );


let renderer =
    null;


let environmentTarget =
    null;


let animationRunning =
    false;


let firstFrameSuccessful =
    false;


let contextLost =
    false;


let contextRestoreTimer =
    null;


let resizeFrame =
    null;


// ==========================================================
// CLOTH STATE
// ==========================================================

let rug =
    null;


let geometry =
    null;


let positions =
    null;


let vertexColors =
    null;


let height =
    null;


let velocity =
    null;


let acceleration =
    null;


let restX =
    null;


let restY =
    null;


let restZ =
    null;


// ==========================================================
// BASIC HELPERS
// ==========================================================

function delay(
    milliseconds
) {

    return new Promise(

        resolve =>

            window.setTimeout(
                resolve,
                milliseconds
            )

    );

}


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


// ==========================================================
// VIEWPORT SIZE
// ==========================================================

function getViewportSize() {

    const root =
        document.documentElement;


    const body =
        document.body;


    const width =

        Math.max(

            canvas?.clientWidth || 0,

            root?.clientWidth || 0,

            body?.clientWidth || 0,

            window.innerWidth || 0

        );


    const heightValue =

        Math.max(

            canvas?.clientHeight || 0,

            root?.clientHeight || 0,

            body?.clientHeight || 0,

            window.innerHeight || 0

        );


    return {

        width:
            Math.round(
                width
            ),

        height:
            Math.round(
                heightValue
            )

    };

}


// ==========================================================
// WAIT FOR REAL IFRAME DIMENSIONS
// ==========================================================

async function waitForUsableViewport() {

    const start =
        performance.now();


    while (

        performance.now() -
        start

        <

        VIEWPORT_WAIT_TIMEOUT

    ) {

        const size =
            getViewportSize();


        if (

            size.width >=
            MIN_VIEWPORT_SIZE

            &&

            size.height >=
            MIN_VIEWPORT_SIZE

        ) {

            return size;

        }


        await delay(
            50
        );

    }


    const fallback =
        getViewportSize();


    if (

        fallback.width <
        1

        ||

        fallback.height <
        1

    ) {

        throw new Error(
            'PORPHYRA viewport never received usable dimensions.'
        );

    }


    return fallback;

}


// ==========================================================
// SCENE
// ==========================================================

const scene =
    new THREE.Scene();


scene.background =
    null;


// ==========================================================
// CAMERA
// ==========================================================

const camera =
    new THREE.PerspectiveCamera(

        32,

        1,

        0.1,

        100

    );


// ==========================================================
// CAMERA FIT
// ==========================================================

function fitCamera() {

    const size =
        getViewportSize();


    if (

        size.width <
        1

        ||

        size.height <
        1

    ) {

        return;

    }


    camera.aspect =

        size.width /
        size.height;


    camera.updateProjectionMatrix();


    const fov =

        THREE.MathUtils.degToRad(
            camera.fov
        );


    const paddedWidth =

        RUG_WIDTH *
        CAMERA_PADDING_X;


    const paddedHeight =

        RUG_HEIGHT *
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
// RENDERER
// ==========================================================

function createRenderer() {

    if (
        renderer
    ) {

        return renderer;

    }


    /*
        Reliability note:

        "default" is intentional.

        Forcing "high-performance" can cause the browser to
        switch GPUs on some hybrid-GPU laptops.

        The rug is lightweight enough that reliability is more
        valuable than forcing that preference.
    */

    renderer =
        new THREE.WebGLRenderer({

            canvas:
                canvas,

            antialias:
                true,

            alpha:
                true,

            powerPreference:
                'default',

            premultipliedAlpha:
                true

        });


    renderer.setClearColor(
        0x000000,
        0
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


    applyRendererSize(
        true
    );


    return renderer;

}


// ==========================================================
// RESIZE RENDERER
// ==========================================================

function applyRendererSize(
    force = false
) {

    if (
        !renderer
    ) {

        return false;

    }


    const size =
        getViewportSize();


    if (

        size.width <
        1

        ||

        size.height <
        1

    ) {

        return false;

    }


    const desiredPixelRatio =

        Math.min(

            window.devicePixelRatio || 1,

            2

        );


    if (

        force

        ||

        renderer.getPixelRatio() !==
        desiredPixelRatio

    ) {

        renderer.setPixelRatio(
            desiredPixelRatio
        );

    }


    const currentSize =
        new THREE.Vector2();


    renderer.getSize(
        currentSize
    );


    if (

        force

        ||

        currentSize.x !==
        size.width

        ||

        currentSize.y !==
        size.height

    ) {

        renderer.setSize(

            size.width,

            size.height,

            false

        );


        fitCamera();


        return true;

    }


    return false;

}


// ==========================================================
// RESIZE OBSERVER
// ==========================================================

function scheduleResize() {

    if (
        resizeFrame !== null
    ) {

        return;

    }


    resizeFrame =
        requestAnimationFrame(

            () => {

                resizeFrame =
                    null;


                const changed =
                    applyRendererSize();


                if (

                    changed

                    &&

                    renderer

                    &&

                    rug

                    &&

                    !contextLost

                ) {

                    renderer.render(
                        scene,
                        camera
                    );

                }

            }

        );

}


const resizeObserver =
    new ResizeObserver(
        scheduleResize
    );


resizeObserver.observe(
    document.documentElement
);


resizeObserver.observe(
    document.body
);


window.addEventListener(
    'resize',
    scheduleResize
);


if (
    window.visualViewport
) {

    window.visualViewport.addEventListener(
        'resize',
        scheduleResize
    );

}


// ==========================================================
// ENVIRONMENT
// ==========================================================

async function rebuildEnvironment() {

    if (
        !renderer
    ) {

        return;

    }


    if (
        environmentTarget
    ) {

        environmentTarget.dispose();

        environmentTarget =
            null;

    }


    try {

        const pmrem =

            new THREE.PMREMGenerator(
                renderer
            );


        const room =
            new RoomEnvironment();


        environmentTarget =

            pmrem.fromScene(
                room,
                0.04
            );


        scene.environment =
            environmentTarget.texture;


        room.dispose();

        pmrem.dispose();

    }
    catch (
        error
    ) {

        /*
            The rug can still render from its direct lights.

            Environment failure should never equal
            "blank page."
        */

        console.warn(
            'PORPHYRA environment fallback:',
            error
        );


        scene.environment =
            null;

    }

}


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


// ----------------------------------------------------------
// LOW EDGE GRAZE
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
// OPPOSITE EDGE FILL
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
// TEXTURE LOADER
// ==========================================================

const textureLoader =
    new THREE.TextureLoader();


// ==========================================================
// APPEND QUERY PARAMETER
// ==========================================================

function appendQuery(
    url,
    key,
    value
) {

    const separator =

        url.includes('?')

            ?

            '&'

            :

            '?';


    return (

        url

        +

        separator

        +

        encodeURIComponent(
            key
        )

        +

        '='

        +

        encodeURIComponent(
            value
        )

    );

}


// ==========================================================
// ONE TEXTURE ATTEMPT WITH TIMEOUT
// ==========================================================

function loadTextureAttempt(
    url
) {

    return new Promise(

        (
            resolve,
            reject
        ) => {

            let finished =
                false;


            const timer =

                window.setTimeout(

                    () => {

                        if (
                            finished
                        ) {

                            return;

                        }


                        finished =
                            true;


                        reject(

                            new Error(
                                `Texture timed out: ${url}`
                            )

                        );

                    },

                    TEXTURE_TIMEOUT

                );


            textureLoader.load(

                url,


                texture => {

                    if (
                        finished
                    ) {

                        texture.dispose();

                        return;

                    }


                    finished =
                        true;


                    clearTimeout(
                        timer
                    );


                    resolve(
                        texture
                    );

                },


                undefined,


                error => {

                    if (
                        finished
                    ) {

                        return;

                    }


                    finished =
                        true;


                    clearTimeout(
                        timer
                    );


                    reject(
                        error
                    );

                }

            );

        }

    );

}


// ==========================================================
// TEXTURE RETRIES
// ==========================================================

async function loadTextureWithRetry(
    path
) {

    let lastError =
        null;


    for (

        let attempt = 0;

        attempt <
        TEXTURE_RETRIES;

        attempt++

    ) {

        try {

            const attemptUrl =

                attempt === 0

                    ?

                    path

                    :

                    appendQuery(

                        path,

                        'retry',

                        `${attempt}-${Date.now()}`

                    );


            return await loadTextureAttempt(
                attemptUrl
            );

        }
        catch (
            error
        ) {

            lastError =
                error;


            console.warn(

                `PORPHYRA texture attempt ${attempt + 1} failed:`,

                path,

                error

            );


            await delay(

                250 *
                (
                    attempt +
                    1
                )

            );

        }

    }


    throw lastError;

}


// ==========================================================
// TEXTURE CONFIGURATION
// ==========================================================

function configureTexture(
    texture
) {

    if (
        !texture
    ) {

        return;

    }


    texture.wrapS =
        THREE.RepeatWrapping;


    texture.wrapT =
        THREE.RepeatWrapping;


    texture.repeat.set(

        REPEAT_X,

        REPEAT_Y

    );


    if (
        renderer
    ) {

        texture.anisotropy =

            renderer
                .capabilities
                .getMaxAnisotropy();

    }


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
// LOAD MATERIAL MAPS
// ==========================================================

async function loadPorphyraMaterialMaps() {

    /*
        Color is the most important texture.

        Material + normal textures are allowed to fail without
        making the entire rug disappear.
    */

    let colorTexture =
        null;


    let materialTexture =
        null;


    let normalTexture =
        null;


    try {

        colorTexture =

            await loadTextureWithRetry(
                COLOR_TEXTURE_PATH
            );

    }
    catch (
        error
    ) {

        console.error(
            'PORPHYRA color texture unavailable. Using color fallback.',
            error
        );

    }


    const optionalResults =

        await Promise.allSettled([

            loadTextureWithRetry(
                MATERIAL_TEXTURE_PATH
            ),

            loadTextureWithRetry(
                NORMAL_TEXTURE_PATH
            )

        ]);


    if (

        optionalResults[0].status ===
        'fulfilled'

    ) {

        materialTexture =
            optionalResults[0].value;

    }
    else {

        console.warn(
            'PORPHYRA material map fallback active.'
        );

    }


    if (

        optionalResults[1].status ===
        'fulfilled'

    ) {

        normalTexture =
            optionalResults[1].value;

    }
    else {

        console.warn(
            'PORPHYRA normal map fallback active.'
        );

    }


    if (
        colorTexture
    ) {

        colorTexture.colorSpace =
            THREE.SRGBColorSpace;


        configureTexture(
            colorTexture
        );

    }


    if (
        materialTexture
    ) {

        materialTexture.colorSpace =
            THREE.NoColorSpace;


        configureTexture(
            materialTexture
        );

    }


    if (
        normalTexture
    ) {

        normalTexture.colorSpace =
            THREE.NoColorSpace;


        configureTexture(
            normalTexture
        );

    }


    return {

        colorTexture,

        materialTexture,

        normalTexture

    };

}


// ==========================================================
// EDGE HELPERS
// ==========================================================

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
// PERIMETER IRREGULARITY
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


    if (
        dx <
        dy
    ) {

        const along =
            y;


        const wave =

            Math.sin(
                along * 2.85 + 0.6
            )

            *

            0.58

            +

            Math.sin(
                along * 6.9 + 1.7
            )

            *

            0.29

            +

            Math.sin(
                along * 12.3 + 0.2
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
    else {

        const along =
            x;


        const wave =

            Math.sin(
                along * 2.35 + 1.2
            )

            *

            0.55

            +

            Math.sin(
                along * 5.8 + 0.3
            )

            *

            0.30

            +

            Math.sin(
                along * 10.7 + 2.1
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
// RESTING HEIGHT
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

        i <
        count;

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

    if (
        !renderer
    ) {

        return;

    }


    const rect =
        canvas.getBoundingClientRect();


    if (

        rect.width <=
        0

        ||

        rect.height <=
        0

    ) {

        return;

    }


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


canvas.addEventListener(

    'pointermove',

    onPointerMove,

    {
        passive:
            true
    }

);


canvas.addEventListener(

    'pointerleave',

    onPointerLeave,

    {
        passive:
            true
    }

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
            -10 * dt
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
                -10 * dt
            );


        visualSpeed01 *=

            Math.exp(
                -7 * dt
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


    for (

        let y = 1;

        y <
        ROWS - 1;

        y++

    ) {

        for (

            let x = 1;

            x <
            COLS - 1;

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


    if (

        pointerActive

        &&

        hasSmoothPointer

    ) {

        const effect =
            getPointerEffect();


        const radiusSquared =

            effect.radius *
            effect.radius;


        for (

            let y = 1;

            y <
            ROWS - 1;

            y++

        ) {

            for (

                let x = 1;

                x <
                COLS - 1;

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

                        velocity[i]

                        *

                        effect.localDamping

                        *

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

        y <
        ROWS - 1;

        y++

    ) {

        for (

            let x = 1;

            x <
            COLS - 1;

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


    for (

        let x = 0;

        x <
        COLS;

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

        y <
        ROWS;

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

        y <
        ROWS;

        y++

    ) {

        for (

            let x = 0;

            x <
            COLS;

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

                x <
                COLS - 1

                &&

                y > 0

                &&

                y <
                ROWS - 1

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
// BORDER SHADER
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
            'porphyra-v14-3-reliable';

}


// ==========================================================
// UPDATE GEOMETRY
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

        i <
        positions.count;

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

            baseX +
            irregular.x;


        let finalY =

            baseY +
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

    const maps =

        await loadPorphyraMaterialMaps();


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


    const materialSettings = {

        /*
            If the color map somehow fails entirely,
            the rug still appears as imperial purple
            rather than disappearing.
        */

        color:

            maps.colorTexture

                ?

                0xffffff

                :

                0x321440,


        map:
            maps.colorTexture,


        metalness:

            maps.materialTexture

                ?

                1.0

                :

                0.04,


        metalnessMap:
            maps.materialTexture,


        roughness:

            maps.materialTexture

                ?

                1.0

                :

                0.56,


        roughnessMap:
            maps.materialTexture,


        normalMap:
            maps.normalTexture,


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
                0xd3ae78
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

    };


    const material =

        new THREE.MeshPhysicalMaterial(
            materialSettings
        );


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


    window.rug =
        rug;


    window.rugMaterial =
        material;


    window.porphyraMaps =
        maps;


    window.porphyraLights = {

        warmAreaKey,

        shadowKey,

        coolFill,

        rimLight,

        edgeGraze,

        edgeGrazeFill

    };

}


// ==========================================================
// SHADER PRECOMPILE
// ==========================================================

async function precompileScene() {

    if (
        !renderer
    ) {

        return;

    }


    try {

        if (
            typeof renderer.compileAsync ===
            'function'
        ) {

            /*
                Never allow shader pre-compilation itself to
                block the application indefinitely.
            */

            await Promise.race([

                renderer.compileAsync(
                    scene,
                    camera
                ),

                delay(
                    3000
                )

            ]);

        }
        else {

            renderer.compile(
                scene,
                camera
            );

        }

    }
    catch (
        error
    ) {

        console.warn(
            'PORPHYRA shader precompile fallback:',
            error
        );

    }

}


// ==========================================================
// VERIFY FIRST FRAME
// ==========================================================

function renderVerifiedFrame() {

    if (

        !renderer

        ||

        !rug

        ||

        contextLost

    ) {

        return false;

    }


    applyRendererSize(
        true
    );


    renderer.render(
        scene,
        camera
    );


    const gl =
        renderer.getContext();


    const size =
        getViewportSize();


    const valid =

        size.width >=
        MIN_VIEWPORT_SIZE

        &&

        size.height >=
        MIN_VIEWPORT_SIZE

        &&

        !gl.isContextLost()

        &&

        renderer.info.render.calls >
        0

        &&

        canvas.width >
        0

        &&

        canvas.height >
        0;


    return valid;

}


// ==========================================================
// FIRST FRAME RETRIES
// ==========================================================

async function establishFirstFrame() {

    for (

        let attempt = 0;

        attempt <
        FIRST_FRAME_ATTEMPTS;

        attempt++

    ) {

        const success =
            renderVerifiedFrame();


        if (
            success
        ) {

            firstFrameSuccessful =
                true;


            sessionStorage.removeItem(
                'porphyraRecovery143'
            );


            console.log(
                `PORPHYRA v${BUILD_VERSION} first frame verified.`
            );


            return true;

        }


        console.warn(
            `PORPHYRA first-frame attempt ${attempt + 1} failed.`
        );


        await delay(
            250
        );

    }


    return false;

}


// ==========================================================
// RECOVERY RELOAD
// ==========================================================

function recoveryReload(
    reason
) {

    console.error(
        'PORPHYRA recovery reload:',
        reason
    );


    const key =
        'porphyraRecovery143';


    const currentCount =

        Number(

            sessionStorage.getItem(
                key
            )

            ||

            0

        );


    if (

        currentCount >=
        MAX_RECOVERY_RELOADS

    ) {

        console.error(
            'PORPHYRA reached maximum automatic recovery attempts.'
        );


        return;

    }


    sessionStorage.setItem(

        key,

        String(
            currentCount + 1
        )

    );


    const url =
        new URL(
            window.location.href
        );


    url.searchParams.set(

        '_porphyraRecovery',

        `${Date.now()}-${currentCount + 1}`

    );


    window.location.replace(
        url.toString()
    );

}


// ==========================================================
// ANIMATION
// ==========================================================

const clock =
    new THREE.Clock();


function animationFrame() {

    if (

        !renderer

        ||

        !rug

        ||

        contextLost

    ) {

        return;

    }


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


    updateGeometry();


    renderer.render(
        scene,
        camera
    );

}


// ==========================================================
// START / STOP ANIMATION
// ==========================================================

function startAnimation() {

    if (

        !renderer

        ||

        animationRunning

        ||

        contextLost

    ) {

        return;

    }


    animationRunning =
        true;


    clock.start();


    renderer.setAnimationLoop(
        animationFrame
    );

}


function stopAnimation() {

    if (
        !renderer
    ) {

        return;

    }


    animationRunning =
        false;


    renderer.setAnimationLoop(
        null
    );


    clock.stop();

}


// ==========================================================
// WEBGL CONTEXT LOSS
// ==========================================================

canvas.addEventListener(

    'webglcontextlost',

    event => {

        event.preventDefault();


        contextLost =
            true;


        stopAnimation();


        console.warn(
            'PORPHYRA WebGL context lost. Waiting for restoration.'
        );


        clearTimeout(
            contextRestoreTimer
        );


        contextRestoreTimer =

            window.setTimeout(

                () => {

                    if (
                        contextLost
                    ) {

                        recoveryReload(
                            'WebGL context did not restore.'
                        );

                    }

                },

                CONTEXT_RESTORE_TIMEOUT

            );

    },

    false

);


// ==========================================================
// WEBGL CONTEXT RESTORED
// ==========================================================

canvas.addEventListener(

    'webglcontextrestored',

    async () => {

        console.log(
            'PORPHYRA WebGL context restored.'
        );


        clearTimeout(
            contextRestoreTimer
        );


        contextLost =
            false;


        try {

            applyRendererSize(
                true
            );


            await rebuildEnvironment();


            await precompileScene();


            const success =
                await establishFirstFrame();


            if (
                !success
            ) {

                recoveryReload(
                    'Context restored but rendering did not recover.'
                );


                return;

            }


            startAnimation();

        }
        catch (
            error
        ) {

            console.error(
                error
            );


            recoveryReload(
                'Context restore threw an exception.'
            );

        }

    },

    false

);


// ==========================================================
// VISIBILITY
// ==========================================================

document.addEventListener(

    'visibilitychange',

    () => {

        if (
            document.hidden
        ) {

            stopAnimation();

        }
        else if (

            firstFrameSuccessful

            &&

            !contextLost

        ) {

            applyRendererSize(
                true
            );


            renderer.render(
                scene,
                camera
            );


            startAnimation();

        }

    }

);


// ==========================================================
// BACK/FORWARD CACHE / WIX NAVIGATION
// ==========================================================

window.addEventListener(

    'pageshow',

    async event => {

        if (
            !event.persisted
        ) {

            return;

        }


        console.log(
            'PORPHYRA restored from page cache.'
        );


        await waitForUsableViewport();


        applyRendererSize(
            true
        );


        if (

            renderer

            &&

            rug

            &&

            !contextLost

        ) {

            renderer.render(
                scene,
                camera
            );


            startAnimation();

        }

    }

);


window.addEventListener(

    'pagehide',

    () => {

        stopAnimation();

    }

);


// ==========================================================
// CLEANUP
// ==========================================================

window.addEventListener(

    'unload',

    () => {

        stopAnimation();


        resizeObserver.disconnect();


        if (
            environmentTarget
        ) {

            environmentTarget.dispose();

        }


        if (
            geometry
        ) {

            geometry.dispose();

        }


        if (

            rug

            &&

            rug.material

        ) {

            rug.material.dispose();

        }


        if (
            renderer
        ) {

            renderer.dispose();

        }

    }

);


// ==========================================================
// BOOT
// ==========================================================

async function boot() {

    console.log(
        `PORPHYRA Cloth v${BUILD_VERSION} booting...`
    );


    /*
        IMPORTANT:

        Do not initialize WebGL while Wix is still reporting a
        zero or tiny iframe.
    */

    await waitForUsableViewport();


    createRenderer();


    fitCamera();


    await rebuildEnvironment();


    await createRug();


    /*
        Make absolutely sure Wix has not changed dimensions
        while textures were downloading.
    */

    await waitForUsableViewport();


    applyRendererSize(
        true
    );


    await precompileScene();


    const successfulFrame =

        await establishFirstFrame();


    if (
        !successfulFrame
    ) {

        throw new Error(
            'PORPHYRA could not establish a verified first frame.'
        );

    }


    startAnimation();


    console.log(
        `PORPHYRA Cloth v${BUILD_VERSION} ready.`
    );

}


// ==========================================================
// START
// ==========================================================

try {

    await boot();

}
catch (
    error
) {

    console.error(
        'PORPHYRA startup failure:',
        error
    );


    recoveryReload(
        error?.message ||
        'Unknown startup failure.'
    );

}
