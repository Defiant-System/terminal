
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
		// this.inputBuffer = this.input.find(".buffer");
		this.cursor = this.input.find(".cursor");
		this.caret = this.cursor.find("svg:nth(1)");
		this.stdIn = this.input.find(".buffer");
		this.prompt = this.input.find("b");
		this.measureEl = window.find(".wrapper").append('<i class="measurement">a</i>');

		parser.init(terminal);

		this.fileSystem = fileSystem;

		// fake trigger resize, to calculate charWidth
		this.dispatch({ type: "window.resize", width: window.width });

		// version and copyright 
		this.about();
		this.textarea.focus();
	},
	async dispatch(event) {
		let Self = terminal,
			stdIn,
			stdOut,
			target,
			selection,
			selectionStart,
			selectionEnd,
			left,
			command;
		//console.log(event);
		switch (event.type) {
			// system events
			case "window.open":
				// DEV-ONLY-START

				setTimeout(() => {
					return;
					// Self.textarea.val(`chmod 644 ../Settings/`);

					Self.textarea.val(`ls ~/Doc`);

					// Self.textarea.val(`rm ../Settings/`);
					// Self.textarea.val(`rm test/`);
					// Self.textarea.val(`rm test-3.mid`);

					// Self.textarea.val(`mv test/zebra.txt ./`);
					// Self.textarea.val(`mv test/zebra.txt test/zebra-2.txt`);
					// Self.textarea.val(`mv test-3.mid test-4.mid`);
					// Self.textarea.val(`mv test/docs/ ./`);
					// Self.textarea.val(`mv test-3.mid ../Trashcan/`);
					// Self.textarea.val(`mv test/ ../Trashcan/`);
					// Self.textarea.val(`mv test/ ./test2/`);
					// Self.textarea.val(`mv ../Trashcan/abba.mid ./`);
					// Self.textarea.val(`mv ../Trashcan/test/ ./`);

					// Self.textarea.val(`cp test-3.mid ../Trashcan/test-4.mid`);
					// Self.textarea.val(`cp test-3.mid ../Trashcan/`);
					// Self.textarea.val(`cp test/ ../Trashcan/`);
					// Self.textarea.val(`cp test/ ../Trashcan/test2/`);
					// Self.textarea.val(`cp test/ ../Trashcan/test/`);
					// Self.textarea.val(`cp ../Trashcan/abba.mid ./`);
					// Self.textarea.val(`cp ../Trashcan/test/ ./`);
					
					// Self.textarea.val(`touch cow.txt '...says muu'`);
					// Self.textarea.val(`touch ./cow.txt '...says muu'`);
					// Self.textarea.val(`touch test/cow.txt`);

					// Self.textarea.val(`mkdir animals`);
					// Self.textarea.val(`mkdir test/animals`);

					// Self.textarea.val(`empty-bin`);

					Self.dispatch({ type: "window.keystroke" });
					Self.dispatch({ type: "window.keystroke", keyCode: 13 });
				}, 1000);

				// DEV-ONLY-END
				break;
			case "window.resize":
				// measures available width in characters
				Self.charWidth = Math.round(event.width / Self.measureEl[0].getBoundingClientRect().width);
				break;
			case "window.keystroke":

				switch (event.keyCode) {
					case 13: // return
						stdIn = Self.stdIn.text().replace(/\s+/g, " ").trim();

						// output stdIn
						Self.print(stdIn.withPrompt);

						if (stdIn.slice(0, 1) === "?") {
							stdIn = "help"+ stdIn.slice(1);
						}

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
							command = await defiant.shell(stdIn.replace(/\\ /g, "%20"));

							// app-custom test of stdIn
							if (command.error) {
								try {
									command.result = (new Function(`return ${stdIn}`))();
									delete command.error;
								} catch (e) {}
							}
							// evaluate result
							if (command.error) {
								// append error string to output
								Self.print(command.error.err);
							} else if (command.result) {
								// command returned success
								Self.print(command.result);
							}
						}

						// empty input buffer
						Self.stdIn.html("");
						Self.textarea.val("");
						Self.caret.css({left: 0});
						Self.cursor.removeClass("moved");
						break;
					case 9: // tab
						// prevent default behaviour
						event.preventDefault();

						target = event.target;
						stdIn = Self.stdIn.text().trim().slice(0, target.selectionStart);
						let suggestions = await fileSystem.suggest(stdIn);
						
						if (!suggestions.length) return;
						if (suggestions.length === 1) {
							target.setRangeText(suggestions[0].stub);

							selectionEnd = stdIn.length + suggestions[0].stub.length;
							target.setSelectionRange(selectionEnd, selectionEnd);
						} else {
							// print copy of stdIn
							stdIn = Self.stdIn.text();
							Self.print(stdIn.withPrompt);

							// prepare suggestion list
							stdOut = "";
							suggestions.map((item, index) => {
								stdOut += item.name.padEnd(30, " ") + (index % 2 === 1 ? "\n" : "");
							});
							Self.print(stdOut.declare);
						}
						break;
					case 38: // up
						history.index = Math.max(history.index - 1, 0);
						stdIn = history.log[history.index] || "";
						Self.textarea.val(stdIn);
						break;
					case 40: // down
						history.index = Math.min(history.index + 1, history.log.length);
						stdIn = history.log[history.index] || "";
						Self.textarea.val(stdIn);
						break;
					case 33: // pageup
					case 36: // home
					case 34: // pagedown
					case 35: // end
						target = event.target;
						selectionEnd = ~[33, 36].indexOf(event.keyCode) ? 0 : target.value.length;
						target.setSelectionRange(selectionEnd, selectionEnd);
						Self.dispatch({...event, type: "update-caret-position"});
						break;
					case 37: // left
					case 39: // right
						if (event.shiftKey) {
							// no support for selection (yet)
							return event.preventDefault();
						}
						Self.dispatch({...event, type: "update-caret-position"});
						break;
					case 46: // delete
						stdIn = Self.textarea.val().replace(/ /g, "&#160;");
						Self.stdIn.html(stdIn);
						Self.dispatch({...event, type: "update-caret-position"});
						return;
				}

				stdIn = Self.textarea.val().replace(/ /g, "&#160;");
				if (event.shiftKey && event.char !== "shift") stdIn += event.char;
				Self.stdIn.html(stdIn);
				//if (~[18,91,93,37,39].indexOf(event.keyCode)) return;
				Self.scrollIntoView();
				break;
			// custom events
			case "explore-item":
				return parser.dispatch(event);
			case "update-caret-position":
				target = event.target;
				selectionStart = target.selectionStart;
				selectionEnd = target.selectionEnd;

				if (selectionStart !== selectionEnd) {
					target.setSelectionRange(selectionEnd, selectionEnd);
				}

				left = ((selectionStart - target.value.length) * 0.6075);
				Self.caret.css({left: left +"em"});
				Self.cursor.toggleClass("moved", left === 0);
				break;
			case "jump-to-start":
			case "jump-to-end":
				target = Self.textarea[0];
				selectionEnd = event.type === "jump-to-start" ? 0 : target.value.length;
				target.setSelectionRange(selectionEnd, selectionEnd);
				Self.dispatch({...event, target, type: "update-caret-position"});
				break;
			case "delete-to-start":
			case "delete-to-end":
				target = Self.textarea[0];
				stdIn = (event.type === "delete-to-start")
							? target.value.slice(target.selectionStart, target.value.length)
							: target.value.slice(0, target.selectionStart);
				
				target.value = stdIn;
				if (event.type === "delete-to-start") target.setSelectionRange(0, 0);

				Self.stdIn.html(stdIn);
				Self.dispatch({...event, target, type: "update-caret-position"});
				break;
			case "catch-focus":
			case "window.focus":
				Self.textarea.focus();
				break;
			case "window.blur":
				Self.textarea.blur();
				break;
		}
	},
	scrollIntoView() {
		let wrapper = this.input.parent();
		wrapper.scrollTop(wrapper.prop("scrollHeight"));
	},
	print(stdIn) {
		stdIn = parser.format(stdIn);
		let uiIn = this.buffer.append(`<div>${stdIn}</div>`);

		if (stdIn.includes(' data-click="explore-item"') && stdIn.stripHtml().length + 17 > this.charWidth) {
			// auto explore output - if content longer than window width
			uiIn.find('b.output [data-click="explore-item"]:first').trigger("click");
		}
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
		return this.more("terminal");
	},
	friends() {
		return window.render({
				template: "friends-list",
				match: '//Friends'
			}).declare;
	},
	more(name) {
		let xpath = name ? `/ledger/Shell/*[@object="${name}"]` : '/ledger/Shell',
			htm = window.render({
				template: "more-output",
				match: xpath
			});
		return htm.declare;
	},
	async about() {
		let command = await defiant.shell("sys -b"),
			stdIn = `${command.result.name} Shell [v${command.result.version}] ${command.result.author} &copy; 2019-`+ (new Date).getFullYear();
		this.print(stdIn.declare);
	},
	exit() {
		defiant.shell("win -c");
	}
};

window.exports = terminal;
