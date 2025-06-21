"use strict";

// let detector;
// let detectorConfig;
// let poses = [];
// let video;
// let skeleton = true;

// let reps = 0;
// let elbowAngle = 999;
// let backAngle = 0;
// let upPosition = false;
// let downPosition = false;
// let highlightBack = false;
// let backWarningGiven = false;

// let pauseGestureActive = false;
// let gamePaused = false;
// let lastToggleTime = 0;
// const TOGGLE_COOLDOWN = 2000;
// let cameraError = false;
// let videoRetryStartTime = 0;
// let edges;

// Main function to start pose detection
function startPoseDetection() {
    new p5((p) => {
        let detector;
        let detectorConfig;
        let poses = [];
        let video;
        let skeleton = true;

        let reps = 0;
        let elbowAngle = 999;
        let backAngle = 0;
        let upPosition = false;
        let downPosition = false;
        let highlightBack = false;
        let backWarningGiven = false;

        let pauseGestureActive = false;
        let gamePaused = false;
        let lastToggleTime = 0;
        const TOGGLE_COOLDOWN = 2000;
        let cameraError = false;
        let videoRetryStartTime = 0;
        let edges;

        async function initPoseDetector() {
            console.log("Initializing MoveNet...");
            await tf.setBackend('wasm');
            await tf.ready();
            detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING };
            detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
            edges = {
                '5,7': 'm', '7,9': 'm',
                '6,8': 'c', '8,10': 'c',
                '5,6': 'y', '5,11': 'm',
                '6,12': 'c', '11,12': 'y',
                '11,13': 'm', '13,15': 'm',
                '12,14': 'c', '14,16': 'c'
            };
            console.log("MoveNet Loaded Successfully!");
            getPoses();
        }

        async function getPoses() {
            if (!video.elt || video.elt.videoWidth === 0 || video.elt.videoHeight === 0) {
                if (videoRetryStartTime === 0) { videoRetryStartTime = p.millis(); }
                if (p.millis() - videoRetryStartTime > 3000) { cameraError = true; }
                setTimeout(getPoses, 100);
                return;
            } else {
                videoRetryStartTime = 0;
            }
            poses = await detector.estimatePoses(video.elt);
            setTimeout(getPoses, 0);
        }

        p.setup = function () {
            // const baseWidth = 1280;
            // const baseHeight = 720;
            // const scaleFactor = window.devicePixelRatio || 1;
            const msg = new SpeechSynthesisUtterance('Loading, please wait...');
            window.speechSynthesis.speak(msg);
            console.log('og window widht and height windowInner',   window.innerWidth, window.innerHeight);
            console.log('og window widht and height p ',p.width, p.height);
            let canvasWidth = window.innerWidth * 0.25;
            let canvasHeight = (canvasWidth * 3) / 4;
            let canvas = p.createCanvas(canvasWidth, canvasHeight);
            canvas.id("pushupCanvas");

            // // Apply CSS styles directly to the canvas
            // const canvasElement = document.getElementById("pushupCanvas");
            // if (canvasElement) {
            //     canvasElement.style.position = "absolute";
            //     canvasElement.style.top = "10px";
            //     canvasElement.style.right = "10px";
            //     canvasElement.style.border = "2px solid #333";
            //     canvasElement.style.zIndex = "10";
            //     canvasElement.style.height = `${canvasHeight}px`;
            //     canvasElement.style.width = `${canvasWidth}px`;
            // }
            console.log('Canvas size after css:', canvasWidth, canvasHeight);
            // video = p.createCapture(p.VIDEO, () => { console.log("Video ready"); });
            let constraints = {
                video: {
                    mandatory: {
                        minWidth: canvasWidth,
                        minHeight: canvasHeight
                    },
                },
                audio: false
              };
            video = p.createCapture(constraints, () => { console.log("Video ready"); });
            // video.size(640, 480);
            // video.size(canvasWidth, canvasHeight); // experiment with this
            video.hide();

            video.elt.addEventListener('error', (err) => {
                console.error("Error accessing camera", err);
                cameraError = true;
            });

            video.elt.addEventListener('loadedmetadata', () => {
                // video.elt.videoWidth = canvasWidth
                // video.elt.videoHeight = canvasHeight
                console.log('Video metadata loaded:', video.elt.videoWidth, video.elt.videoHeight);
                console.log('Window size:', p.width, p.height);
                console.log('Canvas size:', canvasWidth, canvasHeight);
                // video.size(canvasWidth, canvasHeight);
                initPoseDetector();
            });
            // video.size(canvasWidth, canvasHeight);

            enforceLandscapeForPose();
        };

        p.windowResized = function () {
            // const baseWidth = 1280;
            // const baseHeight = 720;
            // const scaleFactor = window.devicePixelRatio || 1;
            // let canvasWidth = video.elt.videoWidth * 0.25;
            let canvasWidth = window.innerWidth * 0.25;
            let canvasHeight = (canvasWidth * 3) / 4;
            p.resizeCanvas(canvasWidth, canvasHeight);
            video.size(canvasWidth, canvasHeight);
            enforceLandscapeForPose();
        };

        p.draw = function () {
            p.background(220);
            p.push();
            p.translate(p.width, 0);
            p.scale(-1, 1);
            p.image(video, 0, 0, p.width, p.height);
            drawKeypoints();
            if (skeleton) { drawSkeleton(); }
            p.pop();

            p.fill(255, 0, 0);
            p.strokeWeight(2);
            p.stroke(51);
            p.textSize(20);

            if (poses && poses.length > 0) {
                p.text(`Push-ups completed: ${reps}`, 10, 30);
            } else {
                p.text('Loading, please wait...', 10, 30);
            }

            checkPauseGesture();

            if (cameraError) {
                p.push();
                p.fill(255, 0, 0);
                p.noStroke();
                p.textSize(24);
                p.textAlign(p.CENTER, p.CENTER);
                p.text("Camera access denied.\nPlease allow camera access to run the app.", p.width / 2, p.height / 2);
                p.pop();
            }
        };

        function drawKeypoints() {
            let count = 0;
            const xRatio = p.width / video.elt.videoWidth;
            const yRatio = p.height / video.elt.videoHeight;

            if (poses && poses.length > 0) {
                for (let kp of poses[0].keypoints) {
                    const { x, y, score } = kp;
                    if (score > 0.3) {
                        count++;
                        p.fill(255);
                        p.stroke(0);
                        p.strokeWeight(4);
                        p.circle(x * xRatio, y * yRatio, 16);
                    }
                }

                updateArmAngle();
                updateBackAngle();
                checkUpPosition();
                checkDownPosition();
            }
        }

        function drawSkeleton() {
            const confidence_threshold = 0.5;
            const xRatio = p.width / video.elt.videoWidth;
            const yRatio = p.height / video.elt.videoHeight;

            if (poses && poses.length > 0) {
                for (const [key] of Object.entries(edges)) {
                    const parts = key.split(",");
                    const p1 = parseInt(parts[0]);
                    const p2 = parseInt(parts[1]);
                    const kp1 = poses[0].keypoints[p1];
                    const kp2 = poses[0].keypoints[p2];

                    if (kp1.score > confidence_threshold && kp2.score > confidence_threshold) {
                        if (highlightBack && (
                            parts[1] === "11" ||
                            (parts[0] === "6" && parts[1] === "12") ||
                            parts[1] === "13" ||
                            parts[0] === "12"
                        )) {
                            p.strokeWeight(3);
                            p.stroke('rgb(255, 0, 0)');
                        } else {
                            p.strokeWeight(2);
                            p.stroke('rgb(0, 255, 0)');
                        }
                        p.line(kp1.x * xRatio, kp1.y * yRatio, kp2.x * xRatio, kp2.y * yRatio);
                    }
                }
            }
        }

        function updateArmAngle() {
            const leftWrist = poses[0].keypoints[9];
            const leftShoulder = poses[0].keypoints[5];
            const leftElbow = poses[0].keypoints[7];

            let angle = (Math.atan2(leftWrist.y - leftElbow.y, leftWrist.x - leftElbow.x) -
                Math.atan2(leftShoulder.y - leftElbow.y, leftShoulder.x - leftElbow.x)) * (180 / Math.PI);

            if (leftWrist.score > 0.3 && leftElbow.score > 0.3 && leftShoulder.score > 0.3) {
                elbowAngle = angle;
            }
        }

        function updateBackAngle() {
            const leftShoulder = poses[0].keypoints[5];
            const leftHip = poses[0].keypoints[11];
            const leftKnee = poses[0].keypoints[13];

            let angle = (Math.atan2(leftKnee.y - leftHip.y, leftKnee.x - leftHip.x) -
                Math.atan2(leftShoulder.y - leftHip.y, leftShoulder.x - leftHip.x)) * (180 / Math.PI);
            angle = angle % 180;

            if (leftKnee.score > 0.3 && leftHip.score > 0.3 && leftShoulder.score > 0.3) {
                backAngle = angle;
            }

            if (backAngle < 20 || backAngle > 160) {
                highlightBack = false;
            } else {
                highlightBack = true;
                if (!backWarningGiven) {
                    const msg = new SpeechSynthesisUtterance('Keep your back straight');
                    window.speechSynthesis.speak(msg);
                    backWarningGiven = true;
                }
            }
        }

        function checkUpPosition() {
            if (elbowAngle > 170 && elbowAngle < 200) {
                if (downPosition === true) {
                    reps++;
                    const msg = new SpeechSynthesisUtterance(`${reps}`);
                    window.speechSynthesis.speak(msg);
                    if (window.triggerDinoJump) { window.triggerDinoJump(); }
                }
                upPosition = true;
                downPosition = false;

                if (downPosition === false && upPosition === true) {
                    p.push();
                    p.translate(p.width, 0);
                    p.scale(-1, 1);
                    p.fill(255, 0, 0);
                    p.noStroke();
                    p.textSize(24);
                    p.text(`Push-up positon: Up`, 10, 200);
                    p.pop();
                }
            }
        }

        function checkDownPosition() {
            if (!highlightBack && (Math.abs(elbowAngle) > 70 && Math.abs(elbowAngle) < 100)) {
                downPosition = true;
                upPosition = false;

                if (downPosition === true && upPosition === false) {
                    p.push();
                    p.translate(p.width, 0);
                    p.scale(-1, 1);
                    p.fill(255, 0, 0);
                    p.noStroke();
                    p.textSize(24);
                    p.text(`Push-up positon: Down`, 10, 200);
                    p.pop();
                }
            }
        }

        function checkPauseGesture() {
            if (!poses || poses.length === 0) return;

            let pose = poses[0];
            let currentTime = p.millis();
            let leftShoulder = pose.keypoints[5];
            let leftElbow = pose.keypoints[7];
            let leftWrist = pose.keypoints[9];
            let leftEye = pose.keypoints[1];
            let rightShoulder = pose.keypoints[6];
            let rightElbow = pose.keypoints[8];
            let rightWrist = pose.keypoints[10];
            let rightEye = pose.keypoints[2];

            let leftValid = false;
            let rightValid = false;

            if (leftShoulder.score > 0.3 && leftElbow.score > 0.3 &&
                leftWrist.score > 0.3 && leftEye.score > 0.3) {
                let leftAngle = (Math.atan2(leftWrist.y - leftElbow.y, leftWrist.x - leftElbow.x) -
                    Math.atan2(leftShoulder.y - leftElbow.y, leftShoulder.x - leftElbow.x)) * (180 / Math.PI);
                if (leftAngle < 0) { leftAngle += 360; }
                if (leftAngle > 165 &&
                    leftWrist.y < leftElbow.y && leftElbow.y < leftShoulder.y &&
                    leftWrist.y < leftEye.y && leftElbow.y < leftEye.y) {
                    leftValid = true;
                }
            }

            if (rightShoulder.score > 0.3 && rightElbow.score > 0.3 &&
                rightWrist.score > 0.3 && rightEye.score > 0.3) {
                let rightAngle = (Math.atan2(rightWrist.y - rightElbow.y, rightWrist.x - rightElbow.x) -
                    Math.atan2(rightShoulder.y - rightElbow.y, rightShoulder.x - rightElbow.x)) * (180 / Math.PI);
                if (rightAngle < 0) { rightAngle += 360; }
                if (rightAngle > 165 &&
                    rightWrist.y < rightElbow.y && rightElbow.y < rightShoulder.y &&
                    rightWrist.y < rightEye.y && rightElbow.y < rightEye.y) {
                    rightValid = true;
                }
            }

            // Check if game object exists before using it
            if (typeof game !== 'undefined' && game.scene && game.scene.keys && game.scene.keys["DinoGame"]) {
                let currentScene = game.scene.keys["DinoGame"];

                if (currentScene.isGameOver) {
                    if ((leftValid || rightValid) && !pauseGestureActive &&
                        (currentTime - lastToggleTime > TOGGLE_COOLDOWN)) {
                        console.log("Game restarted via Gesture");
                        currentScene.scene.restart();
                        lastToggleTime = currentTime;
                        pauseGestureActive = true;
                    } else if (!leftValid && !rightValid) {
                        pauseGestureActive = false;
                    }
                    return;
                }

                if ((leftValid || rightValid) && !pauseGestureActive &&
                    (currentTime - lastToggleTime > TOGGLE_COOLDOWN)) {
                    if (!gamePaused) {
                        game.scene.pause("DinoGame");
                        gamePaused = true;
                        console.log("Game Paused via Gesture");
                        currentScene.showPauseText("Game Paused");
                    } else {
                        game.scene.resume("DinoGame");
                        gamePaused = false;
                        console.log("Game Resumed via Gesture");
                        currentScene.showPauseText("Game Resumed");
                        currentScene.fadeOutPauseText(1000);
                    }
                    lastToggleTime = currentTime;
                    pauseGestureActive = true;
                }
            }

            if (!leftValid && !rightValid) {
                pauseGestureActive = false;
            }
        }
    });
}

function enforceLandscapeForPose() {
    const canvas = document.getElementById("pushupCanvas");
    if (!canvas) return;

    if (window.innerWidth < window.innerHeight) {
        canvas.style.transform = "rotate(90deg)";
        canvas.style.transformOrigin = "center center";
    } else {
        canvas.style.transform = "";
    }
}

window.addEventListener("resize", enforceLandscapeForPose);
window.addEventListener("orientationchange", enforceLandscapeForPose);