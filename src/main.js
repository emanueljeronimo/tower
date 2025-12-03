/*
-acomodar todo el menu
-revisar todas las naves
-los bordes

-(aplicar algun filtro de color por los niveles o estrellas tipo dune) y el daño de las naves o no, no lo se
-torre de oro
-destruir los bullets de damage y de teleport cuando se destruye el target quedan feos
-y del teleport cambiar el color blanco a azul o algo
-agregar una variable si va a ir recto o zigzageando
-hacer mas fino el borde del teleport

*/
import { config } from './core/config.js';
import { Game } from './core/Game.js';

config.scene = Game;

const game = new Phaser.Game(config);
