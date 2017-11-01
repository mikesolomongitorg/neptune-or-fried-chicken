'use strict';
const
  express = require('express'),
  exphbs = require('express-handlebars'),
  fileUpload = require('express-fileupload'),
  fs = require("fs"),
  path = require("path"),
  temp_dir = path.join(process.cwd(), 'temp/'),
  pngToJpeg = require('png-to-jpeg'),
  spawn   = require('child_process').spawn;

// create temp directory if it doesn't exist
if (!fs.existsSync(temp_dir)) {
  fs.mkdirSync(temp_dir)
}

var app = express();
app.set('port', process.env.PORT || 5000);

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use(fileUpload());
app.use(express.static(temp_dir))

app.post('/classify', function(req, res) {
  // if no image, error out
  if (req.files.image == {}) {
    return res.status(500).send(err)
  }
  // if this is a png, convert it to jpeg
  if (req.files.image.name.match(/.+\.png/gi)) {
    pngToJpeg({quality: 90})(req.files.image.data)
      .then(function(output) {
        console.log("OUTPUT")
        console.log(output)
        console.log("END OF OUTPUT")
        console.log("image")
        console.log(req.files.image)
        req.files.image.data = output
        //fs.writeFileSync("./some-file.jpeg", output)
        return false
      })
  }
  req.files.image.mv(temp_dir + req.files.image.name, function(err) {
    if (err) {
      return res.status(500).send(err)
    }
    console.log(temp_dir)
    let classification = spawn('python',
                              ['neptune-or-fried-chicken.py',
                              temp_dir + req.files.image.name])

    classification.stdout.on('data', function (data){
      console.log(data)
      console.log(data.toString('utf8'))
      // Do something with the data returned from python script
      let result = JSON.parse(data.toString('utf8'))
      console.log(result)
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
        confidence: confidence,
        image: req.files.image.name
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
