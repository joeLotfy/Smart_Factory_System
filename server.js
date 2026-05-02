/*************************************************
    * server.js
    * - Connects to MQTT broker
    * - Saves all sensors data to MongoDB
    * - Serves a web dashboard and a note writing page for reports
    * open a terminal here in vs code and type "node server.js"
    * you have to change the MQTT_BROKER var to YOUR IP
*************************************************/
const express = require('express');         // Web server
const mqtt = require('mqtt');               // MQTT client
const mongoose = require('mongoose');       // MongoDB ODM
const session = require('express-session'); //express sessions for login
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());                  //allows JSON body
app.use(express.urlencoded({ extended:true }));

app.use(session({                     //create a login session for each user
    secret: 'smart-factory-secret',
    resave: false,
    saveUninitialized: false
}));

let dbConnected = false;                  // store connection status

/************ MQTT CONFIG ************/
const MQTT_BROKER = 'mqtt://127.0.0.1';        //local IP of the laptop on my wifi (you can find your IP by typing ipconfig in windows command line or powershell) and if you change your wifi connectio you have to get your new IP
const TEMP_TOPIC = 'graduationProject/dht11/temperature';     //MQTT topics to subscribe to
const HUM_TOPIC  = 'graduationProject/dht11/humidity';
const MOTION_TOPIC = 'graduationProject/pir/motion';
const GAS_TOPIC = 'graduationProject/mq2/gas';

/************ MONGODB CONFIG ************/
mongoose.connect('mongodb://127.0.0.1:27017/graduation_project')        //tells mongoose to connect to IP/port/database name
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error(err));

/************* LIVE DATA *****************/               //classes to serve to the live dashboard
//liveData class for dht11 data
let liveData = {
    temperature: null,
    humidity: null,
    timestamp: null
};

//livePir class for PIR data
let livePir={
    motion: 0,
    timestamp: null
};

//liveMQ2 class for MQ-2 data
let liveMQ2 = {
    value: null,
    status: 'normal',
    timestamp: null
};

//JSON schemas
/************ DATABASE SCHEMAs ************/   //(for mongoDB)
/************ DHT SCHEMA ******************/
const DHTSchema = new mongoose.Schema({     //mongoose is a library of mongoDB
  temperature: Number,
  humidity: Number,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

/****************** PIR SCHEMA **************/
//events are only stored when it happens      //WHY?!!!!! WE NEED REAL TIME-SERIES ANALYSIS!!!    // dw fixed it
const PIRSchema = new mongoose.Schema({
    motion: Boolean,
    timestamp: {
        type: Date,
        default: Date.now
    }
});

/**************** MQ-2 SCHEMA ***********/
const MQ2Schema = new mongoose.Schema({
    value: Number,
    status: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
});

/*************** USER SCHEMA **************/
const UserSchema = new mongoose.Schema({
    username: String,
    password: String
});

/************* REPORT SCHEMA **************/
const ReportSchema = new mongoose.Schema({
  date: String,       //YY-MM-DD
  username: String,
  entries: [
    {
      text: String,
      time: String
    }
  ]
});

const UserModel = mongoose.model('users', UserSchema); 
const PIRModel = mongoose.model('pir_events', PIRSchema);
const DHTModel = mongoose.model('dht11_readings', DHTSchema);
const MQ2Model = mongoose.model('mq2_readings', MQ2Schema);
const ReportModel = mongoose.model('daily_reports', ReportSchema);

/************ MQTT CLIENT ************/
const mqttClient = mqtt.connect(MQTT_BROKER);         //mqtt connect

let latestTemp = null;
let latestHum = null;

/***************** MQTT Connect ***************/
mqttClient.on('connect', () => {
    console.log('✅ Connected to MQTT broker');

    mqttClient.subscribe([TEMP_TOPIC, HUM_TOPIC]);        //subscribe to dht11 topics
    mqttClient.subscribe(MOTION_TOPIC);                   //subscribe to PIR motion topic
    mqttClient.subscribe(GAS_TOPIC);                      //subscribe to MQ2 Gas detector
});

/************ HANDLE INCOMING MQTT MESSAGES ************/
mqttClient.on('message', async (topic, message) => {
  const value = parseFloat(message.toString());

  /**************** PIR ***********************/
  if (topic === MOTION_TOPIC) {
    const motion = parseInt(message.toString());

    livePir.motion = motion;
    livePir.timestamp = new Date();

    console.log('🚨 PIR Motion:', motion);

    // Save ONLY when motion detected
    //if (motion === 1) {       //this makes it recored PIR in DB only when there is motion(bad)
      
      const pirReading = new PIRModel({
      motion: motion,
      timestamp: new Date()
      });

      await pirReading.save();
    //}
  }

  /************* DHT11 ****************/
  if (topic === TEMP_TOPIC) {
    liveData.temperature = value;
  }

  if (topic === HUM_TOPIC) {
    liveData.humidity = value;
  }

  // Update timestamp only when both values exist
  if (liveData.temperature !== null && liveData.humidity !== null) {
    liveData.timestamp = new Date();

    // Save to MongoDB (background)
    try {
      const reading = new DHTModel({
        temperature: liveData.temperature,
        humidity: liveData.humidity
      });
      await reading.save();
    } catch (err) {
      console.error('DB error:', err);
    }
  }

  //MQ-2 handler
  if (topic === GAS_TOPIC){
    const gasValue = parseInt(message.toString());

    liveMQ2.value = gasValue;
    liveMQ2.timestamp = new Date();

    //threshold (adjust later (msh lazem) )
    liveMQ2.status = gasValue > 1800 ? 'alert' : 'normal';

    console.log('🔥 MQ-2: ', gasValue);
    const mq2Reading = new MQ2Model({
    value: gasValue,
    timestamp: new Date()
    });

    await mq2Reading.save();
  }
});


/************ SERVE STATIC WEB PAGE ************/
app.use(express.static(path.join(__dirname, 'public')));      //this tells the server that any page that the browser asks search for it in /public

/************ API: GET LATEST DATA ************/
//********** here I expose API endpoints *********//
app.get('/api/latest', async (req, res) => {
  const data = await DHTModel.findOne().sort({ timestamp: -1 });
  res.json(data);
});

/************ API: GET HISTORY ************/
app.get('/api/history', async (req, res) => {
  const data = await DHTModel.find().sort({ timestamp: -1 }).limit(50);
  res.json(data);
});

app.get('/api/history/pir', async(req, res) =>{
  const data = await PIRModel.find().sort({ timestamp: -1 }).limit(50);
  res.json(data);
});

app.get('/api/history/mq2', async(req, res) =>{
  const data = await MQ2Model.find().sort({ timestamp: -1 }).limit(50);
  res.json(data);
});

/************** APIs **************/
//dht api
app.get('/api/live', (req, res) => {    //note: liveData is stored in memory for fast live streaming of data
  res.json(liveData);
});

//pir api
app.get('/api/pir/live', (req, res) => {
  res.json(livePir);
});

//MQ-2 API
app.get('/api/mq2/live', (req, res) =>{
  res.json(liveMQ2);
});

app.get('/api/analytics/kpis', async (req, res) => {    //  KPI stands for key performance indicators

  if (!req.session.loggedIn) {
    return res.status(401).json({ success: false });
  }

  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    /* ---------------- MAX TEMPERATURE ---------------- */
    const maxTempDoc = await DHTModel.findOne({
      timestamp: { $gte: startDate, $lte: endDate }
    }).sort({ temperature: -1 });

    /* ---------------- MAX GAS ---------------- */
    const maxGasDoc = await MQ2Model.findOne({
      timestamp: { $gte: startDate, $lte: endDate }
    }).sort({ value: -1 });

    /* ---------------- MOTION COUNT ---------------- */
    const pirDocs = await PIRModel.find({
      timestamp: { $gte: startDate, $lte: endDate }
    }).sort({ timestamp: 1 });

    let motionCount = 0;
    let previousState = false;

    pirDocs.forEach(doc => {
      if (!previousState && doc.motion === true) {
        motionCount++; // count false → true transition
      }
      previousState = doc.motion;
    });

    res.json({
      maxTemp: maxTempDoc
        ? {
            value: maxTempDoc.temperature,
            date: maxTempDoc.timestamp
          }
        : null,

      maxGas: maxGasDoc
        ? {
            value: maxGasDoc.value,
            date: maxGasDoc.timestamp
          }
        : null,

      motionTotal: motionCount,
      aggregationStartDate: startDate
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});


app.get('/api/analytics/monthly', async (req, res) => {       // for first chart (temp & humid for last available 30 days)

  if (!req.session.loggedIn) {
    return res.status(401).json({ success: false });
  }

  try {
    // Last 30 days from NOW
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    const data = await DHTModel.aggregate([
      {
        $match: {
          timestamp: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$timestamp" },
            month: { $month: "$timestamp" },
            day: { $dayOfMonth: "$timestamp" }
          },
          avgTemp: { $avg: "$temperature" },
          avgHum: { $avg: "$humidity" }
        }
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1
        }
      }
    ]);

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

app.get('/api/analytics/mq2', async (req, res) => {
  console.log("MQ2 collection count:",
    await MQ2Model.countDocuments()
  );

  if (!req.session.loggedIn) {
    return res.status(401).json({ success: false });
  }

  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    const data = await MQ2Model.aggregate([
      {
        $match: {
          timestamp: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$timestamp" },
            month: { $month: "$timestamp" },
            day: { $dayOfMonth: "$timestamp" }
          },
          avgGas: { $avg: "$value" },
          maxGas: { $max: "$value" } // ✅ detect spike
        }
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1
        }
      }
    ]);

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

//Save Report Entry API
app.post('/api/reports/add', async (req, res) => {
  console.log('📩 Report request body:', req.body);

  if (!req.session.loggedIn) {            //Authentication check
    console.log('❌ Not logged in');
    return res.status(401).json({ success: false });
  }

  const text = req.body.text;
  const username = req.session.username;

  if (!text) {
    console.log('❌ Empty text');
    return res.json({ success: false });
  }

  const today = new Date().toISOString().split('T')[0];
  const timeNow = new Date().toLocaleTimeString();

  try {
    let report = await ReportModel.findOne({ date: today, username });      //find or create today’s report

    if (!report) {
      report = new ReportModel({
        date: today,
        username,
        entries: []
      });
    }

    report.entries.push({             //append entry (not overwrite)
      text,
      time: timeNow
    });

    await report.save();          //save to mongodb

    console.log('✅ Report saved');
    res.json({ success: true });

  } catch (err) {
    console.error('❌ Report save error:', err);
    res.status(500).json({ success: false });
  }
});

//get today's notes
app.get('/api/reports/today', async (req, res) => {
  if (!req.session.loggedIn) {
    return res.status(401).json({ success: false });
  }

  const today = new Date().toISOString().split('T')[0];   //new day behaviour
  const username = req.session.username;

  const report = await ReportModel.findOne({ date: today, username }); //only from today and from this session's username

  res.json(report || { entries: [] });
});

//delete a single entry using _id
app.delete('/api/reports/delete/:entryId', async (req, res) => {
  if (!req.session.loggedIn) {
    return res.status(401).json({ success: false });
  }

  const today = new Date().toISOString().split('T')[0];
  const username = req.session.username;
  const entryId = req.params.entryId;

  try {
    await ReportModel.updateOne(
      { date: today, username },
      { $pull: { entries: { _id: entryId } } }
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ success: false });
  }
});

//login route
app.post('/login', async (req, res) =>{       //session created only after a valid login
    const{ username, password } = req.body;             //get login credentials from request body
    try{
        const user = await UserModel.findOne({ username, password });   //look for a user with matching credentials

        if(user){
            req.session.loggedIn = true;
            req.session.username = username;    //saves username for the session

            res.json({success : true});
        } else {
            //invalid username or password
            res.json({success : false});
        }
    } catch (err){
        //server or database error
        console.error('Login error: ', err);
        res.status(500).json({ success: false });
    }
});

//logout route
app.get('/logout', (req, res) =>{
    req.session.destroy(() => {     //destroy session
        res.redirect('/');          //resirect to homepage (login page)
    });
});

/************** PAGES ROUTES ****************/
//LOGIN PAGE
app.get('/', (req, res) => {          //so that it doesn't show /index.html in URL
  res.sendFile(__dirname + '/public/index.html');
});

//DASHBOARD PAGE
app.get('/dashboard', (req, res) =>{      //so that it shows /dashboard + only load dashboard if logged in
    if (req.session.loggedIn){
        res.sendFile(__dirname + '/public/dashboard.html');
    } else {
        res.redirect('/');
    }
});

//REPORTS PAGE
app.get('/reports', (req, res)=>{
  if (req.session.loggedIn) {           //protect /reports just like /dashboard
    res.sendFile(__dirname + '/public/reports.html');
  } else {
    res.redirect('/');
  }
});

app.get('/analytics', (req, res) => {
  if (req.session.loggedIn) {
    res.sendFile(__dirname + '/public/analytics.html');
  } else {
    res.redirect('/');
  }
});

/************ START SERVER ************/
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Server running at http://localhost:${PORT}`);
});