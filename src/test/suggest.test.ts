import * as assert from 'assert';
import * as vscode from 'vscode';
import { ContentCompletionItemProvider } from '../suggest';

suite('Content Completion Provider Test Suite', () => {
	let provider: ContentCompletionItemProvider;

	suiteSetup(async () => {
		provider = new ContentCompletionItemProvider();

		const testContent = `
#begin texture.png
#begin sound.wav
#begin fonts/main.ttf
`;

		await provider.parseContent('test.mgcb', testContent);
	});

	test('should parse MGCB content correctly', () => {
		const paths = provider.pathList;
		assert.strictEqual(paths.length, 3);
		assert.ok(paths.includes('texture.png'));
		assert.ok(paths.includes('sound.wav'));
		assert.ok(paths.includes('fonts/main.ttf'));
	});

	test('should provide completion items', async () => {
		const documentMock = await vscode.workspace.openTextDocument({
			content: 'var texture = Content.Load<Texture2D>("tex',
		});
		const position = new vscode.Position(0, 40);
		const token = new vscode.CancellationTokenSource().token;

		const items = await provider.provideCompletionItems(documentMock, position, token, {
			triggerKind: vscode.CompletionTriggerKind.TriggerCharacter,
			triggerCharacter: '"',
		});

		assert.ok(Array.isArray(items));
		assert.ok(items!.length > 0);
	});

	test('should not provide completion for non-matching context', async () => {
		const documentMock = await vscode.workspace.openTextDocument({
			content: 'var x = 5;',
		});
		const position = new vscode.Position(0, 8);
		const token = new vscode.CancellationTokenSource().token;

		const items = await provider.provideCompletionItems(documentMock, position, token, {
			triggerKind: vscode.CompletionTriggerKind.TriggerCharacter,
			triggerCharacter: '"',
		});

		assert.strictEqual(items!.length, 0);
	});
});
