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
  loot: [ //Loot to be dropped by mobs or found in chests => First 20 are local/any drops, some specific items are reserved for bosses.
    { name: "golden crown", armor: 2, equipped: false, slot: "head" },
    { name: "leather leggings", armor: 4, equipped: false, slot: "legs" },
    { name: "long sword", dmg: 4, equipped: false, slot: "hand" },
    { name: "leather chestpiece", armor: 5, equipped: false, slot: "chest" },
    { name: "leather helm", armor: 4, equipped: false, slot: "head" },
    { name: "steel chestpiece", armor: 8, equipped: false, slot: "chest" },
    { name: "steel leggings", armor: 6, equipped: false, slot: "legs" },
    { name: "steel mace", dmg: 3, equipped: false, slot: "hand" },
    { name: "emerald ring", armor: 1, equipped: false, slot: "finger" },
    { name: "jade ring", armor: 1, equipped: false, slot: "finger" },
    { name: "claymore sword", dmg: 6, equipped: false, slot: "hand"},


  ],
  rooms: null,
  room: null,
  engine: null,
  roomDebug: [],
  tileSet: null,
  //End of variable declaration


  init: function () {
    this.tileSet = document.createElement("img");
    this.tileSet.src = "tileset.png";
    console.log(`This is our tileset: ${this.tileSet}`);

    this.display = new ROT.Display({width: 20, height: 14, layout: "tile", tileWidth: 32, tileHeight: 32, tileSet: this.tileSet, tileMap: {
      "@": [640, 1952], //player char


      "8": [320, 128], //Simple wall
      "9": [384, 128], //Simple wall
      "10": [512, 128], //Simple wall
      "11": [576, 128], //Simple wall



      "*": [192, 2], //Chest?

      "1": [64, 128], //Floor 2
      "2": [96, 128], //floor 3
      "3": [128, 128], //floor 4
      "4": [160, 128], //floor 5
      "5": [192, 128], //floor 6
      "6": [224, 128], //floor 7
      "7": [256, 128], //floor 8

      "k": [32, 1984], //Kobold
      "w": [288, 2464], //Witch
      "g": [640, 1920], //goblin
      ">": [1184, 320], //Stairs
      "%": [256, 1280], //skeletal corpse

      ",": [544, 1632], //Blood1


    }});

    this.textDisplay = new ROT.Display({ width: 35, height: 29.9 }); //Dedicated display specifically for text notifications in-game
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
      if (value) {
        let key = x + "," + y;
        let tile = Math.floor(Math.random() * (11 - 8)) +8;
        this.map[key] = {tile: tile, entities: [], };
        return;
      } //Not storing walls?

      let key = x + "," + y;
      Game.freeSpace.push(key);
      let tile = Math.floor(Math.random() * 6) +1; //Random number between 0 and 8 for floors
      //Map coords are stored with a tile property and an entities array, entities get pushed/spliced from when things enter the world
      this.map[key] = {tile: tile, entities: [ tile ] };
  
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
      let pos = Game.enemys[i].x + "," + Game.enemys[i].y;
      Game.map[pos].entities.push(Game.enemys[i].sprite);
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
      Game.map[pos].entities.push("*");


      console.log("ROOMS ARE LIKE SO ", Game.rooms);
    }
  },


  spawnStairs: () => {
    let spawnRoom = Game.rooms[Math.floor(Math.random() * Game.rooms.length)];
    let pos = spawnRoom.getCenter()[0] + "," + spawnRoom.getCenter()[1];

    Game.map[pos].tile = ">";
    console.log("STAIRS AT ", pos);
    Game.createSpawn();
  }, //End of stair spawning logic



  drawWholeMap: function () {
    //this.tileSet.onload = function() {
      //ensure the tileset is actually loaded
      Game.display.clear();
      //Simulates actual FOV by clearing any non-seen tiles

     
      let xWidth = 20;
      let yHeight = 14;
      let startingX = player.x -xWidth/2;
      let startingY = player.y - yHeight/2;
      let xEnd = startingX + xWidth;
      let yEnd = startingY + yHeight;

   
      
      Game.fov.compute(player.x, player.y, 10, function (x, y, r, visibility) { //Draw only what is visable
       
        //debugger;
 
        
        

        if(x >= startingX && x < xEnd) {

          if(y >= startingY && y < yEnd) {

            let pos = x + "," + y;

            let cursorX = x - startingX;
            let cursorY = y - startingY;

            if(Game.map[pos].tile) {

              Game.map[pos].entities[0] = Game.map[pos].tile;

              Game.display.draw(cursorX, cursorY, Game.map[pos].entities);
              cursorX++; 
              if(cursorX == xWidth && cursorY < yHeight) cursorY++;
              if(cursorX % xWidth == 0 && cursorY < yHeight) cursorX = 0;
            }

           

          }

        }
      
  
        //TODO Remove legacy code below
        // console.log(`TILE ${pos} VISIBILITY: ${visibility}`);
        //   //if(Game.map[pos]) {

        //     if(visibility == true) {
  
        //     let ch = Game.map[pos].tile;
   
  
        // console.log(`Drawing tile: ${ch}`);
        // Game.display.draw(x, y, ch);

        // if(xOffset % 20 == 0) yOffset++;
        // xOffset++;
        // console.log(`Drew ${ch} at ${pos} with x Offset: ${xOffset} and y Offset: ${yOffset}`);
  
        // for (let i = 0; i < Game.enemys.length; i++) {
        //   if (x == Game.enemys[i].x && y == Game.enemys[i].y) {
        //     console.log("WE SEE THE ENEMY, ")
        //     Game.display.draw(Game.enemys[i].x - startingX, Game.enemys[i].y - startingY, Game.enemys[i].sprite);
        //   }
        // }
       

      //TODO
      });

    
  }, // END OF MAP GEN


  drawDoor: function (x, y) {
   // Game.display.draw(x, y, "+", "red", "");
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

    if(Game.map[pos]) { //Does this pos contain a tile? this is a stupid check needed because when we spawn a player his default
      //location is 0,0 -- It then runs the shadowcast at 0,0 which will attempt to check Game.Map[pos] with said pos
      //Most of the time that pos doesn't actually exist, though, it should

      switch (Game.map[pos].tile) {
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
  
        case "#":
          return false;

        case "k":
          return true;
        
        case "g":
          return true;

        case "w":
          return true;

        case 0:
          return true;

        case 1:
          return true;

        case 2:
          return true;

        case 3:
          return true;

        case 4:
          return true;

        case 5:
          return true;

        case 6:
          return true;

        case 7:
          return true;  
          
        case 8:
          return false;

        case 9:
          return false;

        case 10:
          return false;

        case 11: 
          return false;
  
        default:
          return false;
      }

    }
    
  },


  //New and improved messaging function. The idea here is to read off a continual list of information strings. 
  //We will read an array of strings, for each item we will increase Y draw by 1 so that it continues down the screen
  // If we expand Y to the maximum screendepth of displayText.options.height - 1, clear all the notifications but the last
  //We will also have the status of the player drawn in a seperate function
  //Notify itself is called once per notification, when a notification is given
  notify: (notifications) => {
    Game.textDisplay.clear();
    //Loop through notifications
    for (let i = 0; i < notifications.length; i++) {
      //Display each notification with increasing y
      Game.textDisplay.drawText(0, i, notifications[i]);

      //If we expand past the screens height, clear the nofications array
      if (i > Game.textDisplay._options.height - 5) {
        Game.notifications.splice(0, Game.notifications.length - 1);
      }
    }
    Game.drawStatus();
  },


  //Display health and other info for the player
  drawStatus: () => {
    Game.textDisplay.drawText(0, Game.textDisplay._options.height - 2, "Depth: %c{red}" + Number(Game.level));
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
    Game.notifications = [];
    Game.init();
  },

  createPlayer: () => {
    //This is our char generation function, we will run this at the very start and take information from players to create a char
    //There's lots we can do here, including asking questions in order to determine 'best playstyle' but reality is we don't have classes
    
  },






} // END OF GAME OBJECT ITSELF



//First-run initialization, create player, add a starter item to his inventory, set it to 'equipped'


// Create player object, give him starting items, set the starting items to 'equipped' and add their values to our own
var player = new Player(0, 0, '@', [Game.items[Math.floor(Math.random() * Game.items.length)]], Game.enemys);
//Set initial inventory
for (let i = 0; i < player.inventory.length; i++) { //I think we can replace this with our player.equip method? It might work better
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








