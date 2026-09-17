// Detail panels: full-screen overlays opened from the picture frames.
//
// Each panel scrolls independently of the site behind it. Nothing here
// touches the main scroller's position, so closing a panel returns you to
// exactly where you were — and a panel always opens at its own top.

(function () {
  "use strict";

  var openPanel = null;
  var lastFocus = null;

  function panelFor(el) {
    var id = el.getAttribute("data-panel");
    return id && document.getElementById(id);
  }

  function open(panel) {
    if (openPanel) close();
    lastFocus = document.activeElement;
    panel.hidden = false;
    // Always start at the top, however the panel was left last time.
    panel.querySelector(".panel__scroll").scrollTop = 0;
    // The site behind must not scroll while a panel is over it.
    document.body.classList.add("has-panel");
    openPanel = panel;
    playVideos(panel);
    // Focus the scroll container, not the close button. Focus has to move
    // into the panel for the keyboard, but Firefox treats programmatic focus
    // as :focus-visible where Chrome does not, so focusing the X drew a
    // magenta outline square around it. The container takes no visible ring
    // and keeps arrow-key scrolling; Tab still reaches the X.
    var scroll = panel.querySelector(".panel__scroll");
    if (scroll) scroll.focus({ preventScroll: true });
  }

  // The videos ship preload="none" so a panel costs nothing until opened.
  // Loading is async, so play() has to be retried once there is data.
  function playVideos(panel) {
    panel.querySelectorAll("video[data-panel-video]").forEach(function (v) {
      v.preload = "auto";
      var attempt = function () {
        var p = v.play();
        if (p && p.catch) p.catch(function () {});
      };
      attempt();
      if (v.readyState < 3) v.addEventListener("canplay", attempt, { once: true });
    });
  }

  function close() {
    if (!openPanel) return;
    openPanel.querySelectorAll("video[data-panel-video]").forEach(function (v) { v.pause(); });
    openPanel.hidden = true;
    document.body.classList.remove("has-panel");
    openPanel = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    lastFocus = null;
    if (location.hash) history.replaceState(null, "", location.pathname);
  }

  document.addEventListener("click", function (e) {
    var trigger = e.target.closest && e.target.closest("[data-panel]");
    if (trigger) {
      var panel = panelFor(trigger);
      if (panel) {
        e.preventDefault();
        open(panel);
        return;
      }
    }
    if (e.target.closest && e.target.closest(".panel__close")) {
      e.preventDefault();
      close();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && openPanel) {
      e.preventDefault();
      close();
    }
  });

  // Keep focus inside an open panel.
  document.addEventListener("focusin", function (e) {
    if (openPanel && !openPanel.contains(e.target)) {
      var s = openPanel.querySelector(".panel__scroll");
      if (s) s.focus({ preventScroll: true });
    }
  });

  // Deep link: /#panel-sciillust opens that panel directly.
  var atLoad = location.hash && document.querySelector(location.hash);
  if (atLoad && atLoad.classList.contains("panel")) open(atLoad);
})();
