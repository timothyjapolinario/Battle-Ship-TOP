const Ship = (shipLength) => {
  let length = shipLength;
  let hits = 0;

  const hit = () => {
    hits += 1;
  };

  const getHits = () => {
    return hits;
  };
  const getLength = () => {
    return length;
  };

  const isSunk = () => {
    console.log(hits);
    if (hits === length) {
      return true;
    }
    return false;
  };
  return {
    getLength,
    getHits,
    hit,
    isSunk,
  };
};

export default Ship;
