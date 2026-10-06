import * as THREE from 'three';

import {
    RoomEnvironment
} from 'three/addons/environments/RoomEnvironment.js';


// ==========================================================
// PORPHYRA — STATIC CLOTH QUALITY TEST
// ==========================================================


// ----------------------------------------------------------
// RUG SETTINGS
// ----------------------------------------------------------

const RUG_WIDTH = 9.4;
const RUG_HEIGHT = 5.3;

// Texture scale
const REPEAT_Y = 1.6;
const REPEAT_X =
    REPEAT_Y * (RUG_WIDTH / RUG_HEIGHT);


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
        window.innerWidth / window.innerHeight,
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
    Math.min(window.devicePixelRatio, 2)
);

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.outputColorSpace =
    THREE.SRGBColorSpace;

renderer.toneMapping =
    THREE.ACESFilmicToneMapping;

// Less overexposed than before
renderer.toneMappingExposure = 0.85;

document.body.appendChild(
    renderer.domElement
);


// ----------------------------------------------------------
// ENVIRONMENT LIGHTING
// ----------------------------------------------------------

const pmrem =
    new THREE.PMREMGenerator(renderer);

const environmentScene =
    new RoomEnvironment();

const environmentMap =
    pmrem.fromScene(
        environmentScene,
        0.04
    );

scene.environment =
    environmentMap.texture;

environmentScene.dispose();
pmrem.dispose();


// ----------------------------------------------------------
// LIGHTING
//
// Raking lights help reveal tiny cloth folds.
// ----------------------------------------------------------

const keyLight =
    new THREE.DirectionalLight(
        0xffe3c4,
        1.8
    );

keyLight.position.set(
    -5,
    5,
    6
);

scene.add(keyLight);


const fillLight =
    new THREE.DirectionalLight(
        0xcdd7ff,
        0.35
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

const loader =
    new THREE.TextureLoader();


async function loadTexture(url) {
    return await loader.loadAsync(url);
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
// PROCEDURAL CLOTH SHAPE
//
// This is deliberately subtle.
//
// Later, the real cloth simulation will update these
// vertices dynamically.
// ----------------------------------------------------------

function createClothGeometry() {

    const geometry =
        new THREE.PlaneGeometry(
            RUG_WIDTH,
            RUG_HEIGHT,

            180,
            100
        );

    const positions =
        geometry.attributes.position;

    for (
        let i = 0;
        i < positions.count;
        i++
    ) {

        const x =
            positions.getX(i);

        const y =
            positions.getY(i);


        // Normalize coordinates roughly to -1 ... +1
        const nx =
            x / (RUG_WIDTH / 2);

        const ny =
            y / (RUG_HEIGHT / 2);


        // --------------------------------------------------
        // LARGE SOFT UNDULATION
        // --------------------------------------------------

        const wave1 =
            Math.sin(
                x * 1.15 +
                y * 0.35
            ) * 0.035;


        // --------------------------------------------------
        // SECONDARY CLOTH FOLD
        // --------------------------------------------------

        const wave2 =
            Math.sin(
                x * 2.7 -
                y * 1.4
            ) * 0.018;


        // --------------------------------------------------
        // VERY SMALL CROSS-FOLD
        // --------------------------------------------------

        const wave3 =
            Math.sin(
                y * 4.2 +
                x * 0.8
            ) * 0.009;


        // --------------------------------------------------
        // SLIGHT EDGE CURL
        //
        // Makes the rug stop reading as a mathematically
        // perfect rectangle.
        // --------------------------------------------------

        const edgeX =
            Math.pow(
                Math.abs(nx),
                7
            ) * 0.045;

        const edgeY =
            Math.pow(
                Math.abs(ny),
                7
            ) * 0.035;


        // --------------------------------------------------
        // CENTER SAG
        // --------------------------------------------------

        const centerDistance =
            Math.sqrt(
                nx * nx +
                ny * ny
            );

        const sag =
            -0.035 *
            Math.max(
                0,
                1 - centerDistance
            );


        const z =
            wave1 +
            wave2 +
            wave3 +
            edgeX +
            edgeY +
            sag;


        positions.setZ(
            i,
            z
        );

    }


    // Because we physically moved the vertices,
    // recalculate the real geometric normals.
    geometry.computeVertexNormals();

    positions.needsUpdate =
        true;


    return geometry;
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


    // Color texture
    baseColor.colorSpace =
        THREE.SRGBColorSpace;


    // Normal data
    normalMap.colorSpace =
        THREE.NoColorSpace;


    setupTexture(baseColor);
    setupTexture(normalMap);


    // ------------------------------------------------------
    // GEOMETRY
    // ------------------------------------------------------

    const geometry =
        createClothGeometry();


    // ------------------------------------------------------
    // MATERIAL
    //
    // Deliberately ignoring rug_mask.png for now.
    // We first want the original base color + normal
    // behaving like convincing cloth.
    // ------------------------------------------------------

    const material =
        new THREE.MeshPhysicalMaterial({

            map:
                baseColor,


            // ----------------------------------------------
            // WEAVE NORMAL MAP
            // ----------------------------------------------

            normalMap:
                normalMap,

            normalScale:
                new THREE.Vector2(
                    1.15,
                    -1.15
                ),


            // ----------------------------------------------
            // CLOTH MATERIAL
            // ----------------------------------------------

            metalness:
                0.0,

            roughness:
                0.58,


            // Fabric sheen
            sheen:
                1.0,

            sheenColor:
                new THREE.Color(
                    0xc49c7c
                ),

            sheenRoughness:
                0.48,


            specularIntensity:
                0.45,

            specularColor:
                new THREE.Color(
                    0xffead4
                ),


            envMapIntensity:
                0.75,


            clearcoat:
                0,


            side:
                THREE.DoubleSide
        });


    // ------------------------------------------------------
    // RUG MESH
    // ------------------------------------------------------

    const rug =
        new THREE.Mesh(
            geometry,
            material
        );


    scene.add(rug);


    // Very slight overall rotation prevents the lighting
    // from looking perfectly computer-flat.
    rug.rotation.x =
        THREE.MathUtils.degToRad(-1.0);

    rug.rotation.y =
        THREE.MathUtils.degToRad(1.2);


    // Save these globally so the next physics version
    // can reuse the same object.
    window.rug =
        rug;

    window.rugMaterial =
        material;


    return rug;
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


    const distanceHeight =
        (RUG_HEIGHT / 2) /
        Math.tan(fov / 2);


    const distanceWidth =
        (RUG_WIDTH / 2) /
        (
            Math.tan(fov / 2) *
            camera.aspect
        );


    const distance =
        Math.max(
            distanceHeight,
            distanceWidth
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
    document.getElementById('loading');

const errorBox =
    document.getElementById('error');


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
// RENDER
// ----------------------------------------------------------

renderer.setAnimationLoop(
    () => {

        renderer.render(
            scene,
            camera
        );

    }
);
