
class Tabs {
	constructor(parent, spawn) {
		this._parent = parent;
		this._spawn = spawn;
		this._stack = {};
		this._active = null;

		this._defaultUI = { color: "#222", opacity: .8 };

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
			bgUI = window.settings.getItem("bg-user-interface") || this._defaultUI,
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
		this._stack[tId] = {
			tId, tabEl, bodyEl, bgUI, els, history, file,
			set cwd(path) {
				this.file = new defiant.File({ path });
			},
			get cwd() {
				return this.file.path;
			}
		};
		// focus on file
		this.focus(tId);
		// obey settings bg-color & opacity
		let arg = Math.floor(bgUI.opacity * 100);
		this._parent.dispatch({ type: "change-opacity", spawn: this._spawn, arg });
	}

	remove(tId) {
		this._stack[tId] = false;
		delete this._stack[tId];
	}

	focus(tId) {
		if (tId && this._active) {
			// hide blurred body
			this._active.bodyEl.addClass("hidden");
		}
		let active = tId ? this._stack[tId] : this._active;
		// reference to active tab
		this._active = active;
		// update reference "terminal.spawn.refActive"
		this._parent.refActive = active;
		// update reference to window body
		this._parent.winBody = active.bodyEl.parents("content").parent();
		// update menu
		window.bluePrint.selectSingleNode(`//Menu[@type="colors"]/*[@active]`).removeAttribute("active");
		window.bluePrint.selectSingleNode(`//Menu[@type="colors"]/*[@arg="${active.bgUI.color}"]`).setAttribute("active", 1);
		// unhide focused body
		active.bodyEl.removeClass("hidden");
		// update spawn window title
		this._spawn.title = active.file.base;
		// set tab cwd
		terminal.FS.cwd = active.file.path;
		// cursor focus
		active.els.textarea.focus();
	}

	blur() {
		let active = this._active;
		// cursor blur
		active.els.textarea.blur();
	}
}
