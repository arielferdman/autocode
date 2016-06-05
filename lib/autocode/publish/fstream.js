let Ignore, Packer, path;

Ignore = require('fstream-ignore');

Packer = require('fstream-npm');

path = require('path');

export default Packer;

Packer.prototype.emitEntry = function(entry) {
	let h, me, p, t;
	if (this._paused) {
		this.once("resume", this.emitEntry.bind(this, entry));
		return;
	}
	if (entry.basename === ".gitignore") {
		entry.basename = ".npmignore";
		entry.path = path.resolve(entry.dirname, entry.basename);
	}
	if (entry.basename.match(/\.gyp$/) && this.entries.indexOf("package.json") !== -1) {
		entry.basename = "binding.gyp";
		entry.path = path.resolve(entry.dirname, entry.basename);
	}
	if (entry.type === "SymbolicLink") {
		entry.abort();
		return;
	}
	if (entry.type !== "Directory") {
		h = path.dirname((entry.root || entry).path);
		t = entry.path.substr(h.length + 1).replace(/^[^\/\\]+/, this.root.props.folder);
		p = `${h}/${t}`;
		entry.path = p;
		entry.dirname = path.dirname(p);
		return Ignore.prototype.emitEntry.call(this, entry);
	}
	me = this;
	entry.on("entry", e => {
		if (e.parent === entry) {
			e.parent = me;
			return me.emit("entry", e);
		}
	});
	return entry.on("package", this.emit.bind(this, "package"));
};
