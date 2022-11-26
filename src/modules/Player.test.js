import { Computer, Human } from "./Player.js";
import Gameboard from "./Gameboard.js";
test.only("computer should return valid coordinates", () => {
  const computer = Computer();
  //   const board = Gameboard(2);
  //   //   let boardArea = 2 * 2;
  //   //   let i = 0;
  //   //   while (i < boardArea) {
  //   //     computer.attack(board);
  //   //     i += 1;
  //   //   }
  //   //   expect(computer.attack(board)).toBe(null);

  const board2 = Gameboard(3);
  let boardArea = 3 * 3;
  let i = 0;
  while (i < boardArea) {
    computer.attack(board2);
    i += 1;
  }
  expect(computer.attack(board2)).toBe(null);
});
