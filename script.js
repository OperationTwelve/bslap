// Global variables for generation tracking
let websocket = null;
let currentPromptId = null;
const totalNodes = 2;
let completedNodes = 0;
let nodeProgress = 0;
const DEBUG_MODE = true;
let statusInterval;
let currentPhase = 'progress';
let progressPhrases = [];
let finalizingPhrases = [];
let currentAwardType = null;
let currentSeed = null;

// Debug logger helper
function logDebug(message) {
    if (DEBUG_MODE) console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`);
}

function generateOutputFilename(awardType, firstName, lastName, seed) {
    const sanitize = str => str.replace(/[^a-zA-Z0-9-_]/g, '');
    return `${sanitize(awardType)}-${sanitize(firstName)}-${sanitize(lastName)}-${seed}`;
}

document.getElementById('startButton')?.addEventListener('click', generateAward);

async function generateAward() {
    logDebug('Generate award initiated');
    const awardType = document.getElementById('awardType').value;
    currentAwardType = awardType;
    const firstName = document.getElementById('firstName').value;
	const lastName = document.getElementById('lastName').value;
    const fileInput = document.getElementById('imageUpload');

    try {
        // 1. Get seed with cache busting and error detail
        const seedUrl = `http://34.125.47.220:8188/get_seed/${encodeURIComponent(awardType)}?t=${Date.now()}`;
        logDebug(`Fetching seed from: ${seedUrl}`);
        
        const seedResponse = await fetch(seedUrl);
        
        if (!seedResponse.ok) {
            const errorText = await seedResponse.text();
            throw new Error(`Server error: ${seedResponse.status} - ${errorText}`);
        }
        
        const seedData = await seedResponse.json();
        currentSeed = seedData.seed;
        logDebug(`Retrieved seed: ${currentSeed} for ${awardType}`);

    } catch (error) {
        console.error('Seed initialization failed:', error);
        alert(`Failed to start: ${error.message}`);
        return;
    }

    // 2. UI Setup
    document.getElementById('pulsingBar').classList.remove('hidden');
    document.getElementById('statusText').classList.remove('hidden');
    await loadPhrases();
    
    // 3. Status updates
    clearInterval(statusInterval); // Clear any existing interval
    statusInterval = setInterval(updateStatusText, 3000);
    updateStatusText();
    
    // 4. Pulse animation
    const pulseBar = document.getElementById('pulsingBar');
    pulseBar.addEventListener('animationiteration', updatePulseColor);
    updatePulseColor();

    try {
        // 5. Workflow setup
        const workflow = await fetchWorkflow();
        workflow["419"]["inputs"]["text"] = awardType;
        workflow["523"]["inputs"]["seed"] = currentSeed;
		workflow["575"]["inputs"]["text"] = firstName;
		workflow["578"]["inputs"]["text"] = lastName;

        // 6. Handle image upload
        if (fileInput.files[0]) {
            logDebug(`Uploading image: ${fileInput.files[0].name}`);
            const uploadedFilename = await uploadImage(fileInput.files[0]);
            workflow["120"]["inputs"]["image"] = uploadedFilename;
        }

        // 7. Set output filename
        const outputFilename = generateOutputFilename(awardType, firstName, lastName, currentSeed);
        workflow["365"]["inputs"]["filename_prefix"] = outputFilename;
        logDebug(`Output filename set to: ${outputFilename}`);

        // 8. Start processing
        const response = await fetch('http://34.125.47.220:8188/prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: workflow })
        });

        if (!response.ok) {
            const errorDetail = await response.text();
            throw new Error(`API request failed: ${response.status} - ${errorDetail}`);
        }

        const data = await response.json();
        if (data.prompt_id) {
            logDebug(`Prompt ID received: ${data.prompt_id}`);
            currentPromptId = data.prompt_id;
            setupWebSocket(outputFilename);
            
            // 9. Fallback timeout
            setTimeout(async () => {
                logDebug("Fallback timeout reached, checking image");
                await finalizeGeneration(outputFilename);
            }, 30000);
        }
    } catch (error) {
        console.error('Generation failed:', error);
        alert(`Processing error: ${error.message}`);
        // Cleanup on failure
        clearInterval(statusInterval);
        document.getElementById('pulsingBar').classList.add('hidden');
    }
}

function setupWebSocket(outputFilename) {
    logDebug('Initializing WebSocket connection');
    if (websocket) websocket.close();

    websocket = new WebSocket('ws://34.125.47.220:8188/ws');

    websocket.onmessage = async (event) => {
        try {
            let dataStr = "";
            if (typeof event.data === "string") {
                dataStr = event.data.trim();
            } else {
                dataStr = (await event.data.text()).trim();
            }
            if (!dataStr.startsWith("{") && !dataStr.startsWith("[")) {
                logDebug("Received non-JSON message: " + dataStr);
                return;
            }
            const msg = JSON.parse(dataStr);
            const msgType = msg.type.trim();
            logDebug(`WebSocket message received: ${msgType}`);

            switch (msgType) {
                case "executing":
                    logDebug(`Executing node: ${msg.data.node}`);
                    break;
                case "progress":
                    const currentNodeProgress = (msg.data.value / msg.data.max) * 100;
                    logDebug(`Progress update: ${currentNodeProgress}%`);
                    if (currentNodeProgress >= 100) {
                        completedNodes++;
                        nodeProgress = 0;
                        logDebug(`Node completed. Total completed nodes: ${completedNodes}`);
                    } else {
                        nodeProgress = currentNodeProgress;
                    }
                    break;
                case "executed":
                    logDebug(`Node executed: ${JSON.stringify(msg.data)}`);
                    if (nodeProgress < 100) {
                        completedNodes++;
                        nodeProgress = 0;
                    }
                    if (completedNodes >= totalNodes) {
                        await finalizeGeneration(outputFilename);
                    }
                    break;
                default:
                    logDebug(`Unhandled message type: ${msgType}`);
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    };

    websocket.onclose = () => logDebug('WebSocket connection closed');
}

async function finalizeGeneration(outputFilename) {
    const pulseBar = document.getElementById('pulsingBar');
    pulseBar.removeEventListener('animationiteration', updatePulseColor);
    clearInterval(statusInterval);
        
    // Update phase and restart interval
    currentPhase = 'finalizing';
	statusInterval = setInterval(updateStatusText, 3000);
	updateStatusText(); // Force immediate update
    
    logDebug('Finalizing generation and checking image availability');
    const imageUrl = `http://34.125.47.220:8188/api/view?filename=${outputFilename}_00001_.png`;
    
    try {
        const isAvailable = await checkImageAvailability(imageUrl);
        
        if (isAvailable) {
            // Confirm seed BEFORE redirect
            const confirmResponse = await fetch(
                `http://34.125.47.220:8188/confirm_seed/${encodeURIComponent(currentAwardType)}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ seed: currentSeed })
                }
            );

            if (!confirmResponse.ok) {
				const errorDetail = await confirmResponse.text();
                throw new Error(`Seed confirmation failed: ${errorDetail}`);
            }

            const result = await confirmResponse.json();
            logDebug('Seed confirmation response:', result);
            
            // Only redirect after successful confirmation
			logDebug('Redirecting to result page');
            window.location.href = `result.html?image=${encodeURIComponent(imageUrl)}`;
        } else {
            throw new Error('Image not available');
        }
    } catch (error) {
        console.error('Finalization failed:', error);
        alert(`Completion error: ${error.message}`);
        window.location.href = 'index.html';
    }
}

async function checkImageAvailability(imageUrl) {
    const MAX_ATTEMPTS = 30;
    const RETRY_DELAY = 5000;
    
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        logDebug(`Checking image availability (Attempt ${attempt})`);
        const resultUrl = `${imageUrl}`;
        
        try {
            const response = await fetch(resultUrl, { method: 'HEAD' });
            if (response.ok) {
                logDebug('Image is available');
                return true;
            }
        } catch (error) {
            logDebug(`Attempt ${attempt} failed: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
    
    logDebug('Image not available after maximum attempts');
    return false;
}

async function fetchWorkflow() {
    logDebug('Fetching workflow JSON');
    const response = await fetch('BSLAPAPI4.json');
    return await response.json();
}

async function uploadImage(file) {
    logDebug(`Uploading image: ${file.name}`);
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch('http://34.125.47.220:8188/upload/image', {
        method: 'POST',
        body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Upload failed');
    logDebug(`Image uploaded successfully: ${data.name}`);
    return data.name;
}

// Drag-and-Drop Support for index.html
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.endsWith('index.html')) {
        logDebug('Initializing drag-drop support');
        const dropZone = document.body;
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            if (e.dataTransfer.files[0]) {
                logDebug('Files dropped');
                document.getElementById('imageUpload').files = e.dataTransfer.files;
            }
        });
    }
});

// Result page logic
if (window.location.pathname.endsWith('result.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        logDebug('Result page initialized');
        const params = new URLSearchParams(window.location.search);
        const imageUrl = params.get('image');
        
        if (imageUrl) {
            logDebug(`Loading image: ${imageUrl}`);
            const img = document.getElementById('resultImage');
            img.src = imageUrl;
            
            img.onload = () => logDebug('Image loaded successfully');
            img.onerror = () => {
                logDebug('Error loading image');
                alert('Error: Failed to load image. Please try creating another award.');
                window.location.href = 'index.html';
            };
        } else {
            logDebug('No image parameter found, redirecting to index');
            setTimeout(() => window.location.href = 'index.html', 3000);
        }
    });
}

async function loadPhrases() {
    try {
        const progressRes = await fetch('phrases/progress_phrases.txt');
        const finalizingRes = await fetch('phrases/finalizing_phrases.txt');
        progressPhrases = (await progressRes.text()).split('\n').filter(p => p.trim());
        finalizingPhrases = (await finalizingRes.text()).split('\n').filter(p => p.trim());
    } catch (error) {
        console.error('Error loading phrases:', error);
        progressPhrases = ['Processing your request...'];
        finalizingPhrases = ['Finalizing your award...'];
    }
}

function updateStatusText() {
    const phrases = currentPhase === 'progress' ? progressPhrases : finalizingPhrases;
    const statusElement = document.getElementById('statusText');
    if (phrases.length > 0) {
        const randomIndex = Math.floor(Math.random() * phrases.length);
        statusElement.textContent = phrases[randomIndex];
    }
}

function updatePulseColor() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#FF9999'];
    const pulseBar = document.getElementById('pulsingBar');
    pulseBar.style.setProperty('--pulse-color', colors[Math.floor(Math.random() * colors.length)]);
}