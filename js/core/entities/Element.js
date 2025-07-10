import { MagnetismMixin, MAGNETISM_PRESETS } from '../utilities/magnetism.js';

class Element {
    constructor(id, x, y, isCatalystSpawned = false) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.pulse = 0;
        this.isCatalystSpawned = isCatalystSpawned;
        this.catalystSparkleTime = 0;
        this.pendingCombination = false;
        this.combiningAnimation = 0;
        
        MagnetismMixin.initMagnetism.call(this, MAGNETISM_PRESETS.element);
        this.loadElementData();
    }
    
    loadElementData() {
        if (window.elementLoader && window.elementLoader.isLoaded && window.elementLoader.isLoaded()) {
            const elem = window.elementLoader.elements.get(this.id);
            if (elem) {
                this.data = {
                    emoji: window.elementLoader.getEmojiForElement(this.id, elem.e),
                    name: elem.n,
                    tier: elem.t,
                    base: elem.t === 0
                };
            }
        }
        
        if (!this.data) {
            this.data = { emoji: '❓', name: 'Unknown', tier: 0 };
        }
    }
    
    update(deltaTime = 1) {
        this.pulse += 0.05 * deltaTime;
        if (this.isCatalystSpawned) {
            this.catalystSparkleTime += 0.1 * deltaTime;
        }
        
        MagnetismMixin.applyMagnetism.call(this, deltaTime, false);
    }
    
    draw() {
        const screen = worldToScreen(this.x, this.y);
        const screenX = screen.x;
        const screenY = screen.y;
        
        let scale = 1 + Math.sin(this.pulse || 0) * 0.1;
        
        if (this.pendingCombination) {
            this.combiningAnimation += 0.15;
            const wobble = Math.sin(this.combiningAnimation * 3) * 0.1;
            scale = scale * (1 + wobble);
        }
        
        const alchemyGlow = this.checkAlchemyVisionGlow();
        
        if (this.isCatalystSpawned) {
            this.drawCatalystGlow(screenX, screenY, scale);
        }
        
        ctx.save();
        
        if (alchemyGlow) {
            this.drawAlchemyGlow(screenX, screenY, scale, alchemyGlow);
        }
        
        if (this.pendingCombination) {
            this.drawCombiningEffect(screenX, screenY, scale);
        }
        
        this.drawElementEmoji(screenX, screenY, scale);
        
        if (this.isCatalystSpawned) {
            this.drawCatalystSparkles(screenX, screenY, scale);
        }
        
        ctx.restore();
    }
    
    checkAlchemyVisionGlow() {
        if (!alchemyVisionActive || !playerSnake || !playerSnake.isAlive || playerSnake.elements.length === 0) {
            return null;
        }
        
        const tailElement = playerSnake.elements[playerSnake.elements.length - 1];
        const distance = Math.hypot(this.x - playerSnake.x, this.y - playerSnake.y);
        
        if (distance > 300) return null;
        
        const combo1 = `${this.id}+${tailElement}`;
        const combo2 = `${tailElement}+${this.id}`;
        
        if (combinations[combo1] || combinations[combo2]) {
            const result = combinations[combo1] || combinations[combo2];
            return !discoveredElements.has(result) ? 'discovery' : 'known';
        }
        
        return null;
    }
    
    drawCatalystGlow(x, y, scale) {
        const glowSize = ELEMENT_SIZE * 3 * scale;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
        const catalystPulse = Math.sin(this.catalystSparkleTime) * 0.3 + 0.7;
        gradient.addColorStop(0, `rgba(255, 0, 255, ${0.6 * catalystPulse})`);
        gradient.addColorStop(0.5, `rgba(138, 43, 226, ${0.4 * catalystPulse})`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(x - glowSize, y - glowSize, glowSize * 2, glowSize * 2);
    }
    
    drawAlchemyGlow(x, y, scale, glowType) {
        const glowSize = ELEMENT_SIZE * 2 * scale;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
        
        if (glowType === 'discovery') {
            gradient.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
            gradient.addColorStop(0.5, 'rgba(255, 165, 0, 0.3)');
        } else {
            gradient.addColorStop(0, 'rgba(0, 255, 0, 0.5)');
            gradient.addColorStop(0.5, 'rgba(0, 200, 0, 0.3)');
        }
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x - glowSize, y - glowSize, glowSize * 2, glowSize * 2);
    }
    
    drawCombiningEffect(x, y, scale) {
        const wobbleGlow = ELEMENT_SIZE * 2.5 * scale;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, wobbleGlow);
        gradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 200, 0, 0.4)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(x - wobbleGlow, y - wobbleGlow, wobbleGlow * 2, wobbleGlow * 2);
    }
    
    drawElementEmoji(x, y, scale) {
        const size = Math.round(ELEMENT_SIZE * 2 * scale * cameraZoom);
        const cachedCanvas = getCachedEmoji(this.data.emoji, size);
        ctx.drawImage(cachedCanvas, x - cachedCanvas.width / 2, y - cachedCanvas.height / 2);
    }
    
    drawCatalystSparkles(x, y, scale) {
        for (let i = 0; i < 4; i++) {
            const angle = this.catalystSparkleTime + (i * Math.PI / 2);
            const distance = ELEMENT_SIZE * scale * 1.2;
            const sparkleX = x + Math.cos(angle) * distance;
            const sparkleY = y + Math.sin(angle) * distance;
            
            ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 0, 255, 0.8)' : 'rgba(138, 43, 226, 0.8)';
            ctx.beginPath();
            ctx.arc(sparkleX, sparkleY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

export default Element;