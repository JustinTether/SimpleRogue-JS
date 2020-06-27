tID = prompt("What is your tile ID?");

PixelGetter = { 

getTileX: (tileID) => {
    //Calculate the tiles X postion for a given tile coordinate
    let x = 32* (tileID % 64); // tileID Modulo 64 because 64 is our X width in tiles

    return x;
  },

  getTileY: (tileID) => {
    //Calculate tiles y position for a given tile coordinate
    let y = 32* (Math.floor(tileID / 64));// tileID divided by 94 because 94 is our Y height in tiles
    return y;
  },

};

console.log("Tile X position: " + PixelGetter.getTileX(tID));
console.log("Tile Y position: " + PixelGetter.getTileY(tID));