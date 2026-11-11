/* Master Professionnel — interactions légères (aucune dépendance) */
(function () {
  "use strict";

  var body = document.body;
  var header = document.querySelector(".header");
  var burger = document.querySelector(".burger");

  /* En-tête : ombre au défilement */
  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-stuck", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Menu mobile */
  if (burger) {
    burger.addEventListener("click", function () {
      var open = body.classList.toggle("nav-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.querySelectorAll(".nav a").forEach(function (a) {
      a.addEventListener("click", function () {
        body.classList.remove("nav-open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        body.classList.remove("nav-open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* Filtres des formations */
  var chips = document.querySelectorAll("[data-filter]");
  var cards = document.querySelectorAll("[data-cat]");
  var counter = document.querySelector("[data-count]");
  if (chips.length && cards.length) {
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var value = chip.getAttribute("data-filter");
        chips.forEach(function (c) {
          c.classList.toggle("is-active", c === chip);
          c.setAttribute("aria-pressed", c === chip ? "true" : "false");
        });
        var shown = 0;
        cards.forEach(function (card) {
          var match = value === "tous" || card.getAttribute("data-cat") === value;
          card.classList.toggle("is-hidden", !match);
          if (match) shown++;
        });
        if (counter) counter.textContent = shown;
      });
    });
  }

  /* Apparition douce au défilement */
  var reveals = document.querySelectorAll(".reveal");
  function revealAll() {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }
  if (reveals.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    reveals.forEach(function (el) { io.observe(el); });
    /* filet de sécurité : ne jamais laisser un contenu masqué */
    window.setTimeout(revealAll, 2500);
  } else {
    revealAll();
  }

  /* Formulaires : envoi via WhatsApp (aucun serveur nécessaire) */
  document.querySelectorAll("form[data-wa-form]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var status = form.querySelector(".form__status");
      var data = new FormData(form);
      var lignes = [];
      var intro = form.getAttribute("data-wa-intro") || "Bonjour, je souhaite vous contacter.";
      lignes.push(intro, "");
      data.forEach(function (value, key) {
        if (!value || key === "consent") return;
        var champ = form.querySelector('[name="' + key + '"]');
        var label = champ && champ.getAttribute("data-label") ? champ.getAttribute("data-label") : key;
        lignes.push(label + " : " + String(value).trim());
      });
      var texte = lignes.join("\n");
      var numero = form.getAttribute("data-wa-number") || "";
      var url = "https://wa.me/" + numero + "?text=" + encodeURIComponent(texte);
      if (status) {
        status.textContent = "Ouverture de WhatsApp… Si rien ne se passe, utilisez le bouton WhatsApp en bas de page.";
        status.classList.remove("is-error");
      }
      window.open(url, "_blank", "noopener");
    });
  });

  /* Année courante */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* Barre de progression de lecture */
  var progress = document.querySelector(".scroll-progress");
  function updateProgress() {
    if (!progress) return;
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    progress.style.width = (max > 0 ? (doc.scrollTop / max) * 100 : 0) + "%";
  }
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
  updateProgress();

  /* Retour en haut */
  var toTop = document.querySelector(".to-top");
  if (toTop) {
    var toggleTop = function () {
      toTop.classList.toggle("is-visible", window.scrollY > 600);
    };
    window.addEventListener("scroll", toggleTop, { passive: true });
    toggleTop();
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* Chiffres clés animés */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    var lancer = function (el) {
      if (el.hasAttribute("data-static")) return;
      var cible = parseInt(el.getAttribute("data-count"), 10) || 0;
      var suffixe = el.getAttribute("data-suffix") || "";
      var espaces = el.getAttribute("data-format") === "space";
      var debut = null;
      var duree = 1300;
      var etape = function (t) {
        if (!debut) debut = t;
        var p = Math.min(1, (t - debut) / duree);
        var valeur = Math.round(cible * (1 - Math.pow(1 - p, 3)));
        var texte = espaces ? valeur.toLocaleString("fr-FR") : String(valeur);
        el.textContent = texte + suffixe;
        if (p < 1) window.requestAnimationFrame(etape);
      };
      window.requestAnimationFrame(etape);
    };
    if ("IntersectionObserver" in window) {
      var obs = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) {
              lancer(e.target);
              obs.unobserve(e.target);
            }
          });
        },
        { threshold: 0.4 }
      );
      counters.forEach(function (c) { obs.observe(c); });
    }
  }

  /* Léger parallaxe du visuel du héros */
  var hero = document.querySelector(".hero");
  var visuel = document.querySelector(".hero__visual");
  var mouvementReduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (hero && visuel && !mouvementReduit && window.matchMedia("(pointer: fine)").matches) {
    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      visuel.style.transform = "translate3d(" + (x * 14).toFixed(1) + "px," + (y * 10).toFixed(1) + "px,0)";
    });
    hero.addEventListener("mouseleave", function () {
      visuel.style.transform = "";
    });
  }
})();
