//Imports -- All objects from the game
import { Player } from "./objects/player.js";
import { Kobold } from "./objects/kobold.js";


//ROT.RNG.setSeed();
// Game object which has two functions (init, getDisplay), init creates a display, getDisplay is called to return said display

export const Game = {
  display: null,
  level: 1,
  textDisplay: null,
  scheduler: null,
  notifications: [],
  invSlots: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k"],
  digger: null,
  mapGen: null, //used for map generation
  map: {},
  fov: null,
  enemyChar: ["k", "d", "t", "g"],
  enemys: [],
  freeSpace: [],
  items: [ //Starting items pool, things you can randomly spawn with
    { name: "Short Sword", dmg: 2, equipped: false }, // All items are like this, if item is equipped:true, we calc damage for it
    { name: "worn leather leggings", armor: 2, equipped: false },
  ],
  loot: [ //Loot to be dropped by mobs or found in chests
    { name: "golden crown", armor: 2, equipped: false },
    { name: "leather leggings", armor: 4, equipped: false },
    { name: "long sword", dmg: 4, equipped: false },
    { name: "leather chestpiece", armor: 5, equipped: false },
    { name: "leather helm", armor: 4, equipped: false },
    { name: "steel chestpiece", armor: 8, equipped: false },
    { name: "steel leggings", armor: 6, equipped: false },
    { name: "steel mace", dmg: 3, equipped: false },


  ],
  rooms: null,
  room: null,
  engine: null,
  roomDebug: [],
  //End of variable declaration

  init: function () {
    this.display = new ROT.Display({ fontSize: 18 });
    this.textDisplay = new ROT.Display({ width: 30, height: 20 }); //Dedicated display specifically for text notifications in-game
    this.fov = new ROT.FOV.PreciseShadowcasting(Game.shadowCast);
    this.scheduler = new ROT.Scheduler.Simple();
    this.scheduler.add(player, true);
    this.scheduler.add(kobold, true);
    this.engine = new ROT.Engine(this.scheduler);
    this.engine.start();
    this.createMap();
  },//END OF DISPLAY GENERATION



  getDisplay: function () {
    return this.display;
  }, //END OF DISPLAY RETURN FUNCTION



  createMap: function () {
    //Generate a map for use in this specific dungeon
    this.digger = new ROT.Map.Digger(); //Width x Height
    let diggerCallback = function (x, y, value) {
      if (value) { return; } //Not storing walls?

      let key = x + "," + y;
      Game.freeSpace.push(key);
      this.map[key] = ".";
    }

    this.digger.create(diggerCallback.bind(this));
    this.drawWholeMap();

  }, //END OF MAP CREATION



  spawnEnemies: () => { //Random function for generating some enemies
    let spawnRoom = Game.rooms[Math.floor(Math.random() * Math.floor(Game.rooms.length))];
    kobold.x = spawnRoom.getCenter()[0];
    kobold.y = spawnRoom.getCenter()[1];

    let pos = kobold.x + "," + kobold.y;

    Game.map[pos] = "k";

  }, //END OF LOOT GEN



  drawWholeMap: function () {
    Game.display.clear(); //Simulates actual FOV by clearing any non-seen tiles, this can be removed
    Game.fov.compute(player.x, player.y, 10, function (x, y, r, visibility) { //Draw only what is visable

      let pos = x + "," + y;
      let ch = (Game.map[pos]);

      //If the key shows up in enemies
      let bgColor = (Game.map[pos] ? "#d3d3d3" : "#2b2d2f");
      let fgColor = (Game.map[pos] == "k" ? "#F00" : "#FFF"); //Is it a kobold? Draw as red
      //fgColor = (Game.map[pos] == "g" ? "#0F0" : "FFF");
      Game.display.draw(x, y, ch, fgColor, bgColor);

    });
    Game.display.draw(player.x, player.y, player.sprite, "#ff0"); //Draw player
    this.drawRooms();
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

  }, //END OF SPAWN CREATION



  informPlayer: (text) => {
    Game.textDisplay.clear(); //Clear the information screen

    if (Array.isArray(text)) { //If the item passed in is an array, it's the players inventory
      for (let i = 0; i < text.length; i++) {
        let item = text[i];

        Game.textDisplay.drawText(0, 0, "Your Inventory ");
        let string = Game.invSlots[i] + ") " + text[i].name;
        if (text[i].equipped) {
          string += "%b{green} e";
        }
        Game.textDisplay.drawText(0, i + 1, string);
      }
      Game.textDisplay.drawText(0, player.inventory.length + 3, "Press any key to equip or unequip");
      Game.drawStatus();

      //Otherwise, print string as normal
    } else {
      Game.textDisplay.drawText(0, 0, text);
    }
  }, //END OF TEXT/NOTIFY SYSTEM

  shadowCast: (x, y) => { //Function for use in FOV computations
    let pos = x + "," + y;
    if (pos in Game.map) { return (Game.map[pos] == "."); }
    return false;
  },

  //New and improved messaging function. The idea here is to read off a continual list of information strings. 
  //We will read an array of strings, for each item we will increase Y draw by 1 so that it continues down the screen
  // If we expand Y to the maximum screendepth of displayText.options.height - 1, clear all the notifications but the last
  //We will also have the status of the player drawn in a seperate function
  notify: (text) => {
    Game.textDisplay.clear();
    //Loop through notifications
    for(let i = 0; i < text.length; i++) {
      //Display each notification with increasing y
      Game.textDisplay.drawText(0, i, text[i]);
      if(i == Game.textDisplay._options.height - 2) {
        Game.notifications.splice(0, Game.notifications.length - 1);
      }
    }
    Game.drawStatus();
  },

  drawStatus: () => {
    Game.textDisplay.drawText(0, Game.textDisplay._options.height -1, "Health: %c{green}"+player.health+ "%c{white} Damage: %c{red}"+player.dmg +"%c{white} Armor: %c{yellow}"+player.armor);
  }



} // END OF GAME OBJECT ITSELF










if (Game.level == 1) {
  var player = new Player(0, 0, "@", [Game.items[Math.floor(Math.random() * Game.items.length)]], Game.enemys);
  var kobold = new Kobold(0, 0, "k", player);
  Game.enemys.push(kobold);
    // Create player object, give him starting items, set the starting items to 'equipped' and add their values to our own
  for (let i = 0; i < player.inventory.length; i++) {
    player.inventory[i].equipped = true;
    if (player.inventory[i].dmg) {
      player.dmg += player.inventory[i].dmg;
    }
    if (player.inventory[i].armor) {
      player.armor += player.inventory[i].armor;
    }
  }


  //Enemy generation

}



console.log(player);



//START OF KEYBOARD CONTROLLER OBJECT





//Initialize game
Game.init(); //Create display
Game.createSpawn(); //Move on to next section, creating spawnpoint
Game.spawnEnemies();
player.draw();
Game.drawStatus();
console.log("ENTIRE GAME ENTITY ", Game.map);
document.body.appendChild(Game.getDisplay().getContainer()); //Push display to the body of the page
document.body.appendChild(Game.textDisplay.getContainer());







