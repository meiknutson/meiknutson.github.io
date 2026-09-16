// Highlight the nav link for whichever section is currently in view.
// The Figma frames each show their own page highlighted in magenta; on a
// single scrolling page that has to be derived from scroll position.

(function () {
  "use strict";

  var scroller = document.querySelector(".scroller");
  var sections = Array.prototype.slice.call(
    document.querySelectorAll(".scroller > section[id]")
  );
  if (!scroller || !sections.length || !("IntersectionObserver" in window)) return;

  var links = {};
  Array.prototype.forEach.call(
    document.querySelectorAll('.nav__links a[href^="#"]'),
    function (a) {
      var id = a.getAttribute("href").slice(1);
      if (id) links[id] = a;
    }
  );

  function setCurrent(id) {
    Object.keys(links).forEach(function (key) {
      var a = links[key];
      var on = key === id;
      a.classList.toggle("is-current", on);
      if (on) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  // A band across the middle of the viewport: the section crossing it wins,
  // so the highlight flips at the halfway point rather than on first pixel.
  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setCurrent(entry.target.id);
      });
    },
    { root: scroller, rootMargin: "-45% 0px -45% 0px", threshold: 0 }
  );

  sections.forEach(function (section) {
    observer.observe(section);
  });
})();
