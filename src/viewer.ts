export function setupViewer(): void {
  const root = document.documentElement;
  const stopMotion = () => document.getAnimations().forEach((animation) => animation.cancel());
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  reduced.addEventListener("change", () => {
    if (reduced.matches) stopMotion();
  });
  const theme = document.getElementById("theme") as HTMLSelectElement;
  const vibe = document.getElementById("vibe") as HTMLSelectElement;
  const pause = document.getElementById("motion-pause") as HTMLButtonElement;
  theme.value = root.dataset.theme ?? "dark";
  vibe.value = root.dataset.vibe ?? "calm";
  const apply = () => {
    root.dataset.theme = theme.value;
    root.dataset.vibe = vibe.value;
    try {
      localStorage.setItem(
        "siftgrain-viewer",
        JSON.stringify({ theme: theme.value, vibe: vibe.value }),
      );
    } catch {
      /* Preferences are optional. */
    }
    drawHero();
  };
  theme.addEventListener("change", apply);
  vibe.addEventListener("change", apply);
  pause.addEventListener("click", () => {
    const paused = pause.getAttribute("aria-pressed") !== "true";
    pause.setAttribute("aria-pressed", String(paused));
    root.dataset.paused = String(paused);
    if (paused) stopMotion();
  });
  document.addEventListener("visibilitychange", () => {
    root.dataset.hidden = String(document.hidden);
    if (document.hidden) stopMotion();
  });
  const hero = document.querySelector<HTMLElement>(".hero");
  hero?.addEventListener("pointermove", (event) => {
    if (
      root.dataset.vibe !== "calm" ||
      root.dataset.paused === "true" ||
      document.hidden ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const bounds = hero.getBoundingClientRect();
    const canvas = document.getElementById("hero-canvas");
    if (canvas)
      canvas.style.transform = `translate(${(event.clientX - bounds.left - bounds.width / 2) * 0.008}px, ${(event.clientY - bounds.top - bounds.height / 2) * 0.008}px)`;
  });
  hero?.addEventListener("pointerleave", () => {
    const canvas = document.getElementById("hero-canvas");
    if (canvas) canvas.style.transform = "";
  });
  // The CSS hero paints immediately; WebGL initializes on explicit viewer interaction.
}
function drawHero(burst = false): void {
  const canvas = document.getElementById("hero-canvas") as HTMLCanvasElement;
  // One draw per user change. Static CSS background remains when WebGL2 is absent.
  const gl = canvas.getContext("webgl2", { antialias: false, failIfMajorPerformanceCaveat: true });
  if (!gl) {
    canvas.hidden = true;
    return;
  }
  const shader = (type: number, source: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      gl.deleteShader(s);
      return null;
    }
    return s;
  };
  const vertex = shader(
    gl.VERTEX_SHADER,
    `#version 300 es
 uniform float t;void main(){float x=float(gl_VertexID%12)/6.-.92;float y=sin(float(gl_VertexID)*1.7)*.65;gl_Position=vec4(x+sin(float(gl_VertexID))*t*.2,y+t*.4,0,1);gl_PointSize=5.;}`,
  );
  const fragment = shader(
    gl.FRAGMENT_SHADER,
    `#version 300 es
 precision mediump float;out vec4 color;void main(){color=vec4(1.,.77,.42,.65);}`,
  );
  if (!vertex || !fragment) {
    canvas.hidden = true;
    return;
  }
  const program = gl.createProgram()!;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  const dispose = () => {
    gl.deleteProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
  };
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    dispose();
    canvas.hidden = true;
    return;
  }
  const started = performance.now();
  const render = (now: number) => {
    const progress = burst ? Math.min((now - started) / 500, 1) : 0;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.uniform1f(gl.getUniformLocation(program, "t"), progress);
    gl.drawArrays(gl.POINTS, 0, 24);
    if (
      burst &&
      progress < 1 &&
      !document.hidden &&
      document.documentElement.dataset.paused !== "true" &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      requestAnimationFrame(render);
    else dispose();
  };
  render(started);
}
export function celebrate(): void {
  const root = document.documentElement;
  if (
    root.dataset.vibe !== "cartoon" ||
    root.dataset.paused === "true" ||
    document.hidden ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;
  drawHero(true);
  const hero = document.querySelector(".hero");
  hero?.getAnimations().forEach((a) => a.cancel());
  hero?.animate(
    [
      { transform: "scale(1)" },
      { transform: "scale(1.02,.98)" },
      { transform: "scale(.99,1.02)" },
      { transform: "scale(1)" },
    ],
    { duration: 500, easing: "ease-out" },
  );
}
