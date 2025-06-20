export default class GameMode extends Phaser.Scene {
    constructor() {
        super({ key: 'GameMode' });
        this.modes = ['Game Mode 1', 'Game Mode 2', 'Game Mode 3', 'Game Mode 4'];
        this.currentIndex = 0;
    }

    preload() {
        this.load.image('bg', 'assets/images/menu_bg.png');
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

        this.isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        this.isMobileLandscape = this.isMobile && w > h;

        this.bg = this.add.image(0, 0, 'bg').setOrigin(0, 0).setDisplaySize(w, h);
        this.clickSound = this.sound.add('snd_click', { volume: 1 });

        // Back button
        this.btnBack = this.add.image(0.07 * w, 0.07 * h, 'btn_back')
            .setOrigin(0.5)
            .setScale(0.6)
            .setInteractive({ useHandCursor: true });
        this.btnBack.on('pointerdown', () => {
            this.clickSound.play();
            this.scene.start('MainMenu');
        });

        // Arrows
        this.leftArrow = this.add.image(0.1 * w, h / 2, 'btn_left')
            .setInteractive({ useHandCursor: true })
            .setOrigin(0.5);
        this.leftArrow.on('pointerdown', () => this.switchMode(-1));

        this.rightArrow = this.add.image(0.9 * w, h / 2, 'btn_right')
            .setInteractive({ useHandCursor: true })
            .setOrigin(0.5);
        this.rightArrow.on('pointerdown', () => this.switchMode(1));

        // === Responsive Panel ===
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
            this.scene.start('GameSelection', {
                modeIndex: this.currentIndex,
                modeName: this.modes[this.currentIndex]
            });
        });
            

        // === Responsive Icon ===
        const iconSize = 0.1 * w; // 10% of screen width
        this.icon = this.add.image(panelX - panelWidth * 0.3, panelY, 'icon_placeholder')
            .setDisplaySize(iconSize, iconSize)
            .setOrigin(0.5);

        // === Responsive Title ===
        const fontSize = Math.round(0.03 * w); // ~4.5% of screen width
        this.title = this.add.text(panelX + panelWidth * 0.05, panelY, '', {
            fontFamily: 'CustomFont',
            fontSize: `${fontSize}px`,
            color: '#000000',
            fontStyle: 'bold',
        }).setOrigin(0.3, 0.5); // Left-aligned in panel

        // Pagination Dots
        const totalWidth = this.modes.length * 40;
        const startX = w / 2 - totalWidth / 2;
        this.paginationDots = this.modes.map((_, i) => {
            return this.add.circle(startX + i * 40, h - 50, 10, 0xffffff);
        });

        this.updateDisplay();
    }

    switchMode(dir) {
        const newIndex = this.currentIndex + dir;
        if (newIndex >= 0 && newIndex < this.modes.length) {
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
        this.title.setText(this.modes[this.currentIndex]);
        this.leftArrow.setAlpha(this.currentIndex === 0 ? 0.3 : 1);
        this.rightArrow.setAlpha(this.currentIndex === this.modes.length - 1 ? 0.3 : 1);

        this.paginationDots.forEach((dot, i) => {
            dot.setFillStyle(i === this.currentIndex ? 0xffffff : 0x888888);
        });
    }
}
