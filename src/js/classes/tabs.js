
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
		// version and copyright 
		this.about();
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

		active.els.textarea.focus();
	}


	/*
	 * TERMINAL application functions
	 */
	scrollIntoView() {
		let active = this._active;
		let wrapper = active.els.input.parent();
		wrapper.scrollTop(wrapper.prop("scrollHeight"));
	}

	print(sIn) {
		let stdIn = Parser.format(sIn);
		let active = this._active;
		let uiIn = active.els.buffer.append(`<div>${stdIn}</div>`);

		if (stdIn.includes(' data-click="explore-item"') && stdIn.stripHtml().length + 17 > this.charWidth) {
			// auto explore output - if content longer than window width
			uiIn.find('b.output [data-click="explore-item"]:first').trigger("click");
		}
	}

	clear() {
		let active = this._active;
		active.els.buffer.html("");
	}

	history() {
		let stdOut = History.log.map((item, index) => `${(index + 1).toString().padStart(4, " ")}  ${item}`);
		return stdOut.join("\n").feed;
	}

	grep(stdIn, str) {
		let stdOut = stdIn.split("<br>").reduce((acc, line) => {
				line = line.stripHtml();
				if (~line.indexOf(str)) acc.push(line);
				return acc;
			}, []);
		return stdOut.join("<br>").declare;
	}

	help() {
		return this.more("terminal");
	}

	friends() {
		return window.render({
				template: "friends-list",
				match: '/ledger/Settings/Friends'
			}).declare;
	}

	more(name) {
		let xpath = name ? `sys:/ledger/Shell/*[@object="${name}"]` : 'sys:/ledger/Shell',
			htm = window.render({
				template: "more-output",
				match: xpath
			});
		return htm.declare;
	}

	async about() {
		this.print(this._parent.infoStr.declare);
	}

	exit() {
		defiant.shell("win -c");
	}
}
