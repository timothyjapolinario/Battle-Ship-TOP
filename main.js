/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/pubsub-js/src/pubsub.js":
/*!**********************************************!*\
  !*** ./node_modules/pubsub-js/src/pubsub.js ***!
  \**********************************************/
/***/ (function(module, exports, __webpack_require__) {

/* module decorator */ module = __webpack_require__.nmd(module);
/**
 * Copyright (c) 2010,2011,2012,2013,2014 Morgan Roderick http://roderick.dk
 * License: MIT - http://mrgnrdrck.mit-license.org
 *
 * https://github.com/mroderick/PubSubJS
 */

(function (root, factory){
    'use strict';

    var PubSub = {};

    if (root.PubSub) {
        PubSub = root.PubSub;
        console.warn("PubSub already loaded, using existing version");
    } else {
        root.PubSub = PubSub;
        factory(PubSub);
    }
    // CommonJS and Node.js module support
    if (true){
        if (module !== undefined && module.exports) {
            exports = module.exports = PubSub; // Node.js specific `module.exports`
        }
        exports.PubSub = PubSub; // CommonJS module 1.1.1 spec
        module.exports = exports = PubSub; // CommonJS
    }
    // AMD support
    /* eslint-disable no-undef */
    else {}

}(( typeof window === 'object' && window ) || this, function (PubSub){
    'use strict';

    var messages = {},
        lastUid = -1,
        ALL_SUBSCRIBING_MSG = '*';

    function hasKeys(obj){
        var key;

        for (key in obj){
            if ( Object.prototype.hasOwnProperty.call(obj, key) ){
                return true;
            }
        }
        return false;
    }

    /**
     * Returns a function that throws the passed exception, for use as argument for setTimeout
     * @alias throwException
     * @function
     * @param { Object } ex An Error object
     */
    function throwException( ex ){
        return function reThrowException(){
            throw ex;
        };
    }

    function callSubscriberWithDelayedExceptions( subscriber, message, data ){
        try {
            subscriber( message, data );
        } catch( ex ){
            setTimeout( throwException( ex ), 0);
        }
    }

    function callSubscriberWithImmediateExceptions( subscriber, message, data ){
        subscriber( message, data );
    }

    function deliverMessage( originalMessage, matchedMessage, data, immediateExceptions ){
        var subscribers = messages[matchedMessage],
            callSubscriber = immediateExceptions ? callSubscriberWithImmediateExceptions : callSubscriberWithDelayedExceptions,
            s;

        if ( !Object.prototype.hasOwnProperty.call( messages, matchedMessage ) ) {
            return;
        }

        for (s in subscribers){
            if ( Object.prototype.hasOwnProperty.call(subscribers, s)){
                callSubscriber( subscribers[s], originalMessage, data );
            }
        }
    }

    function createDeliveryFunction( message, data, immediateExceptions ){
        return function deliverNamespaced(){
            var topic = String( message ),
                position = topic.lastIndexOf( '.' );

            // deliver the message as it is now
            deliverMessage(message, message, data, immediateExceptions);

            // trim the hierarchy and deliver message to each level
            while( position !== -1 ){
                topic = topic.substr( 0, position );
                position = topic.lastIndexOf('.');
                deliverMessage( message, topic, data, immediateExceptions );
            }

            deliverMessage(message, ALL_SUBSCRIBING_MSG, data, immediateExceptions);
        };
    }

    function hasDirectSubscribersFor( message ) {
        var topic = String( message ),
            found = Boolean(Object.prototype.hasOwnProperty.call( messages, topic ) && hasKeys(messages[topic]));

        return found;
    }

    function messageHasSubscribers( message ){
        var topic = String( message ),
            found = hasDirectSubscribersFor(topic) || hasDirectSubscribersFor(ALL_SUBSCRIBING_MSG),
            position = topic.lastIndexOf( '.' );

        while ( !found && position !== -1 ){
            topic = topic.substr( 0, position );
            position = topic.lastIndexOf( '.' );
            found = hasDirectSubscribersFor(topic);
        }

        return found;
    }

    function publish( message, data, sync, immediateExceptions ){
        message = (typeof message === 'symbol') ? message.toString() : message;

        var deliver = createDeliveryFunction( message, data, immediateExceptions ),
            hasSubscribers = messageHasSubscribers( message );

        if ( !hasSubscribers ){
            return false;
        }

        if ( sync === true ){
            deliver();
        } else {
            setTimeout( deliver, 0 );
        }
        return true;
    }

    /**
     * Publishes the message, passing the data to it's subscribers
     * @function
     * @alias publish
     * @param { String } message The message to publish
     * @param {} data The data to pass to subscribers
     * @return { Boolean }
     */
    PubSub.publish = function( message, data ){
        return publish( message, data, false, PubSub.immediateExceptions );
    };

    /**
     * Publishes the message synchronously, passing the data to it's subscribers
     * @function
     * @alias publishSync
     * @param { String } message The message to publish
     * @param {} data The data to pass to subscribers
     * @return { Boolean }
     */
    PubSub.publishSync = function( message, data ){
        return publish( message, data, true, PubSub.immediateExceptions );
    };

    /**
     * Subscribes the passed function to the passed message. Every returned token is unique and should be stored if you need to unsubscribe
     * @function
     * @alias subscribe
     * @param { String } message The message to subscribe to
     * @param { Function } func The function to call when a new message is published
     * @return { String }
     */
    PubSub.subscribe = function( message, func ){
        if ( typeof func !== 'function'){
            return false;
        }

        message = (typeof message === 'symbol') ? message.toString() : message;

        // message is not registered yet
        if ( !Object.prototype.hasOwnProperty.call( messages, message ) ){
            messages[message] = {};
        }

        // forcing token as String, to allow for future expansions without breaking usage
        // and allow for easy use as key names for the 'messages' object
        var token = 'uid_' + String(++lastUid);
        messages[message][token] = func;

        // return token for unsubscribing
        return token;
    };

    PubSub.subscribeAll = function( func ){
        return PubSub.subscribe(ALL_SUBSCRIBING_MSG, func);
    };

    /**
     * Subscribes the passed function to the passed message once
     * @function
     * @alias subscribeOnce
     * @param { String } message The message to subscribe to
     * @param { Function } func The function to call when a new message is published
     * @return { PubSub }
     */
    PubSub.subscribeOnce = function( message, func ){
        var token = PubSub.subscribe( message, function(){
            // before func apply, unsubscribe message
            PubSub.unsubscribe( token );
            func.apply( this, arguments );
        });
        return PubSub;
    };

    /**
     * Clears all subscriptions
     * @function
     * @public
     * @alias clearAllSubscriptions
     */
    PubSub.clearAllSubscriptions = function clearAllSubscriptions(){
        messages = {};
    };

    /**
     * Clear subscriptions by the topic
     * @function
     * @public
     * @alias clearAllSubscriptions
     * @return { int }
     */
    PubSub.clearSubscriptions = function clearSubscriptions(topic){
        var m;
        for (m in messages){
            if (Object.prototype.hasOwnProperty.call(messages, m) && m.indexOf(topic) === 0){
                delete messages[m];
            }
        }
    };

    /**
       Count subscriptions by the topic
     * @function
     * @public
     * @alias countSubscriptions
     * @return { Array }
    */
    PubSub.countSubscriptions = function countSubscriptions(topic){
        var m;
        // eslint-disable-next-line no-unused-vars
        var token;
        var count = 0;
        for (m in messages) {
            if (Object.prototype.hasOwnProperty.call(messages, m) && m.indexOf(topic) === 0) {
                for (token in messages[m]) {
                    count++;
                }
                break;
            }
        }
        return count;
    };


    /**
       Gets subscriptions by the topic
     * @function
     * @public
     * @alias getSubscriptions
    */
    PubSub.getSubscriptions = function getSubscriptions(topic){
        var m;
        var list = [];
        for (m in messages){
            if (Object.prototype.hasOwnProperty.call(messages, m) && m.indexOf(topic) === 0){
                list.push(m);
            }
        }
        return list;
    };

    /**
     * Removes subscriptions
     *
     * - When passed a token, removes a specific subscription.
     *
	 * - When passed a function, removes all subscriptions for that function
     *
	 * - When passed a topic, removes all subscriptions for that topic (hierarchy)
     * @function
     * @public
     * @alias subscribeOnce
     * @param { String | Function } value A token, function or topic to unsubscribe from
     * @example // Unsubscribing with a token
     * var token = PubSub.subscribe('mytopic', myFunc);
     * PubSub.unsubscribe(token);
     * @example // Unsubscribing with a function
     * PubSub.unsubscribe(myFunc);
     * @example // Unsubscribing from a topic
     * PubSub.unsubscribe('mytopic');
     */
    PubSub.unsubscribe = function(value){
        var descendantTopicExists = function(topic) {
                var m;
                for ( m in messages ){
                    if ( Object.prototype.hasOwnProperty.call(messages, m) && m.indexOf(topic) === 0 ){
                        // a descendant of the topic exists:
                        return true;
                    }
                }

                return false;
            },
            isTopic    = typeof value === 'string' && ( Object.prototype.hasOwnProperty.call(messages, value) || descendantTopicExists(value) ),
            isToken    = !isTopic && typeof value === 'string',
            isFunction = typeof value === 'function',
            result = false,
            m, message, t;

        if (isTopic){
            PubSub.clearSubscriptions(value);
            return;
        }

        for ( m in messages ){
            if ( Object.prototype.hasOwnProperty.call( messages, m ) ){
                message = messages[m];

                if ( isToken && message[value] ){
                    delete message[value];
                    result = value;
                    // tokens are unique, so we can just stop here
                    break;
                }

                if (isFunction) {
                    for ( t in message ){
                        if (Object.prototype.hasOwnProperty.call(message, t) && message[t] === value){
                            delete message[t];
                            result = true;
                        }
                    }
                }
            }
        }

        return result;
    };
}));


/***/ }),

/***/ "./src/modules/Game.js":
/*!*****************************!*\
  !*** ./src/modules/Game.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _Ship_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Ship.js */ "./src/modules/Ship.js");
/* harmony import */ var _Gameboard_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Gameboard.js */ "./src/modules/Gameboard.js");
/* harmony import */ var _Player_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./Player.js */ "./src/modules/Player.js");
/* harmony import */ var _UI_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./UI.js */ "./src/modules/UI.js");





let hasGameStarted = false;
const boardList = document.querySelector(".board-list");

let movingSpace = null;
const initializeGame = () => {
  const playerOneBoard = initializePlayerOne();
  const playerTwoBoard = initializPlayerTwo();

  const AI = (0,_Player_js__WEBPACK_IMPORTED_MODULE_2__.Computer)();
  PubSub.subscribe("space-clicked", () => {
    if (hasGameStarted) {
      const coord = AI.attack(playerOneBoard);
      if (playerOneBoard.recieveAttack(coord[0], coord[1])) {
        (0,_UI_js__WEBPACK_IMPORTED_MODULE_3__.renderShipAttacked)([...coord, 1]);
      }
      (0,_UI_js__WEBPACK_IMPORTED_MODULE_3__.disablePixel)(null, [...coord, 1]);
      (0,_UI_js__WEBPACK_IMPORTED_MODULE_3__.enableBoard)(2);
      console.log(playerOneBoard.getFilledSpaces());
    }
  });
};

const initializePlayerOne = () => {
  const userGameBoard = (0,_Gameboard_js__WEBPACK_IMPORTED_MODULE_1__["default"])(12, 1);
  const ship5 = (0,_Ship_js__WEBPACK_IMPORTED_MODULE_0__["default"])(5);
  const ship4 = (0,_Ship_js__WEBPACK_IMPORTED_MODULE_0__["default"])(4);
  const ship3 = (0,_Ship_js__WEBPACK_IMPORTED_MODULE_0__["default"])(3);
  const ship2 = (0,_Ship_js__WEBPACK_IMPORTED_MODULE_0__["default"])(3);
  const ship1 = (0,_Ship_js__WEBPACK_IMPORTED_MODULE_0__["default"])(2);
  const boardUI = (0,_UI_js__WEBPACK_IMPORTED_MODULE_3__.generateBoardUI)(userGameBoard);
  boardList.appendChild(boardUI);

  (0,_UI_js__WEBPACK_IMPORTED_MODULE_3__.placeShipToRandomLocation)(userGameBoard, ship1, 11, true);
  (0,_UI_js__WEBPACK_IMPORTED_MODULE_3__.placeShipToRandomLocation)(userGameBoard, ship2, 11, true);
  // placeShipToRandomLocation(userGameBoard, ship3, 11);
  // placeShipToRandomLocation(userGameBoard, ship4, 11);
  // placeShipToRandomLocation(userGameBoard, ship5, 11);

  initBoardSubs(userGameBoard);
  return userGameBoard;
};

const initializPlayerTwo = () => {
  const userGameBoard = (0,_Gameboard_js__WEBPACK_IMPORTED_MODULE_1__["default"])(12, 2);
  const ship5 = (0,_Ship_js__WEBPACK_IMPORTED_MODULE_0__["default"])(5);
  const ship4 = (0,_Ship_js__WEBPACK_IMPORTED_MODULE_0__["default"])(4);
  const ship3 = (0,_Ship_js__WEBPACK_IMPORTED_MODULE_0__["default"])(3);
  const ship2 = (0,_Ship_js__WEBPACK_IMPORTED_MODULE_0__["default"])(3);
  const ship1 = (0,_Ship_js__WEBPACK_IMPORTED_MODULE_0__["default"])(2);
  boardList.appendChild((0,_UI_js__WEBPACK_IMPORTED_MODULE_3__.generateBoardUI)(userGameBoard));

  (0,_UI_js__WEBPACK_IMPORTED_MODULE_3__.placeShipToRandomLocation)(userGameBoard, ship1, 11, true);
  (0,_UI_js__WEBPACK_IMPORTED_MODULE_3__.placeShipToRandomLocation)(userGameBoard, ship2, 11, true);
  (0,_UI_js__WEBPACK_IMPORTED_MODULE_3__.disableBoard)(2);
  // placeShipToRandomLocation(userGameBoard, ship3, 11);
  // placeShipToRandomLocation(userGameBoard, ship4, 11);
  // placeShipToRandomLocation(userGameBoard, ship5, 11);

  initBoardSubs(userGameBoard);
  return userGameBoard;
};
const announceWinner = (playerNumberLoser) => {
  const winner = playerNumberLoser === 1 ? 2 : 1;
  (0,_UI_js__WEBPACK_IMPORTED_MODULE_3__.renderWinner)(winner);
  (0,_UI_js__WEBPACK_IMPORTED_MODULE_3__.disableBoard)(2);
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
          (0,_UI_js__WEBPACK_IMPORTED_MODULE_3__.renderShipAttacked)(data);
        }
        if (hasGameStarted) {
          (0,_UI_js__WEBPACK_IMPORTED_MODULE_3__.disableBoard)(nextBoard);
          (0,_UI_js__WEBPACK_IMPORTED_MODULE_3__.enableBoard)(data[2]);
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
        (0,_UI_js__WEBPACK_IMPORTED_MODULE_3__.renderRemovedShip)(
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
          (0,_UI_js__WEBPACK_IMPORTED_MODULE_3__.renderPlacedShip)(space.x, space.y, board.getBoardNumber());
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

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (initializeGame);


/***/ }),

/***/ "./src/modules/Gameboard.js":
/*!**********************************!*\
  !*** ./src/modules/Gameboard.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
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

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Gameboard);


/***/ }),

/***/ "./src/modules/Player.js":
/*!*******************************!*\
  !*** ./src/modules/Player.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Computer": () => (/* binding */ Computer),
/* harmony export */   "Human": () => (/* binding */ Human)
/* harmony export */ });
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



/***/ }),

/***/ "./src/modules/Ship.js":
/*!*****************************!*\
  !*** ./src/modules/Ship.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
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

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Ship);


/***/ }),

/***/ "./src/modules/UI.js":
/*!***************************!*\
  !*** ./src/modules/UI.js ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "disableBoard": () => (/* binding */ disableBoard),
/* harmony export */   "disablePixel": () => (/* binding */ disablePixel),
/* harmony export */   "enableBoard": () => (/* binding */ enableBoard),
/* harmony export */   "generateBoardUI": () => (/* binding */ generateBoardUI),
/* harmony export */   "placeShipToRandomLocation": () => (/* binding */ placeShipToRandomLocation),
/* harmony export */   "renderPlacedShip": () => (/* binding */ renderPlacedShip),
/* harmony export */   "renderRemovedShip": () => (/* binding */ renderRemovedShip),
/* harmony export */   "renderShipAttacked": () => (/* binding */ renderShipAttacked),
/* harmony export */   "renderWinner": () => (/* binding */ renderWinner)
/* harmony export */ });
/* harmony import */ var pubsub_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! pubsub-js */ "./node_modules/pubsub-js/src/pubsub.js");
/* harmony import */ var pubsub_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(pubsub_js__WEBPACK_IMPORTED_MODULE_0__);

let hasGameStarted = false;

const startButton = document.querySelector(".start-button");

startButton.addEventListener("click", () => {
  if (!hasGameStarted) {
    console.log("GAME STARTED");
    hasGameStarted = true;
    pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().publish("game-started", true);
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
    pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().publish("space-clicked", [...getCoordinates(pixel), boardNumber]);
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

pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe("space-clicked", disablePixel);

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



/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/node module decorator */
/******/ 	(() => {
/******/ 		__webpack_require__.nmd = (module) => {
/******/ 			module.paths = [];
/******/ 			if (!module.children) module.children = [];
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _modules_Game_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./modules/Game.js */ "./src/modules/Game.js");


(0,_modules_Game_js__WEBPACK_IMPORTED_MODULE_0__["default"])();

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBUSx5REFBaUI7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVSx3REFBZ0I7QUFDMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLGlFQUFlLGNBQWMsRUFBQzs7Ozs7Ozs7Ozs7Ozs7OztBQ3BKOUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFFBQVE7QUFDUjtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FB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RDs7Ozs7V0NOQTtXQUNBO1dBQ0E7V0FDQTtXQUNBOzs7Ozs7Ozs7Ozs7O0FDSitDOztBQUUvQyw0REFBYyIsInNvdXJjZXMiOlsid2VicGFjazovL2JhdHRsZS1zaGlwLXRvcC8uL25vZGVfbW9kdWxlcy9wdWJzdWItanMvc3JjL3B1YnN1Yi5qcyIsIndlYnBhY2s6Ly9iYXR0bGUtc2hpcC10b3AvLi9zcmMvbW9kdWxlcy9HYW1lLmpzIiwid2VicGFjazovL2JhdHRsZS1zaGlwLXRvcC8uL3NyYy9tb2R1bGVzL0dhbWVib2FyZC5qcyIsIndlYnBhY2s6Ly9iYXR0bGUtc2hpcC10b3AvLi9zcmMvbW9kdWxlcy9QbGF5ZXIuanMiLCJ3ZWJwYWNrOi8vYmF0dGxlLXNoaXAtdG9wLy4vc3JjL21vZHVsZXMvU2hpcC5qcyIsIndlYnBhY2s6Ly9iYXR0bGUtc2hpcC10b3AvLi9zcmMvbW9kdWxlcy9VSS5qcyIsIndlYnBhY2s6Ly9iYXR0bGUtc2hpcC10b3Avd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vYmF0dGxlLXNoaXAtdG9wL3dlYnBhY2svcnVudGltZS9jb21wYXQgZ2V0IGRlZmF1bHQgZXhwb3J0Iiwid2VicGFjazovL2JhdHRsZS1zaGlwLXRvcC93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vYmF0dGxlLXNoaXAtdG9wL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vYmF0dGxlLXNoaXAtdG9wL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vYmF0dGxlLXNoaXAtdG9wL3dlYnBhY2svcnVudGltZS9ub2RlIG1vZHVsZSBkZWNvcmF0b3IiLCJ3ZWJwYWNrOi8vYmF0dGxlLXNoaXAtdG9wLy4vc3JjL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDEwLDIwMTEsMjAxMiwyMDEzLDIwMTQgTW9yZ2FuIFJvZGVyaWNrIGh0dHA6Ly9yb2Rlcmljay5ka1xuICogTGljZW5zZTogTUlUIC0gaHR0cDovL21yZ25yZHJjay5taXQtbGljZW5zZS5vcmdcbiAqXG4gKiBodHRwczovL2dpdGh1Yi5jb20vbXJvZGVyaWNrL1B1YlN1YkpTXG4gKi9cblxuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KXtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgUHViU3ViID0ge307XG5cbiAgICBpZiAocm9vdC5QdWJTdWIpIHtcbiAgICAgICAgUHViU3ViID0gcm9vdC5QdWJTdWI7XG4gICAgICAgIGNvbnNvbGUud2FybihcIlB1YlN1YiBhbHJlYWR5IGxvYWRlZCwgdXNpbmcgZXhpc3RpbmcgdmVyc2lvblwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByb290LlB1YlN1YiA9IFB1YlN1YjtcbiAgICAgICAgZmFjdG9yeShQdWJTdWIpO1xuICAgIH1cbiAgICAvLyBDb21tb25KUyBhbmQgTm9kZS5qcyBtb2R1bGUgc3VwcG9ydFxuICAgIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpe1xuICAgICAgICBpZiAobW9kdWxlICE9PSB1bmRlZmluZWQgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAgICAgICAgIGV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IFB1YlN1YjsgLy8gTm9kZS5qcyBzcGVjaWZpYyBgbW9kdWxlLmV4cG9ydHNgXG4gICAgICAgIH1cbiAgICAgICAgZXhwb3J0cy5QdWJTdWIgPSBQdWJTdWI7IC8vIENvbW1vbkpTIG1vZHVsZSAxLjEuMSBzcGVjXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IFB1YlN1YjsgLy8gQ29tbW9uSlNcbiAgICB9XG4gICAgLy8gQU1EIHN1cHBvcnRcbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBuby11bmRlZiAqL1xuICAgIGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCl7XG4gICAgICAgIGRlZmluZShmdW5jdGlvbigpIHsgcmV0dXJuIFB1YlN1YjsgfSk7XG4gICAgICAgIC8qIGVzbGludC1lbmFibGUgbm8tdW5kZWYgKi9cbiAgICB9XG5cbn0oKCB0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JyAmJiB3aW5kb3cgKSB8fCB0aGlzLCBmdW5jdGlvbiAoUHViU3ViKXtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgbWVzc2FnZXMgPSB7fSxcbiAgICAgICAgbGFzdFVpZCA9IC0xLFxuICAgICAgICBBTExfU1VCU0NSSUJJTkdfTVNHID0gJyonO1xuXG4gICAgZnVuY3Rpb24gaGFzS2V5cyhvYmope1xuICAgICAgICB2YXIga2V5O1xuXG4gICAgICAgIGZvciAoa2V5IGluIG9iail7XG4gICAgICAgICAgICBpZiAoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkgKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgdGhyb3dzIHRoZSBwYXNzZWQgZXhjZXB0aW9uLCBmb3IgdXNlIGFzIGFyZ3VtZW50IGZvciBzZXRUaW1lb3V0XG4gICAgICogQGFsaWFzIHRocm93RXhjZXB0aW9uXG4gICAgICogQGZ1bmN0aW9uXG4gICAgICogQHBhcmFtIHsgT2JqZWN0IH0gZXggQW4gRXJyb3Igb2JqZWN0XG4gICAgICovXG4gICAgZnVuY3Rpb24gdGhyb3dFeGNlcHRpb24oIGV4ICl7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiByZVRocm93RXhjZXB0aW9uKCl7XG4gICAgICAgICAgICB0aHJvdyBleDtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjYWxsU3Vic2NyaWJlcldpdGhEZWxheWVkRXhjZXB0aW9ucyggc3Vic2NyaWJlciwgbWVzc2FnZSwgZGF0YSApe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgc3Vic2NyaWJlciggbWVzc2FnZSwgZGF0YSApO1xuICAgICAgICB9IGNhdGNoKCBleCApe1xuICAgICAgICAgICAgc2V0VGltZW91dCggdGhyb3dFeGNlcHRpb24oIGV4ICksIDApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2FsbFN1YnNjcmliZXJXaXRoSW1tZWRpYXRlRXhjZXB0aW9ucyggc3Vic2NyaWJlciwgbWVzc2FnZSwgZGF0YSApe1xuICAgICAgICBzdWJzY3JpYmVyKCBtZXNzYWdlLCBkYXRhICk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGVsaXZlck1lc3NhZ2UoIG9yaWdpbmFsTWVzc2FnZSwgbWF0Y2hlZE1lc3NhZ2UsIGRhdGEsIGltbWVkaWF0ZUV4Y2VwdGlvbnMgKXtcbiAgICAgICAgdmFyIHN1YnNjcmliZXJzID0gbWVzc2FnZXNbbWF0Y2hlZE1lc3NhZ2VdLFxuICAgICAgICAgICAgY2FsbFN1YnNjcmliZXIgPSBpbW1lZGlhdGVFeGNlcHRpb25zID8gY2FsbFN1YnNjcmliZXJXaXRoSW1tZWRpYXRlRXhjZXB0aW9ucyA6IGNhbGxTdWJzY3JpYmVyV2l0aERlbGF5ZWRFeGNlcHRpb25zLFxuICAgICAgICAgICAgcztcblxuICAgICAgICBpZiAoICFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoIG1lc3NhZ2VzLCBtYXRjaGVkTWVzc2FnZSApICkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChzIGluIHN1YnNjcmliZXJzKXtcbiAgICAgICAgICAgIGlmICggT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHN1YnNjcmliZXJzLCBzKSl7XG4gICAgICAgICAgICAgICAgY2FsbFN1YnNjcmliZXIoIHN1YnNjcmliZXJzW3NdLCBvcmlnaW5hbE1lc3NhZ2UsIGRhdGEgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZURlbGl2ZXJ5RnVuY3Rpb24oIG1lc3NhZ2UsIGRhdGEsIGltbWVkaWF0ZUV4Y2VwdGlvbnMgKXtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIGRlbGl2ZXJOYW1lc3BhY2VkKCl7XG4gICAgICAgICAgICB2YXIgdG9waWMgPSBTdHJpbmcoIG1lc3NhZ2UgKSxcbiAgICAgICAgICAgICAgICBwb3NpdGlvbiA9IHRvcGljLmxhc3RJbmRleE9mKCAnLicgKTtcblxuICAgICAgICAgICAgLy8gZGVsaXZlciB0aGUgbWVzc2FnZSBhcyBpdCBpcyBub3dcbiAgICAgICAgICAgIGRlbGl2ZXJNZXNzYWdlKG1lc3NhZ2UsIG1lc3NhZ2UsIGRhdGEsIGltbWVkaWF0ZUV4Y2VwdGlvbnMpO1xuXG4gICAgICAgICAgICAvLyB0cmltIHRoZSBoaWVyYXJjaHkgYW5kIGRlbGl2ZXIgbWVzc2FnZSB0byBlYWNoIGxldmVsXG4gICAgICAgICAgICB3aGlsZSggcG9zaXRpb24gIT09IC0xICl7XG4gICAgICAgICAgICAgICAgdG9waWMgPSB0b3BpYy5zdWJzdHIoIDAsIHBvc2l0aW9uICk7XG4gICAgICAgICAgICAgICAgcG9zaXRpb24gPSB0b3BpYy5sYXN0SW5kZXhPZignLicpO1xuICAgICAgICAgICAgICAgIGRlbGl2ZXJNZXNzYWdlKCBtZXNzYWdlLCB0b3BpYywgZGF0YSwgaW1tZWRpYXRlRXhjZXB0aW9ucyApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkZWxpdmVyTWVzc2FnZShtZXNzYWdlLCBBTExfU1VCU0NSSUJJTkdfTVNHLCBkYXRhLCBpbW1lZGlhdGVFeGNlcHRpb25zKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoYXNEaXJlY3RTdWJzY3JpYmVyc0ZvciggbWVzc2FnZSApIHtcbiAgICAgICAgdmFyIHRvcGljID0gU3RyaW5nKCBtZXNzYWdlICksXG4gICAgICAgICAgICBmb3VuZCA9IEJvb2xlYW4oT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKCBtZXNzYWdlcywgdG9waWMgKSAmJiBoYXNLZXlzKG1lc3NhZ2VzW3RvcGljXSkpO1xuXG4gICAgICAgIHJldHVybiBmb3VuZDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtZXNzYWdlSGFzU3Vic2NyaWJlcnMoIG1lc3NhZ2UgKXtcbiAgICAgICAgdmFyIHRvcGljID0gU3RyaW5nKCBtZXNzYWdlICksXG4gICAgICAgICAgICBmb3VuZCA9IGhhc0RpcmVjdFN1YnNjcmliZXJzRm9yKHRvcGljKSB8fCBoYXNEaXJlY3RTdWJzY3JpYmVyc0ZvcihBTExfU1VCU0NSSUJJTkdfTVNHKSxcbiAgICAgICAgICAgIHBvc2l0aW9uID0gdG9waWMubGFzdEluZGV4T2YoICcuJyApO1xuXG4gICAgICAgIHdoaWxlICggIWZvdW5kICYmIHBvc2l0aW9uICE9PSAtMSApe1xuICAgICAgICAgICAgdG9waWMgPSB0b3BpYy5zdWJzdHIoIDAsIHBvc2l0aW9uICk7XG4gICAgICAgICAgICBwb3NpdGlvbiA9IHRvcGljLmxhc3RJbmRleE9mKCAnLicgKTtcbiAgICAgICAgICAgIGZvdW5kID0gaGFzRGlyZWN0U3Vic2NyaWJlcnNGb3IodG9waWMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZvdW5kO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHB1Ymxpc2goIG1lc3NhZ2UsIGRhdGEsIHN5bmMsIGltbWVkaWF0ZUV4Y2VwdGlvbnMgKXtcbiAgICAgICAgbWVzc2FnZSA9ICh0eXBlb2YgbWVzc2FnZSA9PT0gJ3N5bWJvbCcpID8gbWVzc2FnZS50b1N0cmluZygpIDogbWVzc2FnZTtcblxuICAgICAgICB2YXIgZGVsaXZlciA9IGNyZWF0ZURlbGl2ZXJ5RnVuY3Rpb24oIG1lc3NhZ2UsIGRhdGEsIGltbWVkaWF0ZUV4Y2VwdGlvbnMgKSxcbiAgICAgICAgICAgIGhhc1N1YnNjcmliZXJzID0gbWVzc2FnZUhhc1N1YnNjcmliZXJzKCBtZXNzYWdlICk7XG5cbiAgICAgICAgaWYgKCAhaGFzU3Vic2NyaWJlcnMgKXtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggc3luYyA9PT0gdHJ1ZSApe1xuICAgICAgICAgICAgZGVsaXZlcigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2V0VGltZW91dCggZGVsaXZlciwgMCApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFB1Ymxpc2hlcyB0aGUgbWVzc2FnZSwgcGFzc2luZyB0aGUgZGF0YSB0byBpdCdzIHN1YnNjcmliZXJzXG4gICAgICogQGZ1bmN0aW9uXG4gICAgICogQGFsaWFzIHB1Ymxpc2hcbiAgICAgKiBAcGFyYW0geyBTdHJpbmcgfSBtZXNzYWdlIFRoZSBtZXNzYWdlIHRvIHB1Ymxpc2hcbiAgICAgKiBAcGFyYW0ge30gZGF0YSBUaGUgZGF0YSB0byBwYXNzIHRvIHN1YnNjcmliZXJzXG4gICAgICogQHJldHVybiB7IEJvb2xlYW4gfVxuICAgICAqL1xuICAgIFB1YlN1Yi5wdWJsaXNoID0gZnVuY3Rpb24oIG1lc3NhZ2UsIGRhdGEgKXtcbiAgICAgICAgcmV0dXJuIHB1Ymxpc2goIG1lc3NhZ2UsIGRhdGEsIGZhbHNlLCBQdWJTdWIuaW1tZWRpYXRlRXhjZXB0aW9ucyApO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBQdWJsaXNoZXMgdGhlIG1lc3NhZ2Ugc3luY2hyb25vdXNseSwgcGFzc2luZyB0aGUgZGF0YSB0byBpdCdzIHN1YnNjcmliZXJzXG4gICAgICogQGZ1bmN0aW9uXG4gICAgICogQGFsaWFzIHB1Ymxpc2hTeW5jXG4gICAgICogQHBhcmFtIHsgU3RyaW5nIH0gbWVzc2FnZSBUaGUgbWVzc2FnZSB0byBwdWJsaXNoXG4gICAgICogQHBhcmFtIHt9IGRhdGEgVGhlIGRhdGEgdG8gcGFzcyB0byBzdWJzY3JpYmVyc1xuICAgICAqIEByZXR1cm4geyBCb29sZWFuIH1cbiAgICAgKi9cbiAgICBQdWJTdWIucHVibGlzaFN5bmMgPSBmdW5jdGlvbiggbWVzc2FnZSwgZGF0YSApe1xuICAgICAgICByZXR1cm4gcHVibGlzaCggbWVzc2FnZSwgZGF0YSwgdHJ1ZSwgUHViU3ViLmltbWVkaWF0ZUV4Y2VwdGlvbnMgKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogU3Vic2NyaWJlcyB0aGUgcGFzc2VkIGZ1bmN0aW9uIHRvIHRoZSBwYXNzZWQgbWVzc2FnZS4gRXZlcnkgcmV0dXJuZWQgdG9rZW4gaXMgdW5pcXVlIGFuZCBzaG91bGQgYmUgc3RvcmVkIGlmIHlvdSBuZWVkIHRvIHVuc3Vic2NyaWJlXG4gICAgICogQGZ1bmN0aW9uXG4gICAgICogQGFsaWFzIHN1YnNjcmliZVxuICAgICAqIEBwYXJhbSB7IFN0cmluZyB9IG1lc3NhZ2UgVGhlIG1lc3NhZ2UgdG8gc3Vic2NyaWJlIHRvXG4gICAgICogQHBhcmFtIHsgRnVuY3Rpb24gfSBmdW5jIFRoZSBmdW5jdGlvbiB0byBjYWxsIHdoZW4gYSBuZXcgbWVzc2FnZSBpcyBwdWJsaXNoZWRcbiAgICAgKiBAcmV0dXJuIHsgU3RyaW5nIH1cbiAgICAgKi9cbiAgICBQdWJTdWIuc3Vic2NyaWJlID0gZnVuY3Rpb24oIG1lc3NhZ2UsIGZ1bmMgKXtcbiAgICAgICAgaWYgKCB0eXBlb2YgZnVuYyAhPT0gJ2Z1bmN0aW9uJyl7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBtZXNzYWdlID0gKHR5cGVvZiBtZXNzYWdlID09PSAnc3ltYm9sJykgPyBtZXNzYWdlLnRvU3RyaW5nKCkgOiBtZXNzYWdlO1xuXG4gICAgICAgIC8vIG1lc3NhZ2UgaXMgbm90IHJlZ2lzdGVyZWQgeWV0XG4gICAgICAgIGlmICggIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCggbWVzc2FnZXMsIG1lc3NhZ2UgKSApe1xuICAgICAgICAgICAgbWVzc2FnZXNbbWVzc2FnZV0gPSB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGZvcmNpbmcgdG9rZW4gYXMgU3RyaW5nLCB0byBhbGxvdyBmb3IgZnV0dXJlIGV4cGFuc2lvbnMgd2l0aG91dCBicmVha2luZyB1c2FnZVxuICAgICAgICAvLyBhbmQgYWxsb3cgZm9yIGVhc3kgdXNlIGFzIGtleSBuYW1lcyBmb3IgdGhlICdtZXNzYWdlcycgb2JqZWN0XG4gICAgICAgIHZhciB0b2tlbiA9ICd1aWRfJyArIFN0cmluZygrK2xhc3RVaWQpO1xuICAgICAgICBtZXNzYWdlc1ttZXNzYWdlXVt0b2tlbl0gPSBmdW5jO1xuXG4gICAgICAgIC8vIHJldHVybiB0b2tlbiBmb3IgdW5zdWJzY3JpYmluZ1xuICAgICAgICByZXR1cm4gdG9rZW47XG4gICAgfTtcblxuICAgIFB1YlN1Yi5zdWJzY3JpYmVBbGwgPSBmdW5jdGlvbiggZnVuYyApe1xuICAgICAgICByZXR1cm4gUHViU3ViLnN1YnNjcmliZShBTExfU1VCU0NSSUJJTkdfTVNHLCBmdW5jKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogU3Vic2NyaWJlcyB0aGUgcGFzc2VkIGZ1bmN0aW9uIHRvIHRoZSBwYXNzZWQgbWVzc2FnZSBvbmNlXG4gICAgICogQGZ1bmN0aW9uXG4gICAgICogQGFsaWFzIHN1YnNjcmliZU9uY2VcbiAgICAgKiBAcGFyYW0geyBTdHJpbmcgfSBtZXNzYWdlIFRoZSBtZXNzYWdlIHRvIHN1YnNjcmliZSB0b1xuICAgICAqIEBwYXJhbSB7IEZ1bmN0aW9uIH0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gY2FsbCB3aGVuIGEgbmV3IG1lc3NhZ2UgaXMgcHVibGlzaGVkXG4gICAgICogQHJldHVybiB7IFB1YlN1YiB9XG4gICAgICovXG4gICAgUHViU3ViLnN1YnNjcmliZU9uY2UgPSBmdW5jdGlvbiggbWVzc2FnZSwgZnVuYyApe1xuICAgICAgICB2YXIgdG9rZW4gPSBQdWJTdWIuc3Vic2NyaWJlKCBtZXNzYWdlLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgLy8gYmVmb3JlIGZ1bmMgYXBwbHksIHVuc3Vic2NyaWJlIG1lc3NhZ2VcbiAgICAgICAgICAgIFB1YlN1Yi51bnN1YnNjcmliZSggdG9rZW4gKTtcbiAgICAgICAgICAgIGZ1bmMuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIFB1YlN1YjtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ2xlYXJzIGFsbCBzdWJzY3JpcHRpb25zXG4gICAgICogQGZ1bmN0aW9uXG4gICAgICogQHB1YmxpY1xuICAgICAqIEBhbGlhcyBjbGVhckFsbFN1YnNjcmlwdGlvbnNcbiAgICAgKi9cbiAgICBQdWJTdWIuY2xlYXJBbGxTdWJzY3JpcHRpb25zID0gZnVuY3Rpb24gY2xlYXJBbGxTdWJzY3JpcHRpb25zKCl7XG4gICAgICAgIG1lc3NhZ2VzID0ge307XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIENsZWFyIHN1YnNjcmlwdGlvbnMgYnkgdGhlIHRvcGljXG4gICAgICogQGZ1bmN0aW9uXG4gICAgICogQHB1YmxpY1xuICAgICAqIEBhbGlhcyBjbGVhckFsbFN1YnNjcmlwdGlvbnNcbiAgICAgKiBAcmV0dXJuIHsgaW50IH1cbiAgICAgKi9cbiAgICBQdWJTdWIuY2xlYXJTdWJzY3JpcHRpb25zID0gZnVuY3Rpb24gY2xlYXJTdWJzY3JpcHRpb25zKHRvcGljKXtcbiAgICAgICAgdmFyIG07XG4gICAgICAgIGZvciAobSBpbiBtZXNzYWdlcyl7XG4gICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1lc3NhZ2VzLCBtKSAmJiBtLmluZGV4T2YodG9waWMpID09PSAwKXtcbiAgICAgICAgICAgICAgICBkZWxldGUgbWVzc2FnZXNbbV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICAgQ291bnQgc3Vic2NyaXB0aW9ucyBieSB0aGUgdG9waWNcbiAgICAgKiBAZnVuY3Rpb25cbiAgICAgKiBAcHVibGljXG4gICAgICogQGFsaWFzIGNvdW50U3Vic2NyaXB0aW9uc1xuICAgICAqIEByZXR1cm4geyBBcnJheSB9XG4gICAgKi9cbiAgICBQdWJTdWIuY291bnRTdWJzY3JpcHRpb25zID0gZnVuY3Rpb24gY291bnRTdWJzY3JpcHRpb25zKHRvcGljKXtcbiAgICAgICAgdmFyIG07XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFyc1xuICAgICAgICB2YXIgdG9rZW47XG4gICAgICAgIHZhciBjb3VudCA9IDA7XG4gICAgICAgIGZvciAobSBpbiBtZXNzYWdlcykge1xuICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtZXNzYWdlcywgbSkgJiYgbS5pbmRleE9mKHRvcGljKSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGZvciAodG9rZW4gaW4gbWVzc2FnZXNbbV0pIHtcbiAgICAgICAgICAgICAgICAgICAgY291bnQrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvdW50O1xuICAgIH07XG5cblxuICAgIC8qKlxuICAgICAgIEdldHMgc3Vic2NyaXB0aW9ucyBieSB0aGUgdG9waWNcbiAgICAgKiBAZnVuY3Rpb25cbiAgICAgKiBAcHVibGljXG4gICAgICogQGFsaWFzIGdldFN1YnNjcmlwdGlvbnNcbiAgICAqL1xuICAgIFB1YlN1Yi5nZXRTdWJzY3JpcHRpb25zID0gZnVuY3Rpb24gZ2V0U3Vic2NyaXB0aW9ucyh0b3BpYyl7XG4gICAgICAgIHZhciBtO1xuICAgICAgICB2YXIgbGlzdCA9IFtdO1xuICAgICAgICBmb3IgKG0gaW4gbWVzc2FnZXMpe1xuICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtZXNzYWdlcywgbSkgJiYgbS5pbmRleE9mKHRvcGljKSA9PT0gMCl7XG4gICAgICAgICAgICAgICAgbGlzdC5wdXNoKG0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBsaXN0O1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIHN1YnNjcmlwdGlvbnNcbiAgICAgKlxuICAgICAqIC0gV2hlbiBwYXNzZWQgYSB0b2tlbiwgcmVtb3ZlcyBhIHNwZWNpZmljIHN1YnNjcmlwdGlvbi5cbiAgICAgKlxuXHQgKiAtIFdoZW4gcGFzc2VkIGEgZnVuY3Rpb24sIHJlbW92ZXMgYWxsIHN1YnNjcmlwdGlvbnMgZm9yIHRoYXQgZnVuY3Rpb25cbiAgICAgKlxuXHQgKiAtIFdoZW4gcGFzc2VkIGEgdG9waWMsIHJlbW92ZXMgYWxsIHN1YnNjcmlwdGlvbnMgZm9yIHRoYXQgdG9waWMgKGhpZXJhcmNoeSlcbiAgICAgKiBAZnVuY3Rpb25cbiAgICAgKiBAcHVibGljXG4gICAgICogQGFsaWFzIHN1YnNjcmliZU9uY2VcbiAgICAgKiBAcGFyYW0geyBTdHJpbmcgfCBGdW5jdGlvbiB9IHZhbHVlIEEgdG9rZW4sIGZ1bmN0aW9uIG9yIHRvcGljIHRvIHVuc3Vic2NyaWJlIGZyb21cbiAgICAgKiBAZXhhbXBsZSAvLyBVbnN1YnNjcmliaW5nIHdpdGggYSB0b2tlblxuICAgICAqIHZhciB0b2tlbiA9IFB1YlN1Yi5zdWJzY3JpYmUoJ215dG9waWMnLCBteUZ1bmMpO1xuICAgICAqIFB1YlN1Yi51bnN1YnNjcmliZSh0b2tlbik7XG4gICAgICogQGV4YW1wbGUgLy8gVW5zdWJzY3JpYmluZyB3aXRoIGEgZnVuY3Rpb25cbiAgICAgKiBQdWJTdWIudW5zdWJzY3JpYmUobXlGdW5jKTtcbiAgICAgKiBAZXhhbXBsZSAvLyBVbnN1YnNjcmliaW5nIGZyb20gYSB0b3BpY1xuICAgICAqIFB1YlN1Yi51bnN1YnNjcmliZSgnbXl0b3BpYycpO1xuICAgICAqL1xuICAgIFB1YlN1Yi51bnN1YnNjcmliZSA9IGZ1bmN0aW9uKHZhbHVlKXtcbiAgICAgICAgdmFyIGRlc2NlbmRhbnRUb3BpY0V4aXN0cyA9IGZ1bmN0aW9uKHRvcGljKSB7XG4gICAgICAgICAgICAgICAgdmFyIG07XG4gICAgICAgICAgICAgICAgZm9yICggbSBpbiBtZXNzYWdlcyApe1xuICAgICAgICAgICAgICAgICAgICBpZiAoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtZXNzYWdlcywgbSkgJiYgbS5pbmRleE9mKHRvcGljKSA9PT0gMCApe1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYSBkZXNjZW5kYW50IG9mIHRoZSB0b3BpYyBleGlzdHM6XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpc1RvcGljICAgID0gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyAmJiAoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtZXNzYWdlcywgdmFsdWUpIHx8IGRlc2NlbmRhbnRUb3BpY0V4aXN0cyh2YWx1ZSkgKSxcbiAgICAgICAgICAgIGlzVG9rZW4gICAgPSAhaXNUb3BpYyAmJiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnLFxuICAgICAgICAgICAgaXNGdW5jdGlvbiA9IHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJyxcbiAgICAgICAgICAgIHJlc3VsdCA9IGZhbHNlLFxuICAgICAgICAgICAgbSwgbWVzc2FnZSwgdDtcblxuICAgICAgICBpZiAoaXNUb3BpYyl7XG4gICAgICAgICAgICBQdWJTdWIuY2xlYXJTdWJzY3JpcHRpb25zKHZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoIG0gaW4gbWVzc2FnZXMgKXtcbiAgICAgICAgICAgIGlmICggT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKCBtZXNzYWdlcywgbSApICl7XG4gICAgICAgICAgICAgICAgbWVzc2FnZSA9IG1lc3NhZ2VzW21dO1xuXG4gICAgICAgICAgICAgICAgaWYgKCBpc1Rva2VuICYmIG1lc3NhZ2VbdmFsdWVdICl7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBtZXNzYWdlW3ZhbHVlXTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRva2VucyBhcmUgdW5pcXVlLCBzbyB3ZSBjYW4ganVzdCBzdG9wIGhlcmVcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGlzRnVuY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICggdCBpbiBtZXNzYWdlICl7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1lc3NhZ2UsIHQpICYmIG1lc3NhZ2VbdF0gPT09IHZhbHVlKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgbWVzc2FnZVt0XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xufSkpO1xuIiwiaW1wb3J0IFNoaXAgZnJvbSBcIi4vU2hpcC5qc1wiO1xuaW1wb3J0IEdhbWVib2FyZCBmcm9tIFwiLi9HYW1lYm9hcmQuanNcIjtcbmltcG9ydCB7IENvbXB1dGVyIH0gZnJvbSBcIi4vUGxheWVyLmpzXCI7XG5pbXBvcnQge1xuICBnZW5lcmF0ZUJvYXJkVUksXG4gIHBsYWNlU2hpcFRvUmFuZG9tTG9jYXRpb24sXG4gIHJlbmRlclBsYWNlZFNoaXAsXG4gIHJlbmRlclJlbW92ZWRTaGlwLFxuICBlbmFibGVCb2FyZCxcbiAgZGlzYWJsZUJvYXJkLFxuICBkaXNhYmxlUGl4ZWwsXG4gIHJlbmRlclNoaXBBdHRhY2tlZCxcbiAgcmVuZGVyV2lubmVyLFxufSBmcm9tIFwiLi9VSS5qc1wiO1xuXG5sZXQgaGFzR2FtZVN0YXJ0ZWQgPSBmYWxzZTtcbmNvbnN0IGJvYXJkTGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuYm9hcmQtbGlzdFwiKTtcblxubGV0IG1vdmluZ1NwYWNlID0gbnVsbDtcbmNvbnN0IGluaXRpYWxpemVHYW1lID0gKCkgPT4ge1xuICBjb25zdCBwbGF5ZXJPbmVCb2FyZCA9IGluaXRpYWxpemVQbGF5ZXJPbmUoKTtcbiAgY29uc3QgcGxheWVyVHdvQm9hcmQgPSBpbml0aWFsaXpQbGF5ZXJUd28oKTtcblxuICBjb25zdCBBSSA9IENvbXB1dGVyKCk7XG4gIFB1YlN1Yi5zdWJzY3JpYmUoXCJzcGFjZS1jbGlja2VkXCIsICgpID0+IHtcbiAgICBpZiAoaGFzR2FtZVN0YXJ0ZWQpIHtcbiAgICAgIGNvbnN0IGNvb3JkID0gQUkuYXR0YWNrKHBsYXllck9uZUJvYXJkKTtcbiAgICAgIGlmIChwbGF5ZXJPbmVCb2FyZC5yZWNpZXZlQXR0YWNrKGNvb3JkWzBdLCBjb29yZFsxXSkpIHtcbiAgICAgICAgcmVuZGVyU2hpcEF0dGFja2VkKFsuLi5jb29yZCwgMV0pO1xuICAgICAgfVxuICAgICAgZGlzYWJsZVBpeGVsKG51bGwsIFsuLi5jb29yZCwgMV0pO1xuICAgICAgZW5hYmxlQm9hcmQoMik7XG4gICAgICBjb25zb2xlLmxvZyhwbGF5ZXJPbmVCb2FyZC5nZXRGaWxsZWRTcGFjZXMoKSk7XG4gICAgfVxuICB9KTtcbn07XG5cbmNvbnN0IGluaXRpYWxpemVQbGF5ZXJPbmUgPSAoKSA9PiB7XG4gIGNvbnN0IHVzZXJHYW1lQm9hcmQgPSBHYW1lYm9hcmQoMTIsIDEpO1xuICBjb25zdCBzaGlwNSA9IFNoaXAoNSk7XG4gIGNvbnN0IHNoaXA0ID0gU2hpcCg0KTtcbiAgY29uc3Qgc2hpcDMgPSBTaGlwKDMpO1xuICBjb25zdCBzaGlwMiA9IFNoaXAoMyk7XG4gIGNvbnN0IHNoaXAxID0gU2hpcCgyKTtcbiAgY29uc3QgYm9hcmRVSSA9IGdlbmVyYXRlQm9hcmRVSSh1c2VyR2FtZUJvYXJkKTtcbiAgYm9hcmRMaXN0LmFwcGVuZENoaWxkKGJvYXJkVUkpO1xuXG4gIHBsYWNlU2hpcFRvUmFuZG9tTG9jYXRpb24odXNlckdhbWVCb2FyZCwgc2hpcDEsIDExLCB0cnVlKTtcbiAgcGxhY2VTaGlwVG9SYW5kb21Mb2NhdGlvbih1c2VyR2FtZUJvYXJkLCBzaGlwMiwgMTEsIHRydWUpO1xuICAvLyBwbGFjZVNoaXBUb1JhbmRvbUxvY2F0aW9uKHVzZXJHYW1lQm9hcmQsIHNoaXAzLCAxMSk7XG4gIC8vIHBsYWNlU2hpcFRvUmFuZG9tTG9jYXRpb24odXNlckdhbWVCb2FyZCwgc2hpcDQsIDExKTtcbiAgLy8gcGxhY2VTaGlwVG9SYW5kb21Mb2NhdGlvbih1c2VyR2FtZUJvYXJkLCBzaGlwNSwgMTEpO1xuXG4gIGluaXRCb2FyZFN1YnModXNlckdhbWVCb2FyZCk7XG4gIHJldHVybiB1c2VyR2FtZUJvYXJkO1xufTtcblxuY29uc3QgaW5pdGlhbGl6UGxheWVyVHdvID0gKCkgPT4ge1xuICBjb25zdCB1c2VyR2FtZUJvYXJkID0gR2FtZWJvYXJkKDEyLCAyKTtcbiAgY29uc3Qgc2hpcDUgPSBTaGlwKDUpO1xuICBjb25zdCBzaGlwNCA9IFNoaXAoNCk7XG4gIGNvbnN0IHNoaXAzID0gU2hpcCgzKTtcbiAgY29uc3Qgc2hpcDIgPSBTaGlwKDMpO1xuICBjb25zdCBzaGlwMSA9IFNoaXAoMik7XG4gIGJvYXJkTGlzdC5hcHBlbmRDaGlsZChnZW5lcmF0ZUJvYXJkVUkodXNlckdhbWVCb2FyZCkpO1xuXG4gIHBsYWNlU2hpcFRvUmFuZG9tTG9jYXRpb24odXNlckdhbWVCb2FyZCwgc2hpcDEsIDExLCB0cnVlKTtcbiAgcGxhY2VTaGlwVG9SYW5kb21Mb2NhdGlvbih1c2VyR2FtZUJvYXJkLCBzaGlwMiwgMTEsIHRydWUpO1xuICBkaXNhYmxlQm9hcmQoMik7XG4gIC8vIHBsYWNlU2hpcFRvUmFuZG9tTG9jYXRpb24odXNlckdhbWVCb2FyZCwgc2hpcDMsIDExKTtcbiAgLy8gcGxhY2VTaGlwVG9SYW5kb21Mb2NhdGlvbih1c2VyR2FtZUJvYXJkLCBzaGlwNCwgMTEpO1xuICAvLyBwbGFjZVNoaXBUb1JhbmRvbUxvY2F0aW9uKHVzZXJHYW1lQm9hcmQsIHNoaXA1LCAxMSk7XG5cbiAgaW5pdEJvYXJkU3Vicyh1c2VyR2FtZUJvYXJkKTtcbiAgcmV0dXJuIHVzZXJHYW1lQm9hcmQ7XG59O1xuY29uc3QgYW5ub3VuY2VXaW5uZXIgPSAocGxheWVyTnVtYmVyTG9zZXIpID0+IHtcbiAgY29uc3Qgd2lubmVyID0gcGxheWVyTnVtYmVyTG9zZXIgPT09IDEgPyAyIDogMTtcbiAgcmVuZGVyV2lubmVyKHdpbm5lcik7XG4gIGRpc2FibGVCb2FyZCgyKTtcbiAgaGFzR2FtZVN0YXJ0ZWQgPSBmYWxzZTtcbn07XG5jb25zdCBpbml0Qm9hcmRTdWJzID0gKGJvYXJkKSA9PiB7XG4gIGNvbnN0IHNwYWNlQ2xpY2tlZFN1YiA9IChtc2csIGRhdGEpID0+IHtcbiAgICBpZiAoZGF0YVsyXSA9PT0gYm9hcmQuZ2V0Qm9hcmROdW1iZXIoKSkge1xuICAgICAgY29uc3QgeCA9IHBhcnNlSW50KGRhdGFbMF0pO1xuICAgICAgY29uc3QgeSA9IHBhcnNlSW50KGRhdGFbMV0pO1xuICAgICAgaWYgKGhhc0dhbWVTdGFydGVkKSB7XG4gICAgICAgIGNvbnN0IG5leHRCb2FyZCA9IGRhdGFbMl0gPT09IDEgPyAyIDogMTtcbiAgICAgICAgaWYgKGJvYXJkLnJlY2lldmVBdHRhY2soeCwgeSkpIHtcbiAgICAgICAgICByZW5kZXJTaGlwQXR0YWNrZWQoZGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGhhc0dhbWVTdGFydGVkKSB7XG4gICAgICAgICAgZGlzYWJsZUJvYXJkKG5leHRCb2FyZCk7XG4gICAgICAgICAgZW5hYmxlQm9hcmQoZGF0YVsyXSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGJvYXJkLmFyZUFsbFNoaXBTdW5rKCkpIHtcbiAgICAgICAgICBhbm5vdW5jZVdpbm5lcihkYXRhWzJdKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbW92ZVNoaXAoeCwgeSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IG1vdmVTaGlwID0gKHgsIHkpID0+IHtcbiAgICBsZXQgb3JpZ2luYWxTaGlwID0gbnVsbDtcbiAgICBjb25zdCBjdXJyZW50U3BhY2VJbmRleCA9IGJvYXJkLmdldEZpbGxlZFNwYWNlcygpLmZpbmRJbmRleCgoc3BhY2UpID0+IHtcbiAgICAgIGlmIChzcGFjZS5jb250YWluSW5YKHgpICYmIHNwYWNlLnlbMF0gPT09IHkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKGJvYXJkLmdldEZpbGxlZFNwYWNlcygpW2N1cnJlbnRTcGFjZUluZGV4XSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBvcmlnaW5hbFNoaXAgPSBib2FyZC5nZXRGaWxsZWRTcGFjZXMoKVtjdXJyZW50U3BhY2VJbmRleF07XG4gICAgICBpZiAobW92aW5nU3BhY2UgPT09IG51bGwpIHtcbiAgICAgICAgbW92aW5nU3BhY2UgPSBvcmlnaW5hbFNoaXA7XG4gICAgICAgIHJlbmRlclJlbW92ZWRTaGlwKFxuICAgICAgICAgIG9yaWdpbmFsU2hpcC54LFxuICAgICAgICAgIG9yaWdpbmFsU2hpcC55LFxuICAgICAgICAgIGJvYXJkLmdldEJvYXJkTnVtYmVyKClcbiAgICAgICAgKTtcbiAgICAgICAgYm9hcmQuZ2V0RmlsbGVkU3BhY2VzKCkuc3BsaWNlKGN1cnJlbnRTcGFjZUluZGV4LCAxKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJSRU1PVkVEIVwiKTtcbiAgICAgICAgY29uc29sZS5sb2coYm9hcmQuZ2V0RmlsbGVkU3BhY2VzKCkpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAobW92aW5nU3BhY2UgIT09IG51bGwpIHtcbiAgICAgICAgY29uc3Qgc3BhY2UgPSBtb3ZpbmdTcGFjZTtcbiAgICAgICAgY29uc3QgY29uZCA9IGJvYXJkLnBsYWNlU2hpcChzcGFjZS5zaGlwLCBbeCwgeV0pO1xuICAgICAgICBpZiAoY29uZCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiUFVUVEVEIElOXCIpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKGJvYXJkLmdldEZpbGxlZFNwYWNlcygpKTtcbiAgICAgICAgICBjb25zdCBmaWxsZWRTcGFjZXMgPSBib2FyZC5nZXRGaWxsZWRTcGFjZXMoKTtcbiAgICAgICAgICBjb25zdCBzcGFjZSA9IGZpbGxlZFNwYWNlc1tmaWxsZWRTcGFjZXMubGVuZ3RoIC0gMV07XG4gICAgICAgICAgcmVuZGVyUGxhY2VkU2hpcChzcGFjZS54LCBzcGFjZS55LCBib2FyZC5nZXRCb2FyZE51bWJlcigpKTtcbiAgICAgICAgICBtb3ZpbmdTcGFjZSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIGNvbnN0IHN0YXJ0R2FtZVN1YiA9IChtc2csIGRhdGEpID0+IHtcbiAgICBoYXNHYW1lU3RhcnRlZCA9IGRhdGE7XG4gIH07XG4gIFB1YlN1Yi5zdWJzY3JpYmUoXCJnYW1lLXN0YXJ0ZWRcIiwgc3RhcnRHYW1lU3ViKTtcbiAgUHViU3ViLnN1YnNjcmliZShcInNwYWNlLWNsaWNrZWRcIiwgc3BhY2VDbGlja2VkU3ViKTtcbiAgcmV0dXJuIGJvYXJkO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgaW5pdGlhbGl6ZUdhbWU7XG4iLCJjb25zdCBHYW1lYm9hcmQgPSAoYXJlYSwgYm9hcmROdW1iZXIpID0+IHtcbiAgaWYgKHR5cGVvZiBhcmVhICE9PSBcIm51bWJlclwiICYmIGFyZWEgIT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGNvbnN0IGZpbGxlZFNwYWNlcyA9IFtdO1xuICBjb25zdCBnZXRBcmVhID0gKCkgPT4ge1xuICAgIHJldHVybiBhcmVhO1xuICB9O1xuICAvL25vdCBkZWNsYXJlZCB0byBiZSBhIHB1cmUgZnVuY3Rpb25cbiAgY29uc3QgcGxhY2VTaGlwID0gKHNoaXAsIGNvb3JkaW5hdGUpID0+IHtcbiAgICBjb25zdCBzcGFjZSA9IHtcbiAgICAgIHNoaXA6IHNoaXAsXG4gICAgICB4OiBmaWxsWChzaGlwLmdldExlbmd0aCgpLCBjb29yZGluYXRlWzBdKSxcbiAgICAgIHk6IFtjb29yZGluYXRlWzFdXSxcbiAgICAgIGNvbnRhaW5Jblg6IGZ1bmN0aW9uICh4VmFsKSB7XG4gICAgICAgIGNvbnN0IGNvbmQgPSB0aGlzLnguZmluZCgoY3VyWCkgPT4ge1xuICAgICAgICAgIHJldHVybiBjdXJYID09PSB4VmFsO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGNvbmQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0sXG4gICAgfTtcbiAgICBpZiAoaXNTcGFjZUF2YWlsYWJsZShzcGFjZS54LCBzcGFjZS55KSkge1xuICAgICAgZmlsbGVkU3BhY2VzLnB1c2goc3BhY2UpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH07XG4gIGNvbnN0IGlzU3BhY2VBdmFpbGFibGUgPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgIGNvbnN0IHNwYWNlQXZhaWxhYmxlID0gW107XG4gICAgY29uc3QgYXJlYSA9IGdldEFyZWEoKTtcbiAgICAvL0ZpcnN0IHNwYWNlXG4gICAgaWYgKGZpbGxlZFNwYWNlcy5sZW5ndGggPT09IDAgJiYgeFt4Lmxlbmd0aCAtIDFdIDwgZ2V0QXJlYSgpICYmIHkgPCBhcmVhKSB7XG4gICAgICBzcGFjZUF2YWlsYWJsZS5wdXNoKHRydWUpO1xuICAgICAgcmV0dXJuIHNwYWNlQXZhaWxhYmxlWzBdO1xuICAgIH1cblxuICAgIC8vbiBudW1iZXIgc3BhY2VzXG4gICAgZmlsbGVkU3BhY2VzLmZvckVhY2goKGZpbGxlZFNwYWNlKSA9PiB7XG4gICAgICBpZiAoZmlsbGVkU3BhY2UueVswXSA9PT0geVswXSkge1xuICAgICAgICBjb25zdCBtYXRjaGVzID0gZmlsbGVkU3BhY2UueC5maWx0ZXIoKHhWYWwpID0+IHtcbiAgICAgICAgICBpZiAoeC5pbmRleE9mKHhWYWwpICE9PSAtMSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgbWF0Y2hlczIgPSB4LmZpbHRlcigoeFZhbCkgPT4ge1xuICAgICAgICAgIGlmIChmaWxsZWRTcGFjZS54LmluZGV4T2YoeFZhbCkgIT09IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAobWF0Y2hlczIubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHNwYWNlQXZhaWxhYmxlLnB1c2goZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHhbeC5sZW5ndGggLSAxXSA8IGdldEFyZWEoKSAmJiB5WzBdIDwgYXJlYSkge1xuICAgICAgICBzcGFjZUF2YWlsYWJsZS5wdXNoKHRydWUpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKHNwYWNlQXZhaWxhYmxlLmluZGV4T2YoZmFsc2UpID09PSAtMSAmJiBzcGFjZUF2YWlsYWJsZS5sZW5ndGggIT09IDApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG4gIGNvbnN0IGZpbGxYID0gZnVuY3Rpb24gKGxlbmd0aCwgc3RhcnQpIHtcbiAgICBjb25zdCB4VmFscyA9IFtdO1xuICAgIGxldCBpID0gMDtcbiAgICB3aGlsZSAoaSA8IGxlbmd0aCkge1xuICAgICAgeFZhbHMucHVzaChzdGFydCArIGkpO1xuICAgICAgaSArPSAxO1xuICAgIH1cbiAgICByZXR1cm4geFZhbHM7XG4gIH07XG4gIGNvbnN0IGdldEZpbGxlZFNwYWNlcyA9ICgpID0+IHtcbiAgICByZXR1cm4gZmlsbGVkU3BhY2VzO1xuICB9O1xuICBjb25zdCByZWNpZXZlQXR0YWNrID0gKHgsIHkpID0+IHtcbiAgICAvL0F0dGFjayBub3QgbWlzc2VkXG4gICAgY29uc3QgYXR0YWNrU3BhY2UgPSBmaWxsZWRTcGFjZXMuZmluZCgoc3BhY2UpID0+IHtcbiAgICAgIGlmIChzcGFjZS55WzBdID09PSB5KSB7XG4gICAgICAgIGNvbnN0IHhWYWwgPSBzcGFjZS54LmZpbmQoKHhWYWwsIGluZGV4KSA9PiB7XG4gICAgICAgICAgaWYgKHhWYWwgPT09IHgpIHtcbiAgICAgICAgICAgIHNwYWNlLnhbaW5kZXhdID0gbnVsbDtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGlmICh4VmFsID4gLTEpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIGlmIChhdHRhY2tTcGFjZSkge1xuICAgICAgYXR0YWNrU3BhY2Uuc2hpcC5oaXQoKTtcbiAgICAgIHJldHVybiBhdHRhY2tTcGFjZS5zaGlwO1xuICAgIH1cbiAgfTtcbiAgY29uc3QgZ2V0Qm9hcmROdW1iZXIgPSAoKSA9PiB7XG4gICAgcmV0dXJuIGJvYXJkTnVtYmVyO1xuICB9O1xuICBjb25zdCBhcmVBbGxTaGlwU3VuayA9ICgpID0+IHtcbiAgICBjb25zdCBsYXN0U2hpcEFsaXZlID0gZmlsbGVkU3BhY2VzLmZpbmQoKHNwYWNlKSA9PiB7XG4gICAgICByZXR1cm4gIXNwYWNlLnNoaXAuaXNTdW5rKCk7XG4gICAgfSk7XG4gICAgaWYgKGxhc3RTaGlwQWxpdmUpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG4gIHJldHVybiB7XG4gICAgcGxhY2VTaGlwLFxuICAgIGdldEZpbGxlZFNwYWNlcyxcbiAgICByZWNpZXZlQXR0YWNrLFxuICAgIGFyZUFsbFNoaXBTdW5rLFxuICAgIGdldEFyZWEsXG4gICAgaXNTcGFjZUF2YWlsYWJsZSxcbiAgICBnZXRCb2FyZE51bWJlcixcbiAgfTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IEdhbWVib2FyZDtcbiIsImNvbnN0IEh1bWFuID0gKCkgPT4ge1xuICBjb25zdCBhdHRhY2sgPSAoeCwgeSwgYm9hcmQpID0+IHtcbiAgICBib2FyZC5yZWNpZXZlQXR0YWNrKHgsIHkpO1xuICB9O1xufTtcblxuY29uc3QgQ29tcHV0ZXIgPSAoKSA9PiB7XG4gIGNvbnN0IHNlbGVjdGVkVmFsdWVzID0ge307XG4gIGNvbnN0IGF0dGFjayA9IChib2FyZCkgPT4ge1xuICAgIGNvbnN0IGJvYXJkU2l6ZSA9IGJvYXJkLmdldEFyZWEoKTtcbiAgICBpZiAoaGFzU3BhY2UoYm9hcmRTaXplKSkge1xuICAgICAgbGV0IHggPSBnZXRSYW5kb21WYWx1ZShib2FyZFNpemUgLSAxKTtcbiAgICAgIGxldCB5ID0gZ2V0UmFuZG9tVmFsdWUoYm9hcmRTaXplIC0gMSk7XG4gICAgICB3aGlsZSAoXG4gICAgICAgIHNlbGVjdGVkVmFsdWVzW3ldICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgc2VsZWN0ZWRWYWx1ZXNbeV0ubGVuZ3RoID09PSBib2FyZFNpemVcbiAgICAgICkge1xuICAgICAgICB5ID0gZ2V0UmFuZG9tVmFsdWUoYm9hcmRTaXplIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc2VsZWN0ZWRWYWx1ZXNbeV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBsZXQgcmVzdWx0ID0gc2VsZWN0ZWRWYWx1ZXNbeV0uZmluZCgoeFZhbCkgPT4geFZhbCA9PT0geCk7XG4gICAgICAgIHdoaWxlIChyZXN1bHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHggPSBnZXRSYW5kb21WYWx1ZShib2FyZFNpemUgLSAxKTtcbiAgICAgICAgICByZXN1bHQgPSBzZWxlY3RlZFZhbHVlc1t5XS5maW5kKCh4VmFsKSA9PiB4VmFsID09PSB4KTtcbiAgICAgICAgfVxuICAgICAgICBzZWxlY3RlZFZhbHVlc1t5XS5wdXNoKHgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2VsZWN0ZWRWYWx1ZXNbeV0gPSBbeF07XG4gICAgICB9XG4gICAgICByZXR1cm4gW3gsIHldO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfTtcbiAgY29uc3QgZ2V0UmFuZG9tVmFsdWUgPSAobWF4KSA9PiB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIG1heCk7XG4gIH07XG4gIGNvbnN0IGhhc1NwYWNlID0gKGJvYXJkU2l6ZSkgPT4ge1xuICAgIGxldCB2YWwgPSBmYWxzZTtcbiAgICBpZiAoT2JqZWN0LmtleXMoc2VsZWN0ZWRWYWx1ZXMpLmxlbmd0aCA8IGJvYXJkU2l6ZSkge1xuICAgICAgdmFsID0gdHJ1ZTtcbiAgICAgIHJldHVybiB2YWw7XG4gICAgfVxuICAgIGZvciAoY29uc3QgcHJvcGVydHkgaW4gc2VsZWN0ZWRWYWx1ZXMpIHtcbiAgICAgIGlmIChzZWxlY3RlZFZhbHVlc1twcm9wZXJ0eV0ubGVuZ3RoIDwgYm9hcmRTaXplKSB7XG4gICAgICAgIHZhbCA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB2YWw7XG4gIH07XG4gIHJldHVybiB7IGF0dGFjayB9O1xufTtcbmV4cG9ydCB7IEh1bWFuLCBDb21wdXRlciB9O1xuIiwiY29uc3QgU2hpcCA9IChzaGlwTGVuZ3RoKSA9PiB7XG4gIGxldCBsZW5ndGggPSBzaGlwTGVuZ3RoO1xuICBsZXQgaGl0cyA9IDA7XG5cbiAgY29uc3QgaGl0ID0gKCkgPT4ge1xuICAgIGhpdHMgKz0gMTtcbiAgfTtcblxuICBjb25zdCBnZXRIaXRzID0gKCkgPT4ge1xuICAgIHJldHVybiBoaXRzO1xuICB9O1xuICBjb25zdCBnZXRMZW5ndGggPSAoKSA9PiB7XG4gICAgcmV0dXJuIGxlbmd0aDtcbiAgfTtcblxuICBjb25zdCBpc1N1bmsgPSAoKSA9PiB7XG4gICAgY29uc29sZS5sb2coaGl0cyk7XG4gICAgaWYgKGhpdHMgPT09IGxlbmd0aCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcbiAgcmV0dXJuIHtcbiAgICBnZXRMZW5ndGgsXG4gICAgZ2V0SGl0cyxcbiAgICBoaXQsXG4gICAgaXNTdW5rLFxuICB9O1xufTtcblxuZXhwb3J0IGRlZmF1bHQgU2hpcDtcbiIsImltcG9ydCBQdWJTdWIgZnJvbSBcInB1YnN1Yi1qc1wiO1xubGV0IGhhc0dhbWVTdGFydGVkID0gZmFsc2U7XG5cbmNvbnN0IHN0YXJ0QnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5zdGFydC1idXR0b25cIik7XG5cbnN0YXJ0QnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gIGlmICghaGFzR2FtZVN0YXJ0ZWQpIHtcbiAgICBjb25zb2xlLmxvZyhcIkdBTUUgU1RBUlRFRFwiKTtcbiAgICBoYXNHYW1lU3RhcnRlZCA9IHRydWU7XG4gICAgUHViU3ViLnB1Ymxpc2goXCJnYW1lLXN0YXJ0ZWRcIiwgdHJ1ZSk7XG4gICAgZW5hYmxlQm9hcmQoMik7XG4gICAgZGlzYWJsZUJvYXJkKDEpO1xuICB9XG59KTtcbmNvbnN0IGdlbmVyYXRlQm9hcmRVSSA9IChib2FyZCkgPT4ge1xuICBjb25zdCByb3cgPSBib2FyZC5nZXRBcmVhKCk7XG4gIGNvbnN0IGNvbHVtbiA9IGJvYXJkLmdldEFyZWEoKTtcbiAgY29uc3QgYXJlYSA9IHJvdyAqIGNvbHVtbjtcbiAgbGV0IGkgPSAwO1xuICBjb25zdCBib2FyZERpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGJvYXJkRGl2LnNldEF0dHJpYnV0ZShcImJvYXJkLW51bWJlclwiLCBib2FyZC5nZXRCb2FyZE51bWJlcigpKTtcbiAgYm9hcmREaXYuY2xhc3NMaXN0LmFkZChcImJvYXJkXCIpO1xuICBib2FyZERpdi5zdHlsZS5ncmlkVGVtcGxhdGVDb2x1bW5zID0gYHJlcGVhdCgke2NvbHVtbn0sIDFmcilgO1xuICBib2FyZERpdi5zdHlsZS5ncmlkVGVtcGxhdGVSb3dzID0gYHJlcGVhdCgke3Jvd30sIDFmcilgO1xuICBsZXQgeSA9IDA7XG4gIGxldCB4ID0gMDtcbiAgd2hpbGUgKGkgPCBhcmVhKSB7XG4gICAgY29uc3QgcGl4ZWwgPSBkcmF3UGl4ZWwoY29sdW1uLCBib2FyZC5nZXRCb2FyZE51bWJlcigpKTtcbiAgICBib2FyZERpdi5hcHBlbmRDaGlsZChwaXhlbCk7XG4gICAgaWYgKHggPT09IGNvbHVtbikge1xuICAgICAgeSArPSAxO1xuICAgICAgeCA9IDA7XG4gICAgfVxuICAgIHBpeGVsLnNldEF0dHJpYnV0ZShcInhcIiwgeCk7XG4gICAgcGl4ZWwuc2V0QXR0cmlidXRlKFwieVwiLCB5KTtcbiAgICB4ICs9IDE7XG4gICAgaSArPSAxO1xuICB9XG4gIHJldHVybiBib2FyZERpdjtcbn07XG5jb25zdCBnZXRDb29yZGluYXRlcyA9IChwaXhlbCkgPT4ge1xuICBjb25zdCB4ID0gcGl4ZWwuZ2V0QXR0cmlidXRlKFwieFwiKTtcbiAgY29uc3QgeSA9IHBpeGVsLmdldEF0dHJpYnV0ZShcInlcIik7XG4gIHJldHVybiBbeCwgeV07XG59O1xuY29uc3QgZHJhd1BpeGVsID0gKGNvbHVtbiwgYm9hcmROdW1iZXIpID0+IHtcbiAgY29uc3QgcGl4ZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBwaXhlbC5jbGFzc0xpc3QuYWRkKFwicGl4ZWxcIik7XG4gIHBpeGVsLnN0eWxlLmhlaWdodCA9IGBjYWxjKDYwdmgvJHtjb2x1bW59KWA7XG4gIHBpeGVsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgUHViU3ViLnB1Ymxpc2goXCJzcGFjZS1jbGlja2VkXCIsIFsuLi5nZXRDb29yZGluYXRlcyhwaXhlbCksIGJvYXJkTnVtYmVyXSk7XG4gICAgaWYgKGhhc0dhbWVTdGFydGVkKSB7XG4gICAgICBwaXhlbC5jbGFzc0xpc3QucmVtb3ZlKFwic2hpcC1sb2NhdGVkXCIpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBwaXhlbDtcbn07XG5cbmNvbnN0IHJlbmRlclNoaXBBdHRhY2tlZCA9IChkYXRhKSA9PiB7XG4gIGNvbnN0IHBpeGVsID0gZG9jdW1lbnRcbiAgICAucXVlcnlTZWxlY3RvcihgW2JvYXJkLW51bWJlcj1cIiR7ZGF0YVsyXX1cIl1gKVxuICAgIC5xdWVyeVNlbGVjdG9yKGBbeD1cIiR7ZGF0YVswXX1cIl1beT1cIiR7ZGF0YVsxXX1cIl1gKTtcbiAgcGl4ZWwuY2xhc3NMaXN0LmFkZChcInNoaXAtYXR0YWNrZWRcIik7XG59O1xuY29uc3QgZGlzYWJsZVBpeGVsID0gKG1zZywgZGF0YSkgPT4ge1xuICBpZiAoaGFzR2FtZVN0YXJ0ZWQpIHtcbiAgICBjb25zdCBwaXhlbCA9IGRvY3VtZW50XG4gICAgICAucXVlcnlTZWxlY3RvcihgW2JvYXJkLW51bWJlcj1cIiR7ZGF0YVsyXX1cIl1gKVxuICAgICAgLnF1ZXJ5U2VsZWN0b3IoYFt4PVwiJHtkYXRhWzBdfVwiXVt5PVwiJHtkYXRhWzFdfVwiXWApO1xuICAgIHBpeGVsLmlubmVyVGV4dCA9IFwiWFwiO1xuICAgIHBpeGVsLmNsYXNzTGlzdC5hZGQoXCJpbmFjdGl2ZS1waXhlbFwiKTtcbiAgfVxufTtcblxuUHViU3ViLnN1YnNjcmliZShcInNwYWNlLWNsaWNrZWRcIiwgZGlzYWJsZVBpeGVsKTtcblxuY29uc3QgZGlzYWJsZUJvYXJkID0gKGFjdGl2ZUJvYXJkTnVtYmVyKSA9PiB7XG4gIGNvbnNvbGUubG9nKFwiVEFOR0lOQSFcIik7XG4gIGNvbnN0IGFjdGl2ZUJvYXJkID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcbiAgICBgW2JvYXJkLW51bWJlcj1cIiR7YWN0aXZlQm9hcmROdW1iZXJ9XCJdYFxuICApO1xuICBhY3RpdmVCb2FyZC5jbGFzc0xpc3QuYWRkKFwiaW5hY3RpdmUtYm9hcmRcIik7XG59O1xuXG5jb25zdCBlbmFibGVCb2FyZCA9IChpbmFjdGl2ZUJvYXJkTnVtYmVyKSA9PiB7XG4gIGNvbnN0IGFjdGl2ZUJvYXJkID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcbiAgICBgW2JvYXJkLW51bWJlcj1cIiR7aW5hY3RpdmVCb2FyZE51bWJlcn1cIl1gXG4gICk7XG4gIGFjdGl2ZUJvYXJkLmNsYXNzTGlzdC5yZW1vdmUoXCJpbmFjdGl2ZS1ib2FyZFwiKTtcbn07XG5jb25zdCByZW5kZXJQbGFjZWRTaGlwID0gKHhMaXN0LCB5TGlzdCwgYm9hcmROdW1iZXIpID0+IHtcbiAgeExpc3QuZm9yRWFjaCgoeFZhbCkgPT4ge1xuICAgIGRvY3VtZW50XG4gICAgICAucXVlcnlTZWxlY3RvcihgW2JvYXJkLW51bWJlcj1cIiR7Ym9hcmROdW1iZXJ9XCJdYClcbiAgICAgIC5xdWVyeVNlbGVjdG9yKGBbeD1cIiR7eFZhbH1cIl1beT1cIiR7eUxpc3RbMF19XCJdYClcbiAgICAgIC5jbGFzc0xpc3QuYWRkKFwic2hpcC1sb2NhdGVkXCIpO1xuICB9KTtcbn07XG5jb25zdCByZW5kZXJSZW1vdmVkU2hpcCA9ICh4TGlzdCwgeUxpc3QsIGJvYXJkTnVtYmVyKSA9PiB7XG4gIGNvbnNvbGUubG9nKFwiQk9BUkROVU1CRVI6IFwiLCBib2FyZE51bWJlcik7XG4gIHhMaXN0LmZvckVhY2goKHhWYWwpID0+IHtcbiAgICBkb2N1bWVudFxuICAgICAgLnF1ZXJ5U2VsZWN0b3IoYFtib2FyZC1udW1iZXI9XCIke2JvYXJkTnVtYmVyfVwiXWApXG4gICAgICAucXVlcnlTZWxlY3RvcihgW3g9XCIke3hWYWx9XCJdW3k9XCIke3lMaXN0WzBdfVwiXWApXG4gICAgICAuY2xhc3NMaXN0LnJlbW92ZShcInNoaXAtbG9jYXRlZFwiKTtcbiAgfSk7XG59O1xuY29uc3QgcGxhY2VTaGlwVG9SYW5kb21Mb2NhdGlvbiA9IChib2FyZCwgc2hpcCwgbWF4TnVtYmVyLCBzaG91bGRSZW5kZXIpID0+IHtcbiAgbGV0IHggPSBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiBtYXhOdW1iZXIpO1xuICBsZXQgeSA9IE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIG1heE51bWJlcik7XG4gIHdoaWxlICh0cnVlKSB7XG4gICAgeCA9IE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIG1heE51bWJlcik7XG4gICAgeSA9IE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIG1heE51bWJlcik7XG4gICAgaWYgKGJvYXJkLnBsYWNlU2hpcChzaGlwLCBbeCwgeV0pKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBib2FyZC5wbGFjZVNoaXAoc2hpcCwgWzEyLCAwXSk7XG4gIGNvbnN0IHNwYWNlID0gYm9hcmQuZ2V0RmlsbGVkU3BhY2VzKClbYm9hcmQuZ2V0RmlsbGVkU3BhY2VzKCkubGVuZ3RoIC0gMV07XG4gIGNvbnNvbGUubG9nKFwiQk9BUkROVU1CRVI6IFwiLCBib2FyZC5nZXRCb2FyZE51bWJlcigpKTtcbiAgaWYgKHNob3VsZFJlbmRlcikge1xuICAgIHJlbmRlclBsYWNlZFNoaXAoc3BhY2UueCwgc3BhY2UueSwgYm9hcmQuZ2V0Qm9hcmROdW1iZXIoKSk7XG4gIH1cbn07XG5jb25zdCByZW5kZXJXaW5uZXIgPSAocGxheWVyTnVtYmVyKSA9PiB7XG4gIGNvbnN0IHdpbm5lclVJID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi53aW5uZXJcIik7XG4gIHdpbm5lclVJLmlubmVyVGV4dCA9IGBXaW5uZXIhOiAke3BsYXllck51bWJlcn1gO1xuICByZXR1cm4gd2lubmVyVUk7XG59O1xuZXhwb3J0IHtcbiAgZ2VuZXJhdGVCb2FyZFVJLFxuICBwbGFjZVNoaXBUb1JhbmRvbUxvY2F0aW9uLFxuICByZW5kZXJQbGFjZWRTaGlwLFxuICByZW5kZXJSZW1vdmVkU2hpcCxcbiAgZW5hYmxlQm9hcmQsXG4gIGRpc2FibGVCb2FyZCxcbiAgZGlzYWJsZVBpeGVsLFxuICByZW5kZXJTaGlwQXR0YWNrZWQsXG4gIHJlbmRlcldpbm5lcixcbn07XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdGlkOiBtb2R1bGVJZCxcblx0XHRsb2FkZWQ6IGZhbHNlLFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcblx0bW9kdWxlLmxvYWRlZCA9IHRydWU7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuX193ZWJwYWNrX3JlcXVpcmVfXy5uID0gKG1vZHVsZSkgPT4ge1xuXHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cblx0XHQoKSA9PiAobW9kdWxlWydkZWZhdWx0J10pIDpcblx0XHQoKSA9PiAobW9kdWxlKTtcblx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgeyBhOiBnZXR0ZXIgfSk7XG5cdHJldHVybiBnZXR0ZXI7XG59OyIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm5tZCA9IChtb2R1bGUpID0+IHtcblx0bW9kdWxlLnBhdGhzID0gW107XG5cdGlmICghbW9kdWxlLmNoaWxkcmVuKSBtb2R1bGUuY2hpbGRyZW4gPSBbXTtcblx0cmV0dXJuIG1vZHVsZTtcbn07IiwiaW1wb3J0IGluaXRpYWxpemVHYW1lIGZyb20gXCIuL21vZHVsZXMvR2FtZS5qc1wiO1xuXG5pbml0aWFsaXplR2FtZSgpO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9