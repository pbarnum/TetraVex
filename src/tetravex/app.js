const game = {
  options: {},
  board: [],
  pieces: [],
  paused: true,
  timer: {
    seconds: 0,
  },
  moves: {
    count: 0
  }
};

const alerts = {
  occupied: {
    title: 'Invalid Move!',
    body: 'You cannot place a tile on top of an existing tile.',
    cls: 'alert alert-danger'
  },
  noMatch: {
    title: "Tiles don't match!",
    body: "That piece doesn't match with any of its neighbors",
    cls: 'alert alert-danger'
  },
  end: {
    title: 'You win!',
    body: () => {
      let moves = game.moves.count;
      let height = game.options.size.height;
      let width = game.options.size.width;
      let seconds = game.timer.seconds;
      return `It took you ${moves} moves to solve the ${height} by ${width} puzzle in ${seconds} seconds.`
    },
    cls: 'alert alert-success',
  },
  tooSmall: {
    title: 'Board too small!',
    body: 'You cannot play a game with less than 3 pieces.',
    cls: 'alert alert-danger',
  },
  tooLarge: {
    title: 'Board too large!',
    body: 'You cannot play a game with more than 100 pieces.',
    cls: 'alert alert-danger',
  },
  tooLopsided: {
    title: 'Board too lopsided!',
    body: 'You cannot play a game with one side much longer than the other.',
    cls: 'alert alert-danger',
  }
};

let htmlGameBoard;
let htmlBoardHeight;
let htmlBoardWidth;
let htmlTimer;
let htmlMoves;
let htmlNotifier;
let htmlPaused;

// Initialization process
(function () {
  htmlPlayArea = document.getElementById('game_board');
  htmlGameBoard = document.getElementById('board');
  htmlBoardHeight = document.getElementById('board_height');
  htmlBoardWidth = document.getElementById('board_width');
  htmlTimer = document.getElementById('game_timer');
  htmlMoves = document.getElementById('game_moves');
  htmlNotifier = document.getElementById('notifier');
  htmlPaused = document.getElementById('paused');

  document.getElementById('new_game').addEventListener('click', newGameClick);
  document.getElementById('pause_game').addEventListener('click', pauseGameClick);
  document.getElementById('reset_game').addEventListener('click', resetGameClick);

  newGame();
})();

function incrementMoves() {
  game.moves.count++;
  htmlMoves.innerHTML = game.moves.count;
}

function decrementMoves() {
  game.moves.count--;
  htmlMoves.innerHTML = game.moves.count;
}

function resetMoves() {
  htmlMoves.innerHTML = '0';
  game.moves.count = 0;
}

function resetTimer() {
  game.timer.seconds = 0;
  htmlTimer.innerHTML = '0 seconds';

  clearInterval(game.timer.intervalId);
  game.timer.intervalId = setInterval(() => {
    game.timer.seconds = game.paused ? game.timer.seconds : game.timer.seconds + 1;
    htmlTimer.innerHTML = `${game.timer.seconds} second${game.timer.seconds === 1 ? '' : 's'}`;
  }, 1000);
  togglePause(false);
}

function newGameClick(event) {
  event.preventDefault();

  if (htmlBoardHeight.value * htmlBoardWidth.value < 3) {
    notify(alerts.tooSmall);
    return;
  }

  if (htmlBoardHeight.value * htmlBoardWidth.value > 100) {
    notify(alerts.tooLarge);
    return;
  }

  if (htmlBoardHeight.value > 15 || htmlBoardWidth.value > 15) {
    notify(alerts.tooLopsided);
    return;
  }

  resetTimer();
  clearNotifications();
  newGame();
}

function pauseGameClick(event) {
  event.preventDefault();
  togglePause();
}

function resetGameClick(event) {
  event.preventDefault();
  clearNotifications();
  resetMoves();
  resetTimer();
  removeOldPieces();
  htmlGenerateBoard();
  htmlBoardHeight.value = game.options.size.height;
  htmlBoardWidth.value = game.options.size.width;
}

function clearNotifications() {
  htmlNotifier.innerHTML = '';
}

function newGame() {
  updateOptions({
    size: {
      height: htmlBoardHeight.value || 4,
      width: htmlBoardWidth.value || 4
    }
  });

  removeOldPieces();
  generateBoard();
  shuffleBoard();
  htmlGenerateBoard();
  resetMoves();
  resetTimer();
  togglePause(false);

  // stretch the playing area to match the board
  let height = window.innerHeight > htmlGameBoard.offsetHeight + 10
    ? window.innerHeight
    : htmlGameBoard.offsetHeight + (10 * game.options.size.height);
  let lastPiece = document.getElementById(`piece_${game.options.size.width - 1}`);
  let width = window.innerWidth > htmlGameBoard.offsetWidth + 10
    ? window.innerWidth
    : htmlGameBoard.offsetWidth + lastPiece.offsetLeft + lastPiece.offsetWidth;

  htmlPlayArea.style.height = `${height}px`;
  htmlPlayArea.style.width = `${width}px`;
}

function removeOldPieces() {
  Array.from(document.getElementsByClassName('piece')).forEach((p) => {
    p.parentNode.removeChild(p);
  });
}

function togglePause(override) {
  game.paused = override == undefined ? !game.paused : !!override;
  if (game.paused) {
    htmlPaused.style.display = 'block';
    Array.from(document.getElementsByClassName('piece')).forEach((p) => {
      p.style.display = 'none';
    });
  } else {
    htmlPaused.style.display = 'none';
    Array.from(document.getElementsByClassName('piece')).forEach((p) => {
      p.style.display = 'block';
    });
  }
}

function startTimer() {
  game.timer.start = Date.now();
}

function isSolved() {
  let slots = Array.from(document.getElementsByClassName('slot'));
  for (let i = 0; i < slots.length; ++i) {
    if (!slots[i].dataset.pieceId) {
      return false;
    }
  }
  return true;
}

function endGame() {
  notify(alerts.end);
  clearInterval(game.timer.intervalId);
  Array.from(document.getElementsByClassName('piece')).forEach((p) => {
    p.removeEventListener('mousedown', pieceMouseDownListener);
  });
}

function swapPieces(first, second) {
  const oldPiece = game.pieces[first];
  game.pieces[first] = game.pieces[second];
  game.pieces[second] = oldPiece;
}

function loopPieces(callback) {
  let row = 0;
  let index = 0;
  while (index < game.options.size.height * game.options.size.width) {
    const col = index % game.options.size.width;
    row = col == 0 && index != 0 ? row + 1 : row;
    callback(game.pieces[index], {row, col, index});
    ++index;
  }
}

function generateBoard() {
  game.board = [];
  game.pieces = [];
  for (let row = 0; row < game.options.size.height; ++row) {
    for (let col = 0; col < game.options.size.width; ++col) {
      if (!Array.isArray(game.board[row])) game.board[row] = [];

      let left, top, right, bottom;
      if (col > 0) left = game.board[row][col - 1].values.right;
      if (row > 0) top = game.board[row - 1][col].values.bottom;

      game.pieces.push(newPiece(left, top));
      game.board[row][col] = game.pieces[game.pieces.length - 1];
    }
  }
}

function htmlGenerateBoard() {
  const htmlGameBoard = document.getElementById('board');
  // const htmlStaging = document.getElementById('staging');
  htmlGameBoard.innerHTML = '';
  let i = 0;
  for (let row = 0; row < game.options.size.height; ++row) {
    htmlGameBoard.innerHTML += `<div id="row_${row}" class="row">`;
    for (let col = 0; col < game.options.size.width; ++col) {
      htmlGameBoard.innerHTML += `<div id="row_${row}_col_${col}" class="col slot">
      </div>`;
    }
    htmlGameBoard.innerHTML += '</div>';
  }

  loopPieces((p, obj) => {
    let piece = generatePiece(p, obj.index);
    stagePiece(piece, obj.index);
  });

  document.body.onmousemove = pieceMouseMoveListener;
  document.body.onmouseup = pieceMouseUpListener;
  window.addEventListener('resize', () => {
    loopPieces((p, obj) => {
      let piece = document.getElementById(`piece_${obj.index}`);
      stagePiece(piece, obj.index);
    });
  });
}

function htmlGeneratePiece(piece, id) {
  return `<div id="piece_${id}" class="piece">
    <div class="top_val">${piece.values.top}</div>
    <div class="left_val">${piece.values.left}</div>
    <div class="right_val">${piece.values.right}</div>
    <div class="bottom_val">${piece.values.bottom}</div>
  </div>`;
}

function generatePiece(p, i) {
  let piece = document.createElement('div');
  piece.innerHTML = htmlGeneratePiece(p, i);
  piece = piece.firstChild;
  document.body.appendChild(piece);
  return piece;
}

function stagePiece(piece, i) {
  // set to it's slot if available
  if (piece.dataset.slotId) {
    let slot = document.getElementById(piece.dataset.slotId);
    piece.offsetTop = slot.offsetTop;
    piece.offsetLeft = slot.offsetLeft;
    return;
  }

  // Move pieces to their slots or staging area
  const padding = 10
  const offsetLeft = htmlGameBoard.offsetWidth + 10 + padding + (i % game.options.size.width * (piece.offsetWidth + padding));
  const offsetTop = htmlGameBoard.offsetTop + padding + (Math.floor(i / game.options.size.width) % game.options.size.height * (piece.offsetHeight + padding));
  // Move pieces to staging area
  piece.style.left = `${offsetLeft}px`;
  piece.style.top = `${offsetTop}px`;
  piece.dataset.oldTop = piece.style.top;
  piece.dataset.oldLeft = piece.style.left;
  // Attach event listeners
  piece.addEventListener('mousedown', pieceMouseDownListener);
}

function shuffleBoard(arr) {
  game.pieces = game.pieces
    .map(a => [Math.random(), a])
    .sort((a, b) => a[0] - b[0])
    .map(a => a[1]);
}

function newPiece(left, top, right, bottom) {
  let random = () => Math.floor(Math.random() * 10);
  return {
    values: {
      left: left != undefined ? left : random(),
      top: top != undefined ? top : random(),
      right: right != undefined ? right : random(),
      bottom: bottom != undefined ? bottom : random(),
    },
    links: [],
  };
}

function getPieceById(id) {
  pId = id.match(/(\d+)$/);
  if (pId.length > 1) {
    piece = game.pieces[pId[1]];
    if (piece) {
      return piece;
    }
  }
  console.error(`Piece with id '${pId}' does not exist!`);
}

function updateOptions(incomingObj = {}) {
  const defaults = {
    size: {
      height: 4,
      width: 4,
    },
  };

  game.options = Object.assign({}, defaults, game.options, incomingObj);
}

function setPositionRelativeToMouse(el, event) {
  const rect = el.getBoundingClientRect();
  const top = (event.clientY + window.scrollY - (rect.height / 2));
  const left = (event.clientX + window.scrollX - (rect.width / 2));
  const right = left + rect.width;
  const bottom = top + rect.height;
  if (top > htmlPlayArea.offsetTop
    && left > htmlPlayArea.offsetLeft
    && right < htmlPlayArea.offsetLeft + htmlPlayArea.offsetWidth
    && bottom < htmlPlayArea.offsetTop + htmlPlayArea.offsetHeight
  ) {
    el.style.top = top + 'px';
    el.style.left = left + 'px';
    updatePieceSlot(el);
  }
}

function updatePieceSlot(el) {
  let current = 0;
  let placeholder;
  Array.from(document.getElementsByClassName('slot')).forEach((slot) => {
    const intersect = intersectRectangles(slot.getBoundingClientRect(), el.getBoundingClientRect());
    slot.classList.remove('placeholder');
    if (intersect > 0 && intersect > current) {
      current = intersect;
      placeholder = slot;
    }
  });

  if (placeholder) {
    placeholder.classList.add('placeholder');
  }
}

function intersectRectangles(rect1, rect2) {
  xOverlap = Math.max(0, Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left));
  yOverlap = Math.max(0, Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top));
  return xOverlap * yOverlap;
}

function notify(notifyObj) {
  let body = typeof notifyObj.body === 'string' ? notifyObj.body : notifyObj.body();
  htmlNotifier.innerHTML = `
    <div class="notify ${notifyObj.cls}">
      <h1>${notifyObj.title}</h1>
      <p>${body}</p>
    </div>
  `;
}

function getSlotPiece(row, col) {
  const slot = document.getElementById(`row_${row}_col_${col}`);
  if (slot && slot.dataset.pieceId) {
    return getPieceById(slot.dataset.pieceId);
  }
}

function matchNeighbors(slot, piece) {
  const pObj = getPieceById(piece.id);
  const pos = slot.id.match(/row_(\d+)_col_(\d+)/);
  if (pos.length > 1) {
    const row = Number(pos[1]);
    const col = Number(pos[2]);

    const nTop = getSlotPiece(row - 1, col);
    const nLeft = getSlotPiece(row, col - 1);
    const nRight = getSlotPiece(row, col + 1);
    const nBottom = getSlotPiece(row + 1, col);
    return (
      (!nTop || nTop.values.bottom === pObj.values.top) &&
      (!nLeft || nLeft.values.right === pObj.values.left) &&
      (!nRight || nRight.values.left === pObj.values.right) &&
      (!nBottom || nBottom.values.top === pObj.values.bottom)
    );
  }
  return false;
}

/**
 * Listeners
 */
function pieceMouseDownListener(event) {
  event.preventDefault();
  if (this.dataset.slotId) {
    previousSlot = document.getElementById(this.dataset.slotId);
    this.dataset.oldSlotId = this.dataset.slotId;
    delete previousSlot.dataset.pieceId;
    delete this.dataset.slotId;
  }
  this.classList.add('moving');
  this.style.zIndex = 2;
  setPositionRelativeToMouse(this, event);
}

function pieceMouseMoveListener(event) {
  event.preventDefault();
  Array.from(document.getElementsByClassName('moving')).forEach((p) => {
    setPositionRelativeToMouse(p, event);
  });
}

function pieceMouseUpListener(event) {
  event.preventDefault();

  if (!/piece_(\d+)/.test(event.target.id)) {
    return;
  }

  clearNotifications();

  let slot = document.getElementsByClassName('placeholder');

  if (slot.length > 0) {
    // TODO: drag-n-drop multiple tiles
    slot = slot[0];
  } else {
    slot = undefined;
  }

  Array.from(document.getElementsByClassName('moving')).forEach((p) => {
    p.classList.remove('moving');
    p.style.zIndex = 1;

    if (slot) {
      slot.classList.remove('placeholder');
      let top = p.dataset.oldTop;
      let left = p.dataset.oldLeft;

      // check if slot contains a piece
      if (!slot.dataset.pieceId) {
        // check if neighbors support this piece
        if (matchNeighbors(slot, p)) {
          p.dataset.slotId = slot.id;
          slot.dataset.pieceId = p.id;
          top = slot.offsetTop;
          left = slot.offsetLeft;
          if (p.dataset.oldSlotId == p.dataset.slotId) {
            decrementMoves();
          }
        } else {
          notify(alerts.noMatch);
          if (p.dataset.oldSlotId) {
            previousSlot = document.getElementById(p.dataset.oldSlotId);
            previousSlot.dataset.pieceId = p.id
            p.dataset.slotId = p.dataset.oldSlotId;
            delete p.dataset.oldSlotId;
          }
        }
      } else {
        notify(alerts.occupied);
        if (p.dataset.oldSlotId) {
          previousSlot = document.getElementById(p.dataset.oldSlotId);
          previousSlot.dataset.pieceId = p.id
          p.dataset.slotId = p.dataset.oldSlotId;
          delete p.dataset.oldSlotId;
        }
      }

      // Set new piece position
      p.dataset.oldTop = top;
      p.dataset.oldLeft = left;
      p.style.top = top;
      p.style.left = left;
    }

    delete p.dataset.oldSlotId;
  });

  // Count the move (even if not successful)
  incrementMoves();

  if (isSolved()) {
    endGame();
  }
}
