var game = new Phaser.Game(360, 592, Phaser.AUTO);


var GameState = {
    init: function () {
        this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.scale.pageAlignHorizontally = true;
        this.scale.pageAlignVertically = true;


        //    init physics and gravity Phaser engine
        this.game.physics.startSystem(Phaser.Physics.ARCADE);
        this.game.physics.arcade.gravity.y = 1000;

        //init size of the game world screen. In create method set camera on player, worl bigger then screen size, and camera follow pl
        this.world.setBounds(0, 0, 360, 700);

        this.cursors = this.game.input.keyboard.createCursorKeys();
        this.RUNNING_SPEED = 180;
        this.JUMPING_SPEED = 550;
    },

    preload: function () {
        this.load.spritesheet('player', 'assets/images/player.png', 65, 85, 7, 0, 0, 0);
        this.load.spritesheet('barrel', 'assets/images/barrel.png', 64, 64, 25, 0, 0, 0);
        this.load.spritesheet('ground', 'assets/images/ground.png', 1000, 135, 1, 0, 0, 0);


        this.load.image('arrowBtn', 'assets/images/arrowBtn.png');
        this.load.image('actionBtn', 'assets/images/actionBtn.png');
        this.load.image('goal', 'assets/images/dog.png');
        this.load.image('fire', 'assets/images/fire.png');

        this.load.text('level', 'assets/data/package.json');


    },

    create: function () {
        //create JSON object
        this.levelData = JSON.parse(this.game.cache.getText('level'));

        this.dog = this.game.add.sprite(this.levelData.goal.x, this.levelData.goal.y, 'goal');
        this.dog.anchor.setTo(0.5);
        this.dog.scale.setTo(0.13);
        this.game.physics.arcade.enable(this.dog);
        this.dog.allowGravity = true;

        // this.barrel = this.game.add.sprite(200, 400, 'barrel', 0);

        this.barrels = this.game.add.group();
        this.barrels.enableBody = true;

        this.createBarrel();
        this.barrelCreator = this.game.time.events.loop(Phaser.Timer.SECOND * this.levelData.barrelFreaquency, this.createBarrel, this);

        this.ground = this.game.add.sprite(0, 630, 'ground');
        this.ground.scale.setTo(0.365, 0.6);
        this.game.physics.arcade.enable(this.ground);
        //body is give acsess to things like velocity, weight, bounce
        this.ground.body.allowGravity = false;
        //!!!
        this.ground.body.immovable = true;


        // this.platform = this.game.add.sprite(0, 300, 'ground');
        // this.platform.scale.setTo(0.2);
        // this.game.physics.arcade.enable(this.platform);
        // this.platform.body.allowGravity = false;
        // this.platform.body.immovable = true;



        //!!! create platform group
        this.platforms = this.game.add.group();
        this.platforms.enableBody = true;

        this.levelData.platformData.forEach(function (element) {
            var platform = this.platforms.create(element.x, element.y, 'ground');
            platform.scale.setTo(0.2);
        }, this);

        this.platforms.setAll('body.immovable', true);
        this.platforms.setAll('body.allowGravity', false);

        //create fire group
        this.fires = this.game.add.group();
        this.fires.enableBody = true;

        this.levelData.fireData.forEach(function (element) {
            this.fire = this.fires.create(element.x, element.y, 'fire');
            this.fire.scale.setTo(0.2);
            this.fire.anchor.setTo(0.4);
        }, this);

        this.fires.setAll('body.allowGravity', false);
        this.fires.setAll('body.immovable', true);

        //create player
        this.player = this.game.add.sprite(this.levelData.playerStart.x, this.levelData.playerStart.y, 'player', 1);
        this.player.anchor.setTo(0.5);
        this.player.scale.setTo(0.3);

        this.player.animations.add('walking', [0, 1, 2, 1], 6, true);
        this.player.play('walking');
        this.game.physics.arcade.enable(this.player);

        this.player.customParams = {};

        this.game.camera.follow(this.player);
        this.player.body.collideWorldBounds = true;




        // this.arrowBtnLeft = this.game.add.sprite(50, 600, 'arrowBtn');
        // this.arrowBtnLeft.anchor.setTo(0.5);
        // this.arrowBtnLeft.scale.setTo(0.4);
        // this.arrowBtnLeft.alpha = 0.5;

        // this.arrowBtnRight = this.game.add.sprite(140, 600, 'arrowBtn');
        // this.arrowBtnRight.anchor.setTo(0.5);
        // this.arrowBtnRight.scale.setTo(0.4);
        // this.arrowBtnRight.alpha = 0.5;

        // this.actionBtn = this.game.add.sprite(300, 600, 'actionBtn');
        // this.actionBtn.anchor.setTo(0.5);
        // this.actionBtn.scale.setTo(0.12);
        // this.actionBtn.alpha = 0.5;

    //    create screen controls
        this.createOnscreenControls();

    },

    update: function () {
        //   object collision
        this.game.physics.arcade.collide(this.player, this.platforms, this.landed);
        this.game.physics.arcade.collide(this.player, this.ground, this.landed);
        this.game.physics.arcade.overlap(this.player, this.fires, this.killPlayer);
        this.game.physics.arcade.overlap(this.player, this.barrels, this.killPlayer);


        this.game.physics.arcade.collide(this.dog, this.platforms);
        this.game.physics.arcade.overlap(this.player, this.dog, this.win);

        this.game.physics.arcade.collide(this.barrels, this.platforms, this.landed);
        this.game.physics.arcade.collide(this.barrels, this.ground, this.landed);

        this.player.body.velocity.x = 0;

        if (this.cursors.left.isDown || this.player.customParams.runLeft) {
            this.player.body.velocity.x -= this.RUNNING_SPEED;
        } else if (this.cursors.right.isDown || this.player.customParams.runRight) {
            this.player.body.velocity.x += this.RUNNING_SPEED;

        }

        // this.player.touching.down - work just one click up, cheking is player toch ground

        if ((this.cursors.up.isDown || this.player.customParams.mustJump) && this.player.body.touching.down) {
            this.player.body.velocity.y -= this.JUMPING_SPEED;
        }

        this.barrels.forEach(function (element) {
            if(element.x < 10 && element.y > 600){
                element.kill();
            }
        }, this)
    },
    landed: function (player, ground) {
        // console.log("landed");
    },
    
    createOnscreenControls: function () {
        this.leftArrow = this.add.button(50, 550, 'arrowBtn');
        this.leftArrow.anchor.setTo(0.5);
        this.leftArrow.scale.setTo(0.4);
        this.leftArrow.alpha = 0.5;

        this.rightArrow = this.add.button(140, 550, 'arrowBtn');
        this.rightArrow.anchor.setTo(0.5);
        this.rightArrow.scale.setTo(0.4);
        this.rightArrow.alpha = 0.5;

        this.actionBtn = this.add.button(300, 550, 'actionBtn');
        this.actionBtn.anchor.setTo(0.5);
        this.actionBtn.scale.setTo(0.12);
        this.actionBtn.alpha = 0.5;

        //    fixed position of arrows to camera (player position)
        this.leftArrow.fixedToCamera = true;
        this.rightArrow.fixedToCamera = true;
        this.actionBtn.fixedToCamera = true;


        this.actionBtn.events.onInputDown.add(function () {
            this.player.customParams.mustJump = true;
        }, this);

        this.actionBtn.events.onInputUp.add(function () {
          this.player.customParams.mustJump = false;
        }, this);

        this.leftArrow.events.onInputDown.add(function () {
            this.player.customParams.runLeft = true;
        }, this);
        this.leftArrow.events.onInputUp.add(function () {
            this.player.customParams.runLeft = false;
        },this);

        this.rightArrow.events.onInputDown.add(function () {
            this.player.customParams.runRight = true;
        }, this);

        this.rightArrow.events.onInputUp.add(function () {
            this.player.customParams.runRight = false;
        }, this);

    },

    killPlayer: function (player, fire) {
        console.log("auch");
        game.state.start('GameState');
    },
    win: function (player, goal) {
        alert("You win");
        game.state.start('GameState');
    },

    createBarrel: function () {
        //give first dead sprite, to recicle
        var barrel = this.barrels.getFirstExists(false);

        if(!barrel){
            barrel = this.barrels.create(0, 0, 'barrel');
            barrel.scale.setTo(0.2);

        }
        //behavior of barrel, bounce of the world + move by x
        barrel.body.collideWorldBounds = true;
        barrel.body.bounce.set(1, 0);
        barrel.reset(this.levelData.goal.x, this.levelData.goal.y);
        barrel.body.velocity.x = this.levelData.barrelSpeed;
    }

};


game.state.add('GameState', GameState);
game.state.start('GameState');