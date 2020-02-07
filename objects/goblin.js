import { Game } from "../game.js";


export class Goblin {
    //Basic goblin enemy, 4-topology, 1 damage, no starting equipment.

    constructor(x, y, art, player) {
        this.x = x;
        this.name = "Goblin";
        this.y = y;
        this.px = 0;
        this.py = 0;
        this.sprite = art;
        this.health = 5; //We can change this to also maybe represent level? Still have to figure out levels
        this.path = [];
        this.player = player;
        this.astar = null;
        this.self = this;
        this.dmg = 2;

    }


    act() {

        console.log("THIS ", this);
        Game.engine.lock();
        
        if(this.health < 1) {
            // Char is dead, do no more
            let pos = this.x+","+this.y;
            let index = Game.enemys.indexOf(this);
            Game.map[pos] = ".";
            Game.scheduler.remove(this);
            Game.enemys.splice(index, 1); 
            Game.engine.unlock();
            return;
        }


        var passableCallback = function (x, y) {
            return (x + "," + y in Game.map);
        }

        this.astar = new ROT.Path.AStar(this.player.x, this.player.y, passableCallback, { topology: 8 });



        var pathCallback =  (x, y) => {
            this.path.push([x, y]);
        }
        this.path = [];
        this.astar.compute(this.x, this.y, pathCallback);
        console.log("Astar computation complete");
        this.path.shift(); //Remove existing position

        if (this.path.length == 1) {
            //Attack player

            //Roll for attack
            let roll = Math.floor(ROT.RNG.getUniform() * 6);
            if(roll >= 3) { // If this enemy rolls a 3, he creates a hit
                this.player.health -= this.dmg;
                Game.notifications.push("a goblin lunges at you! It connects dealing " + this.dmg +" damage\n\n");
                Game.notify(Game.notifications);
                Game.engine.unlock();
                return;
            }else {
                Game.notifications.push("a goblin swings at you! But misses\n\n");
                Game.notify(Game.notifications);
                Game.engine.unlock();
                return;
            }
           
        }

        if (this.path.length < 10) {
            let x = this.path[0][0];
            let y = this.path[0][1];
            let pos = this.x + "," + this.y;
            Game.map[pos] = ".";
            this.x = x;
            this.y = y;
            pos = this.x + "," + this.y;
            Game.map[pos] = this.sprite;
        }
        this.draw();
        Game.engine.unlock();
    }


    draw = () => {
        Game.drawWholeMap();
        
    }







}