/// <reference path="C:/Users/ME/Desktop/levelsbug/phaser.d.ts" />
export default class DinoScene extends Phaser.Scene {

    constructor() {
        super({ key: 'DinoScene' });
    }

    preload() {
        // Load all assets (from PreloadScene)
        this.load.audio('jump', 'assets/games/g1/jump.m4a');
        this.load.audio('hit', 'assets/games/g1/hit.m4a');
        this.load.audio('reach', 'assets/games/g1/reach.m4a');
        

        this.load.image('ground', 'assets/games/g1/ground.png');
        this.load.image('dino-idle', 'assets/games/g1/dino-idle.png');
        this.load.image('dino-hurt', 'assets/games/g1/dino-hurt.png');
        this.load.image('restart', 'assets/games/g1/restart.png');
        this.load.image('game-over', 'assets/games/g1/game-over.png');
        this.load.image('cloud', 'assets/games/g1/cloud.png');

        this.load.spritesheet('star', 'assets/games/g1/stars.png', {
            frameWidth: 9, frameHeight: 9
        });

        this.load.spritesheet('moon', 'assets/games/g1/moon.png', {
            frameWidth: 20, frameHeight: 40
        });

        this.load.spritesheet('dino', 'assets/games/g1/dino-run.png', {
            frameWidth: 88,
            frameHeight: 94
        });

        this.load.spritesheet('dino-down', 'assets/games/g1/dino-down.png', {
            frameWidth: 118,
            frameHeight: 94
        });

        this.load.spritesheet('enemy-bird', 'assets/games/g1/enemy-bird.png', {
            frameWidth: 92,
            frameHeight: 77
        });

        this.load.image('obsticle-1', 'assets/games/g1/cactuses_small_1.png');
        this.load.image('obsticle-2', 'assets/games/g1/cactuses_small_2.png');
        this.load.image('obsticle-3', 'assets/games/g1/cactuses_small_3.png');
        this.load.image('obsticle-4', 'assets/games/g1/cactuses_big_1.png');
        this.load.image('obsticle-5', 'assets/games/g1/cactuses_big_2.png');
        this.load.image('obsticle-6', 'assets/games/g1/cactuses_big_3.png');
    }

    async create() {
        const container = document.getElementById('game-container');
        if (container) {
            container.style.display = 'flex';
            container.style.justifyContent = 'center';
            container.style.alignItems = 'center';
            container.style.height = '100vh';
        }

        // const { height, width } = this.game.;
        const height =1000;
        const width = 340;
        this.gameSpeed = 10;
        this.isGameRunning = false;
        this.respawnTime = 0;
        this.score = 0;
        this.isDucking = false;



        this.jumpSound = this.sound.add('jump', { volume:1 });
        this.hitSound = this.sound.add('hit', { volume: 1 });
        this.reachSound = this.sound.add('reach', { volume: 1 });

        this.startTrigger = this.physics.add.sprite(0, 10).setOrigin(0, 1).setImmovable();
        this.ground = this.add.tileSprite(0, height, 88, 26, 'ground').setOrigin(0, 1);
        this.dino = this.physics.add.sprite(0, height, 'dino-idle')
            .setCollideWorldBounds(true)
            .setGravityY(5000)
            .setBodySize(44, 92)
            .setDepth(1)
            .setOrigin(0, 1);

        this.scoreText = this.add.text(20, 20, "00000", {
            fill: "#535353",
            font: '900 35px Courier',
            resolution: 5
        }).setOrigin(0, 0).setAlpha(0);

        this.highScoreText = this.add.text(0, 20, "00000", {
            fill: "#535353",
            font: '900 35px Courier',
            resolution: 5
        }).setOrigin(0, 0).setAlpha(0);

        this.environment = this.add.group();
        this.environment.addMultiple([
            this.add.image(width / 2, 170, 'cloud'),
            this.add.image(width - 80, 80, 'cloud'),
            this.add.image((width / 1.3), 100, 'cloud')
        ]);
        this.environment.setAlpha(0);

        this.gameOverScreen = this.add.container(width / 2, height / 2 - 50).setAlpha(0);
        this.gameOverText = this.add.image(0, 0, 'game-over');
        this.restart = this.add.image(0, 80, 'restart').setInteractive();
        this.gameOverScreen.add([this.gameOverText, this.restart]);

        this.obsticles = this.physics.add.group();

        this.initAnims();
        this.initStartTrigger();
        this.initColliders();
        this.handleInputs();
        this.handleScore();

        // try {
        //     await loadPoseDependencies();
        //     console.log("Pose dependencies from G1 loaded!");
        //     // startPoseDetection();

        // } catch (err) {
        //     console.error("Failed to load pose dependencies", err);
        // }
    }

    initAnims() {
        this.anims.create({
            key: 'dino-run',
            frames: this.anims.generateFrameNumbers('dino', { start: 2, end: 3 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'dino-down-anim',
            frames: this.anims.generateFrameNumbers('dino-down', { start: 0, end: 1 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'enemy-dino-fly',
            frames: this.anims.generateFrameNumbers('enemy-bird', { start: 0, end: 1 }),
            frameRate: 6,
            repeat: -1
        });
    }

    initStartTrigger() {
        // const { width, height } = this.game.config;
        const height = 1000;
        const width = 340;
        this.physics.add.overlap(this.startTrigger, this.dino, () => {
            if (this.startTrigger.y === 10) {
                this.startTrigger.body.reset(0, height);
                return;
            }

            this.startTrigger.disableBody(true, true);

            const startEvent = this.time.addEvent({
                delay: 1000 / 60,
                loop: true,
                callbackScope: this,
                callback: () => {
                    this.dino.setVelocityX(80);
                    this.dino.play('dino-run', 1);

                    if (this.ground.width < width) {
                        this.ground.width += 17 * 2;
                    }

                    if (this.ground.width >= 1000) {
                        this.ground.width = width;
                        this.isGameRunning = true;
                        this.dino.setVelocityX(0);
                        this.scoreText.setAlpha(1);
                        this.environment.setAlpha(1);
                        startEvent.remove();
                    }
                }
            });
        }, null, this);
    }

    initColliders() {
        this.physics.add.collider(this.dino, this.obsticles, () => {
            this.highScoreText.x = this.scoreText.x + this.scoreText.width + 20;

            const highScore = this.highScoreText.text.substr(this.highScoreText.text.length - 5);
            const newScore = Number(this.scoreText.text) > Number(highScore) ? this.scoreText.text : highScore;

            this.highScoreText.setText('HI ' + newScore);
            this.highScoreText.setAlpha(1);

            this.physics.pause();
            this.isGameRunning = false;
            this.anims.pauseAll();
            this.dino.setTexture('dino-hurt');
            this.respawnTime = 0;
            this.gameSpeed = 10;
            this.gameOverScreen.setAlpha(1);
            this.score = 0;
            this.hitSound.play();
        }, null, this);
    }

    handleScore() {
        this.time.addEvent({
            delay: 1000 / 10,
            loop: true,
            callbackScope: this,
            callback: () => {
                if (!this.isGameRunning) return;

                this.score++;
                this.gameSpeed += 0.01;

                if (this.score % 100 === 0) {
                    this.reachSound.play();
                    this.tweens.add({
                        targets: this.scoreText,
                        duration: 100,
                        repeat: 3,
                        alpha: 0,
                        yoyo: true
                    });
                }

                const score = Array.from(String(this.score), Number);
                while (score.length < 5) score.unshift(0);

                this.scoreText.setText(score.join(''));
            }
        });
    }

    handleInputs() {
        this.restart.on('pointerdown', () => {
            this.dino.setVelocityY(0);
            this.dino.body.height = 92;
            this.dino.body.offset.y = 0;
            this.physics.resume();
            this.obsticles.clear(true, true);
            this.isGameRunning = true;
            this.gameOverScreen.setAlpha(0);
            this.anims.resumeAll();
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            if (!this.dino.body.onFloor() || this.dino.body.velocity.x > 0) return;

            this.jumpSound.play();
            this.dino.body.height = 92;
            this.dino.body.offset.y = 0;
            this.dino.setVelocityY(-1600);
            this.dino.setTexture('dino', 0);
        });

        this.input.on('pointerdown', () => {
            if (!this.dino.body.onFloor() || this.dino.body.velocity.x > 0) return;

            this.jumpSound.play();
            this.dino.body.height = 92;
            this.dino.body.offset.y = 0;
            this.dino.setVelocityY(-1600);
            this.dino.setTexture('dino', 0);
        });

        this.input.keyboard.on('keydown-DOWN', () => {
            if (!this.dino.body.onFloor() || !this.isGameRunning) return;

            this.isDucking = true;
            this.dino.setTexture('dino-down');
            this.dino.play('dino-down-anim');
            this.dino.setBodySize(44, 58);
            this.dino.body.offset.y = 34;
        });

        this.input.keyboard.on('keyup-DOWN', () => {
            if (!this.isGameRunning) return;

            this.isDucking = false;
            this.dino.setTexture('dino');
            this.dino.play('dino-run');
            this.dino.setBodySize(44, 92);
            this.dino.body.offset.y = 0;
        });
    }

    placeObsticle() {
        const obsticleNum = Math.floor(Math.random() * 7) + 1;
        const distance = Phaser.Math.Between(600, 900);

        let obsticle;
        if (obsticleNum > 6) {
            const enemyHeight = [20, 50];
            obsticle = this.obsticles.create(this.game.config.width + distance, this.game.config.height - enemyHeight[Math.floor(Math.random() * 2)], `enemy-bird`)
                .setOrigin(0, 1);
            obsticle.play('enemy-dino-fly', 1);
            obsticle.body.height = obsticle.body.height / 1.5;
        } else {
            obsticle = this.obsticles.create(this.game.config.width + distance, this.game.config.height, `obsticle-${obsticleNum}`)
                .setOrigin(0, 1);
            obsticle.body.offset.y = +10;
        }

        obsticle.setImmovable();
    }

    update(time, delta) {
        if (!this.isGameRunning) return;

        this.ground.tilePositionX += this.gameSpeed;
        Phaser.Actions.IncX(this.obsticles.getChildren(), -this.gameSpeed);
        Phaser.Actions.IncX(this.environment.getChildren(), -0.5);

        this.respawnTime += delta * this.gameSpeed * 0.08;
        if (this.respawnTime >= 1500) {
            this.placeObsticle();
            this.respawnTime = 0;
        }

        this.obsticles.getChildren().forEach(obsticle => {
            if (obsticle.getBounds().right < 0) {
                this.obsticles.killAndHide(obsticle);
            }
        });

        this.environment.getChildren().forEach(env => {
            if (env.getBounds().right < 0) {
                env.x = this.game.config.width + 30;
            }
        });

        if (this.dino.body.deltaAbsY() > 2) {
            this.dino.anims.stop();
            this.dino.setTexture('dino', 0);
        } else {
            this.dino.body.height <= 58
                ? this.dino.play('dino-down-anim', true)
                : this.dino.play('dino-run', true);
        }
    }
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

async function loadPoseDependencies() {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.js");
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/addons/p5.sound.min.js");
    await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core");
    await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter");
    await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm/dist/tf-backend-wasm.js");
    await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection");

    // Now load the pose logic (which assumes all above are ready)
    await loadScript("scripts/games/dino/g1_pose.js");

    // window.resizeGame()

    console.log("All pose dependencies from g1 loaded successfully!");
}
