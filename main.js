const { app, BrowserWindow } = require('electron');
const path = require('path');
const iconPath = path.join(__dirname, "assets/images", "icon.png");
const isDev = require('electron-is-dev');

function createWindow() {
	// Create the browser window.
	const mainWindow = new BrowserWindow({
		width: 600,
		height: 280,
		resizable: false,
		frame: false,
		icon: iconPath,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			devTools: ( isDev ) ? true : false
		}
	});

	mainWindow.loadFile('index.html');

	// Open the DevTools.
	// mainWindow.webContents.openDevTools()
}

app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if ( process.platform !== 'darwin' ) app.quit();
});

app.on('activate', function () {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if ( BrowserWindow.getAllWindows().length === 0 ) createWindow();
});