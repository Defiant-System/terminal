
const History = {
	log: [],
	push(item) {
		this.log.splice(this._index);
		this.log.push(item);
		// keep last 100 of log entries
		this.log = this.log.slice(-1e2);
		this._index = this.log.length;
	},
	goPrev() {
		this._index = Math.max(this._index - 1, 0);
	},
	goNext() {
		this._index = Math.min(this._index + 1, this.log.length);
	},
	serialize() {
		return JSON.stringify(this.log);
	},
	parse(log) {
		if (!log) return;
		this.log = JSON.parse(log);
		this._index = this.log.length;
	},
	get(i) {
		return this.log[i-1];
	},
	get current() {
		return this.log[this._index] || "";
	},
	get index() {
		return this._index;
	},
	get length() {
		return this.log.length;
	},
	get isFirst() {
		return this._index === 0;
	},
	get isLast() {
		return this._index === thist.log.length - 1;
	}
}

export default History;
