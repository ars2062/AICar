export class Deque {
  constructor(maxlen = 0) {
    this.maxlen = maxlen;
    this.stac = new Array();
  }
  popback() {
    return this.stac.pop();
  }
  pushback(item) {
    if (this.stac.length > this.maxlen) this.popfront();
    this.stac.push(item);
  }
  popfront() {
    return this.stac.shift();
  }
  pushfront(item) {
    if (this.stac.length > this.maxlen) this.popback();
    this.stac.unshift(item);
  }

  get length(){
      return this.stac.length
  }
}
