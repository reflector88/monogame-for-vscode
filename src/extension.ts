import * as vscode from 'vscode';
import * as child_process from 'child_process';
import { dirname } from 'path';

let myTerminal: vscode.Terminal;

export function activate(context: vscode.ExtensionContext) {
	checkInstallation();
	checkProjectOpen();

	context.subscriptions.push(
		vscode.commands.registerCommand('monogame.createProject', () => {
			getUserInput();
		}),

		vscode.commands.registerCommand('monogame.openMGCB', () => {
			openMGCBEditor();
		}),

		vscode.commands.registerCommand('monogame.install', () => {
			installTemplates();
		})
	);
}

function checkInstallation() {
	let checkCommand = "dotnet new --list | ";
	switch (process.platform) {
		case "win32":
			checkCommand += "findstr mgdesktopgl";
			break;
		case "darwin":
		case "linux":
			checkCommand += "grep mgdesktopgl";
			break;
		default:
			vscode.window.showErrorMessage("Automatic template installation is not supported.");
			return;
	}
	child_process.exec(checkCommand, (error, stdout, stderr) => {
		if (!stdout) installTemplates();
	});
}

function installTemplates() {
	runShellCommand("dotnet new install MonoGame.Templates.CSharp");
	vscode.window.showInformationMessage("Installing Templates...");
}

function checkProjectOpen() {
	vscode.workspace.findFiles("**/Content/*.mgcb")
		.then((pathUri) => {
			if (pathUri.length > 0) {
				vscode.commands.executeCommand('setContext', 'monogame.projectOpen', true);
			} else {
				vscode.commands.executeCommand('setContext', 'monogame.projectOpen', false);
			}
		});
}

async function getUserInput() {
	const templateCommands = new Map([
		["$(device-desktop) Cross-Platform Desktop Application", "mgdesktopgl"],
		["$(device-desktop) Windows Desktop Application", "mgwindowsdx"],
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
		"code . -r"
	];

	for (const command of commands) runShellCommand(command);
	vscode.window.showInformationMessage("Creating new project...");
}

function openMGCBEditor() {
	vscode.workspace.findFiles("**/Content/*.mgcb").then((pathUri) => {
		if (pathUri.length === 0) {
            vscode.window.showErrorMessage("Could not find .mgcb file in current directory.");
            return;
		}
		
		try {
			const fileDir = pathUri[0].fsPath;

			child_process.execFile("dotnet", ["mgcb-editor", fileDir],
				{ cwd: dirname(fileDir) });

		} catch {
			vscode.window.showErrorMessage("Could not find .mgcb file in current directory.");
		}
	});
}

function runShellCommand(command: string) {
	try {
		if (!myTerminal) {
			if (vscode.window.activeTerminal && vscode.window.activeTerminal.name === "powershell") {
				myTerminal = vscode.window.activeTerminal;
			} else {
				myTerminal = vscode.window.createTerminal();
			}
		}
		myTerminal.sendText(command);
	}
	catch (error) {
		vscode.window.showErrorMessage(`Error executing command: ${error instanceof Error ? error.message : "Unknown error"}`);
	}
}

export function deactivate() {
	if (myTerminal) {
		myTerminal.dispose();
	}
}
