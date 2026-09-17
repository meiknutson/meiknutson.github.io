// Highlight the nav link for whichever section is currently in view.
// The Figma frames each show their own page highlighted in magenta; on a
// single scrolling page that has to be derived from scroll position.

(function () {
  "use strict";

  var scroller = document.querySelector(".scroller");
  var sections = Array.prototype.slice.call(
    document.querySelectorAll(".scroller > section[id]")
  );
  if (!scroller || !sections.length) return;

  var links = {};
  Array.prototype.forEach.call(
    document.querySelectorAll('.nav__links a[href^="#"]'),
    function (a) {
      var id = a.getAttribute("href").slice(1);
      if (id) links[id] = a;
    }
  );

  var currentId = null;

  function setCurrent(id) {
    if (id === currentId) return;
    currentId = id;
    Object.keys(links).forEach(function (key) {
      var a = links[key];
      var on = key === id;
      a.classList.toggle("is-current", on);
      if (on) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  // Whichever section crosses the middle of the viewport wins, so the
  // highlight flips at the halfway point rather than on first pixel.
  // Derived from geometry on every frame rather than from observer
  // callbacks: an IntersectionObserver reports its initial state before
  // the sections have been laid out, which left the wrong link lit on load.
  function update() {
    var mid = scroller.clientHeight / 2;
    var winner = sections[0];
    for (var i = 0; i < sections.length; i++) {
      var r = sections[i].getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) {
        winner = sections[i];
        break;
      }
    }
    if (winner) setCurrent(winner.id);
  }

  var queued = false;
  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      update();
    });
  }

  // The physical section's video is by far the heaviest asset on the page,
  // so it ships with preload="none" and only starts once it is near view.
  var video = document.querySelector("video[data-autoplay-in-view]");
  if (video && "IntersectionObserver" in window) {
    new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            video.preload = "auto";
            var playing = video.play();
            if (playing && playing.catch) playing.catch(function () {});
          } else {
            video.pause();
          }
        });
      },
      { root: scroller, rootMargin: "300px 0px" }
    ).observe(video);
  }

  // Filter-driven animations (the wordmark's scribble) regenerate a noise
  // field every frame, which is not work worth doing for a section that has
  // scrolled away. These run by default and are paused here, so a missed or
  // wrong initial callback — which is exactly what the nav highlight above
  // had to stop relying on — leaves them moving rather than frozen.
  var animated = document.querySelectorAll("[data-animate-in-view]");
  if (animated.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          entry.target.classList.toggle("is-offscreen", !entry.isIntersecting);
        });
      },
      { root: scroller, rootMargin: "100px 0px" }
    );
    Array.prototype.forEach.call(animated, function (el) { io.observe(el); });
  }

  scroller.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  window.addEventListener("load", update);
  update();
})();
