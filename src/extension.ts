import * as vscode from 'vscode';

let myTerminal: vscode.Terminal;

const quickPickOptions: vscode.QuickPickOptions = { placeHolder: "Select a Template" };

const inputBoxOptions: vscode.InputBoxOptions = { placeHolder: "Enter Project Name" };

const dialogOptions: vscode.OpenDialogOptions = {
	openLabel: "Select Folder",
	canSelectFiles: false,
	canSelectFolders: true
};

const templates = new Map([
	["$(device-desktop) Cross-Platform Desktop Application", "mgdesktopgl"],
	["$(device-desktop) Windows Desktop Application", "mgwindowdx"],
	["$(device-desktop) Windows Universal XAML Application", "mguwpxaml"],
	["$(device-mobile) Android Application", "mgandroid"],
	["$(device-mobile) iOS Application", "mgios"],
	["$(tools) Content Pipeline Extension", "mgpipeline"],
	["$(archive) Game Library", "mglib"],
	["$(archive) Shared Library Project", "mgshared"],

]);

export function activate(context: vscode.ExtensionContext) {

	//Creates new MonoGame project and solution at specified folder
	const createProject = vscode.commands.registerCommand(
		'monogame.createProject', () => {
			getNewProjectInput();
		});
	context.subscriptions.push(createProject);

	const openMGCBEditor = vscode.commands.registerCommand(
		'monogame.MGCB', () => {

			let folderName: string = '';
			if (vscode.workspace.workspaceFolders) {
				const currentDir = vscode.workspace.workspaceFolders[0].uri.fsPath;
				folderName = currentDir.slice(currentDir.lastIndexOf("\\") + 1);
			}

			runShellCommand("dotnet mgcb-editor ./Content/Content.mgcb");
		});
	context.subscriptions.push(openMGCBEditor);

}

async function getNewProjectInput() {
	const template = await vscode.window.showQuickPick(Array.from(templates.keys()), quickPickOptions);
	if (!template) return;

	const name = await vscode.window.showInputBox(inputBoxOptions);
	if (!name) return;

	const path = await vscode.window.showOpenDialog(dialogOptions);
	if (!path) return;

	createNewProject(path, name, template);
}

function createNewProject(path: vscode.Uri[], name: string, template: string) {
	const commands = [
		"cd " + path[0].fsPath,
		"mkdir " + name,
		"cd " + name,
		"dotnet new " + templates.get(template) + " -n " + name,
		"dotnet new sln -n " + name,
		"dotnet sln add ./" + name + "/" + name + ".csproj",
		"code ."
	];

	for (const command of commands) runShellCommand(command);
	vscode.window.showInformationMessage("\"" + name + "\" created at " + path[0].fsPath);

}

function runShellCommand(command: string) {
	if (!myTerminal) {
		myTerminal = vscode.window.createTerminal();
	}
	myTerminal.sendText(command);
}

export function deactivate() { }
