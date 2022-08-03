
class Tabs {
	constructor(parent, spawn) {
		this._parent = parent;
		this._spawn = spawn;
		this._stack = {};
		this._active = null;

		// DOM template
		let template = spawn.find(`content > div[data-id="ui-template"]`);
		this._content = spawn.find("content");
		this._template = template.clone(true);
		template.remove();
	}

	get length() {
		return Object.keys(this._stack).length;
	}

	add(file) {
		let tId = "f"+ Date.now(),
			tName = file.path.replace("/fs/", "~/"),
			tabEl = this._spawn.tabs.add(tName, tId),
			bodyEl = this._template.clone(true),
			history = new History(hLog),
			els = {};

		// add element to DOM + append file contents
		bodyEl = this._content.append(bodyEl);
		bodyEl.attr({ "data-id": tId });
		// fast references
		els.textarea = bodyEl.find("textarea");
		els.buffer = bodyEl.find(".output-buffer");
		els.input = bodyEl.find(".input");
		els.cursor = els.input.find(".cursor");
		els.caret = els.cursor.find("svg:nth(1)");
		els.stdIn = els.input.find(".buffer");
		els.prompt = els.input.find("b");

		// save reference to tab
		this._stack[tId] = { tabEl, bodyEl, els, history, file };
		// focus on file
		this.focus(tId);
	}

	remove(tId) {
		this._stack[tId] = false;
		delete this._stack[tId];
	}

	focus(tId) {
		if (this._active) {
			// hide blurred body
			this._active.bodyEl.addClass("hidden");
		}
		let active = this._stack[tId];
		// reference to active tab
		this._active = active;
		// unhide focused body
		active.bodyEl.removeClass("hidden");
		// update spawn window title
		this._spawn.title = active.file.base;

		// TODO: set cwd
		terminal.FS.cwd = active.file.path;

		active.els.textarea.focus();
	}
}
