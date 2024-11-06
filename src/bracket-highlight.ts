import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    let activeEditor = vscode.window.activeTextEditor;

    const decorations = [
        vscode.window.createTextEditorDecorationType({ color: 'yellow' }),
        vscode.window.createTextEditorDecorationType({ color: 'blue' }),
        vscode.window.createTextEditorDecorationType({ color: 'purple' }),
    ];

    if (activeEditor) decorate();

    let timeout: NodeJS.Timeout | undefined = undefined;
    function triggerDecorate(throttle = false) {
        if (timeout) {
            clearTimeout(timeout);
            timeout = undefined;
        }
        if (throttle) timeout = setTimeout(decorate, 200);
        else decorate();
    }

    function decorate() {
        if (!activeEditor) return;
        const document = activeEditor.document;
        const text = document.getText();
        let openBracketsStack: Array<number> = [];
        const bracketsDecoration: Array<Array<vscode.DecorationOptions>> = [];
        for (let i = 0; i < decorations.length; i++) 
            bracketsDecoration[i] = [];

        let curLevel = 0;
        for (let i = 0; i < text.length; i++) {
            if (text[i] === '<') {
                openBracketsStack.push(i);
                curLevel++;
            } else if (text[i] === '>') {
                const lastOpenBracket = openBracketsStack.pop();
                if (lastOpenBracket) {
                    bracketsDecoration[curLevel % decorations.length].push({
                        range: new vscode.Range(
                            document.positionAt(lastOpenBracket),
                            document.positionAt(lastOpenBracket + 1),
                        )
                    });
                    bracketsDecoration[curLevel % decorations.length].push({
                        range: new vscode.Range(
                            document.positionAt(i),
                            document.positionAt(i + 1),
                        )
                    });
                    curLevel--;
                }
            } else if (text[i] === ')' || text[i] === '}' ) {
                curLevel = 0;
                openBracketsStack = [];
            }
        }
        for (let i = 0; i < decorations.length; i++) 
            activeEditor.setDecorations(decorations[i], bracketsDecoration[i]);
    }

    vscode.window.onDidChangeActiveTextEditor(editor => {
        activeEditor = editor;
        if (editor) triggerDecorate();
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document) {
            triggerDecorate(true);
        }
    }, null, context.subscriptions);
}