# Enhanced i18n JSON Editor

![logo](media/ei18n_logo.png)

Enhanced i18n JSON Editor is a powerful Visual Studio Code extension designed to simplify the management and editing of JSON translation files. This enhanced version builds upon the original concept with numerous improvements, new features, and bug fixes.

## ✨ Key Features

- **Intuitive Interface**: Clean and user-friendly interface for managing translations
- **Multiple Access Methods**: Open via context menu, activity bar, or status bar
- **Translation Services**: Built-in support for Microsoft Translator API
- **RTL Language Support**: Full support for right-to-left languages
- **Column Management**: Show/hide language columns as needed
- **Missing Translation Detection**: Easily find and fill missing translations
- **Empty Translation Handling**: Configurable support for empty translations
- **Workspace Support**: Manage multiple translation folders simultaneously
- **Auto-save Warnings**: Get notified about unsaved changes
- **Customizable Configuration**: Extensive configuration options

<br>

## 🚀 Usage

The Enhanced i18n JSON Editor can be accessed in multiple ways:

### 1. Context Menu (Right-click)
Right-click on any supported folder (default: **i18n**) and select **Enhanced i18n JSON Editor**
- Folder names can be customized with `i18nJsonEditor.supportedFolders`
- Supports relative paths like `src/i18n`, `./locales`, etc.

![extension demo](media/demo.gif)

### 2. Activity Bar
Click on the **Enhanced i18n JSON Editor** icon in the Activity Bar for quick access

### 3. Workspace Mode
Manage multiple translation folders simultaneously by clicking **ei18n editor** in the Status Bar
- Requires `i18nJsonEditor.workspaceFolders` configuration

![status bar extension](media/workspace.png)

### 4. Translation Services
Integrate with translation services for automatic translations:
- Configure `i18nJsonEditor.translationService` and `i18nJsonEditor.translationServiceApiKey`
- Currently supports Microsoft Translator

![extension demo translate](media/demo-translate.gif)

## ⚙️ Configuration

### Basic Settings

**`i18nJsonEditor.forceKeyUPPERCASE`** - Force translation keys to uppercase (default: `true`)
```json
"i18nJsonEditor.forceKeyUPPERCASE": false
```

**`i18nJsonEditor.jsonSpace`** - Indentation for JSON output (default: `2`)
```json
"i18nJsonEditor.jsonSpace": 4
```

**`i18nJsonEditor.lineEnding`** - Line ending character (default: `"\n"`)
```json
"i18nJsonEditor.lineEnding": "\r\n"
```

**`i18nJsonEditor.keySeparator`** - Key separator character (default: `"."`)
```json
"i18nJsonEditor.keySeparator": "/"
```

### Folder Configuration

**`i18nJsonEditor.supportedFolders`** - Folders that trigger the context menu (default: `["i18n"]`)
```json
"i18nJsonEditor.supportedFolders": [
    "i18n",
    "locales",
    "src/i18n",
    "./translations"
]
```
*Note: Restart VS Code after changing this setting*

**`i18nJsonEditor.workspaceFolders`** - Multiple folder management
```json
"i18nJsonEditor.workspaceFolders": [
    { "name": "Common", "path": "./i18n" },
    { "name": "Portal", "path": "./portal/locales" }
]
```

### Translation Services

**`i18nJsonEditor.translationService`** - Translation service provider
```json
"i18nJsonEditor.translationService": "MicrosoftTranslator"
```

**`i18nJsonEditor.translationServiceApiKey`** - API key for translation service
```json
"i18nJsonEditor.translationServiceApiKey": "your-api-key-here"
```

### Advanced Settings

**`i18nJsonEditor.allowEmptyTranslations`** - Allow saving empty translations (default: `false`)
```json
"i18nJsonEditor.allowEmptyTranslations": true
```

**`i18nJsonEditor.defaultLanguage`** - Default reference language (default: `"en"`)
```json
"i18nJsonEditor.defaultLanguage": "es"
```

## 🆕 What's New in Enhanced Version

This enhanced version includes numerous improvements over the original:

### New Features
- **Activity Bar Integration**: Quick access via dedicated activity bar icon
- **Missing Translation Finder**: Easily locate and fill missing translations
- **Language Management**: Show/hide language columns dynamically
- **RTL Language Support**: Full support for right-to-left languages
- **Empty Translation Handling**: Configurable support for empty translations
- **Unsaved Changes Warning**: Get notified about pending changes
- **Improved UI**: Better interface with enhanced user experience
- **Relative Path Support**: Support for complex folder structures

### Bug Fixes & Improvements
- Fixed context menu functionality
- Improved save button behavior and visual feedback
- Better handling of hidden languages
- Enhanced column visibility persistence
- Optimized performance and stability
- Comprehensive error handling

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🙏 Acknowledgments

This extension is inspired by the original [vsce-i18n-json-editor](https://github.com/thibault-vanderseypen/vsce-i18n-json-editor) by **Thibault Vanderseypen**. While maintaining the core concept, this enhanced version has been developed independently with significant improvements and new features.

### Original Extension
- **Original Author**: Thibault Vanderseypen
- **Original Repository**: https://github.com/thibault-vanderseypen/vsce-i18n-json-editor
- **Website**: https://vanderseypen.dev

### Enhanced Version
- **Author**: Trystan4861
- **Repository**: https://github.com/Trystan4861/i18n-json-editor
- **GitHub**: https://github.com/trystan4861

## 🐛 Issues & Contributions

Found a bug or have a feature request? Please open an issue on the [GitHub repository](https://github.com/Trystan4861/i18n-json-editor/issues).

Contributions are welcome! Feel free to submit pull requests to help improve this extension.
