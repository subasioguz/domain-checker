const app = require('express')();
const cron = require("node-cron");
const nodemailer = require("nodemailer");
const https = require('https');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;
const dotenv = require('dotenv')
dotenv.config()

const domains = ['google.com', 'facebook.com'];

const myFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
});

const logger = createLogger({
        format: combine(
        timestamp(),
        myFormat
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'logs/messages.log' })
    ]
});

cron.schedule("* * */3 * *", function() {
    
    // init
    console.log("checking domains..."); 

    // each
    domains.forEach(async function(domain){
        await https.get('https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey='+ process.env.API_KEY +'&domainName='+domain +'&outputFormat=json&da=1', function(response) {
            var str = '';
            response.on('data', function(chunk) { str += chunk; });
            response.on('end', function() { 
                var json = JSON.parse(str);
                if(json.WhoisRecord.domainAvailability == "AVAILABLE"){
                    logger.info(domain + ' AVAILABLE');
                    sendMail(domain);
                }else{
                    logger.info(domain + ' UNAVAILABLE');
                }
            });
        })  
        .on('error', (e) => {
            console.error("error",e);
        });
    });
});

function sendMail(domain) { 
    let mailTransporter = nodemailer.createTransport({ 
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        secure: process.env.MAIL_SECURE,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
    }); 
      
    // Setting credentials 
    let mailDetails = { 
        from: process.env.MAIL_FROM, 
        to: process.env.MAIL_TO, 
        subject: domain + " Domain Alıma Uygun ",
        text: domain + " domaini alıma uygundur. Hemen alın: https://tr.godaddy.com/whois/results.aspx?domain="+ domain
    }; 
      
    // Sending Email 
    mailTransporter.sendMail(mailDetails, function(err, data) { 
        if (err) { 
            console.log("Error Occurs", err); 
        } else { 
            console.log("Email sent successfully"); 
        } 
    }); 
} 

const port = 3000;
const server = app.listen(process.env.PORT || port, function(){
    console.log("Express server listening...");
});