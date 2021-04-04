const mqtt = require('mqtt')
const TelegramBot = require('node-telegram-bot-api');

const constants = require('./scripts/vars.js')

const bot = new TelegramBot(constants.TOKEN, {polling: true});

const client  = mqtt.connect(constants.MQTT_SERVER)
let status = 'DISARMED';
let battery = '-';
let lastNotification;
 
client.on('connect', function () {
    client.subscribe(constants.MOTION_SENSOR)
})
 
client.on('message', function (topic, message) {
  // message is Buffer
  if (topic === constants.MOTION_SENSOR) {
      console.log('motion detected')
      const msg = JSON.parse(message)
      if (msg && msg.occupancy === true && validateLastNotification() && status === 'ARMED') {
        sendNotification(constants.MOTION_DETECTED)
      }
      if (msg && msg.battery) {
        battery = msg.battery;
      }
  }
})

bot.onText(/^last$/i, (msg, match) => {
    const chatId = msg.chat.id;
    let resp;
    if (lastNotification) {
        resp = lastNotification.toString()
    } else {
        resp = 'No detections registered'
    }
    bot.sendMessage(chatId, resp);
  });

const sendNotification = (msg) => {
    lastNotification = new Date()
    constants.MY_CHATS.forEach(chatId => {
        bot.sendMessage(chatId, msg);
    })
}

const validateLastNotification = () => {
    if (!lastNotification) {
        return true
    } else {
        const now = new Date()
        const untilDate = new Date()
        untilDate.setTime(lastNotification.getTime() + constants.NOTIFICATION_MARGIN)
        return untilDate < now
    }
}

bot.onText(/^register$/i, (msg, match) => {
    const chatId = msg.chat.id;
    if (!MY_CHATS.includes(chatId)) {
        MY_CHATS.push(chatId)
    }
    bot.sendMessage(chatId, 'Registered successfully!');
});

bot.onText(/^status$/i, (msg, match) => {
    const chatId = msg.chat.id;
    let rsp;
    if (status === 'ARMED') {
        rsp = 'ALARM IS ARMED'
    } else if (status === 'DISARMED') {
        rsp = 'ALARM IS DISARMED'
    }
    bot.sendMessage(chatId, rsp);
});

bot.onText(/^arm$/i, (msg, match) => {
    const chatId = msg.chat.id;
    status = 'ARMED'
    bot.sendMessage(chatId, 'ALARM ARMED');
});

bot.onText(/^disarm$/i, (msg, match) => {
    const chatId = msg.chat.id;
    status = 'DISARMED'
    bot.sendMessage(chatId, 'ALARM DISARMED');
});

bot.onText(/^chatid$/i, (msg, match) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, chatId);
});

bot.onText(/^battery$/i, (msg, match) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, battery);
});

bot.onText(/^help$/i, (msg, match) => {
    const chatId = msg.chat.id;

    let rsp = '';
    rsp += '*ARM:* arm alarm system\n' 
    rsp += '*BATTERY:* returns sensor battery\n'
    rsp += '*CHATID:* returns chat id\n'
    rsp += '*DISARM:* disarm alarm system\n'
    rsp += '*LAST:* last motion event\n'
    rsp += '*REGISTER:* subscribes to notifications\n'
    rsp += '*STATUS:* status of alarm system\n'

    bot.sendMessage(chatId, rsp);
});