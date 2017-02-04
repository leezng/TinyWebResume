define(function (require, exports, module) {
  var Utils = require('utils');
  var re = require('resume');

  // 调取右侧配置栏
  $('#re-sidebar').on('click', 'li:not(:last-child)', function () {
    var name = $(this).attr('name');
    var title = $(this).text();
    var $cfgId = $('#' + name + '-config');
    $('#re-config .header h5').text(title);
    $('#re-config .pop-body').hide();
    $cfgId.find('[name = header] input').val(title);
    $('.re-config .header, .re-config .footer').fadeIn();
    $cfgId.fadeIn().siblings().hide();
  });

  // 用户新增自定义板块
  $('#add-module').on('click', function () {
    var counter = $('#re-sidebar li').length - 5; // 获取当前是第几个新增板块
    var name = 'new' + counter;
    var header = '未命名';
    re.addNewModule(name, header);
  });

  // 引用模板
  $('#do-module').on('click', function () {
    $('#modal-module').fadeIn();
  });
  $('#modal-module').on('click', 'li[name]', function () {
    $(this).addClass('active').siblings().removeClass('active');
  });
  $('#modal-module').on('click', '.cancel-module', function () {
    $('#modal-module').fadeOut().find('li').removeClass('active');
  });
  $('#modal-module').on('click', '.confirm-module', function () {
    if (window.confirm('使用模板将会清空当前简历界面哦')) {
      var name = $('#modal-module').find('.active').attr('name');
      $.ajax({
        url: './' + name + '.json',
        type: 'get',
        dataType: 'json'
      }).done(function (res) {
        re.clear();
        re.setConfig(res);
        re.save();
        $('#modal-module .cancel-module').trigger('click');
      }).fail(function (error) {
        console.log('error' + error);
      });
    }
  });

  // 上移与下移操作
  $('#re-config').on('click', '.js-shift-up, .js-shift-down', function() {
    if ($('#re-config').hasClass('exchanging')) return;
    var thisName = $('#re-config').find('.js-config-li:visible').attr('id').slice(0, -7);
    var $prev = $('.re-' + thisName).prev();
    var $next = $('.re-' + thisName).next();
    if ($(this).hasClass('js-shift-up') && $prev.length !== 0) {
      $('#re-config').addClass('exchanging');
      var prevName = $prev.attr('class').substr(10);
      re.exchangeRebox(thisName, prevName);
    } else if ($(this).hasClass('js-shift-down') && $next.length !== 0) {
      $('#re-config').addClass('exchanging');
      var nextName = $next.attr('class').substr(10);
      re.exchangeRebox(thisName, nextName, true);
    }
  });

  // 监听删除操作
  $('#re-config').on('click', '.js-remove', function() {
    var dom = $(this).get(0);
    Utils.cmptRomove(dom, 'down'); 
  });

  // 确认/取消删除
  $('#re-config').on('click', '.js-pop-no, .js-pop-yes', function (e) {
    if ($(this).hasClass('js-pop-no')) {
      $(this).parent('.pop-body').slideUp();
      e.stopPropagation();
    } else {
      var thisName = $('#re-config').find('.js-config-li:visible').attr('id').slice(0, -7);
      var $this = $('#' + thisName + '-config');
      var thisSort = $this.attr('sort');
      $('.js-config-li').each(function() {
        var sort = $(this).attr('sort');
        if (sort > thisSort)
          $(this).attr('sort', --sort);
      });
      $('.re-' + thisName).remove();
      $this.removeAttr('sort').find('input, textarea').val('');
      $this.find('select').each(function () {
        $(this).children('option:first').prop('selected',true).trigger('change');
      });
      $this.find('.can-add-group').children(':gt(0)').remove();
      if (thisName.slice(0, 3) == 'new') {
        $this.remove();
        $('#re-sidebar li[name=' + thisName + ']').remove();
      }
      $(this).parent('.pop-body').slideUp();
      re.save();
    }
  });

  // 放大/缩小
  $('#zoomIn, #zoomOut').on('click', function () {
    var zoom = parseInt($('.zoom-in-out').attr('zoom'));
    zoom = $(this).attr('id') == 'zoomIn' ? zoom + 20 : zoom - 20;
    if (zoom > 200 || zoom < 40) return;
    if (zoom == 200 || zoom == 40) $(this).attr('disabled', true);
    $('.js-re-resume').css('transform', 'scale(' + zoom / 100 + ')');
    $('.zoom-in-out').attr('zoom', zoom + '%');
    $(this).siblings().removeAttr('disabled');
  });

  // 上传相片
  $('.js-re-resume').on('change', '.user-photo input', function () {
    var file = this.files[0];
    if(window.FileReader) {
      if(!/image\/\w+/.test(file.type)){ 
        alert("文件必须为图片！");
        return false; 
      }
      var fr = new FileReader();
      fr.readAsDataURL(file);
      fr.onload = function(e) {
        $('.js-re-resume .user-photo img').attr('src', this.result);
      }
    } else {
      console.log('Error');
    }
  });

  // 上传JSON操作
  $('#uploadJson input').on('click', function () {
    $(this).val('');
  });
  $('#uploadJson input').on('change', function () {
    var file = this.files[0];
    if(window.FileReader) {
      var fr = new FileReader();
      fr.onloadend = function(e) {
        var userConfig = this.result;
        re.setConfig(JSON.parse(userConfig)); // 写入右侧配置栏
        re.save();
      };
      fr.readAsText(file);
    } else {
      console.log('Error'); // 不支持FileReader的情况
    }
  });

  // 下载JSON操作
  $('#downloadJson').on('click', function () {
    var content = re.getConfig();
    var fileName = 'data.json';
    this.download = fileName;
    this.href = "data:text/javascript," + JSON.stringify(content);
  });

  // 打印操作
  $('#do-print').on('click', function() {
    window.print();
  });

  // 清空操作
  $('#do-clear').on('click', function() {
    if (window.confirm('清空将会清除所有本地信息哦')) {
      re.clear();
    }
  });

  // 监听配置确认/取消并生效
  $('#re-config').on('click', '.js-config-ok, .js-config-cancel', function () {
    var cfgId = $('#re-config').find('.body > li:visible').attr('id');
    var $cfgId = $('#' + cfgId);
    var name = cfgId.substr(0, cfgId.length - 7);
    var box = $cfgId.attr('box');
    if ($(this).hasClass('js-config-ok')) {
      var children = $('#layout' + box).children().length;
      if (!$cfgId.attr('sort') && name != 'basic') $cfgId.attr('sort', children);
      if (name != 'basic') {
        var data = re.getCompile(name);
        var html = re.switchResume(name, data);
        re.setResume(name, data, html);
      }  
      re.save();
    } else {
      re.cancel(cfgId);   
    }
  });

  // 监听添加到盒子变化
  $('#re-config').on('change', '[name=select-box] select', function () {
    var box = $(this).parents('.js-config-li').attr('box');
    var thisSort = $(this).parents('.js-config-li').attr('sort');
    $(this).parents('.js-config-li').attr('box', $(this).val());
    if (!thisSort || $(this).val() == box) return;
    var $newBox = $('#layout' + $(this).val());
    var $oldBox = $('#layout' + $(this).children(':selected').siblings().attr('value'));
    var name = $(this).parents('.js-config-li').attr('id').slice(0, -7);   
    $('.js-config-li[box=' + box + ']').each(function() {
      var sort = $(this).attr('sort');
      if (sort > thisSort)
        $(this).attr('sort', --sort);
    });
    $newBox.append($('.re-' + name));
    $oldBox.find('.re-' + name).remove();
    $(this).parents('.js-config-li').attr('sort', --$newBox.children().length);
  });

  // 用户追加配置项目
  $('#re-config').on('click', '.can-add-group .can-add', function () {
    var $parent = $(this).parents('.js-config-li');
    var $dom = $parent.find('.icon:last').parents('.form-group').clone();
    var name = $dom.attr('name');
    var index = name.lastIndexOf('-'); // 查找'-'位置
    var nums = +name.substr(++index) + 1;
    $dom.attr('name', name.slice(0, index) + nums).find('input, textarea').val('');
    $parent.find('.icon:last').parents('.form-group').after($dom);
  });

  // 用户删除已追加的配置项目
  $('#re-config').on('click', '.can-add-group .can-remove', function () {
    var $dom = $(this).parents('.form-group');
    var name = $dom.attr('name');
    var index = name.lastIndexOf('-'); // 查找'-'位置
    var pre = name.slice(0, index); // 不带有后缀'-*'的name
    $dom.nextAll('[name*=' + pre + ']').each(function () {
      var thisName = $(this).attr('name');
      var nums = +thisName.substr(index + 1) - 1;
      $(this).attr('name', pre + '-' + nums);
    });
    $dom.remove();
  });

  // 监听页边距
  $('#re-config').on('change', '#basic-general input', function () {
    var topBottom = $('#basic-general [value = top-bottom] input').val() || 0;
    var leftRight = $('#basic-general [value = left-right] input').val() || 0;
    var fontSize = $('#basic-general [value = font-size] input').val() || 14;
    var padding = topBottom + 'px ' + leftRight + 'px';
    $('.js-re-resume').css({
      'padding': padding,
      'font-size': fontSize + 'px'
    });
  });

  // 监听页面布局
  $('#re-config').on('change', '#basic-general [value=layout] select', function () {
    var value = $(this).find('option:selected').attr('value').substr(0, 1);
    if (value == '0') {
      $('[name=select-box]').hide().children('select').val('One').trigger('change');
    } else {
      $('[name=select-box]').show();
    }
    re.changeLayout(value);
  });

  // 监听分点符号
  $('#re-config').on('change', '#basic-general [value=symbol] select', function () {
    $('.js-re-resume').attr('symbol', $(this).val());
  });

  // 监听色调
  $('#re-config').on('change', '#basic-title [value=color] input, #basic-title [value=fr-color] input' , function() {
    var color = $('#basic-title [value=color] input').val().trim();
    var frColor = $('#basic-title [value=fr-color] input').val().trim();
    $('.re-header').css({
      'background-color': color,
      'border-color': color,
      'color': frColor
    });
    $('.cmpt').css('border-color', color);
  });

  // 监听标题风格
  $('#re-config').on('change', '#basic-title [value=style] select' , function() {
    var style = $(this).val();
    switch(style) {
      case 'none':
        $('.re-header').hide();
        break;
      case 'outline':
        $('.re-header').attr('class', 're-header hd-outline').slideDown();
        break;
      case 'bottom':
        $('.re-header').attr('class', 're-header hd-bottom').slideDown();
        break;
      case 'standard':
        $('.re-header').attr('class', 're-header').slideDown();
        break;
    }
  });

  // 监听个人信息布局
  $('#re-config').on('change', '#info-config [name=layout] select', function () {
    $('.re-info .row').attr('class', 'row ' + $(this).val());
  });

  // 监听相片风格
  $('#re-config').on('change', '#info-config [value=photo] select', function () {
    $('.re-info .user-photo').attr('class', 'user-photo ' + $(this).val());
  });

  // 监听教育信息模块风格变化
  $('#select-edu-type select').on('change', function () {
    var type = $(this).val();
    $('#edu-config').attr('type', type);
  });

  // 监听组件选择框变化
  $('#re-config').on('change', '[name=select-component] select', function () {
    var component = $(this).val();
    var $dom = $(this).parent().next();
    $dom.find('.input-group').hide();
    if (component == 'line-down') {
      $dom.find('[value=progress], [value=title]').show();
    } else {
      $dom.find('[value=start], [value=end], [value=title], [value=key], [value=details]').show();
    }
  });
});