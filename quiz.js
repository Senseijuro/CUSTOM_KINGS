document.addEventListener('DOMContentLoaded', function() {
  var state = getGameState();
  var locked = document.getElementById('locked');
  var gameArea = document.getElementById('game-area');
  var resultDiv = document.getElementById('result');
  var grid = document.getElementById('memory-grid');
  var pairsEl = document.getElementById('mem-pairs');
  var movesEl = document.getElementById('mem-moves');

  // Vérifier débloqué
  if (!state.enigme1 || state.enigme1.completed === null) {
    if (locked) locked.classList.remove('hidden');
    if (gameArea) gameArea.classList.add('hidden');
    return;
  }

  // Si déjà terminé
  if (state.quiz && state.quiz.completed !== null) {
    if (gameArea) gameArea.classList.add('hidden');
    if (locked) locked.classList.add('hidden');
    showResult(state.quiz.completed, state.quiz.score || 0);
    return;
  }

  if (locked) locked.classList.add('hidden');

  // 6 paires pièce ↔ métier
  var pairs = [
    { piece: '🔧 Moteur',       metier: '👨‍🔧 Mécanicien',     pairId: 1 },
    { piece: '🎨 Carrosserie',  metier: '🛠️ Carrossier',      pairId: 2 },
    { piece: '⚡ Batterie',     metier: '🔌 Électricien auto', pairId: 3 },
    { piece: '🛞 Pneus',        metier: '🏎️ Pneumaticien',    pairId: 4 },
    { piece: '💨 Échappement',  metier: '🔩 Tuyauteur',       pairId: 5 },
    { piece: '🪟 Pare-brise',   metier: '🪨 Vitrier auto',    pairId: 6 }
  ];

  // Créer les cartes (12 au total)
  var cards = [];
  pairs.forEach(function(p) {
    cards.push({ text: p.piece,  pairId: p.pairId, type: 'piece' });
    cards.push({ text: p.metier, pairId: p.pairId, type: 'metier' });
  });

  // Mélanger avec ordre persistant
  var order = getShuffledOrder('quiz', cards.length);
  var shuffledCards = order.map(function(i) { return cards[i]; });

  var flippedCards = [];
  var matchedPairs = 0;
  var moves = 0;
  var isChecking = false;

  // Générer le DOM
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
        // Match !
        setTimeout(function() {
          a.classList.add('matched');
          b.classList.add('matched');
          matchedPairs++;
          updateStats();
          flippedCards = [];
          isChecking = false;

          if (matchedPairs >= pairs.length) {
            endGame();
          }
        }, 600);
      } else {
        // Pas match
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
    // Réussi si en moins de 20 coups
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
      if (resultBox) resultBox.classList.add('success');
      if (resultIcon) resultIcon.textContent = '✓';
      if (resultTitle) resultTitle.textContent = 'MEMORY RÉUSSI !';
      if (resultText) resultText.textContent = 'Bien joué ! Tu connais tes pièces et tes métiers. Upgrade débloqué !';
    } else {
      if (resultBox) resultBox.classList.add('fail');
      if (resultIcon) resultIcon.textContent = '✗';
      if (resultTitle) resultTitle.textContent = 'TROP DE COUPS';
      if (resultText) resultText.textContent = 'Il fallait finir en 20 coups max. L\'upgrade reste verrouillé.';
    }
  }

  updateStats();
});
