import {
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshPhongMaterial,
  PerspectiveCamera,
  PointLight,
  Scene,
  TorusKnotGeometry,
  WebGLRenderer,
} from 'three';
import { GpuAsciiEffect } from '../lib/GpuAsciiEffect';

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
    const lowPower = innerWidth < 720 || Boolean(connection?.saveData);
    const asciiResolution = lowPower ? 0.08 : 0.105;

    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 1);

    const effect = new GpuAsciiEffect(renderer, ' .,:;i1tfLCG08@', {
      resolution: asciiResolution,
    });
    effect.domElement.className = 'ascii-output';
    effect.domElement.setAttribute('aria-hidden', 'true');
    mount.replaceChildren(effect.domElement);

    const group = new Group();
    scene.add(group);

    const smooth = new MeshPhongMaterial({
      color: 0xe6e6e6,
      emissive: 0x050505,
      shininess: 100,
    });
    const object = new Mesh(new TorusKnotGeometry(1.35, 0.42, 96, 12, 2, 3), smooth);
    group.add(object);

    scene.add(new HemisphereLight(0xffffff, 0x111111, 1.7));
    const keyLight = new DirectionalLight(0xffffff, 3);
    keyLight.position.set(3, 4, 5);
    scene.add(keyLight);
    const rimLight = new PointLight(0xffffff, 14, 18);
    rimLight.position.set(-4, -2, 4);
    scene.add(rimLight);

    const baseGroupZ = group.rotation.z;
    let lastFrame = 0;
    let motionElapsed = 0;
    let previousMotionFrame: number | null = null;
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

      if (advance) {
        if (previousMotionFrame !== null) {
          motionElapsed += Math.min(Math.max(time - previousMotionFrame, 0), 100);
        }
        previousMotionFrame = time;
      }

      const seconds = motionElapsed * 0.001;
      group.rotation.x = seconds * 0.34;
      group.rotation.y = seconds * 0.58;
      group.rotation.z = baseGroupZ + Math.sin(seconds * 0.43) * 0.14;

      effect.render(scene, camera);
      renderedFrames += 1;
      field.dataset.renderedFrames = String(renderedFrames);
    }

    function animate(time: number) {
      animationFrame = requestAnimationFrame(animate);
      const frameInterval = reducedMotion.matches ? 100 : lowPower ? 80 : 50;
      if (time - lastFrame < frameInterval) return;
      render(time);
    }

    function syncMotion() {
      cancelAnimationFrame(animationFrame);
      previousMotionFrame = null;
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
      render(performance.now(), false);
    }

    animationToggle.addEventListener('click', () => {
      userPaused = !userPaused;
      writePausePreference(userPaused);
      updateToggle();
      if (!userPaused) lastFrame = 0;
      syncMotion();
    });

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
