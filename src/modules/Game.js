import Ship from "./Ship.js";
import Gameboard from "./Gameboard.js";
import { Computer } from "./Player.js";
import {
  generateBoardUI,
  placeShipToRandomLocation,
  renderPlacedShip,
  renderRemovedShip,
  enableBoard,
  disableBoard,
  disablePixel,
  renderShipAttacked,
  renderWinner,
} from "./UI.js";

let hasGameStarted = false;
const boardList = document.querySelector(".board-list");

let movingSpace = null;
const initializeGame = () => {
  const playerOneBoard = initializePlayerOne();
  const playerTwoBoard = initializPlayerTwo();

  const AI = Computer();
  PubSub.subscribe("space-clicked", () => {
    if (hasGameStarted) {
      const coord = AI.attack(playerOneBoard);
      if (playerOneBoard.recieveAttack(coord[0], coord[1])) {
        renderShipAttacked([...coord, 1]);
      }
      disablePixel(null, [...coord, 1]);
      enableBoard(2);
      console.log(playerOneBoard.getFilledSpaces());
    }
  });
};

const initializePlayerOne = () => {
  const userGameBoard = Gameboard(12, 1);
  const ship5 = Ship(5);
  const ship4 = Ship(4);
  const ship3 = Ship(3);
  const ship2 = Ship(3);
  const ship1 = Ship(2);
  const boardUI = generateBoardUI(userGameBoard);
  boardList.appendChild(boardUI);

  placeShipToRandomLocation(userGameBoard, ship1, 11, true);
  placeShipToRandomLocation(userGameBoard, ship2, 11, true);
  // placeShipToRandomLocation(userGameBoard, ship3, 11);
  // placeShipToRandomLocation(userGameBoard, ship4, 11);
  // placeShipToRandomLocation(userGameBoard, ship5, 11);

  initBoardSubs(userGameBoard);
  return userGameBoard;
};

const initializPlayerTwo = () => {
  const userGameBoard = Gameboard(12, 2);
  const ship5 = Ship(5);
  const ship4 = Ship(4);
  const ship3 = Ship(3);
  const ship2 = Ship(3);
  const ship1 = Ship(2);
  boardList.appendChild(generateBoardUI(userGameBoard));

  placeShipToRandomLocation(userGameBoard, ship1, 11, true);
  placeShipToRandomLocation(userGameBoard, ship2, 11, true);
  disableBoard(2);
  // placeShipToRandomLocation(userGameBoard, ship3, 11);
  // placeShipToRandomLocation(userGameBoard, ship4, 11);
  // placeShipToRandomLocation(userGameBoard, ship5, 11);

  initBoardSubs(userGameBoard);
  return userGameBoard;
};
const announceWinner = (playerNumberLoser) => {
  const winner = playerNumberLoser === 1 ? 2 : 1;
  renderWinner(winner);
  disableBoard(2);
  hasGameStarted = false;
};
const initBoardSubs = (board) => {
  const spaceClickedSub = (msg, data) => {
    if (data[2] === board.getBoardNumber()) {
      const x = parseInt(data[0]);
      const y = parseInt(data[1]);
      if (hasGameStarted) {
        const nextBoard = data[2] === 1 ? 2 : 1;
        if (board.recieveAttack(x, y)) {
          renderShipAttacked(data);
        }
        if (hasGameStarted) {
          disableBoard(nextBoard);
          enableBoard(data[2]);
        }
        if (board.areAllShipSunk()) {
          announceWinner(data[2]);
        }
      } else {
        moveShip(x, y);
      }
    }
  };

  const moveShip = (x, y) => {
    let originalShip = null;
    const currentSpaceIndex = board.getFilledSpaces().findIndex((space) => {
      if (space.containInX(x) && space.y[0] === y) {
        return true;
      }
    });
    if (board.getFilledSpaces()[currentSpaceIndex] !== undefined) {
      originalShip = board.getFilledSpaces()[currentSpaceIndex];
      if (movingSpace === null) {
        movingSpace = originalShip;
        renderRemovedShip(
          originalShip.x,
          originalShip.y,
          board.getBoardNumber()
        );
        board.getFilledSpaces().splice(currentSpaceIndex, 1);
        console.log("REMOVED!");
        console.log(board.getFilledSpaces());
      }
    } else {
      if (movingSpace !== null) {
        const space = movingSpace;
        const cond = board.placeShip(space.ship, [x, y]);
        if (cond) {
          console.log("PUTTED IN");
          console.log(board.getFilledSpaces());
          const filledSpaces = board.getFilledSpaces();
          const space = filledSpaces[filledSpaces.length - 1];
          renderPlacedShip(space.x, space.y, board.getBoardNumber());
          movingSpace = null;
        }
      }
    }
  };
  const startGameSub = (msg, data) => {
    hasGameStarted = data;
  };
  PubSub.subscribe("game-started", startGameSub);
  PubSub.subscribe("space-clicked", spaceClickedSub);
  return board;
};

export default initializeGame;
