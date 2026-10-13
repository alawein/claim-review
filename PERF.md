# Performance budgets

Standalone dist/index.html gzip budget80000bytes, enforced by scripts/perf-budget.mjs in CI; current measured build is about33KiB gzip. No CDN, runtime npm packages, remote fonts or source retrieval. Shared design tokens are compiled locally. Canonical budget is the script; exact candidate bytes appear in check output.

Lighthouse CI (.lighthouserc.json): LCP<=2500ms, TBT<=200ms, accessibility1.0, performance>=0.9 warning. Browser CI exercises all eight appearance/vibe combinations with axe WCAG2/2.1/2.2AA tags and reduced motion, on Chromium/Firefox/WebKit. Automated accessibility is partial coverage, not WCAG certification or manual screen-reader proof.

Target field INP<200ms remains unverified. Playwright records real event-duration maxima and local-file LCP, explicitly distinct from field INP. RAF cadence and machine details are in RESULTS.md. Frame capture is post-workflow; interactive rendering60fps on a representative midrange laptop remains partial rather than certified.

CSS animation changes only transform/opacity/filter. No permanent will-change. Calm pointer parallax is event-driven; Cartoon completion is finite and only follows all current citation-pair reviews, never semantic correctness. Pixel uses stepped easing and static dither; Lab favors density. Stale state has dashed border and text with an opacity/transform arrival. Pause, reduced motion and hidden document stop nonessential animation; static CSS hero remains if WebGL2 is unavailable. WebGPU is deliberately omitted as unnecessary.

Reproduce recordings/metrics: `node benchmarks/ui.mjs`; convert captured WebM with ffmpeg to docs/demos/*.gif. Reproduce LHCI: set CHROME_PATH to Playwright Chromium executable, then `npx lhci autorun`. Measurements vary by workload and hardware; do not silently lower budgets for a failing candidate.
