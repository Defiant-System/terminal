
let Test = {
	init(spawn) {
		// DEV-ONLY-START
		setTimeout(() => spawn.el.trigger("mousedown"), 200);
		setTimeout(() => {
			// return;
			let els = spawn.data.tabs._active.els;

			// els.textarea.val(`sys -rl`);
			els.textarea.val(`sys -rl`);
			// els.textarea.val(`sys -r dock-position left`);
			// els.textarea.val(`sys -r dock-auto-show-hide`);
			// els.textarea.val(`sys -r menubar-volume 30`);
			// els.textarea.val(`exit`);

			let ev = { type: "spawn.keystroke", spawn };
			terminal.dispatch(ev);
			terminal.dispatch({ ...ev, keyCode: 13 });

			// terminal.spawn.dispatch({ type: "change-bg-color", arg: "#a00" });

			// auto expand object exploration
			setTimeout(() => spawn.find(`em[data-click="explore-item"]`).trigger("click"), 100);
		}, 500);
		// DEV-ONLY-END
	}
};
