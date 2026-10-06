import * as THREE from 'three';

import {
    RoomEnvironment
} from 'three/addons/environments/RoomEnvironment.js';


// ==========================================================
// PORPHYRA — SMOOTH INTERACTIVE SPRING CLOTH
// ==========================================================


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

// Overall fabric tension.
const TENSION = 0.26;

// Pull toward resting position.
const RESTORE_FORCE = 0.035;

// Overall motion damping.
//
// Slightly more damping than before,
// but still enough bounce to feel like fabric.
const DAMPING = 0.915;


// ----------------------------------------------------------
// CURSOR INTERACTION
// ----------------------------------------------------------

const POINTER_RADIUS = 0.80;

const POINTER_BULGE = 0.52;

// How strongly fabric follows the cursor.
const POINTER_STIFFNESS = 0.14;

// NEW:
// Removes the repeated back-and-forth oscillation
// directly underneath the mouse.
const POINTER_DAMPING = 0.20;

// NEW:
// How quickly the invisible physics cursor catches
// up with the real mouse.
//
// Higher = more immediate.
// Lower = smoother / floatier.
const POINTER_FOLLOW_SPEED = 22;


// ----------------------------------------------------------
// FIXED PHYSICS TIMESTEP
//
// This is a major stability improvement.
//
// Physics always runs at 120 updates/sec,
// regardless of monitor refresh rate.
// ----------------------------------------------------------

const FIXED_TIMESTEP = 1 / 120;

const MAX_SUBSTEPS = 5;

let physicsAccumulator = 0;


// ----------------------------------------------------------
// SCENE
// ----------------------------------------------------------

const scene = new THREE.Scene();

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
// LIGHTS
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
// CLOTH VARIABLES
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
// SUBTLE RESTING FABRIC SHAPE
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


// Raw browser pointer position.
let targetPointerX = 0;
let targetPointerY = 0;


// NEW:
// Smoothed physics pointer.
let smoothPointerX = 0;
let smoothPointerY = 0;


let targetPointerSpeed = 0;
let smoothPointerSpeed = 0;


let previousPointerX = 0;
let previousPointerY = 0;

let previousPointerTime =
    performance.now();

let hasPreviousPointer =
    false;

let hasSmoothPointer =
    false;


// ----------------------------------------------------------
// POINTER MOVE
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
        Math.abs(intersection.x)
            <= RUG_WIDTH / 2

        &&

        Math.abs(intersection.y)
            <= RUG_HEIGHT / 2;


    if (!inside) {

        pointerActive = false;

        return;

    }


    targetPointerX =
        intersection.x;

    targetPointerY =
        intersection.y;


    // Initialize smoothing immediately when the cursor
    // first enters so it doesn't fly in from (0, 0).
    if (!hasSmoothPointer) {

        smoothPointerX =
            targetPointerX;

        smoothPointerY =
            targetPointerY;

        hasSmoothPointer =
            true;

    }


    const now =
        performance.now();


    if (hasPreviousPointer) {

        const dt =
            Math.max(
                (
                    now -
                    previousPointerTime
                ) / 1000,

                0.001
            );


        const dx =
            targetPointerX -
            previousPointerX;

        const dy =
            targetPointerY -
            previousPointerY;


        targetPointerSpeed =
            Math.sqrt(
                dx * dx +
                dy * dy
            ) / dt;


        targetPointerSpeed =
            Math.min(
                targetPointerSpeed,
                12
            );

    }


    previousPointerX =
        targetPointerX;

    previousPointerY =
        targetPointerY;


    previousPointerTime =
        now;


    hasPreviousPointer =
        true;


    pointerActive =
        true;

}


// ----------------------------------------------------------
// POINTER LEAVE
// ----------------------------------------------------------

function onPointerLeave() {

    pointerActive = false;

    hasPreviousPointer = false;
    hasSmoothPointer = false;

    targetPointerSpeed = 0;
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
// SMOOTH POINTER
// ----------------------------------------------------------

function updateSmoothPointer(dt) {

    if (!pointerActive) {
        return;
    }


    // Frame-rate-independent exponential smoothing.
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


    // Speed is smoothed separately so tiny pointer-event
    // fluctuations don't make the cloth pulse.
    const speedFollow =
        1 -
        Math.exp(
            -12 *
            dt
        );


    smoothPointerSpeed +=
        (
            targetPointerSpeed -
            smoothPointerSpeed
        ) *
        speedFollow;

}


// ----------------------------------------------------------
// PHYSICS STEP
// ----------------------------------------------------------

function simulateCloth(dt) {

    updateSmoothPointer(dt);


    acceleration.fill(0);


    // Convert fixed timestep to our old 60-FPS scale.
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

    if (pointerActive) {

        const radiusSquared =
            POINTER_RADIUS *
            POINTER_RADIUS;


        const speedBoost =
            Math.min(
                smoothPointerSpeed *
                0.020,
                0.24
            );


        const bulge =
            POINTER_BULGE +
            speedBoost;


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
                            POINTER_RADIUS
                        );


                    // Smoothstep
                    influence =
                        influence *
                        influence *
                        (
                            3 -
                            2 * influence
                        );


                    const targetHeight =
                        bulge *
                        influence;


                    const error =
                        targetHeight -
                        height[i];


                    // Spring toward cursor shape.
                    acceleration[i] +=
                        error *
                        POINTER_STIFFNESS;


                    // NEW:
                    // Local velocity damping prevents the
                    // cursor area from repeatedly overshooting.
                    acceleration[i] -=
                        velocity[i] *
                        POINTER_DAMPING *
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
// UPDATE THREE.JS GEOMETRY
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


        // Don't allow accumulated lag to explode
        // after switching tabs, etc.
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
