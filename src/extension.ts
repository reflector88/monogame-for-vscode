import * as vscode from 'vscode';
import * as child_process from 'child_process';

let myTerminal: vscode.Terminal;

export function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(
		vscode.commands.registerCommand('monogame.createProject', () => {
			getUserInput()
		}),

		vscode.commands.registerCommand('monogame.MGCB', () => {
			openMGCBEditor();
		})
	);
}

async function install() {
	vscode.window.showInformationMessage(
		"Would you like to install MonoGame templates?", "Install", "Do Not Install")
		.then((selection) => {
			if (selection === "Install") {
				runShellCommand("dotnet new install MonoGame.Templates.CSharp");
				vscode.window.showInformationMessage("Installing...");
			}
		});
}

function openMGCBEditor() {

	if (vscode.workspace.workspaceFolders) {
		const workDir = vscode.workspace.workspaceFolders[0].uri.fsPath;
		const fileDir = `${workDir}\\Content\\Content.mgcb`;

		child_process.execFile("dotnet", ["mgcb-editor", fileDir], { cwd: workDir });
	}
}

// function isPackageInstalled(packageName: string): Promise<boolean> {
// 	return new Promise((resolve, reject) => {
// 		exec(`dotnet list package --name ${packageName}`, (error, stdout, stderr) => {
// 			if (error) {
// 				reject(error);
// 				return;
// 			}
// 			resolve(stdout.includes(packageName));
// 		});
// 	});
// }

async function getUserInput() {
	const templateCommands = new Map([
		["$(device-desktop) Cross-Platform Desktop Application", "mgdesktopgl"],
		["$(device-desktop) Windows Desktop Application", "mgwindowdx"],
		["$(device-desktop) Windows Universal XAML Application", "mguwpxaml"],
		["$(device-mobile) Android Application", "mgandroid"],
		["$(device-mobile) iOS Application", "mgios"],
		["$(tools) Content Pipeline Extension", "mgpipeline"],
		["$(archive) Game Library", "mglib"],
		["$(archive) Shared Library Project", "mgshared"],
	]);

	const template = await vscode.window.showQuickPick(Array.from(templateCommands.keys()), {
		title: "Create MonoGame Project",
		placeHolder: "Select a Template..."
	});
	if (!template) return;

	const name = await vscode.window.showInputBox({
		title: "Create MonoGame Project",
		placeHolder: "Enter Project Name..."
	});
	if (!name) return;

	const path = await vscode.window.showOpenDialog({
		openLabel: "Select Folder",
		canSelectFiles: false,
		canSelectFolders: true
	});
	if (!path) return;

	createNewProject(path[0].fsPath, name.replaceAll(" ", "_"), templateCommands.get(template)!);
}

function createNewProject(path: string, name: string, template: string) {
	const commands = [
		`cd ${path}`,
		`mkdir ${name}`,
		`cd ${name}`,
		`dotnet new ${template} -n ${name}`,
		`dotnet new sln -n ${name}`,
		`dotnet sln add ./${name}/${name}.csproj`,
		`cd ${name}`,
		"code . -r"
	];

	for (const command of commands) runShellCommand(command);
	vscode.window.showInformationMessage("Creating new project...");
}


function runShellCommand(command: string) {
	if (!myTerminal) {
		if (vscode.window.activeTerminal && vscode.window.activeTerminal.name === "powershell") {
			myTerminal = vscode.window.activeTerminal;
		} else {
			myTerminal = vscode.window.createTerminal();
		}
	}
	myTerminal.sendText(command);
}

export function deactivate() {
	myTerminal.dispose();
}