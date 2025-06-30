export default class GameSelection extends Phaser.Scene {
    constructor() {
        super({ key: 'GameSelection' });
    }

    init(data) {
        this.selectedMode = data.modeIndex || 0;
        this.modeName = data.modeName || 'Game Mode';
        this.gamesByMode = {
            0: ['Dino Run (E)', 'Game 2', 'Game 3'],
            1: ['Dino Run (S)', 'Game 5', 'Game 6'],
            2: ['Game 7', 'Game 8', 'Game 9']
        };
        this.games = this.gamesByMode[this.selectedMode] || [];
        this.currentIndex = 0;
    }

    preload() {
        this.load.image('bg_lvl', 'assets/images/lvl_bg.png');
        this.load.image('btn_back', 'assets/images/game_mode/arrow_basic_w.png');
        this.load.image('btn_left', 'assets/images/game_mode/arrow_decorative_w.png');
        this.load.image('btn_right', 'assets/images/game_mode/arrow_decorative_e.png');
        this.load.image('icon_placeholder', 'assets/images/main_menu/btn_play.png');
        this.load.image('panel_bg', 'assets/images/game_mode/white_panel.png');
        this.load.audio('snd_click', 'assets/audio/click-b.ogg');
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;

        this.bg = this.add.image(0, 0, 'bg_lvl').setOrigin(0, 0).setDisplaySize(w, h);
        this.clickSound = this.sound.add('snd_click', { volume: 1 });

        // Back to Game Modes
        this.btnBack = this.add.image(0.07 * w, 0.07 * h, 'btn_back')
            .setOrigin(0.5)
            .setScale(0.6)
            .setInteractive({ useHandCursor: true });
        this.btnBack.on('pointerdown', () => {
            this.clickSound.play();
            this.scene.start('GameMode');
        });

        this.leftArrow = this.add.image(0.1 * w, h / 2, 'btn_left')
            .setInteractive({ useHandCursor: true })
            .setOrigin(0.5);
        this.leftArrow.on('pointerdown', () => this.switchGame(-1));

        this.rightArrow = this.add.image(0.9 * w, h / 2, 'btn_right')
            .setInteractive({ useHandCursor: true })
            .setOrigin(0.5);
        this.rightArrow.on('pointerdown', () => this.switchGame(1));

        const panelWidth = 0.4 * w;
        const panelHeight = 0.15 * h;
        const panelX = w / 2;
        const panelY = h / 2 - 100;

        this.panel = this.add.image(panelX, panelY, 'panel_bg')
            .setDisplaySize(panelWidth, panelHeight)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        this.panel.on('pointerdown', () => {
            this.clickSound.play();
            console.log(`User selected: ${this.games[this.currentIndex]}`);
            // Placeholder for future actual game start
            if (this.games[this.currentIndex] === 'Dino Run (E)') {
                // this.handleGame1Click();
                window.open('https://dino-g1.vercel.app', '_blank');
            } else if (this.games[this.currentIndex] === 'Dino Run (S)') {
                window.open('https://dino-g4.vercel.app', '_blank');
                // this.handleGame4Click();
            }
            else {
                console.log(`Starting game: ${this.games[this.currentIndex]}`);
            }
        });

        const iconSize = 0.1 * w;
        this.icon = this.add.image(panelX - panelWidth * 0.3, panelY, 'icon_placeholder')
            .setDisplaySize(iconSize, iconSize)
            .setOrigin(0.5);

        const fontSize = Math.round(0.03 * w);
        this.title = this.add.text(panelX + panelWidth * 0.05, panelY, '', {
            fontFamily: 'AudioWide',
            fontSize: `${fontSize}px`,
            color: '#000000',
        }).setOrigin(0.3, 0.5);

        const totalWidth = this.games.length * 40;
        const startX = w / 2 - totalWidth / 2;
        this.paginationDots = this.games.map((_, i) => {
            return this.add.circle(startX + i * 40, h - 50, 10, 0xffffff);
        });

        this.updateDisplay();
    }

    switchGame(dir) {
        const newIndex = this.currentIndex + dir;
        if (newIndex >= 0 && newIndex < this.games.length) {
            this.clickSound.play();
            this.currentIndex = newIndex;
            this.animateTransition();
        }
    }

    animateTransition() {
        this.tweens.add({
            targets: [this.title, this.icon, this.panel],
            alpha: 0,
            duration: 150,
            onComplete: () => {
                this.updateDisplay();
                this.tweens.add({
                    targets: [this.title, this.icon, this.panel],
                    alpha: 1,
                    duration: 150
                });
            }
        });
    }

    updateDisplay() {
        this.title.setText(this.games[this.currentIndex]);
        this.leftArrow.setAlpha(this.currentIndex === 0 ? 0.3 : 1);
        this.rightArrow.setAlpha(this.currentIndex === this.games.length - 1 ? 0.3 : 1);

        this.paginationDots.forEach((dot, i) => {
            dot.setFillStyle(i === this.currentIndex ? 0xffffff : 0x888888);
        });
    }
    handleGame1Click() {
        if (!this.scene.get('DinoScene')) {
            this.scene.add('DinoScene', new DinoScene());
        }
        this.scene.transition({
            target: 'DinoScene',
            duration: 500,
            moveAbove: true
        });
    }

    handleGame4Click() {
        if (!this.scene.get('OldDinoScene')) {
            this.scene.add('OldDinoScene', new window.DinoScene());
        }
        this.scene.transition({
            target: 'OldDinoScene',
            duration: 500,
            moveAbove: true
        });
    }

}
