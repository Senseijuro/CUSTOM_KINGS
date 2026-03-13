document.addEventListener('DOMContentLoaded', function() {
  var state = getGameState();
  var locked = document.getElementById('locked');
  var gameArea = document.getElementById('game-area');
  var resultDiv = document.getElementById('result');
  var grid = document.getElementById('memory-grid');
  var pairsEl = document.getElementById('mem-pairs');
  var movesEl = document.getElementById('mem-moves');

  // 1. BYPASS : Vérifier débloqué
  if (!state.enigme1 || state.enigme1.completed === null) {
    if (locked) locked.classList.remove('hidden');
    if (gameArea) gameArea.classList.add('hidden');
    return;
  }

  // 2. BYPASS : Si déjà terminé
  if (state.quiz && state.quiz.completed !== null) {
    if (gameArea) gameArea.classList.add('hidden');
    if (locked) locked.classList.add('hidden');
    showResult(state.quiz.completed, state.quiz.score || 0);
    return;
  }

  if (locked) locked.classList.add('hidden');

  // 3. CACHER LE JEU AU DÉMARRAGE
  if (gameArea) gameArea.classList.add('hidden');

  // 4. AFFICHER LE TUTORIEL
  Tutorial.show({
    icon: '🧠',
    title: 'ASSOCIATION MÉTIERS',
    subtitle: 'ÉPREUVE 2',
    description: 'Chaque pièce ou domaine de la voiture correspond à un spécialiste de l\'atelier.',
    steps: [
      { icon: '🃏', text: 'Retourne les cartes sur la grille.' },
      { icon: '🔗', text: 'Associe une <strong>pièce</strong> à son <strong>métier</strong>.' },
      { icon: '💡', text: 'Exemple : <em>🛞 Pneus ↔ 🏎️ Pneumaticien</em>.' },
      { icon: '⏱️', text: 'Mémorise bien les emplacements pour gagner du temps.' }
    ],
    warning: 'Réussite exigée en 20 coups maximum !',
    buttonText: 'C\'EST PARTI !',
    theme: 'cyan'
  }).then(function() {
    if (window.globalTimer) globalTimer.start();
    if (gameArea) gameArea.classList.remove('hidden');
    initGame();
  });

  // 5. FONCTION GLOBALE DU JEU
  function initGame() {
    var pairs = [
      { piece: '🔧 Moteur',       metier: '👨‍🔧 Mécanicien',     pairId: 1 },
      { piece: '🎨 Carrosserie',  metier: '🛠️ Carrossier',      pairId: 2 },
      { piece: '⚡ Batterie',     metier: '🔌 Électricien auto', pairId: 3 },
      { piece: '🛞 Pneus',        metier: '🏎️ Pneumaticien',    pairId: 4 },
      { piece: '💨 Échappement',  metier: '🔩 Tuyauteur',       pairId: 5 },
      { piece: '🪟 Pare-brise',   metier: '🪨 Vitrier auto',    pairId: 6 }
    ];

    var cards = [];
    pairs.forEach(function(p) {
      cards.push({ text: p.piece,  pairId: p.pairId, type: 'piece' });
      cards.push({ text: p.metier, pairId: p.pairId, type: 'metier' });
    });

    var order = getShuffledOrder('quiz', cards.length);
    var shuffledCards = order.map(function(i) { return cards[i]; });

    var flippedCards = [];
    var matchedPairs = 0;
    var moves = 0;
    var isChecking = false;

    shuffledCards.forEach(function(card, index) {
      var el = document.createElement('div');
      el.className = 'memory-card';
      el.dataset.index = index;
      el.dataset.pairId = card.pairId;
      el.dataset.type = card.type;
      el.innerHTML =
        '<div class="memory-card-inner">' +
          '<div class="memory-card-front">?</div>' +
          '<div class="memory-card-back">' + card.text + '</div>' +
        '</div>';
      el.addEventListener('click', function() { flipCard(el); });
      grid.appendChild(el);
    });

    function flipCard(el) {
      if (isChecking) return;
      if (el.classList.contains('flipped') || el.classList.contains('matched')) return;
      if (flippedCards.length >= 2) return;

      el.classList.add('flipped');
      flippedCards.push(el);

      if (flippedCards.length === 2) {
        moves++;
        updateStats();
        isChecking = true;

        var a = flippedCards[0];
        var b = flippedCards[1];

        if (a.dataset.pairId === b.dataset.pairId && a.dataset.type !== b.dataset.type) {
          setTimeout(function() {
            a.classList.add('matched');
            b.classList.add('matched');
            matchedPairs++;
            updateStats();
            flippedCards = [];
            isChecking = false;
            if (matchedPairs >= pairs.length) endGame();
          }, 600);
        } else {
          setTimeout(function() {
            a.classList.remove('flipped');
            b.classList.remove('flipped');
            a.classList.add('no-match');
            b.classList.add('no-match');
            setTimeout(function() {
              a.classList.remove('no-match');
              b.classList.remove('no-match');
            }, 300);
            flippedCards = [];
            isChecking = false;
          }, 800);
        }
      }
    }

    function updateStats() {
      if (pairsEl) pairsEl.textContent = '🎯 ' + matchedPairs + ' / ' + pairs.length + ' paires';
      if (movesEl) movesEl.textContent = '👆 ' + moves + ' coups';
    }

    function endGame() {
      var success = moves <= 20;
      if (!state.quiz) state.quiz = { completed: null, score: 0 };
      state.quiz.completed = success;
      state.quiz.score = moves;
      saveGameState(state);

      setTimeout(function() {
        if (gameArea) gameArea.classList.add('hidden');
        showResult(success, moves);
      }, 800);
    }
    updateStats();
  }

  // Fonction showResult hors de initGame() car utilisée dans le BYPASS
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

    if (resultScore) resultScore.textContent = 'Terminé en ' + score + ' coups';

    if (success) {
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]); 
      if (window.confetti) {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#ff007f', '#00d4ff', '#ffd700', '#a855f7'], disableForReducedMotion: true });
      }
      if (resultBox) resultBox.classList.add('success');
      if (resultIcon) resultIcon.textContent = '✓';
      if (resultTitle) resultTitle.textContent = 'MEMORY RÉUSSI !';
      if (resultText) resultText.textContent = 'Bien joué ! Tu connais tes pièces et tes métiers. Upgrade débloqué !';
    } else {
      if (navigator.vibrate) navigator.vibrate([50, 100, 50, 100, 50]); 
      if (resultBox) {
        resultBox.classList.remove('fail-effect');
        void resultBox.offsetWidth;
        resultBox.classList.add('fail-effect');
      }
      if (resultBox) resultBox.classList.add('fail');
      if (resultIcon) resultIcon.textContent = '✗';
      if (resultTitle) resultTitle.textContent = 'TROP DE COUPS';
      if (resultText) resultText.textContent = 'Il fallait finir en 20 coups max. L\'upgrade reste verrouillé.';
    }
  }
});