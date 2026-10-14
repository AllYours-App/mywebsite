// Formulaire de contact : validation, anti-spam, envoi et confirmation
(function () {
  var form = document.getElementById('contact-form');
  if (!form) return;

  var success = document.getElementById('form-success');
  var status = document.getElementById('form-status');
  var submit = form.querySelector('button[type="submit"]');
  var submitLabel = submit.textContent;
  var openedAt = Date.now(); // sert à repérer les envois trop rapides (robots)

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

    var endpoint = form.getAttribute('data-endpoint');
    if (!endpoint) {
      console.error('Formulaire : renseignez l\'attribut data-endpoint avec l\'URL du service de réception.');
      status.textContent = 'L\'envoi a échoué. Réessayez dans quelques instants.';
      status.classList.add('is-error');
      return;
    }

    submit.disabled = true;
    submit.textContent = 'Envoi en cours';

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new FormData(form)
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
      });
  });
})();
