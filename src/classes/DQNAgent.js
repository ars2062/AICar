import { Deque } from "."
import * as tf from '@tensorflow/tfjs'

const REPLAY_MEMORY_SIZE = 4000000
const MIN_REPLAY_MEMORY_SIZE = 256
const MINIBATCH_SIZE = 256
const DISCOUNT = 0.99
const UPDATE_TARGET_EVERY = 5
const MODEL_PATH = ''
export class DQNAgent {
    constructor(model = undefined) {
        this.nActions = 2
        this.modelLoaded = false
        if (model != undefined) {
            tf.loadLayersModel(tf.io.browserFiles(
                [model.json, model.weights])).then(m1 => {
                    this.model = m1
                    tf.loadLayersModel(tf.io.browserFiles(
                        [model.json, model.weights])).then(m2 => {
                            this.target_model = m2
                            this.model.compile({ optimizer: tf.train.sgd(0.001), loss: 'meanSquaredError' });
                            this.target_model.compile({ optimizer: tf.train.sgd(0.001), loss: 'meanSquaredError' });
                            this.modelLoaded = true
                        })
                })
        } else {
            // main model  # gets trained every step
            this.model = this.create_model()

            // Target model this is what we .predict against every step
            this.target_model = this.create_model()
            this.target_model.setWeights(this.model.getWeights())
            this.modelLoaded = true
        }

        this.replay_memory = new Deque(REPLAY_MEMORY_SIZE)
        this.target_update_counter = 0
        this.model_fit_counter = 0
    }

    create_model() {
        const model = tf.sequential();
        model.add(tf.layers.dense({ units: 256, inputShape: [8] }))
        model.add(tf.layers.dense({ units: 256, activation: 'relu' }))
        model.add(tf.layers.dense({ units: this.nActions, activation: null }))
        model.compile({ optimizer: tf.train.adam(0.001), loss: 'meanSquaredError' });
        return model
    }

    update_replay_memory(transition) {
        // transition is observation_space, action, reward, new_observation_space, done
        this.replay_memory.pushback(transition)
    }

    get_qs(state) {
        return tf.tidy(() => {
            return this.model.predict(tf.tensor(state, [1, 8]))
        })
    }

    train(terminal_state) {
        tf.tidy(() => {
            if (this.replay_memory.length < MIN_REPLAY_MEMORY_SIZE) return
            let minibatch = this.getRandomSubarray(this.replay_memory, MINIBATCH_SIZE)
            let current_states = []
            for (let i = 0; i < minibatch.length; i++) {
                // transition
                // [0] => current_state
                // [1] => action
                // [2] => reward
                // [3] => new_state
                // [4] => done
                const transition = minibatch[i];
                current_states.push(transition[0])
            }
            let current_qs_list = this.model.predict(tf.tensor(current_states))

            let new_current_states = []
            for (let i = 0; i < minibatch.length; i++) {
                const transition = minibatch[i];
                new_current_states.push(transition[3])
            }
            let future_qs_list = this.target_model.predict(tf.tensor(new_current_states))

            let X = []
            let Y = []

            for (let i = 0; i < minibatch.length; i++) {
                const current_state = minibatch[i][0];
                const action = minibatch[i][1];
                const reward = minibatch[i][2];
                const new_current_state = minibatch[i][3];
                const done = minibatch[i][4];
                let new_q = undefined;
                if (!done) {
                    let max_future_q = Math.max(...future_qs_list.arraySync()[i])
                    new_q = reward + DISCOUNT * max_future_q
                } else {
                    new_q = reward
                }

                let current_qs = current_qs_list.arraySync()[i]
                current_qs[action] = new_q

                X.push(current_state)
                Y.push(current_qs)
            }
            this.model_fit_counter++
            if (this.model_fit_counter % 10 == 0) {
                this.model_fit_counter = 0
                tf.tidy(() => {
                    this.model.fit(tf.tensor(X), tf.tensor(Y), { batchSize: MINIBATCH_SIZE, verbose: 0, shuffle: false })
                })
            }


            //updating to determine if I want to update target model yet
            if (terminal_state) {
                this.target_update_counter++
            }
            if (this.target_update_counter > UPDATE_TARGET_EVERY) {
                this.target_model.setWeights(this.model.getWeights())
                this.target_update_counter = 0
            }
        })
    }

    getRandomSubarray(arr, size) {
        var shuffled = arr.stac.slice(0), i = arr.length, temp, index;
        while (i--) {
            index = Math.floor((i + 1) * Math.random());
            temp = shuffled[index];
            shuffled[index] = shuffled[i];
            shuffled[i] = temp;
        }
        return shuffled.slice(0, size);
    }
}