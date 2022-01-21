import p5 from "p5";
import { importCollide } from "./classes";
importCollide(p5);
new p5((p5) => {
  document.getElementById("width").addEventListener("change", sizeChanged);
  document.getElementById("height").addEventListener("change", sizeChanged);
  document
    .querySelector('[data-type="save"]')
    .addEventListener("click", saveLevel);
  document.getElementById("import").addEventListener("change", importLevel);
  let levelName = "something";
  document.getElementById("levelName").addEventListener("change", (e) => {
    levelName = e.target.value;
  });
  document
    .querySelector('[data-type="export"]')
    .addEventListener("click", exportLevel);

  let currentType = "path";

  document
    .querySelector('[data-type="wall"]')
    .addEventListener("click", (e) => {
      currentType = "path";
    });
  document
    .querySelector('[data-type="checkpoint"]')
    .addEventListener("click", (e) => {
      currentType = "point";
    });
  document.querySelector('[data-type="car"]').addEventListener("click", (e) => {
    currentType = "car";
  });
  document
    .querySelector('[data-type="finish"]')
    .addEventListener("click", (e) => {
      currentType = "finish";
    });

  let ps = [];
  let psList = [];
  let car = undefined;
  //levels/level (11).json
  const path = "";
  let finishPos = undefined;
  let finishRotation = undefined;
  let levels = undefined;
  p5.preload = () => {
    finishRotation = p5.PI;
    loadLevels();
  };
  function loadLevels() {
    levels = localStorage.getItem("AiCarLevels");
    const list = document.getElementById("list");
    list.innerHTML = "";
    let l = document.createElement("label");
    l.innerText = "Saved Levels";
    list.appendChild(l);
    if (levels) {
      levels = JSON.parse(levels);
      for (let i = 0; i < levels.length; i++) {
        const level = levels[i];
        let div = document.createElement("div");
        div.innerText = level.name;
        div.dataset.id = i;
        div.addEventListener("click", loadLevel);
        list.appendChild(div);
      }
    } else {
      levels = [];
    }
  }
  p5.setup = () => {
    let cnv = p5.createCanvas(500, 400);
    cnv.id = "editor";
    cnv.parent(document.getElementById("canvasContainer1"));
    p5.background(200);
    p5.strokeWeight(3);
    document.getElementsByTagName("canvas")[0].oncontextmenu = function () {
      return false;
    };
    p5.rectMode(p5.CENTER);
  };
  p5.draw = () => {
    p5.background(200);
    for (let i = 0; i < psList.length; i++) {
      const ps = psList[i];
      drawPoints(ps);
    }
    drawPoints(ps);

    switch (currentType) {
      case "path":
        p5.stroke(0, 0, 0, 200);
        p5.fill(0);
        break;
      case "point":
        p5.stroke(0, 255, 0, 100);
        p5.fill(0, 255, 0);
        break;
      case "car":
        p5.stroke(255, 0, 0, 100);
        p5.fill(255, 0, 0);
        break;
      case "finish":
        p5.stroke(0);
        p5.fill(255);
        break;
    }
    if (ps.length > 0) {
      const lp = ps[ps.length - 1];
      p5.line(lp.x, lp.y, p5.mouseX, p5.mouseY);
    }
    p5.ellipse(p5.mouseX, p5.mouseY, 10);

    if (car) {
      p5.fill(255, 0, 0);
      p5.noStroke();
      p5.rect(car.x, car.y, 10, 20);
    }
    if (finishPos) {
      p5.fill(255);
      p5.noStroke();
      p5.push();
      p5.translate(finishPos.x, finishPos.y);
      p5.rotate(finishRotation);
      p5.rect(0, 0, 60, 15);
      p5.pop();
    }
  };
  function drawPoints(pl) {
    for (let i = 0; i < pl.length - 1; i++) {
      const p1 = pl[i];
      const p2 = pl[i + 1];
      switch (p1.type) {
        case "path":
          p5.stroke(0);
          break;
        case "point":
          p5.stroke(0, 255, 0);
          break;
      }
      p5.line(p1.x, p1.y, p2.x, p2.y);
    }
  }
  p5.mouseWheel = (event) => {
    if (currentType == "finish") {
      if (event.delta < 0) finishRotation -= 0.1;
      else finishRotation += 0.1;
      return false;
    }
  };
  p5.keyPressed = () => {
    if (p5.keyCode == 69) {
      //e
      endPath();
    } else if (p5.keyCode == 87) {
      //w
      currentType = "point";
    } else if (p5.keyCode == 81) {
      //q
      currentType = "path";
    } else if (p5.keyCode == 82) {
      //r
      currentType = "car";
    } else if (p5.keyCode == 90) {
      //z
      if (ps.length > 0) ps.pop();
    } else if (p5.keyCode == 70) {
      //f
      currentType = "finish";
    }
  };
  function saveLevel() {
    const file = {
      name: levelName,
      width: p5.width,
      height: p5.height,
      walls: [],
      rewardGates: [],
      car: undefined,
      finish: undefined,
    };
    for (let i = 0; i < psList.length; i++) {
      const ps = psList[i];
      for (let j = 0; j < ps.length - 1; j++) {
        const point = ps[j];
        const next_point = ps[j + 1];
        switch (point["type"]) {
          case "path":
            file["walls"].push([
              point["x"],
              point["y"],
              next_point["x"],
              next_point["y"],
            ]);
            break;
          case "point":
            file["rewardGates"].push([
              point["x"],
              point["y"],
              next_point["x"],
              next_point["y"],
            ]);
            break;
        }
      }
    }
    file["car"] = [car.x, car.y];
    file["finish"] = [finishPos.x, finishPos.y, finishRotation];

    levels.push(file);
    localStorage.setItem("AiCarLevels", JSON.stringify(levels));
    loadLevels();
    // saveJSON(file, "level.json");
  }
  p5.mousePressed = (e) => {
    // e.preventDefault();
    if (
      p5.mouseX > 0 &&
      p5.mouseX < p5.width &&
      p5.mouseY > 0 &&
      p5.mouseY < p5.height
    )
      if (e.button == 0) {
        if (currentType == "path" || currentType == "point")
          ps.push({ x: p5.mouseX, y: p5.mouseY, type: currentType });
        else if (currentType == "finish")
          finishPos = p5.createVector(p5.mouseX, p5.mouseY);
        else {
          car = p5.createVector(p5.mouseX, p5.mouseY);
        }
      } else if (e.button == 2) {
        endPath();
      }
  };
  function endPath() {
    if (ps.length > 1) psList.push(ps);
    ps = [];
  }
  function sizeChanged(e) {
    let w = document.getElementById("width").value;
    let h = document.getElementById("height").value;
    p5.resizeCanvas(w, h);
  }
  function loadLevel(e) {
    document.querySelectorAll("#list div").forEach((el) => {
      el.classList.remove("active");
    });
    e.target.classList.add("active");
    const json = levels[e.target.dataset.id];
    levelName = json.name;
    document.getElementById("levelName").value = json.name;
    p5.resizeCanvas(json.width, json.height);

    let tempPs = [];
    let tempPsList = [];
    let index = 0;
    for (let i = 0; i < json.walls.length - 1; i++) {
      const wall = json.walls[i];
      const next_wall = json.walls[i + 1];

      if (wall[2] == next_wall[0] && wall[3] == next_wall[1]) {
        if (index == 0) {
          tempPs.push({ x: wall[0], y: wall[1], type: "path" });
          tempPs.push({ x: wall[2], y: wall[3], type: "path" });
        }
        tempPs.push({ x: next_wall[0], y: next_wall[1], type: "path" });
        tempPs.push({ x: next_wall[2], y: next_wall[3], type: "path" });
        index++;
      } else {
        tempPsList.push(tempPs);
        tempPs = [];
        index = 0;
      }
    }
    tempPsList.push(tempPs);
    psList = tempPsList;
    for (let i = 0; i < json.rewardGates.length; i++) {
      const gate = json.rewardGates[i];
      let tmp = [];
      tmp.push({ x: gate[0], y: gate[1], type: "point" });
      tmp.push({ x: gate[2], y: gate[3], type: "point" });
      psList.push(tmp);
    }
    finishPos = p5.createVector(json.finish[0], json.finish[1]);
    finishRotation = json.finish[2];
    car = p5.createVector(json.car[0], json.car[1]);
  }
  function importLevel(e) {
    const reader = new FileReader();
    reader.onload = (event) => {
      levels.push(JSON.parse(event.target.result));
      localStorage.setItem("AiCarLevels", JSON.stringify(levels));
      loadLevels();
    };
    reader.readAsText(e.target.files[0]);
  }
  function exportLevel(e) {
    const file = {
      name: levelName,
      width: width,
      height: height,
      walls: [],
      rewardGates: [],
      car: undefined,
      finish: undefined,
    };
    for (let i = 0; i < psList.length; i++) {
      const ps = psList[i];
      for (let j = 0; j < ps.length - 1; j++) {
        const point = ps[j];
        const next_point = ps[j + 1];
        switch (point["type"]) {
          case "path":
            file["walls"].push([
              point["x"],
              point["y"],
              next_point["x"],
              next_point["y"],
            ]);
            break;
          case "point":
            file["rewardGates"].push([
              point["x"],
              point["y"],
              next_point["x"],
              next_point["y"],
            ]);
            break;
        }
      }
    }
    file["car"] = [car.x, car.y];
    file["finish"] = [finishPos.x, finishPos.y, finishRotation];
    p5.saveJSON(file, `${levelName}.json`);
  }
});
