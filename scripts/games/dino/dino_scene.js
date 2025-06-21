/// <reference path="C:/Users/ME/Desktop/levelsbug/phaser.d.ts" />
// window.DinoScene = class DinoScene extends Phaser.Scene {
export default class OldDinoScene extends Phaser.Scene {
    constructor() {
        super({ key: 'OldDinoScene' });
        this.score = 0;
        this.gameSpeed = 200;
    }

    preload() {
        this.load.image("ground", "https://labs.phaser.io/assets/sprites/platform.png");
        this.load.spritesheet("dino", "https://labs.phaser.io/assets/sprites/dude.png", {
            frameWidth: 32,
            frameHeight: 48
        });
        this.load.image("cactus", "https://labs.phaser.io/assets/sprites/star.png");
        this.load.image("cloud", "assets/games/dino/images/cloud.png");
    }

    async create() {
        this.cameras.main.setBackgroundColor('#eeeeee');
        this.score = 0;
        this.gameSpeed = 200;
        this.isGameOver = false;

        // this.ground = this.add.tileSprite(this.scale.width / 2, this.scale.height - 32, this.scale.width, 64, "ground");
        this.ground = this.add.tileSprite(this.scale.width / 2, this.scale.height - 32*2, this.scale.width, 128*2, "ground");
        this.physics.add.existing(this.ground, true);

        this.dino = this.physics.add.sprite(250, this.scale.height -80, "dino").setGravityY(1000);
        this.dino.setScale(3);
        this.dino.setCollideWorldBounds(true);
        this.dino.body.setSize(this.dino.width * 0.8, this.dino.height * 0.8);
        this.dino.flipX = true;

        this.anims.create({
            key: "run",
            frames: this.anims.generateFrameNumbers("dino", { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
        this.dino.anims.play("run");

        this.obstacles = this.physics.add.group();
        this.clouds = this.add.group();

        this.physics.add.collider(this.dino, this.ground);
        // this.dino.y += 100;
        this.physics.add.overlap(this.dino, this.obstacles, this.handleGameOver, null, this);

        this.scoreText = this.add.text(16, 16, "Score: 0", {
            fontSize: "70px",
            fill: "#000",
            fontStyle: "bold"
        });

        this.input.keyboard.on("keydown-SPACE", this.jump, this);

        this.obstacleTimer = this.time.addEvent({
            delay: 10000,
            callback: this.spawnObstacle,
            callbackScope: this,
            loop: true
        });

        this.cloudTimer = this.time.addEvent({
            delay: 2000,
            callback: this.spawnCloud,
            callbackScope: this,
            loop: true
        });


        try {
            await loadPoseDependencies();
            console.log("Pose dependencies loaded!");
            // window.resizeGameNoDPR()
            startPoseDetection();

        } catch (err) {
            console.error("Failed to load pose dependencies", err);
        }



    }

    update(time, delta) {

        if (this.isGameOver) return;

        this.ground.tilePositionX += this.gameSpeed * (delta / 1000);
        this.score += delta * 0.01;
        this.scoreText.setText("Score: " + Math.floor(this.score));
        this.gameSpeed += delta * 0.001;

        this.obstacles.getChildren().forEach(ob => { if (ob.x < -ob.width) ob.destroy(); });
        this.clouds.getChildren().forEach(cloud => { if (cloud.x < -cloud.width) cloud.destroy(); });
    }

    jump() {
        if (!this.isGameOver && this.dino.body.touching.down) {
            this.dino.setVelocityY(-450);
        }
    }

    spawnObstacle() {
        // const obstacle = this.obstacles.create(this.scale.width + 50, this.scale.height - 90, "cactus");
        // obstacle.setScale(0.5).setVelocityX(-this.gameSpeed).setImmovable(true);
        // obstacle.body.setAllowGravity(false);

        if (this.isGameOver) return;
        const obstacle = this.obstacles.create(
            this.scale.width + 50,
            this.scale.height - 90,
            "cactus"
        );
        obstacle.setScale(0.5);
        obstacle.body.setAllowGravity(false);
        obstacle.setVelocityX(-this.gameSpeed);
        const newWidth = obstacle.width * 0.8;
        const newHeight = obstacle.height * 0.8;
        obstacle.body.setSize(newWidth, newHeight);
    }

    spawnCloud() {
        if (this.isGameOver) return;
        const cloudY = Phaser.Math.Between(50, 150);
        const cloud = this.add.image(this.scale.width + 100, cloudY, "cloud");
        cloud.setAlpha(0.8);
        this.tweens.add({
            targets: cloud,
            x: -100,
            duration: 15000,
            ease: "Linear",
            onComplete: () => { cloud.destroy(); }
        });
        this.clouds.add(cloud);
    }

    handleGameOver() {
        this.isGameOver = true;
        this.physics.pause();
        this.dino.anims.pause();
        this.add.text(this.scale.width / 2, this.scale.height / 2, "GAME OVER", {
            fontSize: "100px",
            fill: "#f00",
            fontStyle: "bold"
        }).setOrigin(0.5);
        this.input.keyboard.once("keydown-SPACE", () => this.scene.restart());
        this.input.on("pointerdown", () => {
            if (this.isGameOver) this.scene.restart();
        });
    }


    showPauseText(text) {
        if (this.pauseText) { this.pauseText.destroy(); }
        this.pauseText = this.add.text(
            this.scale.width / 2,
            this.scale.height / 2 - 80,
            text, {
            fontSize: "80px",
            fill: "#0077ff",
            fontStyle: "bold"
        }
        );
        this.pauseText.setOrigin(0.5);
    }

    fadeOutPauseText(duration = 1000) {
        if (this.pauseText) {
            this.tweens.add({
                targets: this.pauseText,
                alpha: 0,
                duration: duration,
                onComplete: () => { this.pauseText.destroy(); this.pauseText = null; }
            });
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
    await loadScript("scripts/games/dino/g4_pose.js");
    
    // window.resizeGame()

    console.log("All pose dependencies loaded successfully!");
}



