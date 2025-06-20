/// <reference path="phaser.d.ts" />

export default class MainMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenu' });
    }

    /** Preload all visual and audio assets */
    preload() {
        this.load.image('bg', 'assets/images/menu_bg.png');
        this.load.image('btn_play', 'assets/images/main_menu/btn_play.png');
        this.load.image('btn_leaderboard', 'assets/images/main_menu/btn_ld.png');
        this.load.image('btn_settings', 'assets/images/main_menu/btn_settings.png');

        this.load.audio('snd_click', 'assets/audio/click-b.ogg');
    }

    /** Create background, buttons, and set up resize handling */
    create() {

        this.bg = this.add
            .image(0, 0, 'bg')
            .setOrigin(0, 0)
            .setDisplaySize(this.scale.width, this.scale.height);

        this.clickSound = this.sound.add('snd_click', { volume: 1 });

        // Button definitions: key, display scale, and callback
        this.buttonDefs = [
            { key: 'btn_leaderboard', scale: 0.6, callback: () => console.log('Leaderboards pressed') },
            {
                key: 'btn_play',
                scale: 1.0,
                callback: () => {
                    console.log('Play pressed');

                    // if (!document.fullscreenElement) {
                    //     document.documentElement.requestFullscreen().catch(err => {
                    //         console.warn('Fullscreen request failed:', err);
                    //     });
                    // }
                    this.scene.transition({
                        target: 'GameMode',
                        duration: 500,
                        moveAbove: true,
                        onUpdate: (progress) => {
                            // Optional: you could animate UI here if needed
                        }
                    });

                }
            },

            { key: 'btn_settings', scale: 0.6, callback: () => console.log('Settings pressed') }
        ];

        this.buttons = this.buttonDefs.map(def => this.createButton(def));

        this.layoutButtons();

        this.scale.on('resize', this.handleResize, this);
    }

    createButton(def) {
        const btn = this.add
            .image(0, 0, def.key)
            .setScale(def.scale)
            .setInteractive({ useHandCursor: true });

        btn.on('pointerdown', () => {
            this.clickSound.play();

            const w = this.scale.width;
            const h = this.scale.height;
            const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
            const isMobileLandscape = isMobile && w > h;

            const shrinkFactor = isMobileLandscape ? 0.85 : 0.8;

            const currentScaleX = btn.scaleX;
            const currentScaleY = btn.scaleY;

            this.tweens.add({
                targets: btn,
                scaleX: currentScaleX * shrinkFactor,
                scaleY: currentScaleY * shrinkFactor,
                yoyo: true,
                duration: 120,
                ease: 'Quad.easeOut'
            });

            def.callback();
        });

        return btn;
    }



    layoutButtons() {
        const w = this.scale.width;
        const h = this.scale.height;
        const cx = w / 2;
        const cy = h / 2;
        const spacing = 180;

        const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        const isMobileLandscape = isMobile && w > h;
        console.log(`isMobileLandscape: ${isMobileLandscape}, width: ${w}, height: ${h}`);

        const playScale = isMobileLandscape ? 2.0 : 1.0;
        const sideScale = isMobileLandscape ? 1.2 : 0.6;

        this.buttons.forEach((btn, idx) => {
            const isCenter = idx === 1;
            const targetScale = isCenter ? playScale : sideScale;
            btn.setScale(targetScale);
            if (!isMobileLandscape) {
                btn.setPosition(cx + (idx - 1) * spacing, cy);
            }
            else {
                btn.setPosition(cx + (idx - 1) * (spacing + 180), cy);
            }
        });
    }


    handleResize(gameSize) {
        const { width, height } = gameSize;
        this.cameras.resize(width, height);
        this.bg.setDisplaySize(width, height);
        this.layoutButtons();
    }
}

// --- Phaser game configuration ---
// const DPR = window.devicePixelRatio || 1;
// const baseWidth = 1280;
// const baseHeight = 720;
// const scaleFactor = window.devicePixelRatio || 1;



function isPortrait() {
    return window.innerHeight > window.innerWidth;
}

function handleOrientation() {
    const notice = document.getElementById('rotate-notice');
    const canvas = document.querySelector('canvas');

    if (isPortrait()) {
        notice.style.display = 'flex';
        canvas.style.display = 'none';
    } else {
        notice.style.display = 'none';
        canvas.style.display = 'block';
    }
}

const width = window.innerWidth;
const height = window.innerHeight;
console.log('super og from game.js Window size:', width, height);
window.resizeGame = function () {
    // With DPR
    handleOrientation();
    const canvas = document.querySelector('canvas');
    const dpr = window.devicePixelRatio || 1;

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    game.scale.resize(width * dpr, height * dpr)
    // console.log('DPR', dpr, 'Width:', width, 'Height:', height, 'Width*dpr:', width * dpr, 'Height*dpr:', height *dpr);
};

// window.resizeGameNoDPR = function () {
//     // Without DPR
//     handleOrientation();
//     const canvas = document.querySelector('canvas');
//     // const width = window.innerWidth;
//     // const height = window.innerHeight;
//     const dpr = window.devicePixelRatio || 1;

//     canvas.style.width = `${width}px`;
//     canvas.style.height = `${height}px`;

//     game.scale.resize(window.innerWidth, window.innerHeight);
//     console.log('DPR from nodpr func', dpr, 'Width:', width, 'Height:', height, 'Width*dpr:', width * dpr, 'Height*dpr:', height * dpr);
// };


window.addEventListener('resize', resizeGame);
window.addEventListener('orientationchange', resizeGame);
window.addEventListener('load', resizeGame);
