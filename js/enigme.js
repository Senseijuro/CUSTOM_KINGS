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

  // 1. BYPASS : Vérifier débloqué
  if (!state.quiz || state.quiz.completed === null) {
    if (locked) locked.classList.remove('hidden');
    if (gameArea) gameArea.classList.add('hidden');
    return;
  }

  // 2. BYPASS : Si déjà terminé
  if (state.enigma && state.enigma.completed !== null) {
    if (gameArea) gameArea.classList.add('hidden');
    if (locked) locked.classList.add('hidden');
    showResult(state.enigma.completed, 0);
    return;
  }

  if (locked) locked.classList.add('hidden');

  // 3. CACHER LE JEU AU DÉMARRAGE
  if (gameArea) gameArea.classList.add('hidden');

  // 4. AFFICHER LE TUTORIEL
  Tutorial.show({
    icon: '📦',
    title: 'LE BON DIAGNOSTIC',
    subtitle: 'ÉPREUVE 3',
    description: 'Assigne chaque tâche d\'entretien au bon département du garage.',
    steps: [
      { icon: '📋', text: 'Lis attentivement l\'intervention qui s\'affiche.' },
      { icon: '🤔', text: 'Réfléchis au bon département pour cette réparation.' },
      { icon: '🗂️', text: 'Classe-la en <strong>Mécanique</strong>, <strong>Carrosserie</strong> ou <strong>Électrique</strong>.' },
      { icon: '🎯', text: 'Obtiens au moins 9 bonnes réponses sur 12.' }
    ],
    warning: 'Concentre-toi : 6 erreurs = Game Over immédiat !',
    buttonText: 'C\'EST PARTI !',
    theme: 'pink'
  }).then(function() {
    if (window.globalTimer) globalTimer.start();
    if (gameArea) gameArea.classList.remove('hidden');
    initGame();
  });

  // 5. FONCTION GLOBALE DU JEU
  function initGame() {
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

      if (triCard) {
        triCard.classList.remove('tri-slide-in');
        void triCard.offsetWidth;
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

      var btnSelector = chosenCat === 'mecanique' ? '#btn-meca' :
                        chosenCat === 'carrosserie' ? '#btn-carro' : '#btn-elec';
      var btn = document.querySelector(btnSelector);
      if (btn) {
        btn.classList.add(isCorrect ? 'btn-flash-ok' : 'btn-flash-ko');
        setTimeout(function() { btn.classList.remove('btn-flash-ok', 'btn-flash-ko'); }, 400);
      }

      if (!isCorrect) {
        var correctBtn = document.querySelector('[data-cat="' + item.cat + '"]');
        if (correctBtn) {
          correctBtn.classList.add('btn-flash-hint');
          setTimeout(function() { correctBtn.classList.remove('btn-flash-hint'); }, 600);
        }
      }

      currentIndex++;
      updateStats();

      if (errorCount >= 6) {
        endGame();
        return;
      }

      setTimeout(function() {
        showCurrentItem();
      }, isCorrect ? 300 : 700);
    }

    function endGame() {
      var success = correctCount >= 9 && errorCount < 6;
      if (!state.enigma) state.enigma = { completed: null };
      state.enigma.completed = success;
      saveGameState(state);

      setTimeout(function() {
        if (gameArea) gameArea.classList.add('hidden');
        showResult(success, correctCount);
      }, 500);
    }

    // Lier les boutons
    document.querySelectorAll('.tri-btn').forEach(function(btn) {
      // Pour éviter d'ajouter des event listeners en double si initGame est relancé (bien que ce ne soit pas le cas ici), 
      // il est plus propre de le redéfinir en remplaçant l'élément :
      var newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      newBtn.addEventListener('click', function() {
        handleChoice(newBtn.dataset.cat);
      });
    });

    updateStats();
    showCurrentItem();
  }

  // Fonction showResult hors de initGame()
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

    if (resultScore) resultScore.textContent = score + ' / 12 correct';

    if (success) {
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]); 
      if (window.confetti) {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#ff007f', '#00d4ff', '#ffd700', '#a855f7'], disableForReducedMotion: true });
      }
      if (resultBox) resultBox.classList.add('success');
      if (resultIcon) resultIcon.textContent = '✓';
      if (resultTitle) resultTitle.textContent = 'DIAGNOSTIC VALIDÉ !';
      if (resultText) resultText.textContent = 'Bien joué ! Tu gères l\'atelier comme un vrai pro. Upgrade débloqué !';
    } else {
      if (navigator.vibrate) navigator.vibrate([50, 100, 50, 100, 50]); 
      if (resultBox) {
        resultBox.classList.remove('fail-effect');
        void resultBox.offsetWidth;
        resultBox.classList.add('fail-effect');
      }
      if (resultBox) resultBox.classList.add('fail');
      if (resultIcon) resultIcon.textContent = '✗';
      if (resultTitle) resultTitle.textContent = 'DIAGNOSTIC RATÉ';
      if (resultText) resultText.textContent = score < 9 && document.getElementById('tri-errors').textContent.includes('6') === false 
        ? 'Il fallait au moins 9/12 bonnes réponses. L\'upgrade reste verrouillé.' 
        : 'Trop d\'erreurs ! 6 fautes = éliminé. L\'upgrade reste verrouillé.';
    }
  }
});