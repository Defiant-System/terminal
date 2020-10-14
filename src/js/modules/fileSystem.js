
let cwd = "\~/Desktop/"
//let cwd = "\~/"

const fileSystem = {
	pwd() {
		return cwd.declare;
	},
	async suggest(stdIn) {
		let parts = await defiant.shell(`sys -p '${stdIn}'`);
		let path = parts.result.args[parts.result.args.length-1];
		if (path === "..") return [{ stub: "/" }];

		let stdInPath = path.slice(0, path.lastIndexOf("/") + 1);
		let text = path.slice(stdInPath.length);
		let root = window.path.join(cwd, stdInPath || "./");
		let fsList = await defiant.shell(`fs -l '${root}'`);

		let dictionary = fsList.result.reduce((acc, curr) => {
			if (curr.name.startsWith(text)) {
				let path = window.path.join(root, curr.name);
				let stub = curr.name.slice(text.length);
				let name = curr.name;
				if (curr.kind === "_dir") {
					stub += "/";
					name += "/";
				}
				stub = stub.replace(/\s/g, "\\ ");
				acc.push({ stub, path, name });
			}
			return acc;
		}, []);
		
		return dictionary;
	},
	async mkdir(path) {
		path = window.path.join(cwd, path || ".");
		
		let cmd = await defiant.shell(`fs -c '${path}'`);
		return cmd.result;
	},
	async touch(path, text = "") {
		path = window.path.join(cwd, path || ".");
		
		let cmd = await defiant.shell(`fs -s '${path}' '${text}'`);
		return cmd.result;
	},
	async emptyBin() {
		let cmd = await defiant.shell(`fs -e`);
		return cmd.result;
	},
	async move(src, dest) {
		src = window.path.join(cwd, src || ".");
		dest = window.path.join(cwd, dest || ".");
		
		let cmd = await defiant.shell(`fs -m '${src}' '${dest}'`);
		return cmd.result;
	},
	async copy(src, dest) {
		src = window.path.join(cwd, src || ".");
		dest = window.path.join(cwd, dest || ".");
		
		let cmd = await defiant.shell(`fs -y '${src}' '${dest}'`);
		return cmd.result;
	},
	async remove(path) {
		path = window.path.join(cwd, path || ".");
		
		let cmd = await defiant.shell(`fs -d '${path}'`);
		return cmd.result;
	},
	async list(path) {
		path = window.path.join(cwd, path || ".");
		let htm = window.render({ path, template: "directory-listing" });
		
		return htm.declare;
	},
	changeMode() {
		return { error: "Not implemented yet" };
	},
	changeOwner() {
		return { error: "Not implemented yet" };
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
