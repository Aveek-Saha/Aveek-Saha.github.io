import {
  CatmullRomCurve3,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  DodecahedronGeometry,
  Group,
  HemisphereLight,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  OctahedronGeometry,
  PerspectiveCamera,
  PointLight,
  Scene,
  TetrahedronGeometry,
  TorusGeometry,
  TorusKnotGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import type { BufferGeometry, Material } from 'three';
import { AsciiEffect } from 'three/addons/effects/AsciiEffect.js';

const pausePreference = 'portfolio-animation-paused';

function readPausePreference() {
  try {
    return localStorage.getItem(pausePreference) === 'true';
  } catch {
    return false;
  }
}

function writePausePreference(paused: boolean) {
  try {
    localStorage.setItem(pausePreference, String(paused));
  } catch {
    // The control still works for this page when storage is unavailable.
  }
}

export function initialiseAsciiScenes(fields: HTMLElement[]) {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  fields.forEach((field) => {
    if (field.dataset.sceneReady) return;
    field.dataset.sceneReady = 'true';

    const mount = field.querySelector<HTMLElement>('.ascii-scene');
    const toggle = field.querySelector<HTMLButtonElement>('[data-animation-toggle]');
    if (!mount || !toggle) return;
    const animationToggle = toggle;

    const variant = field.dataset.asciiScene ?? 'network';
    const scene = new Scene();
    const camera = new PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 7);

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'low-power' });
    } catch {
      field.dataset.animationState = 'unsupported';
      animationToggle.hidden = true;
      return;
    }

    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const lowPower = innerWidth < 720 || Boolean(connection?.saveData) || navigator.hardwareConcurrency <= 4;
    const asciiResolution = lowPower ? 0.08 : 0.105;

    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 1);

    const effect = new AsciiEffect(renderer, ' .,:;i1tfLCG08@', {
      invert: true,
      resolution: asciiResolution,
      scale: 1,
      color: false,
      alpha: false,
      block: false,
    });
    effect.domElement.className = 'ascii-output';
    effect.domElement.setAttribute('aria-hidden', 'true');
    effect.domElement.style.color = '#b9b9c0';
    effect.domElement.style.backgroundColor = 'transparent';
    mount.replaceChildren(effect.domElement);

    const group = new Group();
    scene.add(group);

    const solid = new MeshPhongMaterial({
      color: 0xf3f3f3,
      emissive: 0x090909,
      shininess: 80,
      flatShading: true,
    });
    const smooth = new MeshPhongMaterial({
      color: 0xe6e6e6,
      emissive: 0x050505,
      shininess: 100,
    });
    const wire = new MeshBasicMaterial({ color: 0xffffff, wireframe: true });

    function mesh(geometry: BufferGeometry, material: Material = solid) {
      const object = new Mesh(geometry, material);
      group.add(object);
      return object;
    }

    if (variant === 'network') {
      mesh(new TorusKnotGeometry(1.35, 0.42, 96, 12, 2, 3), smooth);
    } else if (variant === 'drift') {
      const makeHelix = (offset: number) => {
        const points = Array.from({ length: 36 }, (_, index) => {
          const progress = index / 35;
          const angle = progress * Math.PI * 4 + offset;
          return new Vector3(Math.cos(angle) * 1.15, (progress - 0.5) * 3.6, Math.sin(angle) * 1.15);
        });
        return new CatmullRomCurve3(points);
      };

      mesh(new TubeGeometry(makeHelix(0), 72, 0.1, 6, false), smooth);
      mesh(new TubeGeometry(makeHelix(Math.PI), 72, 0.1, 6, false), smooth);

      for (let index = 0; index < 7; index += 1) {
        const progress = (index + 0.5) / 7;
        const angle = progress * Math.PI * 4;
        const start = new Vector3(Math.cos(angle) * 1.15, (progress - 0.5) * 3.6, Math.sin(angle) * 1.15);
        const end = start.clone().multiply(new Vector3(-1, 1, -1));
        const direction = end.clone().sub(start);
        const rung = mesh(new CylinderGeometry(0.035, 0.035, direction.length(), 5), wire);
        rung.position.copy(start).add(end).multiplyScalar(0.5);
        rung.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize());
      }
      group.rotation.z = -0.35;
    } else if (variant === 'matrix') {
      const profile = [
        new Vector2(0.18, -1.8),
        new Vector2(0.82, -1.5),
        new Vector2(1.3, -0.82),
        new Vector2(0.48, -0.12),
        new Vector2(0.48, 0.12),
        new Vector2(1.3, 0.82),
        new Vector2(0.82, 1.5),
        new Vector2(0.18, 1.8),
      ];
      mesh(new LatheGeometry(profile, 36), wire);
      const core = mesh(new OctahedronGeometry(0.6, 0), solid);
      core.rotation.z = Math.PI / 4;
    } else if (variant === 'constellation') {
      const cone = mesh(new ConeGeometry(1.15, 2.7, 12, 1), solid);
      const ringA = mesh(new TorusGeometry(1.7, 0.11, 8, 48), smooth);
      const ringB = mesh(new TorusGeometry(1.25, 0.07, 6, 40), wire);
      cone.rotation.z = -0.18;
      ringA.rotation.x = 1.15;
      ringB.rotation.set(0.72, 0.48, 0.2);
    } else {
      mesh(new DodecahedronGeometry(0.95, 0), solid);
      for (let index = 0; index < 6; index += 1) {
        const angle = index / 6 * Math.PI * 2;
        const satellite = mesh(new TetrahedronGeometry(0.34, 0), smooth);
        satellite.position.set(Math.cos(angle) * 2.15, Math.sin(angle) * 1.2, Math.sin(angle) * 0.65);
        satellite.rotation.set(angle, angle * 0.7, 0);
      }
    }

    scene.add(new HemisphereLight(0xffffff, 0x111111, 1.7));
    const keyLight = new DirectionalLight(0xffffff, 3);
    keyLight.position.set(3, 4, 5);
    scene.add(keyLight);
    const rimLight = new PointLight(0xffffff, 14, 18);
    rimLight.position.set(-4, -2, 4);
    scene.add(rimLight);

    const pointer = { x: 0, y: 0 };
    let lastFrame = 0;
    let renderedFrames = 0;
    let animationFrame = 0;
    let isVisible = true;
    let userPaused = readPausePreference();

    function updateToggle() {
      animationToggle.textContent = userPaused ? 'Start animation' : 'Stop animation';
      animationToggle.setAttribute('aria-pressed', String(userPaused));
    }

    function render(time: number, advance = true) {
      lastFrame = time;
      const seconds = time * 0.001;
      const motionScale = reducedMotion.matches ? 0.18 : 1;
      const motionTime = seconds * motionScale;

      if (advance) {
        group.rotation.x = motionTime * 0.34 + pointer.y * 0.22 * motionScale;
        group.rotation.y = motionTime * 0.58 + pointer.x * 0.28 * motionScale;
        group.rotation.z += Math.sin(motionTime * 0.43) * 0.0008 * motionScale;
        if (variant === 'orbit') {
          group.children.forEach((child, index) => {
            if (index > 0) child.rotation.y += 0.002 * (index + 1) * motionScale;
          });
        } else if (variant === 'matrix') {
          group.children[1].rotation.y += 0.012 * motionScale;
        }
      }

      effect.render(scene, camera);
      renderedFrames += 1;
      field.dataset.renderedFrames = String(renderedFrames);
    }

    function animate(time: number) {
      animationFrame = requestAnimationFrame(animate);
      const frameInterval = reducedMotion.matches ? 160 : lowPower ? 80 : 50;
      if (time - lastFrame < frameInterval) return;
      render(time);
    }

    function syncMotion() {
      cancelAnimationFrame(animationFrame);
      const canAnimate = !userPaused && isVisible && !document.hidden;

      if (!canAnimate) {
        field.dataset.animationState = userPaused ? 'paused' : 'suspended';
        return;
      }

      field.dataset.animationState = reducedMotion.matches ? 'running-reduced' : 'running';
      animationFrame = requestAnimationFrame(animate);
    }

    function resize() {
      const width = Math.max(1, field.clientWidth);
      const height = Math.max(1, field.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      effect.setSize(width, height);
      render(performance.now(), !userPaused);
    }

    animationToggle.addEventListener('click', () => {
      userPaused = !userPaused;
      writePausePreference(userPaused);
      updateToggle();
      if (!userPaused) lastFrame = 0;
      syncMotion();
    });

    field.addEventListener('pointermove', (event) => {
      const bounds = field.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      pointer.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    }, { passive: true });

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(field);

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      syncMotion();
    }, { threshold: 0.05 });
    visibilityObserver.observe(field);

    document.addEventListener('visibilitychange', syncMotion);
    reducedMotion.addEventListener('change', syncMotion);
    updateToggle();
    resize();
    syncMotion();
  });
}
