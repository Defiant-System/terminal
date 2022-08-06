
// terminal.spawn

{
	async init() {
		// prepare about string
		let cmd = await defiant.shell("sys -b");
		this.infoStr = `${cmd.result.name} Shell [v${cmd.result.version}] ${cmd.result.author} &copy; 2019-`+ (new Date).getFullYear();
	},
	async dispatch(event) {
		let APP = terminal,
			Self = APP.spawn,
			Spawn = event.spawn,
			ACTIVE,
			stdIn,
			stdOut,
			target,
			selection,
			selectionStart,
			selectionEnd,
			left,
			command,
			value,
			file,
			el;
		// console.log(event.type);
		switch (event.type) {
			// system events
			case "spawn.open":
				// fast reference
				Self.winBody = Spawn.find("content").parent();
				// add element used for measurement
				Self.measureEl = Spawn.find("content .wrapper").append('<i class="measurement">a</i>');
				// fake trigger resize, to calculate charWidth
				Self.dispatch({ type: "spawn.resize", width: Spawn.width });
				// init tab bar
				Spawn.data.tabs = new Tabs(Self, Spawn);
				// DEV
				APP.test(Spawn);
				break;
			case "open.file":
				(event.files || [event]).map(file => {
					// auto add first base "tab"
					Self.dispatch({ ...event, file, type: "new-tab" });
				});
				break;
			case "spawn.blur":
				if (Spawn.data) Spawn.data.tabs.blur();
				break;
			case "spawn.focus":
				if (Spawn.data) Spawn.data.tabs.focus();
				break;
			case "spawn.resize":
				// measures available width in characters
				Self.charWidth = Math.round(event.width / Self.measureEl[0].getBoundingClientRect().width);
				break;

			// tab related events
			case "new-tab":
				value = window.settings.getItem("default-cwd") || "~/";
				file = event.file || new defiant.File({ path: value });
				Spawn.data.tabs.add(file);
				// save reference to active "tab"
				Self.refActive = Spawn.data.tabs._active;
				// version and copyright 
				Self.about();
				break;
			case "tab-clicked":
				Spawn.data.tabs.focus(event.el.data("id"));
				break;
			case "tab-close":
				Spawn.data.tabs.remove(event.el.data("id"));
				break;

			case "before-contextmenu:output":
				ACTIVE = Spawn.data.tabs._active;
				// fixes transparenty value
				value = Math.round(ACTIVE.bgUI.opacity * 100);
				window.bluePrint.selectSingleNode(`//Menu[@change="change-opacity"]`)
					.setAttribute("value", value);
				// fixes color value
				window.bluePrint.selectNodes(`//Menu[@change="change-bg-color"]/Color`)
					.map(node => {
						if (node.getAttribute("arg") === ACTIVE.bgUI.color) {
							node.removeAttribute("active", "1");
						} else {
							node.removeAttribute("active");
						}
					});
				break;

			// from menubar
			case "new-spawn":
				APP.dispatch({ type: "new-spawn" });
				break;
			case "merge-all-windows":
				Spawn.siblings.map(oSpawn => {
					for (let key in oSpawn.data.tabs._stack) {
						let ref = oSpawn.data.tabs._stack[key];
						Spawn.data.tabs.merge(ref);
					}
					// close sibling spawn
					oSpawn.close();
				});
				break;
			case "close-tab":
				value = Spawn.data.tabs.length;
				if (value > 1) {
					Spawn.data.tabs._active.tabEl.find(`[sys-click]`).trigger("click");
				} else if (value === 1) {
					Self.dispatch({ ...event, type: "close-spawn" });
				}
				break;
			case "close-spawn":
				// system close window / spawn
				defiant.shell("win -c");
				break;

			// case "spawn.keyup":
			case "spawn.keystroke":
				ACTIVE = Spawn.data.tabs._active;

				switch (event.keyCode) {
					case 13: // return
						stdIn = ACTIVE.els.stdIn.text().replace(/\s+/g, " ").trim();

						// output stdIn
						Self.print(stdIn.withPrompt, ACTIVE);

						if (stdIn.slice(0, 1) === "?") {
							stdIn = "help"+ stdIn.slice(1);
						}

						if (stdIn.slice(0, 1) === "!") {
							let index = +stdIn.slice(1);
							if (index > 0 && index < ACTIVE.history.length) stdIn = ACTIVE.history.get(index);
						}

						// add history log
						if (stdIn && stdIn !== ACTIVE.history.get[ACTIVE.history.length - 1]) {
							ACTIVE.history.push(stdIn);
						}

						if (stdIn.slice(-2).trim() === "+") {
							stdIn = "more " + stdIn.slice(0, -2);
						}

						// execute command
						if (stdIn) {
							// save reference to active "tab"
							Self.refActive = ACTIVE;
							Self.refSpawn = Spawn;
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
								Self.print(command.error.err, ACTIVE);
							} else if (command.result) {
								// command returned success
								Self.print(command.result, ACTIVE);
							}
						}

						// empty input buffer
						ACTIVE.els.stdIn.html("");
						ACTIVE.els.textarea.val("");
						ACTIVE.els.caret.css({left: 0});
						ACTIVE.els.cursor.removeClass("moved");
						break;
					case 9: // tab
						// prevent default behaviour
						event.preventDefault();

						target = event.target;
						stdIn = ACTIVE.els.stdIn.text().trim().slice(0, target.selectionStart);
						let suggestions = await FS.suggest(stdIn);
						
						if (!suggestions.length) return;
						if (suggestions.length === 1) {
							target.setRangeText(suggestions[0].stub);

							selectionEnd = stdIn.length + suggestions[0].stub.length;
							target.setSelectionRange(selectionEnd, selectionEnd);
						} else {
							// print copy of stdIn
							stdIn = ACTIVE.els.stdIn.text();
							Self.print(stdIn.withPrompt, ACTIVE);

							// prepare suggestion list
							stdOut = "";
							suggestions.map((item, index) => {
								stdOut += item.name.padEnd(30, " ") + (index % 2 === 1 ? "\n" : "");
							});
							Self.print(stdOut.declare, ACTIVE);
						}
						break;
					case 38: // up
						ACTIVE.history.goPrev();
						ACTIVE.els.textarea.val(ACTIVE.history.current);
						break;
					case 40: // down
						ACTIVE.history.goNext();
						ACTIVE.els.textarea.val(ACTIVE.history.current);
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
						stdIn = ACTIVE.els.textarea.val().replace(/ /g, "&#160;");
						ACTIVE.els.stdIn.html(stdIn);
						Self.dispatch({...event, type: "update-caret-position"});
						return;
				}

				stdIn = ACTIVE.els.textarea.val().replace(/ /g, "&#160;");
				if (event.shiftKey && event.char !== "shift") stdIn += event.char;
				ACTIVE.els.stdIn.html(stdIn);
				//if (~[18,91,93,37,39].indexOf(event.keyCode)) return;
				Self.scrollIntoView(ACTIVE);
				break;
			// custom events
			case "change-opacity":
				ACTIVE = Spawn.data.tabs._active;
				// save opacity
				ACTIVE.bgUI.opacity = event.arg / 100;
				// update ui
				value = `rgba(${Colors[ACTIVE.bgUI.color]},${ACTIVE.bgUI.opacity})`;
				Self.winBody.css({ "background-color": value });
				break;
			case "change-bg-color":
				ACTIVE = Spawn.data.tabs._active;
				// save color
				ACTIVE.bgUI.color = event.arg;
				// update ui
				value = `rgba(${Colors[ACTIVE.bgUI.color]},${ACTIVE.bgUI.opacity})`;
				Self.winBody.css({ "background-color": value });
				break;
			case "explore-item":
				// save reference to active "tab"
				Self.refActive = Spawn.data.tabs._active;
				Self.refSpawn = Spawn;
				// dispatch event
				Parser.dispatch(event);
				return;
			case "update-caret-position":
				ACTIVE = Spawn.data.tabs._active;

				target = event.target;
				selectionStart = target.selectionStart;
				selectionEnd = target.selectionEnd;

				if (selectionStart !== selectionEnd) {
					target.setSelectionRange(selectionEnd, selectionEnd);
				}

				left = ((selectionStart - target.value.length) * 0.6075);
				ACTIVE.els.caret.css({left: left +"em"});
				ACTIVE.els.cursor.toggleClass("moved", left === 0);
				break;
			case "jump-to-start":
			case "jump-to-end":
				ACTIVE = Spawn.data.tabs._active;

				target = ACTIVE.els.textarea[0];
				selectionEnd = event.type === "jump-to-start" ? 0 : target.value.length;
				target.setSelectionRange(selectionEnd, selectionEnd);
				Self.dispatch({...event, target, type: "update-caret-position"});
				break;
			case "delete-to-start":
			case "delete-to-end":
				ACTIVE = Spawn.data.tabs._active;

				target = ACTIVE.els.textarea[0];
				stdIn = (event.type === "delete-to-start")
							? target.value.slice(target.selectionStart, target.value.length)
							: target.value.slice(0, target.selectionStart);
				
				target.value = stdIn;
				if (event.type === "delete-to-start") target.setSelectionRange(0, 0);

				ACTIVE.els.stdIn.html(stdIn);
				Self.dispatch({...event, target, type: "update-caret-position"});
				break;
			case "open-help":
				defiant.shell("fs -u '~/help/index.md'");
				break;
		}
	},
	scrollIntoView(active) {
		let wrapper = active.els.input.parent();
		wrapper.scrollTop(wrapper.prop("scrollHeight"));
	},
	print(sIn, aTab) {
		let active = aTab || this.refActive;
		let stdIn = Parser.format(sIn);
		let uiIn = active.els.buffer.append(`<div>${stdIn}</div>`);

		if (stdIn.includes(' data-click="explore-item"') && stdIn.stripHtml().length + 17 > this.charWidth) {
			// auto explore output - if content longer than window width
			uiIn.find('b.output [data-click="explore-item"]:first').trigger("click");
		}
	},
	clear() {
		let active = this.refActive;
		active.els.buffer.html("");
	},
	history() {
		let active = this.refActive;
		let stdOut = active.history.log.map((item, index) => `${(index + 1).toString().padStart(4, " ")}  ${item}`);
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
				match: '/ledger/Settings/Friends'
			}).declare;
	},
	more(name) {
		let xpath = name ? `sys:/ledger/Shell/*[@object="${name}"]` : 'sys:/ledger/Shell',
			htm = window.render({
				template: "more-output",
				match: xpath
			});
		return htm.declare;
	},
	about() {
		this.print(this.infoStr.declare);
	},
	exit() {
		this.dispatch({ type: "close-tab", spawn: this.refSpawn });
	}
}
