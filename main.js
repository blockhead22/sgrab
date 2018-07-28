const {app, BrowserWindow, globalShortcut, Notification, ipcMain, Tray} = require('electron')
const electronLocalshortcut = require('electron-localshortcut');
var screenshot = require('desktop-screenshot');
var Jimp = require("jimp");
const fs = require('fs');
const imgurUploader = require('imgur-uploader');
const {clipboard} = require('electron')
const path = require('path')
const assetsDirectory = path.join(__dirname, 'pages')
const {autoUpdater} = require("electron-updater");


let tray = undefined
let window = undefined

// Don't show the app in the doc
//app.dock.hide()

// Creates tray & window
app.on('ready', () => {
  createTray()
  trayWindow()
  autoUpdater.checkForUpdates();
})

// Quit the app when the window is closed
app.on('window-all-closed', () => {
  app.quit()
})

// Creates tray image & toggles window on click
const createTray = () => {
  tray = new Tray(path.join(assetsDirectory, '/img/icon.png'))
  tray.on('click', function (event) {
    toggleWindow()
    autoUpdater.checkForUpdates();
  })
}

  const getWindowPosition = () => {
  const windowBounds = window.getBounds()
  const trayBounds = tray.getBounds()

  // Center window horizontally below the tray icon
  const x = Math.round(trayBounds.x - 150)

  // Position window 4 pixels vertically below the tray icon
  const y = Math.round(trayBounds.y - 310)

  console.log(y);

  return {x: x, y: y}
}

// Creates window & specifies its values
const trayWindow = () => {
  window = new BrowserWindow({
        width: 250,
        height: 310,
        show: false,
        frame: false,
        fullscreenable: false,
        resizable: false,
        transparent: true,
        'node-integration': false
    })
    // This is where the index.html file is loaded into the window
    window.loadURL('file://' + __dirname + '/pages/settings.html');

  // Hide the window when it loses focus
  window.on('blur', () => {
    if (!window.webContents.isDevToolsOpened()) {
      window.hide()
    }
  })

  window.on('close', function (event) {
      if(!app.isQuiting){
          event.preventDefault();
          window.hide();
      }

      return false;
  });

}

const toggleWindow = () => {
  if (window.isVisible()) {
    window.hide()
  } else {
    showWindow()
  }
}

const showWindow = () => {
  const position = getWindowPosition()
  window.setPosition(position.x, position.y, false)
  window.show()
  window.focus()
}

ipcMain.on('show-window', () => {
  showWindow()
})















  function createWindow () {
    // Create the browser window.
    var win = new BrowserWindow({
    width: 100,
    height: 50,
    transparent: true,
    frame: false,
    kiosk: true
  })

    // and load the index.html of the app.
    win.loadFile('pages/index.html')
    win.setFullScreen(true)
    win.setFullScreenable(false)
    win.setResizable(false)

  }


  function uploaded () {
    // Create the browser window.
    var win = new BrowserWindow({
    width: 0,
    height: 0,
    transparent: true,
    frame: false,
  })

    // and load the index.html of the app.
    win.loadFile('pages/uploaded.html')
    win.setPosition(0,0);
  }

  app.on('ready', () => {
    // Register a 'CommandOrControl+X' shortcut listener.
    const {desktopCapturer, screen} = require('electron');
    const ret = globalShortcut.register('CommandOrControl+Shift+4', () => {
      console.log('CommandOrControl+X is pressed')

      createWindow();
      //BrowserWindow.close();
      var date = new Date();
      var current_hour = date.getHours();
        screenshot("screenshot.png", function(error, complete) {
            if(error)
                console.log("Screenshot failed", error);
            else
                console.log("Screenshot succeeded");
        });


    })

    if (!ret) {
      console.log('registration failed')
    }

    ipcMain.on('synchronous-message', (event, arg) => {
       console.log(arg) // prints "ping"
       event.returnValue = 'pong'
     })

     ipcMain.on('crop', (event, arg) => {
        console.log(arg.x) // prints "ping"
        Jimp.read("screenshot.png", function (err, sshot) {
          if (err) throw err;
          sshot.crop( arg.x, arg.y, arg.height, arg.width );
          sshot.write("screenshot.png");
        }).catch(function (err) {
            console.error(err);
        });
        app.quit();

                // $ mplayer foo.mp
        setTimeout(function(){
          imgurUploader(fs.readFileSync('screenshot.png'), {title: ''}).then(data => {
              console.log(data.link);
              clipboard.writeText(data.link);
              uploaded();
              fs.unlink('screenshot.png', function(error) {
                  if (error) {
                      throw error;
                  }
                  console.log('Deleted');
              });
              setTimeout(function(){
                app.quit();

              },1000)

          });
        },600);





      })


    // Check whether a shortcut is registered.
    console.log(globalShortcut.isRegistered('CommandOrControl+X'))
  })

  app.on('will-quit', () => {
    // Unregister a shortcut.
    globalShortcut.unregister('CommandOrControl+X')

    // Unregister all shortcuts.
    globalShortcut.unregisterAll()
  })

  // when the update has been downloaded and is ready to be installed, notify the BrowserWindow
  autoUpdater.on('update-downloaded', (info) => {
      tray.webContents.send('updateReady')
  });

  // when receiving a quitAndInstall signal, quit and install the new version ;)
  ipcMain.on("quitAndInstall", (event, arg) => {
      autoUpdater.quitAndInstall();
  })
