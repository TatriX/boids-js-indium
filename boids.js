window.onload = main;

// accessible from the REPL
let swarm;

function main() {
    swarm = new Swarm(document.getElementById("canvas"));
    swarm.animate();
    swarm.clear();
    swarm.createBoid(200);
};


class Boid {
    constructor(swarm) {
        this.x = Math.random() * swarm.width;
        this.y = Math.random() * swarm.height;
        this.heading = Math.random() * 2 * Math.PI - Math.PI;
    }

    draw(ctx) {
        const {x, y, heading, radius} = this;
        const pointLen = radius * 2.5;

        ctx.fillStyle = "#33f";
        ctx.strokeStyle = "#000";

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + Math.cos(heading + Math.PI/2) * radius, y + Math.sin(heading + Math.PI/2) * radius);
        ctx.lineTo(x + Math.cos(heading + Math.PI) * pointLen, y + Math.sin(heading + Math.PI) * pointLen);
        ctx.lineTo(x + Math.cos(heading - Math.PI/2) * radius, y + Math.sin(heading - Math.PI/2) * radius);
        ctx.stroke();
        ctx.fill();
    }

    distance(boid, width, height) {
        const x0 = Math.min(this.x, boid.x);
        const y0 = Math.min(this.y, boid.y);

        const x1 = Math.max(this.x, boid.x);
        const y1 = Math.max(this.y, boid.y);

        const dx = Math.min(x1 - x0, x0 + width - x1);
        const dy = Math.min(y1 - y0, y0 + height - y1);

        return Math.hypot(dx, dy);
    }

    getNeighbors(swarm) {
        const {width, height, boids} = swarm;
        return boids.filter(boid => boid != this && this.distance(boid, width, height) < this.vision);
    }

    step(swarm) {
        const {width, height} = swarm;
        const neighbors = this.getNeighbors(swarm);
        if (neighbors.length > 0) {
            let meanhx = 0;
            let meanhy = 0;
            let meanx = 0;
            let meany = 0;
            let mindist = this.radius * 2;
            let min = null;
            neighbors.forEach(boid => {
                meanhx += Math.cos(boid.heading);
                meanhy += Math.sin(boid.heading);
                meanx += boid.x;
                meany += boid.y;
                const dist = this.distance(boid, width, height);
                if (dist < mindist) {
                    mindist = dist;
                    min = boid;
                }
            });
            meanhx /= neighbors.length;
            meanhy /= neighbors.length;
            meanx /= neighbors.length;
            meany /= neighbors.length;

            let target;
            if (min) {
                // Keep away!
                target = Math.atan2(this.y - min.y, this.x - min.x);
            } else {
                // Match heading and move towards center
                const meanh = Math.atan2(meanhy, meanhx);
                const center = Math.atan2(meany - this.y, meanx - this.x);
                target = Boid.meanAngle(meanh, meanh, meanh, center);
            }

            // Move in this direction
            let delta = Boid.wrap(target - this.heading, -Math.PI, Math.PI);
            delta = Boid.clamp(delta, this.radialSpeed);
            this.heading = Boid.wrap(this.heading + delta, -Math.PI, Math.PI);
        }

        this.move(swarm);
    }

    move(swarm) {
        const {padding, width, height} = swarm;
        const {x, y, heading, speed} = this;
        this.x = Boid.wrap(x + Math.cos(heading) * speed, -padding, width + padding * 2);
        this.y = Boid.wrap(y + Math.sin(heading) * speed, -padding, height + padding * 2);
    }

    static wrap(value, min = 0, max) {
        while (value >= max) {
            value -= (max - min);
        }
        while (value < min) {
            value += (max - min);
        }
        return value;
    }

    static clamp(value, limit) {
        return Math.min(limit, Math.max(-limit, value));
    }

    static meanAngle(...angles) {
        let sumx = 0, sumy = 0;
        angles.forEach(angle => {
            sumx += Math.cos(angle);
            sumy += Math.sin(angle);
        });
        const len = angles.length;
        return Math.atan2(sumy / len, sumx / len);
    }

}

Boid.prototype.radius = 8;
Boid.prototype.speed = 2;
Boid.prototype.radialSpeed = Math.PI / 60;
Boid.prototype.vision = 50;

class Swarm {
    constructor(canvas, padding = 8) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.padding = padding;
        this.boids = [];
    }

    get width() {
        return this.canvas.width;
    }

    get height() {
        return this.canvas.height;
    }

    animate() {
        this.step();
        requestAnimationFrame(() =>this.animate());
    }

    createBoid(n = 1) {
        for (let i = 0; i < n; i++) {
            this.boids.push(new Boid(this));
        }
    }

    clear() {
        this.boids = [];
    }

    resize() {
        const {canvas} = this;
        if (canvas.width != window.innerWidth) {
            canvas.width = window.innerWidth;
        }
        if (canvas.height != window.innerHeight) {
            canvas.height = window.innerHeight;
        }
    }

    step(swarm) {
        this.resize();

        const {ctx} = this;
        ctx.fillStyle = "#ffc";
        ctx.fillRect(0, 0, this.width, this.height);

        this.boids.forEach(boid => {
            boid.step(this);
            boid.draw(ctx);
        });
    };

}
