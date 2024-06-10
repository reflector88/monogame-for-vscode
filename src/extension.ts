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
	["Android Application", "mgandroid"],
	["Content Pipeline Extension", "mgpipeline"],
	["Cross-Platform Desktop Application", "mgdesktopgl"],
	["Game Library", "mglib"],
	["iOS Application", "mgios"],
	["Shared Library Project", "mgshared"],
	["Windows Desktop Application", "mgwindowdx"],
	["Windows Universal XAML Application", "mguwpxaml"]
]);

export function activate(context: vscode.ExtensionContext) {

	//Creates new MonoGame project and solution at specified folder
	const createProject = vscode.commands.registerCommand(
		'monogame-commands.createProject', () => {
			getNewProjectInput();
		});
	context.subscriptions.push(createProject);

	const openMGCBEditor = vscode.commands.registerCommand(
		'monogame-commands.MGCB', () => {

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
	const projectTemplate = await vscode.window.showQuickPick(Array.from(templates.keys()), quickPickOptions);
	if (!projectTemplate) return;

	const projectName = await vscode.window.showInputBox(inputBoxOptions);
	if (!projectName) return;

	const projectPath = await vscode.window.showOpenDialog(dialogOptions);
	if (!projectPath) return;

	createNewProject(projectPath, projectName, projectTemplate);
}

function createNewProject(projectPath: vscode.Uri[], projectName: string, projectTemplate: string) {
	const commandList = [
		"cd " + projectPath[0].fsPath,
		"mkdir " + projectName,
		"cd " + projectName,
		"dotnet new " + templates.get(projectTemplate) + " -n " + projectName,
		"dotnet new sln -n " + projectName,
		"dotnet sln add ./" + projectName + "/" + projectName + ".csproj"
	];

	for (const command of commandList) runShellCommand(command);
	vscode.window.showInformationMessage("\"" + projectName + "\" created at " + projectPath[0].fsPath);

}

function runShellCommand(command: string) {
	if (!myTerminal) {
		myTerminal = vscode.window.createTerminal();
	}
	myTerminal.sendText(command);
}

export function deactivate() { }
