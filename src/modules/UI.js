import PubSub from "pubsub-js";
let hasGameStarted = false;

const startButton = document.querySelector(".start-button");

startButton.addEventListener("click", () => {
  if (!hasGameStarted) {
    console.log("GAME STARTED");
    hasGameStarted = true;
    PubSub.publish("game-started", true);
    enableBoard(2);
    disableBoard(1);
  }
});
const generateBoardUI = (board) => {
  const row = board.getArea();
  const column = board.getArea();
  const area = row * column;
  let i = 0;
  const boardDiv = document.createElement("div");
  boardDiv.setAttribute("board-number", board.getBoardNumber());
  boardDiv.classList.add("board");
  boardDiv.style.gridTemplateColumns = `repeat(${column}, 1fr)`;
  boardDiv.style.gridTemplateRows = `repeat(${row}, 1fr)`;
  let y = 0;
  let x = 0;
  while (i < area) {
    const pixel = drawPixel(column, board.getBoardNumber());
    boardDiv.appendChild(pixel);
    if (x === column) {
      y += 1;
      x = 0;
    }
    pixel.setAttribute("x", x);
    pixel.setAttribute("y", y);
    x += 1;
    i += 1;
  }
  return boardDiv;
};
const getCoordinates = (pixel) => {
  const x = pixel.getAttribute("x");
  const y = pixel.getAttribute("y");
  return [x, y];
};
const drawPixel = (column, boardNumber) => {
  const pixel = document.createElement("div");
  pixel.classList.add("pixel");
  pixel.style.height = `calc(60vh/${column})`;
  pixel.addEventListener("click", () => {
    PubSub.publish("space-clicked", [...getCoordinates(pixel), boardNumber]);
    if (hasGameStarted) {
      pixel.classList.remove("ship-located");
    }
  });
  return pixel;
};

const renderShipAttacked = (data) => {
  const pixel = document
    .querySelector(`[board-number="${data[2]}"]`)
    .querySelector(`[x="${data[0]}"][y="${data[1]}"]`);
  pixel.classList.add("ship-attacked");
};
const disablePixel = (msg, data) => {
  if (hasGameStarted) {
    const pixel = document
      .querySelector(`[board-number="${data[2]}"]`)
      .querySelector(`[x="${data[0]}"][y="${data[1]}"]`);
    pixel.innerText = "X";
    pixel.classList.add("inactive-pixel");
  }
};

PubSub.subscribe("space-clicked", disablePixel);

const disableBoard = (activeBoardNumber) => {
  console.log("TANGINA!");
  const activeBoard = document.querySelector(
    `[board-number="${activeBoardNumber}"]`
  );
  activeBoard.classList.add("inactive-board");
};

const enableBoard = (inactiveBoardNumber) => {
  const activeBoard = document.querySelector(
    `[board-number="${inactiveBoardNumber}"]`
  );
  activeBoard.classList.remove("inactive-board");
};
const renderPlacedShip = (xList, yList, boardNumber) => {
  xList.forEach((xVal) => {
    document
      .querySelector(`[board-number="${boardNumber}"]`)
      .querySelector(`[x="${xVal}"][y="${yList[0]}"]`)
      .classList.add("ship-located");
  });
};
const renderRemovedShip = (xList, yList, boardNumber) => {
  console.log("BOARDNUMBER: ", boardNumber);
  xList.forEach((xVal) => {
    document
      .querySelector(`[board-number="${boardNumber}"]`)
      .querySelector(`[x="${xVal}"][y="${yList[0]}"]`)
      .classList.remove("ship-located");
  });
};
const placeShipToRandomLocation = (board, ship, maxNumber, shouldRender) => {
  let x = Math.round(Math.random() * maxNumber);
  let y = Math.round(Math.random() * maxNumber);
  while (true) {
    x = Math.round(Math.random() * maxNumber);
    y = Math.round(Math.random() * maxNumber);
    if (board.placeShip(ship, [x, y])) {
      break;
    }
  }

  board.placeShip(ship, [12, 0]);
  const space = board.getFilledSpaces()[board.getFilledSpaces().length - 1];
  console.log("BOARDNUMBER: ", board.getBoardNumber());
  if (shouldRender) {
    renderPlacedShip(space.x, space.y, board.getBoardNumber());
  }
};
const renderWinner = (playerNumber) => {
  const winnerUI = document.querySelector(".winner");
  winnerUI.innerText = `Winner!: ${playerNumber}`;
  return winnerUI;
};
export {
  generateBoardUI,
  placeShipToRandomLocation,
  renderPlacedShip,
  renderRemovedShip,
  enableBoard,
  disableBoard,
  disablePixel,
  renderShipAttacked,
  renderWinner,
};
