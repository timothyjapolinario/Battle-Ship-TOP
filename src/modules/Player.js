const Human = () => {
  const attack = (x, y, board) => {
    board.recieveAttack(x, y);
  };
};

const Computer = () => {
  const selectedValues = {};
  const attack = (board) => {
    const boardSize = board.getArea();
    if (hasSpace(boardSize)) {
      let x = getRandomValue(boardSize - 1);
      let y = getRandomValue(boardSize - 1);
      while (
        selectedValues[y] !== undefined &&
        selectedValues[y].length === boardSize
      ) {
        y = getRandomValue(boardSize - 1);
      }
      if (selectedValues[y] !== undefined) {
        let result = selectedValues[y].find((xVal) => xVal === x);
        while (result !== undefined) {
          x = getRandomValue(boardSize - 1);
          result = selectedValues[y].find((xVal) => xVal === x);
        }
        selectedValues[y].push(x);
      } else {
        selectedValues[y] = [x];
      }
      return [x, y];
    }
    return null;
  };
  const getRandomValue = (max) => {
    return Math.round(Math.random() * max);
  };
  const hasSpace = (boardSize) => {
    let val = false;
    if (Object.keys(selectedValues).length < boardSize) {
      val = true;
      return val;
    }
    for (const property in selectedValues) {
      if (selectedValues[property].length < boardSize) {
        val = true;
      }
    }
    return val;
  };
  return { attack };
};
export { Human, Computer };
