import * as vscode from 'vscode';

export async function activate(context: vscode.ExtensionContext) {
	const provider = new ContentCompletionItemProvider();

	await readAllContentFiles(provider);
	
	const fsWatcher = vscode.workspace.createFileSystemWatcher('**/*.mgcb');
	fsWatcher.onDidCreate(async uri => await provider.parseFile(uri));
	fsWatcher.onDidChange(async uri => await provider.parseFile(uri));
	fsWatcher.onDidDelete(uri => provider.removeFile(uri));

	const vscodeWatcher = vscode.workspace.onDidChangeTextDocument(e => {
		if (e.document.fileName.endsWith('.mgcb')) {
			provider.parseContent(e.document.fileName, e.document.getText());
		}
	});

	const registration = vscode.languages.registerCompletionItemProvider(
		'csharp',
		provider,
		...ContentCompletionItemProvider.triggerCharacters,
	);
	context.subscriptions.push(fsWatcher, vscodeWatcher, registration);
}

async function readAllContentFiles(provider: ContentCompletionItemProvider) {
	const files = await vscode.workspace.findFiles('**/*.mgcb');
	
	for (const file of files) {
		await provider.parseFile(file);
	}
}

export class ContentCompletionItemProvider implements vscode.CompletionItemProvider {
	public static readonly triggerCharacters = ['"', '/', '\\'];

	private readonly _paths = new Map<string, Set<string>>();
	private readonly _contentRegex = /#begin\s+(.+?)\n/g;
	private readonly _completionRegex = /Content\.Load\<.+\>\("([\w\.\/\\]*)/;

	public get pathList() : string[] {
		const allStrings = new Set<string>();
		for (const stringSet of this._paths.values()) {
			for (const str of stringSet) {
				allStrings.add(str);
			}
		}
		return Array.from(allStrings);
	}

	public provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position,
		token: vscode.CancellationToken,
		context: vscode.CompletionContext,
	): vscode.ProviderResult<vscode.CompletionItem[]> {
		const line = document.lineAt(position);
		const result = this._completionRegex.exec(line.text);

		if (result) {
			return this.pathList.map(p => {
				const item = new vscode.CompletionItem(p, vscode.CompletionItemKind.File);
				item.range = new vscode.Range(
					position.line,
					position.character - result[1].length,
					position.line,
					position.character,
				);
				return item;
			});
		}
		return [];
	}

	public async parseFile(uri: vscode.Uri) {
		const doc = await vscode.workspace.fs.readFile(uri);
		this.parseContent(uri.fsPath, new TextDecoder().decode(doc));
	}

	public async parseContent(fileName: string, content: string) {
		if (this._paths.has(fileName)) {
			this._paths.delete(fileName);
		}
		let set = new Set<string>();

		let match;
		while ((match = this._contentRegex.exec(content)) !== null) {
			set.add(match[1]);
		}
		this._paths.set(fileName, set);
	}

	public removeFile(uri: vscode.Uri) {
		this._paths.delete(uri.fsPath);
	}
}
