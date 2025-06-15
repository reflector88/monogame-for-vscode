import * as vscode from 'vscode';
import * as child_process from 'child_process';
import { dirname } from 'path';

// Constants
const MONOGAME_TEMPLATE_LIST_COMMAND = "dotnet new list MonoGame";

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
	switch (process.platform) {
		case "win32":
		case "darwin":
		case "linux":
			break;
		default:
			vscode.window.showErrorMessage("Automatic template installation is not supported.");
			return;
	}
	child_process.exec(MONOGAME_TEMPLATE_LIST_COMMAND, (error, stdout, stderr) => {
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
	// Get templates dynamically
	const templateCommands = await getMonoGameTemplates();

	if (templateCommands.size === 0) {
        vscode.window.showErrorMessage("No MonoGame templates found. Please make sure MonoGame templates are installed.");
        return;
    }

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

/**
 * Fetches available MonoGame templates from dotnet CLI
 * @returns Map of template display names to template short names
 */
async function getMonoGameTemplates(): Promise<Map<string, string>> {
    return new Promise((resolve) => {
        const templateMap = new Map<string, string>();

        // Run dotnet command to list MonoGame templates
        child_process.exec(MONOGAME_TEMPLATE_LIST_COMMAND, (error, stdout, stderr) => {
            if (error || !stdout) {
                vscode.window.showErrorMessage(`Error executing command: ${error instanceof Error ? error.message : "Unknown error"}`);
                return;
            }

            try {
                // Parse the output
                const lines = stdout.split('\n');
                for (const line of lines) {
          			const trimmedLine = line.trim();

					// Skip empty lines, header, and separator
					if (
						!trimmedLine ||
						trimmedLine.startsWith("Template Name") ||
						trimmedLine.startsWith("---")
					) continue;
					
					// Parse template info from the line
					// Format is typically: Template Name, Short Name, Language, Tags
					const parts = trimmedLine.split(/\s{2,}/);
					
                    if (parts.length >= 2) {
                        const templateName = parts[0].trim();
                        const shortName = parts[1].trim();

                        // Add icon based on template name
                        let icon = "$(device-desktop)";
                        if (templateName.includes("Android") || templateName.includes("iOS")) {
                            icon = "$(device-mobile)";
                        } else if (templateName.includes("Library") || templateName.includes("Shared")) {
                            icon = "$(archive)";
                        } else if (templateName.includes("Pipeline")) {
                            icon = "$(tools)";
                        }

                        templateMap.set(`${icon} ${templateName}`, shortName);
                    }
                }

                resolve(templateMap);
            } catch (error) {
                vscode.window.showErrorMessage(`Error executing command: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        });
    });
}