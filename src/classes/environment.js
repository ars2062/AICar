import { Boundary, Car } from ".";

const MOVE_PENALTY = 1;
const WALL_PENALTY = 300;
const GATE_REWARD = 25;
const FINISH_REWARD = 1000;

let render_track = true;
let render_reward_gates = true;
let render_finish_line = true;

export class Environment {
  constructor(p5, level) {
    document.getElementById("render-track").onchange = (e) => {
      render_track = e.target.checked;
    };

    document.getElementById("render-reward-gates").onchange = (e) => {
      render_reward_gates = e.target.checked;
    };

    document.getElementById("render-finish-line").onchange = (e) => {
      render_finish_line = e.target.checked;
    };
    this.p5 = p5;
    this.p5.resizeCanvas(level.width, level.height);
    this.walls = [];
    // this.level.walls.forEach(wall => {
    //   this.walls.push(new Boundary(wall[0], wall[1], wall[2], wall[3]));
    // });
    this.level = level;
    for (let i = 0; i < this.level.walls.length; i++) {
      const wall = this.level.walls[i];
      this.walls.push(
        new Boundary(this.p5, wall[0], wall[1], wall[2], wall[3])
      );
    }
    this.rewardGates = [];
    for (let i = 0; i < this.level.rewardGates.length; i++) {
      const wall = this.level.rewardGates[i];
      this.rewardGates.push(
        new Boundary(this.p5, wall[0], wall[1], wall[2], wall[3])
      );
    }
    this.finish = this.setFinish(this.level.finish);
  }
  setFinish(f) {
    const lines = [];
    const cx = f[0];
    const cy = f[1];

    let x1 = cx - 30;
    let y1 = cy - 7.5;
    let tempX = x1 - cx;
    let tempY = y1 - cy;
    let rotatedX = tempX * this.p5.cos(f[2]) - tempY * this.p5.sin(f[2]) + cx;
    let rotatedY = tempX * this.p5.sin(f[2]) + tempY * this.p5.cos(f[2]) + cy;
    x1 = rotatedX;
    y1 = rotatedY;

    let x2 = cx - 30;
    let y2 = cy + 7.5;
    tempX = x2 - cx;
    tempY = y2 - cy;
    rotatedX = tempX * this.p5.cos(f[2]) - tempY * this.p5.sin(f[2]) + cx;
    rotatedY = tempX * this.p5.sin(f[2]) + tempY * this.p5.cos(f[2]) + cy;
    x2 = rotatedX;
    y2 = rotatedY;

    let x3 = cx + 30;
    let y3 = cy + 7.5;
    tempX = x3 - cx;
    tempY = y3 - cy;
    rotatedX = tempX * this.p5.cos(f[2]) - tempY * this.p5.sin(f[2]) + cx;
    rotatedY = tempX * this.p5.sin(f[2]) + tempY * this.p5.cos(f[2]) + cy;
    x3 = rotatedX;
    y3 = rotatedY;

    let x4 = cx + 30;
    let y4 = cy - 7.5;
    tempX = x4 - cx;
    tempY = y4 - cy;
    rotatedX = tempX * this.p5.cos(f[2]) - tempY * this.p5.sin(f[2]) + cx;
    rotatedY = tempX * this.p5.sin(f[2]) + tempY * this.p5.cos(f[2]) + cy;
    x4 = rotatedX;
    y4 = rotatedY;

    lines.push(new Boundary(this.p5, x1, y1, x2, y2));
    lines.push(new Boundary(this.p5, x2, y2, x3, y3));
    lines.push(new Boundary(this.p5, x3, y3, x4, y4));
    lines.push(new Boundary(this.p5, x4, y4, x1, y1));
    return lines;
  }
  reset() {
    for (let i = 0; i < this.rewardGates.length; i++) {
      this.rewardGates[i].passed = false;
    }
    const carPos = this.level.car;
    this.car = new Car(this.p5, carPos[0], carPos[1], this.walls);
    this.episode_step = 0;
    this.ngates = 0;
    this.lap = 0;
    this.observationSaveN = this.car.observationSaveN;
    return this.car.getObservation();
  }
  render() {
    if (render_track) this.renderWalls();
    if (render_reward_gates) this.renderGates();
    if (render_finish_line) this.renderFinish();
  }
  step(action) {
    this.car.step(action);
    let reward = 0;
    let done = false;
    const gate = this.hitGates();
    if (this.hitWalls()) {
      reward = -WALL_PENALTY;
      done = true;
    } else if (gate) {
      reward = GATE_REWARD;
      this.ngates += 1;
      this.rewardGates[gate].passed = true;
    } else if (this.hitFinish()) {
      this.ngates = 0;
      for (let i = 0; i < this.rewardGates.length; i++) {
        this.rewardGates[i].passed = false;
      }
      this.lap++;
      reward = FINISH_REWARD * this.lap;
      // done = true
    } else reward = -MOVE_PENALTY;

    return [this.car.getObservation(), reward, done];
  }
  hitWalls() {
    // checking if hit wall
    for (let i = 0; i < this.walls.length; i++) {
      const wall = this.walls[i];
      const lines = this.car.lines();
      for (let j = 0; j < lines.length; j++) {
        const line = lines[j];

        if (
          this.p5.collideLineLine(
            wall.a.x,
            wall.a.y,
            wall.b.x,
            wall.b.y,
            line.a.x,
            line.a.y,
            line.b.x,
            line.b.y
          )
        ) {
          return true;
        }
      }
    }
    return false;
  }
  hitGates() {
    // checking if hit wall
    for (let i = 0; i < this.rewardGates.length; i++) {
      const wall = this.rewardGates[i];
      const lines = this.car.lines();
      for (let j = 0; j < lines.length; j++) {
        const line = lines[j];

        if (
          this.p5.collideLineLine(
            line.a.x,
            line.a.y,
            line.b.x,
            line.b.y,
            wall.a.x,
            wall.a.y,
            wall.b.x,
            wall.b.y
          ) &&
          wall.passed == false
        ) {
          return [i];
        }
      }
    }
    return false;
  }
  hitFinish() {
    if (this.ngates > Math.floor(this.rewardGates.length / 2)) {
      for (let i = 0; i < this.car.lines().length; i++) {
        const car_line = this.car.lines()[i];
        for (let j = 0; j < this.finish.length; j++) {
          const finish_line = this.finish[j];
          if (
            this.p5.collideLineLine(
              car_line.a.x,
              car_line.a.y,
              car_line.b.x,
              car_line.b.y,
              finish_line.a.x,
              finish_line.a.y,
              finish_line.b.x,
              finish_line.b.y
            )
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }
  renderWalls() {
    for (let i = 0; i < this.walls.length; i++) {
      const wall = this.walls[i];
      this.p5.stroke(0);
      wall.show();
    }
  }
  renderGates() {
    for (let i = 0; i < this.rewardGates.length; i++) {
      const wall = this.rewardGates[i];
      if (!wall.passed) this.p5.stroke(0, 255, 0);
      else this.p5.stroke(100);
      wall.show();
    }
  }
  renderFinish() {
    // stroke(0, 0, 255)
    // line(this.finish[0].a.x, this.finish[0].a.y, this.finish[0].b.x, this.finish[0].b.y)
    // line(this.finish[1].a.x, this.finish[1].a.y, this.finish[1].b.x, this.finish[1].b.y)
    // line(this.finish[2].a.x, this.finish[2].a.y, this.finish[2].b.x, this.finish[2].b.y)
    // line(this.finish[3].a.x, this.finish[3].a.y, this.finish[3].b.x, this.finish[3].b.y)

    this.p5.noStroke();
    let w = 5;
    let odd = true;

    this.p5.push();
    this.p5.translate(this.level.finish[0], this.level.finish[1]);
    this.p5.rotate(this.level.finish[2]);
    this.p5.rectMode("corner");
    let x = -30;
    let y = -7.5;
    for (let i = 0; i < 12; i++) {
      for (let j = 0; j < 3; j++) {
        if (odd) {
          this.p5.fill(0);
          this.p5.rect(i * w + x, j * w + y, w, w);
        } else {
          this.p5.fill(255);
          this.p5.rect(i * w + x, j * w + y, w, w);
        }
        odd = !odd;
        //count++;
      }
    }
    this.p5.pop();
  }
  sendAction(n, val) {
    this.car.take_action(n, val);
  }
  getValue(id) {
    return document.getElementById(id).value;
  }
}
