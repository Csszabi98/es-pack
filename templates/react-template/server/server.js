const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(process.cwd(), 'dist')));
app.use(express.static(path.join(process.cwd())));

app.get('*', function (req, res) {
    res.sendFile(path.join(process.cwd(), 'build', 'index.html'));
});

app.listen(8080, () => {
    console.log(`Server started on http://localhost:${8080}`);
});
