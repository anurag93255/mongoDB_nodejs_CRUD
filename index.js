const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');

const userInfo = require('./model/userinfo.js');

const ejs = require('ejs');

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { updateOne } = require('./model/userinfo.js');
const results = [];

app = express();
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded());

// define storage for multer
const storage = multer.diskStorage({
    destination: function(req,file, cb) {
        const upload_path = 'upload/';
        fs.mkdirSync(upload_path, { recursive: true })
        cb(null, upload_path);
    },
    filename: function(req, file, cb){
        cb(null, Date.now() + file.originalname)
    }
});
// config multer upload
var upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedExt = ['.csv'];
        var ext = path.extname(file.originalname);
        if(!allowedExt.includes(ext)) {
            return cb(new Error('Only ' + allowedExt.toString() + ' are allowed '))
        }
        cb(null, true)   
    },
    limits:{
        fileSize: 1024 * 1024
    }
}).single('upload_csv');


const ID = '';
const PASS = '';
const mgDB = `mongodb+srv://{ID}:{PASS}@myproject1.rt3op.mongodb.net/test-nodejs-mongodb?retryWrites=true&w=majority`;
mongoose.connect(mgDB , {useNewUrlParser: true, useUnifiedTopology: true})
    .then((result) => {
        console.log('MongoDB collection done successfully');
        app.listen(9000);
    }).catch((err) => {
        console.log('Something went wrong. \n Error: ' + err);
    });

// mongoose.set('debug', true);
app.get('/upload', (req, res) => {
    res.render('form', {form_attr: {title: 'Upload csv file'}});
});


app.post('/upload_csv', (req, res) => {
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
          // A Multer error occurred when uploading.
          console.log('Something Went Wrong in uploading');
          res.send('Something Went Wrong in uploading');
          
        } else if (err) {
          // An unknown error occurred when uploading.
          console.log('Something went wrong. Error: \n' + err);
          res.send('Something went wrong. Error: \n' + err);
        } else {
            const fileInfo = req.file;

            fs.createReadStream(fileInfo.path)
                .pipe(csv(['name', 'surname', 'address', 'subaddress', 'state', 'pincode']))
                .on('data', (data) => results.push(data))
                .on('end', () => {
                    // res.send(results);
                    userInfo.insertMany(results, { ordered: true })
                    .then((resolve) => {
                        res.send(results);
                    })
                    .catch(err => {

                        res.send('Error found : \n ' + err);
                    });
                });

            // console.log('file uploaded successfully');
            // res.send(fileInfo);
        }
      })
})


app.get('/get_user_detail', (req, res) => {
    
    userInfo.find()
    .then((result) => {
        // res.send(result);
        // console.info({userDetail: result});
        res.json({userDetail: result});
    }).catch((err) => {
        res.json({});
    });
});

app.get('/', (req, res) => {
    res.render('userinfo_table');
})


app.post('/form-submit', async (req, res) => {
    console.log(req.body);
    const { name, surname, address, subaddress, state, pincode } = req.body;
    const updation_data = {
        name: name,
        surname: surname,
        address: address,
        subaddress: subaddress,
        state: state,
        pincode: pincode
    };
    // console.log(req.body);
    let updateRes;
    if(req.body._id != "") {
        // updateRes = await userInfo.updateOne(
        //     { _id: req.body._id},
        //     {$set: updation_data}
        // );
        updateRes = await userInfo.findOneAndUpdate(
            {_id: req.body._id}, 
            {$set: updation_data},
            { upsert: true, useFindAndModify:false , returnNewDocument: true,new: true,strict: false},
            (err, result) => { 
                if(err) {console.log('Error: \n ' + err)}
                console.log(result);
            }
        );
    } else {
        updateRes = await userInfo(updation_data).save();
    }
    // console.log(updateRes);
    res.send(updateRes);
    
});

app.get('/useerinfo_form/:id?', async (req, res) => {
    let userdetail = {};
    if(req.params.id) {
        userdetail = await userInfo.findById(req.params.id);
    }
    // console.log(userdetail);
    res.render('userinfo_form', {form_attr: {title: 'User Detail'}, form_data: userdetail });
})


app.delete('/delete_user', (req,res) => {
    const id = req.body.id;
    
    userInfo.deleteOne({ _id: id})
    .then((result) => {
        res.send('User info deleted successfully');
    })
    .catch((error) => {
        res.send('Something went wrong\n Error: ' + error);
    });
    
});
