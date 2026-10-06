import * as THREE from 'three';

import {
    RoomEnvironment
} from 'three/addons/environments/RoomEnvironment.js';


// ==========================================================
// PORPHYRA
// Byzantine Rug — Material Baseline
// ==========================================================


// ----------------------------------------------------------
// RUG SIZE
// ----------------------------------------------------------

const RUG_WIDTH = 9.4;
const RUG_HEIGHT = 5.3;


// ----------------------------------------------------------
// TEXTURE SCALE
//
// This is the equivalent of "zooming out" the material.
//
// Higher = smaller pattern / more repetitions.
//
// Try:
// 1.3 = larger pattern
// 1.6 = current recommendation
// 2.0 = smaller pattern
// ----------------------------------------------------------

const REPEAT_Y = 1.6;

const REPEAT_X =
    REPEAT_Y *
    (RUG_WIDTH / RUG_HEIGHT);


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
        35,
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

        powerPreference:
            'high-performance'
    });


// High-resolution rendering without going ridiculous
// on extremely high-DPI displays.
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


// Explicit color management.
renderer.outputColorSpace =
    THREE.SRGBColorSpace;


// Filmic Blender-like highlight handling.
renderer.toneMapping =
    THREE.ACESFilmicToneMapping;


// Adjust later if the material is too bright/dark.
renderer.toneMappingExposure =
    1.05;


renderer.setClearColor(
    0x000000,
    1
);


document.body.appendChild(
    renderer.domElement
);


// ----------------------------------------------------------
// ENVIRONMENT LIGHTING
//
// Very important.
//
// Blender Material Preview gets much of its beautiful
// textile response from environment lighting.
//
// RoomEnvironment gives our rug studio-style reflections
// WITHOUT showing an environment behind it.
// ----------------------------------------------------------

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


// Background remains black.
scene.background =
    new THREE.Color(
        0x000000
    );


room.dispose();
pmrem.dispose();


// ----------------------------------------------------------
// LIGHTING
// ----------------------------------------------------------

// Warm main light.
const keyLight =
    new THREE.DirectionalLight(
        0xffead1,
        2.75
    );

keyLight.position.set(
    -4,
    4,
    6
);

scene.add(
    keyLight
);


// Cooler, softer opposite light.
const fillLight =
    new THREE.DirectionalLight(
        0xd7e0ff,
        0.7
    );

fillLight.position.set(
    5,
    -2,
    4
);

scene.add(
    fillLight
);


// Very soft frontal light.
const frontLight =
    new THREE.DirectionalLight(
        0xffffff,
        0.4
    );

frontLight.position.set(
    0,
    0,
    6
);

scene.add(
    frontLight
);


// ----------------------------------------------------------
// TEXTURE LOADING
// ----------------------------------------------------------

const textureLoader =
    new THREE.TextureLoader();


async function loadTexture(
    path,
    name
) {

    try {

        const texture =
            await textureLoader.loadAsync(
                path
            );

        console.log(
            `${name} loaded`
        );

        return texture;

    } catch (error) {

        throw new Error(
            `Could not load ${name}: ${path}`
        );

    }

}


// ----------------------------------------------------------
// COMMON TEXTURE SETTINGS
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


    // Makes angled/high-resolution textures
    // look significantly sharper.
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
// CREATE RUG
// ----------------------------------------------------------

async function createRug() {

    const [
        baseColor,
        packedMask,
        normalMap
    ] = await Promise.all([

        loadTexture(
            './textures/rug_basecolor.png',
            'Base color'
        ),

        loadTexture(
            './textures/rug_mask.png',
            'Packed mask'
        ),

        loadTexture(
            './textures/rug_normal.png',
            'Normal map'
        )

    ]);


    // ------------------------------------------------------
    // COLOR SPACES
    // ------------------------------------------------------

    // Visible color image.
    baseColor.colorSpace =
        THREE.SRGBColorSpace;


    // Mathematical/PBR data.
    packedMask.colorSpace =
        THREE.NoColorSpace;

    normalMap.colorSpace =
        THREE.NoColorSpace;


    // ------------------------------------------------------
    // TILING
    // ------------------------------------------------------

    configureTexture(
        baseColor
    );

    configureTexture(
        packedMask
    );

    configureTexture(
        normalMap
    );


    // ------------------------------------------------------
    // GEOMETRY
    //
    // This is already subdivided enough that we can later
    // replace it with our cloth simulation.
    // ------------------------------------------------------

    const geometry =
        new THREE.PlaneGeometry(
            RUG_WIDTH,
            RUG_HEIGHT,

            120,
            68
        );


    // ------------------------------------------------------
    // MATERIAL
    // ------------------------------------------------------
    //
    // Three.js PBR packed maps commonly use:
    //
    // R = AO
    // G = Roughness
    // B = Metalness
    //
    // We use G and B here.
    //
    // This gives the packed texture real material influence
    // instead of merely displaying the base-color image.
    // ------------------------------------------------------

    const material =
        new THREE.MeshPhysicalMaterial({

            // ----------------------------------------------
            // COLOR
            // ----------------------------------------------

            color:
                new THREE.Color(
                    0xffffff
                ),

            map:
                baseColor,


            // ----------------------------------------------
            // NORMAL / WEAVE
            // ----------------------------------------------

            normalMap:
                normalMap,


            // Your Blender shader inverted the Y channel,
            // so Three.js does that here with a negative Y.
            normalScale:
                new THREE.Vector2(
                    0.9,
                    -0.9
                ),


            // ----------------------------------------------
            // ROUGHNESS
            //
            // Three.js reads the GREEN channel.
            // ----------------------------------------------

            roughness:
                0.92,

            roughnessMap:
                packedMask,


            // ----------------------------------------------
            // METALLIC VARIATION
            //
            // Three.js reads the BLUE channel.
            //
            // Kept relatively subtle because this is cloth,
            // not a sheet of metal.
            // ----------------------------------------------

            metalness:
                0.32,

            metalnessMap:
                packedMask,


            // ----------------------------------------------
            // FABRIC SHEEN
            // ----------------------------------------------

            sheen:
                0.85,

            sheenColor:
                new THREE.Color(
                    0xc7ad8b
                ),

            sheenRoughness:
                0.68,


            // ----------------------------------------------
            // SPECULAR RESPONSE
            // ----------------------------------------------

            specularIntensity:
                0.72,

            specularColor:
                new THREE.Color(
                    0xfff3df
                ),


            // Environment reflection strength.
            envMapIntensity:
                1.15,


            // No plastic clear coat.
            clearcoat:
                0,


            side:
                THREE.DoubleSide
        });


    // ------------------------------------------------------
    // CREATE MESH
    // ------------------------------------------------------

    const rug =
        new THREE.Mesh(
            geometry,
            material
        );


    scene.add(
        rug
    );


    // Useful when we begin cloth physics later.
    window.rug =
        rug;

    window.rugMaterial =
        material;

    window.rugPackedMask =
        packedMask;


    console.log(
        'PORPHYRA rug ready'
    );

    console.log(
        `Texture tiling: ${REPEAT_X.toFixed(2)} × ${REPEAT_Y.toFixed(2)}`
    );


    return rug;

}


// ----------------------------------------------------------
// CAMERA FITTING
//
// Automatically keeps the rug inside the iframe/page
// regardless of monitor or Wix embed dimensions.
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


    // 1.10 gives us the black border around the textile.
    camera.position.set(
        0,
        0,
        distance * 1.10
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


// ----------------------------------------------------------
// RENDER LOOP
//
// Later this loop will also run:
// - cloth physics
// - mouse collision
// - spring movement
// - wrinkle settling
// ----------------------------------------------------------

renderer.setAnimationLoop(
    () => {

        renderer.render(
            scene,
            camera
        );

    }
);
