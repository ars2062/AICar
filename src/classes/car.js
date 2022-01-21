import { Boundary, Ray } from ".";
import { Vector } from "p5";

let render_rays = true;

let render_car = true;

export class Car {
  constructor(p5, x, y, walls) {
    document.getElementById("render-car").onchange = (e) => {
      render_car = e.target.checked;
    };

    document.getElementById("render-rays").onchange = (e) => {
      render_rays = e.target.checked;
    };
    this.p5 = p5;
    this.pos = this.p5.createVector(x, y);
    this.vel = this.p5.createVector(0, 0);
    this.acc = this.p5.createVector(0, 0);
    this.angle = -this.p5.HALF_PI;
    this.forward = false;
    this.reverse = false;
    this.left = false;
    this.right = false;
    this.dead = false;
    this.rays = [];
    this.walls = walls;
    this.rayLines = [];
    this.observationSaveN = 8;
  }
  render(own_decision) {
    this.p5.stroke(255);
    if (render_rays)
      this.rayLines.forEach((l) => {
        this.p5.line(l[0], l[1], l[2], l[3]);
      });
    if (own_decision) this.p5.fill(0);
    else this.p5.fill(0, 0, 255);

    if (render_car) {
      this.p5.noStroke();
      this.p5.push();
      this.p5.translate(this.pos.x, this.pos.y);
      this.p5.rotate(this.angle - this.p5.HALF_PI);
      this.p5.rectMode(this.p5.CENTER);
      this.p5.rect(0, 0, 10, 20);
      this.p5.fill(255);
      this.p5.rect(3, 10, 4, 4);
      this.p5.rect(-3, 10, 4, 4);
      this.p5.fill(255, 0, 0);
      this.p5.rect(4, -10, 2, 2);
      this.p5.rect(-4, -10, 2, 2);
      this.p5.pop();
    }
  }
  head() {
    const head = Vector.fromAngle(this.angle);
    head.mult(2);
    return head;
  }
  lines() {
    const lines = [];
    const cx = this.pos.x;
    const cy = this.pos.y;

    let x1 = cx - 10;
    let y1 = cy - 5;
    let tempX = x1 - cx;
    let tempY = y1 - cy;
    let rotatedX =
      tempX * this.p5.cos(this.angle) - tempY * this.p5.sin(this.angle) + cx;
    let rotatedY =
      tempX * this.p5.sin(this.angle) + tempY * this.p5.cos(this.angle) + cy;
    x1 = rotatedX;
    y1 = rotatedY;

    let x2 = cx - 10;
    let y2 = cy + 5;
    tempX = x2 - cx;
    tempY = y2 - cy;
    rotatedX =
      tempX * this.p5.cos(this.angle) - tempY * this.p5.sin(this.angle) + cx;
    rotatedY =
      tempX * this.p5.sin(this.angle) + tempY * this.p5.cos(this.angle) + cy;
    x2 = rotatedX;
    y2 = rotatedY;

    let x3 = cx + 10;
    let y3 = cy + 5;
    tempX = x3 - cx;
    tempY = y3 - cy;
    rotatedX =
      tempX * this.p5.cos(this.angle) - tempY * this.p5.sin(this.angle) + cx;
    rotatedY =
      tempX * this.p5.sin(this.angle) + tempY * this.p5.cos(this.angle) + cy;
    x3 = rotatedX;
    y3 = rotatedY;

    let x4 = cx + 10;
    let y4 = cy - 5;
    tempX = x4 - cx;
    tempY = y4 - cy;
    rotatedX =
      tempX * this.p5.cos(this.angle) - tempY * this.p5.sin(this.angle) + cx;
    rotatedY =
      tempX * this.p5.sin(this.angle) + tempY * this.p5.cos(this.angle) + cy;
    x4 = rotatedX;
    y4 = rotatedY;

    lines.push(new Boundary(this.p5, x1, y1, x2, y2));
    lines.push(new Boundary(this.p5, x2, y2, x3, y3));
    lines.push(new Boundary(this.p5, x3, y3, x4, y4));
    lines.push(new Boundary(this.p5, x4, y4, x1, y1));
    return lines;
  }
  step(action) {
    this.take_action(action);
    if (this.forward) {
      this.applyForce(this.head());
    }
    if (this.reverse) {
      this.applyForce(this.head().mult(-1));
    }
    if (this.left) {
      this.angle -= 0.1;
    }
    if (this.right) {
      this.angle += 0.1;
    }
    this.vel.add(this.acc);
    this.vel.add(-this.vel.mult(0.9));
    this.pos.add(this.vel);
    this.vel.limit(3);
    this.acc.mult(0);

    return this.getObservation();
  }
  getObservation() {
    // casting rays for distance from walls
    this.rays = [];
    this.rayLines = [];
    this.rays.push(new Ray(this.p5, this.pos, this.angle + this.p5.HALF_PI));
    this.rays.push(new Ray(this.p5, this.pos, this.angle - this.p5.HALF_PI));
    this.rays.push(new Ray(this.p5, this.pos, this.angle + this.p5.PI / 4.0));
    this.rays.push(new Ray(this.p5, this.pos, this.angle - this.p5.PI / 4.0));
    this.rays.push(
      new Ray(this.p5, this.pos, this.angle - this.p5.PI + this.p5.PI / 10.0)
    );
    this.rays.push(
      new Ray(this.p5, this.pos, this.angle - this.p5.PI - this.p5.PI / 10.0)
    );
    this.rays.push(new Ray(this.p5, this.pos, this.angle));
    let distances = [];
    for (let i = 0; i < this.rays.length; i++) {
      const ray = this.rays[i];
      let closest = null;
      let record = Infinity;
      for (let wall of this.walls) {
        const pt = ray.cast(wall);
        if (pt) {
          const d = Vector.dist(this.pos, pt);
          if (d < record) {
            record = d;
            closest = pt;
          }
        }
      }
      if (closest) {
        distances.push(
          this.p5.dist(this.pos.x, this.pos.y, closest.x, closest.y)
        );
        this.rayLines.push([this.pos.x, this.pos.y, closest.x, closest.y]);
      } else {
        distances.push(0);
      }
    }
    return [this.vel.mag(), ...distances];
  }
  applyForce(force) {
    this.acc.add(force);
  }

  take_action(n) {
    this.applyForce(this.head());
    switch (n) {
      case 0:
        this.angle -= 0.1;
        break;
      case 1:
        this.angle += 0.1;
        break;
    }
  }
}
