
const Mail = {
	handle(data) {
		let template = `mail-${data.getAttribute("type") || "listing"}`;

		data.selectNodes("//*[@mStamp]").map(x => {
			let moment = new karaqu.Moment(+x.getAttribute("mStamp"));
			x.setAttribute("mDate", moment.format("D MMM"));
		})

		let htm = window.render({ data, template });
		return htm.email;
	}
};
