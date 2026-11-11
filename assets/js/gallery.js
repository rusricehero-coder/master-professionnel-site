/* Galerie photos — masque les emplacements non remplis
   Déposez vos images dans assets/img/photos/ sous les noms photo-01.jpg … photo-12.jpg */
(function () {
  "use strict";

  function initGallery() {
    var gallery = document.querySelector("[data-gallery]");
    if (!gallery) return;
    var figures = Array.prototype.slice.call(gallery.querySelectorAll("figure"));
    var shown = 0;
    figures.forEach(function (fig) {
      var img = fig.querySelector("img");
      if (!img) return;
      if (img.complete && img.naturalWidth === 0) {
        fig.parentNode.removeChild(fig);
      } else {
        shown++;
        img.addEventListener("error", function () {
          if (fig.parentNode) fig.parentNode.removeChild(fig);
        });
      }
    });
    var empty = document.querySelector("[data-gallery-empty]");
    if (empty) empty.hidden = shown > 0;
    var count = document.querySelector("[data-gallery-count]");
    if (count) count.textContent = String(shown);
  }

  if (document.readyState === "complete") initGallery();
  else window.addEventListener("load", initGallery);
})();
