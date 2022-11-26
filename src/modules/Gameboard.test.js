import Gameboard from "./Gameboard.js";
import Ship from "./Ship.js";

test("place ships", () => {
  const board = Gameboard();

  const shipObj = Ship(5);
  const info = {
    ship: shipObj,
    x: [0, 1, 2, 3, 4],
    y: [0],
  };
  //ship1
  board.placeShip(shipObj, [0, 0]);
  expect(shipObj.getLength()).toBe(5);
  expect(board.getFilledSpaces()[0]).toEqual(info);

  //ship2
  const shipObj2 = Ship(3);
  const info2 = {
    ship: shipObj2,
    x: [1, 2, 3],
    y: [1],
  };
  board.placeShip(shipObj2, [1, 1]);
  expect(shipObj2.getLength()).toBe(3);
  expect(board.getFilledSpaces()[1]).toEqual(info2);
});

test("place a ship on location that has another ship", () => {
  const board = Gameboard();
  const shipObj = Ship(5);
  const info = {
    ship: shipObj,
    x: [0, 1, 2, 3, 4],
    y: [0],
  };
  //ship 1
  board.placeShip(shipObj, [0, 0]);
  expect(shipObj.getLength()).toBe(5);
  expect(board.getFilledSpaces()[0]).toEqual(info);

  //invalid ship
  const shipObj2 = Ship(3);
  board.placeShip(shipObj2, [0, 0]);
  expect(shipObj2.getLength()).toBe(3);
  expect(board.getFilledSpaces()[1]).toBeUndefined();
});

test("recieve attack", () => {
  const board = Gameboard();
  const shipObj = Ship(5);
  board.placeShip(shipObj, [3, 8]);

  const shipObj2 = Ship(2);
  board.placeShip(shipObj2, [2, 7]);

  //expect(board.recieveAttack(5, 8)).toMatchObject(shipObj);
  expect(board.recieveAttack(0, 8)).toBeUndefined();
  expect(board.recieveAttack(6, 5)).toBeUndefined();
  expect(board.recieveAttack(3, 7)).toEqual(shipObj2);
});

test("check if all ship are sunk", () => {
  const board = Gameboard();
  const shipObj = Ship(1);
  board.placeShip(shipObj, [3, 8]);
  board.recieveAttack(3, 8);

  const shipObj2 = Ship(2);
  board.placeShip(shipObj2, [2, 7]);
  board.recieveAttack(2, 7);

  expect(board.areAllShipSunk()).toBe(false);
  board.recieveAttack(3, 7);

  expect(board.areAllShipSunk()).toBe(true);
});

test("should return area", () => {
  const board = Gameboard(10);
  expect(board.getArea()).toBe(10);
});
