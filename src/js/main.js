
import parser from "./modules/parser"
import history from "./modules/history"
import fileSystem from "./modules/fileSystem"


const terminal = {
	async init() {
		// fast references
		this.content = window.find("content");
		this.textarea = this.content.find("textarea");
		this.buffer = this.content.find(".output-buffer");
		this.input = this.content.find(".input");
		this.inputBuffer = this.input.find(".buffer");
		this.cursor = this.input.find(".cursor");
		this.caret = this.cursor.find("svg:nth(1)");
		this.stdIn = this.input.find(".buffer");
		this.prompt = this.input.find("b");

		parser.init(terminal);

		this.fileSystem = fileSystem;

		// version and copyright 
		this.about();
		this.textarea.focus();

		// temp
		// let tmp = this.fileSystem.list();
		// this.print("ls a".withPrompt);
		// this.print(tmp);

		this.textarea.val(`ls A`);
		this.dispatch({type: "window.keystroke"});

		/*
		let obj = {
			bla: {
				arr: [1,2,3,4,5],
				a: 1,
				str: "test",
			},
			prom: new Promise(resolve => {}),
			fn: function(a, b) {
				return a + b;
			}
		};
		//obj = [1,2,3,4,5];
		console.log(obj);
		this.print(obj);

		//this.buffer.find('em[data-click="explore-item"]').trigger("click");
		//this.buffer.find('em[data-click="explore-item"]:nth(1)').trigger("click");
		*/

		/*
		this.textarea.val(`ls`);
		this.dispatch({ type: "window.keystroke" });
		this.dispatch({ type: "window.keystroke", keyCode: 13 });
		return;

		this.textarea.val(`ls ..`);
		this.dispatch({type: "window.keystroke"});
		this.dispatch({type: "window.keystroke", keyCode: 9, target: this.textarea[0]});
		*/
	},
	async dispatch(event) {
		let stdIn,
			stdOut,
			target,
			selection,
			selectionStart,
			selectionEnd,
			left,
			command;
		
		//console.log(event);
		switch (event.type) {
			case "explore-item":
				return parser.dispatch(event);
			case "window.keystroke":

				switch (event.keyCode) {
					case 13: // return
						stdIn = this.stdIn.text().replace(/\s+/g, " ").trim();

						// output stdIn
						this.print(stdIn.withPrompt);

						if (stdIn.slice(0, 1) === "!") {
							let index = +stdIn.slice(1);
							if (index > 0 && index < history.log.length) stdIn = history.log[index - 1];
						}

						// add history log
						if (stdIn && stdIn !== history.log[history.log.length - 1]) {
							history.log.push(stdIn);
						}
						// reset history index
						history.index = history.log.length;

						if (stdIn.slice(-2).trim() === "+") {
							stdIn = "more " + stdIn.slice(0, -2);
						}

						// execute command
						if (stdIn) {
							command = await defiant.shell(stdIn);

							if (command.error) {
								// append error string to output
								this.print(command.error.err);
							} else if (command.result) {
								// command returned success
								this.print(command.result);
							}
						}

						// empty input buffer
						this.stdIn.html("");
						this.textarea.val("");
						this.caret.css({left: 0});
						break;
					case 9: // tab
						target = event.target;
						stdIn = this.stdIn.text().trim().slice(0, target.selectionStart);
						let suggestions = await fileSystem.suggest(stdIn);
						
						if (!suggestions.length) return;
						if (suggestions.length === 1) {
							target.setRangeText(suggestions[0].stub);

							selectionEnd = stdIn.length + suggestions[0].stub.length;
							target.setSelectionRange(selectionEnd, selectionEnd);

							this.cursor.addClass("loading");
							await fileSystem.preload(suggestions[0].path);
							this.cursor.removeClass("loading");
						} else {
							// print copy of stdIn
							stdIn = this.stdIn.text();
							this.print(stdIn.withPrompt);

							// prepare suggestion list
							stdOut = "";
							suggestions.map((item, index) => {
								stdOut += item.name.padEnd(30, " ") + (index % 2 === 1 ? "\n" : "");
							});
							this.print(stdOut.declare);
						}
						break;
					case 38: // up
						history.index = Math.max(history.index - 1, 0);
						stdIn = history.log[history.index] || "";
						this.textarea.val(stdIn);
						break;
					case 40: // down
						history.index = Math.min(history.index + 1, history.log.length);
						stdIn = history.log[history.index] || "";
						this.textarea.val(stdIn);
						break;
					case 33: // pageup
					case 36: // home
					case 34: // pagedown
					case 35: // end
						target = event.target;
						selectionEnd = ~[33, 36].indexOf(event.keyCode) ? 0 : target.value.length;
						target.setSelectionRange(selectionEnd, selectionEnd);
						this.dispatch({...event, type: "update-caret-position"});
						break;
					case 37: // left
					case 39: // right
						this.dispatch({...event, type: "update-caret-position"});
						break;
				}

				stdIn = this.textarea.val().replace(/ /g, "&#160;");
				this.stdIn.html(stdIn);
				//if (~[18,91,93,37,39].indexOf(event.keyCode)) return;
				this.scrollIntoView();
				break;
			case "update-caret-position":
				target = event.target;
				selectionStart = target.selectionStart;
				selectionEnd = target.selectionEnd;

				if (selectionStart !== selectionEnd) {
					target.setSelectionRange(selectionEnd, selectionEnd);
				}

				left = ((selectionStart - target.value.length) * 0.6075);
				this.caret.css({left: left +"em"});
				this.cursor.toggleClass("moved", left === 0);
				break;
			case "jump-to-start":
			case "jump-to-end":
				target = this.textarea[0];
				selectionEnd = event.type === "jump-to-start" ? 0 : target.value.length;
				target.setSelectionRange(selectionEnd, selectionEnd);
				this.dispatch({...event, target, type: "update-caret-position"});
				break;
			case "delete-to-start":
			case "delete-to-end":
				target = this.textarea[0];
				stdIn = (event.type === "delete-to-start")
							? target.value.slice(target.selectionStart, target.value.length)
							: target.value.slice(0, target.selectionStart);
				
				target.value = stdIn;
				if (event.type === "delete-to-start") target.setSelectionRange(0, 0);

				this.stdIn.html(stdIn);
				this.dispatch({...event, target, type: "update-caret-position"});
				break;
			case "catch-focus":
			case "window.focus":
				this.textarea.focus();
				break;
			case "window.blur":
				this.textarea.blur();
				break;
		}
	},
	scrollIntoView() {
		let wrapper = this.input.parent();
		wrapper.scrollTop(wrapper.prop("scrollHeight"));
	},
	print(stdIn) {
		stdIn = parser.format(stdIn);
		this.buffer.append(`<div>${stdIn}</div>`);
	},
	clear() {
		this.buffer.html("");
	},
	history() {
		let stdOut = history.log.map((item, index) => `${(index + 1).toString().padStart(4, " ")}  ${item}`);
		return stdOut.join("\n").feed;
	},
	grep(stdIn, str) {
		let stdOut = stdIn.split("<br>").reduce((acc, line) => {
			line = line.stripHtml();
			if (~line.indexOf(str)) acc.push(line);
			return acc;
		}, []);
		return stdOut.join("<br>").declare;
	},
	help() {
		return this.more();
	},
	more(object) {
		let xpath = object ? `/ledger/Shell/*[@object = "${object}"]` : '/ledger/Shell';
		let htm = window.render({
			template: "more-output",
			match: xpath
		});

		return htm.declare;
	},
	async about() {
		let command = await defiant.shell("sys -b");
		let stdIn = `${command.result.name} Shell [v${command.result.version}] ${command.result.author} &copy; 2019-`+ (new Date).getFullYear();
		this.print(stdIn.declare);
	},
	exit() {
		defiant.shell("win -c");
	}
};

window.exports = terminal;
