
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
			TABS = Spawn && Spawn.data ? Spawn.data.tabs : false,
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
		// console.log(event);
		switch (event.type) {
			// system events
			case "spawn.open":
				// fast reference
				Self.winBody = Spawn.find("content").parent();
				// background & transparency
				let defaultUI = { color: "#222", opacity: .8 };
				Self.bgUI = window.settings.getItem("bg-user-interface") || defaultUI;
				if (Self.bgUI !== defaultUI) {
					Self.dispatch({
						type: "change-opacity",
						arg: Math.floor(Self.bgUI.opacity * 100)
					});
					// update menu
					window.bluePrint.selectSingleNode(`//Menu[@type="colors"]/*[@active]`).removeAttribute("active");
					window.bluePrint.selectSingleNode(`//Menu[@type="colors"]/*[@arg="${Self.bgUI.color}"]`).setAttribute("active", 1);
				}
				// add element used for measurement
				Self.measureEl = Spawn.find("content .wrapper").append('<i class="measurement">a</i>');
				// fake trigger resize, to calculate charWidth
				Self.dispatch({ type: "spawn.resize", width: Spawn.width });
				// init tab bar
				Spawn.data.tabs = new Tabs(Self, Spawn);

				// DEV-ONLY-START
				setTimeout(() => {
					let els = Spawn.data.tabs._active.els,
						ev = { type: "spawn.keystroke", spawn: Spawn };

					els.textarea.val(`exit`);

					Self.dispatch(ev);
					Self.dispatch({ ...ev, keyCode: 13 });
				}, 500);
				// DEV-ONLY-END
				break;
			case "open.file":
				(event.files || [event]).map(file => {
					// auto add first base "tab"
					Self.dispatch({ ...event, file, type: "new-tab" });
				});
				break;
			case "spawn.blur":
				break;
			case "spawn.focus":
				break;
			case "spawn.resize":
				// measures available width in characters
				Self.charWidth = Math.round(event.width / Self.measureEl[0].getBoundingClientRect().width);
				break;

			// tab related events
			case "new-tab":
				file = event.file || new defiant.File({ path: "/fs/" });
				TABS.add(file);
				break;
			case "tab-clicked":
				TABS.focus(event.el.data("id"));
				break;
			case "tab-close":
				TABS.remove(event.el.data("id"));
				break;

			// case "spawn.keyup":
			case "spawn.keystroke":
				ACTIVE = TABS._active;

				switch (event.keyCode) {
					case 13: // return
						stdIn = ACTIVE.els.stdIn.text().replace(/\s+/g, " ").trim();

						// output stdIn
						TABS.print(stdIn.withPrompt);

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
								TABS.print(command.error.err);
							} else if (command.result) {
								// command returned success
								TABS.print(command.result);
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
							TABS.print(stdIn.withPrompt);

							// prepare suggestion list
							stdOut = "";
							suggestions.map((item, index) => {
								stdOut += item.name.padEnd(30, " ") + (index % 2 === 1 ? "\n" : "");
							});
							TABS.print(stdOut.declare);
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
				break;
			// custom events
			case "change-opacity":
				// save opacity
				Self.bgUI.opacity = event.arg / 100;
				// update ui
				value = `rgba(${Colors[Self.bgUI.color]},${Self.bgUI.opacity})`;
				Self.winBody.css({ "background-color": value });
				break;
			case "change-bg-color":
				// save color
				Self.bgUI.color = event.arg;
				// update ui
				value = `rgba(${Colors[Self.bgUI.color]},${Self.bgUI.opacity})`;
				Self.winBody.css({ "background-color": value });
				break;
			case "explore-item":
				return Parser.dispatch(event);
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
			case "open-help":
				defiant.shell("fs -u '~/help/index.md'");
				break;
		}
	},
	exit() {
		console.log(this);
	}
}
