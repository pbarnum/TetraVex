const game = {
  options: {},
  board: [],
  pieces: [],
  paused: true,
  timer: {
    seconds: 0,
  }
};

let htmlGameBoard;
let htmlStaging;
let htmlBoardHeight;
let htmlBoardWidth;
let htmlTimer;

// Initialization process
(function () {
  htmlGameBoard = document.getElementById('board');
  htmlStaging = document.getElementById('staging');
  htmlBoardHeight = document.getElementById('board_height');
  htmlBoardWidth = document.getElementById('board_width');
  htmlTimer = document.getElementById('game_timer');

  newGame();
  // build board
  // start timer
  // reset points
  // add listeners
  // define all html variables here (declare globally)
  document.getElementById('new_game').addEventListener('click', newGameClick);
  document.getElementById('pause_game').addEventListener('click', pauseGameClick);
})();

function newGameClick(event) {
  event.preventDefault();
  // get all input values
  // validate inputs (board no less than 2x2)
  newGame();
}

function pauseGameClick(event) {
  event.preventDefault();
  togglePause();
}

function newGame() {
  // set the staging area to the same height as the board
  htmlStaging.style.height = `${htmlGameBoard.outerHeight}px`;
  updateOptions({
    size: {
      height: htmlBoardHeight.value || 4,
      width: htmlBoardWidth.value || 4
    }
  });
  generateBoard();
  shuffleBoard();
  htmlGenerateBoard();

  game.timer.seconds = 0;
  game.timer.intervalId = setInterval(() => {
    game.timer.seconds = game.paused ? game.timer.seconds : game.timer.seconds + 1;
    htmlTimer.innerHTML = `${game.timer.seconds} second${game.timer.seconds === 1 ? '' : 's'}`;
  }, 1000);
  togglePause(false);
}

function togglePause(override) {
  game.paused = override == undefined ? !game.paused : !!override;
  if (game.paused) {

  } else {

  }
}

function startTimer() {
  game.timer.start = Date.now();
}

function isSolved() {
  loopBoard((piece, pos) => {
    id = 0;
    game.pieces.forEach((p, i) => {
      if (p == game.board[pos.row][pos.col]) {
        id = i;
        return;
      }
    });
    console.log(piece == game.board[pos.row][pos.col], pos.row, pos.col, pos.index, 'loc on board', id);
  });
}

function swapPieces(first, second) {
  const oldPiece = game.pieces[first];
  game.pieces[first] = game.pieces[second];
  game.pieces[second] = oldPiece;
}

function loopBoard(callback) {
  let row = 0;
  let index = 0;
  while (index < game.options.size.height * game.options.size.width) {
    const col = index % game.options.size.width;
    row = col == 0 && index != 0 ? row + 1 : row;
    callback(game.pieces[index], {row, col, index});
    ++index;
  }
}

// done
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
  const htmlStaging = document.getElementById('staging');
  htmlGameBoard.innerHTML = '';
  let i = 0;
  for (let row = 0; row < game.options.size.height; ++row) {
    htmlGameBoard.innerHTML += `<div id="row_${row}" class="row">`;
    for (let col = 0; col < game.options.size.width; ++col) {
      htmlGameBoard.innerHTML += `<div id="row_${row}_col_${col}" class="col">
        ${htmlGeneratePiece(game.pieces[i], i++)}
      </div>`;
    }
    htmlGameBoard.innerHTML += '</div>';
  }

  // Move all pieces to the staging area
  Array.prototype.forEach.call(
    document.getElementsByClassName('piece'),
    (p) => {
      // Move pieces to staging area
      p.style.left = `${htmlStaging.offsetLeft}px`;
      // Attach event listeners
      p.addEventListener('mousedown', pieceMouseDownListener);
    }
  );
}


// function movePieces

function htmlGeneratePiece(piece, id) {
  return `<div id="piece_${id}" class="piece">
    <div class="top_val">${piece.values.top}</div>
    <div class="left_val">${piece.values.left}</div>
    <div class="right_val">${piece.values.right}</div>
    <div class="bottom_val">${piece.values.bottom}</div>
  </div>`;
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
  pId = id.match(/(\d+)$/)[1];
  if (pId) {
    piece = game.pieces[pId];
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

// function setPosition(element) {
//   element.style.top =
// }

/**
 * Listeners
 */
function pieceMouseDownListener(event) {
  event.preventDefault();
  const piece = getPieceById(this.id);
  setPosition(this)
}

function pieceMoveListener(event) {

}

