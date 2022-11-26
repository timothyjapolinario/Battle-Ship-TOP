const Gameboard = (area, boardNumber) => {
  if (typeof area !== "number" && area !== undefined) {
    return null;
  }
  const filledSpaces = [];
  const getArea = () => {
    return area;
  };
  //not declared to be a pure function
  const placeShip = (ship, coordinate) => {
    const space = {
      ship: ship,
      x: fillX(ship.getLength(), coordinate[0]),
      y: [coordinate[1]],
      containInX: function (xVal) {
        const cond = this.x.find((curX) => {
          return curX === xVal;
        });
        if (cond !== undefined) {
          return true;
        }
        return false;
      },
    };
    if (isSpaceAvailable(space.x, space.y)) {
      filledSpaces.push(space);
      return true;
    } else {
      return false;
    }
  };
  const isSpaceAvailable = function (x, y) {
    const spaceAvailable = [];
    const area = getArea();
    //First space
    if (filledSpaces.length === 0 && x[x.length - 1] < getArea() && y < area) {
      spaceAvailable.push(true);
      return spaceAvailable[0];
    }

    //n number spaces
    filledSpaces.forEach((filledSpace) => {
      if (filledSpace.y[0] === y[0]) {
        const matches = filledSpace.x.filter((xVal) => {
          if (x.indexOf(xVal) !== -1) {
            return true;
          }
        });
        const matches2 = x.filter((xVal) => {
          if (filledSpace.x.indexOf(xVal) !== -1) {
            return true;
          }
        });
        if (matches2.length > 0) {
          spaceAvailable.push(false);
        }
      } else if (x[x.length - 1] < getArea() && y[0] < area) {
        spaceAvailable.push(true);
        return;
      }
    });
    if (spaceAvailable.indexOf(false) === -1 && spaceAvailable.length !== 0) {
      return true;
    }
    return false;
  };
  const fillX = function (length, start) {
    const xVals = [];
    let i = 0;
    while (i < length) {
      xVals.push(start + i);
      i += 1;
    }
    return xVals;
  };
  const getFilledSpaces = () => {
    return filledSpaces;
  };
  const recieveAttack = (x, y) => {
    //Attack not missed
    const attackSpace = filledSpaces.find((space) => {
      if (space.y[0] === y) {
        const xVal = space.x.find((xVal, index) => {
          if (xVal === x) {
            space.x[index] = null;
            return true;
          }
        });
        if (xVal > -1) {
          return true;
        }
      }
    });
    if (attackSpace) {
      attackSpace.ship.hit();
      return attackSpace.ship;
    }
  };
  const getBoardNumber = () => {
    return boardNumber;
  };
  const areAllShipSunk = () => {
    const lastShipAlive = filledSpaces.find((space) => {
      return !space.ship.isSunk();
    });
    if (lastShipAlive) {
      return false;
    }
    return true;
  };
  return {
    placeShip,
    getFilledSpaces,
    recieveAttack,
    areAllShipSunk,
    getArea,
    isSpaceAvailable,
    getBoardNumber,
  };
};

export default Gameboard;
