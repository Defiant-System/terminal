
const Mail = {
	handle(cmd, data) {
		switch (true) {
			case cmd.command.startsWith("mail -o "): return this.rawEmail(data);
			default: return this.parseList(data);
		}
	},
	parseList(data) {
		let template = `mail-${data.getAttribute("type") || "listing"}`;

		data.selectNodes("//*[@mStamp]").map(x => {
			let moment = new karaqu.Moment(+x.getAttribute("mStamp"));
			x.setAttribute("mDate", moment.format("D MMM"));
			x.setAttribute("mLong", moment.format("D MMM YYYY"));
		});

		let htm = window.render({ data, template });
		return htm.email;
	},
	rawEmail(text) {
		return text.stripHtml().declare;
	}
};
