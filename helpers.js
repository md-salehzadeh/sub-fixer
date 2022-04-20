const { app } = require('electron');
let $fs = require('fs');
let $path = require('path');
let $archiver = require('archiver');

let $chardet = require('chardet');
let $Iconv  = require('iconv-lite');

const isDev = require('electron-is-dev');

let methods = {

	getPath(filePath) {
		filePath = 'appData/' + filePath;
		filePath = filePath.replace(/\/$/, "");

		let path;

		if ( this.isDev() ) {
			path = $path.join(__dirname, filePath);
		} else {
			path = $path.join(app.getPath('userData'), filePath);
		}

		return path;
	},

	isDev() {
		return isDev;
	},

	create_directories() {
		if ( !$fs.existsSync(this.getPath('')) ) $fs.mkdirSync(this.getPath(''));
		if ( !$fs.existsSync(this.getPath('download')) ) $fs.mkdirSync(this.getPath('download'));
		if ( !$fs.existsSync(this.getPath('export')) ) $fs.mkdirSync(this.getPath('export'));
	},

	async fixSubtitles(data) {
		let name = data.name.trim();
		let namePattern = data.namePattern.trim();

		let subtitles = [];
		let process_finished = new Promise((resolve, reject) => {
			data.subtitles.forEach((item, index) => {
				let file = item.name;
				let filePath = item.path;

				$fs.readFile(filePath, (err, subtitle) => {
					subtitle = this.filter(subtitle, filePath);

					if (name && namePattern) {
						let ext = $path.extname(file);

						let regex = new RegExp(namePattern);
						let matches = file.match(regex);
						if ( matches && typeof matches[1] != 'undefined' ) {
							let number = matches[1];
							file = name.replace('{#}', number) + ext;
						}
					}
					
					$fs.appendFile(this.getPath(`export/${file}`), subtitle, (err) => {});

					subtitles.push(file);

					if (index === data.subtitles.length - 1) resolve();
				});
			});
		});

		return process_finished.then(() => {
			return this.make_zip(subtitles).then(output_filename => {
				this.empty_export_directory();

				return {
					file_name: output_filename
				};
			});
		});
	},

	filter(content, filePath) {
		let from_charset = $chardet.detect(content);
		content = $Iconv.decode(content, from_charset);
		
		content = content.replace(/ي/g, 'ی');
		content = content.replace(/ك/g, 'ک');

		return content;
	},

	make_zip(files) {
		return new Promise((resolve, reject) => {
			if ( files.length > 1 ) {
				let zip_filename = "SubFixer-" + new Date().getTime() + ".zip";
				let output = $fs.createWriteStream(this.getPath(`download/${zip_filename}`));
				let archive = $archiver('zip');
	
				archive.pipe(output);
	
				files.forEach((file) => {
					archive.file(this.getPath(`export/${file}`), { name: file });
				});
	
				archive.finalize();
	
				output.on('close', () => {
					resolve(zip_filename);
				});
			} else {
				this.copyFile(this.getPath(`export/${files[0]}`), this.getPath(`download/${files[0]}`));
	
				resolve(files[0]);
			}
		});
	},

	empty_export_directory() {
		$fs.readdir(this.getPath(`export`), (err, files) => {
			for ( const file of files ) {
				$fs.unlink(this.getPath(`export/${file}`), err => {});
			}
		});
	},

	copyFile(oldPath, newPath) {
		$fs.createReadStream(oldPath).pipe($fs.createWriteStream(newPath));
	},

	deleteFile(filePath) {
		$fs.unlink(filePath, err => {});
	},

	moveFile(oldPath, newPath) {
		this.copyFile(oldPath, newPath);
		this.deleteFile(oldPath);
	},

};

methods.create_directories();

module.exports = methods;