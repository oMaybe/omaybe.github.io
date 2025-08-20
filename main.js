document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        // Ensure this only applies to regular navigation links, not specific buttons like the train launcher
        if (this.id === 'launchButton') {
            e.preventDefault(); 
            return; 
        }

        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Typing animation for the dynamic role (kept from previous version)
const dynamicRoleElement = document.getElementById('dynamic-role');
const roles = ["Programmer", "Leader", "Innovator", "Creator"];
let roleIndex = 0;
let charIndex = 0;
let isDeleting = false;
const typingSpeed = 150;
const deletingSpeed = 100;
const delayBetweenWords = 1250;

function typeWriter() {
    const currentRole = roles[roleIndex];
    if (isDeleting) {
        dynamicRoleElement.textContent = currentRole.substring(0, charIndex - 1);
        charIndex--;
    } else {
        dynamicRoleElement.textContent = currentRole.substring(0, charIndex + 1);
        charIndex++;
    }

    let currentSpeed = isDeleting ? deletingSpeed : typingSpeed;
    if (!isDeleting && charIndex === currentRole.length) {
        currentSpeed = delayBetweenWords;
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        currentSpeed = 500;
    }

    setTimeout(typeWriter, currentSpeed);
}

// Start the typing animation when the window loads
window.onload = function() {
    typeWriter();
};

// Train Animation JavaScript Logic
const train = document.getElementById('train');
const launchButton = document.getElementById('launchButton');
const bounceText = document.getElementById('bounceText');
const scene = document.getElementById('scene');

// Constants for train dimensions from CSS variables (ensure these match CSS)
const style = getComputedStyle(document.documentElement);
const CAR_WIDTH = parseFloat(style.getPropertyValue('--car-width'));
const ENGINE_WIDTH = parseFloat(style.getPropertyValue('--engine-width'));
const COUPLER_WIDTH = parseFloat(style.getPropertyValue('--coupler-width'));

// Total visible width of the train (car + coupler + engine)
const TOTAL_TRAIN_VISIBLE_WIDTH = CAR_WIDTH + COUPLER_WIDTH + ENGINE_WIDTH; 

// Initial off-screen left position of the train (its far right edge is at 0, so its left edge is -TOTAL_TRAIN_VISIBLE_WIDTH)
const TRAIN_INITIAL_OFFSET_LEFT = -TOTAL_TRAIN_VISIBLE_WIDTH; 

function runTrain() {
    // Clear any existing dropped text from previous runs
    const existingDroppedText = scene.querySelectorAll('.dropped-text');
    existingDroppedText.forEach(el => el.remove());

    // Get durations from CSS variables
    const trainFullDuration = parseFloat(style.getPropertyValue('--train-full-duration').replace('s', '')) * 1000; // ms
    const bounceDuration = 800; // ms
    const pauseDuration = 1000; // ms - time train stays stopped before leaving

    // Calculate absolute target translateX values for the train's *left edge*
    const sceneRect = scene.getBoundingClientRect();
    const sceneWidth = sceneRect.width;
    
    // Phase 1: Move train from off-screen left to middle of the SCENE (not viewport)
    // Train's left edge should be at (sceneCenter - half of train's total width)
    const targetXAtMiddle = (sceneWidth / 2) - ENGINE_WIDTH;
    
    // Phase 2: Move train from middle to off-screen right relative to scene
    // Train's left edge should be at sceneWidth
    const finalXOffScreenRight = sceneWidth + 50; // Train's left edge is at the right edge of the scene

    // --- Reset Initial State ---
    train.style.transition = 'none'; // Clear any active transitions
    train.style.transform = `translateX(${TRAIN_INITIAL_OFFSET_LEFT}px) scaleX(1)`; // Reset position and facing direction (right)
    bounceText.classList.remove('active'); // Hide bounce text
    void train.offsetWidth; // Force reflow to apply reset styles immediately

    // --- Phase 1: Move train from off-screen left to middle (facing right) ---
    train.style.transition = `transform ${trainFullDuration / 4000}s cubic-bezier(.2,.9,.2,1)`; /* Adjusted duration for smoother single trip */
    train.style.transform = `translateX(${targetXAtMiddle}px) scaleX(1)`;

    // Listen for end of Phase 1 (train reaches middle)
    train.addEventListener('transitionend', function handler1(event) {
        if (event.propertyName === 'transform') {
            train.removeEventListener('transitionend', handler1); // Remove this listener
            train.style.transition = 'none'; // Stop train at middle

            // --- Pause and Text Bounce ---
            bounceText.classList.add('active'); // Show and bounce text

            setTimeout(() => {
                const bounceTextRect = bounceText.getBoundingClientRect();

                // Create a new dropped text element
                const droppedText = document.createElement('div');
                droppedText.className = 'dropped-text';
                droppedText.textContent = bounceText.textContent;

                // Position it in the center of the scene
                const leftPosition = sceneWidth / 2; // Center horizontally in the scene
                const bottomPosition = sceneRect.bottom - bounceTextRect.bottom + 20; // 20px from bottom

                droppedText.style.left = `${leftPosition}px`;
                droppedText.style.bottom = `${bottomPosition}px`;
                droppedText.style.transform = 'translateX(-50%)'; // Center it horizontally

                // Add it to the scene
                scene.appendChild(droppedText);

                // Animate the dropped text appearing
                setTimeout(() => {
                    droppedText.classList.add('visible', 'settle');
                }, 100);

                // Hide the original bounce text
                bounceText.classList.remove('active');

                // --- Phase 2: Move train from middle to off-screen right (facing right) ---
                train.style.transition = `transform ${trainFullDuration / 4000}s cubic-bezier(.2,.9,.2,1)`; /* Same duration for consistent speed */
                train.style.transform = `translateX(${finalXOffScreenRight}px) scaleX(1)`;

                // This listener waits for the train to leave the screen.
                train.addEventListener('transitionend', function handler2(event2) {
                    if (event2.propertyName === 'transform') {
                        train.removeEventListener('transitionend', handler2);
                        // Reset train position instantly for potential future launches
                        train.style.transition = 'none';
                        train.style.transform = `translateX(${TRAIN_INITIAL_OFFSET_LEFT}px) scaleX(1)`;
                    }
                }, { once: true });
            }, pauseDuration); // Wait longer before departing to let user see the text drop
        }
    }, { once: true });
}

launchButton.addEventListener('click', () => runTrain());

// Function to create and animate a snowflake
function createSnowflake() {
    const snowflakeContainer = document.querySelector('.snowflakes');
    const maxSnowflakes = 30;

    // Check if the current number of snowflakes is less than the limit
    if (snowflakeContainer.children.length < maxSnowflakes) {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.innerHTML = '&#10052;'; // Snowflake character
        
        // Set a random initial position and size
        const startX = Math.random() * 100;
        const size = Math.random() * 0.5 + 0.5; // size between 0.5 and 1
        const animationDuration = Math.random() * 10 + 5; // duration between 5s and 15s

        snowflake.style.left = `${startX}vw`;
        snowflake.style.fontSize = `${size}em`;
        snowflake.style.animationDuration = `${animationDuration}s`;
        
        snowflakeContainer.appendChild(snowflake);

        // Remove the snowflake once it's off-screen to save memory
        snowflake.addEventListener('animationend', () => {
            snowflake.remove();
        });
    }
}

// Create new snowflakes at regular intervals
setInterval(createSnowflake, 650);