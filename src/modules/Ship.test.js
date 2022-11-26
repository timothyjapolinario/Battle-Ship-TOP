import Ship from "./Ship.js";

test("contructor ship object", () => {
  const ship = Ship(3);
  expect(ship.getLength()).toEqual(3);
});

test("hit ship", () => {
  const ship = Ship(5);
  ship.hit();
  expect(ship.getHits()).toEqual(1);
  ship.hit();
  expect(ship.getHits()).toEqual(2);
});

test("sunk a ship", () => {
  const ship = Ship(3);
  ship.hit();
  ship.hit();
  ship.hit();
  expect(ship.isSunk()).toBe(true);
});
