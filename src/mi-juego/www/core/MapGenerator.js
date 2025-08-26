import { MainTower } from './MainTower.js'
import { ButtonTower } from './ButtonTower.js'

export class MapGenerator {

  static generateMap(scene, rows, cols) {

    if (rows % 2 == 0) {
      throw "rows should be odd";
    }

    var paths = [[], []];

    const gridSize = { cols: cols, rows: rows };

    // Loop through each buttonTower in the grid
    for (let row = 1; row <= gridSize.rows; row++) {
      for (let col = 1; col <= gridSize.cols; col++) {
        const x = (col * scene.buttonTowerSize) - scene.buttonTowerSize/2;
        const y = (row * scene.buttonTowerSize) - scene.buttonTowerSize/2;

        let buttonTower = new ButtonTower(scene, scene.buttonTowers, scene.towers, scene.enemies, scene.bullets, x, y);
        scene.buttonTowers.add(buttonTower);
      }
    }

    let buttonTower0 = scene.buttonTowers.getChildren()[0];


    paths.forEach((path, index) => {

      path.push({ x: (scene.buttonTowerSize * (cols - 1)) + buttonTower0.x + 1, y: (scene.buttonTowerSize / 2 * (rows)) + buttonTower0.y - (scene.buttonTowerSize / 2) + 1 });

      // el pasillo antes de la torre
      for (let i = 0; i <= 5; i++) {
        path.push({ x: path[i].x - scene.buttonTowerSize, y: path[i].y });
      }

      index == 0 && scene.mainTowers.add(new MainTower(scene, scene.mainTowers, path[1].x, path[1].y, scene.unitSize, scene.unitSize));

      const LEFT = "LEFT", UP = "UP", DOWN = "DOWN";
      const directions = [LEFT, UP, DOWN];
      const notAllowedPaths = [`${DOWN}-${LEFT}-${UP}`, `${UP}-${LEFT}-${DOWN}`,
      `${LEFT}-${DOWN}-${UP}`, `${LEFT}-${UP}-${DOWN}`,
      `${UP}-${DOWN}-${LEFT}`, `${DOWN}-${UP}-${LEFT}`,
      `${UP}-${DOWN}-${DOWN}`, `${UP}-${DOWN}-${UP}`,
      `${DOWN}-${UP}-${DOWN}`, `${DOWN}-${UP}-${UP}`,
      `${DOWN}-${DOWN}-${UP}`, `${DOWN}-${UP}-${UP}`,
      `${UP}-${UP}-${DOWN}`, `${UP}-${DOWN}-${DOWN}`];


      let steps = `${LEFT}-${LEFT}`;
      let stepsAux = steps;

      let leftF = ({ x, y }) => ({ x: x - scene.buttonTowerSize, y });
      let upF = ({ x, y }) => ({ x, y: y - scene.buttonTowerSize });
      let downF = ({ x, y }) => ({ x, y: y + scene.buttonTowerSize });


      let pathConfigArr = [{ direction: LEFT, funct: leftF }, { direction: UP, funct: upF }, { direction: DOWN, funct: downF }];
      while (path[path.length - 1].x > buttonTower0.x) {
        let direction = directions[Math.floor(Math.random() * directions.length)]
        let arrF = pathConfigArr.filter(path => path.direction == direction);
        let nextDirectionConfig = arrF[Math.floor(Math.random() * arrF.length)];

        stepsAux += `-${nextDirectionConfig.direction}`;
        if (stepsAux.split('-').length > 2) {
          let stepArr = stepsAux.split('-')
          let last3Steps = stepArr.splice(-3).join('-');

          if (notAllowedPaths.some(notAllowedPath => notAllowedPath == last3Steps)) {
            stepsAux = steps;
            continue;
          }
          else {
            let { x, y } = nextDirectionConfig.funct({ x: path[path.length - 1].x, y: path[path.length - 1].y });
            if (y > buttonTower0.y && y < (buttonTower0.y* 2 * rows/*  *2 because the size */ )) {
              path.push({ x, y });
              direction = nextDirectionConfig.direction;
              steps = stepsAux;
            }

          }
        }
      }


      // Remove sprites that touch the specified points
      path.forEach((point) => {
        scene.buttonTowers.children.each((buttonTower) => {
          if (point.x >= buttonTower.x && point.x <= buttonTower.x + scene.buttonTowerSize && point.y >= buttonTower.y && point.y <= buttonTower.y + scene.buttonTowerSize) {
            scene.buttonTowers.remove(buttonTower);
            buttonTower.destroy();
          }
        });
      });

      // doing it "flat"
      path = path.reverse();
      let flatPath = [];
      flatPath.push(path[0]);
      for (var i = 1; i <= path.length - 1; i++) {
        if (i == path.length - 1) {
          flatPath.push(path[i]);
          break;
        }
        if (path[i].x !== flatPath[flatPath.length - 1].x && path[i].y !== flatPath[flatPath.length - 1].y) {
          flatPath.push(path[i - 1]);
        }
      }
      path = flatPath;

    });

    return paths;
  }
}