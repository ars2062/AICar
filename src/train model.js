import p5 from "p5";
import { importCollide } from "./classes";
importCollide(p5);
import * as tf from '@tensorflow/tfjs'
import { Deque, Environment, DQNAgent } from "./classes";
document.querySelector('[data-type="import"]').addEventListener("click", () => {
  window.location.hash =
    window.location.hash == "#import-modal" ? "" : "import-modal";
});

new p5((p5) => {
  let env = undefined;
  let agent = undefined;
  let epsilon = 1;
  const EPSILON_DECAY = 0.99995;
  const MIN_EPSILON = 0.05;
  let SHOW_EVERY = 10;
  let step = 1;
  let current_state = undefined;
  let episode_reward = 0;
  let done = true;
  let episode = 1;
  const SAVE_EVERY = 100;
  let MODEL_NAME = "something";
  let do_render = false;
  const MIN_REWARD = -2000;
  let car_decision = false;
  let last_decisions = [];
  let models = undefined;
  let levels = undefined;
  let start = false;
  let selected_level = -1;
  let selected_model = -1;
  document.getElementById("import").addEventListener("click", () => {
    if (checkValidImport()) {
      import_model();
    }
  });
  document.getElementById("close").addEventListener("click", () => {
    window.location.hash = "";
  });

  document.querySelector('[data-type="start"]').addEventListener("click", play);
  document
    .querySelector('[data-type="reset"]')
    .addEventListener("click", reset);
  document.getElementById("SHOW_EVERY").addEventListener("change", (e) => {
    SHOW_EVERY = e.target.value;
  });
  document.getElementById("modelName").addEventListener("change", (e) => {
    MODEL_NAME = e.target.value;
  });
  document
    .querySelector('[data-type="save"]')
    .addEventListener("click", save_model);

  function checkValidImport() {
    const json_input = document.getElementById("modelJson");
    const weights_input = document.getElementById("modelWeights");
    if (json_input.files.length > 0 && weights_input.files.length > 0)
      return true;
    else return false;
  }

  function play(e) {
    last_decisions = new Deque(20);
    p5.loop();
    start = true;
  }

  function reset() {
    start = false;
    env = undefined;
    agent = undefined;
    epsilon = 1;
    document.querySelectorAll("#models div").forEach((el) => {
      el.classList.remove("active");
    });
    document.querySelectorAll("#levels div").forEach((el) => {
      el.classList.remove("active");
    });
    selected_level = selected_model = -1;
  }

  p5.setup = () => {
    loadLevels();
    loadModels();
    let cnv = p5.createCanvas(500, 400);
    cnv.id = "trainer";
    cnv.parent(document.getElementById("canvasContainer2"));
    p5.background(200);
    p5.strokeWeight(3);
    p5.rectMode(p5.CENTER);
    p5.noLoop();
    // p5.frameRate(10)
  };
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
    document.querySelectorAll("#models div").forEach((el) => {
      el.classList.remove("active");
    });
    e.target.classList.add("active");
    selected_model = e.target.dataset.id;
  }
  function loadLevel(e) {
    document.querySelectorAll("#levels div").forEach((el) => {
      el.classList.remove("active");
    });
    e.target.classList.add("active");
    selected_level = e.target.dataset.id;
  }
  p5.draw = () => {
    if (start) {
      tf.tidy(() => {
        if (selected_level != -1 && env == undefined) {
          const json = levels[selected_level];
          env = new Environment(p5, json);
        }
        if (selected_model != -1 && agent == undefined) {
          const model = models[selected_model];
          agent = new DQNAgent(model);
        } else if (agent == undefined) {
          agent = new DQNAgent();
        }

        if (agent && Environment)
          if (agent.modelLoaded) {
            if (episode_reward <= MIN_REWARD) done = true;
            if (!done) {
              let action = undefined;

              if (p5.random() > epsilon) {
                const qs = agent.get_qs(current_state).dataSync();
                action = qs.indexOf(Math.max(...qs));
                car_decision = true;
              } else {
                action = Math.round(p5.random(0, agent.nActions - 1));
                car_decision = false;
              }
              last_decisions.pushfront(car_decision);
              const res = env.step(action);
              const new_state = res[0];
              const reward = res[1];
              done = res[2];

              episode_reward += reward;

              if (episode % SHOW_EVERY == 0) {
                do_render = episode;
              }
              if (do_render == episode) {
                render();
              } else {
                do_render = false;
              }
              // render()

              agent.update_replay_memory([
                current_state,
                action,
                reward,
                new_state,
                done,
              ]);

              tf.tidy(() => {
                agent.train(done);
              });
              current_state = new_state;
              step++;
            } else {
              // if (episode % SAVE_EVERY == 0 || episode_reward >= MAX_REWARD)
              //   agent.model.save(`indexeddb://${MODEL_NAME}-${episode}`)
              episode_reward = 0;
              step = 1;
              current_state = env.reset();
              done = false;
              episode++;
            }
            if (epsilon > MIN_EPSILON) {
              epsilon *= EPSILON_DECAY;
              epsilon = Math.max(epsilon, MIN_EPSILON);
            }
          }
      });
    }
  };
  p5.keyPressed = () => {
    switch (p5.key) {
      case "a":
        do_render = episode;
        break;
    }
  };
  p5.keyReleased = () => {
    switch (p5.key) {
      case "w":
        env.sendAction(0, false);
        break;
      case "s":
        env.sendAction(1, false);
        break;
      case "a":
        env.sendAction(2, false);
        break;
      case "d":
        env.sendAction(3, false);
        break;
    }
  };
  function render() {
    p5.background(200);
    env.render();
    env.car.render(car_decision);
    p5.noStroke();
    p5.fill(0);
    p5.text("episode: " + episode, 5, 15);
    p5.text("episode reward: " + episode_reward, 5, 25);
    p5.text("epsilon: " + epsilon, 5, 35);
    p5.text("laps: " + env.lap, 5, 45);
    // stroke(0)
    // env.car.lines().forEach(line => {
    //   line.show()
    // });
    render_lastdecisions();
  }
  function render_lastdecisions() {
    const x = 300;
    for (let i = 0; i < last_decisions.length; i++) {
      const element = last_decisions.stac[i];

      if (element) p5.fill(0, 255, 0);
      else p5.fill(255, 0, 0);
      p5.rect(x + i * 10, 20, 10, 10);
    }
  }
  function save_model() {
    agent.model.save(`downloads://${MODEL_NAME}-${episode}-${episode_reward}`);
  }
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
  function import_model() {
    const json_input = document.getElementById("modelJson");
    const weights_input = document.getElementById("modelWeights");
    const reader1 = new FileReader();
    let tempModels = localStorage.getItem("AiCarModels");
    if (!tempModels) tempModels = [];
    else tempModels = JSON.parse(tempModels);
    reader1.onload = (event1) => {
      const json = event1.target.result;
      const reader2 = new FileReader();
      reader2.onload = (event2) => {
        const weights = event2.target.result;
        tempModels.push({ json: json, weights: weights });
        localStorage.setItem("AiCarModels", JSON.stringify(tempModels));
        loadModels();
      };
      reader2.readAsDataURL(weights_input.files[0]);
    };
    reader1.readAsDataURL(json_input.files[0]);
  }
});
