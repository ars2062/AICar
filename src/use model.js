import p5 from "p5";
import { importCollide } from "./classes";
importCollide(p5);
import * as tf from "@tensorflow/tfjs";
import { Environment } from "./classes";
new p5((p5) => {
  let env = undefined;
  let model = undefined;
  let done = true;
  let current_state = undefined;

  let models = undefined;
  let levels = undefined;
  let start = true;

  function loadLevels() {
    levels = localStorage.getItem("AiCarLevels");
    const list = document.getElementById("Levels");
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
  function loadModels() {
    models = localStorage.getItem("AiCarModels");
    const list = document.getElementById("Models");
    list.innerHTML = "";
    let l = document.createElement("label");
    l.innerText = "Saved Models";
    list.appendChild(l);
    if (models) {
      models = JSON.parse(models);
      for (let i = 0; i < models.length; i++) {
        const model = models[i];
        const json = JSON.parse(
          atob(model.json.replace("data:application/json;base64,", ""))
        );
        models[i].weights = dataURLtoFile(
          models[i].weights,
          json.weightsManifest[0].paths[0]
        );
        models[i].json = dataURLtoFile(models[i].json, "model.json");
        let div = document.createElement("div");
        div.innerText = json.weightsManifest[0].paths[0]
          .toString()
          .replace("./", "")
          .replace(".weights.bin", "");
        div.dataset.id = i;
        div.addEventListener("click", loadModel);
        list.appendChild(div);
      }
    } else {
      models = [];
    }
  }
  function loadModel(e) {
    model = undefined;
    done = true;
    document.querySelectorAll("#Models div").forEach((el) => {
      el.classList.remove("active");
    });
    e.target.classList.add("active");
    model = models[e.target.dataset.id];
    tf.loadLayersModel(tf.io.browserFiles([model.json, model.weights])).then(
      (m) => {
        model = m;
      }
    );
  }
  function loadLevel(e) {
    env = undefined;
    done = true;
    document.querySelectorAll("#Levels div").forEach((el) => {
      el.classList.remove("active");
    });
    e.target.classList.add("active");

    env = new Environment(p5, levels[e.target.dataset.id]);
  }
  p5.setup = () => {
    loadLevels();
    loadModels();
    let cnv = p5.createCanvas(500, 400);
    cnv.id = "trainer";
    cnv.parent(document.getElementById("canvasContainer3"));
    p5.rectMode(p5.CENTER);
    p5.background(200);
    p5.strokeWeight(3);
  };
  p5.draw = () => {
    if (start && env != undefined && model != undefined) {
      if (!done) {
        const qs = model.predict(tf.tensor(current_state, [1, 8])).dataSync();
        const action = qs.indexOf(Math.max(...qs));
        try {
          const res = env.step(action);
          current_state = res[0];
          done = res[2];
          p5.background(200);
          env.render();
          env.car.render(true);
          p5.noStroke();
          p5.fill(0);
        } catch {}
      } else {
        try {
          current_state = env.reset();
          done = false;
        } catch {}
      }
    }
  };
  function dataURLtoFile(dataurl, filename) {
    var arr = dataurl.split(","),
      mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]),
      n = bstr.length,
      u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
  }
});
