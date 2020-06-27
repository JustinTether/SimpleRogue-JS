import { Game } from "../game.js"
export class Player {
    event = (e) => this.handleEvent(e);

    constructor(x, y, art, inv, enemys) {
        this.x = x;
        this.y = y;
        this.armor = 1;
        this.dmg = 1;
        this.sprite = art;
        this.health = 100;
        this.enemys = enemys;
        this.inventory = inv; //Array of objects with their own functions
    }


    act() {
        Game.engine.lock();
        window.addEventListener("keydown", this.event);
    }

    draw() {
        Game.drawWholeMap();
        //Game.display.draw(this.x, this.y, this.sprite, "#ff0");

    }

    handleEvent(e) {
        //Process the users input

        let keyMap = {};
        keyMap[37] = 6;
        keyMap[38] = 0;
        keyMap[39] = 2;
        keyMap[40] = 4;

        let code = e.keyCode;

        if (code == 76) this.look();

        if(code == 68) {
            this.dropItem();
        }



        if (code == 69) {
            this.equipItem();
        }





        if(code == 190) { //Player is trying to go down stairs
            let pos = this.x+","+this.y;
            if(Game.map[pos].tile == ">") {
                //Player is standing on stairs, move them to a new dungeon, add 1 to level (depth)
                Game.level++;
                Game.resetGame();
            }
            return;
        }

        if (code == 73) {
            Game.informPlayer(this.inventory); // Read out inventory
        }

        if (code == 191) {//Player has hit question mark
            Game.informPlayer("Welcome to the help section! List of commands:\n \n Up Arrow: Move up \n Down Arrow: Move down \n Left Arrow: Move Left \n Right Arrow: Move right \n L: Pick up item \n I: Inventory");
        }


        if (!(code in keyMap)) { return; }


        let diff = ROT.DIRS[8][keyMap[code]];
        console.log(ROT.DIRS[8][keyMap[code]], " ROT DIRS KEY");
        let newX = this.x + diff[0];
        let newY = this.y + diff[1];

        let newKey = newX + "," + newY;
        console.log("NEW KEY + ", newKey);

        if (Game.map[newKey].tile == "#") { return; };

        console.log("Calculating if hit", this.enemys);
        //We've hit an enemy, let's figure out which one
        let parts = newKey.split(",");

        for (let i = 0; i < this.enemys.length; i++) {
            if (parts[0] == this.enemys[i].x && parts[1] == this.enemys[i].y) {
                //Roll a dice for fairness
                let roll = Math.floor(ROT.RNG.getUniform() * 6);
                if (roll >= 3) {
                    //Deduct damage from this entity
                    Game.notifications.push("You swing at the " + this.enemys[i].name + " and hit! Dealing " + this.dmg + " damage");
                    Game.notify(Game.notifications);
                    //this.enemys[i].health -= this.dmg;
                    this.enemys[i].damage(this.dmg, false);
                    Game.engine.unlock();
                    return;
                } else {
                    Game.notifications.push("You swing at the " + this.enemys[i].name + " and miss!");
                    Game.notify(Game.notifications);
                    Game.engine.unlock();
                    return;

                }

            }
        }

        console.log("Current NewX values ", newX, newY);
        let newPos = newX + "," + newY;
        let oldPos = this.x + "," + this.y;

        //Game.display.draw(this.x, this.y, Game.map[this.x + "," + this.y].tile);
        //Loop through old position entities till we find us, remove us
        for(let i = 0; i < Game.map[oldPos].entities.length; i++) {

            if(Game.map[oldPos].entities[i] == "@") Game.map[oldPos].entities.splice(i, 1);
        }

        //Add ourselves to the new tiles entities
        Game.map[newPos].entities.push("@");

        this.x = newX;
        this.y = newY;

        this.draw();
        window.removeEventListener("keydown", this.event);
        Game.engine.unlock();
    }


    look() {
        //Method for checking the ground for items, picking up loose items, looting corpses, chests, etc.
        //Here we'll define some stuff for making sure that corpses are removed (Or changed to a different look?)

        let pos = this.x + "," + this.y; //Players position turned into a string, for use in Game.map[]


        //Let's switch this so that we now use the entities section

        for(let i = 0; i < Game.map[pos].entities.length; i++) {

            switch(Game.map[pos].entities[i]) {


                case "%":
                //Is corpse
                //Do we get loot? Let's roll a dice for this
                let roll = Math.floor(Math.random() * 6);
                if(roll >= 3) {
                    let loot = Game.loot[Math.floor(Math.random() * Game.loot.length)];
                    Game.informPlayer("You picked up " + loot.name);
                    this.inventory.push(loot);
                    //Game.map[pos]= ".";

                    //Loop trough the tile entities and delete the corpse we're standing on
                    for(let i = 0; i < Game.map[pos].entities.length; i++) {
                        
                        if(Game.map[pos].entities[i] == "%") Game.map[pos].entities.splice(i, 1);
                    }
                } else {
                    Game.informPlayer("You found nothing when looking the corpse..");
                    //Loop trough the tile entities and delete the corpse we're standing on
                    for(let i = 0; i < Game.map[pos].entities.length; i++) {
                        
                        if(i == "%") Game.map[pos].entities.splice(i, 1);
                    }
                }
               
            break;



            case "*":
                //Loot box
                let loot = Game.loot[Math.floor(Math.random() * Game.loot.length)];
                Game.informPlayer("You picked up " + loot.name);
                this.inventory.push(loot);
                for(let i = 0; i < Game.map[pos].entities.length; i++) {
                        
                    if(i == "*") Game.map[pos].entities.splice(i, 1);
                }
            break;




            }

        }


    } //END of look function


    dropItem() {
        //Initiate drop 
        let disposeItem = (event) => {
            let key = event.keyCode;
            console.error("Inside function, key code is ", key);
            let index = key - 65;
            this.equipItem(event);
            this.inventory.splice(index, 1);
            window.removeEventListener("keydown", disposeItem);
            Game.informPlayer(this.inventory);
        }

        window.addEventListener("keydown", disposeItem);
    }


    equipItem(code) { //TODO: add the ability to drop an item, dropped items get added to Game.Map[pos].entities[index] -- This allows us to stack tiles
        //redesign of equipment system, equip/unequip any item based on alphabet code, will only work after pressing E
        let eItem = (e) => {
            let key = e.keyCode;

            let invItem = this.inventory[key - 65]; //65 happens to be the charCode for 'a' -- It also goes in order, so 66 (b) - 65 = 1

            //ensure that we also double check the equipped item slot to ensure you can't equip two items!
            if (!invItem.equipped) { //If item is not currently equipped
    
                for(let i = 0; i < this.inventory.length; i++) {
    
                    if(this.inventory[i].slot == invItem.slot) {
                        if(this.inventory[i].equipped) {
                            this.inventory[i].equipped = false;
                            if(this.inventory[i].armor) this.armor -= this.inventory[i].armor;
                            if(this.inventory[i].dmg) this.dmg -= this.inventory[i].dmg;
                        }
                     
                    }
                }
                if (invItem.dmg) {
                    this.dmg += invItem.dmg;
                }
    
                if (invItem.armor) {
                    this.armor += invItem.armor
                }
    
                invItem.equipped = !invItem.equipped;
                Game.informPlayer(this.inventory);
    
            } else {
    
                if (invItem.dmg) {
                    this.dmg -= invItem.dmg;
                }
    
                if (invItem.armor) {
                    this.armor -= invItem.armor
                }
    
                invItem.equipped = !invItem.equipped;
                Game.informPlayer(this.inventory);
            }

            window.removeEventListener("keydown", eItem);
        }

        if(code == undefined) {
            window.addEventListener("keydown", eItem);
        } else eItem(code);

     
    }// End of equipItem method 






}
