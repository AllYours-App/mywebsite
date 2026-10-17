// Formulaire de contact : validation, anti-spam, envoi et confirmation
(function () {
  var form = document.getElementById('contact-form');
  if (!form) return;

  var success = document.getElementById('form-success');
  var status = document.getElementById('form-status');
  var submit = form.querySelector('button[type="submit"]');
  var submitLabel = submit.textContent;
  var openedAt = Date.now(); // sert à repérer les envois trop rapides (robots)

  // Cloudflare Turnstile : actif seulement si data-turnstile-sitekey est renseigné.
  // Le jeton est vérifié côté serveur par Formspree avec la clé secrète.
  var siteKey = form.getAttribute('data-turnstile-sitekey');
  var captchaToken = '';
  var captchaWidget = null;

  function loadTurnstile() {
    var box = document.createElement('div');
    box.className = 'form_captcha';
    form.insertBefore(box, submit);

    window.ducoinTurnstileReady = function () {
      captchaWidget = window.turnstile.render(box, {
        sitekey: siteKey,
        language: 'fr',
        callback: function (token) { captchaToken = token; },
        'expired-callback': function () { captchaToken = ''; },
        'error-callback': function () {
          captchaToken = '';
          status.textContent = 'La vérification anti-robot a échoué. Rechargez la page et réessayez.';
          status.classList.add('is-error');
        }
      });
    };

    var script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=ducoinTurnstileReady';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }

  if (siteKey) loadTurnstile();

  // Règles de validation : un message d'erreur clair par champ
  var rules = [
    {
      id: 'nom',
      check: function (v) { return v.trim().length >= 2; },
      message: 'Indiquez votre nom.'
    },
    {
      id: 'email',
      check: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
      message: 'Indiquez une adresse email valide, par exemple nom@domaine.fr.'
    },
    {
      id: 'activite',
      check: function (v) { return v.trim().length >= 2; },
      message: 'Indiquez votre activité.'
    },
    {
      id: 'message-texte',
      check: function (v) { return v.trim().length >= 20; },
      message: 'Décrivez votre projet en quelques lignes (20 caractères minimum).'
    }
  ];

  function setError(input, message) {
    var error = document.getElementById(input.id + '-error');
    if (message) {
      input.setAttribute('aria-invalid', 'true');
      error.textContent = message;
      error.hidden = false;
    } else {
      input.removeAttribute('aria-invalid');
      error.textContent = '';
      error.hidden = true;
    }
  }

  // Retourne le premier champ invalide, ou null si tout est correct
  function validate() {
    var firstInvalid = null;
    rules.forEach(function (rule) {
      var input = document.getElementById(rule.id);
      var valid = rule.check(input.value);
      setError(input, valid ? '' : rule.message);
      if (!valid && !firstInvalid) firstInvalid = input;
    });
    return firstInvalid;
  }

  // Efface l'erreur dès que le champ redevient correct
  rules.forEach(function (rule) {
    var input = document.getElementById(rule.id);
    input.addEventListener('input', function () {
      if (input.getAttribute('aria-invalid') === 'true' && rule.check(input.value)) {
        setError(input, '');
      }
    });
  });

  function showSuccess() {
    form.hidden = true;
    success.hidden = false;
    success.focus();
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    status.textContent = '';
    status.classList.remove('is-error');

    var firstInvalid = validate();
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    // Anti-spam : champ piège rempli ou envoi en moins de 3 secondes.
    // On simule une réussite pour ne rien révéler au robot.
    var trap = form.elements['site_web'].value;
    if (trap || Date.now() - openedAt < 3000) {
      showSuccess();
      return;
    }

    // Vérification Turnstile : on attend le jeton avant d'envoyer
    if (siteKey && !captchaToken) {
      status.textContent = 'Patientez un instant : la vérification anti-robot n\'est pas terminée.';
      status.classList.add('is-error');
      return;
    }

    var endpoint = form.getAttribute('data-endpoint');
    if (!endpoint) {
      console.error('Formulaire : renseignez l\'attribut data-endpoint avec l\'URL du service de réception.');
      status.textContent = 'L\'envoi a échoué. Réessayez dans quelques instants.';
      status.classList.add('is-error');
      return;
    }

    submit.disabled = true;
    submit.textContent = 'Envoi en cours';

    var formData = new FormData(form);
    if (captchaToken) formData.set('cf-turnstile-response', captchaToken);

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: formData
    })
      .then(function (response) {
        if (!response.ok) throw new Error('Réponse ' + response.status);
        showSuccess();
      })
      .catch(function () {
        status.textContent = 'L\'envoi a échoué. Vérifiez votre connexion et réessayez.';
        status.classList.add('is-error');
        submit.disabled = false;
        submit.textContent = submitLabel;
        // Un jeton Turnstile ne sert qu'une fois : on en redemande un
        if (captchaWidget !== null) { captchaToken = ''; window.turnstile.reset(captchaWidget); }
      });
  });
})();
