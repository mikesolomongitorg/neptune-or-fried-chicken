const
  express = require('express'),
  exphbs = require('express-handlebars'),
  fileUpload = require('express-fileupload'),
  spawn   = require('child_process').spawn;

var app = express();
app.set('port', process.env.PORT || 5000);

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use(fileUpload());
app.use(express.static('public'))

app.post('/classify', function(req, res) {

  req.files.image.mv('public/temp.jpg', function(err) {
    if (err) {
      return res.status(500).send(err)
    }

    let classification = spawn('python',
                              ['neptune-or-fried-chicken.py',
                              'public/temp.jpg'])

    classification.stdout.on('data', function (data){
      // Do something with the data returned from python script
      let result = JSON.parse(data)
      let answer,
          confidence;

      if (result["neptune"] >= .8) {

        answer = "neptune"
        confidence = result["neptune"]

      } else if (result["fried chicken"] >= .8) {

        answer = "fried chicken"
        confidence = result["fried chicken"]

      } else {
        answer = "neither"
        // confidence is the average of 1 - confidence of each result
        confidence = ((1 - result["neptune"]) + (1 - result["fried chicken"])) / 2
      }

      res.render('index', {
        answer: answer,
        confidence: confidence
      })

    });

  })

})

app.get('/', function(req, res) {
  res.render('index')
})

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
module.exports = app;
