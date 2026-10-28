/* Osmium AI — interactions */
(() => {
  "use strict";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ------------------------------------------------------------
     Dotted canvas halo
  ------------------------------------------------------------ */
  class DotHalo {
    constructor(canvas, o = {}) {
      this.c = canvas;
      this.ctx = canvas.getContext("2d");
      this.o = Object.assign({ gap: 6, r: 0.6, radius: 120, alpha: 0.3 }, o);
      this.x = this.tx = -999;
      this.y = this.ty = -999;
      this.v = this.vt = 0;
      this.raf = 0;
      this.dpr = Math.min(devicePixelRatio || 1, 2);
      this.frame = this.frame.bind(this);
      new ResizeObserver(() => this.resize()).observe(canvas);
      this.resize();
      if (reduce) return;
      window.addEventListener("pointermove", (e) => {
        const b = this.c.getBoundingClientRect();
        this.tx = e.clientX - b.left;
        this.ty = e.clientY - b.top;
        this.vt = (this.tx > 0 && this.ty > 0 && this.tx < b.width && this.ty < b.height) ? 1 : 0;
        if (this.v < 0.02) { this.x = this.tx; this.y = this.ty; }
        if (!this.raf) this.raf = requestAnimationFrame(this.frame);
      }, { passive: true });
    }
    resize() {
      const b = this.c.getBoundingClientRect();
      this.w = b.width;
      this.h = b.height;
      this.c.width = Math.round(b.width * this.dpr);
      this.c.height = Math.round(b.height * this.dpr);
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }
    frame() {
      this.x += (this.tx - this.x) * 0.14;
      this.y += (this.ty - this.y) * 0.14;
      this.v += (this.vt - this.v) * 0.1;
      const { ctx, o } = this;
      ctx.clearRect(0, 0, this.w, this.h);
      const g = o.gap, R = o.radius;
      const x0 = Math.max(0, Math.floor((this.x - R) / g) * g);
      const x1 = Math.min(this.w, this.x + R);
      const y0 = Math.max(0, Math.floor((this.y - R) / g) * g);
      const y1 = Math.min(this.h, this.y + R);
      if (this.v > 0.01) {
        for (let y = y0 + g / 2; y < y1; y += g) {
          for (let x = x0 + g / 2; x < x1; x += g) {
            const d = Math.hypot(x - this.x, y - this.y);
            if (d > R) continue;
            const k = 1 - d / R;
            const a = o.alpha * k * k * this.v;
            ctx.fillStyle = "rgba(255,255,255," + a.toFixed(3) + ")";
            ctx.beginPath();
            ctx.arc(x, y, o.r, 0, 6.2832);
            ctx.fill();
          }
        }
      }
      this.raf = (this.v > 0.01 || Math.abs(this.vt - this.v) > 0.01) ? requestAnimationFrame(this.frame) : 0;
    }
  }
  const hc = $("#heroDots");
  if (hc) new DotHalo(hc);

  /* ------------------------------------------------------------
     Hero video — smooth playback rate
  ------------------------------------------------------------ */
  const vid = $("#heroVideo");
  if (vid) {
    if (reduce) {
      vid.pause();
      vid.removeAttribute("autoplay");
    } else {
      vid.playbackRate = 0.5;
      const p = vid.play();
      if (p && p.catch) p.catch(() => {});
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
          vid.playbackRate = 0.5;
          vid.play().catch(() => {});
        }
      });
    }
  }

  /* ------------------------------------------------------------
     Nav — Transparent over hero, light theme on scroll
     Matches website background (#F6F5F2)
  ------------------------------------------------------------ */
  const nav = $("#nav");
  const hero = $("#hero");
  const updateNav = () => {
    if (!hero || !nav) return;
    const heroBottom = hero.getBoundingClientRect().bottom;
    // Switch to light navbar as hero exits (nav height is ~60px)
    nav.classList.toggle("is-solid", heroBottom <= 68);
  };
  updateNav();
  window.addEventListener("scroll", updateNav, { passive: true });

  /* ------------------------------------------------------------
     Mobile menu
  ------------------------------------------------------------ */
  const toggle = $("#navToggle"), mobileMenu = $("#mobileMenu");
  const setMenu = (open) => {
    if (!toggle || !mobileMenu) return;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    mobileMenu.hidden = !open;
  };
  if (toggle && mobileMenu) {
    toggle.addEventListener("click", () => setMenu(mobileMenu.hidden));
    mobileMenu.addEventListener("click", (e) => {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !mobileMenu.hidden) setMenu(false);
    });
    window.matchMedia("(min-width: 769px)").addEventListener("change", (m) => {
      if (m.matches) setMenu(false);
    });
  }

  /* ------------------------------------------------------------
     Smooth scroll for all internal anchor links
  ------------------------------------------------------------ */
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href^='#']");
    if (!a) return;
    const id = a.getAttribute("href").slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    if (mobileMenu && !mobileMenu.hidden) setMenu(false);
  });

  /* ------------------------------------------------------------
     Scroll reveal
  ------------------------------------------------------------ */
  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -5% 0px" });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  /* ------------------------------------------------------------
     Statement: words light up with smooth, intentional human scroll
     Uses damped momentum (lerp) so mousewheel or touch feels silky
  ------------------------------------------------------------ */
  const st = $("[data-words]");
  if (st) {
    const text = st.textContent.trim().replace(/\s+/g, " ");
    st.setAttribute("aria-label", text);
    st.textContent = "";

    const words = text.split(" ").map((w, i, arr) => {
      const s = document.createElement("span");
      s.className = "w";
      s.setAttribute("aria-hidden", "true");
      s.textContent = w + (i < arr.length - 1 ? " " : "");
      st.appendChild(s);
      return s;
    });

    if (reduce) {
      words.forEach((w) => {
        w.style.color = "#121212";
        w.classList.add("on");
      });
    } else {
      let targetProgress = 0;
      let currentProgress = 0;
      let rafId = 0;

      const calcTargetProgress = () => {
        const b = st.getBoundingClientRect();
        const vh = window.innerHeight;
        // Starts later (80% vh) and finishes much lower (10% vh) = longer scroll distance
        const start = vh * 0.80;
        const end = vh * 0.10;
        const totalDist = start - end;
        return clamp((start - b.top) / totalDist, 0, 1);
      };

      const renderWords = () => {
        // Damped interpolation for natural human scroll momentum
        const diff = targetProgress - currentProgress;
        currentProgress += diff * 0.08;

        const total = words.length;
        const span = 1.4 / total; // overlapping soft window per word

        words.forEach((w, i) => {
          const wordStart = (i / total) * (1 - span);
          const localP = clamp((currentProgress - wordStart) / span, 0, 1);

          // Smoothly interpolate color from muted light gray to deep ink
          if (localP <= 0) {
            w.style.color = "rgba(18, 18, 18, 0.2)";
            w.classList.remove("on");
          } else if (localP >= 1) {
            w.style.color = "#121212";
            w.classList.add("on");
          } else {
            // Eased transition between muted (0.2) and solid #121212 (1.0)
            const alpha = 0.2 + 0.8 * Math.sin((localP * Math.PI) / 2);
            w.style.color = `rgba(18, 18, 18, ${alpha.toFixed(3)})`;
            w.classList.toggle("on", localP > 0.65);
          }
        });

        if (Math.abs(diff) > 0.001) {
          rafId = requestAnimationFrame(renderWords);
        } else {
          currentProgress = targetProgress;
          rafId = 0;
        }
      };

      const onScrollOrResize = () => {
        targetProgress = calcTargetProgress();
        if (!rafId) {
          rafId = requestAnimationFrame(renderWords);
        }
      };

      targetProgress = currentProgress = calcTargetProgress();
      renderWords();

      window.addEventListener("scroll", onScrollOrResize, { passive: true });
      window.addEventListener("resize", onScrollOrResize);
    }
  }

  /* ------------------------------------------------------------
     Features: accordion + stage, auto-advancing
  ------------------------------------------------------------ */
  const feats = $("#features");
  if (feats) {
    const items = $$(".feat", feats), imgs = $$("#stage img");
    const DUR = 7000;
    feats.style.setProperty("--dur", DUR + "ms");
    if (reduce) feats.classList.add("is-static");

    const go = (i) => {
      items.forEach((it, k) => {
        const on = k === i;
        it.classList.toggle("is-active", on);
        $(".feat__btn", it).setAttribute("aria-expanded", String(on));
        if (imgs[k]) imgs[k].classList.toggle("is-active", on);
      });
    };
    items.forEach((it, i) => {
      $(".feat__btn", it).addEventListener("click", () => {
        if (!it.classList.contains("is-active")) go(i);
      });
    });
    feats.addEventListener("animationend", (e) => {
      if (!e.target.closest(".feat__bar")) return;
      const cur = items.findIndex((it) => it.classList.contains("is-active"));
      go((cur + 1) % items.length);
    });
    const list = $(".features__list", feats);
    list.addEventListener("pointerenter", () => feats.classList.add("is-paused"));
    list.addEventListener("pointerleave", () => feats.classList.remove("is-paused"));
    new IntersectionObserver(([e]) => feats.classList.toggle("is-paused", !e.isIntersecting), { threshold: 0.25 }).observe(feats);
  }

  /* ------------------------------------------------------------
     Contact form
  ------------------------------------------------------------ */
  const form = $("#contactForm");
  if (form) {
    const err = $("#formError"), btn = $("#formSubmit"), done = $("#formDone");
    const showError = (msg, withMail) => {
      err.textContent = msg + " ";
      if (withMail) {
        const a = document.createElement("a");
        a.href = "mailto:navchetna.official.llp@gmail.com";
        a.textContent = "Email us directly.";
        a.style.textDecoration = "underline";
        err.appendChild(a);
      }
      err.hidden = false;
    };
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      err.hidden = true;
      let bad = null;
      $$(".field", form).forEach((f) => {
        const i = $("input,select,textarea", f);
        const ok = !i.required || (i.type === "email" ? /^\S+@\S+\.\S+$/.test(i.value.trim()) : i.value.trim() !== "");
        f.classList.toggle("has-error", !ok);
        if (!ok && !bad) bad = i;
      });
      if (bad) {
        bad.focus();
        showError("Please complete the highlighted fields.");
        return;
      }

      btn.disabled = true;
      const label = btn.textContent;
      btn.textContent = "Sending...";
      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(Object.fromEntries(new FormData(form)))
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || res.status);
        form.hidden = true;
        done.hidden = false;
      } catch (err) {
        console.error("Contact form error:", err);
        showError("Something went wrong. Please try again or", true);
        btn.disabled = false;
        btn.textContent = label;
      }
    });
    form.addEventListener("input", (e) => e.target.closest(".field")?.classList.remove("has-error"));
  }
})();
