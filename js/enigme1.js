document.addEventListener('DOMContentLoaded', function() {
  var state = getGameState();
  var gameArea = document.getElementById('game-area');
  var resultDiv = document.getElementById('result');
  var partsTray = document.getElementById('parts-tray');
  var scoreEl = document.getElementById('dd-score');
  var errorsEl = document.getElementById('dd-errors');

  // 1. BYPASS : Si déjà terminé
  if (state.enigme1 && state.enigme1.completed !== null) {
    if (gameArea) gameArea.classList.add('hidden');
    showResult(state.enigme1.completed);
    return;
  }

  // 2. CACHER LE JEU AU DÉMARRAGE
  if (gameArea) gameArea.classList.add('hidden');

  // 3. AFFICHER LE TUTORIEL
  Tutorial.show({
    icon: '🔧',
    title: 'MONTAGE AUTO',
    subtitle: 'ÉPREUVE 1',
    description: 'Prouve que tu connais les bases de la mécanique en sélectionnant les bons éléments.',
    steps: [
      { icon: '🔍', text: 'Observe les pièces disponibles dans l\'inventaire.' },
      { icon: '🖐️', text: 'Glisse les <strong>vraies pièces automobiles</strong> dans la zone.' },
      { icon: '🔓', text: 'Place 6 bonnes pièces pour débloquer l\'upgrade.' }
    ],
    warning: 'Attention : 3 erreurs et c\'est perdu !',
    buttonText: 'C\'EST PARTI !',
    theme: 'purple'
  }).then(function() {
    // 4. DÉMARRER LE JEU APRÈS LE CLIC
    if (window.globalTimer) globalTimer.start();
    if (gameArea) gameArea.classList.remove('hidden');
    initGame();
  });

  // 5. FONCTION GLOBALE DU JEU
  function initGame() {
    var correctCount = 0;
    var errorCount = 0;
    var totalCorrect = 6;

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

    var order = getShuffledOrder('enigme1', allParts.length);
    var shuffledParts = order.map(function(i) { return allParts[i]; });

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

    // ========== DRAG & DROP ==========
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

    // ========== TOUCH SUPPORT ==========
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

    function handleDrop(partId, zone) {
      var expected = zone.dataset.accept;
      var partEl = document.querySelector('.dd-part[data-part-id="' + partId + '"]');

      if (!partEl || partEl.classList.contains('placed')) return;
      if (zone.classList.contains('filled')) return;

      if (partId === expected) {
        zone.classList.add('filled', 'correct');
        zone.querySelector('.drop-label').textContent = partEl.textContent;
        partEl.classList.add('placed', 'correct-placed');
        correctCount++;
        updateScore();
        checkWin();
      } else {
        zone.classList.add('shake');
        partEl.classList.add('shake', 'error-flash');
        errorCount++;
        updateScore();

        if (partEl.dataset.correct === 'false') {
          partEl.classList.add('intrus-removed');
          setTimeout(function() { partEl.classList.add('placed'); }, 500);
        }

        setTimeout(function() {
          zone.classList.remove('shake');
          partEl.classList.remove('shake', 'error-flash');
        }, 600);
      }
    }
    updateScore();
  }

  // Fonction showResult hors de initGame() car elle est utilisée dans le BYPASS
  function showResult(success) {
    if (resultDiv) resultDiv.classList.remove('hidden');
    if (gameArea) gameArea.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    var resultBox = document.getElementById('result-box');
    var resultIcon = document.getElementById('result-icon');
    var resultTitle = document.getElementById('result-title');
    var resultText = document.getElementById('result-text');

    if (success) {
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]); 
      if (window.confetti) {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#ff007f', '#00d4ff', '#ffd700', '#a855f7'], disableForReducedMotion: true });
      }
      if (resultBox) resultBox.classList.add('success');
      if (resultIcon) resultIcon.textContent = '✓';
      if (resultTitle) resultTitle.textContent = 'MONTAGE RÉUSSI !';
      if (resultText) resultText.textContent = 'Bien joué ! Tu as placé les bonnes pièces. Upgrade débloqué !';
    } else {
      if (navigator.vibrate) navigator.vibrate([50, 100, 50, 100, 50]); 
      if (resultBox) { 
        resultBox.classList.remove('fail-effect');
        void resultBox.offsetWidth;
        resultBox.classList.add('fail-effect');
      }
      if (resultBox) resultBox.classList.add('fail');
      if (resultIcon) resultIcon.textContent = '✗';
      if (resultTitle) resultTitle.textContent = 'TROP D\'ERREURS';
      if (resultText) resultText.textContent = 'Tu as fait trop d\'erreurs. L\'upgrade reste verrouillé.';
    }
  }
});