
let Test = {
	init(spawn) {
		// DEV-ONLY-START
		setTimeout(() => spawn.el.trigger("mousedown"), 200);
		setTimeout(() => {

			let els = spawn.data.tabs._active.els;

			els.textarea.val(`sys -r`);
			// els.textarea.val(`exit`);

			let ev = { type: "spawn.keystroke", spawn };
			terminal.dispatch(ev);
			terminal.dispatch({ ...ev, keyCode: 13 });

			// terminal.spawn.dispatch({ type: "change-bg-color", arg: "#a00" });
		}, 500);
		// DEV-ONLY-END
	}
};
