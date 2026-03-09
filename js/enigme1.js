document.addEventListener('DOMContentLoaded', function() {
  var state = getGameState();
  var gameArea = document.getElementById('game-area');
  var resultDiv = document.getElementById('result');
  var partsTray = document.getElementById('parts-tray');
  var scoreEl = document.getElementById('dd-score');
  var errorsEl = document.getElementById('dd-errors');

  // Si déjà terminé
  if (state.enigme1 && state.enigme1.completed !== null) {
    if (gameArea) gameArea.classList.add('hidden');
    showResult(state.enigme1.completed);
    return;
  }

  var correctCount = 0;
  var errorCount = 0;
  var totalCorrect = 6;

  // Pièces : 6 correctes + 4 intrus
  var allParts = [
    { id: 'moteur',       label: '🔧 Moteur',         correct: true },
    { id: 'pneus',        label: '🛞 Pneus',           correct: true },
    { id: 'volant',       label: '🎯 Volant',          correct: true },
    { id: 'phares',       label: '💡 Phares',          correct: true },
    { id: 'echappement',  label: '💨 Échappement',     correct: true },
    { id: 'batterie',     label: '🔋 Batterie',        correct: true },
    { id: 'intrus1',      label: '🍕 Pizza',           correct: false },
    { id: 'intrus2',      label: '🎸 Guitare',         correct: false },
    { id: 'intrus3',      label: '📱 Smartphone',      correct: false },
    { id: 'intrus4',      label: '🧸 Peluche',         correct: false }
  ];

  // Mélanger avec ordre persistant
  var order = getShuffledOrder('enigme1', allParts.length);
  var shuffledParts = order.map(function(i) { return allParts[i]; });

  // Créer les pièces dans le tray
  shuffledParts.forEach(function(part) {
    var el = document.createElement('div');
    el.className = 'dd-part';
    el.setAttribute('draggable', 'true');
    el.dataset.partId = part.id;
    el.dataset.correct = part.correct;
    el.textContent = part.label;
    partsTray.appendChild(el);
  });

  function updateScore() {
    if (scoreEl) scoreEl.textContent = correctCount + ' / ' + totalCorrect + ' pièces placées';
    if (errorsEl) errorsEl.textContent = '❌ ' + errorCount + ' erreur' + (errorCount > 1 ? 's' : '');
  }

  function checkWin() {
    if (correctCount >= totalCorrect) {
      var success = errorCount <= 2;
      endGame(success);
    }
  }

  function endGame(success) {
    if (!state.enigme1) state.enigme1 = { completed: null };
    state.enigme1.completed = success;
    saveGameState(state);
    setTimeout(function() {
      if (gameArea) gameArea.classList.add('hidden');
      showResult(success);
    }, 600);
  }

  function showResult(success) {
    if (resultDiv) resultDiv.classList.remove('hidden');
    if (gameArea) gameArea.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    var resultBox = document.getElementById('result-box');
    var resultIcon = document.getElementById('result-icon');
    var resultTitle = document.getElementById('result-title');
    var resultText = document.getElementById('result-text');

    if (success) {
      /* --- EFFETS DE VICTOIRE --- */
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]); 
      if (window.confetti) {
        confetti({ 
          particleCount: 150, 
          spread: 80, 
          origin: { y: 0.6 },
          colors: ['#ff007f', '#00d4ff', '#ffd700', '#a855f7'],
          disableForReducedMotion: true
        });
      }
      
      /* --- TEXTE DE VICTOIRE --- */
      if (resultBox) resultBox.classList.add('success');
      if (resultIcon) resultIcon.textContent = '✓';
      if (resultTitle) resultTitle.textContent = 'MONTAGE RÉUSSI !';
      if (resultText) resultText.textContent = 'Bien joué ! Tu as placé les bonnes pièces. Upgrade débloqué !';
      
    } else {
      /* --- EFFETS D'ÉCHEC --- */
      if (navigator.vibrate) navigator.vibrate([50, 100, 50, 100, 50]); 
      if (resultBox) { 
        resultBox.classList.remove('fail-effect');
        void resultBox.offsetWidth;
        resultBox.classList.add('fail-effect');
      }
      
      /* --- TEXTE D'ÉCHEC --- */
      if (resultBox) resultBox.classList.add('fail');
      if (resultIcon) resultIcon.textContent = '✗';
      if (resultTitle) resultTitle.textContent = 'TROP D\'ERREURS';
      if (resultText) resultText.textContent = 'Tu as fait trop d\'erreurs. L\'upgrade reste verrouillé.';
    }
  }

  // ========== DRAG & DROP (Desktop) ==========
  var draggedEl = null;

  document.querySelectorAll('.dd-part').forEach(function(part) {
    part.addEventListener('dragstart', function(e) {
      draggedEl = part;
      part.classList.add('dragging');
      e.dataTransfer.setData('text/plain', part.dataset.partId);
    });
    part.addEventListener('dragend', function() {
      part.classList.remove('dragging');
      draggedEl = null;
    });
  });

  document.querySelectorAll('.dd-drop-zone').forEach(function(zone) {
    zone.addEventListener('dragover', function(e) {
      e.preventDefault();
      zone.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', function() {
      zone.classList.remove('drag-over');
    });
    zone.addEventListener('drop', function(e) {
      e.preventDefault();
      zone.classList.remove('drag-over');
      var partId = e.dataTransfer.getData('text/plain');
      handleDrop(partId, zone);
    });
  });

  // ========== TOUCH SUPPORT (Mobile) ==========
  var touchPart = null;
  var touchClone = null;
  var touchOffsetX = 0;
  var touchOffsetY = 0;

  document.querySelectorAll('.dd-part').forEach(function(part) {
    part.addEventListener('touchstart', function(e) {
      if (part.classList.contains('placed')) return;
      e.preventDefault();
      touchPart = part;
      part.classList.add('dragging');

      var touch = e.touches[0];
      var rect = part.getBoundingClientRect();
      touchOffsetX = touch.clientX - rect.left;
      touchOffsetY = touch.clientY - rect.top;

      // Clone visuel
      touchClone = part.cloneNode(true);
      touchClone.className = 'dd-part dd-touch-clone';
      touchClone.style.position = 'fixed';
      touchClone.style.zIndex = '9999';
      touchClone.style.pointerEvents = 'none';
      touchClone.style.width = rect.width + 'px';
      touchClone.style.left = (touch.clientX - touchOffsetX) + 'px';
      touchClone.style.top = (touch.clientY - touchOffsetY) + 'px';
      document.body.appendChild(touchClone);
    }, { passive: false });
  });

  document.addEventListener('touchmove', function(e) {
    if (!touchClone) return;
    e.preventDefault();
    var touch = e.touches[0];
    touchClone.style.left = (touch.clientX - touchOffsetX) + 'px';
    touchClone.style.top = (touch.clientY - touchOffsetY) + 'px';

    // Highlight drop zones
    document.querySelectorAll('.dd-drop-zone').forEach(function(zone) {
      var r = zone.getBoundingClientRect();
      if (touch.clientX >= r.left && touch.clientX <= r.right &&
          touch.clientY >= r.top && touch.clientY <= r.bottom) {
        zone.classList.add('drag-over');
      } else {
        zone.classList.remove('drag-over');
      }
    });
  }, { passive: false });

  document.addEventListener('touchend', function(e) {
    if (!touchPart || !touchClone) return;
    var touch = e.changedTouches[0];

    // Trouver la zone sous le doigt
    if (touchClone.parentNode) touchClone.parentNode.removeChild(touchClone);
    touchClone = null;
    touchPart.classList.remove('dragging');

    var dropped = false;
    document.querySelectorAll('.dd-drop-zone').forEach(function(zone) {
      zone.classList.remove('drag-over');
      var r = zone.getBoundingClientRect();
      if (touch.clientX >= r.left && touch.clientX <= r.right &&
          touch.clientY >= r.top && touch.clientY <= r.bottom) {
        handleDrop(touchPart.dataset.partId, zone);
        dropped = true;
      }
    });

    touchPart = null;
  });

  // ========== LOGIQUE COMMUNE ==========
  function handleDrop(partId, zone) {
    var expected = zone.dataset.accept;
    var partEl = document.querySelector('.dd-part[data-part-id="' + partId + '"]');

    if (!partEl || partEl.classList.contains('placed')) return;
    if (zone.classList.contains('filled')) return;

    if (partId === expected) {
      // Bonne pièce
      zone.classList.add('filled', 'correct');
      zone.querySelector('.drop-label').textContent = partEl.textContent;
      partEl.classList.add('placed', 'correct-placed');
      correctCount++;
      updateScore();
      checkWin();
    } else {
      // Mauvaise pièce
      zone.classList.add('shake');
      partEl.classList.add('shake', 'error-flash');
      errorCount++;
      updateScore();

      // Intrus → retirer du tray
      if (partEl.dataset.correct === 'false') {
        partEl.classList.add('intrus-removed');
        setTimeout(function() {
          partEl.classList.add('placed');
        }, 500);
      }

      setTimeout(function() {
        zone.classList.remove('shake');
        partEl.classList.remove('shake', 'error-flash');
      }, 600);
    }
  }

  updateScore();
});
