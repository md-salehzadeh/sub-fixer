// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
	const { remote } = require('electron');
	const helpers = remote.require('./helpers.js');
	const dialog = remote.dialog;
	const WIN = remote.getCurrentWindow();

	$(document).on('click', '#min-btn', function() {
		var window = remote.getCurrentWindow();
		window.minimize();
	});
	
	$(document).on('click', '#max-btn', function() {
		var window = remote.getCurrentWindow();
		if ( !window.isMaximized() ) {
			window.maximize();
		} else {
			window.unmaximize();
		}
	});
	
	$(document).on('click', '#close-btn', function() {
		var window = remote.getCurrentWindow();
		window.close();
	});
	
	$(document).ready(function (e) {
		$("#form").on('submit', (function (e) {
			e.preventDefault();

			let form = new FormData(this);
			let dataForm = {
				name: form.get('name'),
				namePattern: form.get('name-pattern'),
				subtitles: form.getAll('subtitles[]'),
			};

			if ( !dataForm.subtitles[0].name ) {
				let dialog_options = {
					title: 'SubFixer',
					type: 'warning',
					message: 'Pick a subtitle first',
					detail: 'there is no file chosen to fix!',
				};

				dialog.showMessageBox(WIN, dialog_options, (response) => {});
				return;
			}

			helpers.fixSubtitles(dataForm).then(data => {
				let download_options = {
					title: "Save file - SubFixer",
					defaultPath: data.file_name,
					buttonLabel: "Save Subtitle(s)",
					filters: [
						{name: 'All Files', extensions: ['*']}
					]
				};
				
				dialog.showSaveDialog(WIN, download_options).then(saveData => {
					let file_name_full = helpers.getPath(`download/${data.file_name}`);
					
					if ( saveData.canceled ) {
						helpers.deleteFile(file_name_full);
					} else {
						helpers.moveFile(file_name_full, saveData.filePath);
					}
				});
			});
		}));
	});
});