
**MonoGame for VSCode** simplifies the process of using MonoGame in Visual Studio Code by importing some of the features of the Visual Studio 2022 MonoGame extension.

- Automatically installs MonoGame templates
- Easily create new projects
- Double-click MGCB files to open the MGCB Editor

<!-- \!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow. -->
## Quick Start
To create your first MonoGame project in VS Code,

1. Install the [.NET SDK](https://dotnet.microsoft.com/en-us/download) and [C# Dev Kit](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csdevkit). Restart VS Code, then install this extension.
2. Open the command palette and choose **"MonoGame: Create New Project"**.
3. Choose a project template (if you aren't sure, choose **"Cross-Platform Desktop Application"**).
4. Enter project name and directory.

Your new project will be created automatically at the directory and the window will refresh. The solution explorer (part of the C# Dev Kit) should appear in the sidebar, allowing you to build, run and debug your game.

To open the MGCB editor, use the `MonoGame: Open MGCB Editor` command or click the MonoGame button in the tab bar.



## Requirements

 - [.NET SDK](https://dotnet.microsoft.com/en-us/download)
 - [C# Dev Kit](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csdevkit)

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `MonoGame`

* `myExtension.enable`: Enable/disable this extension.
* `myExtension.thing`: Set to `blah` to do something.



## Release Notes

### 1.0.0

Initial release