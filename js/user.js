define(function (require, exports, module) {
  var Utils = require('utils');

  // 页签切换
  $('#user-tabs').on('click', 'li', function () {
    var userId = sessionStorage.userId;
    $(this).addClass('active').siblings().removeClass('active');
    var flag = $(this).hasClass('js-important') ? 0 : 1;
    getUserData(userId, flag);
  });

  // 触发添加备忘模态框
  $('#box-add').on('click', function () {
    var data = [{
      add: true,
      name: '',
      note: ''
    }];
    $('#task-modal .modal-detail').children('div').remove();
    var tplFnNull = _.template( $('#tpl-modal').html() );
    $('#task-modal .modal-detail').append( tplFnNull(data) );
    $('#task-modal').fadeIn();
  });

  // 模态框控制
  $('#task').on('click', '.box', function () {
    var $modal = $('#task-modal .modal-detail');
    var data = [{
      name: $(this).find('.box-name').text(),
      id: $(this).attr('data-id'),
      note: $(this).attr('note')
    }];
    $modal.children('div').remove();
    var level = $(this).attr('level');
    var tplFnModal = _.template( $('#tpl-modal').html() );
    $modal.append( tplFnModal(data) );
    $modal.find('.form-group').children().prop('readonly', 'true');
    $modal.find('select').prop('disabled', true).find('option[rel=' + level + ']').prop('selected', true);
    $('#task-modal').fadeIn();
  });

  $('#task-modal').on('click', '.js-modal-close', function () {
    $(this).parents('.modal').fadeOut();
  });

  // 保存新添加备忘
  $('#task-modal').on('click', '.js-modal-save', function () {
    var $this = $(this);
    var userId = sessionStorage.userId;
    var data = getModalData();
    $.ajax({
      url: '../admin/useradd.php',
      type: 'post',
      dataType: 'json',
      data: JSON.stringify(data)
    }).done(function (res) {
      if (res.success) {     
        getNumbers(userId); // ajax刷新局部页面
        $('#user-tabs li').eq(data.done).trigger('click');
        $('#task-modal').fadeOut('fast');
      } else {
        Utils.cmptPopUp($this.get(0), 'up', res.msg);
      }
    }).fail(function (error) {
      console.log('error' + error);
    });
  });

  // 监听模态框删除按钮
  $('#task-modal').on('click', '.js-modal-remove', function () {
    var dom = $(this).get(0);
    Utils.cmptRomove(dom, 'up');
  });

  // 确认/取消删除备忘
  $('#task-modal').on('click', '.js-pop-no, .js-pop-yes', function (e) {
    if ($(this).hasClass('js-pop-no')) {
      $('#task-modal .js-modal-remove').trigger('click');
      e.stopPropagation();
    } else {
      var userId = sessionStorage.userId;
      var data = getModalData();
      data.dataId = $('#task-modal').find('.name').attr('data-id');
      $.ajax({
        url: '../admin/userremove.php',
        type: 'post',
        dataType: 'json',
        data: JSON.stringify(data)
      }).done(function (res) {
        getNumbers(userId); // ajax刷新局部页面
        $('#user-tabs li').eq(data.done).trigger('click');
        $('#task-modal').fadeOut();
      }).fail(function (error) {
        console.log('error' + error);
      });
    } 
  });

  // 获取各种数据的数量
  function getNumbers(userId) {
    if (!userId) return;
    $.ajax({
      url: '../admin/usernums.php',
      type: 'post',
      dataType: 'json',
      data: JSON.stringify(userId)
    }).done(function (res) {
      setProcess(res);
    }).fail(function (error) {
      console.log('error' + error);
    });
  }

  // 获取用户备忘录数据
  function getUserData(userId, flag) {
    if (!userId) return;
    var data = {
      id: userId,
      flag: flag
    };
    $.ajax({
      url: '../admin/userdata.php',
      type: 'post',
      dataType: 'json',
      data: JSON.stringify(data)
    }).done(function (res) {
      setTaskBox(res.data);
    }).fail(function (error) {
      console.log('error' + error);
    });
  }

  // 填充Box数据
  function setTaskBox(datas) {
    $('#task').children('div').remove();
    for (var key in datas) {
      var type;
      var level = datas[key].level;
      if (level == 1) {
        type = 'danger';
      } else if (level == 2) {
        type = 'warning';
      } else if (level == 3) {
        type = 'info';
      } else {
        type = 'default';
      }
      datas[key].type = type;
    }
    var tplFnDone = _.template( $('#tpl-task').html() );
    $('#task').append( tplFnDone(datas) );
  }

  // 获取模态框 -> 添加新备忘数据
  function getModalData() {
    $this = $('#task-modal');
    var userId = sessionStorage.userId;
    var data = {
      id: userId,
      name: $this.find('.task-name').val().trim(),
      note: $this.find('.task-note').val().trim(),
      level: $this.find('select option:selected').attr('rel')
    }
    data.done = data.level < 3 ? 0 : 1;
    return data;
  }

  // 绘制环形进度条
  function setProcess(data) {
    var length = $('#overview canvas').length;
    for (var i = 0; i < length;) {
      var dom = $('#overview canvas').eq(i++);
      var nums = data['level' + i];
      var proportion = nums / data.total * 100;
      Utils.makeCircle(dom.attr('id'), 50, proportion);
    }  
  }

  return {
    getUserData: getUserData,
    getNumbers: getNumbers
  };
});