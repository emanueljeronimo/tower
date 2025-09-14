/*
-acomodar todo el menu
-revisar todas las naves
-los bordes
-aplicar algun filtro de color por los niveles y el daño de las naves
-sonidos
-que disparen dentro de la pantalla

-torre damage/sangrado

aca tengo que hacer ese refactor de que no se necesita target para "disparar"
-torre de minas
-torre de oro
-torre que dispare helicópteros
-torre que dispare un radio de electricidad 

-el tema de la frecuencia de disparo //ya estaba esto je
*/
import { config } from './core/config.js';
import { Game } from './core/Game.js';

config.scene = Game;

const game = new Phaser.Game(config);
