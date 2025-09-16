/*
-acomodar todo el menu
-revisar todas las naves
-los bordes

-aplicar algun filtro de color por los niveles y el daño de las naves
-sonidos
-la camara cuando vas y venis se va corriendo
-torre de oro
-el tema de la frecuencia de disparo //ya estaba esto je
*/
import { config } from './core/config.js';
import { Game } from './core/Game.js';

config.scene = Game;

const game = new Phaser.Game(config);
