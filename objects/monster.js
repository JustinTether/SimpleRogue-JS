import { Game } from "../game.js";

/* New Monster class that represents any and all monsters we may spawn, will continue to get larger as we add more monsters
    Currently, monsters use an 'entity ID' system, where you call the id of the monster you're looking to spawn inside the
        constructor. This makes it easy to randomize the monster spawns and get unique sets of enemies each time 
            simply add monsters inside the switch statements, which determine movement type/speed. Eventually we should also adjust
                cone of influence for all monsters */

//Monster ID Keys
// 1 == kobold
// 2 == goblin
// 3 == witch

export class Monster {

    constructor(id, x, y, player) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.px = 0;
        this.py = 0;
        this.sprite = "";
        this.health = 5; //We can change this to also maybe represent level? Still have to figure out levels
        this.path = [];
        this.player = player;
        this.astar = null;
        this.self = this;
        this.dmg = 2;
        this.name = "";
        this.color = ""

        switch(this.id) {
            //Change monster name dependant on ID provided
            case 1:
                this.name = "kobold";
                this.sprite = "k";
                this.color = "#F00";
            break;

            case 2:
                this.name = "goblin";
                this.sprite = "g";
                this.color = "#0F0";
            break;

            //More as needed
            
        }

    }




act() {
    console.log("THIS ", this); // DEBUG, remove
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


    var passableCallback = function (x, y) { //This callback will return true if the positon exists within our game map
        return (x + "," + y in Game.map);
    }

    
    switch(this.id) { // Monster movement designation, you can change topology here
        case 1: //Is kobold, 4 topology
            this.astar = new ROT.Path.AStar(this.player.x, this.player.y, passableCallback, { topology: 4 });
        break;
        
        case 2: //is goblin, 8 topology
            this.astar = new ROT.Path.AStar(this.player.x, this.player.y, passableCallback, { topology: 8 });
        break;

        //More to come

    }
   



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
        if(roll >= 3) {
            this.player.health -= this.dmg;
            Game.notifications.push("a " + this.name + " lunges at you! It connects dealing " + this.dmg +" damage\n\n");
            Game.notify(Game.notifications);
            Game.engine.unlock();
            return;
        }else {
            Game.notifications.push("a " + this.name + " swings at you! But misses\n\n");
            Game.notify(Game.notifications);
            Game.engine.unlock();
            return;
        }
       
    }

    if (this.path.length < 10) {
        let x = this.path[0][0];
        let y = this.path[0][1];

        // let pos = this.x + "," + this.y;
        // Game.map[pos] = ".";
        // this.x = x;
        // this.y = y;
        // pos = this.x + "," + this.y;
        // Game.map[pos] = this.sprite;

        this.x = x;
        this.y = y;
    }
    this.draw();
    Game.engine.unlock();


}

draw() {
    Game.drawWholeMap();
     //Game.display.draw(this.x, this.y, this.sprite, this.color);
}




}