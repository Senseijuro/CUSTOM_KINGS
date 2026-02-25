document.addEventListener('DOMContentLoaded', function() {
  var state = getGameState();
  var locked = document.getElementById('locked');
  var gameArea = document.getElementById('game-area');
  var resultDiv = document.getElementById('result');
  var triCard = document.getElementById('tri-card');
  var triEmoji = document.getElementById('tri-emoji');
  var triText = document.getElementById('tri-text');
  var progressEl = document.getElementById('tri-progress');
  var scoreEl = document.getElementById('tri-score');
  var errorsEl = document.getElementById('tri-errors');

  // Vérifier débloqué
  if (!state.quiz || state.quiz.completed === null) {
    if (locked) locked.classList.remove('hidden');
    if (gameArea) gameArea.classList.add('hidden');
    return;
  }

  // Si déjà terminé
  if (state.enigma && state.enigma.completed !== null) {
    if (gameArea) gameArea.classList.add('hidden');
    if (locked) locked.classList.add('hidden');
    showResult(state.enigma.completed, 0);
    return;
  }

  if (locked) locked.classList.add('hidden');

  // 12 éléments : 4 par catégorie
  var items = [
    { emoji: '🔧', text: 'Vidange moteur',        cat: 'mecanique' },
    { emoji: '⚙️', text: 'Courroie distribution',  cat: 'mecanique' },
    { emoji: '🛞', text: 'Changement de freins',   cat: 'mecanique' },
    { emoji: '💨', text: 'Pot d\'échappement',     cat: 'mecanique' },

    { emoji: '🎨', text: 'Peinture portière',      cat: 'carrosserie' },
    { emoji: '🔨', text: 'Débosselage capot',      cat: 'carrosserie' },
    { emoji: '🪟', text: 'Remplacement pare-brise', cat: 'carrosserie' },
    { emoji: '✨', text: 'Polissage carrosserie',  cat: 'carrosserie' },

    { emoji: '💡', text: 'Changement des phares',  cat: 'electrique' },
    { emoji: '🔋', text: 'Remplacement batterie',  cat: 'electrique' },
    { emoji: '⚡', text: 'Diagnostic électronique', cat: 'electrique' },
    { emoji: '🔌', text: 'Réparation alternateur', cat: 'electrique' }
  ];

  // Mélanger avec ordre persistant
  var order = getShuffledOrder('enigma', items.length);
  var shuffledItems = order.map(function(i) { return items[i]; });

  var currentIndex = 0;
  var correctCount = 0;
  var errorCount = 0;
  var total = shuffledItems.length;

  function showCurrentItem() {
    if (currentIndex >= total) {
      endGame();
      return;
    }
    var item = shuffledItems[currentIndex];
    if (triEmoji) triEmoji.textContent = item.emoji;
    if (triText) triText.textContent = item.text;

    // Animation d'entrée
    if (triCard) {
      triCard.classList.remove('tri-slide-in');
      void triCard.offsetWidth; // force reflow
      triCard.classList.add('tri-slide-in');
    }
  }

  function updateStats() {
    if (progressEl) progressEl.textContent = '📦 ' + currentIndex + ' / ' + total + ' triés';
    if (scoreEl) scoreEl.textContent = '✅ ' + correctCount + ' correct';
    if (errorsEl) errorsEl.textContent = '❌ ' + errorCount + ' erreur' + (errorCount > 1 ? 's' : '');
  }

  function handleChoice(chosenCat) {
    if (currentIndex >= total) return;
    var item = shuffledItems[currentIndex];
    var isCorrect = (chosenCat === item.cat);

    if (isCorrect) {
      correctCount++;
      if (triCard) {
        triCard.classList.add('tri-correct');
        setTimeout(function() { triCard.classList.remove('tri-correct'); }, 400);
      }
    } else {
      errorCount++;
      if (triCard) {
        triCard.classList.add('tri-wrong');
        setTimeout(function() { triCard.classList.remove('tri-wrong'); }, 400);
      }
    }

    // Feedback bouton
    var btnSelector = chosenCat === 'mecanique' ? '#btn-meca' :
                      chosenCat === 'carrosserie' ? '#btn-carro' : '#btn-elec';
    var btn = document.querySelector(btnSelector);
    if (btn) {
      btn.classList.add(isCorrect ? 'btn-flash-ok' : 'btn-flash-ko');
      setTimeout(function() { btn.classList.remove('btn-flash-ok', 'btn-flash-ko'); }, 400);
    }

    // Si mauvaise réponse, montrer la bonne catégorie
    if (!isCorrect) {
      var correctBtn = document.querySelector('[data-cat="' + item.cat + '"]');
      if (correctBtn) {
        correctBtn.classList.add('btn-flash-hint');
        setTimeout(function() { correctBtn.classList.remove('btn-flash-hint'); }, 600);
      }
    }

    currentIndex++;
    updateStats();

    // 6 erreurs = perdu immédiatement
    if (errorCount >= 6) {
      endGame();
      return;
    }

    setTimeout(function() {
      showCurrentItem();
    }, isCorrect ? 300 : 700);
  }

  function endGame() {
    var success = correctCount >= 9 && errorCount < 6; // 9/12 min ET moins de 6 erreurs
    if (!state.enigma) state.enigma = { completed: null };
    state.enigma.completed = success;
    saveGameState(state);

    setTimeout(function() {
      if (gameArea) gameArea.classList.add('hidden');
      showResult(success, correctCount);
    }, 500);
  }

  function showResult(success, score) {
    if (resultDiv) resultDiv.classList.remove('hidden');
    if (gameArea) gameArea.classList.add('hidden');
    if (locked) locked.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    var resultBox = document.getElementById('result-box');
    var resultIcon = document.getElementById('result-icon');
    var resultTitle = document.getElementById('result-title');
    var resultText = document.getElementById('result-text');
    var resultScore = document.getElementById('result-score');

    if (resultScore) resultScore.textContent = score + ' / ' + total + ' correct';

    if (success) {
      if (resultBox) resultBox.classList.add('success');
      if (resultIcon) resultIcon.textContent = '✓';
      if (resultTitle) resultTitle.textContent = 'DIAGNOSTIC RÉUSSI !';
      if (resultText) resultText.textContent = 'Tu sais diagnostiquer comme un pro ! Dernier upgrade débloqué.';
    } else {
      if (resultBox) resultBox.classList.add('fail');
      if (resultIcon) resultIcon.textContent = '✗';
      if (resultTitle) resultTitle.textContent = 'DIAGNOSTIC RATÉ';
      if (resultText) resultText.textContent = errorCount >= 6 
        ? 'Trop d\'erreurs ! 6 fautes = éliminé. L\'upgrade reste verrouillé.'
        : 'Il fallait au moins 9/12 bonnes réponses. L\'upgrade reste verrouillé.';
    }
  }

  // Boutons
  document.querySelectorAll('.tri-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      handleChoice(btn.dataset.cat);
    });
  });

  updateStats();
  showCurrentItem();
});
