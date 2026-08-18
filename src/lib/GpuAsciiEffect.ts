import {
  CanvasTexture,
  Color,
  LinearFilter,
  Mesh,
  NearestFilter,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderTarget,
} from 'three';
import type { Camera, Object3D, WebGLRenderer } from 'three';

type GpuAsciiEffectOptions = {
  resolution?: number;
};

export class GpuAsciiEffect {
  readonly domElement: HTMLCanvasElement;

  private readonly renderer: WebGLRenderer;
  private readonly target: WebGLRenderTarget;
  private readonly postScene = new Scene();
  private readonly postCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly material: ShaderMaterial;
  private readonly resolution: number;

  constructor(
    renderer: WebGLRenderer,
    characters = ' .,:;i1tfLCG08@',
    { resolution = 0.105 }: GpuAsciiEffectOptions = {},
  ) {
    this.renderer = renderer;
    this.resolution = resolution;
    this.domElement = renderer.domElement;

    this.target = new WebGLRenderTarget(1, 1, {
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      depthBuffer: true,
      stencilBuffer: false,
    });

    const glyphAtlas = this.createGlyphAtlas(characters);
    this.material = new ShaderMaterial({
      depthTest: false,
      depthWrite: false,
      uniforms: {
        sourceTexture: { value: this.target.texture },
        glyphAtlas: { value: glyphAtlas },
        gridSize: { value: new Vector2(1, 1) },
        characterCount: { value: characters.length },
        asciiColor: { value: new Color(0xb9b9c0) },
      },
      vertexShader: `
        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;

        uniform sampler2D sourceTexture;
        uniform sampler2D glyphAtlas;
        uniform vec2 gridSize;
        uniform float characterCount;
        uniform vec3 asciiColor;
        varying vec2 vUv;

        void main() {
          vec2 gridPosition = vUv * gridSize;
          vec2 cell = floor(gridPosition);
          vec2 sourceUv = (cell + 0.5) / gridSize;
          vec3 source = texture2D(sourceTexture, sourceUv).rgb;
          float brightness = dot(source, vec3(0.299, 0.587, 0.114));
          float characterIndex = floor(brightness * (characterCount - 1.0) + 0.5);
          vec2 glyphUv = vec2(
            (characterIndex + fract(gridPosition.x)) / characterCount,
            fract(gridPosition.y)
          );
          float glyph = texture2D(glyphAtlas, glyphUv).r;
          gl_FragColor = vec4(asciiColor * glyph, 1.0);
        }
      `,
    });

    const quad = new Mesh(new PlaneGeometry(2, 2), this.material);
    quad.frustumCulled = false;
    this.postScene.add(quad);
  }

  private createGlyphAtlas(characters: string) {
    const cellWidth = 24;
    const cellHeight = 48;
    const canvas = document.createElement('canvas');
    canvas.width = cellWidth * characters.length;
    canvas.height = cellHeight;

    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Canvas 2D is unavailable');

    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#fff';
    context.font = '32px "Courier New", monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    [...characters].forEach((character, index) => {
      context.fillText(character, index * cellWidth + cellWidth / 2, cellHeight / 2);
    });

    const texture = new CanvasTexture(canvas);
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.generateMipmaps = false;
    return texture;
  }

  setSize(width: number, height: number) {
    const columns = Math.max(1, Math.floor(width * this.resolution));
    const rows = Math.max(1, Math.floor(height * this.resolution * 0.5));
    this.target.setSize(columns, rows);
    this.material.uniforms.gridSize.value.set(columns, rows);

    this.renderer.setSize(width, height, false);
    this.domElement.style.width = '100%';
    this.domElement.style.height = '100%';
  }

  render(scene: Object3D, camera: Camera) {
    this.renderer.setRenderTarget(this.target);
    this.renderer.render(scene, camera);
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.postScene, this.postCamera);
  }
}
