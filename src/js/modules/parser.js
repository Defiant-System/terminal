
let APP;
let memory = [];
let collapsed_limit = 3;
let tabLength = 3;

let Parser = {
	init(_terminal) {
		// fast and direct references
		APP = _terminal;
	},
	dispatch(event) {
		let item,
			group,
			index,
			key,
			descendant,
			indent,
			isOn,
			htm;
		// console.log(event);
		switch (event.type) {
			case "show-mail":
				event.el.parent().prevAll(".mail.collapsed").removeClass("collapsed");
				event.el.parent().remove();
				break;
			case "explore-item":
				item = $(event.target);
				if (item.parent().hasClass("output")) {
					item = item.parent();
					group = item.find("> span.group");
					isOn = group.hasClass("collapsed");
					index = group.attr("data-index");

					descendant = memory[index];
					indent = '';
				} else if (!item.parent().hasClass("collapsed")) {
					if (item.hasClass("html")) {
						return console.log("handle 2");
					}
					group = item.next(".group:first");
					isOn = group.hasClass("collapsed");
					key = item.prevAll("u:first").text();

					let path = [];
					let ancestor = group;
					while (!ancestor.attr("data-index")) {
						path.unshift(ancestor.prevAll("u:first").text());
						ancestor = ancestor.parents(".group:first");
					}
					indent = String().fill(path.length, '\t');
					path.unshift(ancestor.attr("data-index"));

					descendant = memory[path.shift()];
					while (path.length) {
						descendant = descendant[path.shift()];
					}
				}
				if (descendant) {
					group.toggleClass("collapsed", isOn);
					htm = this.getProperties(descendant, !isOn, indent);
					htm = isOn ? `\n${htm.join("\n")}\n${indent}` : ` ${htm.join(", ")} `;
					htm = htm.replace(/\t/g, String().fill(tabLength, ' '));
					group.html(htm);
				}
				// scroll expand in to view
				APP.spawn.scrollIntoView(APP.spawn.refActive);
				break;
		}
	},
	format(item) {
		if (~[String, Number, Boolean].indexOf(item.constructor)) {
			let str = item.toString();
			if (str.match(/ \[([\d\w;]+)m(.*?)\[0m/mg)) return this.ansi(str);
			return str === str.stripHtml() ? str.output : str.default;
		}
		let htm = [];
		let index = memory.push(item) - 1;
		let list = this.getProperties(item, true);
		let type = item.constructor.toString().match(/[A-Z]\w+/)[0];

		if (type === "Array") {
			type += ` (${item.length})`;
		}
		if (type === "Function") {
			type = Function.toString.call(item);
			if (type.slice(0, 8) === 'function') {
				type = type.substring(0, type.indexOf("{"))
						      .replace(/\s/g, " ").trim()
						      .replace(/^function/, "ƒ");
			} else {
				type = "ƒ"+ type.slice(0, type.indexOf(")")+1);
			}
		}

		htm.push(`<em data-click="explore-item">${type}</em>`);
		htm.push(`<span data-index="${index}" class="group ${type.toLowerCase()} collapsed"> ${list.join(", ")} </span>`);

		return htm.join(``).output;
	},
	getProperties(item, collapsed, pIndent = "") {
		let isArray = item.constructor === Array;
		let list = Object.getOwnPropertyNames(item).map(key => {
			if ((isArray && isNaN(key)) || key === "prototype") return;
			let indent = collapsed ? `` : `${pIndent}\t`;
			let type = typeof item[key];
			let value = item[key];
			let sample = ``;

			if (item[key] == undefined) return;

			switch (value !== null && item[key].constructor) {
				case Promise:
					value = `Promise`;
					if (!collapsed) {
						// todo: handle promise correctly
						sample = `<span class="group promise collapsed"> <b class="status">Pending</b> </span>`;
					}
					break;
				case Object:
					value = collapsed ? `{ &#8230; }` : `Object`;
					sample = collapsed ? `` : `<span class="group collapsed"> ${this.getProperties(item[key], true, indent).join(", ")} </span>`;
					break;
				case Array:
					value = `Array (${item[key].length})`
					if (!collapsed) {
						sample = this.getProperties(item[key], true, indent);
						sample = `<span class="group array collapsed"> ${sample.join(", ")} </span>`;
					}
					break;
				case Function:
					value = Function.toString.call(item[key]);
					if (value.slice(0, 8) === 'function') {
						value = value.substring(0, value.indexOf("{"))
								      .replace(/\s/g, " ").trim()
								      .replace(/^function/, "ƒ");
					} else if (collapsed) {
						value = "ƒ"+ value.slice(0, value.indexOf(")")+1);
					}
					sample += `<span class="group function collapsed"></span>`;
					break;
				case Date:
					type = `date`;
					value = value.toString().replace(/\(.+?\)/i, m => `(${m.slice(1,-1).replace(/\w+\s?/g, word => word.slice(0,1))})`);
					break;
				case String:
					value = item[key];
					if (value.trim().startsWith("&lt;")) {
						type = `html`;
						value = collapsed
								? `&lt;Html&gt;`
								: value.replace(/&lt;(\w+)?/g, "&lt;"+ "$1".name)
										.replace(/&lt;\\(\w+)?/g, "&lt;"+ "\\"+ "$1".name)
										.replace(/ (\w+?)(=)(&quot;)(.+?)(&quot;)/g, " "+ "$1".prop + "=".oper + "&quot;".quot + "$4".str + "&quot;".quot)
										.replace(/&lt;/g, "&lt;".punc)
										.replace(/\/&gt;/g, "\/&gt;".punc)
										.replace(/&gt;/g, "&gt;".punc);
					}
					break;
				case Number:
				case Boolean:
					value = item[key];
					break;
			}

			let clickable = ["object", "array"].includes(type) ? `data-click="explore-item"` : "";

			return isArray && collapsed ? `${indent}<em class="${type}">${value}</em>`
							: `${indent}<u>${key}</u> <em ${clickable} class="${type}">${value}</em>${sample}`;
		}).filter(i => i);

		if (item.constructor === Promise) {
			let indent = collapsed ? `` : `${pIndent}\t`;
			list.push(`${indent}Pending`);
		}

		if (collapsed && list.length > collapsed_limit) {
			list = list.slice(0, collapsed_limit);
			list.push(`&#8230;`);
		}

		return list;
	},
	ansi: (() => {
		let iteration = 0;
		let lines;
		let result;
		let open;

		function parse(str) {
			result = { lines: [""] };
			// consume string
			lines = str.split("\n");
			eat(lines.shift());
			// return result
			return result.lines;
		}

		function eat(str) {
			let match;
			let l1, l2;
			// count iterations - to exit before "stack overflow"
			iteration++;

			// check first charater in remaining
			switch (str.charAt(0)) {
				case "[":
					match = str.match(/\[[\d;]+m?/);
					if (match) {
						let [a,b,c,d] = match[0].slice(1,-1).split(";");
						switch (a) {
							case "1":
								if (open) done(`</b>`);
								done(`<b class="a1">`);
								open = true;
								break;
							case "0":
								if (open) done(`</b>`);
								open = false;
								break;
							case "38":
								if (open) done(`</b>`);
								done(`<b class="a${c}">`);
								open = true;
								break;
						}
						l1 = match[0].length;
						str = str.slice(l1);
					}
					break;
				default:
					// Individual words
					match = str.match(/.+?(\[|$)/);
					if (match) {
						l1 = match[0].length;
						if (match[0].slice(-1) === "[") l1--;
						l2 = match[0].slice(-2) === " [" ? l1-1 : l1;
						done(str.slice(0, l2));
						str = str.slice(l1);
					}
			}

			if (iteration > 64) {
				return console.log( "stack overflow" );
			}

			if (!str.length) {
				iteration = 0; // reset iterations
				if (open) done(`</b>`);
				result.lines.push("");
			} else {
				return eat(str);
			}

			if (lines.length) {
				iteration = 0; // reset iterations
				if (open) done(`</b>`);
				eat(lines.shift());
			}
		}

		function done(str) {
			result.lines[result.lines.length-1] += str;
		}

		return parse;
	})()
};


// extending String object
Object.defineProperties(String.prototype, {
	punc: { get() { return `<b class="punc">${this}</b>`; }, configurable: true },
	name: { get() { return `<b class="name">${this}</b>`; }, configurable: true },
	prop: { get() { return `<b class="prop">${this}</b>`; }, configurable: true },
	oper: { get() { return `<b class="oper">${this}</b>`; }, configurable: true },
	quot: { get() { return `<b class="quot">${this}</b>`; }, configurable: true },
	str:  { get() { return `<b class="str">${this}</b>`; }, configurable: true },
});

Object.defineProperties(String.prototype, {
	feed:       { get() { return `<b class="feed">${this}</b>`; }, configurable: true },
	bold:       { get() { return `<b class="bold">${this}</b>`; }, configurable: true },
	italic:     { get() { return `<b class="italic">${this}</b>`; }, configurable: true },
	underline:  { get() { return `<b class="underline">${this}</b>`; }, configurable: true },
	declare:    { get() { return `<b class="declare">${this}</b>`; }, configurable: true },
	email:      { get() { return `<b class="email">${this}</b>`; }, configurable: true },
	default:    { get() { return `<b class="default">${this}</b>`; }, configurable: true },
	err:        { get() { return `<b><span class="ticon terminal-output"></span></b><b class="error">${this}</b>`; }, configurable: true },
	output:     { get() { return `<b><span class="ticon terminal-output"></span></b><b class="output">${this}</b>`; }, configurable: true },
	loading:    { get() { return `<b><span class="ticon terminal-output"></span></b><b class="loading"><svg><use href="#terminal-cursor-loading"/></svg></b>`; }, configurable: true },
	withPrompt: { get() { return `<i>def:<span class="ticon terminal-input"></span></i><b>${this}</b>`; }, configurable: true },
});

export default Parser;
