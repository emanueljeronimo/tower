/*
-acomodar todo el menu
-revisar todas las naves
-los bordes

-(aplicar algun filtro de color por los niveles o estrellas tipo dune) y el daño de las naves o no, no lo se
-torre de oro
-agregar una variable si va a ir recto o zigzageando
-agregar un flag para setear si la torre sigue o no al target


*/
import { config } from './core/config.js';
import { Game } from './core/Game.js';

config.scene = Game;

const game = new Phaser.Game(config);
