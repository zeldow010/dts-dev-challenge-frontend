const express = require("express");
const bodyParser = require("body-parser");
const { DateTime } = require("luxon");
const app = express();
const port = 4000;

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', async (req, res) => {
    let tasks = await fetch("http://localhost:3000/tasks")
        .then(async res => await res.json());

    tasks.map(t => {
        let dt = DateTime.fromISO(t.due);

        t.due = {
            raw: t.due,
            date: dt.toUTC().toFormat("dd/MM/yyyy"),
            countdown: dt.diffNow().as("days")
        }
    });

    res.render('index', { tasks });
});

app.post('/', async (req, res) => {
    let { body } = req;

    body.due += ":00Z";

    let json_payload = await JSON.stringify(body);

    console.log(`adding new task: ${ json_payload }`)

    let task_id = await fetch("http://localhost:3000/tasks", {
        method: "POST",
        body: json_payload,
        headers: {
            "Content-Type": "application/json"
        }
    }).then(async result => await result.json())
    .catch(err => console.error(err));

    console.log(`got a new task_id: ${task_id}}`);

    return res.redirect(`/tasks/${task_id}`)
})

app.get('/tasks/:task_id', async (req, res) => {
    const { task_id } = req.params;

    let task = await fetch(`http://localhost:3000/tasks/${task_id}`)
        .then(async res => await res.json());

    res.render('task', { task });
});

app.post('/tasks/:task_id/next_status', async (req, res) => {
    const { task_id } = req.params;

    let task = await fetch(`http://localhost:3000/tasks/${task_id}/next_status`,{
        method: "PATCH",
    }).then(async res => await res.json());

    return res.redirect("/");
});

app.post('/tasks/:task_id/delete', async (req, res) => {
    const { task_id } = req.params;

    console.log(`Deleting task: ${task_id}`);

    await fetch(`http://localhost:3000/tasks/${task_id}`, {
        method: "delete"
    });

    return res.redirect("/")
});

app.listen(port, () => {
    console.log(`Example app listening on at http://localhost:${port}`);
})