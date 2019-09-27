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
    <h1>${error}</h1>
</body>

</html>
`;
    }
}