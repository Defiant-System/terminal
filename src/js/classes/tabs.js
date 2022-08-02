
class Tabs {
	constructor(parent, spawn) {
		this._parent = parent;
		this._spawn = spawn;
		this._stack = {};
		this._active = null;

		// DOM template
		let template = spawn.find(`content > div[data-id="ui-template"]`);
		this._content = spawn.find("content");
		this._template = template.clone();
		template.remove();
	}

	add(file) {
		let tId = "f"+ Date.now(),
			tName = file.path.replace("/fs/", "~/"),
			tabEl = this._spawn.tabs.add(tName, tId),
			bodyEl = this._template.clone(),
			history = new History(hLog);

		// add element to DOM + append file contents
		bodyEl.attr({ "data-id": tId });
		bodyEl = this._content.append(bodyEl);

		// save reference to tab
		this._stack[tId] = { tabEl, bodyEl, history, file };
		// focus on file
		this.focus(tId);
	}

	remove(tId) {
		this._stack[tId] = false;
		delete this._stack[tId];
	}

	focus(tId) {
		// reference to active tab
		this._active = this._stack[tId];
		// UI update
		this.update();
	}

	update() {
		let active = this._active;
		// unhide focused body
		active.bodyEl.removeClass("hidden");

		// update spawn window title
		this._spawn.title = active.file.base;
	}
}
