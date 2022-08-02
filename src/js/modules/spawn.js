
// terminal.spawn

{
	init() {
		// helps terminal find Filesystem
		this.FS = FS;

		// background & transparency
		let defaultUI = { color: "#222", opacity: .8 };
		this.bgUI = window.settings.getItem("bg-user-interface") || defaultUI;
		if (this.bgUI !== defaultUI) {
			this.dispatch({
				type: "change-opacity",
				arg: Math.floor(this.bgUI.opacity * 100)
			});
			// update menu
			window.bluePrint.selectSingleNode(`//Menu[@type="colors"]/*[@active]`).removeAttribute("active");
			window.bluePrint.selectSingleNode(`//Menu[@type="colors"]/*[@arg="${this.bgUI.color}"]`).setAttribute("active", 1);
		}
	},
	dispatch(event) {
		let APP = terminal,
			Self = APP.spawn,
			Spawn = event.spawn,
			stdIn,
			stdOut,
			target,
			selection,
			selectionStart,
			selectionEnd,
			left,
			command,
			value,
			tabs,
			file,
			el;
		// console.log(event);
		switch (event.type) {
			// system events
			case "spawn.open":
				Spawn.data.tabs = new Tabs(Self, Spawn);
				
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
				Self.charWidth = Math.round(event.width / Self.els.measureEl[0].getBoundingClientRect().width);
				break;

			// tab related events
			case "new-tab":
				file = event.file || new defiant.File({ path: "/fs/" });
				Spawn.data.tabs.add(file);
				break;
			case "tab-clicked":
				Spawn.data.tabs.focus(event.el.data("id"));
				break;
			case "tab-close":
				Spawn.data.tabs.remove(event.el.data("id"));
				break;
		}
	},
	scrollIntoView() {
		let wrapper = this.els.input.parent();
		wrapper.scrollTop(wrapper.prop("scrollHeight"));
	},
	print(stdIn) {
		stdIn = Parser.format(stdIn);
		let uiIn = this.els.buffer.append(`<div>${stdIn}</div>`);

		if (stdIn.includes(' data-click="explore-item"') && stdIn.stripHtml().length + 17 > this.charWidth) {
			// auto explore output - if content longer than window width
			uiIn.find('b.output [data-click="explore-item"]:first').trigger("click");
		}
	},
	clear() {
		this.els.buffer.html("");
	},
	history() {
		let stdOut = History.log.map((item, index) => `${(index + 1).toString().padStart(4, " ")}  ${item}`);
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
	async about() {
		let command = await defiant.shell("sys -b"),
			stdIn = `${command.result.name} Shell [v${command.result.version}] ${command.result.author} &copy; 2019-`+ (new Date).getFullYear();
		this.print(stdIn.declare);
	},
	exit() {
		defiant.shell("win -c");
	}
}
