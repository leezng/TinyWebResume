define(function (require, exports, module) {
  require('index');
  require('resume-event');
  var re = require('resume');
  var Utils = require('utils');

  window.onload = function () {
    setTimeout(function () {
      document.getElementById('loading').style.display = 'none';
    }, 1000);  
  }

  bindEvents();
  updateView();

  $.ajax({
    url: './config-json/main.json',
    type: 'GET',
    dataType: 'json'
  }).done(function (res) {
    var i = 0;
    $.each(res, function (key, value) {    
      $.get('./config-json/' + value + '.json').then(function(res) {
        value == 'new' ? $('#add-module').data('new', res) : re.compileJSON(value, res);
        i++;
      });
    });
    var read = setInterval(function () {
      if (i == res.length) {
        clearInterval(read);
        re.setLocalData();
      }
    }, 500);
  });

  // 更新当前页面
  function updateView(pageId) {
    pageId = location.hash.substring(1) || 'index';
    setActivePage(pageId);
    window.scrollTo(0, 0);
  }

  function refreshUserPage(userId) {
    user.getUserData(userId, 0);
    user.getNumbers(userId);
    $('#page-user .username').text(sessionStorage.username);
  }

  function setActivePage(pageId) {
    $('#page-' + pageId).addClass('page-active').siblings().removeClass('page-active');
    $('body').attr('class', pageId);
  }

  function bindEvents() {
    if ('onhashchange' in window) {
      window.onhashchange = function() {
        updateView();
      };
    }
  }
});