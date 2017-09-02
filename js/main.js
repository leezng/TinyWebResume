define(function (require, exports, module) {
  require('index');
  require('login');
  require('resume-event');
  var re = require('resume');
  var user = require('user');
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
  

  // 注销操作
  $('#nav .log-in-out').on('click', function () {
    if ($(this).text() == '注销') {
      if (window.confirm('您确认要注销吗？')) {
        $.ajax({
          url: '../admin/logout.php',
          type: 'POST',
          dataType: 'json',
          data: sessionStorage.userId
        }).done(function (res) {
          if (res.success) {
            $('#nav .log-in-out').text('登陆/注销').attr('href', '#login');
            sessionStorage.clear();
            location.reload();
          }
        }).fail(function (error) {
          console.log('error' + error);
        });
      }
    }
  });

  // 更新当前页面
  function updateView(pageId) {
    pageId = location.hash.substring(1) || 'index';
    // if (pageId == 'user' || pageId == 'resume') {
    if (pageId == 'user') {
      var userId = sessionStorage.userId;
      if (!userId) { // 首次验证登录状态
        pageId = location.hash = '#login';
        $('#page-login .lg-message').text('请先登陆');
        return;
      }
      isLogin(userId); // 二次验证
    }
    setActivePage(pageId);
    window.scrollTo(0, 0);
  }

  // Ajax请求确认是否已登录, 防止绕过sessionStorage
  function isLogin(userId) {
    $.ajax({
      url: '../admin/islogin.php',
      type: 'POST',
      dataType: 'json',
      data: JSON.stringify(userId)
    }).done(function (res) {
      if (res.success) {
        refreshUserPage(userId);
        $('#nav .log-in-out').text('注销').removeAttr('href');
      } else {
        pageId = location.hash = '#login';
        $('#page-login .lg-message').text('请先登陆');
      }
    }).fail(function (error) {
      console.log('error' + error);
    });
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