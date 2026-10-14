// Menu mobile : ouverture, fermeture (bouton, lien, Échap) et retour au mode bureau
(function () {
  var button = document.querySelector('.nav_button');
  var menu = document.getElementById('nav-menu');
  if (!button || !menu) return;

  var desktop = window.matchMedia('(min-width: 62em)');

  function setOpen(open) {
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('is-menu-open', open);
    button.setAttribute('aria-expanded', String(open));
    button.textContent = open ? 'Fermer' : 'Menu';
  }

  button.addEventListener('click', function () {
    setOpen(button.getAttribute('aria-expanded') !== 'true');
  });

  // Fermer le menu après un clic sur un lien
  menu.addEventListener('click', function (event) {
    if (event.target.closest('a')) setOpen(false);
  });

  // Fermer avec la touche Échap et redonner le focus au bouton
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      button.focus();
    }
  });

  // Si l'écran passe en mode bureau, on remet l'état à zéro
  desktop.addEventListener('change', function (event) {
    if (event.matches) setOpen(false);
  });
})();

// Calendrier de réservation : le cadre externe se charge une fois la page affichée,
// pour ne pas ralentir le contenu principal
(function () {
  var frame = document.querySelector('iframe[data-src]');
  if (!frame) return;

  function load() {
    frame.src = frame.getAttribute('data-src');
  }

  if (document.readyState === 'complete') {
    load();
  } else {
    window.addEventListener('load', load);
  }
})();
