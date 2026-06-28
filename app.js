// PhotoBox Application
class PhotoBox {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.framePreview = document.getElementById('framePreview');
        
        this.currentFilter = 'none';
        this.currentFrame = 'classic';
        this.stickers = [];
        this.photoTaken = false;
        this.currentPhoto = null;
        this.animationId = null;
        
        this.initializeCamera();
        this.setupEventListeners();
        this.startLivePreview();
    }

    // Initialize camera
    async initializeCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false
            });
            this.video.srcObject = stream;
            this.video.onloadedmetadata = () => {
                this.video.play();
            };
        } catch (error) {
            console.error('Camera error:', error);
            alert('Tidak bisa mengakses kamera. Pastikan Anda sudah memberikan permission.');
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Capture button
        document.getElementById('captureBtn').addEventListener('click', () => this.capturePhoto());
        document.getElementById('retakeBtn').addEventListener('click', () => this.retakePhoto());

        // Download & Print
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadPhoto());
        document.getElementById('printBtn').addEventListener('click', () => this.printPhoto());
        document.getElementById('qrcodeBtn').addEventListener('click', () => this.generateQRCode());

        // Sliders
        document.getElementById('zoomSlider').addEventListener('input', (e) => this.updateZoom(e.target.value));
        document.getElementById('positionX').addEventListener('input', () => this.updateVideo());
        document.getElementById('positionY').addEventListener('input', () => this.updateVideo());
        document.getElementById('brightness').addEventListener('input', () => this.updateLivePreview());
        document.getElementById('contrast').addEventListener('input', () => this.updateLivePreview());
        document.getElementById('saturation').addEventListener('input', () => this.updateLivePreview());

        // Checkboxes
        document.getElementById('mirrorMode').addEventListener('change', () => this.updateVideo());
        document.getElementById('liveMode').addEventListener('change', () => this.updateVideo());
    }

    // Update camera zoom and position
    updateZoom(value) {
        document.getElementById('zoomValue').textContent = value + '%';
        this.updateVideo();
    }

    updateVideo() {
        const zoom = document.getElementById('zoomSlider').value / 100;
        const posX = document.getElementById('positionX').value;
        const posY = document.getElementById('positionY').value;
        const mirror = document.getElementById('mirrorMode').checked;

        let transforms = [];
        if (mirror) transforms.push('scaleX(-1)');
        transforms.push(`scale(${zoom})`);
        transforms.push(`translate(${posX}px, ${posY}px)`);

        this.video.style.transform = transforms.join(' ');
        this.updateLivePreview();
    }

    // Start live preview with filters
    startLivePreview() {
        const preview = () => {
            if (!this.photoTaken && document.getElementById('liveMode').checked) {
                this.canvas.width = this.video.videoWidth || 640;
                this.canvas.height = this.video.videoHeight || 480;

                // Draw video ke canvas
                this.ctx.drawImage(this.video, 0, 0);

                // Apply mirror if enabled
                if (document.getElementById('mirrorMode').checked) {
                    this.ctx.save();
                    this.ctx.translate(this.canvas.width, 0);
                    this.ctx.scale(-1, 1);
                    this.ctx.drawImage(this.video, 0, 0);
                    this.ctx.restore();
                }

                // Apply filter real-time
                this.applyFilterToCanvasLive();

                // Draw ke video preview
                const previewCanvas = document.createElement('canvas');
                previewCanvas.width = this.canvas.width;
                previewCanvas.height = this.canvas.height;
                const previewCtx = previewCanvas.getContext('2d');
                previewCtx.drawImage(this.canvas, 0, 0);

                // Tampilkan di video element
                this.video.style.display = 'none';
                const framePreview = document.getElementById('framePreview');
                if (framePreview.querySelector('canvas')) {
                    framePreview.querySelector('canvas').remove();
                }
                framePreview.appendChild(previewCanvas);
            }

            this.animationId = requestAnimationFrame(preview);
        };
        preview();
    }

    // Update live preview
    updateLivePreview() {
        // Trigger canvas update
    }

    // Apply filter to canvas LIVE
    applyFilterToCanvasLive() {
        const brightness = parseInt(document.getElementById('brightness').value) || 100;
        const contrast = parseInt(document.getElementById('contrast').value) || 100;
        const saturation = parseInt(document.getElementById('saturation').value) || 100;

        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;

        // Apply brightness, contrast, saturation
        for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            // Apply brightness
            r = Math.min(255, Math.max(0, r * (brightness / 100)));
            g = Math.min(255, Math.max(0, g * (brightness / 100)));
            b = Math.min(255, Math.max(0, b * (brightness / 100)));

            // Apply contrast
            r = Math.min(255, Math.max(0, (r - 128) * (contrast / 100) + 128));
            g = Math.min(255, Math.max(0, (g - 128) * (contrast / 100) + 128));
            b = Math.min(255, Math.max(0, (b - 128) * (contrast / 100) + 128));

            // Apply saturation
            const gray = r * 0.299 + g * 0.587 + b * 0.114;
            r = Math.round(gray + (r - gray) * (saturation / 100));
            g = Math.round(gray + (g - gray) * (saturation / 100));
            b = Math.round(gray + (b - gray) * (saturation / 100));

            data[i] = Math.max(0, Math.min(255, r));
            data[i + 1] = Math.max(0, Math.min(255, g));
            data[i + 2] = Math.max(0, Math.min(255, b));
        }

        // Apply filter effects
        this.applyAdvancedFilter(imageData, this.currentFilter);

        this.ctx.putImageData(imageData, 0, 0);
    }

    // Apply advanced filter effects
    applyAdvancedFilter(imageData, filterName) {
        const data = imageData.data;

        switch(filterName) {
            case 'blackwhite':
                this.grayscaleFilter(data);
                break;
            case 'sepia':
                this.sepiaFilter(data);
                break;
            case 'vintage':
                this.vintageFilter(data);
                break;
            case 'retro':
                this.retroFilter(data);
                break;
            case 'cool':
                this.coolFilter(data);
                break;
            case 'warm':
                this.warmFilter(data);
                break;
            case 'bright':
                this.brightFilter(data);
                break;
            case 'dark':
                this.darkFilter(data);
                break;
            case 'saturated':
                this.saturatedFilter(data);
                break;
            case 'desaturated':
                this.desaturatedFilter(data);
                break;
            case 'blur':
                this.blurFilter(imageData);
                break;
        }
    }

    // Filter functions
    grayscaleFilter(data) {
        for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
        }
    }

    sepiaFilter(data) {
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
            data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
            data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
        }
    }

    vintageFilter(data) {
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Sepia effect
            let nr = r * 0.393 + g * 0.769 + b * 0.189;
            let ng = r * 0.349 + g * 0.686 + b * 0.168;
            let nb = r * 0.272 + g * 0.534 + b * 0.131;

            // Reduce saturation
            const gray = (nr + ng + nb) / 3;
            nr = gray * 0.6 + nr * 0.4;
            ng = gray * 0.6 + ng * 0.4;
            nb = gray * 0.6 + nb * 0.4;

            data[i] = Math.min(255, nr);
            data[i + 1] = Math.min(255, ng);
            data[i + 2] = Math.min(255, nb);
        }
    }

    retroFilter(data) {
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * 1.2);
            data[i + 1] = Math.min(255, data[i + 1] * 1.1);
            data[i + 2] = Math.min(255, data[i + 2] * 0.9);
        }
    }

    coolFilter(data) {
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.max(0, data[i] * 0.8);
            data[i + 1] = Math.min(255, data[i + 1] * 1.1);
            data[i + 2] = Math.min(255, data[i + 2] * 1.2);
        }
    }

    warmFilter(data) {
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * 1.2);
            data[i + 1] = Math.min(255, data[i + 1] * 1.05);
            data[i + 2] = Math.max(0, data[i + 2] * 0.8);
        }
    }

    brightFilter(data) {
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * 1.3);
            data[i + 1] = Math.min(255, data[i + 1] * 1.3);
            data[i + 2] = Math.min(255, data[i + 2] * 1.3);
        }
    }

    darkFilter(data) {
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.max(0, data[i] * 0.7);
            data[i + 1] = Math.max(0, data[i + 1] * 0.7);
            data[i + 2] = Math.max(0, data[i + 2] * 0.7);
        }
    }

    saturatedFilter(data) {
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const gray = (r + g + b) / 3;

            data[i] = Math.min(255, gray + (r - gray) * 1.8);
            data[i + 1] = Math.min(255, gray + (g - gray) * 1.8);
            data[i + 2] = Math.min(255, gray + (b - gray) * 1.8);
        }
    }

    desaturatedFilter(data) {
        for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            data[i] = Math.min(255, gray * 1.1);
            data[i + 1] = Math.min(255, gray * 1.1);
            data[i + 2] = Math.min(255, gray * 1.1);
        }
    }

    blurFilter(imageData) {
        const data = imageData.data;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const blurRadius = 2;

        const tempData = new Uint8ClampedArray(data);

        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                let r = 0, g = 0, b = 0, count = 0;

                for (let di = -blurRadius; di <= blurRadius; di++) {
                    for (let dj = -blurRadius; dj <= blurRadius; dj++) {
                        const ni = i + di;
                        const nj = j + dj;

                        if (ni >= 0 && ni < height && nj >= 0 && nj < width) {
                            const idx = (ni * width + nj) * 4;
                            r += tempData[idx];
                            g += tempData[idx + 1];
                            b += tempData[idx + 2];
                            count++;
                        }
                    }
                }

                const idx = (i * width + j) * 4;
                data[idx] = r / count;
                data[idx + 1] = g / count;
                data[idx + 2] = b / count;
            }
        }
    }

    // Capture photo
    capturePhoto() {
        this.canvas.width = this.video.videoWidth || 640;
        this.canvas.height = this.video.videoHeight || 480;

        // Draw video
        this.ctx.drawImage(this.video, 0, 0);

        // Apply mirror if enabled
        if (document.getElementById('mirrorMode').checked) {
            this.ctx.translate(this.canvas.width, 0);
            this.ctx.scale(-1, 1);
            this.ctx.drawImage(this.video, 0, 0);
            this.ctx.scale(-1, 1);
            this.ctx.translate(-this.canvas.width, 0);
        }

        // Apply filter
        this.applyFilterToCanvasLive();

        // Draw stickers
        this.drawStickersOnCanvas();

        this.currentPhoto = this.canvas.toDataURL('image/png');
        this.photoTaken = true;

        // Show/hide buttons
        document.getElementById('captureBtn').style.display = 'none';
        document.getElementById('retakeBtn').style.display = 'block';
        document.getElementById('downloadBtn').style.display = 'block';
        document.getElementById('printBtn').style.display = 'block';
        document.getElementById('qrcodeBtn').style.display = 'block';

        // Show preview
        this.showPhotoPreview();

        // Haptic feedback if available
        if (navigator.vibrate) {
            navigator.vibrate(200);
        }

        // Play shutter sound
        this.playShutterSound();
    }

    // Retake photo
    retakePhoto() {
        this.photoTaken = false;
        this.stickers = [];
        document.getElementById('captureBtn').style.display = 'block';
        document.getElementById('retakeBtn').style.display = 'none';
        document.getElementById('downloadBtn').style.display = 'none';
        document.getElementById('printBtn').style.display = 'none';
        document.getElementById('qrcodeBtn').style.display = 'none';

        // Reset camera view
        this.framePreview.innerHTML = '<div class="frame-decorations"></div>';
        const stickersContainer = document.createElement('div');
        stickersContainer.className = 'stickers-container';
        this.framePreview.appendChild(stickersContainer);
        
        this.video.style.display = 'block';
    }

    // Draw stickers on canvas
    drawStickersOnCanvas() {
        const stickersContainer = document.querySelector('.stickers-container');
        if (!stickersContainer) return;

        const emojis = stickersContainer.querySelectorAll('.sticker');
        emojis.forEach(emoji => {
            const fontSize = window.getComputedStyle(emoji).fontSize;
            const text = emoji.textContent;
            const x = parseInt(emoji.style.left) || 0;
            const y = parseInt(emoji.style.top) || 0;

            this.ctx.font = `${fontSize} Arial`;
            this.ctx.fillText(text, x, y);
        });
    }

    // Show photo preview
    showPhotoPreview() {
        const img = new Image();
        img.src = this.currentPhoto;
        img.onload = () => {
            this.framePreview.innerHTML = '';
            this.framePreview.appendChild(img);
            this.video.style.display = 'none';
        };
    }

    // Download photo
    downloadPhoto() {
        const link = document.createElement('a');
        link.href = this.currentPhoto;
        link.download = `photobox-${Date.now()}.png`;
        link.click();
    }

    // Print photo
    printPhoto() {
        const printWindow = window.open('', '', 'height=400,width=600');
        printWindow.document.write(
            `<html><head><title>Print Photo</title>` +
            `<style>body{margin:0;padding:10px;} img{max-width:100%; border:2px solid #333;}</style>` +
            `</head><body>` +
            `<img src="${this.currentPhoto}" />` +
            `<script>window.print(); window.close();</script>` +
            `</body></html>`
        );
        printWindow.document.close();
    }

    // Generate QR Code
    generateQRCode() {
        // Convert image to data URL and create shareable link
        const base64 = this.currentPhoto.split(',')[1];
        
        // For demo, we'll create a simple link
        const qrLink = `${window.location.origin}?photo=${base64.substring(0, 50)}...`;
        
        document.getElementById('qrLink').textContent = qrLink;

        const qrContainer = document.getElementById('qrcode');
        qrContainer.innerHTML = '';

        new QRCode(qrContainer, {
            text: qrLink,
            width: 200,
            height: 200,
            colorDark: '#ff6b9d',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });

        document.getElementById('qrModal').style.display = 'block';
    }

    // Play shutter sound
    playShutterSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }
}

// Global functions
function selectFrame(element) {
    document.querySelectorAll('.frame-option').forEach(el => el.classList.remove('active'));
    element.classList.add('active');

    const frameName = element.dataset.frame;
    const framePreview = document.getElementById('framePreview');
    
    framePreview.className = `frame-preview frame-${frameName}`;
    framePreview.innerHTML = '<div class="frame-decorations"></div>';
    const stickersContainer = document.createElement('div');
    stickersContainer.className = 'stickers-container';
    framePreview.appendChild(stickersContainer);
}

function applyFilter(element) {
    document.querySelectorAll('.filter-option').forEach(el => el.classList.remove('active'));
    element.classList.add('active');

    const filterName = element.dataset.filter;
    photoBox.currentFilter = filterName;
}

function addSticker(emoji) {
    const container = document.querySelector('.stickers-container') || createStickersContainer();
    
    const sticker = document.createElement('div');
    sticker.className = 'sticker';
    sticker.textContent = emoji;
    sticker.style.left = Math.random() * 80 + '%';
    sticker.style.top = Math.random() * 80 + '%';

    container.appendChild(sticker);

    // Make sticker draggable
    makeDraggable(sticker);
}

function createStickersContainer() {
    const framePreview = document.getElementById('framePreview');
    const container = document.createElement('div');
    container.className = 'stickers-container';
    framePreview.appendChild(container);
    return container;
}

function makeDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    element.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        const container = element.parentElement;
        const newTop = element.offsetTop - pos2;
        const newLeft = element.offsetLeft - pos1;

        element.style.top = Math.max(0, Math.min(newTop, container.offsetHeight - element.offsetHeight)) + 'px';
        element.style.left = Math.max(0, Math.min(newLeft, container.offsetWidth - element.offsetWidth)) + 'px';
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

function addTextOverlay() {
    const text = document.getElementById('textInput').value;
    if (!text) {
        alert('Masukkan teks terlebih dahulu!');
        return;
    }

    const container = document.querySelector('.stickers-container') || createStickersContainer();
    
    const textElement = document.createElement('div');
    textElement.className = 'sticker';
    textElement.textContent = text;
    textElement.style.left = '50%';
    textElement.style.top = '50%';
    textElement.style.fontSize = '2em';
    textElement.style.fontWeight = 'bold';
    textElement.style.color = '#ff6b9d';
    textElement.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
    textElement.style.transform = 'translate(-50%, -50%)';

    container.appendChild(textElement);
    makeDraggable(textElement);

    document.getElementById('textInput').value = '';
}

function updateAdvanced() {
    // This function is called when sliders change
    // Applied in applyFilterToCanvasLive method
}

function closeQRModal() {
    document.getElementById('qrModal').style.display = 'none';
}

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    const modal = document.getElementById('qrModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Initialize PhotoBox when page loads
let photoBox;
document.addEventListener('DOMContentLoaded', () => {
    photoBox = new PhotoBox();
    
    // Set first frame as default
    const firstFrame = document.querySelector('.frame-option');
    if (firstFrame) {
        firstFrame.click();
    }
    
    // Set first filter as default
    const firstFilter = document.querySelector('.filter-option');
    if (firstFilter) {
        firstFilter.click();
    }
});
