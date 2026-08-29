declare module 'three/examples/jsm/renderers/CSS2DRenderer.js' {
  import { Object3D, Scene, Camera } from 'three';
  export class CSS2DObject extends Object3D {
    element: HTMLElement;
    constructor(element?: HTMLElement);
  }
  export class CSS2DRenderer {
    domElement: HTMLElement;
    setSize(width: number, height: number): void;
    render(scene: Scene, camera: Camera): void;
  }
}

declare module 'three/examples/jsm/postprocessing/Pass.js' {
  export class Pass {
    constructor();
  }
}

declare module 'three/examples/jsm/postprocessing/EffectComposer.js' {
  import { WebGLRenderer, WebGLRenderTarget } from 'three';
  import { Pass } from 'three/examples/jsm/postprocessing/Pass.js';
  export class EffectComposer {
    constructor(renderer: WebGLRenderer, renderTarget?: WebGLRenderTarget);
    addPass(pass: Pass): void;
    render(): void;
    setSize(width: number, height: number): void;
    setPixelRatio(value: number): void;
    dispose(): void;
  }
}

declare module 'three/examples/jsm/postprocessing/RenderPass.js' {
  import { Scene, Camera } from 'three';
  import { Pass } from 'three/examples/jsm/postprocessing/Pass.js';
  export class RenderPass extends Pass {
    constructor(scene: Scene, camera: Camera);
  }
}

declare module 'three/examples/jsm/postprocessing/UnrealBloomPass.js' {
  import { Vector2 } from 'three';
  import { Pass } from 'three/examples/jsm/postprocessing/Pass.js';
  export class UnrealBloomPass extends Pass {
    strength: number;
    radius: number;
    threshold: number;
    constructor(resolution: Vector2, strength: number, radius: number, threshold: number);
  }
}

declare module 'three/examples/jsm/postprocessing/OutputPass.js' {
  import { Pass } from 'three/examples/jsm/postprocessing/Pass.js';
  export class OutputPass extends Pass {
    constructor();
  }
}
