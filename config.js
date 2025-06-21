import MainMenu from "./game.js";
import GameMode from "./game_mode.js";
import  GameSelection  from "./games_select.js";
import OldDinoScene from "./scripts/games/dino/dino_scene.js";
import  DinoScene  from "./scripts/games/dino/g1_dino.js";


const config = {
    type: Phaser.AUTO,
    pixelArt: true,
    transparent: false,
    parent: 'game-container',
    backgroundColor: '#000000',
    width: window.innerWidth,
    height: window.innerHeight,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        orientation: Phaser.Scale.LANDSCAPE
        // width: baseWidth * scaleFactor,
        // height: baseHeight * scaleFactor
    },
    physics: {
        default: "arcade",
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: [MainMenu, GameMode, GameSelection, DinoScene,OldDinoScene]
    // render: {
    //     pixelArt: false,
    //     roundPixels: false,
    //     antialias: true
    // }
};

const game = new Phaser.Game(config);
window.game = game;