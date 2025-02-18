export class Utils {
    static calculatePositionTowardsTarget(currentX, currentY, targetX, targetY, distance) {
      const angle = Phaser.Math.Angle.Between(currentX, currentY, targetX, targetY);
      const newX = currentX + distance * Math.cos(angle);
      const newY = currentY + distance * Math.sin(angle);
      return { x: newX, y: newY };
    }
  
    static getRandomNumber(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
  
    static getClosestEnemy(enemyToAvoid, enemiesFromScene, x, y){
    
        let enemies = enemiesFromScene.getChildren();
        let closestEnemy = null;
        let distanciaMinima = 99999999;
   
        enemies.forEach(enemy => {
            let distancia = Phaser.Math.Distance.Between(enemy.x, enemy.y, x, y);
            if (distancia < distanciaMinima && enemyToAvoid !== enemy) {
                distanciaMinima = distancia; 
                closestEnemy = enemy; 
            }
        });
    
        return closestEnemy;
    }
  }