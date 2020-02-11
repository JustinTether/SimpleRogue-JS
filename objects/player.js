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

    equipItem(code) {
        let keyMap = {};
        keyMap[65] = "0";
        keyMap[66] = "1";
        keyMap[67] = "2";
        keyMap[68] = "3";
        keyMap[69] = "4";
        keyMap[70] = "5";

        //Player is wanting to do something with his inventory most likely
        let invItem = this.inventory[Number(keyMap[code])];

        //Time to re-write this to ensure that we also double check the equipped item slot to ensure you can't equip two items!

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
            return;

        } else {

            if (invItem.dmg) {
                this.dmg -= invItem.dmg;
            }

            if (invItem.armor) {
                this.armor -= invItem.armor
            }

            invItem.equipped = !invItem.equipped;
            Game.informPlayer(this.inventory);
            return;
        }

    }

    handleEvent(e) {
        //Process the users input

        let keyMap = {};
        keyMap[38] = 0;
        keyMap[33] = 1;
        keyMap[39] = 2;
        keyMap[34] = 3;
        keyMap[40] = 4;
        keyMap[35] = 5;
        keyMap[37] = 6;
        keyMap[36] = 7;

        //Keys for item usage
        keyMap[65] = "0";
        keyMap[66] = "1";
        keyMap[67] = "2";
        keyMap[68] = "3";
        keyMap[69] = "4";
        keyMap[70] = "5";


        let code = e.keyCode;

        if (code == 76) { //Player pressed L, look for objects here
            let key = this.x + "," + this.y;

            if (Game.map[key] == "*") { //Player is above a chest
                let loot = Game.loot[Math.floor(Math.random() * Game.loot.length)];
                Game.informPlayer("You picked up " + loot.name);
                this.inventory.push(loot);
                Game.map[key] = ".";
            }
        }



        if (code >= 65 && code < 70) {
            this.equipItem(code);
        }





        if(code == 190) { //Player is trying to go down stairs
            let pos = this.x+","+this.y;
            if(Game.map[pos] == ">") {
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

        // if (!(newKey in Game.map)) { return; } /* cannot move in this direction */

        if (!(newKey in Game.map)) { return; };

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
                    this.enemys[i].health -= this.dmg;
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

        Game.display.draw(this.x, this.y, Game.map[this.x + "," + this.y]);
        this.x = newX;
        this.y = newY;
        this.draw();
        window.removeEventListener("keydown", this.event);
        Game.engine.unlock();
    }

    getCoords() {
        return ({ x: this.x, y: this.y });
    }









}