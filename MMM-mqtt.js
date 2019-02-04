'use strict';
/* global Module */

/* Magic Mirror
 * Module: MMM-mqtt
 *
 * By Javier Ayala http://www.javierayala.com/
 * MIT Licensed.
 */

Module.register('MMM-mqtt', {

  defaults: {
    mqttServer: 'mqtt://127.0.0.1',
    mode: 'receive',
    loadingText: '거실 스마트 제어기 연결중...',
    topic: 'liviingroom/status',
    showTitle: false,
    title: 'MQTT Data',
    interval: 300000,
    postText: '',
    roundValue: false,
    decimals: 2
  },

  start: function() {
    Log.info('Starting module: ' + this.name);
    this.loaded = false;
    this.connected = false;
    this.mqttVal = [];
    this.updateMqtt(this);
  },

  updateMqtt: function(self) {
    self.sendSocketNotification('MQTT_SERVER', { mqttServer: self.config.mqttServer, topic: self.config.topic, mode: self.config.mode });
    setTimeout(self.updateMqtt, self.config.interval, self);
  },

  getDom: function() {
    var wrapper = document.createElement('div');

    if (!this.loaded) {
      wrapper.innerHTML = this.config.loadingText;
      wrapper.className = "loading medium";
      return wrapper;
    }
    else {
      if(!this.connected) {
        this.sendNotification('SHOW_ALERT', {title:"알림", message:"스마트제어기가 연결되었습니다", timer:3000});
        this.connected = true;
      }
    }

    if (this.config.showTitle) {
      var titleDiv = document.createElement('div');
      titleDiv.innerHTML = this.config.title;
      titleDiv.className = "title medium";
      wrapper.appendChild(titleDiv);
    }

    var mqttDiv = document.createElement('div');
    mqttDiv.innerHTML = "습도 "
    mqttDiv.innerHTML += this.roundValue(this.mqttVal[0].toString()) + this.config.postText;
    mqttDiv.innerHTML += ""
    mqttDiv.className = "value bright medium light";
    wrapper.appendChild(mqttDiv);

    mqttDiv = document.createElement('div');
    mqttDiv.innerHTML = "온도 "
    mqttDiv.innerHTML += this.roundValue(this.mqttVal[1].toString()) + this.config.postText;
    mqttDiv.innerHTML += ""
    mqttDiv.className = "value bright medium light";
    wrapper.appendChild(mqttDiv);

    mqttDiv = document.createElement('div');
    mqttDiv.innerHTML = ""
    if(this.mqttVal[2]=="1") {
      mqttDiv.className = "value bright medium light";
      mqttDiv.innerHTML += "사람있음";
    }
    else {
      mqttDiv.className = "value medium light dimmed";
      mqttDiv.innerHTML += "사람없음";
    }
    wrapper.appendChild(mqttDiv);

    mqttDiv = document.createElement('div');
    mqttDiv.innerHTML = ""
    if(this.mqttVal[3]=="1") {
      mqttDiv.className = "value bright medium light";
      mqttDiv.innerHTML += "티비켜짐";
    }
    else {
      mqttDiv.className = "value medium light dimmed";
      mqttDiv.innerHTML += "티비꺼짐";
    }
    wrapper.appendChild(mqttDiv);

    return wrapper;
  },

  socketNotificationReceived: function(notification, payload) {

    Log.info(this.name + " received " + notification + "and topic is " + payload.topic);
    if (notification === 'MQTT_DATA' && payload.topic === this.config.topic) {
      this.mqttVal = payload.data.toString().split(" ");
      this.loaded = true;
      this.updateDom();
    }

    if (notification === 'ERROR') {
      this.sendNotification('SHOW_ALERT', payload);
    }
  },

  notificationReceived: function(notification, payload, sender) {
    var self = this;

    if (self.config.mode !== "send") {
      return;
    }

    var topic;
    if (sender) {
      Log.log(this.name + " received a module notification: " + notification + " from sender: " + sender.name + ": ", payload);
      topic = this.config.topic + "/" + sender.name + "/" + notification;
    } else {
      Log.log(this.name + " received a system notification: " + notification + ": ", payload);
      topic = this.config.topic + "/" + notification;
    }

    this.sendSocketNotification("MQTT_SEND", {
      mqttServer: self.config.mqttServer,
      topic: topic,
      payload: payload
    });
  },

  roundValue: function(value) {
    if (this.config.roundValue) {
      value =  parseFloat(value).toFixed(this.config.decimals);
    }

    return value;
  },

  getStyles: function() {
    return ["MMM-mqtt.css"];
  },
});
