import * as THREE from 'three';

import {
    RoomEnvironment
} from 'three/addons/environments/RoomEnvironment.js';


// ==========================================================
// PORPHYRA — SPEED-SENSITIVE SMOOTH CLOTH
// VERSION 5
// ==========================================================

const VERSION = 'v5';


// ----------------------------------------------------------
// VERSION INDICATOR
// ----------------------------------------------------------
//
// Small visual confirmation that GitHub Pages has loaded
// the newest main.js rather than a cached older version.
// ----------------------------------------------------------

const versionIndicator =
    document.createElement('div');

versionIndicator.textContent =
    `PORPHYRA CLOTH • ${VERSION}`;

versionIndicator.style.position =
    'fixed';

versionIndicator.style.top =
    '12px';

versionIndicator.style.left =
    '14px';

versionIndicator.style.zIndex =
    '100';

versionIndicator.style.color =
    'rgba(255, 255, 255, 0.55)';

versionIndicator.style.fontFamily =
    'Arial, Helvetica, sans-serif';

versionIndicator.style.fontSize =
    '11px';

versionIndicator.style.fontWeight =
    '500';

versionIndicator.style.letterSpacing =
    '0.12em';

versionIndicator.style.pointerEvents =
    'none';

versionIndicator.style.userSelect =
    'none';

versionIndicator.style.textShadow =
    '0 1px 3px rgba(0, 0, 0, 0.8)';

document.body.appendChild(
    versionIndicator
);


// ----------------------------------------------------------
// RUG
// ----------------------------------------------------------

const RUG_WIDTH = 9.4;
const RUG_HEIGHT = 5.3;

const SEGMENTS_X = 64;
const SEGMENTS_Y = 36;

const COLS = SEGMENTS_X + 1;
const ROWS = SEGMENTS_Y + 1;


// ----------------------------------------------------------
// TEXTURE SCALE
// ----------------------------------------------------------

const REPEAT_Y = 1.6;

const REPEAT_X =
    REPEAT_Y *
    (RUG_WIDTH / RUG_HEIGHT);


// ----------------------------------------------------------
// CLOTH PHYSICS
// ----------------------------------------------------------

const TENSION = 0.26;

const RESTORE_FORCE = 0.035;

const DAMPING = 0.92;


// ----------------------------------------------------------
// POINTER SMOOTHING
// ----------------------------------------------------------

const POINTER_FOLLOW_SPEED = 18;

const SPEED_SMOOTHING = 8;


// ----------------------------------------------------------
// SPEED-SENSITIVE CLOTH RESPONSE
// ----------------------------------------------------------

// Speed below this produces almost no dynamic effect.
const SPEED_DEADZONE = 0.12;


// Speed where the strongest effect is reached.
const SPEED_FULL_EFFECT = 5.0;


// Slow mouse:
// gentle, subtle deformation.
const MIN_BULGE = 0.045;

const MIN_RADIUS = 0.55;

const MIN_POINTER_STIFFNESS = 0.055;


// Fast mouse:
// stronger, wider movement.
const MAX_BULGE = 0.58;

const MAX_RADIUS = 0.92;

const MAX_POINTER_STIFFNESS = 0.16;


// Slow movement gets strong damping.
const SLOW_POINTER_DAMPING = 0.55;


// Fast movement is freer to create waves.
const FAST_POINTER_DAMPING = 0.16;


// ----------------------------------------------------------
// FIXED PHYSICS TIMESTEP
// ----------------------------------------------------------

const FIXED_TIMESTEP = 1 / 120;

const MAX_SUBSTEPS = 5;

let physicsAccumulator = 0;


// ----------------------------------------------------------
// SCENE
// ----------------------------------------------------------

const scene =
    new THREE.Scene();

scene.background =
    new THREE.Color(0x000000);


// ----------------------------------------------------------
// CAMERA
// ----------------------------------------------------------

const camera =
    new THREE.PerspectiveCamera(
        32,
        window.innerWidth /
        window.innerHeight,
        0.1,
        100
    );


// ----------------------------------------------------------
// RENDERER
// ----------------------------------------------------------

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


// ----------------------------------------------------------
// ENVIRONMENT LIGHTING
// ----------------------------------------------------------

const pmrem =
    new THREE.PMREMGenerator(renderer);


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


// ----------------------------------------------------------
// LIGHTING
// ----------------------------------------------------------

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


scene.add(keyLight);


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


scene.add(fillLight);


// ----------------------------------------------------------
// TEXTURES
// ----------------------------------------------------------

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


// ----------------------------------------------------------
// CLOTH DATA
// ----------------------------------------------------------

let rug;
let geometry;
let positions;

let height;
let velocity;
let acceleration;

let restX;
let restY;
let restZ;


// ----------------------------------------------------------
// GRID INDEX
// ----------------------------------------------------------

function indexOf(x, y) {

    return (
        y * COLS +
        x
    );

}


// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

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
        (
            b - a
        ) *
        t
    );

}


function smoothstep01(t) {

    t = clamp01(t);

    return (
        t *
        t *
        (
            3 -
            2 * t
        )
    );

}


// ----------------------------------------------------------
// RESTING CLOTH SHAPE
// ----------------------------------------------------------

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


// ----------------------------------------------------------
// INITIALIZE CLOTH
// ----------------------------------------------------------

function initializeClothPhysics() {

    positions =
        geometry.attributes.position;


    const count =
        positions.count;


    height =
        new Float32Array(count);

    velocity =
        new Float32Array(count);

    acceleration =
        new Float32Array(count);

    restX =
        new Float32Array(count);

    restY =
        new Float32Array(count);

    restZ =
        new Float32Array(count);


    for (
        let i = 0;
        i < count;
        i++
    ) {

        const x =
            positions.getX(i);

        const y =
            positions.getY(i);


        restX[i] = x;

        restY[i] = y;


        const z =
            restingHeight(
                x,
                y
            );


        restZ[i] = z;


        positions.setZ(
            i,
            z
        );

    }


    positions.needsUpdate =
        true;


    geometry.computeVertexNormals();

}


// ----------------------------------------------------------
// POINTER
// ----------------------------------------------------------

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


let pointerActive = false;


// Actual mouse target.
let targetPointerX = 0;

let targetPointerY = 0;


// Smoothed physics cursor.
let smoothPointerX = 0;

let smoothPointerY = 0;


// Previous smoothed position used to measure true,
// stable physics speed.
let previousSmoothPointerX = 0;

let previousSmoothPointerY = 0;


let smoothPointerSpeed = 0;


let hasSmoothPointer = false;


// ----------------------------------------------------------
// BROWSER POINTER MOVE
// ----------------------------------------------------------

function onPointerMove(event) {

    const rect =
        renderer.domElement
            .getBoundingClientRect();


    pointerNDC.x =
        (
            (
                event.clientX -
                rect.left
            ) /
            rect.width
        ) * 2 - 1;


    pointerNDC.y =
        -(
            (
                event.clientY -
                rect.top
            ) /
            rect.height
        ) * 2 + 1;


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

        pointerActive = false;

        return;

    }


    const inside =
        Math.abs(
            intersection.x
        ) <= RUG_WIDTH / 2

        &&

        Math.abs(
            intersection.y
        ) <= RUG_HEIGHT / 2;


    if (!inside) {

        pointerActive = false;

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


// ----------------------------------------------------------
// POINTER LEAVE
// ----------------------------------------------------------

function onPointerLeave() {

    pointerActive = false;

    hasSmoothPointer = false;

    smoothPointerSpeed = 0;

}


renderer.domElement.addEventListener(
    'pointermove',
    onPointerMove
);


renderer.domElement.addEventListener(
    'pointerleave',
    onPointerLeave
);


// ----------------------------------------------------------
// SMOOTH POINTER + PHYSICS SPEED
// ----------------------------------------------------------

function updateSmoothPointer(dt) {

    if (!pointerActive) {

        smoothPointerSpeed *=
            Math.exp(
                -10 * dt
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
        ) *
        follow;


    smoothPointerY +=
        (
            targetPointerY -
            smoothPointerY
        ) *
        follow;


    const dx =
        smoothPointerX -
        previousSmoothPointerX;


    const dy =
        smoothPointerY -
        previousSmoothPointerY;


    const instantaneousSpeed =
        Math.sqrt(
            dx * dx +
            dy * dy
        ) /
        Math.max(
            dt,
            0.0001
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
        ) *
        speedFollow;

}


// ----------------------------------------------------------
// CONVERT SPEED TO CLOTH EFFECT
// ----------------------------------------------------------

function getPointerEffect() {

    const normalizedSpeed =
        (
            smoothPointerSpeed -
            SPEED_DEADZONE
        ) /
        (
            SPEED_FULL_EFFECT -
            SPEED_DEADZONE
        );


    let speed01 =
        smoothstep01(
            normalizedSpeed
        );


    // Makes very slow motion even gentler.
    speed01 =
        Math.pow(
            speed01,
            1.35
        );


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


// ----------------------------------------------------------
// PHYSICS STEP
// ----------------------------------------------------------

function simulateCloth(dt) {

    updateSmoothPointer(dt);


    acceleration.fill(0);


    const step =
        dt * 60;


    // ------------------------------------------------------
    // NEIGHBOR SPRINGS
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
                indexOf(x, y);


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
                ) * 0.25;


            acceleration[i] +=
                (
                    neighborAverage -
                    height[i]
                ) *
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
                    indexOf(x, y);


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
                indexOf(x, y);


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
            indexOf(x, 0);


        const top =
            indexOf(
                x,
                ROWS - 1
            );


        height[bottom] = 0;
        velocity[bottom] = 0;


        height[top] = 0;
        velocity[top] = 0;

    }


    for (
        let y = 0;
        y < ROWS;
        y++
    ) {

        const left =
            indexOf(0, y);


        const right =
            indexOf(
                COLS - 1,
                y
            );


        height[left] = 0;
        velocity[left] = 0;


        height[right] = 0;
        velocity[right] = 0;

    }

}


// ----------------------------------------------------------
// UPDATE GEOMETRY
// ----------------------------------------------------------

function updateGeometry() {

    for (
        let i = 0;
        i < positions.count;
        i++
    ) {

        positions.setZ(
            i,
            restZ[i] +
            height[i]
        );

    }


    positions.needsUpdate =
        true;


    geometry.computeVertexNormals();

}


// ----------------------------------------------------------
// CREATE RUG
// ----------------------------------------------------------

async function createRug() {

    const [
        baseColor,
        normalMap
    ] = await Promise.all([

        loadTexture(
            './textures/rug_basecolor.png'
        ),

        loadTexture(
            './textures/rug_normal.png'
        )

    ]);


    baseColor.colorSpace =
        THREE.SRGBColorSpace;


    normalMap.colorSpace =
        THREE.NoColorSpace;


    configureTexture(
        baseColor
    );


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


    const material =
        new THREE.MeshPhysicalMaterial({

            map:
                baseColor,


            normalMap:
                normalMap,


            normalScale:
                new THREE.Vector2(
                    1.35,
                    -1.35
                ),


            metalness:
                0,


            roughness:
                0.56,


            sheen:
                1,


            sheenColor:
                new THREE.Color(
                    0xc79e7c
                ),


            sheenRoughness:
                0.46,


            specularIntensity:
                0.48,


            specularColor:
                new THREE.Color(
                    0xffe7cf
                ),


            envMapIntensity:
                0.75,


            side:
                THREE.DoubleSide
        });


    rug =
        new THREE.Mesh(
            geometry,
            material
        );


    scene.add(rug);


    initializeClothPhysics();


    window.rug =
        rug;

}


// ----------------------------------------------------------
// CAMERA
// ----------------------------------------------------------

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
        (RUG_HEIGHT / 2) /
        Math.tan(
            fov / 2
        );


    const distanceForWidth =
        (RUG_WIDTH / 2) /
        (
            Math.tan(
                fov / 2
            ) *
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


// ----------------------------------------------------------
// RESIZE
// ----------------------------------------------------------

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


// ----------------------------------------------------------
// START
// ----------------------------------------------------------

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
        `PORPHYRA Cloth ${VERSION} loaded`
    );

} catch (error) {

    console.error(error);


    loading.classList.add(
        'hidden'
    );


    errorBox.style.display =
        'block';


    errorBox.textContent =
        error.message;

}


// ----------------------------------------------------------
// ANIMATION
// ----------------------------------------------------------

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


        let substeps = 0;


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

            physicsAccumulator = 0;

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
