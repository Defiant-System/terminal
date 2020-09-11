
let cwd = "~/"

const fileSystem = {
	pwd() {
		return cwd.declare;
	},
	async suggest(stdIn) {
		let parts = await defiant.shell(`sys -p '${stdIn}'`);
		let path = parts.result.args[parts.result.args.length-1];
		let stdInPath = path.slice(0, path.lastIndexOf("/") + 1);
		let text = path.slice(stdInPath.length);
		let root = window.path.join(cwd, stdInPath || "./");
		let fsList = await defiant.shell(`fs -l '${root}'`);

		let dictionary = fsList.result.reduce((acc, curr) => {
			if (curr.name.startsWith(text)) {
				let path = window.path.join(root, curr.name);
				let stub = curr.name.slice(text.length);
				if (curr.kind === "_dir") stub += "/";
				stub = stub.replace(/\s/g, "\\ ");
				acc.push({ stub, path, name: curr.name });
			}
			return acc;
		}, []);
		
		return dictionary;
	},
	async list(path) {
		path = window.path.join(cwd, path || ".");
		let htm = window.render({ path, template: "directory-listing" });
		
		return htm.declare;
	},
	changeDirectory(path) {
		if (!path || path === "/") {
			path = "~";
		} else {
			let newPath = window.path.join(cwd, path);
			if (!window.path.isDirectory(newPath)) {
				return { error: `"${path}" is not a directory` }
			}
			path = newPath;
		}
		cwd = path;
	}
};

export default fileSystem;
