export class Boundary {
  constructor(p5,x1, y1, x2, y2) {
    this.p5 = p5;
    this.a = this.p5.createVector(x1, y1);
    this.b = this.p5.createVector(x2, y2);
    this.passed = false
  }

  show() {
    this.p5.line(this.a.x, this.a.y, this.b.x, this.b.y);
  }

  rotate(angle) {
    this.a = this.rotatePoint(this.a,this.p5.degrees(angle));
    this.b = this.rotatePoint(this.b,this.p5.degrees(angle));
    return this;
  }
  rotatePoint(p, angle) {
    const x2 = Math.cos(angle * p.x) - Math.sin(angle * p.y);
    const y2 = Math.sin(angle * p.x) - Math.cos(angle * p.y);
    return this.p5.createVector(x2, y2);
  }
}
