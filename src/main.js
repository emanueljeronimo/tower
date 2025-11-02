/*
-acomodar todo el menu
-revisar todas las naves
-los bordes

-aplicar algun filtro de color por los niveles y el daño de las naves
-sonidos
-torre de oro
-que cada clase cargue sus archivos
-https://www.freeconvert.com/png-to-svg/download cambiar todo a svg
*/
import { config } from './core/config.js';
import { Game } from './core/Game.js';

config.scene = Game;

const game = new Phaser.Game(config);
