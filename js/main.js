var main = {

  preload: function() {
    game.load.image('background', 'assets/background.png');
    game.load.image('tank', 'assets/tank.png');
    game.load.image('turret', 'assets/turret.png');
    game.load.image('bullet', 'assets/bullet.png');
    game.load.image('flame', 'assets/flame.png');
    game.load.image('target', 'assets/target.png');
    
    game.load.image('land', 'assets/land.png');
  },

  create: function() {
    game.renderer.renderSession.roundPixels = true;
    game.world.setBounds(0, 0, 992, 480);
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.physics.arcade.gravity.y = 200;
    
    game.add.image(0, 0, 'background');
  
    this.targets = game.add.group();
    this.targets.enableBody = true;
    this.targets.create(284, 378, 'target');
    this.targets.create(456, 153, 'target');
    this.targets.create(545, 305, 'target');
    this.targets.create(726, 391, 'target');
    this.targets.create(972, 74, 'target'); 
    this.targets.setAll('body.allowGravity', false); 
    
    this.bullet = game.add.sprite(0, 0, 'bullet');
    this.bullet.exists = false;
    game.physics.arcade.enable(this.bullet);
    
    this.tank = game.add.image(24, 383, 'tank');
    this.turret = game.add.sprite(this.tank.x+30, this.tank.y+14, 'turret');
    
    this.flame = game.add.sprite(0, 0, 'flame');
    this.flame.anchor.set(0.5);
    this.flame.visible = false;
    
    this.power = 300;
    this.powerText = game.add.text(8, 8, 'Power: 300',
                                   {font: '18px Arial', fill: '#ffffff'});
    this.powerText.fixedToCamera = true;
    
    this.cursors = game.input.keyboard.createCursorKeys();
    this.fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    this.fireButton.onDown.add(this.fire, this); 
    
    this.land = game.add.bitmapData(992, 480);
    this.land.draw('land');
    this.land.update();
    this.land.addToWorld(); 
    
    this.emitter = game.add.emitter();
    this.emitter.makeParticles('flame');
    this.emitter.setXSpeed(-120, 120);
    this.emitter.setYSpeed(-100, -200);
    //this.emitter.setRotation();
    
  },

  fire: function() {
    if (this.bullet.exists) {
      return;
    }
    
    //  Re-position the bullet where the turret is
    this.bullet.reset(this.turret.x, this.turret.y);
    
    //  Now work out where the END of the turret is
    var p = new Phaser.Point(this.turret.x, this.turret.y);
    p.rotate(p.x, p.y, this.turret.rotation, false, 32);
    
    // And position the flame sprite there
    this.flame.x = p.x;
    this.flame.y = p.y;
    this.flame.alpha = 1;
    this.flame.visible = true;
    
    // Boom!!
    game.add.tween(this.flame).to({alpha:0}, 100, 'Linear', true);
    
    // Let camera follow the bullet
    game.camera.follow(this.bullet);
    
    // The launch trajectory is based on the angle of the turret and the power
    game.physics.arcade.velocityFromRotation(this.turret.rotation, this.power,
                                             this.bullet.body.velocity);
    
  },
  
  update: function() {
  //  If the bullet is in flight we don't let user control anything
    if (this.bullet.exists) {
      // If bullet touches the ground, remove it
      // Else if bullet hits targets, run callback function
      if (this.bullet.y > 424) {   // Check to see if it's fallen too low
        this.removeBullet();
      }
      else {   // Bullet vs. the Targets
        this.physics.arcade.overlap(this.bullet, this.targets,
                                    this.hitTarget, null, this);
        this.bulletVsLand();
      }
    }
    else {
      // Let user adjust the bullet speed or turret's angle
      // Update the speed text
      //  Allow user to set the power between 100 and 600
      if (this.cursors.left.isDown && this.power>200) {
        this.power -= 2;
      }
      else if (this.cursors.right.isDown && this.power<600) {
        this.power += 2;
      }
      
      //  Allow to set the angle between -90 (straight up) and 0 (facing right)
      if (this.cursors.up.isDown && this.turret.angle>-90) {
        this.turret.angle--;
      }
      else if (this.cursors.down.isDown && this.turret.angle<0) {
        this.turret.angle++;
      }
      
      //  Update the text
      this.powerText.text = 'Power: ' + this.power;
      
    }
  },
  
  removeBullet: function(hasExploded) {
    this.bullet.kill();
    game.camera.follow();
    var delay = 1000;
    if (hasExploded) {
      delay = 2000;
    }
    game.add.tween(game.camera).to({x:0}, 1000, 'Quint', true, delay);
  },
  
  hitTarget: function(bullet, target) {
    this.emitter.at(target);
    this.emitter.explode(2000, 100);
    
    target.kill();
    this.removeBullet(true);
    
    if (this.targets.total == 0) {
      setTimeout(function() {
        game.state.start('main');
      }, 2000);
    }
  },
  
  bulletVsLand: function() {
    if (this.bullet.x>game.world.width || this.bullet.y>420) {
      this.removeBullet();
      return;
    }
    
    var x = Math.floor(this.bullet.x);
    var y = Math.floor(this.bullet.y);
    var rgba = this.land.getPixel(x, y);
    
    if (rgba.a > 0) {   // Not transparent
      this.land.blendDestinationOut();
      this.land.circle(x, y, 16);
      this.land.blendReset();
      this.land.update();
      this.removeBullet();
    }
    
  },

};

var game = new Phaser.Game(640, 480, Phaser.CANVAS, 'gameDiv');
game.state.add('main', main);
game.state.start('main');














