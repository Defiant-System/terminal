
// terminal.spawn

{
	async init() {
		// helps terminal find Filesystem
		this.FS = FS;

		// prepare about string
		let cmd = await defiant.shell("sys -b");
		this.infoStr = `${cmd.result.name} Shell [v${cmd.result.version}] ${cmd.result.author} &copy; 2019-`+ (new Date).getFullYear();

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
			active,
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
				// add element used for measurement
				Self.measureEl = Spawn.find("content .wrapper").append('<i class="measurement">a</i>');
				// fake trigger resize, to calculate charWidth
				Self.dispatch({ type: "spawn.resize", width: Spawn.width });
				// init tab bar
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
				Self.charWidth = Math.round(event.width / Self.measureEl[0].getBoundingClientRect().width);
				break;

			// case "spawn.keyup":
			case "spawn.keystroke":
				active = Spawn.data.tabs._active;

				stdIn = active.els.textarea.val().replace(/ /g, "&#160;");
				if (event.shiftKey && event.char !== "shift") stdIn += event.char;
				active.els.stdIn.html(stdIn);
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
	}
}
