
let Test = {
	init(spawn, APP) {

		// setTimeout(() => {
		// 	spawn.find(".cursor").addClass("loading");
		// }, 500);

		// return;
		
		// setTimeout(() => spawn.el.trigger("mousedown"), 200);
		setTimeout(() => {
			// return;
			let els = spawn.data.tabs._active.els;

			// els.textarea.val(`pwd`);
			
			// els.textarea.val(`mail`);
			els.textarea.val(`mail -l 2001`);
			// els.textarea.val(`mail -o 1753987109475`);

			// els.textarea.val(`weather`);
			// els.textarea.val(`user -w`);
			// els.textarea.val(`sys -rl`);
			// els.textarea.val(`sys -rl i18n`);
			// els.textarea.val(`sys -r dock-position left`);
			// els.textarea.val(`sys -r dock-auto-show-hide true`);
			// els.textarea.val(`sys -r fs-show-hidden-folders false`);
			// els.textarea.val(`sys -r workspace-wp-logo ctr 1 1 1 120deg`);

			// els.textarea.val(`sys -r menubar-clock digital`);

			// els.textarea.val(`exit`);

			let ev = { type: "spawn.keystroke", spawn };
			terminal.dispatch(ev);
			terminal.dispatch({ ...ev, keyCode: 13 });

			// terminal.spawn.dispatch({ type: "change-bg-color", arg: "#a00" });

			// auto expand object exploration
			// setTimeout(() => spawn.find(`em[data-click="explore-item"]`).trigger("click"), 100);
		}, 500);
	}
};
