export abstract class AbstractWebView {

    protected fallBack(error: string, errorTitle = error) {
        return `
        <!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${errorTitle}</title>
</head>

<body>
    <h2><i style="color:red; margin-top:30%">${error}</i></h1>
</body>

</html>
`;
    }

    public getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

}