        class ElementPool {
            constructor(size = 50) {
                this.pool = [];
                this.activeElements = [];
            }
            
            spawn(id, x, y, isCatalystSpawned = false) {
                let element = this.pool.pop();
                if (!element) {
                    element = new Element(id, x, y, isCatalystSpawned);
                } else {
                    // Reset existing element
                    element.id = id;
                    element.x = x;
                    element.y = y;
                    
                    // Get element data from new system
                    const elem = window.elementLoader.elements.get(id);
                    if (elem) {
                        element.data = {
                            emoji: window.elementLoader.getEmojiForElement(id, elem.e),
                            name: elem.n,
                            tier: elem.t,
                            base: elem.t === 0
                        };
                    } else {
                        console.warn(`Element ID ${id} not found`);
                        element.data = { emoji: '❓', name: 'Unknown', tier: 0 };
                    }
                    element.pulse = 0;
                    element.isCatalystSpawned = isCatalystSpawned;
                    element.catalystSparkleTime = 0;
                }
                this.activeElements.push(element);
                return element;
            }
            
            remove(element) {
                const index = this.activeElements.indexOf(element);
                if (index > -1) {
                    this.activeElements.splice(index, 1);
                    this.pool.push(element);
                }
            }
            
            update(deltaTime = 1) {
                this.activeElements.forEach(element => element.update(deltaTime));
            }
            
            draw() {
                this.activeElements.forEach(element => {
                    if (isInViewport(element.x, element.y, ELEMENT_SIZE + 50)) {
                        element.draw();
                    }
                });
            }
            
            getActiveElements() {
                return this.activeElements;
            }
            
            getActiveCount() {
                return this.activeElements.length;
            }
        }
        
        // Initialize element pool
        const elementPool = new ElementPool();

export default ElementPool;
