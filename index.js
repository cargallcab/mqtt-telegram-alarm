const mqtt = require('mqtt')
const TelegramBot = require('node-telegram-bot-api');

const constants = require('./scripts/vars.js')

const bot = new TelegramBot(constants.TOKEN, {polling: true});

const client  = mqtt.connect(constants.MQTT_SERVER)
let status = 'DISARMED';
let battery = '-';
const messages = [];
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

bot.on('message', function (message) {
    // message is Buffer
    messages.push(message.message_id)
});

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
        rsp = 'Alarm is ARMED'
    } else if (status === 'DISARMED') {
        rsp = 'Alarm is DISARMED'
    }
    bot.sendMessage(chatId, rsp);
});

bot.onText(/^arm$/i, (msg, match) => {
    const chatId = msg.chat.id;
    status = 'ARMED'
    bot.sendMessage(chatId, 'Alarm is now ARMED');
});

bot.onText(/^disarm$/i, (msg, match) => {
    const chatId = msg.chat.id;
    status = 'DISARMED'
    bot.sendMessage(chatId, 'Alarm is now DISARMED');
});

bot.onText(/^chatid$/i, (msg, match) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, chatId);
});

bot.onText(/^battery$/i, (msg, match) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, battery);
});

bot.onText(/^clear$/i, (msg, match) => {
    const chatId = msg.chat.id;
    deleteChat(chatId);
});

bot.onText(/^clearall$/i, (msg, match) => {
    const chatId = msg.chat.id;
    deleteAllChat(chatId);
});

bot.onText(/^messages$/i, (msg, match) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, JSON.stringify(messages));
});

bot.onText(/^help$/i, (msg, match) => {
    const chatId = msg.chat.id;

    let rsp =   '*ARM:*`             arm alarm system`\n' +
                '*BATTERY:*`    return sensor battery`\n' +
                '*CHATID:*`            return chat id`\n' +
                '*DISARM:*`       disarm alarm system`\n' +
                '*LAST:*`      last motion event date`\n' +
                '*REGISTER:*`   subs to notifications`\n' +
                '*STATUS:*`    status of alarm system`\n';

    bot.sendMessage(chatId, rsp, {parse_mode : 'Markdown'});
});
