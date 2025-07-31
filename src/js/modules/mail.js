
const Mail = {
	handle(data) {
		let template = `mail-${data.getAttribute("type") || "listing"}`;
		let htm = window.render({ data, template });
		return htm.declare;
	}
};
