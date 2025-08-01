// Mobile Phone Landing Page
import MobilePhoneDetector from './mobile-phone-detection.js';

class MobilePhoneLanding {
    constructor() {
        this.initialized = false;
    }
    
    init() {
        if (!MobilePhoneDetector.isPhone()) {
            return;
        }
        
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createLandingPage());
        } else {
            this.createLandingPage();
        }
    }
    
    createLandingPage() {
        // Hide all existing content
        const body = document.body;
        const existingContent = body.innerHTML;
        
        // Create mobile landing page
        const landingHTML = `
            <div id="mobileLandingPage" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #000;
                color: #fff;
                font-family: 'Press Start 2P', monospace;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 20px;
                box-sizing: border-box;
                overflow-y: auto;
                z-index: 10000;
            ">
                <!-- Cosmic background -->
                <div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-image: url('assets/background/purple-bg.png');
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                    z-index: -2;
                "></div>
                
                <!-- Animated stars -->
                <div class="stars" style="
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    background-image: 
                        radial-gradient(2px 2px at 20px 30px, #eee, transparent),
                        radial-gradient(2px 2px at 40px 70px, #eee, transparent),
                        radial-gradient(1px 1px at 50px 160px, #eee, transparent),
                        radial-gradient(1px 1px at 130px 40px, #eee, transparent),
                        radial-gradient(2px 2px at 80px 10px, #eee, transparent);
                    background-repeat: repeat;
                    background-size: 200px 200px;
                    z-index: -1;
                    opacity: 0.5;
                    animation: starsMove 120s linear infinite;
                "></div>
                
                <style>
                    @keyframes starsMove {
                        from { transform: translateY(0); }
                        to { transform: translateY(-200px); }
                    }
                    
                    @keyframes float {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-10px); }
                    }
                    
                    @keyframes glow {
                        0%, 100% { opacity: 0.8; }
                        50% { opacity: 1; }
                    }
                </style>
                
                <!-- Logo -->
                <img src="infinite-snake-preview-splash-logo.png" alt="Infinite Snake" style="
                    width: 80%;
                    max-width: 300px;
                    height: auto;
                    margin-bottom: 30px;
                    image-rendering: pixelated;
                    animation: float 3s ease-in-out infinite;
                ">
                
                <!-- Gameplay preview GIF -->
                <div style="
                    width: 90%;
                    max-width: 350px;
                    min-height: 197px;
                    margin-bottom: 30px;
                    cursor: pointer;
                    border: 3px solid #4ecdc4;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 0 20px rgba(78, 205, 196, 0.5);
                    background: #1a0033 url('/hero-gameplay-intro.gif') center/cover no-repeat;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                " onclick="document.getElementById('mobileVideoModal').style.display = 'flex';">
                    <img 
                        src="/hero-gameplay-intro.gif"
                        alt="Infinite Snake Gameplay"
                        style="width: 100%; height: auto; display: block;"
                        onerror="this.onerror=null; this.src='assets/hero-gameplay-intro.gif';"
                    />
                </div>
                
                <!-- Video caption -->
                <p style="
                    font-size: 9px;
                    color: #4ecdc4;
                    text-align: center;
                    margin-top: -20px;
                    margin-bottom: 30px;
                    cursor: pointer;
                    animation: glow 2s ease-in-out infinite;
                " onclick="document.getElementById('mobileVideoModal').style.display = 'flex';">
                    TAP TO WATCH FULL GAMEPLAY
                </p>
                
                <!-- Message -->
                <div style="
                    text-align: center;
                    max-width: 90%;
                    margin-bottom: 30px;
                ">
                    <h2 style="
                        font-size: 14px;
                        color: #4ecdc4;
                        margin-bottom: 20px;
                        text-shadow: 0 0 10px rgba(78, 205, 196, 0.5);
                    ">COSMIC CRAFTING AWAITS!</h2>
                    
                    <p style="
                        font-size: 10px;
                        line-height: 1.6;
                        color: #fff;
                        margin-bottom: 20px;
                    ">
                        Infinite Snake is a desktop & iPad experience only. We're crafting something special for mobile phones. But for now, save this page and visit from your desktop or iPad to begin your journey!
                    </p>
                    
                    
                    <div style="
                        margin-top: 30px;
                        padding: 15px;
                        background: rgba(78, 205, 196, 0.1);
                        border: 2px solid #4ecdc4;
                        border-radius: 10px;
                    ">
                        <p style="font-size: 10px; color: #4ecdc4; margin-bottom: 15px; text-align: center; font-weight: bold;">
                            GAME FEATURES
                        </p>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                            <p style="font-size: 8px; color: #fff; margin: 3px 0; text-align: left;">
                                🌟 10,000+ Elements
                            </p>
                            <p style="font-size: 8px; color: #fff; margin: 3px 0; text-align: left;">
                                🔮 20,000+ Combinations
                            </p>
                            <p style="font-size: 8px; color: #fff; margin: 3px 0; text-align: left;">
                                🎨 50+ Unlockable Skins
                            </p>
                            <p style="font-size: 8px; color: #fff; margin: 3px 0; text-align: left;">
                                📜 80+ Lore Fragments
                            </p>
                            <p style="font-size: 8px; color: #fff; margin: 3px 0; text-align: left;">
                                ⚔️ Epic Boss Battles
                            </p>
                            <p style="font-size: 8px; color: #fff; margin: 3px 0; text-align: left;">
                                🎮 3 Unique Game Modes
                            </p>
                        </div>
                    </div>
                </div>
                
                <!-- Discord Section -->
                <div style="
                    text-align: center;
                    margin-top: 30px;
                ">
                    <p style="
                        font-size: 9px;
                        color: #fff;
                        margin-bottom: 15px;
                        line-height: 1.4;
                        opacity: 0.9;
                    ">
                        Join our community to share discoveries,<br>
                        report bugs, and connect with other players!
                    </p>
                    <a href="https://discord.gg/a6X4W7QbkG" 
                       target="_blank" 
                       style="
                        color: #fff;
                        text-decoration: none;
                        font-size: 10px;
                        padding: 12px 25px;
                        background: #7828F8;
                        border: 2px solid #7828F8;
                        border-radius: 5px;
                        display: inline-block;
                        transition: all 0.3s;
                        box-shadow: 0 0 10px rgba(120, 40, 248, 0.5);
                    ">
                        💬 JOIN OUR DISCORD
                    </a>
                </div>
            </div>
            
            <!-- Video Modal -->
            <div id="mobileVideoModal" style="
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                z-index: 10001;
                justify-content: center;
                align-items: center;
                padding: 20px;
                box-sizing: border-box;
            " onclick="if(event.target === this) this.style.display = 'none';">
                <div style="
                    position: relative;
                    width: 100%;
                    max-width: 600px;
                    background: #000;
                    border: 2px solid #4ecdc4;
                    border-radius: 10px;
                    overflow: hidden;
                ">
                    <span style="
                        position: absolute;
                        top: 10px;
                        right: 10px;
                        color: #4ecdc4;
                        font-size: 24px;
                        cursor: pointer;
                        z-index: 10;
                        background: rgba(0, 0, 0, 0.8);
                        width: 30px;
                        height: 30px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 50%;
                    " onclick="document.getElementById('mobileVideoModal').style.display = 'none';">×</span>
                    
                    <div style="position: relative; padding-bottom: 54.83870967741935%; height: 0;">
                        <iframe src="https://www.loom.com/embed/cb0e142aae8544748f270faf88cda78d?sid=b486f4ec-f0fe-448d-849e-17efe432906d" 
                                frameborder="0" 
                                webkitallowfullscreen 
                                mozallowfullscreen 
                                allowfullscreen 
                                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
                        </iframe>
                    </div>
                </div>
            </div>
        `;
        
        // Replace body content
        body.innerHTML = landingHTML;
        body.className = 'mobile-phone-landing';
        
        this.initialized = true;
    }
}

// Initialize
const mobileLanding = new MobilePhoneLanding();
mobileLanding.init();

export default MobilePhoneLanding;