import * as THREE from 'three';

import {
    RoomEnvironment
} from 'three/addons/environments/RoomEnvironment.js';


// ==========================================================
// PORPHYRA — INTERACTIVE CLOTH
// ==========================================================


// ----------------------------------------------------------
// RUG
// ----------------------------------------------------------

const RUG_WIDTH = 9.4;
const RUG_HEIGHT = 5.3;

// Cloth simulation resolution.
//
// This is intentionally lower than the old visual mesh.
// ~1,900 vertices is plenty for smooth interactive folds
// while staying fast in a browser.
const SEGMENTS_X = 56;
const SEGMENTS_Y = 32;


// Texture scale
const REPEAT_Y = 1.6;

const REPEAT_X =
    REPEAT_Y *
    (RUG_WIDTH / RUG_HEIGHT);


// ----------------------------------------------------------
// PHYSICS SETTINGS
// ----------------------------------------------------------

// How much motion survives each frame.
const DAMPING = 0.965;

// Gently pulls the fabric back toward its original shape.
const RETURN_FORCE = 0.0045;

// Number of constraint passes each frame.
const CONSTRAINT_ITERATIONS = 4;

// Radius of cursor influence in rug-space.
const CURSOR_RADIUS = 0.72;

// Maximum bulge toward the viewer.
const CURSOR_DEPTH = 0.42;

// Stronger values = firmer fabric.
const STRUCTURAL_STIFFNESS = 0.72;
const SHEAR_STIFFNESS = 0.42;


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

// Keep the original material from getting washed out.
renderer.toneMappingExposure = 0.72;


// Shadows help make moving folds easier to read.
renderer.shadowMap.enabled = true;

renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;


document.body.appendChild(
    renderer.domElement
);


// ----------------------------------------------------------
// ENVIRONMENT
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

// Strong grazing-angle warm light.
//
// This is deliberately off to one side because grazing
// light reveals cloth folds much better than frontal light.
const keyLight =
    new THREE.DirectionalLight(
        0xffdfbd,
        3.2
    );

keyLight.position.set(
    -6,
    4,
    5
);

keyLight.castShadow = true;

keyLight.shadow.mapSize.set(
    2048,
    2048
);

keyLight.shadow.bias =
    -0.00015;

keyLight.shadow.normalBias =
    0.025;

scene.add(keyLight);


// Soft cool fill.
const fillLight =
    new THREE.DirectionalLight(
        0xcad7ff,
        0.55
    );

fillLight.position.set(
    5,
    -4,
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


function setupTexture(texture) {

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
let positionAttribute;

let current;
let previous;
let rest;

let pinned;

const constraints = [];


// ----------------------------------------------------------
// INDEX HELPER
// ----------------------------------------------------------

function vertexIndex(x, y) {

    return (
        y * (SEGMENTS_X + 1)
        + x
    );

}


// ----------------------------------------------------------
// ADD CONSTRAINT
// ----------------------------------------------------------

function addConstraint(
    a,
    b,
    restLength,
    stiffness
) {

    constraints.push({
        a,
        b,
        restLength,
        stiffness
    });

}


// ----------------------------------------------------------
// BUILD CLOTH PHYSICS
// ----------------------------------------------------------

function buildPhysics() {

    positionAttribute =
        geometry.attributes.position;

    const count =
        positionAttribute.count;


    current =
        new Float32Array(
            count * 3
        );

    previous =
        new Float32Array(
            count * 3
        );

    rest =
        new Float32Array(
            count * 3
        );

    pinned =
        new Uint8Array(count);


    // Copy original plane positions.
    for (
        let i = 0;
        i < count;
        i++
    ) {

        const i3 =
            i * 3;

        const x =
            positionAttribute.getX(i);

        const y =
            positionAttribute.getY(i);

        const z =
            positionAttribute.getZ(i);


        current[i3] = x;
        current[i3 + 1] = y;
        current[i3 + 2] = z;

        previous[i3] = x;
        previous[i3 + 1] = y;
        previous[i3 + 2] = z;

        rest[i3] = x;
        rest[i3 + 1] = y;
        rest[i3 + 2] = z;

    }


    const dx =
        RUG_WIDTH /
        SEGMENTS_X;

    const dy =
        RUG_HEIGHT /
        SEGMENTS_Y;

    const diagonal =
        Math.sqrt(
            dx * dx +
            dy * dy
        );


    // ------------------------------------------------------
    // PIN OUTER BORDER
    //
    // The page background stays stable while the interior
    // behaves like stretched fabric.
    // ------------------------------------------------------

    for (
        let y = 0;
        y <= SEGMENTS_Y;
        y++
    ) {

        for (
            let x = 0;
            x <= SEGMENTS_X;
            x++
        ) {

            const i =
                vertexIndex(x, y);


            if (
                x === 0 ||
                x === SEGMENTS_X ||
                y === 0 ||
                y === SEGMENTS_Y
            ) {

                pinned[i] = 1;

            }

        }

    }


    // ------------------------------------------------------
    // STRUCTURAL + SHEAR CONSTRAINTS
    // ------------------------------------------------------

    for (
        let y = 0;
        y <= SEGMENTS_Y;
        y++
    ) {

        for (
            let x = 0;
            x <= SEGMENTS_X;
            x++
        ) {

            const i =
                vertexIndex(x, y);


            // Horizontal
            if (
                x < SEGMENTS_X
            ) {

                addConstraint(
                    i,
                    vertexIndex(
                        x + 1,
                        y
                    ),
                    dx,
                    STRUCTURAL_STIFFNESS
                );

            }


            // Vertical
            if (
                y < SEGMENTS_Y
            ) {

                addConstraint(
                    i,
                    vertexIndex(
                        x,
                        y + 1
                    ),
                    dy,
                    STRUCTURAL_STIFFNESS
                );

            }


            // Diagonal /
            if (
                x < SEGMENTS_X &&
                y < SEGMENTS_Y
            ) {

                addConstraint(
                    i,
                    vertexIndex(
                        x + 1,
                        y + 1
                    ),
                    diagonal,
                    SHEAR_STIFFNESS
                );

            }


            // Diagonal \
            if (
                x > 0 &&
                y < SEGMENTS_Y
            ) {

                addConstraint(
                    i,
                    vertexIndex(
                        x - 1,
                        y + 1
                    ),
                    diagonal,
                    SHEAR_STIFFNESS
                );

            }

        }

    }

}


// ----------------------------------------------------------
// PHYSICS INTEGRATION
// ----------------------------------------------------------

function integratePhysics() {

    const count =
        positionAttribute.count;


    for (
        let i = 0;
        i < count;
        i++
    ) {

        if (
            pinned[i]
        ) {
            continue;
        }


        const i3 =
            i * 3;


        const x =
            current[i3];

        const y =
            current[i3 + 1];

        const z =
            current[i3 + 2];


        const vx =
            (x - previous[i3]) *
            DAMPING;

        const vy =
            (y - previous[i3 + 1]) *
            DAMPING;

        const vz =
            (z - previous[i3 + 2]) *
            DAMPING;


        previous[i3] = x;
        previous[i3 + 1] = y;
        previous[i3 + 2] = z;


        // Verlet movement
        current[i3] += vx;

        current[i3 + 1] += vy;

        current[i3 + 2] += vz;


        // Gently restore the sheet to its original position.
        current[i3] +=
            (
                rest[i3] -
                current[i3]
            ) *
            RETURN_FORCE;

        current[i3 + 1] +=
            (
                rest[i3 + 1] -
                current[i3 + 1]
            ) *
            RETURN_FORCE;

        current[i3 + 2] +=
            (
                rest[i3 + 2] -
                current[i3 + 2]
            ) *
            RETURN_FORCE;

    }

}


// ----------------------------------------------------------
// SOLVE ONE CONSTRAINT
// ----------------------------------------------------------

function solveConstraint(
    constraint
) {

    const a =
        constraint.a;

    const b =
        constraint.b;


    const a3 =
        a * 3;

    const b3 =
        b * 3;


    const dx =
        current[b3] -
        current[a3];

    const dy =
        current[b3 + 1] -
        current[a3 + 1];

    const dz =
        current[b3 + 2] -
        current[a3 + 2];


    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy +
            dz * dz
        );


    if (
        distance < 0.000001
    ) {
        return;
    }


    const correction =
        (
            distance -
            constraint.restLength
        ) /
        distance *
        constraint.stiffness;


    const cx =
        dx * correction;

    const cy =
        dy * correction;

    const cz =
        dz * correction;


    const aPinned =
        pinned[a];

    const bPinned =
        pinned[b];


    if (
        !aPinned &&
        !bPinned
    ) {

        current[a3] +=
            cx * 0.5;

        current[a3 + 1] +=
            cy * 0.5;

        current[a3 + 2] +=
            cz * 0.5;


        current[b3] -=
            cx * 0.5;

        current[b3 + 1] -=
            cy * 0.5;

        current[b3 + 2] -=
            cz * 0.5;

    }

    else if (
        !aPinned
    ) {

        current[a3] += cx;
        current[a3 + 1] += cy;
        current[a3 + 2] += cz;

    }

    else if (
        !bPinned
    ) {

        current[b3] -= cx;
        current[b3 + 1] -= cy;
        current[b3 + 2] -= cz;

    }

}


// ----------------------------------------------------------
// APPLY ALL CONSTRAINTS
// ----------------------------------------------------------

function solveConstraints() {

    for (
        let iteration = 0;
        iteration <
        CONSTRAINT_ITERATIONS;
        iteration++
    ) {

        for (
            const constraint
            of constraints
        ) {

            solveConstraint(
                constraint
            );

        }

    }

}


// ----------------------------------------------------------
// POINTER
// ----------------------------------------------------------

const pointer =
    new THREE.Vector2();

const raycaster =
    new THREE.Raycaster();


let pointerActive =
    false;

let pointerWorldX = 0;
let pointerWorldY = 0;

let pointerSpeed = 0;

let lastPointerX = 0;
let lastPointerY = 0;
let lastPointerTime =
    performance.now();


// ----------------------------------------------------------
// POINTER MOVE
// ----------------------------------------------------------

function handlePointerMove(event) {

    const rect =
        renderer.domElement
            .getBoundingClientRect();


    const px =
        event.clientX -
        rect.left;

    const py =
        event.clientY -
        rect.top;


    pointer.x =
        (
            px /
            rect.width
        ) * 2 - 1;

    pointer.y =
        -(
            py /
            rect.height
        ) * 2 + 1;


    const now =
        performance.now();

    const dt =
        Math.max(
            1,
            now - lastPointerTime
        );


    const dx =
        event.clientX -
        lastPointerX;

    const dy =
        event.clientY -
        lastPointerY;


    pointerSpeed =
        Math.sqrt(
            dx * dx +
            dy * dy
        ) /
        dt;


    lastPointerX =
        event.clientX;

    lastPointerY =
        event.clientY;

    lastPointerTime =
        now;


    raycaster.setFromCamera(
        pointer,
        camera
    );


    const hits =
        raycaster.intersectObject(
            rug,
            false
        );


    if (
        hits.length > 0
    ) {

        const localPoint =
            rug.worldToLocal(
                hits[0]
                    .point
                    .clone()
            );


        pointerWorldX =
            localPoint.x;

        pointerWorldY =
            localPoint.y;

        pointerActive =
            true;

    }

    else {

        pointerActive =
            false;

    }

}


renderer.domElement
    .addEventListener(
        'pointermove',
        handlePointerMove
    );


renderer.domElement
    .addEventListener(
        'pointerleave',
        () => {

            pointerActive =
                false;

        }
    );


// ----------------------------------------------------------
// POINTER → CLOTH FORCE
// ----------------------------------------------------------

function applyPointerForce() {

    if (
        !pointerActive
    ) {
        return;
    }


    // Faster mouse movement produces a little more energy.
    const speedBoost =
        Math.min(
            pointerSpeed * 0.45,
            0.22
        );


    const depth =
        CURSOR_DEPTH +
        speedBoost;


    const radiusSquared =
        CURSOR_RADIUS *
        CURSOR_RADIUS;


    const count =
        positionAttribute.count;


    for (
        let i = 0;
        i < count;
        i++
    ) {

        if (
            pinned[i]
        ) {
            continue;
        }


        const i3 =
            i * 3;


        const dx =
            current[i3] -
            pointerWorldX;

        const dy =
            current[i3 + 1] -
            pointerWorldY;


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


            const normalized =
                1 -
                (
                    distance /
                    CURSOR_RADIUS
                );


            // Smooth radial falloff.
            const falloff =
                normalized *
                normalized *
                (
                    3 -
                    2 * normalized
                );


            const targetZ =
                depth *
                falloff;


            // Pull the fabric toward the viewer.
            //
            // previous stays behind slightly, creating
            // real inertial follow-through.
            current[i3 + 2] +=
                (
                    targetZ -
                    current[i3 + 2]
                ) *
                0.26;

        }

    }

}


// ----------------------------------------------------------
// COPY SIMULATION TO THREE.JS MESH
// ----------------------------------------------------------

function updateGeometry() {

    const array =
        positionAttribute.array;


    for (
        let i = 0;
        i < array.length;
        i++
    ) {

        array[i] =
            current[i];

    }


    positionAttribute.needsUpdate =
        true;


    // Recalculate normals from the ACTUAL moving cloth.
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


    setupTexture(baseColor);
    setupTexture(normalMap);


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

            map:
                baseColor,


            normalMap:
                normalMap,


            // Stronger than before so the thread structure
            // catches more light.
            normalScale:
                new THREE.Vector2(
                    1.55,
                    -1.55
                ),


            metalness:
                0,


            roughness:
                0.54,


            // Cloth/silk response
            sheen:
                1,

            sheenColor:
                new THREE.Color(
                    0xc89d79
                ),

            sheenRoughness:
                0.42,


            specularIntensity:
                0.48,

            specularColor:
                new THREE.Color(
                    0xffe7ca
                ),


            envMapIntensity:
                0.72,


            side:
                THREE.DoubleSide
        });


    rug =
        new THREE.Mesh(
            geometry,
            material
        );


    rug.castShadow =
        true;

    rug.receiveShadow =
        true;


    scene.add(rug);


    buildPhysics();


    window.rug =
        rug;

    window.rugMaterial =
        material;

}


// ----------------------------------------------------------
// CAMERA FIT
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
        Math.tan(fov / 2);


    const distanceForWidth =
        (RUG_WIDTH / 2) /
        (
            Math.tan(fov / 2) *
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
// ANIMATION LOOP
// ----------------------------------------------------------

renderer.setAnimationLoop(
    () => {

        if (
            rug
        ) {

            integratePhysics();

            applyPointerForce();

            solveConstraints();

            updateGeometry();

        }


        renderer.render(
            scene,
            camera
        );

    }
);
