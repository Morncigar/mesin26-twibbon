/* =================================================_
   NOW PLAYING — MESIN ’26 | Client-Side Image Compositor (4:5 Version)
   ================================================= */

const FRAME_URL = "assets/frame-final.png";
const EXPORT_WIDTH = 1080;
const EXPORT_HEIGHT = 1350;

let userImage = null;
let frameImage = null;
let isFrameLoaded = false;

let imgX = 0;
let imgY = 0;
let imgScale = 1;

const imageLoader = document.getElementById('imageLoader');
const dropArea = document.getElementById('dropArea');
const fileMsg = document.getElementById('fileMsg');
const errorMsg = document.getElementById('errorMsg');
const canvas = document.getElementById('twibbonCanvas');
const ctx = canvas.getContext('2d');
const canvasPlaceholder = document.getElementById('canvasPlaceholder');
const zoomRange = document.getElementById('zoomRange');
const zoomVal = document.getElementById('zoomVal');
const btnDownload = document.getElementById('btnDownload');
const btnReset = document.getElementById('btnReset');

const btnMoveUp = document.getElementById('btnMoveUp');
const btnMoveDown = document.getElementById('btnMoveDown');
const btnMoveLeft = document.getElementById('btnMoveLeft');
const btnMoveRight = document.getElementById('btnMoveRight');

const btnCopyCaption = document.getElementById('btnCopyCaption');
const captionText = document.getElementById('captionText');

document.addEventListener('DOMContentLoaded', () => {
    initCanvasSize();
    loadFrameImage();
    setupEventListeners();
});

function initCanvasSize() {
    canvas.width = EXPORT_WIDTH;
    canvas.height = EXPORT_HEIGHT;
}

function loadFrameImage() {
    frameImage = new Image();
    frameImage.crossOrigin = "anonymous";
    frameImage.onload = () => {
        isFrameLoaded = true;
        if (userImage) redrawCanvas();
    };
    frameImage.onerror = () => {
        isFrameLoaded = false;
    };
    frameImage.src = FRAME_URL;
}

function setupEventListeners() {
    imageLoader.addEventListener('change', handleFileSelect);

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropArea.style.borderColor = 'var(--accent-orange)';
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropArea.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        }, false);
    });

    dropArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files[0]) {
            imageLoader.files = files;
            handleFileSelect({ target: imageLoader });
        }
    });

    zoomRange.addEventListener('input', (e) => {
        if (!userImage) return;
        const targetScalePercent = parseInt(e.target.value);
        zoomVal.textContent = targetScalePercent + '%';
        
        // Update base scale calculation for width and height separately
        const baseScale = Math.max(EXPORT_WIDTH / userImage.width, EXPORT_HEIGHT / userImage.height);
        imgScale = baseScale * (targetScalePercent / 100);
        redrawCanvas();
    });

    const step = 30;
    btnMoveUp.addEventListener('click', () => { if(userImage) { imgY -= step; redrawCanvas(); } });
    btnMoveDown.addEventListener('click', () => { if(userImage) { imgY += step; redrawCanvas(); } });
    btnMoveLeft.addEventListener('click', () => { if(userImage) { imgX -= step; redrawCanvas(); } });
    btnMoveRight.addEventListener('click', () => { if(userImage) { imgX += step; redrawCanvas(); } });

    btnReset.addEventListener('click', () => {
        if (!userImage) return;
        resetImageTransform();
        redrawCanvas();
    });

    const container = document.getElementById('canvasContainer');
    let pointerDown = false;
    let lastX = 0;
    let lastY = 0;

    container.addEventListener('pointerdown', (e) => {
        if (!userImage) return;
        pointerDown = true;
        lastX = e.clientX;
        lastY = e.clientY;
        container.setPointerCapture(e.pointerId);
    });

    container.addEventListener('pointermove', (e) => {
        if (!pointerDown || !userImage) return;
        const deltaX = e.clientX - lastX;
        const deltaY = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;

        const rect = container.getBoundingClientRect();
        // Width is used as the base reference for translation scale factor
        const scaleFactor = EXPORT_WIDTH / rect.width;

        imgX += deltaX * scaleFactor;
        imgY += deltaY * scaleFactor;
        redrawCanvas();
    });

    container.addEventListener('pointerup', (e) => {
        pointerDown = false;
        try { container.releasePointerCapture(e.pointerId); } catch(err) {}
    });

    btnDownload.addEventListener('click', handleDownload);

    btnCopyCaption.addEventListener('click', () => {
        const textToCopy = captionText.textContent;
        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalHTML = btnCopyCaption.innerHTML;
            btnCopyCaption.innerHTML = `<span>COPIED ✓</span>`;
            btnCopyCaption.style.backgroundColor = 'var(--accent-orange)';
            setTimeout(() => {
                btnCopyCaption.innerHTML = originalHTML;
                btnCopyCaption.style.backgroundColor = '';
            }, 2500);
        });
    });
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    hideError();
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        showError("PLEASE UPLOAD A VALID IMAGE FILE (JPG, PNG, WEBP).");
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        showError("FILE SIZE TOO LARGE. MAXIMUM SIZE IS 10MB.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            userImage = img;
            canvasPlaceholder.classList.add('hidden');
            btnDownload.removeAttribute('disabled');
            fileMsg.querySelector('span').textContent = file.name.toUpperCase();
            resetImageTransform();
            redrawCanvas();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function resetImageTransform() {
    if (!userImage) return;
    const baseScale = Math.max(EXPORT_WIDTH / userImage.width, EXPORT_HEIGHT / userImage.height);
    imgScale = baseScale;
    imgX = (EXPORT_WIDTH - (userImage.width * imgScale)) / 2;
    imgY = (EXPORT_HEIGHT - (userImage.height * imgScale)) / 2;
    zoomRange.value = 100;
    zoomVal.textContent = '100%';
}

function redrawCanvas() {
    ctx.clearRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);
    ctx.fillStyle = '#041E41';
    ctx.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);

    if (userImage) {
        ctx.save();
        ctx.translate(imgX, imgY);
        ctx.scale(imgScale, imgScale);
        ctx.drawImage(userImage, 0, 0);
        ctx.restore();
    }

    if (isFrameLoaded && frameImage) {
        ctx.drawImage(frameImage, 0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);
    } else {
        ctx.strokeStyle = '#FF4D00';
        ctx.lineWidth = 16;
        ctx.strokeRect(8, 8, EXPORT_WIDTH - 16, EXPORT_HEIGHT - 16);
    }
}

function handleDownload() {
    if (!userImage) {
        showError("PLEASE UPLOAD A PHOTO FIRST.");
        return;
    }
    redrawCanvas();
    canvas.toBlob((blob) => {
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const filename = `MESIN26-TWIBBON-${timestamp}.png`;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 'image/png', 1.0);
}

function showError(message) {
    errorMsg.textContent = message;
    errorMsg.onerror = null;
    errorMsg.classList.remove('hidden');
}

function hideError() {
    errorMsg.classList.add('hidden');
}
