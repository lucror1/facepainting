class Curve {
    constructor(color, width) {
        this.points = [];
        this.color = color;
        this.width = width;
    }

    // Add a Point to the points array
    addPoint(p) {
        this.points.push(p);
    }

    drawAll(ctx) {
        // Set correct settings in ctx
        ctx.strokeStyle = this.color;
        ctx.fillStyle = this.color;
        ctx.lineWidth = this.width;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Draw all points if there are at least 2
        if (this.points.length >= 2) {
            ctx.beginPath();
            ctx.moveTo(this.points[0].x, this.points[0].y);
            for (let i = 0; i < this.points.length - 1; i++) {
                ctx.lineTo(this.points[i].x, this.points[i].y);
            }
            ctx.stroke();
        }
        // If only 1 point exists, draw a circle instead
        else if (this.points.length == 1) {
            ctx.beginPath();
            ctx.arc(this.points[0].x, this.points[0].y, this.width/2, 0, 2*Math.PI);
            ctx.fill();
        }
    }
}