define(function (require, exports, module) {
  var Utils = require('utils');
  var re = {
    // 提供一个快捷保存信息的接口
    save: function () {
      var config = this.getConfig();
      Utils.setLocalStorage('data', config);
      $('#re-config > div, .js-config-li').fadeOut('fast');
    },

    clear: function () {
      localStorage.clear();
      $('.js-layout').empty(); 
      $('#re-sidebar li[name^=new]:not(:last)').remove();
      $('#re-config').find('.js-config-li').each(function () {
        $(this).removeAttr('sort').find('input, textarea').val('');
        $(this).find('select').each(function () {
          $(this).children('option:first').prop('selected',true).trigger('change');
        });
        $(this).find('.can-add-group').each(function () {
          $(this).children(':gt(0)').remove();
        });
      });
    },

    // 配置取消
    cancel: function (id) {
      var $id = $('#' + id);
      var name = id.slice(0, -7);
      var data = Utils.getLocalStorage('data')[name];
      if (data) {
        this.setCompile(id, data);
      } else {
        $id.removeAttr('sort').find('input, textarea').val('');
        $id.find('select').each(function() {
          $(this).find('option:first').prop('selected', true);
        });
      }
      $('#re-config > div, .js-config-li').fadeOut('fast');
    },

    /**
     * 交换两个re-box的位置
     * @param  {[String]} _this [进行交换的元素]
     * @param  {[String]} other [被交换的元素]
     * @param  {[Boolean]} up   [默认false为上移, 若为true则为下移操作]
     */
    exchangeRebox: function (_this, other, up) {
      var $thisConfig = $('#' + _this + '-config');
      var $thisRebox = $('.re-' + _this);
      var thisHeight = up ? -$thisRebox.height() - 15 : $thisRebox.height() + 15;
      var thisHtml = $thisRebox.html();
      var thisClass = $thisRebox.attr('class');
      var thisSort = $thisConfig.attr('sort');
      var $otherConfig = $('#' + other + '-config');
      var $otherRebox = $('.re-' + other);
      var otherHeight = up ? $otherRebox.height() + 15 : -$otherRebox.height() - 15;

      $thisRebox.css({
        'transform': 'translateY(' + otherHeight + 'px)',
        'transition': 'transform .3s ease'
      });
      $otherRebox.css({
        'transform': 'translateY(' + thisHeight + 'px)',
        'transition': 'transform .3s ease'
      });
      setTimeout(function () {
        $('.js-re-resume .re-box').removeAttr('style');
        $thisRebox.html($otherRebox.html()).attr('class', $otherRebox.attr('class'));
        $otherRebox.html(thisHtml).attr('class', thisClass);
        $thisConfig.attr('sort', $otherConfig.attr('sort'));
        $otherConfig.attr('sort', thisSort);
        $('#re-config').removeClass('exchanging');
      }, 300);
    },

    /**
     * 获取某个模块的简历html代码
     * @param  {[String]} reClass [ClassName]
     * @return {[Object]}         [返回data与html]
     */
    switchResume: function (name, data) {
      var html;
      switch(name) {
        case 'info':
          html = this.setInfoHtml(data);
          break;
        case 'edu':
          html = this.setEduHtml(data);
          break;
        case 'job':
        case 'project':
        default:
          html = this.setProHtml(name, data); 
          break;
      }
      return html;
    },

    /**
     * [配置信息生效函数]
     * @param {[String]} reClass [ClassName]
     * @param {[Object]} data    [对应模块的配置数据]
     * @param {[String]} html    [对应模块的简历Html代码]
     */
    setResume: function (name, data, html) {
      var $dom = $('.re-' + name);
      var $box = $('#layout' + data['select-box']);
      var dom = '<div class="re-box re-' + name + '" box="' + data['select-box'] + '">' + html + '</div>';
      var style = $dom.find('.re-header').attr('style'); // 阻止自定义色调的丢失
      $('#re-sidebar li[name = ' + name + '] span').text(data.header);
      var child = $box.children('.re-box').length;
      var gap = data.sort - child;

      if (gap >= 0) {
        while (--gap >= 0) {
          dom = '<div class="re-box"></div>' + dom;
        }
        $dom.remove();
        $box.append(dom);
      } else {
        $box.children('.re-box').eq(data.sort).remove();
        if (+data.sort === 0) {
          $box.prepend(dom);
        } else {
          $box.children('.re-box').eq(--data.sort).after(dom);
        }
      }
      if (style) $box.find('.re-' + name + ' .re-header').attr('style', style);
    },

    /**
     * [生成“左年份,右内容”的 PubHtml 板块]
     * @param  {[String]} start   [起始年月]
     * @param  {[String]} end     [结束年月]
     * @param  {[Object]} content [具体数据,格式见下方]
     * @return {[String]}         [返回html代码]
     * {  title: // 标题
     *    key:   // 副标题
     *    list:  // 数组 -> 详情列表描述  }
     */
    bulidPubHtml: function (start, end, content) {
      var list = '';
      var year = '';
      var title;
      var key;
      if (content.list) { // 是否分点
        if (content.list.length === 1) {
          list = '<div class="col-xs-12">' + content.list + '</div>';
        } else {
          for (key in content.list) {
            list += '<li>' + content.list[key] + '</li>';
          }
          list = '<ul class="col-xs-12 re-detail">' + list + '</ul>';
        }
      }
      if (start && end) { // 起始年份
        year = '<div class="re-year">' + start + ' - ' + end +'</div>';
      } else if (start || end) {
        year = '<div class="re-year">' + start + end +'</div>';
      }
      if (content.title && content.key) { // 正副标题
        title = '<div class="col-xs-8 re-title">' + content.title + '</div>';
        key = '<div class="col-xs-4">' + content.key + '</div>';
      } else if (content.title || content.key) {
        title = '<div class="col-xs-12 re-title">' + content.title + content.key + '</div>';
        key = '';
      } else {
        title = key = '';
      }
      var html = '<div class="row">' + year +
                    '<div class="re-group"><div class="row">' + title + key + list + '</div></div>' +
                 '</div>';
      return html;
    },

    /**
     * [生成PubHtml板块的完整html代码,“左年份右内容”模板可调用该函数]
     * @param  {[Object]} config  [配置信息]
     * @return {[String]}         [返回html代码]
     */
    setProHtml: function (name, config) {
      var cmpt = config['select-component'];
      var html = this.setHeader(config.header);
      for (var i = 1; i <= config.nums; i++) {
        var key = name + '-group-' + i;
        var content = {
          title: config[key].title,
          key: config[key].key,
          list: config[key].details,
          pro: config[key].progress
        };
        if (cmpt && cmpt != 'text') {
          html += Utils.cmptHtml(cmpt, content);
        } else {
          html += this.bulidPubHtml(config[key].start, config[key].end, content);
        }
      }
      return html;
    },

    /**
     * [新增板块操作]
     * @param {[Number]} name   [内部名字]
     * @param {[Number]} header [外部标题]
     */
    addNewModule: function (name, header) {
      $('#add-module').data('new');
      var html = '<li name="' + name + '"><i class="icon icon-diy"></i><span>' + header + '</span></li>';
      $('#re-sidebar li:last').before(html);
      html = '<li class="js-config-li" id="' + name + '-config" nums="1" box="One"></li>';
      $('#re-config .body').append(html);
      this.compileJSON(name, $('#add-module').data('new'));
      $('#' + name + '-config').find('[name=new-group-1]').attr('name', name + '-group-1');
    },

    /**
     * 获取当前模块在简历中的位置
     * @param  {[String]} reClass   [模块独有类名]
     * @param  {[String]} layoutBox [模块所属盒子, 即One||Two]
     * @return {[Number]}           [返回在该盒子中的位置]
     */
    getSort: function (reClass, box) {
      var $dom = $('#layout' + box);
      var sort = $dom.find('.re-' + reClass).index();
      return sort;
    },

    /**
     * 获取所有配置信息
     * @return {[Object]} [配置数据]
     */
    getConfig: function () {
      var data = {};
      $('.js-re-resume .re-box').each(function (){
        if ($(this).attr('class') == 're-box') return; // 排除空结点
        var name = $(this).attr('class').substr(10);
        data[name] = re.getCompile(name);
      });
      data.basic = re.getCompile('basic'); // basic 必须置于最后
      return data;    
    },

    /**
     * [写入配置信息,并生成简历]
     * @param {[Object]} userConfig [配置数据]
     */
    setConfig: function (data) {
      for (var name in data) {
        var $selecter = $('#re-sidebar li[name =' + name + ']');
        if ($selecter.length === 0) {
          this.addNewModule(name, data[name].header);
        }
        this.setCompile(name + '-config', data[name]);
        if (name == 'basic') {
          $('#basic-config').find('input, select').trigger('change');
          continue; // 不需进行生成工作
        }
        var html = this.switchResume(name, data[name]);
        this.setResume(name, data[name], html);
      }
    },

    /**
     * 编译JSON为HTML并生成
     * @param  {[String]} name [例如info/edu等]
     * @param  {[Object]} data [JSON数据]
     */
    compileJSON: function (name, data) {
      for(var key in data) {
        var html = this.compileToHtml(data[key]);
        $('#re-config').find('#' + name + '-config').append(html);
      }
    },

    // 依赖于compileJSON
    compileToHtml: function (data) {
      var html;
      var id = data.id ? ' id="' + data.id + '"' : '';
      var hidden = data.hidden ? ' hidden' : '';
      var canAdd = data.canAdd ? '-1"> <i class="icon icon-add can-add" title="添加"></i> <i class="icon icon-subtract can-remove" title="删除"></i>' : '">';
      data.type = data.type || 'text';
      switch(data.type) {
        case 'select':
          html = this.compileToSelect(data.option);
          break;
        case 'group':
          html = this.compileToGroup(data.option);
          break;
        case 'textarea':
          html = this.compileToTextarea(data);
          break;
        default:
          html = this.compileToInput(data);
          break;
      }
      html = '<div class="form-group"' + id + hidden + ' name="' + data.name + canAdd +
               '<label class="config-label">' + data.label + '：</label>' + html +
             '</div>';
      if (data.canAdd) html = '<div class="can-add-group">' + html + '</div>'; // 方便css控制
      return html;
    },

    // 选择框
    compileToSelect: function (data) {
      var html = '<select class="form-control">';
      for (var key in data) {
        var option = data[key];     
        html += '<option value="' + option.value + '">' + option.label + '</option>';
      }
      html += '</select>';
      return html;
    },

    // 单行输入框
    compileToInput: function (data) {
      var html = '';
      data.type = data.type ? data.type : 'text';
      if (data.type == 'checkbox' || data.type == 'radio') {
        html += this.compileToBox(data);
      } else {
        var min = data.min ? ' min="' + data.min + '"' : '';
        var max = data.max ? ' max="' + data.max + '"' : '';
        var val = data.default ? ' value="' + data.default + '"' : '';
        html += '<input class="form-control" type="' + data.type + '"placeHolder="' + data.placeHolder + '"' + val + min + max + '>';
      }
      return html;
    },

    // 单/复选框
    compileToBox: function (data) {
      var html = '';
      for (var key in data.option) {
        var val = data.option[key];
        var inline = data.block ? '' : '-inline';
        var checked = val.checked ? 'checked' : '';
        html += '<label class="' + data.type + inline + '" value="' + val.value +'">' +
                  '<input class="form-control" type="' + data.type + '"' + checked + '>'+
                  '<span>' + val.label + '</span>' +
                '</label>';
      }
      return html;
    },

    // 多行输入框
    compileToTextarea: function (data) {
      var html = '<textarea class="form-control" rows="3" placeHolder="' + data.placeHolder + '"' + '></textarea>';
      return html;
    },

    // 组合框
    compileToGroup: function (data) {
      var html = '';
      for (var key in data) {
        var option = data[key];
        var content;
        if (option.type == 'select') {
          content = this.compileToSelect(option.option);
        } else if (option.type == 'textarea') {
          content = this.compileToTextarea(option);
        } else {
          content = this.compileToInput(option);
        }
        html += '<div class="input-group"' + ' value="' + option.value + '">' +
                  '<div class="input-group-addon">' + option.label + '</div>' + content +
                '</div>';
      }
      return html;
    },

    /**
     * [获取配置信息]
     * @param  {[String]} name [name值,例如job,edu]
     * @return {[Object]}      [返回配置信息]
     */
    getCompile: function (name) {
      var data = {
        sort: $('#'+ name + '-config').attr('sort'),
        nums: $('#'+ name + '-config .can-add-group').children().length,
      };
      $('#'+ name + '-config .form-group').each(function () {
        var name = $(this).attr('name');
        var value = $(this).children('[value]').attr('value');
        if (!value) {
          var $textarea = $(this).children('textarea');
          data[name] = $textarea.length > 0 ? $textarea.val().trim().split('\n') : $(this).children('select, input').val().trim();
        } else {
          data[name] = {};
          $(this).children('[value]').each(function () {
            var value = $(this).attr('value');
            if ($(this).get(0).tagName == 'LABEL') {
              data[name][value] = $(this).children('input').prop('checked');
            } else if ($(this).children('textarea').length > 0) {
              data[name][value] = $(this).children('textarea').val().trim().split('\n');
            } else {
              data[name][value] = $(this).children('select, input').val().trim();
            }       
          });
        }
      });
      if (name != 'basic' && !data['select-box']) data['select-box'] = 'One'; // 盒子选择框隐藏时
      return data;
    },

    /**
     * [设置配置信息]
     * @param  {[Object]} config [配置信息]
     * @param  {[String]} id     [当前配置项的li标签id值]
     */
    setCompile: function (id, data) {
      var $config = $('#' + id);
      $config.attr({ 'sort': data.sort, 'box': data['select-box'] });
      for (var key in data) {
        var $selector = $config.find('.form-group[name=' + key + ']');
        if (!$selector.length) {
          var index = key.lastIndexOf('-'); // 查找'-'位置
          var prevName = key.slice(0, index) + '-1';
          $config.find('.form-group[name=' + prevName + '] .can-add').trigger('click');
        }
        if (typeof(data[key]) !== 'object') {     
          var sum = $selector.children('textarea').length > 0 ? data[key].join('\n') : data[key];
          $selector.children('select, input, textarea').val(sum).trigger('change');
          // if (key == 'select-component') $selector.children('select').trigger('change');
        } else {
          this.setCompileIn($config, data[key], key);
        }
      }
    },

    // 依赖于setCompile
    setCompileIn: function ($config, data, key) {
      for (var option in data) {
        var value = data[option];
        var $dom = $config.find('.form-group[name=' + key + '] [value=' + option + ']');
        if ($dom.get(0).tagName == 'LABEL') {
          $dom.children('input').prop('checked', value).trigger('change');
        } else if ($dom.children('textarea').length > 0) {
          $dom.children('textarea').val(value.join('\n')).trigger('change');
        } else {
          $dom.children('select, input').val(value).trigger('change');
        }
      }
    },

    // 布局更改重设函数
    changeLayout: function (name, nums) {
      var widthOne;
      var widthTwo;
      var heightOne;
      var heightTwo;
      switch(name) {
        case '0':
          widthOne = widthTwo = 100 + '%';
          heightOne = heightTwo = 'auto';
          break;
        case '1':
          widthOne = 33.33 + '%';
          widthTwo = 66.66 + '%';
          heightOne = 100 + '%';
          heightTwo = 100 + '%';
          break;
        case '2':
          widthOne = 66.66 + '%';
          widthTwo = 33.33 + '%';
          heightOne = 100 + '%';
          heightTwo = 100 + '%';
          break;
      }
      $('#layoutOne').css({
        'width': widthOne,
        'height': heightOne
      });
      $('#layoutTwo').css({
        'width': widthTwo,
        'height': heightTwo
      });
    },

    // 生成个人信息模块HTML代码
    setInfoHtml: function (config) {
      var label = [];
      var info = config.data;
      $('#info-config .input-group-addon:gt(0)').each(function () { // gt(0) -> 姓名设定为无需标签
        var me = $(this); 
        var _label = me.next().val() ? '<label>' + me.text() + '</label><span>：</span>' : '';
        label.push(_label);
      });
      var html = '<div class="row">' + 
                    '<div class="col-xs-6">' +
                      '<div class="user-photo ' + info.photo + '"><input type="file"><img src=""></div>' +
                    '</div>' +
                    '<div class="col-xs-6">' +
                      '<div class="user-name">' + info.name + '</div>' +
                      '<div class="user-intension">' + label[0] + info.intension + '</div>' +
                      '<div class="user-phone">' + label[1] + info.phone + '</div>' +
                      '<div class="user-email">' + label[2] + info.email + '</div>' +
                    '</div>' +
                  '</div>';
      return html;
    },

    // 生成教育信息模块HTML代码
    setEduHtml: function (data) {
      var label = [[], [], []];
      var sum = 1;
      var html = this.setHeader(data.header);
      $('#edu-config [name*=edu-group]').each(function () {    
        $(this).find('.input-group-addon:not(:last)').each(function () {
          var _label = $(this).next().val() ? '<label>' + $(this).text() + '</label>：' : '';
          label[sum].push(_label);
        });
        sum++;
      });
      if (data.type == 'standard') {
        for (var i = 1; i < sum; i++) {
          var details = data['edu-group-' + i].details.join(';'); // 分点在简历中将以分号隔开
          var yearLabel = label[i][5] ? '<label>毕业</label>：' : '';
          html += '<div class="row">' +
                    '<div class="col-xs-6"><div class="user-university">' + label[i][0] + data['edu-group-' + i].university + '</div></div>' +
                    '<div class="col-xs-6"><div class="user-major">' + label[i][1] + data['edu-group-' + i].major + '</div></div>' +
                    '<div class="col-xs-6"><div class="user-degree">' + label[i][2] + data['edu-group-' + i].degree + '</div></div>' +
                    '<div class="col-xs-6"><div class="user-gpa">' + label[i][3] + data['edu-group-' + i].gpa + '</div></div>' +
                    '<div class="col-xs-6"><div class="user-end">' + yearLabel + data['edu-group-' + i].end + '</div></div>' +
                    '<div class="col-xs-6"><div class="user-details">' + details + '</div></div>' +
                  '</div>';
        }
      } else if (data.type == 'brief') {
        for (var i = 1; i < sum; i++) {
          var content = {
            title: data['edu-group-' + i].university,
            key: data['edu-group-' + i].major,
            list: ''
          };
          html += this.bulidPubHtml(data['edu-group-' + i].start, data['edu-group-' + i].end, content);
        }
      }
      return html;
    },

    // 生成标题栏
    setHeader: function (header) {
      var style = $('#basic-title [value=style] select').val();
      return '<div class="re-header hd-' + style + '"><span>' + header + '</span></div>';
    },

    setLocalData: function () {
      var data = Utils.getLocalStorage('data');
      if (!data) {

      } else {
        this.setConfig(data);
      }
    }
  };
  module.exports = re;
});