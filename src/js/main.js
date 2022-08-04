
@import "./classes/tabs.js"
@import "./classes/history.js"
@import "./modules/fileSystem.js"

import Parser from "./modules/parser"

const Colors = {
	"#222": "0,0,0",
	"#a00": "50,0,0",
	"#0a0": "0,50,0",
	"#00a": "0,0,50",
	"#a0a": "50,0,50",
	"#088": "0,30,30",
};

const hLog = window.settings.getItem("history");


const terminal = {
	init() {
		// helps terminal find Filesystem
		this.FS = FS;

		// init all sub-objects
		Object.keys(this)
			.filter(i => typeof this[i].init === "function")
			.map(i => this[i].init());

		// initiate Parser object
		Parser.init(this);
	},
	dispatch(event) {
		let Self = terminal,
			spawn,
			el;
		// proxy spawn events
		if (event.spawn) return Self.spawn.dispatch(event);
		
		switch (event.type) {
			// system events
			case "window.init":
				spawn = window.open("spawn");
				Self.spawn.dispatch({ ...event, type: "new-spawn", spawn });
				break;
			case "open.file":
				spawn = window.open("spawn");
				Self.spawn.dispatch({ ...event, spawn });
				break;
			case "open-help":
				defiant.shell("fs -u '~/help/index.md'");
				break;
		}
	},
	spawn: @import "./modules/spawn.js",
};

window.exports = terminal;
