# GitHub File Downloader Extension

A Chrome Extension for downloading only specific files from GitHub without having to clone whole repositories or download each file manually.

## Usage

Go to any folder of any GitHub repository, click the 'Download' button, choose whether you want to download **all files** from the current directory or **select specific files**. Wait for a ZIP archive to finish downloading. Much simpler than downloading the whole repo and then spending an eternity looking for the two or three files you wanted, right? 

## Installation

1. **Clone or Download the Repository**:
```bash
git clone https://github.com/artpolcom/github-file-downloader.git
```
Or download the ZIP file from the [Releases](https://github.com/artpolcom/github-file-downloader/releases) page. 
2. **Load the Extension in Chrome**:
- Navigate to `chrome://extensions/` in your browser.
- Enable **Developer Mode** in the top-right corner.
- Click **Load Unpacked** and select the folder containing the extension files.
3. **Enjoy!**

## Screenshots

<img src="https://i.imgur.com/dvCi6wH.png" width="300" />
<img src="https://i.imgur.com/DuRBGlc.png" width="300" />
<img src="https://i.imgur.com/hQwAa1Q.png" width="300" />
<img src="https://i.imgur.com/tXh28cg.png" width="300" />

## License

The extension is licensed under the [MIT License](LICENSE). The extension uses JSZip, which is also used under the MIT License. See [THIRD-PARTY-LICENSES.md](THIRD-PARTY-LICENSES.md) for details.

## Acknowledgments

The extension was inspired by bursts of extreme frustration with GitHub's unwillingness to implement such a simple feature.
