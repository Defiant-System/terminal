
const history = {
	log: [
		// DEV-ONLY-START
		"help",
		"history",
		"win -o mines",
		"clear",
		"fs -ih",
		"history",
		"ls",
		"sys -b",
		//"sys -p 'ls a'",
		"whoami",
		"friends",
		"user -a bill",
		"net -s bill Hello",
		// DEV-ONLY-END
	]
};
history.index = history.log.length;

export default history;
