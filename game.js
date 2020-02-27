//Imports -- All objects from the game
import { Player } from "./objects/player.js";
import { Monster } from "./objects/monster.js";


//ROT.RNG.setSeed();
// Game object which has two functions (init, getDisplay), init creates a display, getDisplay is called to return said display

export const Game = {
  display: null,
  level: 1,
  textDisplay: null,
  scheduler: null,
  notifications: [],
  invSlots: ["a", "b", "c", "e", "f", "g", "h", "i", "j", "k"],
  digger: null,
  mapGen: null, //used for map generation
  map: {},
  fov: null,
  enemyChar: ["k", "d", "t", "g"],
  enemys: [],
  freeSpace: [],
  items: [ //Starting items pool, things you can randomly spawn with
    { name: "Short Sword", dmg: 2, equipped: false }, // All items are like this, if item is equipped:true, we calc damage for it
    { name: "worn leather leggings", armor: 2, equipped: false, slot: "legs" },
    { name: "worn leather chestpiece", armor: 3, equipped: false, slot: "chest" },
    { name: "worn leather helm", armor: 1, equipped: false, slot: "head" },
    { name: "hand-me-down Mace", dmg: 2, equipped: false, slot: "hand" },
    { name: "broken training Sword", dmg: 1, equipped: false, slot: "hand" },
  ],
  loot: [ //Loot to be dropped by mobs or found in chests
    { name: "golden crown", armor: 2, equipped: false, slot: "head" },
    { name: "leather leggings", armor: 4, equipped: false, slot: "legs" },
    { name: "long sword", dmg: 4, equipped: false, slot: "hand" },
    { name: "leather chestpiece", armor: 5, equipped: false, slot: "chest" },
    { name: "leather helm", armor: 4, equipped: false, slot: "head" },
    { name: "steel chestpiece", armor: 8, equipped: false, slot: "chest" },
    { name: "steel leggings", armor: 6, equipped: false, slot: "legs" },
    { name: "steel mace", dmg: 3, equipped: false, slot: "hand" },
    { name: "emerald ring", armor: 1, equipped: false, slot: "finger" },


  ],
  rooms: null,
  room: null,
  engine: null,
  roomDebug: [],
  //End of variable declaration

  init: function () {
    this.display = new ROT.Display({ fontSize: 18 });
    this.textDisplay = new ROT.Display({ width: 35, height: 20 }); //Dedicated display specifically for text notifications in-game
    this.fov = new ROT.FOV.PreciseShadowcasting(Game.shadowCast);
    this.scheduler = new ROT.Scheduler.Simple();
    this.engine = new ROT.Engine(this.scheduler);
    document.getElementById("gameContainer").appendChild(Game.getDisplay().getContainer()); //Push display to the body of the page
    document.getElementById("gameContainer").appendChild(Game.textDisplay.getContainer());
    levelSpawn();
    Game.createMap();
    Game.spawnEnemies();
    Game.scheduler.add(player, true)
    for (let i = 0; i < Game.enemys.length; i++) {
      Game.scheduler.add(Game.enemys[i], true);
    }
    this.engine.start();
  },//END OF DISPLAY GENERATION



  getDisplay: function () {
    return this.display;
  }, //END OF DISPLAY RETURN FUNCTION



  createMap: function () {
    // debugger;
    //Generate a map for use in this specific dungeon
    this.digger = new ROT.Map.Digger(); //Width x Height

    //Digger callback function
    let diggerCallback = function (x, y, value) {
      if (value) { return; } //Not storing walls?

      let key = x + "," + y;
      Game.freeSpace.push(key);
      this.map[key] = ".";
    }

    this.digger.create(diggerCallback.bind(this));

    //Draw entire map from players point of view
    Game.drawWholeMap();
    Game.drawRooms();
  }, //END OF MAP CREATION



  spawnEnemies: () => { //Random function for generating some enemies
    for (let i = 0; i < Game.enemys.length; i++) {
      console.log("ENEMY ARRAY ", Game.enemys);
      let spawnRoom = Game.rooms[Math.floor(Math.random() * Math.floor(Game.rooms.length))];
      Game.enemys[i].x = spawnRoom.getCenter()[0];
      Game.enemys[i].y = spawnRoom.getCenter()[1];
    }
    Game.spawnLoot();
    Game.spawnStairs();

  }, //END OF Mob spawn logic

  spawnLoot: () => {
    let spawnRoom = Game.rooms[Math.floor(Math.random() * Game.rooms.length)];

    for (let i = 0; i < Game.level * 1.25; i++) {
      let rndx = Math.floor(Math.random() * spawnRoom._x2);
      let rndy = Math.floor(Math.random() * spawnRoom._y2);

      while (rndx < spawnRoom.x1 && rndx > spawnRoom.x2 - 1) {
        rndx = Math.floor(Math.random() * spawnRoom._x2);
      }

      while (rndy < spawnRoom.y1 && rndy > spawnRoom.y2 - 1) {
        rndy = Math.floor(Math.random() * spawnRoom._y2);
      }

      let pos = rndx + "," + rndy;
      Game.map[pos] = "*";


      console.log("ROOMS ARE LIKE SO ", Game.rooms);
    }
  },


  spawnStairs: () => {
    let spawnRoom = Game.rooms[Math.floor(Math.random() * Game.rooms.length)];
    let pos = spawnRoom.getCenter()[0] + "," + spawnRoom.getCenter()[1];

    Game.map[pos] = ">";
    console.log("STAIRS AT ", pos);
    Game.createSpawn();
  }, //End of stair spawning logic



  drawWholeMap: function () {
    Game.display.clear(); //Simulates actual FOV by clearing any non-seen tiles, this can be removed
    Game.fov.compute(player.x, player.y, 10, function (x, y, r, visibility) { //Draw only what is visable

      let pos = x + "," + y;
      let ch = (Game.map[pos]);

      //If the key shows up in enemies
      let bgColor = (Game.map[pos] ? "#d3d3d3" : "#2b2d2f");
      let fgColor = "#FFF" //Set basic fg color to white

      switch (Game.map[pos]) {
        case ">":
          fgColor = "#585858";//Is it stairs? Draw as grey, etc
          break;
        case "*":
          fgColor = "#FF0"
          break;

        case "%":
          fgColor = "#FFF";
          bgColor = "#F00";
          break;

        case ",":
          fgColor = "#F00";
          bgColor = "#d3d3d3";
          break;
      }

      Game.display.draw(x, y, ch, fgColor, bgColor);

      for (let i = 0; i < Game.enemys.length; i++) {
        if (x == Game.enemys[i].x && y == Game.enemys[i].y) {
          console.log("WE SEE THE ENEMY, ")
          Game.display.draw(Game.enemys[i].x, Game.enemys[i].y, Game.enemys[i].sprite, Game.enemys[i].color, bgColor);
        }
      }

    });

    Game.display.draw(player.x, player.y, player.sprite, "#ff0", ""); //Draw player
  }, // END OF MAP GEN


  drawDoor: function (x, y) {
    Game.display.draw(x, y, "+", "red", "");
  }, //END OF DRAW DOORS FUNCTION


  drawRooms: function () { //Function is pretty clear, we're drawing rooms themselves here, and printing to console the room positions
    this.rooms = Game.digger.getRooms();
    for (let i = 0; i < this.rooms.length; i++) {
      this.room = this.rooms[i];
      //this.room.getDoors(this.drawDoor);
    }
  }, //END OF DRAWROOMS FUNCTION



  createSpawn: function () {
    let spawnRoom = this.rooms[Math.floor(Math.random() * Math.floor(this.rooms.length))];
    console.log("Here is where your player will spawn ", spawnRoom.getCenter());
    player.x = spawnRoom.getCenter()[0]; //First value returned
    player.y = spawnRoom.getCenter()[1]; //Second value returned

    console.log("Player position: ", player.x, player.y);
    Game.drawWholeMap();
  }, //END OF SPAWN CREATION


  //We need to rename this to drawInventory, as well as clean up some of the conditionals and the name of the input variables
  informPlayer: (text) => {
    Game.textDisplay.clear(); //Clear the information screen

    if (Array.isArray(text)) { //If the item passed in is an array, it's the players inventory
      Game.textDisplay.drawText(0, 0, "Your Inventory ");
      for (let i = 0; i < text.length; i++) {
        let item = text[i];


        let string = String.fromCharCode(97 + i) + ") " + item.name; //using fromCharCode we catagorize each slot as a letter
        if (item.equipped) {
          string += "%b{green} e";
        }
        Game.textDisplay.drawText(0, i + 1, string);
      }
      Game.textDisplay.drawText(0, player.inventory.length + 3, "Press e key to equip or unequip or d to drop");
      Game.drawStatus();

      //Otherwise, print string as normal
    } else {
      Game.textDisplay.drawText(0, 0, text);
    }
  }, //END of inventory system


  shadowCast: (x, y) => { //Function for use in FOV computations
    let pos = x + "," + y;
    switch (Game.map[pos]) {
      case ".":
        return true;

      case ">":
        return true;

      case "*":
        return true;

      case "%":
        return true;

      case ",":
        return true;

      case "]":
        return true;

      default:
        return false;
    }
  },


  //New and improved messaging function. The idea here is to read off a continual list of information strings. 
  //We will read an array of strings, for each item we will increase Y draw by 1 so that it continues down the screen
  // If we expand Y to the maximum screendepth of displayText.options.height - 1, clear all the notifications but the last
  //We will also have the status of the player drawn in a seperate function
  notify: (text) => {
    Game.textDisplay.clear();
    //Loop through notifications
    for (let i = 0; i < text.length; i++) {
      //Display each notification with increasing y
      Game.textDisplay.drawText(0, i, text[i]);
      if (i == Game.textDisplay._options.height - 2) {
        Game.notifications.splice(0, Game.notifications.length - 1);
      }
    }
    Game.drawStatus();
  },

  //Display health and other info for the player
  drawStatus: () => {
    Game.textDisplay.drawText(0, Game.textDisplay._options.height - 1, "Health: %c{green}" + player.health + "%c{white} Damage: %c{red}" + player.dmg + "%c{white} Armor: %c{yellow}" + player.armor);
  },


  //Used between levels to fully reset screens/map data. Will need to be changed once we start saving levels
  resetGame: () => {
    Game.map = {};
    Game.enemys.splice(0, Game.enemys.length);
    Game.engine = null;
    Game.scheduler.clear();
    Game.display.clear();
    let page = document.getElementById("gameContainer");
    page.innerHTML = "";

    Game.init();
  }



} // END OF GAME OBJECT ITSELF


//First-run initialization, create player, add a starter item to his inventory, set it to 'equipped'


// Create player object, give him starting items, set the starting items to 'equipped' and add their values to our own
var player = new Player(0, 0, '\u263A', [Game.items[Math.floor(Math.random() * Game.items.length)]], Game.enemys);
//Set initial inventory
for (let i = 0; i < player.inventory.length; i++) {
  player.inventory[i].equipped = true;
  if (player.inventory[i].dmg) {
    player.dmg += player.inventory[i].dmg;
  }
  if (player.inventory[i].armor) {
    player.armor += player.inventory[i].armor;
  }
}



function levelSpawn() { //TODO: Expand this function into a much more robust version that can spawn more enemies 
  let spawnAmount = Math.floor(Math.random() * Game.level + 1);
  let en = [1, 2, 3];
  for (let i = 0; i < spawnAmount; i++) {
    //Spawn enemies
    Game.enemys.push(new Monster(en[Math.floor(Math.random() * en.length)], 0, 0, player));
  }
}


//The logic of game start sequence
//Game.init() => Game.createMap();
//Game.createMap() => Game.drawWholeMap();
//DrawWholeMap() => DrawRooms()
//This.drawRooms()
//this.levelSpawn() => this.spawnEnemies()
//this.spawnEnemies() => this.spawnStairs();
//this.spawnStairs => this.createSpawn();

//Initialize game

Game.init(); //Create display
player.draw();
Game.drawStatus();
console.log("ENTIRE GAME ENTITY ", Game.map);








