import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r132/build/three.module.js';
import {OrbitControls} from 'https://threejsfundamentals.org/threejs/resources/threejs/r132/examples/jsm/controls/OrbitControls.js';
import {OBJLoader} from 'https://threejsfundamentals.org/threejs/resources/threejs/r132/examples/jsm/loaders/OBJLoader.js';
import {MTLLoader} from 'https://threejsfundamentals.org/threejs/resources/threejs/r132/examples/jsm/loaders/MTLLoader.js';

const fov = 45;
const aspect = 2;
const near = 0.1;
const far = 500;
const globeRadius = 20;
const skySize = 300;
const particleColors = ['#85fff3', '#8789ff', '#96ffc9', '#6ebeff', '#efdbff'];

let canvas;
let renderer;
let outCamera;
let outControls;
let currentCamera = 'out';
let inCamera;
let inControls;
let scene;
let globe;
let particles = [];
let animate = true;

let pivotPoint;
let northPole;
let southPole;

function setUpUI() {
    document.getElementById('animate-button').onclick = function () {
        if (animate) {
            animate = false;
            this.textContent = 'Play';
        } else {
            animate = true;
            this.textContent = 'Pause';
        }
    }

    document.getElementById('camera-select').onchange = function() {
        currentCamera = this.value;
    }
}

function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        renderer.setSize(width, height, false);
    }
    return needResize;
}

function animateParticles() {
    for (let i = 0; i < particles.length; i++) {
        let x = (Math.random()) / 20;
        let y = (Math.random() - 0.5) / 50;
        let z = (Math.random()) / 20;

        let pos = particles[i].position;

        if (pos.x > 0) {
            pos.x += x;

        } else if (pos.x < 0) {
            pos.x -= x;

        } else {
            pos.x = Math.random() - 0.5;
        }

        pos.y += y;

        if (pos.z > 0) {
            pos.z += z;

        } else if (pos.z < 0) {
            pos.z -= z;

        } else {
            pos.z = Math.random() - 0.5;
        }

        if (Math.abs(pos.x) > 10 || Math.abs(pos.z) > 10 || pos.y > 10 || pos.y <= 0) {
            const xPos = Math.random() * 10 - 5;
            const yPos = Math.random() * 10;
            const zPos = Math.random() * 10 - 5;

            pos.set(xPos, yPos, zPos);
        }
    }
}

function render() {
    if (resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement;

        outCamera.aspect = canvas.clientWidth / canvas.clientHeight;
        outCamera.updateProjectionMatrix();

        inCamera.aspect = canvas.clientWidth / canvas.clientHeight;
        inCamera.updateProjectionMatrix();
    }

    if (animate) {
        pivotPoint.rotation.z += 0.01;
        globe.rotation.x += 0.003;
        animateParticles();
    }

    if (currentCamera == 'out') {
        renderer.render(scene, outCamera);
    } else if (currentCamera == 'in') {
        renderer.render(scene, inCamera);
    } else {
        return;
    } 

    requestAnimationFrame(render);
}

function main() {
    setUpUI();

    canvas = document.querySelector('#c');

    renderer = new THREE.WebGLRenderer({canvas});
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    outCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    outCamera.position.set(0, 10, 20);

    outControls = new OrbitControls(outCamera, canvas);
    outControls.target.set(0, 5, 0);
    outControls.maxDistance = 2 * skySize / 3;
    outControls.maxPolarAngle = 2.1 * Math.PI / 3;
    outControls.update();

    inCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    inCamera.position.set(0, 0, 0);

    inControls = new OrbitControls(inCamera, canvas);
    inControls.target.set(0, -1 * globeRadius, 0);
    inControls.maxDistance = globeRadius;
    inControls.update();

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x26274a, 10, skySize * 1.1);

    setWorld();
    setLights();
    setPrimaries();
    setObjects();

    requestAnimationFrame(render);
}

function setWorld() {
    // Globe
    {
        const globeWidthDivisions = 40;
        const globeHeightDivisions = 30;

        const loader = new THREE.TextureLoader();
        const texture = loader.load('./textures/grass.png');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.magFilter = THREE.NearestFilter;
        const repeats = 4;
        texture.repeat.set(repeats, repeats);

        const bump = loader.load('./textures/bump.jpeg');
        bump.wrapS = THREE.RepeatWrapping;
        bump.wrapT = THREE.RepeatWrapping;
        bump.magFilter = THREE.NearestFilter;

        const globeGeo = new THREE.SphereGeometry(globeRadius, globeWidthDivisions, globeHeightDivisions);
        const globeMat = new THREE.MeshPhongMaterial({
            map: texture,
            side: THREE.DoubleSide,
            bumpMap: bump,
            bumpScale: 0.2
        });

        globeMat.shininess = 0;

        globe = new THREE.Mesh(globeGeo, globeMat);
        globe.position.set(0, -globeRadius, 0);
        globe.castShadow = true; 
        scene.add(globe);

        pivotPoint = new THREE.Object3D();
        pivotPoint.position.set(0, -globeRadius, 0);
        scene.add(pivotPoint);

        northPole = new THREE.Object3D();
        northPole.position.set(0, globeRadius, 0);
        globe.add(northPole);

        southPole = new THREE.Object3D();
        southPole.position.set(0, -1 * globeRadius, 0);
        globe.add(southPole);
    }

    // Sky box
    {
        const loader = new THREE.TextureLoader();
        const texture = loader.load('./textures/stars.png');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.magFilter = THREE.NearestFilter;
        const repeats = skySize / 50;
        texture.repeat.set(repeats, repeats);

        const skyGeo = new THREE.BoxGeometry(skySize, skySize, skySize);
        const skyMat = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide,
        });
        const mesh = new THREE.Mesh(skyGeo, skyMat);
        mesh.position.set(0, 0, 0);
        scene.add(mesh);
    }
}

function setLights() {
    // Moon
    {
        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(0, skySize / 2, 0);
        light.target.position.set(0, -1 * globeRadius, 0);
        light.castShadow = true;
        light.shadow.bias = 0.01;
        pivotPoint.add(light);
        scene.add(light.target);
    }

    // Hemisphere
    {
        const skyColor = 0x11142e; 
        const groundColor = 0x45ffd4; 
        const intensity = 0.1;
        const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
        scene.add(light);
    }

    // Ambient
    {
        const color = 0xFFFFFF;
        const intensity = 0.3;
        const light = new THREE.AmbientLight(color, intensity);
        scene.add(light);
    }

    // North planet
    {
        const color = 0x112ca6;
        const intensity = 0.7;
        const light = new THREE.SpotLight(color, intensity);
        light.position.set(0, 25, 0);
        light.angle = 0.2;
        light.penumbra = 0.1;
        light.target.position.set(0, 0, 0);
        northPole.add(light);
        northPole.add(light.target);
    }
    
    // South planet
    {
        const color = 0xf2b322;
        const intensity = 0.7;
        const light = new THREE.SpotLight(color, intensity);
        light.position.set(0, -25, 0);
        light.angle = 0.2;
        light.penumbra = 0.1;
        light.target.position.set(0, 0, 0);
        light.castShadow = true;
        southPole.add(light);
        southPole.add(light.target);
    }
}

function setPrimaries() {
    // Moon
    {
        const moonRadius = 6;
        const moonWidthDivisions = 32;
        const moonHeightDivisions = 16;

        const loader = new THREE.TextureLoader();
        const texture = loader.load('./textures/moon.jpg');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.magFilter = THREE.NearestFilter;
        const repeats = 1;
        texture.repeat.set(repeats, repeats);

        const moonGeo = new THREE.SphereGeometry(moonRadius, moonWidthDivisions, moonHeightDivisions);
        const moonMat = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(moonGeo, moonMat);
        mesh.position.set(0, skySize / 2.5, 0);
        pivotPoint.add(mesh);
    }

    // North planet
    {
        const planetRadius = 2;
        const planetWidthDivisions = 32;
        const planetHeightDivisions = 16;

        const loader = new THREE.TextureLoader();
        const texture = loader.load('./textures/neptune.jpg');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.magFilter = THREE.NearestFilter;
        const repeats = 1;
        texture.repeat.set(repeats, repeats);

        const planetGeo = new THREE.SphereGeometry(planetRadius, planetWidthDivisions, planetHeightDivisions);
        const planetMat = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(planetGeo, planetMat);
        mesh.position.set(0, 25, 0);
        northPole.add(mesh);
    }

    // South planet
    {
        const planetRadius = 2;
        const planetWidthDivisions = 32;
        const planetHeightDivisions = 16;

        const loader = new THREE.TextureLoader();
        const texture = loader.load('./textures/saturn.jpg');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.magFilter = THREE.NearestFilter;
        const repeats = 1;
        texture.repeat.set(repeats, repeats);

        const planetGeo = new THREE.SphereGeometry(planetRadius, planetWidthDivisions, planetHeightDivisions);
        const planetMat = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(planetGeo, planetMat);
        mesh.position.set(0, -25, 0);
        southPole.add(mesh);
    }

    // South pole platform
    {
        const geometry = new THREE.CylinderGeometry(3, 3, 0.5, 32);
        const material = new THREE.MeshPhongMaterial({color: 0x6b84b3});
        const cylinder = new THREE.Mesh( geometry, material );
        cylinder.position.y += 0.2;
        cylinder.receiveShadow = true;
        southPole.add(cylinder)
    }

    // Cube
    {
        const geo = new THREE.BoxGeometry(3, 1, 3);
        const material = new THREE.MeshPhongMaterial({color: 0x948666});
        const mesh = new THREE.Mesh(geo, material);
        mesh.position.set(0, -2, 0);
        mesh.castShadow = true;
        southPole.add(mesh);
    }

    // Inner planet 1
    {
        const planetRadius = 10;
        const planetWidthDivisions = 40;
        const planetHeightDivisions = 30;

        const loader = new THREE.TextureLoader();
        const texture = loader.load('./textures/jupiter.jpg');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.magFilter = THREE.NearestFilter;
        const repeats = 1;
        texture.repeat.set(repeats, repeats);

        const planetGeo = new THREE.SphereGeometry(planetRadius, planetWidthDivisions, planetHeightDivisions);
        const planetMat = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(planetGeo, planetMat);
        mesh.position.set(0, -1 * globeRadius, 0);
        scene.add(mesh);
    }

    // Inner planet 2
    {
        const planetRadius = 5;
        const planetWidthDivisions = 40;
        const planetHeightDivisions = 30;

        const loader = new THREE.TextureLoader();
        const texture = loader.load('./textures/mars.jpg');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.magFilter = THREE.NearestFilter;
        const repeats = 1;
        texture.repeat.set(repeats, repeats);

        const planetGeo = new THREE.SphereGeometry(planetRadius, planetWidthDivisions, planetHeightDivisions);
        const planetMat = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(planetGeo, planetMat);
        mesh.position.set(0, -1 * globeRadius, 0);
        scene.add(mesh);
    }

    // Inner planet 3
    {
        const planetRadius = 2;
        const planetWidthDivisions = 40;
        const planetHeightDivisions = 30;

        const loader = new THREE.TextureLoader();
        const texture = loader.load('./textures/pleiades.jpeg');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.magFilter = THREE.NearestFilter;
        const repeats = 1;
        texture.repeat.set(repeats, repeats);

        const planetGeo = new THREE.SphereGeometry(planetRadius, planetWidthDivisions, planetHeightDivisions);
        const planetMat = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(planetGeo, planetMat);
        mesh.position.set(0, -1 * globeRadius, 0);
        scene.add(mesh);
    }

    // Inner cube
    {
        const loader = new THREE.TextureLoader();

        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const materials = [
            new THREE.MeshBasicMaterial({map: loader.load('./textures/mg3.jpg')}),
            new THREE.MeshBasicMaterial({map: loader.load('./textures/mg2.jpg')}),
            new THREE.MeshBasicMaterial({map: loader.load('./textures/mg6.png')}),
            new THREE.MeshBasicMaterial({map: loader.load('./textures/mg1.jpg')}),
            new THREE.MeshBasicMaterial({map: loader.load('./textures/mg5.jpg')}),
            new THREE.MeshBasicMaterial({map: loader.load('./textures/mg4.jpg')}),
        ];
        const cube = new THREE.Mesh( geometry, materials );
        cube.position.set(0, -1 * globeRadius, 0);
        scene.add(cube);
    }

    for (let i = 0; i < 50; i++) {
        // Sphere
        {
            const xPos = Math.random() * 10 - 5;
            const yPos = Math.random() * 10;
            const zPos = Math.random() * 10 - 5;

            const sphereRadius = Math.random() / 8;
            const sphereWidthDivisions = 10;
            const sphereHeightDivisions = 5;
            const sphereGeo = new THREE.SphereGeometry(sphereRadius, sphereWidthDivisions, sphereHeightDivisions);
            const color = particleColors[Math.trunc(Math.random() * particleColors.length)]
            const sphereMat = new THREE.MeshBasicMaterial({color: color});
            const mesh = new THREE.Mesh(sphereGeo, sphereMat);
            mesh.position.set(xPos, yPos, zPos);
            northPole.add(mesh);

            particles.push(mesh);
        }
    }
}

function setObjects() {
    {
        const mtlLoader = new MTLLoader();
        mtlLoader.load('./objects/tree/tree.mtl', (mtl) => {
            mtl.preload();
            const objLoader = new OBJLoader();
            objLoader.setMaterials(mtl);
            objLoader.load('./objects/tree/tree.obj', (root) => {
                root.receiveShadow = true;
                root.position.set(0, globeRadius, 0);
                root.scale.set(3, 3, 3);
                globe.add(root);
            });
        });
    }

    {
    const mtlLoader = new MTLLoader();
    mtlLoader.load('./objects/anemone/anemone.mtl', (mtl) => {
        mtl.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(mtl);
        objLoader.load('./objects/anemone/anemone.obj', (root) => {
            let pos = sphericalToCart(globeRadius, 2 * Math.PI / 3, Math.PI / 3);

            root.receiveShadow = true;
            root.scale.set(0.1, 0.1, 0.1);
            root.position.set(pos[0], pos[1], pos[2]);
            root.rotation.x = -0.5;
            root.rotation.z = -1;
            globe.add(root);
        });
    });
    }

    {
    const mtlLoader = new MTLLoader();
    mtlLoader.load('./objects/anemone/anemone.mtl', (mtl) => {
        mtl.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(mtl);
        objLoader.load('./objects/anemone/anemone.obj', (root) => {
            let pos = sphericalToCart(globeRadius, Math.PI / 2,  Math.PI / -2);

            root.receiveShadow = true;
            root.scale.set(0.1, 0.1, 0.1);
            root.position.set(pos[0], pos[1], pos[2]);
            root.rotation.y = -3;
            globe.add(root);
        });
    });
    }

    {
    const mtlLoader = new MTLLoader();
    mtlLoader.load('./objects/crocus/crocus.mtl', (mtl) => {
        mtl.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(mtl);
        objLoader.load('./objects/crocus/crocus.obj', (root) => {
            let pos = sphericalToCart(globeRadius, Math.PI / 4, 5 * Math.PI / 3);

            root.receiveShadow = true;
            root.scale.set(0.1, 0.1, 0.1);
            root.position.set(pos[0], pos[1], pos[2]);
            root.rotation.x = -2.5;
            root.rotation.y = -0.5;
            globe.add(root);
        });
    });
    }

    {
    const mtlLoader = new MTLLoader();
    mtlLoader.load('./objects/crocus/crocus.mtl', (mtl) => {
        mtl.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(mtl);
        objLoader.load('./objects/crocus/crocus.obj', (root) => {
            let pos = sphericalToCart(globeRadius, Math.PI / -2,  Math.PI / -2);

            root.receiveShadow = true;
            root.scale.set(0.1, 0.1, 0.1);
            root.position.set(pos[0], pos[1], pos[2]);
            root.rotation.z = -3;
            globe.add(root);
        });
    });
    }

    {
    const mtlLoader = new MTLLoader();
    mtlLoader.load('./objects/dandelion/dandelion.mtl', (mtl) => {
        mtl.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(mtl);
        objLoader.load('./objects/dandelion/dandelion.obj', (root) => {
            let pos = sphericalToCart(globeRadius, 5 * Math.PI / 3,  2 * Math.PI / 3);

            root.receiveShadow = true;
            root.position.set(pos[0], pos[1], pos[2]);
            root.rotation.x = 2.5;
            root.rotation.y = 0.5;
            globe.add(root);
        });
    });
    }

    {
    const mtlLoader = new MTLLoader();
    mtlLoader.load('./objects/purple-weed/purple-weed.mtl', (mtl) => {
        mtl.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(mtl);
        objLoader.load('./objects/purple-weed/purple-weed.obj', (root) => {
            let pos = sphericalToCart(globeRadius, Math.PI / 4, 4 * Math.PI / 3);

            root.receiveShadow = true;
            root.scale.set(0.01, 0.01, 0.01);
            root.position.set(pos[0], pos[1], pos[2]);
            root.rotation.x = -2;
            root.rotation.z = 1;
            globe.add(root);
        });
    });
    }

    {
    const mtlLoader = new MTLLoader();
    mtlLoader.load('./objects/purple-bush/purple-bush.mtl', (mtl) => {
        mtl.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(mtl);
        objLoader.load('./objects/purple-bush/purple-bush.obj', (root) => {
            let pos = sphericalToCart(globeRadius, -1 * Math.PI / 6, -1 *  Math.PI / 3);

            root.receiveShadow = true;
            root.scale.set(0.01, 0.01, 0.01);
            root.position.set(pos[0], pos[1], pos[2]);
            root.rotation.y = 0.5;
            root.rotation.z = 0.5;
            globe.add(root);
        });
    });
    }

    {
    const mtlLoader = new MTLLoader();
    mtlLoader.load('./objects/purple-bush/purple-bush.mtl', (mtl) => {
        mtl.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(mtl);
        objLoader.load('./objects/purple-bush/purple-bush.obj', (root) => {
            let pos = sphericalToCart(globeRadius, Math.PI / 2, 2 * Math.PI / 3);

            root.receiveShadow = true;
            root.scale.set(0.01, 0.01, 0.01);
            root.position.set(pos[0], pos[1], pos[2]);
            root.rotation.x = 2;
            root.rotation.y = 0.5;
            globe.add(root);
        });
    });
    }

    {
    const mtlLoader = new MTLLoader();
    mtlLoader.load('./objects/purple-fern/purple-fern.mtl', (mtl) => {
        mtl.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(mtl);
        objLoader.load('./objects/purple-fern/purple-fern.obj', (root) => {
            let pos = sphericalToCart(globeRadius, Math.PI / 4, Math.PI / 2);

            root.receiveShadow = true;
            root.scale.set(0.01, 0.01, 0.01);
            root.position.set(pos[0], pos[1], pos[2]);
            root.rotation.z = -1.5;
            root.rotation.y = -0.5;
            globe.add(root);
        });
    });
    }

    {
    const mtlLoader = new MTLLoader();
    mtlLoader.load('./objects/hydrangea/hydrangea.mtl', (mtl) => {
        mtl.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(mtl);
        objLoader.load('./objects/hydrangea/hydrangea.obj', (root) => {
            let pos = sphericalToCart(globeRadius, Math.PI / 6, 2 * Math.PI / 6);

            root.receiveShadow = true;
            root.scale.set(0.01, 0.01, 0.01);
            root.position.set(pos[0], pos[1], pos[2]);
            root.rotation.z = -1;
            globe.add(root);
        });
    });
    }

    {
    const mtlLoader = new MTLLoader();
    mtlLoader.load('./objects/magenta-bush/magenta-bush.mtl', (mtl) => {
        mtl.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(mtl);
        objLoader.load('./objects/magenta-bush/magenta-bush.obj', (root) => {
            let pos = sphericalToCart(globeRadius, -2 * Math.PI / 6, 2 * Math.PI / 6);

            root.receiveShadow = true;
            root.scale.set(0.01, 0.01, 0.01);
            root.position.set(pos[0], 2 + pos[1], pos[2]);
            root.rotation.x = -2;
            root.rotation.y = -2;
            globe.add(root);
        });
    });
    }

    {
    const mtlLoader = new MTLLoader();
    mtlLoader.load('./objects/snowdrop/snowdrop.mtl', (mtl) => {
        mtl.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(mtl);
        objLoader.load('./objects/snowdrop/snowdrop.obj', (root) => {
            let pos = sphericalToCart(globeRadius, Math.PI / 3, 2 * Math.PI / 3);

            root.receiveShadow = true;
            root.scale.set(0.6, 0.6, 0.6);
            root.position.set(pos[0], pos[1], pos[2]);
            root.rotation.y = 0.5;
            root.rotation.x = 0.5;
            globe.add(root);
        });
    });
    }

    {
    const mtlLoader = new MTLLoader();
    mtlLoader.load('./objects/rocks/rocks.mtl', (mtl) => {
        mtl.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(mtl);
        objLoader.load('./objects/rocks/rocks.obj', (root) => {
            let pos = sphericalToCart(globeRadius, 0, Math.PI);

            root.receiveShadow = true;
            root.position.set(0.5 + pos[0], -10 + pos[1], pos[2]);
            root.scale.set(1.5, 1.5, 1.5);
            root.rotation.z = Math.PI / 2;
            globe.add(root);
        });
    });
    }
}

function sphericalToCart(radius, theta, phi) {
    let x = radius * Math.sin(phi) * Math.cos(theta);
    let y = radius * Math.cos(phi);
    let z = radius * Math.sin(phi) * Math.sin(theta);

    return [x, y, z];
}

main();